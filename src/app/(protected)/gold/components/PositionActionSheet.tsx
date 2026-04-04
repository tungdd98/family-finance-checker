// src/app/(protected)/gold/components/PositionActionSheet.tsx
"use client";

import type { ReactNode } from "react";
import { Pencil, TrendingUp, Trash2 } from "lucide-react";
import type { GoldAsset } from "@/lib/services/gold";
import { ResponsiveActionMenu } from "@/components/common";

interface Props {
  position: GoldAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onSell: () => void;
  onDelete: () => void;
}

export function PositionActionSheet({
  position,
  open,
  onOpenChange,
  onEdit,
  onSell,
  onDelete,
}: Props) {
  const remaining = position ? position.quantity - position.sold_quantity : 0;

  return (
    <ResponsiveActionMenu open={open} onOpenChange={onOpenChange}>
      <p className="type-section-label px-7 pb-3">TÙY CHỌN TÀI SẢN</p>

      <ActionItem
        icon={<Pencil size={16} />}
        label="Chỉnh sửa"
        onClick={() => {
          onOpenChange(false);
          onEdit();
        }}
      />
      {remaining > 0 && (
        <ActionItem
          icon={<TrendingUp size={16} />}
          label="Bán tài sản"
          onClick={() => {
            onOpenChange(false);
            onSell();
          }}
        />
      )}
      <ActionItem
        icon={<Trash2 size={16} />}
        label="Xóa tài sản"
        destructive
        onClick={() => {
          onOpenChange(false);
          onDelete();
        }}
      />

      <div className="px-7 pt-4">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="bg-surface-elevated text-foreground w-full py-3.5 text-[11px] font-bold"
        >
          ĐÓNG
        </button>
      </div>
    </ResponsiveActionMenu>
  );
}

function ActionItem({
  icon,
  label,
  destructive = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 px-7 py-4 text-left ${
        destructive ? "text-status-negative" : "text-foreground"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
