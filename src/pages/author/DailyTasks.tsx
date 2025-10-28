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
  completed_at?: string;
};

export default function DailyTasks() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // 🧠 Lấy user hiện tại
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  // 🧩 Lấy danh sách nhiệm vụ & ví
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);

      // ✅ Lấy nhiệm vụ, nếu bảng không có hoặc lỗi thì fallback sang default
      let baseTasks: any[] = [];
      const { data: dbTasks, error: taskErr } = await supabase
        .from("tasks")
        .select("id, name, description, reward_points");

      if (taskErr || !dbTasks) {
        console.warn("⚠️ Không lấy được dữ liệu từ bảng tasks, dùng mặc định");
        baseTasks = [
          { id: "1", name: "Điểm danh hôm nay", description: "Đăng nhập & bấm điểm danh", reward_points: 10 },
          { id: "2", name: "Đọc truyện 30 phút", description: "Đọc tích lũy ≥ 30 phút", reward_points: 30 },
          { id: "3", name: "Bình luận 1 chương", description: "Viết ít nhất 1 bình luận hợp lệ", reward_points: 10 },
        ];
      } else {
        // lọc bỏ nhiệm vụ chia sẻ link nếu có
        baseTasks = dbTasks.filter((t) => t.name !== "Chia sẻ 1 truyện");
      }

      // 🧾 Lấy ví
      const { data: balanceRow } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      setBalance(balanceRow?.balance ?? 0);

      // 🧾 Lấy trạng thái nhiệm vụ user
      const { data: userTaskRows } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", userId);

      const merged: Task[] = baseTasks.map((t) => {
        const ut = userTaskRows?.find((x) => x.task_id === t.id);
        return {
          id: t.id,
          name: t.name,
          description: t.description,
          reward_points: t.reward_points,
          completed: ut?.completed ?? false,
          reward_claimed: ut?.reward_claimed ?? false,
          completed_at: ut?.completed_at ?? null,
        };
      });

      setTasks(merged);
      setLoading(false);
    })();
  }, [userId]);

  // 🪙 Nhận thưởng
  async function claimReward(task: Task) {
    if (!userId) return;

    // Check lại tránh bug nhận nhiều lần
    const { data: existing } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_id", task.id)
      .maybeSingle();

    if (existing?.reward_claimed) {
      alert("⚠️ Bạn đã nhận thưởng nhiệm vụ này rồi!");
      return;
    }

    const { data: balanceRow } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    const newBalance = (balanceRow?.balance ?? 0) + task.reward_points;
    await supabase
      .from("user_balances")
      .upsert({
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString(),
      });

    await supabase
      .from("user_tasks")
      .upsert({
        user_id: userId,
        task_id: task.id,
        completed: true,
        reward_claimed: true,
        claimed_at: new Date().toISOString(),
      });

    await supabase.from("user_transactions").insert([
      { user_id: userId, task_id: task.id, amount: task.reward_points, type: "reward" },
    ]);

    setBalance(newBalance);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, reward_claimed: true } : t)));
    alert(`🎉 Nhận thành công ${task.reward_points} xu!`);
  }

  // 🕓 Điểm danh hôm nay
  async function checkInToday() {
    if (!userId) return;
    const task = tasks.find((t) => t.name === "Điểm danh hôm nay");
    if (!task) return;

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_id", task.id)
      .maybeSingle();

    if (existing?.completed_at?.slice(0, 10) === today) {
      alert("✅ Hôm nay bạn đã điểm danh rồi!");
      return;
    }

    await supabase
      .from("user_tasks")
      .upsert({
        user_id: userId,
        task_id: task.id,
        completed: true,
        reward_claimed: false,
        completed_at: new Date().toISOString(),
      });

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, completed: true, reward_claimed: false } : t
      )
    );

    alert("🎯 Điểm danh thành công! Giờ bạn có thể nhận thưởng!");
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

      {tasks.length === 0 ? (
        <div className="text-center text-muted-foreground">Không có nhiệm vụ nào.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className={`transition border ${
                task.reward_claimed
                  ? "border-green-400 bg-green-50"
                  : task.completed
                  ? "border-yellow-300 bg-yellow-50"
                  : ""
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
                ) : task.completed ? (
                  <Button size="sm" onClick={() => claimReward(task)}>
                    Nhận thưởng
                  </Button>
                ) : task.name === "Điểm danh hôm nay" ? (
                  <Button size="sm" onClick={checkInToday}>
                    Điểm danh
                  </Button>
                ) : (
                  <span className="text-xs">Chưa hoàn thành</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AuthorLayout>
  );
}
