"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { toast } from "sonner";

import { deleteSavingsAction } from "@/app/actions/savings";
import type { SavingsAccount } from "@/lib/services/savings";
import { formatVND } from "@/lib/gold-utils";

interface Props {
  account: SavingsAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSavingsDialog({ account, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!account) return;
    startTransition(async () => {
      const result = await deleteSavingsAction(account.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa khoản tiết kiệm");
        router.refresh();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="bg-surface fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-40px)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-5 p-6 opacity-100 transition-all duration-300 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <Dialog.Title className="text-foreground text-[16px] font-bold">
            Xóa khoản tiết kiệm
          </Dialog.Title>
          <Dialog.Description className="text-foreground-secondary text-[13px]">
            Bạn có chắc muốn xóa khoản tiết kiệm{" "}
            <span className="text-foreground font-semibold">
              {account?.account_name || account?.bank_name}
            </span>{" "}
            — gốc {account ? formatVND(account.principal) : ""}?
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
