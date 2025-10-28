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
};

export default function DailyTasks() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);

  // 🧩 Lấy user hiện tại
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  // 🧩 Lấy danh sách nhiệm vụ (tạm mock data cho dễ test)
  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoading(true);

      // 🧠 Nếu chưa có bảng `tasks` hoặc `user_tasks` thì dùng dữ liệu mẫu
      const mockTasks: Task[] = [
        { id: "1", name: "Điểm danh hôm nay", description: "Đăng nhập & bấm điểm danh", reward_points: 10, completed: true, reward_claimed: false },
        { id: "2", name: "Đọc truyện 30 phút", description: "Đọc tích lũy ≥ 30 phút", reward_points: 30, completed: true, reward_claimed: true },
        { id: "3", name: "Bình luận 1 chương", description: "Viết ít nhất 1 bình luận", reward_points: 10, completed: false, reward_claimed: false },
        { id: "4", name: "Chia sẻ 1 truyện", description: "Chia sẻ link truyện lên MXH", reward_points: 20, completed: true, reward_claimed: false },
      ];

      // 🧾 Load ví hiện có
      const { data: balanceRow } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      setBalance(balanceRow?.balance ?? 0);
      setTasks(mockTasks);
      setLoading(false);
    })();
  }, [userId]);

  // 🪙 Hàm bấm “Nhận thưởng”
  async function claimReward(taskId: string) {
    if (!userId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // B1: kiểm tra ví
    const { data: balanceRow } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    // B2: nếu chưa có ví → tạo mới
    if (!balanceRow) {
      await supabase.from("user_balances").insert([
        { user_id: userId, balance: task.reward_points },
      ]);
      setBalance(task.reward_points);
    } else {
      // B3: nếu có ví → cộng thêm xu
      const newBalance = (balanceRow.balance ?? 0) + task.reward_points;
      await supabase
        .from("user_balances")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      setBalance(newBalance);
    }

    // B4: ghi log giao dịch
    await supabase.from("user_transactions").insert([
      {
        user_id: userId,
        task_id: taskId,
        amount: task.reward_points,
        type: "reward",
      },
    ]);

    // B5: đánh dấu đã nhận
    await supabase
      .from("user_tasks")
      .update({
        reward_claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("task_id", taskId);

    // B6: cập nhật UI
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, reward_claimed: true } : t))
    );

    alert(`🎉 Nhận thành công ${task.reward_points} xu!`);
  }

  if (loading) {
    return (
      <AuthorLayout>
        <div className="text-center text-muted-foreground py-10">
          Đang tải nhiệm vụ...
        </div>
      </AuthorLayout>
    );
  }

  return (
    <AuthorLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" /> Nhiệm vụ hôm nay 🎯
        </h1>
        <div className="text-base font-semibold text-primary">
          💰 Ví: {balance.toLocaleString("vi-VN")} xu
        </div>
      </div>

      {/* Danh sách nhiệm vụ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`transition-all border ${
              task.reward_claimed
                ? "border-green-400 bg-green-50"
                : task.completed
                ? "border-yellow-300 bg-yellow-50"
                : ""
            }`}
          >
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">{task.name}</CardTitle>
              <span className="text-sm text-primary font-medium">
                +{task.reward_points} xu
              </span>
            </CardHeader>

            <CardContent className="text-sm text-muted-foreground flex justify-between items-center">
              <p>{task.description}</p>

              {task.reward_claimed ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Đã nhận
                </span>
              ) : task.completed ? (
                <Button
                  size="sm"
                  onClick={() => claimReward(task.id)}
                  className="text-white bg-primary hover:bg-primary/80"
                >
                  Nhận thưởng
                </Button>
              ) : (
                <span className="text-muted-foreground text-xs">
                  Chưa hoàn thành
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AuthorLayout>
  );
}
