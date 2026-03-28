// src/app/(protected)/settings/SettingsForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { saveSettingsAction } from "@/app/actions/settings";
import { settingsSchema, type SettingsInput } from "@/lib/validations/settings";
import { Button } from "@/components/ui/button";

interface Props {
  initialData: SettingsInput;
}

function formatVND(n: number): string {
  return n > 0 ? new Intl.NumberFormat("vi-VN").format(n) : "";
}

export function SettingsForm({ initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [amountDisplay, setAmountDisplay] = useState(
    formatVND(initialData.initial_cash_balance)
  );

  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialData,
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = raw ? parseInt(raw, 10) : 0;
    setAmountDisplay(raw ? new Intl.NumberFormat("vi-VN").format(num) : "");
    form.setValue("initial_cash_balance", num, { shouldValidate: true });
  };

  const onSubmit = (data: SettingsInput) => {
    startTransition(async () => {
      const result = await saveSettingsAction(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã lưu cài đặt");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {/* Top section: title + cash balance */}
      <div className="flex flex-col gap-6 px-7 pb-6">
        <h1 className="text-foreground pt-4 text-[28px] font-bold tracking-[-1px]">
          CÀI ĐẶT
        </h1>

        {/* TIỀN MẶT */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-accent h-3.5 w-0.75 shrink-0" />
            <span className="text-foreground-secondary text-[11px] font-semibold tracking-[1.5px]">
              TIỀN MẶT
            </span>
          </div>
          <div className="bg-surface flex flex-col gap-3 p-[18px]">
            <p className="text-foreground-secondary text-[12px] font-medium">
              Số dư ban đầu
            </p>
            <div className="bg-background border-border flex h-12 items-center border px-[14px]">
              <input
                inputMode="numeric"
                placeholder="0 đ"
                value={amountDisplay}
                onChange={handleAmountChange}
                disabled={isPending}
                className="placeholder:text-foreground-muted text-foreground w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
              />
            </div>
            {form.formState.errors.initial_cash_balance && (
              <p className="text-status-negative text-[11px]">
                {form.formState.errors.initial_cash_balance.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom section: personal info + save button */}
      <div className="flex flex-col gap-8 px-7 pb-12">
        {/* THÔNG TIN CÁ NHÂN */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-accent h-3.5 w-0.75 shrink-0" />
            <span className="text-foreground-secondary text-[11px] font-semibold tracking-[2px]">
              THÔNG TIN CÁ NHÂN
            </span>
          </div>
          <div className="bg-surface border-border-strong flex flex-col gap-2 border px-4 py-[14px]">
            <label
              htmlFor="display_name"
              className="text-foreground-muted text-[10px] font-medium tracking-[1.5px]"
            >
              TÊN HIỂN THỊ
            </label>
            <input
              id="display_name"
              placeholder="Nhập tên của bạn..."
              disabled={isPending}
              className="placeholder:text-border-strong text-foreground bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
              {...form.register("display_name")}
            />
            {form.formState.errors.display_name && (
              <p className="text-status-negative text-[11px]">
                {form.formState.errors.display_name.message}
              </p>
            )}
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="h-14 w-full">
          {isPending ? "ĐANG LƯU..." : "LƯU CÀI ĐẶT"}
        </Button>
      </div>
    </form>
  );
}
