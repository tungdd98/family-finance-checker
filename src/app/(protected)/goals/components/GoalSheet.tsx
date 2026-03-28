// src/app/(protected)/goals/components/GoalSheet.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { goalSchema, type GoalInput } from "@/lib/validations/goals";
import type { Goal } from "@/lib/services/goals";
import { saveGoalAction } from "@/app/actions/goals";

interface Props {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatVND(n: number) {
  return n > 0 ? new Intl.NumberFormat("vi-VN").format(n) : "";
}

export function GoalSheet({ goal, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [amountDisplay, setAmountDisplay] = useState("");

  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      emoji: "🎯",
      target_amount: 0,
      deadline: null,
      note: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (goal) {
        form.reset({
          name: goal.name,
          emoji: goal.emoji,
          target_amount: goal.target_amount,
          deadline: goal.deadline ?? null,
          note: goal.note ?? null,
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAmountDisplay(formatVND(goal.target_amount));
      } else {
        form.reset({
          name: "",
          emoji: "🎯",
          target_amount: 0,
          deadline: null,
          note: null,
        });

        setAmountDisplay("");
      }
    }
  }, [open, goal, form]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = raw ? parseInt(raw, 10) : 0;
    setAmountDisplay(raw ? formatVND(num) : "");
    form.setValue("target_amount", num, { shouldValidate: true });
  };

  const onSubmit = (data: GoalInput) => {
    startTransition(async () => {
      const result = await saveGoalAction(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(goal ? "Đã cập nhật mục tiêu" : "Đã đặt mục tiêu");
        router.refresh();
        onOpenChange(false);
      }
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          <div className="bg-background border-border sticky top-0 flex items-center justify-between border-b px-5 pt-5 pb-4">
            <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
              {goal ? "Chỉnh sửa mục tiêu" : "Đặt mục tiêu"}
            </span>
            <Drawer.Close className="text-foreground-muted">
              <X size={20} />
            </Drawer.Close>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-5 py-5 pb-10"
          >
            {/* Emoji + Tên */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                  Icon
                </label>
                <input
                  {...form.register("emoji")}
                  className="bg-surface border-border text-foreground w-14 border p-3 text-center text-xl"
                  maxLength={2}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                  Tên mục tiêu *
                </label>
                <input
                  {...form.register("name")}
                  className="bg-surface border-border text-foreground border p-3 text-[15px]"
                  placeholder="VD: Mua nhà, Du lịch Nhật..."
                />
                {form.formState.errors.name && (
                  <p className="text-[12px] text-red-400">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>

            {/* Số tiền mục tiêu */}
            <div className="flex flex-col gap-2">
              <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                Số tiền mục tiêu (₫) *
              </label>
              <input
                value={amountDisplay}
                onChange={handleAmountChange}
                inputMode="numeric"
                className="bg-surface border-border text-foreground border p-3 text-[15px]"
                placeholder="VD: 1.500.000.000"
              />
              {form.formState.errors.target_amount && (
                <p className="text-[12px] text-red-400">
                  {form.formState.errors.target_amount.message}
                </p>
              )}
            </div>

            {/* Deadline (optional) */}
            <div className="flex flex-col gap-2">
              <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                Ngày mục tiêu (không bắt buộc)
              </label>
              <input
                type="date"
                {...form.register("deadline")}
                className="bg-surface border-border text-foreground border p-3 text-[15px]"
              />
            </div>

            {/* Ghi chú */}
            <div className="flex flex-col gap-2">
              <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                Ghi chú
              </label>
              <textarea
                {...form.register("note")}
                rows={2}
                className="bg-surface border-border text-foreground resize-none border p-3 text-[15px]"
                placeholder="Tuỳ chọn..."
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="bg-accent text-background mt-2 p-4 text-[14px] font-bold tracking-[1px] uppercase disabled:opacity-50"
            >
              {isPending ? "Đang lưu..." : goal ? "Cập nhật" : "Đặt mục tiêu"}
            </button>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
