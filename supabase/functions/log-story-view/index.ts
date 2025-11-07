import { serve } from "https://deno.land/std@1.372.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { story_id } = await req.json();
    const ip = req.headers.get("x-real-ip") ||
               req.headers.get("x-forwarded-for") ||
               "unknown";

    // 1️⃣ Kiểm tra nếu đã có log trong vòng 6 tiếng gần nhất
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const { data: recentLog, error: checkError } = await supabase
      .from("story_view_logs")
      .select("id, created_at")
      .eq("story_id", story_id)
      .eq("ip_address", ip)
      .gte("created_at", sixHoursAgo)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!recentLog) {
      // 2️⃣ Ghi log mới
      await supabase.from("story_view_logs").insert({
        story_id,
        ip_address: ip,
        user_agent: req.headers.get("user-agent") || "unknown",
      });

      // 3️⃣ Gọi RPC cộng view vào bảng stories
      await supabase.rpc("increment_story_view", { story_id });
    }

    return new Response(
      JSON.stringify({ ok: true, viewed: !recentLog }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
