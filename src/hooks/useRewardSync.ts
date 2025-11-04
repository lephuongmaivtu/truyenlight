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

      if (user) {
        const { error } = await supabase.from("user_rewards").insert([
          {
            user_id: user.id,
            status: "available",
            claimed: false,
            payload: reward,
          },
        ]);

        if (!error) {
          toast({
            title: "🎉 Đã lưu phần thưởng thành công!",
            description: `Phần thưởng: ${reward.item_name}`,
          });
          localStorage.removeItem("tl_reward_pending");
          localStorage.setItem("tl_first_reward_shown", "1");
        } else {
          console.error("❌ Lỗi khi lưu phần thưởng:", error);
        }
      }
    };

    // Lắng nghe sự kiện đăng nhập
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        syncPendingReward();
      }
    });

    // Cleanup khi unmount
    return () => subscription.unsubscribe();
  }, [toast]);
}
