import { useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useToast } from "../components/ui/use-toast";

// 🪄 Đồng bộ phần thưởng chờ khi user đăng nhập
export function useRewardSync() {
  const { toast } = useToast();

  useEffect(() => {
    const syncPendingReward = async () => {
      const pending = localStorage.getItem("tl_reward_pending");
      if (!pending) return;

      const reward = JSON.parse(pending);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ Convert payload về JSON thật, tránh lỗi type
      const payloadData = {
        item_name: reward.item_name,
        image_url: reward.image_url,
        selected_at: reward.selected_at,
      };

      // ✅ Insert đúng schema (không có reward_id, payload dạng JSONB)
      const { error } = await supabase.from("user_rewards").insert([
        {
          user_id: user.id,
          status: "available",
          claimed: false,
          payload: payloadData,
        },
      ]);

      if (error) {
        console.error("❌ Lỗi khi lưu phần thưởng:", error);
        toast({
          title: "⚠️ Không thể lưu phần thưởng",
          description: "Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
        });
        return;
      }

      toast({
        title: "🎉 Đã lưu phần thưởng thành công!",
        description: `Phần thưởng: ${reward.item_name}`,
      });

      localStorage.removeItem("tl_reward_pending");
      localStorage.setItem("tl_first_reward_shown", "1");
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        syncPendingReward();
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);
}
