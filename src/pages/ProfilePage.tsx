import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import RewardVoucherModal from "../components/RewardVoucherModal";

import ReaderTasks from "../components/ReaderTasks";
import { useBalance } from "../hooks/useBalance"; // nếu chưa có thì thêm





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
    .select("id, user_id, claimed, voucher_code, payload, selected_at")
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
  const [purchases, setPurchases] = useState<any[]>([]);

// thêm state tab
  const [activeTab, setActiveTab] = useState("reading");
  const [checkin, setCheckin] = useState({
  streak: 0,
  remaining: 21,
  canClaim: false,
});


    // ✅ Hàm nhận thưởng (di chuyển vào trong component)
 // ✅ Hàm nhận thưởng
const claimReward = async (rewardId: string) => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    alert("Vui lòng đăng nhập để nhận quà!");
    return;
  }

  // Gọi RPC claim_reward
  const { data, error } = await supabase.rpc("claim_reward", { p_user_id: user.id });

  if (error) {
    alert("❌ " + (error.message || "Lỗi khi nhận quà!"));
    return;
  }

  // ✅ Cập nhật lại state rewards (đánh dấu đã nhận)
  setRewards((prev) =>
    prev.map((r) =>
      r.id === rewardId ? { ...r, claimed: true, voucher_code: data.voucher_code } : r
    )
  );

  // ✅ Hiển thị modal voucher
  const fullReward = {
    name: "Phần thưởng 21 ngày",
    image_url: data.image_url,
    voucher_code: data.voucher_code,
    product_url: data.product_url,
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

      const [p, b, r, pr] = await Promise.all([
        getReadingProgress(userId),
        getBookmarks(userId),
        getUserRewards(userId),
      ]);

      setProgress(p);
      setBookmarks(b);
      setRewards(r);
      setPurchases(pr);
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
// 🛒 Lấy danh sách quà đã mua từ reward_shop
async function getPurchasedRewards(userId: string) {
  const { data, error } = await supabase
    .from("user_purchases")
    .select(`
      voucher_code,
      purchased_at,
      reward_shop (
        name,
        image_url,
        product_url
      )
    `)
    .eq("user_id", userId)
    .order("purchased_at", { ascending: false });

  if (error) {
    console.error("Error getPurchasedRewards:", error);
    return [];
  }
  return data;
}

  
  return (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-6">Trang cá nhân</h1>

    {/* MOBILE DROPDOWN */}
    <div className="md:hidden mb-4">
      <select
        value={activeTab}
        onChange={(e) => setActiveTab(e.target.value)}
        className="border rounded-md p-2 w-full"
      >
        <option value="reading">📖 Đang đọc</option>
        <option value="bookmark">🔖 Đánh dấu</option>
        <option value="reward">🎁 Hộp quà 21 ngày</option>
        <option value="tasks">🎯 Nhiệm vụ độc giả</option>
        <option value="purchased">🎟️ Đã mua</option>
      </select>
    </div>

    <div className="flex flex-col md:flex-row gap-6">
      {/* SIDEBAR */}
      <aside className="hidden md:block w-1/4">
        <div className="space-y-3">
          <button
            onClick={() => setActiveTab("reading")}
            className={`block w-full text-left p-2 rounded ${
              activeTab === "reading"
                ? "bg-primary text-white"
                : "hover:bg-muted"
            }`}
          >
            📖 Đang đọc
          </button>
          <button
            onClick={() => setActiveTab("bookmark")}
            className={`block w-full text-left p-2 rounded ${
              activeTab === "bookmark"
                ? "bg-primary text-white"
                : "hover:bg-muted"
            }`}
          >
            🔖 Đánh dấu
          </button>
          <button
            onClick={() => setActiveTab("reward")}
            className={`block w-full text-left p-2 rounded ${
              activeTab === "reward"
                ? "bg-primary text-white"
                : "hover:bg-muted"
            }`}
          >
            🎁 Hộp quà 21 ngày
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`block w-full text-left p-2 rounded ${
              activeTab === "tasks"
                ? "bg-primary text-white"
                : "hover:bg-muted"
            }`}
          >
            🎯 Nhiệm vụ độc giả
          </button>
          <button
            onClick={() => setActiveTab("purchased")}
            className={`block w-full text-left p-2 rounded ${
              activeTab === "purchased"
                ? "bg-primary text-white"
                : "hover:bg-muted"
            }`}
          >
            🎟️ Đã mua
          </button>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 space-y-12">
        {activeTab === "reading" && (
          <>
            {/* ----- Đang đọc ----- */}
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
                            src={
                              p.story.coverImage || "https://placehold.co/100x140"
                            }
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
          </>
        )}

        {activeTab === "bookmark" && (
          <>
            {/* ----- Đánh dấu ----- */}
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
                              src={
                                b.story.coverImage || "https://placehold.co/100x140"
                              }
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
          </>
        )}

        {activeTab === "reward" && (
          <>
            {/* ----- Hộp quà 21 ngày ----- */}
            <section>
              <h2 className="text-xl font-semibold mb-4">🎁 Hộp quà 21 ngày</h2>

              {rewards.length === 0 ? (
                <p className="text-muted-foreground">
                  Chưa có phần thưởng nào. Hãy đọc chương đầu tiên để chọn quà
                  nhé!
                </p>
              ) : (
                rewards.slice(0, 1).map((r) => {
                  const claimed = !!r.claimed;
                  const name =
                    r.payload?.item_name || r.item_name || "Phần thưởng";
                  const img =
                    r.payload?.image_url ||
                    r.image_url ||
                    "https://placehold.co/200x200";

                  return (
                    <div
                      key={r.id}
                      className="border rounded-lg p-4 shadow bg-card max-w-md"
                    >
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
                              style={{
                                width: `${Math.min(
                                  100,
                                  (checkin.streak / 21) * 100
                                )}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mb-3">
                            Streak: {checkin.streak}/21 ngày
                          </p>

                          <Button
                            disabled={claimed || !checkin.canClaim}
                            onClick={() => claimReward(r.id)}
                            className="w-full"
                          >
                            {claimed ? "Bạn đã nhận quà" : "Nhận quà"}
                          </Button>
                          
                          {claimed && (
                            <Button
                              variant="outline"
                              className="w-full mt-2"
                              onClick={() => {
                                setSelectedReward({
                                  name,
                                  image_url: img,
                                  voucher_code: r.voucher_code,
                                  product_url:
                                    r.voucher_url || r.payload?.product_url || null,
                                });
                                setShowModal(true);
                              }}
                            >
                              Xem lại quà
                            </Button>
                          )}


                        </>
                      ) : (
                        <>
                          <p className="text-green-600 mb-3">
                            ✅ Bạn đã nhận phần thưởng!
                          </p>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setSelectedReward({
                                name,
                                image_url: img,
                                voucher_code: r.voucher_code,
                                product_url:
                                  r.voucher_url ||
                                  r.payload?.product_url ||
                                  null,
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

              {showModal && selectedReward && (
                <RewardVoucherModal
                  open={showModal}
                  onClose={() => setShowModal(false)}
                  reward={selectedReward}
                />
              )}
            </section>
          </>
        )}

        {activeTab === "tasks" && (
          <section>
            <h2 className="text-xl font-semibold mb-4">🎯 Nhiệm vụ độc giả</h2>
            <ReaderTasks />
          </section>
        )}
        {activeTab === "purchased" && (
  <section>
    <h2 className="text-xl font-semibold mb-4">🎟️ Quà bạn đã mua</h2>

    {!purchases || purchases.length === 0 ? (
  <p className="text-muted-foreground">
    Bạn chưa mua phần thưởng nào trong shop.
  </p>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {purchases.map((p, idx) => (
      <div key={idx} className="border rounded-lg p-4 shadow bg-card">
        <img
          src={p.reward_shop?.image_url || "https://placehold.co/300x200?text=Voucher"}
          alt={p.reward_shop?.name || "Voucher"}
          className="w-full h-40 object-cover rounded mb-3"
        />
        <h3 className="font-semibold mb-1">{p.reward_shop?.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Ngày mua: {new Date(p.purchased_at).toLocaleDateString("vi-VN")}
        </p>
        <p className="text-blue-600 font-medium mb-3">
          Mã voucher: {p.voucher_code}
        </p>
        {p.reward_shop?.product_url && (
          <a
            href={p.reward_shop.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            🔗 Xem sản phẩm
          </a>
        )}
      </div>
    ))}
  </div>
)}

  </section>
)}

      </main>
    </div>
  </div>
);
} 
