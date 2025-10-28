import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import AuthorLayout from "./AuthorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Gift, CheckCircle } from "lucide-react";

/** ====== Types đúng với bảng trên Supabase ====== */
type Task = {
  id: string;               // tasks.id (uuid)
  code: string | null;      // tasks.code
  title: string;            // tasks.title
  description: string | null; // tasks.description
  reward_coin: number;      // tasks.reward_coin (int4)
  active: boolean;          // tasks.active
};

type UserTaskRow = {
  id: string;
  user_id: string;
  task_id: string;
  task_date: string;        // 'YYYY-MM-DD'
  progress: number | null;
  is_completed: boolean;
  completed_at: string | null;
  reward_claimed: boolean;
  claimed_at: string | null;
  updated_at: string | null;
};

type MergedTask = {
  id: string;
  title: string;
  description: string | null;
  reward_coin: number;
  is_completed_today: boolean;
  reward_claimed_today: boolean;
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const TODAY = isoDate(new Date());

export default function DailyTasks() {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [tasks, setTasks] = useState<MergedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null); // task_id đang xử lý

  /** 1) Lấy user hiện tại */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  /** 2) Helper: đảm bảo có dòng user_balances cho user */
  const ensureBalanceRow = async (uid: string) => {
    // tạo nếu chưa có (balance = 0)
    const { error } = await supabase
      .from("user_balances")
      .upsert(
        { user_id: uid, balance: 0, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (error) console.error("ensureBalanceRow error:", error);
  };

  /** 3) Tải balance + list task + trạng thái hôm nay */
  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoading(true);

      // Đảm bảo có balance row
      await ensureBalanceRow(userId);

      // Balance
      const { data: balRow, error: balErr } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      if (!balErr && balRow) setBalance(balRow.balance || 0);

      // Tasks (chỉ lấy active)
      const { data: baseTasks, error: taskErr } = await supabase
        .from("tasks")
        .select("id, code, title, description, reward_coin, active")
        .eq("active", true);
      if (taskErr) {
        console.error("Fetch tasks error:", taskErr);
        setLoading(false);
        return;
      }

      // user_tasks hôm nay
      const { data: todaysUT, error: utErr } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("task_date", TODAY);
      if (utErr) console.error("Fetch user_tasks error:", utErr);

      // Tạo bản ghi user_tasks hôm nay nếu thiếu
      const missing = (baseTasks || []).filter(
        (t) => !(todaysUT || []).some((ut) => ut.task_id === t.id)
      );
      if (missing.length > 0) {
        const inserts = missing.map((t) => ({
          user_id: userId,
          task_id: t.id,
          task_date: TODAY,
          is_completed: false,
          reward_claimed: false,
          progress: 0,
        }));
        const { error: insertErr } = await supabase.from("user_tasks").insert(inserts);
        if (insertErr) console.error("Insert user_tasks error:", insertErr);
      }

      // Lấy lại user_tasks hôm nay (đảm bảo đủ)
      const { data: ut2 } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("task_date", TODAY);

      // Merge để render
      const merged: MergedTask[] = (baseTasks || []).map((t) => {
        const ut = (ut2 || []).find((x: UserTaskRow) => x.task_id === t.id);
        return {
          id: t.id,
          title: t.title,
          description: t.description,
          reward_coin: t.reward_coin,
          is_completed_today: !!ut?.is_completed,
          reward_claimed_today: !!ut?.reward_claimed,
        };
      });

      setTasks(merged);
      setLoading(false);
    })();
  }, [userId]);

  /** 4) Cộng xu an toàn: đảm bảo chỉ cộng khi user_tasks hôm nay chuyển reward_claimed=false -> true */
  const creditReward = async (task_id: string, amount: number) => {
    if (!userId) return;

    // Đảm bảo có balance row trước khi cộng
    await ensureBalanceRow(userId);

    // Cộng xu: (simple) đọc rồi update. (Guard đã ở bước update user_tasks – xem dưới)
    const { data: balRow, error: bErr } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    if (bErr) {
      console.error("Get balance error:", bErr);
      return;
    }
    const current = balRow?.balance || 0;
    const next = current + amount;

    const { error: uErr } = await supabase
      .from("user_balances")
      .update({ balance: next, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (uErr) {
      console.error("Update balance error:", uErr);
      return;
    }
    setBalance(next);
  };

  /** 5) Handle “Điểm danh/Hoàn thành”  — chỉ 1 lần/ngày */
  const handleComplete = async (task: MergedTask) => {
    if (!userId) return;
    if (task.reward_claimed_today) {
      alert("✅ Hôm nay bạn đã nhận thưởng nhiệm vụ này rồi!");
      return;
    }
    setActing(task.id);

    // 5.1 Tìm bản ghi user_tasks hôm nay cho task này
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

    // 5.2 Update có điều kiện: chỉ update nếu reward_claimed = false (chặn double-click / reload)
    const { data: updated, error: updErr } = await supabase
      .from("user_tasks")
      .update({
        is_completed: true,
        reward_claimed: true,
        completed_at: new Date().toISOString(),
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", ut.id)
      .eq("task_date", TODAY)
      .eq("reward_claimed", false)      // guard chính
      .select();

    if (updErr) {
      console.error("Update user_tasks error:", updErr);
      setActing(null);
      return;
    }

    // Nếu không có hàng nào được update -> đã nhận rồi
    if (!updated || updated.length === 0) {
      alert("✅ Hôm nay bạn đã nhận thưởng nhiệm vụ này rồi!");
      setActing(null);
      return;
    }

    // 5.3 Cộng xu vào ví
    await creditReward(task.id, task.reward_coin);

    // 5.4 Cập nhật UI
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, is_completed_today: true, reward_claimed_today: true }
          : t
      )
    );

    setActing(null);
    alert(`🎉 Nhận thành công +${task.reward_coin} xu`);
  };

  /** 6) UI */
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
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`transition border ${
              task.reward_claimed_today ? "border-green-400 bg-green-50" : "border-gray-200"
            }`}
          >
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <span className="text-sm font-medium text-primary">+{task.reward_coin} xu</span>
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
                  disabled={acting === task.id}
                  onClick={() => handleComplete(task)}
                >
                  {acting === task.id ? "Đang xử lý…" : task.is_completed_today ? "Nhận thưởng" : "Hoàn thành"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AuthorLayout>
  );
}
