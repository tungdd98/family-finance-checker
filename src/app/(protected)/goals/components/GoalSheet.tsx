// src/app/(protected)/goals/components/GoalSheet.tsx
"use client";

import type { ReactNode } from "react";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { goalSchema, type GoalInput } from "@/lib/validations/goals";
import type { Goal } from "@/lib/services/goals";
import { saveGoalAction } from "@/app/actions/goals";
import { Button } from "@/components/ui/button";
import { DatePickerDrawer } from "@/app/(protected)/gold/components/DatePickerDrawer";

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
          <div className="bg-background border-border sticky top-0 flex items-center justify-between border-b px-7 pt-5 pb-4">
            <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
              {goal ? "Chỉnh sửa mục tiêu" : "Đặt mục tiêu"}
            </span>
            <Drawer.Close className="text-foreground-muted">
              <X size={20} />
            </Drawer.Close>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-7 py-5 pb-10"
          >
            {/* Emoji + Tên */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-2">
                <Label>Icon</Label>
                <div className="bg-background border-border flex h-12 w-14 items-center justify-center border">
                  <input
                    {...form.register("emoji")}
                    maxLength={2}
                    disabled={isPending}
                    className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-center text-xl outline-none disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Label>Tên mục tiêu *</Label>
                <div className="bg-background border-border flex h-12 items-center border px-3.5">
                  <input
                    {...form.register("name")}
                    placeholder="VD: Mua nhà, Du lịch Nhật..."
                    disabled={isPending}
                    className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                  />
                </div>
                {form.formState.errors.name && (
                  <ErrorMsg>{form.formState.errors.name.message}</ErrorMsg>
                )}
              </div>
            </div>

            {/* Số tiền mục tiêu */}
            <div className="flex flex-col gap-2">
              <Label>Số tiền mục tiêu *</Label>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  inputMode="numeric"
                  placeholder="VD: 1.500.000.000"
                  disabled={isPending}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                />
                <span className="text-foreground-muted shrink-0 text-[13px]">
                  ₫
                </span>
              </div>
              {form.formState.errors.target_amount && (
                <ErrorMsg>
                  {form.formState.errors.target_amount.message}
                </ErrorMsg>
              )}
            </div>

            {/* Deadline (optional) */}
            <div className="flex flex-col gap-2">
              <Label>Ngày mục tiêu (không bắt buộc)</Label>
              <Controller
                name="deadline"
                control={form.control}
                render={({ field }) => (
                  <DatePickerDrawer
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
            </div>

            {/* Ghi chú */}
            <div className="flex flex-col gap-2">
              <Label>Ghi chú</Label>
              <div className="bg-background border-border flex min-h-[80px] items-start border px-3.5 py-3">
                <textarea
                  {...form.register("note")}
                  rows={3}
                  placeholder="Tuỳ chọn..."
                  disabled={isPending}
                  className="text-foreground placeholder:text-foreground-muted w-full resize-none bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-14 w-full"
            >
              {isPending ? "ĐANG LƯU..." : goal ? "CẬP NHẬT" : "ĐẶT MỤC TIÊU"}
            </Button>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px] uppercase">
      {children}
    </span>
  );
}

function ErrorMsg({ children }: { children: ReactNode }) {
  return <p className="text-status-negative text-[11px]">{children}</p>;
}
