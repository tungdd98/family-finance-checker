"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  isPending: boolean;
  confirmLabel?: string;
  pendingLabel?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isPending,
  confirmLabel = "XÓA",
  pendingLabel = "ĐANG XÓA...",
}: DeleteConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="bg-surface fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-48px)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-5 p-6 opacity-100 transition-all duration-300 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <Dialog.Title className="text-foreground text-[16px] font-bold">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-foreground-secondary text-[13px]">
            {description}
          </Dialog.Description>
          <div className="flex gap-3">
            <Dialog.Close className="bg-surface-elevated text-foreground flex-1 py-3 text-[11px] font-bold tracking-[2px]">
              HỦY
            </Dialog.Close>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="bg-status-negative flex-1 py-3 text-[11px] font-bold tracking-[2px] text-white disabled:opacity-50"
            >
              {isPending ? pendingLabel : confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
