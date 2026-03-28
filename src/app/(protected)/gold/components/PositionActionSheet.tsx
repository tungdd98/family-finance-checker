// src/app/(protected)/gold/components/PositionActionSheet.tsx
"use client";

import type { ReactNode } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { Pencil, TrendingUp, Trash2 } from "lucide-react";
import type { GoldAsset } from "@/lib/services/gold";

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
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Popup className="bg-surface fixed right-0 bottom-0 left-0 z-50 flex flex-col pb-8 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          <div className="flex justify-center pt-3 pb-4">
            <div className="bg-border-strong h-1 w-10 rounded-full" />
          </div>

          <p className="text-foreground-muted px-7 pb-3 text-[11px] font-semibold tracking-[1.5px]">
            TÙY CHỌN TÀI SẢN
          </p>

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
            <Drawer.Close className="bg-surface-elevated text-foreground w-full py-3.5 text-[11px] font-bold tracking-[2px]">
              ĐÓNG
            </Drawer.Close>
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
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
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  );
}
