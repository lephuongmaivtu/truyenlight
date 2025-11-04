import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";

type Reward = {
  id: string;
  name: string;
  image_url: string | null;
  cost: number;
  reward_type: "shop" | "popup";
  description: string | null;
  is_active: boolean;
};

export default function RewardShop() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [doingId, setDoingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id ?? null;
      setUserId(uid);

      // load rewards shop
      const { data: r } = await supabase
        .from("rewards")
        .select("id,name,image_url,cost,reward_type,description,is_active")
        .eq("reward_type", "shop")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setRewards((r as Reward[]) || []);

      if (uid) {
        const { data: bal } = await supabase
          .from("user_balances")
          .select("coins")
          .eq("user_id", uid)
          .single();
        setBalance(bal?.coins ?? 0);
      }

      setLoading(false);
    })();
  }, []);

  const handleExchange = async (reward: Reward) => {
    if (!userId) {
      toast({ title: "⚠️ Vui lòng đăng nhập", description: "Bạn cần đăng nhập để đổi quà." });
      return;
    }
    if (balance < reward.cost) {
      toast({ title: "❌ Không đủ xu", description: "Bạn chưa đủ xu để đổi quà này." });
      return;
    }

    try {
      setDoingId(reward.id);
      const { error } = await supabase.rpc("exchange_reward", {
        p_user_id: userId,
        p_reward_id: reward.id,
      });
      if (error) throw error;

      toast({ title: "🎉 Đổi quà thành công!", description: `Bạn vừa đổi: ${reward.name}` });

      // reload balance
      const { data: bal } = await supabase
        .from("user_balances")
        .select("coins")
        .eq("user_id", userId)
        .single();
      setBalance(bal?.coins ?? 0);
    } catch (e: any) {
      console.error("exchange error:", e);
      toast({ title: "❌ Lỗi đổi quà", description: e?.message || "Thử lại sau." });
    } finally {
      setDoingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reward Shop</h1>
        <div className="text-sm text-muted-foreground">
          Xu hiện có: <span className="font-semibold">{balance}</span>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Đang tải phần thưởng…</p>
      ) : rewards.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Chưa có phần thưởng nào.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {rewards.map((rw) => (
            <div key={rw.id} className="border rounded-lg p-3 bg-card">
              <img
                src={rw.image_url || ""}
                alt={rw.name}
                className="w-full h-32 object-cover rounded"
              />
              <p className="mt-2 font-medium">{rw.name}</p>
              {rw.description && <p className="text-xs text-muted-foreground mt-1">{rw.description}</p>}
              <p className="text-sm mt-2">Giá: <b>{rw.cost}</b> xu</p>
              <Button
                className="mt-3 w-full"
                disabled={doingId === rw.id}
                onClick={() => handleExchange(rw)}
              >
                {doingId === rw.id ? "Đang đổi..." : "Đổi quà"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
