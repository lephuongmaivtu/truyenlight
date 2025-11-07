import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { story_id } = await req.json();
    if (!story_id) {
      return new Response(JSON.stringify({ error: "story_id required" }), { status: 400 });
    }

    const ip =
      req.headers.get("x-real-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "0.0.0.0";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user/IP viewed within 6h
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("story_view_logs")
      .select("*", { count: "exact", head: true })
      .eq("story_id", story_id)
      .eq("ip_address", ip)
      .gte("created_at", sixHoursAgo);

    if (!count || count === 0) {
      await supabase.from("story_view_logs").insert({
        story_id,
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    // Count total views
    const { count: totalViews } = await supabase
      .from("story_view_logs")
      .select("*", { count: "exact", head: true })
      .eq("story_id", story_id);

    return new Response(
      JSON.stringify({ ok: true, views: totalViews ?? 0 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
