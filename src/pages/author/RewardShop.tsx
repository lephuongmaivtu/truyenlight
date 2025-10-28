import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useBalance } from "@/hooks/useBalance";

type Reward = {
  id: string;
  name: string;
  type: 'voucher'|'product';
  description?: string;
  cost_coin: number;
  voucher_percent?: number | null;
  product_url?: string | null;
  stock?: number | null;
};

export default function RewardShop() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const { coin, refresh } = useBalance();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("reward_shop")
        .select("id,name,type,description,cost_coin,voucher_percent,product_url,stock")
        .eq("active", true)
        .order("cost_coin", { ascending: true });
      setRewards(data as Reward[] || []);
      setLoading(false);
    })();
  }, []);

  const redeem = async (rewardId: string) => {
    setMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // insert -> trigger BEFORE INSERT sẽ trừ xu + sinh voucher code
    const { data, error } = await supabase
      .from("user_rewards")
      .insert({ user_id: user.id, reward_id: rewardId })
      .select()
      .single();

    if (error) {
      setMessage(error.message || "Đổi quà thất bại.");
    } else {
      await refresh();
      const payload = (data as any).payload;
      if (payload?.voucher_code) {
        setMessage(`Đã đổi voucher: ${payload.voucher_code} (-${payload.percent}%).`);
      } else {
        setMessage(`Đã đổi quà thành công!`);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🎁 Cửa hàng đổi thưởng</h2>
        <div className="text-sm">Ví: <b>{coin}</b> xu</div>
      </div>

      {message && <div className="mb-3 p-3 rounded bg-emerald-50 border">{message}</div>}
      {loading ? <div>Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rewards.map(r => (
            <div key={r.id} className="border rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="font-semibold">{r.name}</div>
                {r.description && <div className="text-sm opacity-70">{r.description}</div>}
                <div className="text-sm mt-1">Giá: <b>{r.cost_coin}</b> xu</div>
                {r.type === 'voucher' && <div className="text-xs opacity-70">Voucher {r.voucher_percent}%</div>}
                {r.type === 'product' && r.product_url && (
                  <a className="text-xs underline opacity-80" href={r.product_url} target="_blank" rel="noreferrer">Xem sản phẩm</a>
                )}
              </div>
              <button
                className="mt-3 px-3 py-2 rounded bg-black text-white disabled:bg-gray-300"
                onClick={() => redeem(r.id)}
                disabled={coin < r.cost_coin}
              >
                Đổi ngay
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
