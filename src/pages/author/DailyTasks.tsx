import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import AuthorLayout from "./AuthorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Gift, CheckCircle, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Task = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  reward_coin: number;
};

type UserTask = {
  id: string;
  task_id: string;
  completed: boolean;
  reward_claimed: boolean;
};

type MergedTask = Task & {
  completed: boolean;
  reward_claimed: boolean;
};

const TODAY = new Date().toISOString().slice(0, 10);

export default function DailyTasks() {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [tasks, setTasks] = useState<MergedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [coinFly, setCoinFly] = useState(false);

  // 🧩 Lấy user hiện tại
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
      } else {
        setUserId(data.user.id);
      }
    });
  }, []);

  // 🧩 Load data tasks & balance
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);

      const [taskRes, userTaskRes, balRes] = await Promise.all([
        supabase.from("tasks").select("id, code, title, description, reward_coin").eq("active", true),
        supabase.from("user_tasks").select("task_id, completed, reward_claimed").eq("user_id", userId).eq("date", TODAY),
        supabase.from("user_balances").select("balance").eq("user_id", userId).maybeSingle(),
      ]);

      const base = taskRes.data ?? [];
      const userTasks = userTaskRes.data ?? [];

      const merged: MergedTask[] = base.map((t) => {
        const ut = userTasks.find((x) => x.task_id === t.id);
        return { ...t, completed: !!ut?.completed, reward_claimed: !!ut?.reward_claimed };
      });

      setTasks(merged);
      setBalance(balRes.data?.balance ?? 0);
      setLoading(false);
    })();
  }, [userId]);

  // 🪙 Xử lý nhận thưởng
  const handleClaim = async (task: MergedTask) => {
    if (!userId) return;

    const isCheckin = (task.code ?? "").toLowerCase() === "daily_checkin";

    if (!isCheckin && !task.completed) {
      toast.error("Bạn chưa hoàn thành điều kiện nhiệm vụ này!");
      return;
    }

    if (task.reward_claimed) return;

    setActing(task.id);

    try {
      // Checkin = đánh dấu complete trước
      if (isCheckin) {
        await supabase.rpc("fn_update_task_checkin", { p_user_id: userId });
      }

      const { error } = await supabase.rpc("claim_task_reward", {
        p_user_id: userId,
        p_task_id: task.id,
      });
      if (error) throw error;

      // Realtime coin animation
      setBalance((prev) => prev + task.reward_coin);
      setCoinFly(true);
      toast.success(`🎉 Nhận +${task.reward_coin} xu thành công!`);
      setTimeout(() => setCoinFly(false), 1500);

      // Cập nhật local state
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completed: true, reward_claimed: true } : t
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi nhận thưởng!");
    } finally {
      setActing(null);
    }
  };

  // 🧩 UI
  if (loading)
    return (
      <AuthorLayout>
        <div className="text-center py-10 text-muted-foreground">Đang tải nhiệm vụ...</div>
      </AuthorLayout>
    );

  return (
    <AuthorLayout>
      <div className="flex items-center justify-between mb-6 relative overflow-visible">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gift className="w-5 h-5" /> Nhiệm vụ hôm nay
        </h1>
        <div className="text-base font-semibold text-amber-600 flex items-center gap-1">
          <Coins className="w-4 h-4 text-yellow-500" />
          <span>Ví: {balance.toLocaleString("vi-VN")} xu</span>
        </div>

        <AnimatePresence>
          {coinFly && (
            <motion.div
              key="coin"
              initial={{ y: 30, opacity: 0, scale: 0.7 }}
              animate={{ y: -50, opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute right-8 text-yellow-400 text-lg font-bold pointer-events-none select-none"
            >
              🪙 +xu!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => {
          const isCheckin = (task.code ?? "").toLowerCase() === "daily_checkin";
          const canClaim =
            !task.reward_claimed && (isCheckin ? true : task.completed);

          return (
            <Card
              key={task.id}
              className={`transition border ${
                task.reward_claimed ? "border-green-400 bg-green-50" : "border-gray-200"
              }`}
            >
              <CardHeader className="pb-2 flex justify-between items-center">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <span className="text-sm font-medium text-primary">
                  +{task.reward_coin} xu
                </span>
              </CardHeader>

              <CardContent className="text-sm text-muted-foreground flex justify-between items-center">
                <p className="pr-3">{task.description}</p>

                {task.reward_claimed ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Đã nhận
                  </span>
                ) : (
                  <Button
                    size="sm"
                    disabled={acting === task.id || !canClaim}
                    onClick={() => handleClaim(task)}
                    title={
                      canClaim
                        ? isCheckin
                          ? "Điểm danh & nhận thưởng"
                          : "Nhận thưởng"
                        : "Chưa đủ điều kiện để nhận"
                    }
                  >
                    {acting === task.id
                      ? "Đang xử lý..."
                      : isCheckin
                      ? "Điểm danh"
                      : task.completed
                      ? "Nhận thưởng"
                      : "Hoàn thành"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AuthorLayout>
  );
}
