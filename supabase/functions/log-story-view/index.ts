import { serve } from "https://deno.land/std@1.372.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // ✅ CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }

  try {
    const { story_id } = await req.json();
    if (!story_id) throw new Error("Missing story_id");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ✅ Lấy IP thực tế (ưu tiên nhiều header)
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || crypto.randomUUID(); // fallback để mỗi client unique 1 lần deploy

    const userAgent = req.headers.get("user-agent") || "unknown";

    // ✅ Check IP truy cập trong 6 tiếng qua
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const { data: recentLog, error: checkError } = await supabase
      .from("story_view_logs")
      .select("id")
      .eq("story_id", story_id)
      .eq("ip_address", ip)
      .gte("created_at", sixHoursAgo)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!recentLog) {
      // 🔹 Ghi log mới
      await supabase.from("story_view_logs").insert({
        story_id,
        ip_address: ip,
        user_agent: userAgent,
      });

      // 🔹 Cộng view
      await supabase.rpc("increment_story_view", { story_id });
    }

    // ✅ Lấy lại view mới nhất
    const { data: storyRow } = await supabase
      .from("stories")
      .select("views")
      .eq("id", story_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({ ok: true, viewed: !recentLog, views: storyRow?.views ?? 0 }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
