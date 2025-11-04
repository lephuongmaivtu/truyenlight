import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

type Checkin = {
  id: string;
  user_id: string;
  day_number: number;
  checked_at: string;
};

export default function CheckInPanel() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [doing, setDoing] = useState(false);

  // Lấy user
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    })();
  }, []);

  // Load checkins (tối đa 21 để hiển thị nhanh)
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_checkins")
        .select("id,user_id,day_number,checked_at")
        .eq("user_id", userId)
        .order("day_number", { ascending: true });
      if (!error && data) setCheckins(data as Checkin[]);
      setLoading(false);
    })();
  }, [userId]);

  const currentDay = useMemo(() => {
    if (!checkins.length) return 1;
    const maxDay = Math.max(...checkins.map(c => c.day_number));
    return Math.min(maxDay + 1, 21);
  }, [checkins]);

  const alreadyCheckedToday = useMemo(() => {
    if (!checkins.length) return false;
    const today = new Date().toISOString().split("T")[0];
    return checkins.some(c => (c.checked_at || "").slice(0, 10) === today);
  }, [checkins]);

  const reached21 = useMemo(() => {
    return checkins.some(c => c.day_number === 21);
  }, [checkins]);

  const handleCheckin = async () => {
    if (!userId || doing) return;
    if (alreadyCheckedToday) return;

    try {
      setDoing(true);

      // 1) Ghi checkin (day_number = currentDay)
      const { error: cErr } = await supabase
        .from("user_checkins")
        .insert([{ user_id: userId, day_number: currentDay }]);
      if (cErr) throw cErr;

      // 2) Cộng 10 xu
      const { error: coinErr } = await supabase.rpc("add_coins", {
        p_user_id: userId,
        p_amount: 10,
      });
      if (coinErr) throw coinErr;

      // 3) Nếu đạt 21 → chuyển status wishlist popup sang available
      if (currentDay === 21) {
        const { error: updErr } = await supabase
          .from("user_rewards")
          .update({ status: "available" })
          .eq("user_id", userId)
          .eq("source", "popup");
        if (updErr) throw updErr;
      }

      toast({ title: "✅ Điểm danh thành công!", description: "+10 xu đã cộng vào tài khoản." });

      // reload
      const { data } = await supabase
        .from("user_checkins")
        .select("id,user_id,day_number,checked_at")
        .eq("user_id", userId)
        .order("day_number", { ascending: true });
      setCheckins((data as Checkin[]) || []);
    } catch (e: any) {
      console.error("Checkin error:", e);
      toast({ title: "❌ Lỗi điểm danh", description: e?.message || "Thử lại sau nhé." });
    } finally {
      setDoing(false);
    }
  };

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-4 rounded-lg bg-muted/30 border">
        <p className="text-sm">Hãy đăng nhập để điểm danh và nhận quà 21 ngày nhé.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 rounded-lg bg-muted/30 border">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Tiến độ: <span className="font-medium">{Math.min(checkins.length, 21)}/21</span> ngày
          </p>
          {!reached21 ? (
            <p className="text-xs text-muted-foreground">
              Điểm danh đủ <b>21 ngày liên tục</b> để mở hộp quà wishlist của bạn.
            </p>
          ) : (
            <p className="text-xs text-green-600">
              🎉 Bạn đã đủ 21 ngày — hãy vào Hồ sơ để mở hộp quà!
            </p>
          )}
        </div>

        <Button
          disabled={loading || doing || alreadyCheckedToday || reached21}
          onClick={handleCheckin}
        >
          {alreadyCheckedToday ? "Đã điểm danh hôm nay" : reached21 ? "Đã đạt 21 ngày" : "Điểm danh hôm nay (+10 xu)"}
        </Button>
      </div>

      {/* Track 21 ô đơn giản */}
      <div className="grid grid-cols-7 gap-2 mt-4">
        {Array.from({ length: 21 }).map((_, i) => {
          const day = i + 1;
          const done = checkins.some(c => c.day_number === day);
          return (
            <div
              key={day}
              className={`h-8 rounded flex items-center justify-center text-xs border
                ${done ? "bg-green-600 text-white border-green-700" : "bg-card text-foreground"}`}
              title={`Ngày ${day}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
