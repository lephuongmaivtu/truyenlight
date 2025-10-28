// src/pages/author/DailyTasks.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import AuthorLayout from "./AuthorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { CheckCircle, Gift } from "lucide-react";

type Task = {
  id: string;
  name: string;
  description: string;
  reward_points: number;
  completed: boolean;
  reward_claimed: boolean;
};

export default function DailyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  // 🧩 Lấy danh sách nhiệm vụ (có cờ completed + reward_claimed)
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);

      // Nếu m đã có bảng user_tasks thì join thật, còn chưa có thì mock
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("active", true);

      if (error || !data) {
        setTasks([
          { id: "1", name: "Điểm danh hôm nay", description: "Đăng nhập & bấm điểm danh", reward_points: 10, completed: true, reward_claimed: false },
          { id: "2", name: "Đọc truyện 30 phút", description: "Đọc tích lũy ≥ 30 phút", reward_points: 30, completed: true, reward_claimed: true },
          { id: "3", name: "Bình luận 1 chương", description: "Viết ít nhất 1 bình luận", reward_points: 10, completed: false, reward_claimed: false },
          { id: "4", name: "Chia sẻ 1 truyện", description: "Chia sẻ link truyện lên MXH", reward_points: 20, completed: true, reward_claimed: false },
        ]);
      } else {
        // Nếu m có bảng user_tasks thì gắn 2 flag này theo user
        setTasks(data as Task[]);
      }

      setLoading(false);
    })();
  }, [userId]);

  // 🪙 Hàm bấm “Nhận thưởng”
     async function claimReward(taskId: string) {
      if (!userId) return;
    
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
    
      // B1: Kiểm tra ví user đã có chưa
      const { data: balanceRow } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
    
      // B2: Nếu chưa có -> tạo ví mới
      if (!balanceRow) {
        await supabase.from("user_balances").insert([
          { user_id: userId, balance: task.reward_points },
        ]);
      } else {
        // B3: Nếu đã có -> cộng xu
        await supabase
          .from("user_balances")
          .update({
            balance: (balanceRow.balance ?? 0) + task.reward_points,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    
      // B4: Ghi log giao dịch
      await supabase.from("user_transactions").insert([
        {
          user_id: userId,
          task_id: taskId,
          amount: task.reward_points,
          type: "reward",
        },
      ]);
    
      // B5: Đánh dấu nhiệm vụ đã nhận thưởng
      await supabase
        .from("user_tasks")
        .update({
          reward_claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("task_id", taskId);
    
      // B6: Cập nhật UI
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, reward_claimed: true } : t))
      );
    
      alert(`🎉 Bạn đã nhận ${task.reward_points} xu vào ví!`);
    }


    // Nếu có bảng user_tasks
    // await supabase.from("user_tasks").update({ reward_claimed: true }).eq("user_id", userId).eq("task_id", taskId);
  }

  if (loading) {
    return (
      <AuthorLayout>
        <div className="text-center text-muted-foreground py-10">Đang tải nhiệm vụ...</div>
      </AuthorLayout>
    );
  }

  return (
    <AuthorLayout>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" /> Nhiệm vụ hôm nay 🎯
      </h1>

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
              <span className="text-sm text-primary font-medium">+{task.reward_points} xu</span>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex justify-between items-center">
              <p>{task.description}</p>

              {task.reward_claimed ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Đã nhận
                </span>
              ) : task.completed ? (
                <Button size="sm" onClick={() => claimReward(task.id)}>
                  Nhận thưởng
                </Button>
              ) : (
                <span className="text-muted-foreground text-xs">Chưa hoàn thành</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AuthorLayout>
  );
}
