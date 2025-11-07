import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RewardShop() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    init();
  }, []);

  
  useEffect(() => {
  fetchRewards();

  // Subcribe realtime
  const channel = supabase
    .channel("reward_shop_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "reward_shop" },
      (payload) => {
        console.log("🔄 Reward shop changed:", payload);
        fetchRewards(); // reload danh sách
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);


  const init = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    setUser(userData.user);
    await fetchBalance(userData.user.id);
    await fetchRewards();
  };

  const fetchBalance = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (!error && data) setBalance(data.balance);
  };

 const fetchRewards = async () => {
  const { data, error } = await supabase
    .from("reward_shop")
    .select(`
      id,
      name,
      type,
      description,
      cost_coin,
      voucher_percent,
      voucher_code,
      product_url,
      stock,
      active,
      image_url
    `)
    .eq("active", true)
    .gt("stock", 0)
    .order("cost_coin", { ascending: true });

  if (error) {
    console.error("❌ Lỗi fetch reward_shop:", error.message);
  } else {
    console.log("✅ Rewards:", data);
    setRewards(data);
  }
};



  const handleBuy = async (rewardId: string, cost: number) => {
    if (!user) {
      alert("Vui lòng đăng nhập để mua phần thưởng!");
      return;
    }

    try {
      const { data, error } = await supabase.rpc("buy_reward_item", {
        p_user_id: user.id,
        p_reward_id: rewardId,
      });

      if (error) throw error;

      alert(`${data.message}\n📦 Mã voucher của bạn: ${data.voucher_code}`);
      setBalance(data.remaining_balance);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRedeem = async (rewardId: string, cost: number) => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    alert("Vui lòng đăng nhập để đổi thưởng!");
    return;
  }

  const { data, error } = await supabase.rpc("redeem_reward", {
    p_user_id: user.id,
    p_reward_id: rewardId,
  });

  if (error) {
    alert("❌ " + (error.message || "Lỗi khi đổi quà!"));
    console.error(error);
    return;
  }

  alert(`🎁 ${data.message}\nMã voucher: ${data.voucher_code}`);

  // Reload lại số xu + danh sách quà
  fetchBalance();
  fetchRewards();
};

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">🎁 Reward Shop</h1>
      <p className="text-center text-muted-foreground mb-8">
        Dùng xu để đổi quà yêu thích của bạn. <br />
        <strong>Xu hiện tại: {balance} xu</strong>
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {rewards.map((r) => (
          <Card
            key={r.id}
            className="overflow-hidden border border-border hover:shadow-md transition-all"
          >
            <div className="w-full aspect-square overflow-hidden">
              <img
                src={r.image_url || "https://placehold.co/300x300?text=Reward"}
                alt={r.name}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>

            <div className="px-2 pt-1">
  <h3 className="text-sm font-semibold leading-tight mb-0">{r.name}</h3>
</div>

<CardContent className="px-2 pt-0 -mt-1 flex flex-col space-y-2 min-h-[120px]">

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {r.description}
                  </p>
                  
                  {r.type === "voucher" && r.voucher_percent ? (
                    <p className="text-red-500 text-sm font-medium">🔥 Giảm {r.voucher_percent}%</p>
                  ) : (
                    <p className="text-blue-500 text-sm font-medium">🛍️ Sản phẩm đổi thưởng</p>
                  )}
                  
                  <p className="text-sm font-semibold text-orange-600">💰 {r.cost_coin} xu</p>
                  <p className="text-xs text-gray-500">🏷️ Còn lại: {r.stock ?? 0} cái</p>
                  
                 <Button
                  size="sm"
                  className="
                    w-full mt-2
                    bg-black text-white font-semibold
                    hover:bg-neutral-800
                    dark:bg-white dark:text-black dark:hover:bg-neutral-100
                    rounded-md text-sm py-2
                    transition-all duration-200
                  "
                  onClick={() => handleRedeem(r.id, r.cost_coin)}
                >
                  🎁 Đổi quà
                </Button>




              </CardContent>

          </Card>
        ))}
      </div>
    </div>
  );
}
