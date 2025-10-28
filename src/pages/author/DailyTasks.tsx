import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "./ui/button";
import { CheckCircle, CalendarDays } from "lucide-react";

export function DailyCheckInWidget() {
  const [userId, setUserId] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // 🔍 Tìm task "Điểm danh hôm nay"
      const { data: taskRow } = await supabase
        .from("tasks")
        .select("id")
        .eq("name", "Điểm danh hôm nay")
        .maybeSingle();

      if (!taskRow) {
        setLoading(false);
        return;
      }

      const { data: userTask } = await supabase
        .from("user_tasks")
        .select("completed_at")
        .eq("user_id", user.id)
        .eq("task_id", taskRow.id)
        .maybeSingle();

      const today = new Date().toISOString().slice(0, 10);
      const completedToday = userTask?.completed_at?.slice(0, 10) === today;
      setCheckedIn(completedToday);
      setLoading(false);
    });
  }, []);

  async function handleCheckIn() {
    if (!userId) {
      alert("Vui lòng đăng nhập để điểm danh!");
      return;
    }

    // 🔍 Lấy task id
    const { data: taskRow } = await supabase
      .from("tasks")
      .select("id, reward_points")
      .eq("name", "Điểm danh hôm nay")
      .maybeSingle();

    if (!taskRow) {
      alert("Không tìm thấy nhiệm vụ điểm danh hôm nay!");
      return;
    }

    // ⚙️ Kiểm tra đã điểm danh chưa
    const { data: existing } = await supabase
      .from("user_tasks")
      .select("completed_at, reward_claimed")
      .eq("user_id", userId)
      .eq("task_id", taskRow.id)
      .maybeSingle();

    const today = new Date().toISOString().slice(0, 10);
    if (existing?.completed_at?.slice(0, 10) === today) {
      alert("✅ Hôm nay bạn đã điểm danh rồi!");
      setCheckedIn(true);
      return;
    }

    // 🧾 Cập nhật user_tasks
    await supabase.from("user_tasks").upsert({
      user_id: userId,
      task_id: taskRow.id,
      completed: true,
      reward_claimed: false,
      completed_at: new Date().toISOString(),
    });

    setCheckedIn(true);
    alert("🎉 Điểm danh thành công! Vào khu Nhiệm vụ để nhận thưởng!");
  }

  if (loading) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-white shadow-md rounded-lg p-4 border w-[260px] flex flex-col items-center gap-2 z-50">
      <div className="flex items-center gap-2 font-semibold text-primary">
        <CalendarDays className="w-4 h-4" /> Điểm danh hôm nay
      </div>

      {checkedIn ? (
        <div className="flex items-center gap-2 text-green-600 font-medium">
          <CheckCircle className="w-4 h-4" /> Đã điểm danh
        </div>
      ) : (
        <Button
          onClick={handleCheckIn}
          className="bg-primary text-white hover:bg-primary/80 mt-1"
        >
          Điểm danh ngay
        </Button>
      )}
    </div>
  );
}
