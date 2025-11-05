import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "./ui/button";
import { useBalance } from "../hooks/useBalance";
import { CheckCircle, Clock } from "lucide-react";

export default function ReaderTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { refresh } = useBalance();

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: allTasks }, { data: myTasks }] = await Promise.all([
        supabase.from("tasks").select("*").eq("active", true),
        supabase
          .from("user_tasks")
          .select("task_id,is_completed")
          .eq("user_id", user.id)
          .gte("task_date", new Date().toISOString().split("T")[0]),
      ]);

      setTasks(allTasks || []);
      setUserTasks(myTasks || []);
      setLoading(false);
    }

    fetchTasks();
  }, []);

  const handleClaim = async (taskId: string, reward_coin: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Bạn cần đăng nhập");

    // cập nhật trạng thái nhiệm vụ user
    const { error } = await supabase
      .from("user_tasks")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("task_id", taskId);

    if (error) {
      alert("❌ Lỗi khi cập nhật nhiệm vụ");
      return;
    }

    // cộng xu vào balance
    await supabase.rpc("increment_user_coin", {
      p_user_id: user.id,
      p_amount: reward_coin,
    });

    await refresh();
    alert(`🎉 Bạn đã nhận được ${reward_coin} xu!`);
    setUserTasks((prev) => [
      ...prev,
      { task_id: taskId, is_completed: true },
    ]);
  };

  if (loading)
    return <p className="text-muted-foreground text-sm">Đang tải nhiệm vụ...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tasks.map((t) => {
        const done = userTasks.some((ut) => ut.task_id === t.id && ut.is_completed);
        return (
          <div
            key={t.id}
            className="p-4 border rounded-lg shadow-sm bg-card flex flex-col justify-between transition hover:shadow-md"
          >
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                {done ? <CheckCircle className="text-green-500 h-4 w-4" /> : <Clock className="text-gray-400 h-4 w-4" />}
                {t.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{t.description}</p>
            </div>

            <div className="flex justify-between items-center mt-2">
              {!done ? (
                <>
                  <span className="text-primary text-sm font-medium">+{t.reward_coin} xu</span>
                  <Button size="sm" onClick={() => handleClaim(t.id, t.reward_coin)}>
                    Làm ngay
                  </Button>
                </>
              ) : (
                <Button size="sm" disabled variant="outline">
                  ✅ Hoàn thành
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
