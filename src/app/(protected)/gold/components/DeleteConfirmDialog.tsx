// src/app/(protected)/gold/components/DeleteConfirmDialog.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { toast } from "sonner";
import { deleteAssetAction } from "@/app/actions/gold";
import type { GoldAsset } from "@/lib/services/gold";

interface Props {
  position: GoldAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteConfirmDialog({ position, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Component is always mounted to support entrance animations

  const handleDelete = () => {
    if (!position) return;
    startTransition(async () => {
      const result = await deleteAssetAction(position.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa tài sản");
        router.refresh();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="bg-surface fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-56px)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-5 p-6 opacity-100 transition-all duration-300 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <Dialog.Title className="text-foreground text-[16px] font-bold">
            Xóa tài sản
          </Dialog.Title>
          <Dialog.Description className="text-foreground-secondary text-[13px]">
            Bạn có chắc muốn xóa tài sản mua{" "}
            {position ? position.quantity - position.sold_quantity : 0} chỉ{" "}
            {position?.brand_name}?
          </Dialog.Description>
          <div className="flex gap-3">
            <Dialog.Close className="bg-surface-elevated text-foreground flex-1 py-3 text-[11px] font-bold tracking-[2px]">
              HỦY
            </Dialog.Close>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="bg-status-negative flex-1 py-3 text-[11px] font-bold tracking-[2px] text-white disabled:opacity-50"
            >
              {isPending ? "ĐANG XÓA..." : "XÓA"}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
