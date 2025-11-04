import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RewardShop() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    fetchRewards();
    fetchBalance();
  }, []);

  const fetchRewards = async () => {
    const { data, error } = await supabase
      .from("reward_catalog")
      .select("id, name, cost, image_url, description")
      .order("cost", { ascending: true });
    if (!error && data) setRewards(data);
  };

  const fetchBalance = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("user_balances")
      .select("coins")
      .eq("user_id", user.id)
      .single();

    if (!error && data) setBalance(data.coins);
  };

  const handleRedeem = async (rewardId: string, cost: number) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      alert("Vui lòng đăng nhập để đổi thưởng!");
      return;
    }

    if (balance < cost) {
      alert("Không đủ xu để đổi phần thưởng này.");
      return;
    }

    const { error } = await supabase.from("user_rewards").insert([
      {
        user_id: user.id,
        reward_id: rewardId,
        source: "shop",
        status: "available",
      },
    ]);

    if (error) {
      console.error(error);
      alert("Lỗi khi đổi thưởng!");
    } else {
      await supabase
        .from("user_balances")
        .update({ coins: balance - cost })
        .eq("user_id", user.id);

      setBalance((prev) => prev - cost);
      alert("🎁 Đổi quà thành công!");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">🎁 Reward Shop</h1>
      <p className="text-center text-muted-foreground mb-8">
        Dùng xu để đổi quà yêu thích của bạn. Số xu hiện tại:{" "}
        <strong>{balance} xu</strong>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {rewards.map((r) => (
          <Card key={r.id} className="overflow-hidden border border-border hover:shadow-md">
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
              <p className="font-semibold">💰 {r.cost} xu</p>
              <Button
                onClick={() => handleRedeem(r.id, r.cost)}
                className="w-full"
              >
                Đổi quà
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
