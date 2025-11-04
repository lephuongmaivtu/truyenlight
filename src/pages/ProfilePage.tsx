import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import RewardClaimModal from "../components/RewardClaimModal";


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

      {/* 🎁 Phần thưởng */}
      <section>
        <h2 className="text-xl font-semibold mb-4">🎁 Phần thưởng của bạn</h2>
        {rewards.length === 0 ? (
          <p className="text-muted-foreground">
            Chưa có phần thưởng nào. Hãy đọc chương đầu tiên để nhận quà nhé!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((r) => (
              <div
                key={r.id}
                className="border rounded-lg p-4 shadow hover:shadow-md transition bg-card"
              >
                <img
                  src={r.image_url || "https://placehold.co/200x200"}
                  alt={r.item_name}
                  className="w-full h-40 object-cover rounded-md mb-3"
                />
                <h3 className="font-semibold text-base mb-1">{r.item_name}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {r.claimed ? "✅ Đã nhận" : "⏳ Chưa nhận"}
                </p>

                {!r.claimed && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => claimReward(r.id)}
                  >
                    Nhận quà
                  </Button>            
                )}
                {showModal && selectedReward && (
                    <RewardClaimModal
                      reward={selectedReward}
                      onClose={() => setShowModal(false)}
                    />
                 )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
