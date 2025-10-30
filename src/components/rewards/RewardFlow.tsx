"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { supabase } from "../../supabaseClient";
import { useToast } from "../ui/use-toast";


// 🎁 Danh sách 5 quà tặng có sẵn

const GIFTS = [
  {
    id: 1,
    name: "Tai nghe Bluetooth Pro4",
    image_url: "https://i.ibb.co/gJQy5tz/Tai-nghe-Pro4.jpg",
  },
  {
    id: 2,
    name: "Áo thun cổ tròn",
    image_url: "https://i.ibb.co/0tJ7vD5/Ao-thun.jpg",
  },
  {
    id: 3,
    name: "Ốp lưng điện thoại",
    image_url: "https://i.ibb.co/dgKH3Zm/Op-lung.jpg",
  },
  {
    id: 4,
    name: "Túi tote canvas",
    image_url: "https://i.ibb.co/T2LQStK/Tui-tote.jpg",
  },
  {
    id: 5,
    name: "Voucher 50% giảm giá",
    image_url: "https://i.ibb.co/jw6dyLJ/Voucher.jpg",
  },
];

// 🧱 Custom dialog không dùng Radix (Vercel-friendly)
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
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

export default function RewardFlow() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);

  // ✅ Khi user đọc xong chương đầu tiên
  useEffect(() => {
    const shown = localStorage.getItem("tl_first_reward_shown");
    if (!shown) {
      const trigger = localStorage.getItem("tl_trigger_reward_popup");
      if (trigger === "1") {
        setOpen(true);
        localStorage.setItem("tl_first_reward_shown", "1");
        localStorage.removeItem("tl_trigger_reward_popup");
      }
    }
  }, []);

  // 🎉 Khi chọn quà
  const handleSelectGift = async (gift: any) => {
    setSelectedGift(gift);

    // Confetti effect
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    toast({
      title: `🎁 Bạn đã chọn ${gift.name}`,
      description: "Hãy đăng nhập để lưu phần thưởng nhé!",
    });

    // Nếu chưa đăng nhập → lưu local
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

    // Nếu có user → lưu Supabase
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
  };

  return (
    <CustomDialog open={open} onClose={() => setOpen(false)}>
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-2xl font-bold text-primary">
          🎉 Chúc mừng bạn đã hoàn thành chương đầu tiên!
        </h2>
        <p className="text-muted-foreground">
          Hãy chọn 1 phần quà dành riêng cho độc giả mới 🎁
        </p>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {GIFTS.map((gift) => (
            <div
              key={gift.id}
              className={`border rounded-lg p-3 cursor-pointer transition transform hover:scale-105 hover:border-primary ${
                selectedGift?.id === gift.id ? "border-primary ring-2 ring-primary" : ""
              }`}
              onClick={() => handleSelectGift(gift)}
            >
              <img
                src={gift.image_url}
                alt={gift.name}
                className="w-full h-28 object-cover rounded-md mb-2"
              />
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

// 🪄 Gọi khi user đọc xong chương 1
export async function afterFirstChapterTrigger() {
  const shown = localStorage.getItem("tl_first_reward_shown");
  if (shown) return;
  localStorage.setItem("tl_trigger_reward_popup", "1");
}

// 🪄 Khi user đăng nhập → sync phần thưởng chờ
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
