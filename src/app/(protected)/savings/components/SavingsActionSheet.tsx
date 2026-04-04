"use client";

import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { SavingsAccount } from "@/lib/services/savings";
import { ResponsiveActionMenu } from "@/components/common";

interface Props {
  account: SavingsAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SavingsActionSheet({
  account: _account,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: Props) {
  return (
    <ResponsiveActionMenu open={open} onOpenChange={onOpenChange}>
      <p className="type-section-label px-7 pb-3">TÙY CHỌN TIẾT KIỆM</p>

      <ActionItem
        icon={<Pencil size={16} />}
        label="Chỉnh sửa"
        onClick={() => {
          onOpenChange(false);
          onEdit();
        }}
      />
      <ActionItem
        icon={<Trash2 size={16} />}
        label="Xóa khoản tiết kiệm"
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
          className="bg-surface-elevated text-foreground w-full py-3.5 text-[11px] font-bold uppercase"
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
      className={`active:bg-surface-elevated flex w-full items-center gap-4 px-7 py-4 text-left transition-colors ${
        destructive ? "text-status-negative" : "text-foreground"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
