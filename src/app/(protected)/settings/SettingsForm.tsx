// src/app/(protected)/settings/SettingsForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

import { saveSettingsAction } from "@/app/actions/settings";
import { logoutAction } from "@/app/actions/auth";
import { settingsSchema, type SettingsInput } from "@/lib/validations/settings";
import { Button } from "@/components/ui/button";
import { ResetDataSection } from "./ResetDataSection";
import { formatVND } from "@/lib/utils";

interface Props {
  initialData: SettingsInput;
  displayName: string;
}

export function SettingsForm({ initialData, displayName }: Props) {
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
    setAmountDisplay(raw ? formatVND(num) : "");
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
    <div className="flex flex-col gap-12 pb-20">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {/* Top section: title + cash balance */}
        <div className="flex flex-col gap-6 pb-6">
          <h1 className="text-foreground pt-4 text-3xl font-bold">CÀI ĐẶT</h1>

          {/* TIỀN MẶT */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-accent h-3.5 w-0.75 shrink-0" />
              <span className="text-foreground-secondary text-xs font-semibold">
                TIỀN MẶT
              </span>
            </div>
            <div className="bg-surface flex flex-col gap-3 p-4.5">
              <p className="text-foreground-secondary text-xs font-medium">
                Số dư ban đầu
              </p>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  inputMode="numeric"
                  placeholder="0 đ"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  disabled={isPending}
                  className="placeholder:text-foreground-muted text-foreground w-full bg-transparent text-sm font-medium outline-none disabled:opacity-50"
                />
              </div>
              {form.formState.errors.initial_cash_balance && (
                <p className="text-status-negative text-xs">
                  {form.formState.errors.initial_cash_balance.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom section: personal info + save button */}
        <div className="border-border flex flex-col gap-8 border-b pb-12">
          {/* THÔNG TIN CÁ NHÂN */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-accent h-3.5 w-0.75 shrink-0" />
              <span className="text-foreground-secondary text-xs font-semibold">
                THÔNG TIN CÁ NHÂN
              </span>
            </div>
            <div className="bg-surface border-border-strong flex flex-col gap-2 border px-4 py-3.5">
              <label
                htmlFor="display_name"
                className="text-foreground-muted text-xs font-medium"
              >
                TÊN HIỂN THỊ
              </label>
              <input
                id="display_name"
                placeholder="Nhập tên của bạn..."
                disabled={isPending}
                className="placeholder:text-border-strong text-foreground bg-transparent text-sm font-medium outline-none disabled:opacity-50"
                {...form.register("display_name")}
              />
              {form.formState.errors.display_name && (
                <p className="text-status-negative text-xs">
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

      {/* Logout + Reset Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-status-negative/40 h-3.5 w-0.75 shrink-0" />
          <span className="text-foreground-secondary text-xs font-semibold">
            HÀNH ĐỘNG
          </span>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="outline"
            className="border-status-negative/20 text-status-negative hover:bg-status-negative/10 flex h-14 w-full items-center justify-center gap-2 text-sm font-bold"
          >
            <LogOut size={18} />
            ĐĂNG XUẤT TÀI KHOẢN
          </Button>
        </form>
        <ResetDataSection displayName={displayName} />
      </div>
    </div>
  );
}
