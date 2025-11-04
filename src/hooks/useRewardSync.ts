// src/hooks/useRewardSync.ts
import { useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useToast } from "../components/ui/use-toast";

export function useRewardSync() {
  const { toast } = useToast();

  useEffect(() => {
    const syncPendingReward = async () => {
      const pending = localStorage.getItem("tl_reward_pending");
      if (!pending) return;

      const reward = JSON.parse(pending);

      // Lấy user hiện tại
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("⏳ User chưa sẵn sàng, thử lại sau 1s...");
        await new Promise((r) => setTimeout(r, 1000));
        ({ data: { user } } = await supabase.auth.getUser());
      }

      if (!user) return;

      // ✅ Chuẩn hóa JSONB
      const payloadData = {
        item_name: reward.item_name,
        image_url: reward.image_url,
        selected_at: reward.selected_at,
      };

      const { error } = await supabase.from("user_rewards").insert([
        {
          user_id: user.id,
          status: "pending",
          claimed: false,
          source: "popup",
          payload: payloadData, // jsonb
        },
      ]);

      if (error) {
        console.error("❌ Lỗi khi lưu phần thưởng:", error);
        toast({
          title: "⚠️ Không thể lưu phần thưởng",
          description: "Vui lòng thử lại sau.",
        });
        return;
      }

      toast({
        title: "🎉 Đã lưu phần thưởng thành công!",
        description: `Phần thưởng: ${payloadData.item_name}`,
      });

      localStorage.removeItem("tl_reward_pending");
      localStorage.setItem("tl_first_reward_shown", "1");
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        console.log("✅ Đã đăng nhập, bắt đầu đồng bộ phần thưởng...");
        syncPendingReward();
      }
    });

    return () => {
      subscription?.subscription?.unsubscribe?.();
    };
  }, [toast]);
}
