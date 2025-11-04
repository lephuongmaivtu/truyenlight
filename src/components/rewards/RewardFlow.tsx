"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { supabase } from "../../supabaseClient";
import { useToast } from "../../components/ui/use-toast";

// 🎁 Danh sách quà mẫu
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

// 🧩 Kiểm tra điều kiện hiển thị pop-up
function shouldShowRewardPopup() {
  const today = new Date().toISOString().split("T")[0];
  const lastShown = localStorage.getItem("tl_last_reward_popup_date");
  const hasPending = !!localStorage.getItem("tl_reward_pending");
  const firstRewardShown = !!localStorage.getItem("tl_first_reward_shown");

  return ((!firstRewardShown || hasPending) && lastShown !== today);
}

// ✅ Component chính
export default function RewardFlow() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);

  // 🎧 Lắng nghe event từ ChapterReader
  useEffect(() => {
    const handler = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let alreadyClaimed = false;

      if (user) {
        const { data: rewards } = await supabase
          .from("user_rewards")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        alreadyClaimed = rewards && rewards.length > 0;
      }

      if (!alreadyClaimed && shouldShowRewardPopup()) {
        setOpen(true);
        localStorage.setItem(
          "tl_last_reward_popup_date",
          new Date().toISOString().split("T")[0]
        );
        console.log("🎉 Pop-up hiện sau khi đọc xong chương!");
      }
    };

    window.addEventListener("tryOpenRewardPopup", handler);
    return () => window.removeEventListener("tryOpenRewardPopup", handler);
  }, []);

  // 🪄 Khi user chọn quà
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

    // Nếu chưa đăng nhập: lưu localStorage
    if (!user) {
      localStorage.setItem(
        "tl_reward_pending",
        JSON.stringify({
          item_name: gift.name,
          image_url: gift.image_url,
          selected_at: new Date().toISOString(),
        })
      );
      setOpen(false);
      return;
    }

    // Nếu đã đăng nhập: lưu vào Supabase
    await supabase.from("user_rewards").insert([
      {
        user_id: user.id,
        status: "available",
        claimed: false,
        payload: {
          item_name: gift.name,
          image_url: gift.image_url,
          selected_at: new Date().toISOString(),
        },
      },
    ]);

    localStorage.setItem("tl_first_reward_shown", "1");
    localStorage.removeItem("tl_reward_pending");

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
          🎉 Chúc mừng bạn đã hoàn thành chương!
        </h2>
        <p className="text-muted-foreground">
          Hãy chọn 1 phần quà dành riêng cho bạn 🎁
        </p>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {GIFTS.map((gift) => (
            <div
              key={gift.id}
              className={`border rounded-lg p-3 cursor-pointer transition transform hover:scale-105 hover:border-primary ${
                selectedGift?.id === gift.id
                  ? "border-primary ring-2 ring-primary"
                  : ""
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
