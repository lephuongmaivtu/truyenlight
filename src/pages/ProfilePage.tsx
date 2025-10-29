import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast"; // ✅ dùng để báo toast
import { afterFirstCheckinTrigger } from "../components/rewards/RewardFlow"; // ✅ gọi phần thưởng khi điểm danh lần đầu

// ---------------- API call ----------------
async function getBookmarks(userId: string) {
  const { data, error } = await supabase
    .from("bookmarks")
    .select(`
      id,
      chapter_id,
      story_id,
      story:story_id (
        id,
        slug,
        title,
        author,
        description,
        coverImage,
        rating,
        views,
        status,
        genres,
        lastUpdated
      )
    `)
    .eq("user_id", userId);

  if (error) {
    console.error("Error getBookmarks:", error);
    return [];
  }
  return data;
}

async function getReadingProgress(userId: string) {
  const { data, error } = await supabase
    .from("reading_progress")
    .select(`
      id,
      chapter_id,
      story_id,
      scroll_position,
      updated_at,
      story:story_id (
        id,
        slug,
        title,
        author,
        coverImage
      )
    `)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error getProgress:", error);
    return [];
  }
  return data;
}

// ✅ lấy thông tin ví xu và streak
async function getBalance() {
  const { data, error } = await supabase
    .from("user_balances")
    .select("activity_points, streak_days")
    .single();
  if (error) {
    console.error("Error getBalance:", error);
    return { activity_points: 0, streak_days: 0 };
  }
  return data;
}

// ---------------- Component ----------------
export function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<{ activity_points: number; streak_days: number }>({
    activity_points: 0,
    streak_days: 0,
  });
  const { toast } = useToast();

  // Lấy user hiện tại
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      }
    }
    loadUser();
  }, []);

  // Lấy progress + bookmark + balance
  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      setLoading(true);

      const [p, b, bal] = await Promise.all([
        getReadingProgress(userId),
        getBookmarks(userId),
        getBalance(),
      ]);

      setProgress(p);
      setBookmarks(b);
      setBalance(bal);
      setLoading(false);
    }
    loadData();
  }, [userId]);

  // ✅ Hàm điểm danh hôm nay
  const handleCheckin = async () => {
    const { data, error } = await supabase.rpc("check_in");
    if (error) {
      console.error(error);
      toast({ description: "Lỗi điểm danh rồi 😢" });
      return;
    }

    if (data && data.length > 0) {
      const streak = data[0].streak_days;
      toast({ description: `Điểm danh thành công! 🌞 Chuỗi ngày: ${streak}` });
      setBalance({
        activity_points: data[0].activity_points,
        streak_days: data[0].streak_days,
      });

      // Gọi popup phần thưởng nếu là lần đầu tiên điểm danh
      if (streak === 1) {
        await afterFirstCheckinTrigger();
      }
    }
  };

  // ✅ Hàm nhận thưởng khi đủ điều kiện
  const handleClaimReward = async () => {
    const { data, error } = await supabase.rpc("claim_reward");
    if (error) {
      console.error(error);
      toast({ description: "Không thể nhận thưởng, thử lại sau nhé!" });
      return;
    }
    if (data && data[0]?.claimed) {
      toast({ description: `🎁 Đã nhận quà: ${data[0].item_name}` });
      setBalance((prev) => ({ ...prev, activity_points: 0 })); // reset points nếu muốn
    } else {
      toast({ description: "Chưa đủ điều kiện để nhận quà nha!" });
    }
  };

  // ---------------- Loading + Login state ----------------
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        Đang tải nè, đợi xíu nha…
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="mb-4">Bạn cần đăng nhập để xem trang cá nhân.</p>
        <Link to="/login">
          <Button>Đăng nhập</Button>
        </Link>
      </div>
    );
  }

  // ---------------- Main render ----------------
  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      <h1 className="text-3xl font-bold mb-6">Trang cá nhân</h1>

      {/* ✅ Thêm khu vực ví xu + điểm danh */}
      <div className="border rounded-xl p-4 bg-muted/40">
        <h2 className="text-xl font-semibold mb-2">🎯 Hoạt động của bạn</h2>
        <p>Xu hiện có: <b>{balance.activity_points}</b></p>
        <p>Chuỗi điểm danh: <b>{balance.streak_days}</b> ngày</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={handleCheckin}>Điểm danh hôm nay</Button>
          <Button variant="secondary" onClick={handleClaimReward}>
            Nhận thưởng 🎁
          </Button>
        </div>
      </div>

      {/* Reading progress */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Đang đọc</h2>
        {progress.length === 0 ? (
          <p className="text-muted-foreground">Chưa có truyện nào.</p>
        ) : (
          <ul className="space-y-4">
            {progress.map((p) => (
              <li key={p.id}>
                <Link to={`/story/${p.story.slug}/${p.chapter_id}`}>
                  <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted">
                    <img
                      src={p.story.coverImage || "https://placehold.co/100x140"}
                      alt={p.story.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{p.story.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Chương gần nhất: {p.chapter_id}
                      </p>
                    </div>
                    <Button size="sm">Tiếp tục đọc</Button>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bookmarks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Đánh dấu</h2>
        {bookmarks.length === 0 ? (
          <p className="text-muted-foreground">Chưa có truyện nào được đánh dấu.</p>
        ) : (
          <ul className="space-y-4">
            {bookmarks.map((b) => {
              if (!b.story) return null;
              return (
                <li key={b.id}>
                  <Link to={`/story/${b.story.slug}`}>
                    <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted">
                      <img
                        src={b.story.coverImage || "https://placehold.co/100x140"}
                        alt={b.story.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{b.story.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {b.story.author ?? "Unknown"}
                        </p>
                      </div>
                      <Button size="sm">Đọc</Button>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
