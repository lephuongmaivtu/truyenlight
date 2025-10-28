import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useBalance } from "@/hooks/useBalance";

type Task = {
  id: string;
  code: string;
  title: string;
  description: string;
  reward_coin: number;
};
type UserTask = {
  id: string;
  is_completed: boolean;
  progress: number;
};

const SECONDS_TARGET_READ = 1800; // 30 phút

export default function DailyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<Record<string, UserTask>>({});
  const [readingSecondsToday, setReadingSecondsToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const { coin, refresh } = useBalance();

  // load tasks (daily)
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: tasksData } = await supabase
        .from("tasks").select("id, code, title, description, reward_coin")
        .eq("active", true)
        .eq("frequency", "daily")
        .order("title", { ascending: true });
      setTasks(tasksData || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // upsert xương sống user_tasks hôm nay để tiện update
      const today = new Date().toISOString().slice(0, 10);
      for (const t of (tasksData || [])) {
        await supabase.from("user_tasks").upsert({
          user_id: user.id,
          task_id: t.id,
          task_date: today
        }, { onConflict: "user_id,task_id,task_date" });
      }

      const { data: utRows } = await supabase
        .from("user_tasks")
        .select("id, task_id, is_completed, progress")
        .eq("user_id", user.id)
        .eq("task_date", today);

      const map: Record<string, UserTask> = {};
      (utRows || []).forEach(r => { map[r.task_id] = r; });
      setUserTasks(map);

      // Tổng giây đọc hôm nay (từ reading_time_logs)
      const { data: readAgg } = await supabase
        .from("reading_time_logs")
        .select("seconds")
        .gte("logged_at", new Date(new Date().setHours(0,0,0,0)).toISOString())
        .lte("logged_at", new Date(new Date().setHours(23,59,59,999)).toISOString());

      const total = (readAgg || []).reduce((s, r: any) => s + (r.seconds || 0), 0);
      setReadingSecondsToday(total);

      setLoading(false);
    })();
  }, []);

  const findTaskByCode = (code: string) => tasks.find(t => t.code === code);
  const isCompleted = (taskId?: string) => taskId && userTasks[taskId]?.is_completed;

  // điểm danh
  const handleCheckin = async () => {
    const t = findTaskByCode("DAILY_CHECKIN");
    if (!t) return;
    const row = userTasks[t.id];
    if (row?.is_completed) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_tasks")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", row.id)
      .select()
      .single();

    if (!error) {
      setUserTasks(prev => ({ ...prev, [t.id]: { ...row, is_completed: true } }));
      await refresh(); // ví đã cộng xu qua trigger
    }
  };

  // hoàn thành đọc 30 phút
  const handleClaimRead = async () => {
    const t = findTaskByCode("DAILY_READ_30M");
    if (!t) return;
    const row = userTasks[t.id];
    if (row?.is_completed || readingSecondsToday < SECONDS_TARGET_READ) return;

    const { data, error } = await supabase
      .from("user_tasks")
      .update({ is_completed: true, completed_at: new Date().toISOString(), progress: readingSecondsToday })
      .eq("id", row.id)
      .select().single();

    if (!error) {
      setUserTasks(prev => ({ ...prev, [t.id]: { ...row, is_completed: true, progress: readingSecondsToday } }));
      await refresh();
    }
  };

  // helper render
  const TaskRow = ({ t }: { t: Task }) => {
    const completed = isCompleted(t.id);
    const isRead = t.code === "DAILY_READ_30M";
    const isCheckin = t.code === "DAILY_CHECKIN";

    const progressPct = useMemo(() => {
      if (!isRead) return 0;
      return Math.min(100, Math.round((readingSecondsToday / SECONDS_TARGET_READ) * 100));
    }, [isRead, readingSecondsToday]);

    return (
      <div className="flex items-center justify-between p-3 rounded-xl border mb-2">
        <div>
          <div className="font-semibold">{t.title}</div>
          <div className="text-sm opacity-70">{t.description}</div>
          {isRead && (
            <div className="text-xs mt-1">
              Tiến độ đọc: {Math.floor(readingSecondsToday/60)}’/{Math.floor(SECONDS_TARGET_READ/60)}’ ({progressPct}%)
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">+{t.reward_coin} xu</span>
          {completed ? (
            <span className="px-2 py-1 text-xs rounded bg-green-600 text-white">Đã nhận</span>
          ) : isCheckin ? (
            <button onClick={handleCheckin} className="px-3 py-1 rounded bg-black text-white">
              Điểm danh
            </button>
          ) : isRead ? (
            <button
              onClick={handleClaimRead}
              disabled={readingSecondsToday < SECONDS_TARGET_READ}
              className={`px-3 py-1 rounded ${readingSecondsToday < SECONDS_TARGET_READ ? 'bg-gray-300' : 'bg-black text-white'}`}
            >
              Nhận thưởng
            </button>
          ) : (
            <span className="text-xs opacity-60">Tự động khi hoàn thành</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🎯 Nhiệm vụ hôm nay</h2>
        <div className="text-sm">Ví: <b>{coin}</b> xu</div>
      </div>

      {loading ? <div>Loading...</div> : (
        <>
          {tasks.map(t => <TaskRow key={t.id} t={t} />)}
          <div className="mt-4 p-3 rounded-xl border">
            <div className="text-sm opacity-70">
              * Nhiệm vụ “Bình luận / Chia sẻ / Thả tim” sẽ tự đánh dấu khi hệ thống ghi nhận hành động trong ngày (m có thể gắn update `user_tasks.is_completed=true` tại chỗ user like/comment/share).
            </div>
          </div>
        </>
      )}
    </div>
  );
}
