import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import AuthorLayout from "./AuthorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Gift, CheckCircle } from "lucide-react";

type Task = {
  id: string;
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);

      const baseTasks = [
        { id: "1", name: "Điểm danh hôm nay", description: "Đăng nhập & bấm điểm danh", reward_points: 10 },
        { id: "2", name: "Đọc truyện 30 phút", description: "Đọc tích lũy ≥ 30 phút", reward_points: 30 },
        { id: "3", name: "Bình luận 1 chương", description: "Viết ít nhất 1 bình luận hợp lệ", reward_points: 10 },
      ];

      const { data: balanceRow } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      setBalance(balanceRow?.balance ?? 0);

      const { data: userTaskRows } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", userId);

      const today = new Date().toISOString().slice(0, 10);

      const merged: Task[] = baseTasks.map((t) => {
        const ut = userTaskRows?.find((x) => x.task_id === t.id);
        const completedToday =
          ut?.completed_at && ut.completed_at.slice(0, 10) === today;

        return {
          id: t.id,
          name: t.name,
          description: t.description,
          reward_points: t.reward_points,
          completed: completedToday,
          reward_claimed: completedToday,
          completed_at: ut?.completed_at ?? null,
        };
      });

      setTasks(merged);
      setLoading(false);
    })();
  }, [userId]);

  async function addCoins(taskId: string, amount: number) {
    const { data: balanceRow } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    const newBalance = (balanceRow?.balance ?? 0) + amount;

    await supabase.from("user_balances").upsert({
      user_id: userId,
      balance: newBalance,
      updated_at: new Date().toISOString(),
    });

    await supabase.from("user_transactions").insert([
      { user_id: userId, task_id: taskId, amount, type: "reward" },
    ]);

    setBalance(newBalance);
  }

  // ✅ Logic điểm danh — chỉ cộng xu 1 lần/ngày
  async function handleCheckIn(task: Task) {
    if (!userId) return;

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase
      .from("user_tasks")
      .select("completed_at")
      .eq("user_id", userId)
      .eq("task_id", task.id)
      .maybeSingle();

    if (existing?.completed_at && existing.completed_at.slice(0, 10) === today) {
      alert("✅ Hôm nay bạn đã điểm danh rồi!");
      return;
    }

    // Ghi nhận + cộng xu
    await supabase.from("user_tasks").upsert({
      user_id: userId,
      task_id: task.id,
      completed: true,
      reward_claimed: true,
      completed_at: new Date().toISOString(),
    });

    await addCoins(task.id, task.reward_points);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, completed: true, reward_claimed: true, completed_at: new Date().toISOString() }
          : t
      )
    );

    alert(`🎉 Điểm danh thành công +${task.reward_points} xu!`);
  }

  if (loading) {
    return (
      <AuthorLayout>
        <div className="text-center py-10 text-muted-foreground">
          Đang tải nhiệm vụ...
        </div>
      </AuthorLayout>
    );
  }

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
              task.reward_claimed
                ? "border-green-400 bg-green-50"
                : "border-gray-200"
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
                  Điểm danh
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AuthorLayout>
  );
}
