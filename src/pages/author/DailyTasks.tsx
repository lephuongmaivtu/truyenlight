import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import AuthorLayout from "./AuthorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Gift, CheckCircle } from "lucide-react";

type Task = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  reward_coin: number;
  active: boolean;
};

type UserTaskRow = {
  id: string;
  user_id: string;
  task_id: string;
  date: string;
  completed: boolean;
  reward_claimed: boolean;
  completed_at: string | null;
  reward_claimed_at: string | null;
};

type MergedTask = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  reward_coin: number;
  condition_met_today: boolean; // completed = true
  reward_claimed_today: boolean;
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const TODAY = isoDate(new Date());

export default function DailyTasks() {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [tasks, setTasks] = useState<MergedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  // 🔹 Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  // 🔹 Refresh balance
  const refreshBalance = async (uid: string) => {
    await supabase
      .from("user_balances")
      .upsert(
        { user_id: uid, balance: 0, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    const { data } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", uid)
      .maybeSingle();
    setBalance(data?.balance ?? 0);
  };

  // 🔹 Load tasks
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);

      await refreshBalance(userId);

      // Base tasks
      const { data: baseTasks, error: tErr } = await supabase
        .from("tasks")
        .select("id, code, title, description, reward_coin, active")
        .eq("active", true);

      if (tErr) {
        console.error("Fetch tasks error:", tErr);
        setLoading(false);
        return;
      }

      // User tasks today
      const { data: userTasks, error: utErr } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("date", TODAY);

      if (utErr) console.error("Fetch user_tasks error:", utErr);

      // Insert missing user_tasks for today
      const missing = (baseTasks ?? []).filter(
        (t) => !(userTasks ?? []).some((ut) => ut.task_id === t.id)
      );

      if (missing.length > 0) {
        const inserts = missing.map((t) => ({
          user_id: userId,
          task_id: t.id,
          date: TODAY,
          completed: false,
          reward_claimed: false,
        }));
        const { error: insErr } = await supabase.from("user_tasks").insert(inserts);
        if (insErr) console.error("Insert user_tasks error:", insErr);
      }

      // Fetch lại sau khi insert
      const { data: userTasksToday } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("date", TODAY);

      const merged: MergedTask[] = (baseTasks ?? []).map((t) => {
        const ut = (userTasksToday ?? []).find((x: UserTaskRow) => x.task_id === t.id);
        return {
          id: t.id,
          code: t.code,
          title: t.title,
          description: t.description,
          reward_coin: t.reward_coin,
          condition_met_today: !!ut?.completed,
          reward_claimed_today: !!ut?.reward_claimed,
        };
      });

      setTasks(merged);
      setLoading(false);
    })();
  }, [userId]);

  // 🔹 Handle claim
  const handleAction = async (task: MergedTask) => {
    if (!userId) return;

    const isCheckin = (task.code ?? "").toLowerCase() === "daily_checkin";

    // Chặn nếu chưa đủ điều kiện
    if (!isCheckin && !task.condition_met_today) {
      alert("Bạn chưa hoàn thành điều kiện của nhiệm vụ này.");
      return;
    }

    if (task.reward_claimed_today) return;

    setActing(task.id);

    try {
      // Với CHECKIN: đánh dấu completed luôn trước khi claim
      if (isCheckin) {
        await supabase.from("user_tasks").update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("task_id", task.id)
        .eq("date", TODAY);
      }

      // Gọi RPC claim_task_reward
      const { error: rpcErr } = await supabase.rpc("claim_task_reward", {
        p_user_id: userId,
        p_task_id: task.id,
      });
      if (rpcErr) throw rpcErr;

      await refreshBalance(userId);

      // Cập nhật local UI
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, condition_met_today: true, reward_claimed_today: true }
            : t
        )
      );
    } catch (err) {
      console.error("Claim error:", err);
    } finally {
      setActing(null);
    }
  };

  // 🔹 UI render
  if (loading) {
    return (
      <AuthorLayout>
        <div className="text-center py-10 text-muted-foreground">
          Đang tải nhiệm vụ…
        </div>
      </AuthorLayout>
    );
  }

  return (
    <AuthorLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gift className="w-5 h-5" /> Nhiệm vụ hôm nay
        </h1>
        <div className="text-base font-semibold text-amber-600">
          💰 Ví: {balance.toLocaleString("vi-VN")} xu
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => {
          const isCheckin = (task.code ?? "").toLowerCase() === "daily_checkin";
          const canClaim =
            !task.reward_claimed_today &&
            (isCheckin ? true : task.condition_met_today);

          return (
            <Card
              key={task.id}
              className={`transition border ${
                task.reward_claimed_today
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200"
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

                {task.reward_claimed_today ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Đã nhận
                  </span>
                ) : (
                  <Button
                    size="sm"
                    disabled={acting === task.id || !canClaim}
                    onClick={() => handleAction(task)}
                    title={
                      canClaim
                        ? isCheckin
                          ? "Điểm danh & nhận thưởng"
                          : "Nhận thưởng"
                        : "Chưa đủ điều kiện để nhận"
                    }
                  >
                    {acting === task.id
                      ? "Đang xử lý…"
                      : isCheckin
                      ? "Điểm danh"
                      : task.condition_met_today
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
