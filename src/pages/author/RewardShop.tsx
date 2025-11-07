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
      .select("id, name, description, cost_coin, voucher_perc, image_url, stock")
      .eq("active", true)
      .gt("stock", 0)
      .order("cost_coin", { ascending: true });

    if (!error && data) setRewards(data);
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

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">🎁 Reward Shop</h1>
      <p className="text-center text-muted-foreground mb-8">
        Dùng xu để đổi quà yêu thích của bạn. <br />
        <strong>Xu hiện tại: {balance} xu</strong>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {rewards.map((r) => (
          <Card
            key={r.id}
            className="overflow-hidden border border-border hover:shadow-md transition-all"
          >
            <img
              src={r.image_url || "https://placehold.co/300x200?text=Reward"}
              alt={r.name}
              className="w-full h-40 object-cover"
            />
            <CardHeader>
              <CardTitle className="text-lg font-bold">{r.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <p className="text-sm text-blue-600">
                🎫 Voucher giảm {r.voucher_perc || 0}%
              </p>
              <p className="font-semibold">💰 {r.cost_coin} xu</p>
              <Button onClick={() => handleBuy(r.id, r.cost_coin)}>Mua ngay</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
