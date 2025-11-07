import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔹 Lấy biến môi trường (đặt trong Supabase > Secrets)
const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

// 🔹 Tạo client với quyền service
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ⏱ THỜI GIAN CACHE VIEW (6 tiếng)
const VIEW_COOLDOWN_HOURS = 6;

// 📦 Hàm chính
serve(async (req) => {
  try {
    const body = await req.json();
    const { story_id, user_id, ip_address, user_agent } = body;

    if (!story_id) {
      return new Response(JSON.stringify({ error: "Thiếu story_id" }), { status: 400 });
    }

    // 🔍 Xác định IP (nếu client không gửi)
    let ip = ip_address;
    if (!ip) {
      ip = req.headers.get("x-real-ip") ||
           req.headers.get("x-forwarded-for")?.split(",")[0] ||
           "unknown";
    }

    // 🔍 Kiểm tra xem trong 6 tiếng qua IP/user_id này đã xem chưa
    const { data: recent, error: checkErr } = await supabase
      .from("story_view_logs")
      .select("id, created_at")
      .eq("story_id", story_id)
      .or(`ip_address.eq.${ip},user_id.eq.${user_id ?? "null"}`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (checkErr) throw checkErr;

    const now = new Date();
    if (recent && recent.length > 0) {
      const last = new Date(recent[0].created_at);
      const diffHrs = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
      if (diffHrs < VIEW_COOLDOWN_HOURS) {
        // ❌ Trong vòng 6 tiếng, không tăng view
        return new Response(JSON.stringify({ ok: false, reason: "recent_view" }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // ✅ Ghi log mới
    const { error: insertErr } = await supabase.from("story_view_logs").insert({
      story_id,
      user_id: user_id ?? null,
      ip_address: ip,
      user_agent: user_agent ?? null,
      created_at: now.toISOString(),
    });
    if (insertErr) throw insertErr;

    // ✅ Tăng lượt view trong bảng stories
    const { error: updateErr } = await supabase.rpc("increment_story_views", { p_story_id: story_id });
    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ ok: true, views: "+1" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("❌ Lỗi log view:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
