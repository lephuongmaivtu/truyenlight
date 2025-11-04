import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import RewardVoucherModal from "../components/RewardVoucherModal";




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

// 🪙 Lấy thông tin phần thưởng
async function getUserRewards(userId: string) {
  const { data, error } = await supabase
    .from("user_rewards")
    .select("*")
    .eq("user_id", userId)
    .order("selected_at", { ascending: false });

  if (error) {
    console.error("Error getUserRewards:", error);
    return [];
  }
  return data;
}

// ✅ Cập nhật trạng thái đã nhận



// ---------------- Component ----------------
export function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const [checkin, setCheckin] = useState({
  streak: 0,
  remaining: 21,
  canClaim: false,
});


    // ✅ Hàm nhận thưởng (di chuyển vào trong component)
  const claimReward = async (rewardId: string) => {
    // 1. Lấy voucher chưa được claim
    const { data: availableVoucher } = await supabase
      .from("reward_vouchers")
      .select("id, voucher_code, product_url")
      .eq("is_claimed", false)
      .limit(1)
      .single();

    if (!availableVoucher) {
      alert("😢 Hiện tại đã hết voucher, vui lòng quay lại sau!");
      return;
    }

    // 2. Lấy user hiện tại
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    // 3. Update voucher thành đã claim
    await supabase
      .from("reward_vouchers")
      .update({
        is_claimed: true,
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq("id", availableVoucher.id);

    // 4. Gán voucher_code vào user_rewards
    const { error } = await supabase
      .from("user_rewards")
      .update({
        claimed: true,
        status: "claimed",
        voucher_code: availableVoucher.voucher_code,
        voucher_url: availableVoucher.product_url,
      })
      .eq("id", rewardId);

    if (error) {
      alert("❌ Lỗi khi nhận quà!");
      return;
    }

    // 5. Hiển thị modal voucher
    const fullReward = {
      voucher_code: availableVoucher.voucher_code,
      product_url: availableVoucher.product_url,
    };
    setSelectedReward(fullReward);
    setShowModal(true);
  };


  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUserId(data.user.id);
    }
    loadUser();
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      setLoading(true);

      const [p, b, r] = await Promise.all([
        getReadingProgress(userId),
        getBookmarks(userId),
        getUserRewards(userId),
      ]);

      setProgress(p);
      setBookmarks(b);
      setRewards(r);
      setLoading(false);
    }
    loadData();
    
      }, [userId]);
      useEffect(() => {
      async function getCheckinSummary(userId: string) {
        const since = new Date();
        since.setDate(since.getDate() - 30);
    
        const { data: checkins, error } = await supabase
          .from("user_checkins")
          .select("created_at")
          .gte("created_at", since.toISOString())
          .eq("user_id", userId)
          .order("created_at", { ascending: true });
    
        if (error) {
          console.error("Lỗi fetch checkin:", error);
          return { streak: 0, remaining: 21, canClaim: false };
        }
    
        const days = new Set(
          (checkins || []).map((c) =>
            new Date(c.created_at).toISOString().split("T")[0]
          )
        );
    
        let streak = 0;
        for (let i = 0; i < 999; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split("T")[0];
          if (days.has(key)) streak++;
          else break;
        }
    
        const remaining = Math.max(0, 21 - streak);
        const canClaim = streak >= 21;
    
        return { streak, remaining, canClaim };
      }
    
      async function loadCheckin() {
        if (!userId) return;
        const result = await getCheckinSummary(userId);
        setCheckin(result);
      }
      loadCheckin();
    }, [userId]);


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

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <h1 className="text-3xl font-bold mb-6">Trang cá nhân</h1>

      {/* Đang đọc */}
      <section>
        <h2 className="text-xl font-semibold mb-4">📖 Đang đọc</h2>
        {progress.length === 0 ? (
          <p className="text-muted-foreground">Chưa có truyện nào.</p>
        ) : (
          <ul className="space-y-4">
            {progress.map((p) => (
              <li key={p.id}>
                <Link to={`/story/${p.story.slug}/${p.chapter_id}`}>
                  <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted transition">
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
      </section>

      {/* Đánh dấu */}
      <section>
        <h2 className="text-xl font-semibold mb-4">🔖 Đánh dấu</h2>
        {bookmarks.length === 0 ? (
          <p className="text-muted-foreground">
            Chưa có truyện nào được đánh dấu.
          </p>
        ) : (
          <ul className="space-y-4">
            {bookmarks.map((b) => {
              if (!b.story) return null;
              return (
                <li key={b.id}>
                  <Link to={`/story/${b.story.slug}`}>
                    <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted transition">
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
      </section>

    {/* 🎁 Hộp quà 21 ngày */}
<section>
  <h2 className="text-xl font-semibold mb-4">🎁 Hộp quà 21 ngày</h2>

  {rewards.length === 0 ? (
    <p className="text-muted-foreground">
      Chưa có phần thưởng nào. Hãy đọc chương đầu tiên để chọn quà nhé!
    </p>
  ) : (
    rewards.slice(0, 1).map((r) => {
      const claimed = !!r.claimed;
      const name = r.payload?.item_name || r.item_name || "Phần thưởng";
      const img = r.payload?.image_url || r.image_url || "https://placehold.co/200x200";

      return (
        <div key={r.id} className="border rounded-lg p-4 shadow bg-card max-w-md">
          <img
            src={img}
            alt={name}
            className="w-full h-40 object-cover rounded-md mb-3"
          />
          <h3 className="font-semibold text-base mb-1">{name}</h3>

          {!claimed ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                {checkin.canClaim
                  ? "🎉 Bạn đã đủ 21 ngày điểm danh, hãy nhận quà nhé!"
                  : `⏳ Còn ${checkin.remaining} ngày nữa để nhận quà`}
              </p>

              {/* Thanh tiến trình */}
              <div className="w-full bg-muted rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="bg-primary h-2"
                  style={{ width: `${Math.min(100, (checkin.streak / 21) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Streak: {checkin.streak}/21 ngày
              </p>

              <Button
                disabled={!checkin.canClaim}
                onClick={() => claimReward(r.id)}
                className="w-full"
              >
                Nhận quà
              </Button>
            </>
          ) : (
            <>
              <p className="text-green-600 mb-3">✅ Bạn đã nhận phần thưởng!</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedReward({
                    name,
                    image_url: img,
                    voucher_code: r.voucher_code,
                    product_url: r.voucher_url || r.payload?.product_url || null,
                  });
                  setShowModal(true);
                }}
              >
                Xem mã voucher
              </Button>
            </>
          )}
        </div>
      );
    })
  )}

  {/* Modal xem mã voucher */}
  {showModal && selectedReward && (
    <RewardVoucherModal
      open={showModal}
      onClose={() => setShowModal(false)}
      reward={selectedReward}
    />
  )}
</section>

    </div>
  );
}
