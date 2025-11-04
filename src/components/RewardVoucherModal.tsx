import React from "react";
import { Button } from "./ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  reward: {
    name: string;
    image_url: string;
    voucher_code: string;
    product_url?: string | null;
  } | null;
};

export default function RewardVoucherModal({ open, onClose, reward }: Props) {
  if (!open || !reward) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(reward.voucher_code);
    alert("Đã copy mã: " + reward.voucher_code);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center">
      <div className="bg-card border border-border rounded-2xl w-[92%] max-w-md p-5 text-center">
        <img
          src={reward.image_url || "https://placehold.co/300x200?text=Reward"}
          alt={reward.name}
          className="w-full h-40 object-cover rounded-lg mb-3"
        />
        <h3 className="text-xl font-bold mb-2">{reward.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Đây là mã voucher dành riêng cho bạn:
        </p>

        <div className="bg-muted rounded-lg px-4 py-2 font-mono text-lg mb-3">
          {reward.voucher_code}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={copy}>Copy mã</Button>
          {reward.product_url ? (
            <Button asChild>
              <a href={reward.product_url} target="_blank" rel="noreferrer">
                Mua trên Shopee
              </a>
            </Button>
          ) : (
            <Button disabled>Chưa có link</Button>
          )}
        </div>

        <Button className="w-full mt-3" variant="ghost" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}
