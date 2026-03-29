"use client";

import type { ReactNode } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { Pencil, Trash2, X } from "lucide-react";
import type { SavingsAccount } from "@/lib/services/savings";

interface Props {
  account: SavingsAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SavingsActionSheet({
  account,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Popup className="bg-surface fixed right-0 bottom-0 left-0 z-50 flex max-h-[92dvh] flex-col pb-8 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-4">
            <div className="bg-border-strong h-1 w-10 rounded-full" />
          </div>

          <p className="text-foreground-muted px-7 pb-3 text-[11px] font-semibold tracking-[1.5px] uppercase">
            TÙY CHỌN TIẾT KIỆM
          </p>

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
            <Drawer.Close className="bg-surface-elevated text-foreground w-full py-3.5 text-[11px] font-bold tracking-[2px] uppercase">
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
      className={`active:bg-surface-elevated flex w-full items-center gap-4 px-7 py-4 text-left transition-colors ${
        destructive ? "text-status-negative" : "text-foreground"
      }`}
    >
      {icon}
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  );
}
