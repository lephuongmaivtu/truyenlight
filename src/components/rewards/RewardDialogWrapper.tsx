"use client";

import React from "react";
import { Dialog, DialogContent } from "../ui/dialog";

/**
 * Wrapper để tránh lỗi build của Vercel khi import Radix Dialog trực tiếp.
 * Sử dụng <RewardDialog> thay vì gọi trực tiếp <Dialog> và <DialogContent>.
 */
export function RewardDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}
