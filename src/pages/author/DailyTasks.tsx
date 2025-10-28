import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import AuthorLayout from "./AuthorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Gift, CheckCircle } from "lucide-react";

type Task = {
  id: string; // uuid từ bảng tasks
  name: string;
  description: string;
  reward_points: number;
  completed: boolean;
  reward_claimed: boolean;
  completed_at?: string | null;
};

export default function DailyTasks() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // 🧠 1️⃣ Lấy user hiện tại
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  // ⚙️ 2️⃣ Load balance + nhiệm vụ khi có userId
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);

      // --- Fetch balance ---
      const { data: balanceRow, error: balanceErr } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (balanceErr) console.error("⚠️ Lỗi khi lấy ví:", balanceErr);
      if (balanceRow) setBalance(balanceRow.balance);

      // --- Fetch danh sách task gốc từ bảng tasks ---
      const { data: baseTasks, error: taskErr } = await supabase
        .from("tasks")
        .select("id, name, description, reward_points");

      if (taskErr) {
        console.error("⚠️ Lỗi khi lấy tasks:", taskErr);
        setLoading(false);
        return;
      }

      // --- Fetch user_tasks của user ---
      const { data: userTasks, error: userTaskErr } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", userId);

      if (userTaskErr) console.error("⚠️ Lỗi khi lấy user_tasks:", userTaskErr);

      const today = new Date().toDateString();

      // Gộp 2 bảng lại (baseTasks + userTasks)
      const merged: Task[] =
        baseTasks?.map((t) => {
          const ut = userTasks?.find((x) => x.task_id === t.id);
          const completedToday =
            ut?.completed_at &&
            new Date(ut.completed_at).toDateString() === today;

          return {
            id: t.id,
            name: t.name,
            description: t.description,
            reward_points: t.reward_points,
            completed: completedToday,
            reward_claimed: !!ut?.reward_claimed,
            completed_at: ut?.completed_at ?? null,
          };
        }) ?? [];

      setTasks(merged);
      setLoading(false);
    })();
  }, [userId]);

  // 💰 3️⃣ Cộng xu an toàn
  async function addCoins(taskId: string, amount: number) {
    if (!userId) return;

    const { data: balanceRow } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    const currentBalance = balanceRow?.balance ?? 0;
    const newBalance = currentBalance + amount;

    const { error: balanceErr } = await supabase
      .from("user_balances")
      .upsert(
        { user_id: userId, balance: newBalance, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (balanceErr) console.error("⚠️ Lỗi khi cập nhật balance:", balanceErr);

    const { error: txErr } = await supabase.from("user_transactions").insert([
      { user_id: userId, task_id: taskId, amount, type: "reward", note: "Thưởng nhiệm vụ hàng ngày" },
    ]);

    if (txErr) console.error("⚠️ Lỗi khi ghi user_transactions:", txErr);

    setBalance(newBalance);
  }

  // 🎯 4️⃣ Xử lý khi user bấm “Điểm danh”
  async function handleCheckIn(task: Task) {
    if (!userId) return;

    const today = new Date().toISOString().slice(0, 10);
    console.log("✅ Check-in started for task:", task.id, "user:", userId);

    // Kiểm tra xem user đã hoàn thành task này hôm nay chưa
    const { data: existing, error: checkErr } = await supabase
      .from("user_tasks")
      .select("completed_at")
      .eq("user_id", userId)
      .eq("task_id", task.id)
      .maybeSingle();

    if (checkErr) console.error("⚠️ Lỗi khi kiểm tra task:", checkErr);

    if (existing?.completed_at && existing.completed_at.slice(0, 10) === today) {
      alert("✅ Hôm nay bạn đã hoàn thành nhiệm vụ này rồi!");
      return;
    }

    // ✅ Ghi task + cộng xu
    const { error: upsertErr } = await supabase.from("user_tasks").upsert({
      user_id: userId,
      task_id: task.id,
      completed: true,
      reward_claimed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) {
      console.error("❌ Lỗi upsert user_tasks:", upsertErr);
      alert("Lỗi ghi nhiệm vụ, xem console!");
      return;
    }

    await addCoins(task.id, task.reward_points);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, completed: true, reward_claimed: true } : t
      )
    );

    alert(`🎉 Nhiệm vụ hoàn thành! +${task.reward_points} xu`);
  }

  // 🕒 5️⃣ Loading state
  if (loading) {
    return (
      <AuthorLayout>
        <div className="text-center py-10 text-muted-foreground">
          Đang tải nhiệm vụ...
        </div>
      </AuthorLayout>
    );
  }

  // 🎁 6️⃣ Render giao diện
  return (
    <AuthorLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" /> Nhiệm vụ hôm nay
        </h1>
        <div className="text-base font-semibold text-amber-600">
          💰 Ví: {balance.toLocaleString("vi-VN")} xu
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`transition border ${
              task.reward_claimed ? "border-green-400 bg-green-50" : "border-gray-200"
            }`}
          >
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-lg">{task.name}</CardTitle>
              <span className="text-sm font-medium text-primary">
                +{task.reward_points} xu
              </span>
            </CardHeader>

            <CardContent className="text-sm text-muted-foreground flex justify-between items-center">
              <p>{task.description}</p>

              {task.reward_claimed ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Đã nhận
                </span>
              ) : (
                <Button size="sm" onClick={() => handleCheckIn(task)}>
                  Hoàn thành
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AuthorLayout>
  );
}
