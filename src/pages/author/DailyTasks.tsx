import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import AuthorLayout from "./AuthorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Gift, CheckCircle } from "lucide-react";

type Task = {
  id: string;
  code: string | null;          // ví dụ: CHECKIN, READ_30M, COMMENT_1, LIKE_1, SHARE_1
  title: string;
  description: string | null;
  reward_coin: number;
  active: boolean;
};

type UserTaskRow = {
  id: string;
  user_id: string;
  task_id: string;
  task_date: string;  // yyyy-mm-dd
  progress: number | null;
  is_completed: boolean;       // có thể bỏ dần, giữ cho tương thích
  completed_at: string | null;
  condition_met: boolean;      // ✅ đã đủ điều kiện để nhận
  reward_claimed: boolean;     // ✅ đã nhận thưởng
  claimed_at: string | null;
  updated_at: string | null;
};

type MergedTask = {
  id: string;                   // task_id
  code: string | null;
  title: string;
  description: string | null;
  reward_coin: number;
  condition_met_today: boolean;
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

  // 1) Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  // Helper
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

  // 2) Load data
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);

      // Ví
      await refreshBalance(userId);

      // Task base
      const { data: baseTasks, error: tErr } = await supabase
        .from("tasks")
        .select("id, code, title, description, reward_coin, active")
        .eq("active", true);
      if (tErr) {
        console.error("Fetch tasks error:", tErr);
        setLoading(false);
        return;
      }

      // user_tasks hôm nay
      const { data: userTasksToday, error: utErr } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("task_date", TODAY);
      if (utErr) console.error("Fetch user_tasks error:", utErr);

      // Tạo bản ghi thiếu
      const missing = (baseTasks ?? []).filter(
        (t) => !(userTasksToday ?? []).some((ut) => ut.task_id === t.id)
      );
      if (missing.length > 0) {
        const inserts = missing.map((t) => ({
          user_id: userId,
          task_id: t.id,
          task_date: TODAY,
          progress: 0,
          is_completed: false,
          condition_met: t.code === "CHECKIN" ? false : false, // CHECKIN: chờ user bấm; others: chờ sự kiện
          reward_claimed: false,
          updated_at: new Date().toISOString(),
        }));
        const { error: insErr } = await supabase.from("user_tasks").insert(inserts);
        if (insErr) console.error("Insert user_tasks error:", insErr);
      }

      // Lấy lại để merge
      const { data: ut2 } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("task_date", TODAY);

      const merged: MergedTask[] = (baseTasks ?? []).map((t) => {
        const ut = (ut2 ?? []).find((x: UserTaskRow) => x.task_id === t.id);
        return {
          id: t.id,
          code: t.code,
          title: t.title,
          description: t.description,
          reward_coin: t.reward_coin,
          condition_met_today: !!ut?.condition_met,
          reward_claimed_today: !!ut?.reward_claimed,
        };
      });

      setTasks(merged);
      setLoading(false);
    })();
  }, [userId]);

  // 3) Claim / Complete
  const handleAction = async (task: MergedTask) => {
    if (!userId) return;

    // Đã claim rồi
    if (task.reward_claimed_today) return;

    setActing(task.id);

    // Lấy record hôm nay
    const { data: ut, error: findErr } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_id", task.id)
      .eq("task_date", TODAY)
      .maybeSingle();

    if (findErr || !ut) {
      console.error("Find user_tasks error:", findErr);
      setActing(null);
      return;
    }

    const isCheckin = (task.code ?? "").toUpperCase() === "CHECKIN";

    // Guard: với non-CHECKIN buộc phải condition_met = true
    if (!isCheckin && !ut.condition_met) {
      setActing(null);
      alert("Bạn chưa hoàn thành điều kiện của nhiệm vụ này.");
      return;
    }

    // Với CHECKIN, khi bấm coi như đủ điều kiện trong cùng 1 update
    const updatePayload: Partial<UserTaskRow> = {
      is_completed: true,
      condition_met: true,
      reward_claimed: true,
      completed_at: new Date().toISOString(),
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error: updErr } = await supabase
      .from("user_tasks")
      .update(updatePayload)
      .eq("id", ut.id)
      .eq("task_date", TODAY)
      .eq("reward_claimed", false)      // chặn double-claim
      .select();

    if (updErr) {
      console.error("Update user_tasks error:", updErr);
      setActing(null);
      return;
    }
    if (!updated || updated.length === 0) {
      // đã có ai đó claim trước (double click/reload)
      setActing(null);
      return;
    }

    // Cộng xu bằng RPC (an toàn, cộng dồn)
    const { error: rpcErr } = await supabase.rpc("fn_add_coin", {
      p_user_id: userId,
      p_amount: task.reward_coin,
      p_note: `Reward task ${task.code ?? task.id} ${TODAY}`,
    });
    if (rpcErr) {
      console.error("fn_add_coin error:", rpcErr);
      setActing(null);
      return;
    }

    // Refresh ví & UI
    await refreshBalance(userId);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, condition_met_today: true, reward_claimed_today: true }
          : t
      )
    );

    setActing(null);
  };

  // 4) Render
  if (loading) {
    return (
      <AuthorLayout>
        <div className="text-center py-10 text-muted-foreground">Đang tải nhiệm vụ…</div>
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
          const isCheckin = (task.code ?? "").toUpperCase() === "CHECKIN";
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
                        : isCheckin
                        ? "Điểm danh để nhận thưởng"
                        : "Bạn chưa hoàn thành điều kiện nhiệm vụ"
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
