"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { supabase } from "../../supabaseClient";
import { useToast } from "../../components/ui/use-toast";

// 🎁 Danh sách quà tặng
const GIFTS = [
  { id: 1, name: "Tai nghe Bluetooth Pro4", image_url: "https://i.ibb.co/nNWtrB5W/t-i-xu-ng-63.jpg" },
  { id: 2, name: "Áo thun cổ tròn", image_url: "https://i.ibb.co/nNWtrB5W/t-i-xu-ng-63.jpg" },
  { id: 3, name: "Ốp lưng điện thoại", image_url: "https://i.ibb.co/nNWtrB5W/t-i-xu-ng-63.jpg" },
  { id: 4, name: "Túi tote canvas", image_url: "https://i.ibb.co/nNWtrB5W/t-i-xu-ng-63.jpg" },
  { id: 5, name: "Voucher 50% giảm giá", image_url: "https://i.ibb.co/nNWtrB5W/t-i-xu-ng-63.jpg" },
];

// 🧱 Custom Dialog
function CustomDialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 w-[90%] max-w-md relative animate-in fade-in-0 zoom-in-95">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// ✅ Component chính
export default function RewardFlow() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);

  // ✅ Lắng nghe event popup
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      console.log("🎉 Pop-up hiện ngay lập tức sau khi bấm Sau!");
    };

    window.addEventListener("openRewardPopup", handler);
    return () => window.removeEventListener("openRewardPopup", handler);
  }, []);

  // ✅ Khi user đọc xong chương đầu tiên
  useEffect(() => {
    const shown = localStorage.getItem("tl_first_reward_shown");
    const trigger = localStorage.getItem("tl_trigger_reward_popup");

    if (!shown && trigger === "1") {
      setTimeout(() => {
        setOpen(true);
        console.log("🎉 Pop-up phần thưởng mở!");
      }, 600);
    }
  }, []);

  // 🎉 Khi chọn quà
  const handleSelectGift = async (gift: any) => {
    setSelectedGift(gift);

    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    toast({
      title: `🎁 Bạn đã chọn ${gift.name}`,
      description: "Hãy đăng nhập để lưu phần thưởng nhé!",
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      localStorage.setItem(
        "tl_reward_pending",
        JSON.stringify({
          item_name: gift.name,
          image_url: gift.image_url,
          selected_at: new Date().toISOString(),
        })
      );
      return;
    }

    await supabase.from("user_rewards").insert([
      {
        user_id: user.id,
        item_name: gift.name,
        image_url: gift.image_url,
        claimed: false,
        selected_at: new Date().toISOString(),
      },
    ]);

    toast({
      title: "🎉 Đã lưu phần thưởng thành công!",
      description: `Phần thưởng: ${gift.name}`,
    });

    setOpen(false);
    localStorage.setItem("tl_first_reward_shown", "1");
  };

  return (
    <CustomDialog open={open} onClose={() => setOpen(false)}>
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-2xl font-bold text-primary">🎉 Chúc mừng bạn đã hoàn thành chương đầu tiên!</h2>
        <p className="text-muted-foreground">Hãy chọn 1 phần quà dành riêng cho độc giả mới 🎁</p>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {GIFTS.map((gift) => (
            <div
              key={gift.id}
              className={`border rounded-lg p-3 cursor-pointer transition transform hover:scale-105 hover:border-primary ${
                selectedGift?.id === gift.id ? "border-primary ring-2 ring-primary" : ""
              }`}
              onClick={() => handleSelectGift(gift)}
            >
              <img src={gift.image_url} alt={gift.name} className="w-full h-28 object-cover rounded-md mb-2" />
              <p className="text-sm font-medium">{gift.name}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Sau khi chọn quà, bạn hãy đăng nhập để hệ thống lưu phần thưởng nhé 💫
        </p>
      </div>
    </CustomDialog>
  );
}

// 🪄 Trigger khi user đọc xong chương đầu
export async function afterFirstChapterTrigger() {
  const shown = localStorage.getItem("tl_first_reward_shown");
  if (shown) return;
  localStorage.setItem("tl_trigger_reward_popup", "1");
}

// 🪄 Đồng bộ phần thưởng chờ sau khi login
export async function syncPendingReward(toast?: any) {
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

    if (toast) {
      toast({
        title: "🎉 Đã lưu phần thưởng thành công!",
        description: `Phần thưởng: ${reward.item_name}`,
      });
    }

    localStorage.removeItem("tl_reward_pending");
  }
}
