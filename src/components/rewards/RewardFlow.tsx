import { supabase } from "../../supabaseClient";
import confetti from "canvas-confetti";
import { toast } from "../ui/use-toast";

// 🎉 Gọi popup khi user hoàn thành chương đầu tiên
async function openRewardPopup() {
  confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });

  toast({
    title: "🎉 Chúc mừng bạn!",
    description:
      "Bạn vừa hoàn thành chương đầu tiên, hãy chọn 1 phần quà nhé 🎁",
  });
}

// 🧩 Trigger khi user đọc xong chương 1
export async function afterFirstChapterTrigger() {
  const shown = localStorage.getItem("tl_first_reward_shown");
  if (shown) return; // nếu đã hiện rồi → bỏ qua

  // Đánh dấu popup đã hiển thị
  localStorage.setItem("tl_first_reward_shown", "1");

  await openRewardPopup();

  // Nếu user đã login thì thêm record vào user_rewards
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("user_rewards").insert([
      {
        user_id: user.id,
        item_name: "Phần thưởng độc giả mới",
        claimed: false,
      },
    ]);
  }
}

// 🧩 Khi user chọn quà (ví dụ click 1 món)
export async function handleSelectGift(item: any) {
  confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });

  toast({
    title: `🎁 Bạn đã chọn ${item.name}`,
    description: "Hãy đăng nhập để lưu phần thưởng nhé!",
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    localStorage.setItem(
      "tl_reward_pending",
      JSON.stringify({
        item_name: item.name,
        image_url: item.image_url,
        selected_at: new Date().toISOString(),
      })
    );
    return;
  }

  await supabase.from("user_rewards").insert([
    {
      user_id: user.id,
      item_name: item.name,
      claimed: false,
      selected_at: new Date().toISOString(),
    },
  ]);
}

// 🧩 Khi user đăng nhập → đồng bộ phần thưởng
export async function syncPendingReward() {
  const pending = localStorage.getItem("tl_reward_pending");
  if (!pending) return;

  const reward = JSON.parse(pending);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("user_rewards").insert([
      {
        user_id: user.id,
        item_name: reward.item_name,
        image_url: reward.image_url,
        claimed: false,
        selected_at: reward.selected_at,
      },
    ]);

    toast({
      title: "🎉 Đã lưu phần thưởng thành công!",
      description: `Phần thưởng: ${reward.item_name}`,
    });

    localStorage.removeItem("tl_reward_pending");
  }
}
