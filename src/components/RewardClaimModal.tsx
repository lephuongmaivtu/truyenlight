import React from "react";
import { Button } from "./ui/button";

export default function RewardClaimModal({ reward, onClose }: any) {
  if (!reward) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl w-[90%] max-w-md text-center shadow-lg">
        <h2 className="text-xl font-bold mb-3 text-primary">
          🎉 Chúc mừng bạn đã nhận được phần thưởng 21 ngày!
        </h2>

        <p className="text-muted-foreground mb-2">
          Đây là mã voucher dành riêng cho bạn:
        </p>

        <div className="bg-muted py-2 px-4 rounded-lg font-mono text-lg tracking-wide select-all mb-3">
          {reward.voucher_code}
        </div>

        <Button asChild className="w-full mb-2">
          <a href={reward.product_url} target="_blank" rel="noopener noreferrer">
            Mua ngay trên Shopee
          </a>
        </Button>

        <Button variant="outline" className="w-full" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}
