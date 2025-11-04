import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function ProfileRewards() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRewards() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRewards([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", user.id)
        .order("selected_at", { ascending: false });

      if (!error && data) setRewards(data);
      setLoading(false);
    }

    fetchRewards();
  }, []);

  if (loading) return <div className="p-6 text-center text-muted-foreground">Đang tải phần thưởng...</div>;
  if (rewards.length === 0)
    return <div className="p-6 text-center text-muted-foreground">Bạn chưa có phần thưởng nào 🎁</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-primary">🎁 Quà của tôi</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {rewards.map((r) => (
          <div key={r.id} className="border rounded-lg p-3 text-center bg-card shadow-sm">
            <img src={r.image_url} alt={r.item_name} className="w-full h-28 object-cover rounded-md mb-2" />
            <p className="font-medium">{r.item_name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(r.selected_at).toLocaleDateString("vi-VN")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
