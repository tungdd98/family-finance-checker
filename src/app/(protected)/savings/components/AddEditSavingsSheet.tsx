"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";

import {
  savingsSchema,
  type SavingsInput,
  ROLLOVER_OPTIONS,
  TERM_OPTIONS,
} from "@/lib/validations/savings";
import type { SavingsAccount } from "@/lib/services/savings";
import { addSavingsAction, updateSavingsAction } from "@/app/actions/savings";
import { Button } from "@/components/ui/button";
import { BankPicker } from "./BankPicker";
import { DatePickerDrawer } from "@/app/(protected)/gold/components/DatePickerDrawer";
import { OptionPicker } from "./OptionPicker";

interface Props {
  mode: "add" | "edit";
  account?: SavingsAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatVND(n: number) {
  return n > 0 ? new Intl.NumberFormat("vi-VN").format(n) : "";
}

export function AddEditSavingsSheet({
  mode,
  account,
  open,
  onOpenChange,
}: Props) {
  const isEdit = mode === "edit";
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [principalDisplay, setPrincipalDisplay] = useState(
    account ? formatVND(account.principal) : ""
  );

  const form = useForm<SavingsInput>({
    resolver: zodResolver(savingsSchema),
    defaultValues: account
      ? {
          bank_name: account.bank_name,
          account_name: account.account_name ?? "",
          note: account.note ?? "",
          principal: account.principal,
          interest_rate: account.interest_rate,
          term_months: account.term_months ?? 0,
          start_date: account.start_date,
          rollover_type: account.rollover_type,
        }
      : {
          bank_name: "",
          account_name: "",
          note: "",
          principal: 0,
          interest_rate: 0,
          term_months: 12,
          start_date: new Date().toISOString().split("T")[0],
          rollover_type: "principal_interest",
        },
  });

  const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = raw ? parseInt(raw, 10) : 0;
    setPrincipalDisplay(raw ? formatVND(num) : "");
    form.setValue("principal", num, { shouldValidate: true });
  };

  const onSubmit = (data: SavingsInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateSavingsAction(account!.id, data)
        : await addSavingsAction(data);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          isEdit ? "Đã cập nhật khoản tiết kiệm" : "Đã thêm khoản tiết kiệm"
        );
        router.refresh();
        onOpenChange(false);
        form.reset();
        setPrincipalDisplay("");
      }
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          {/* Header */}
          <div className="bg-background border-border sticky top-0 flex items-center justify-between border-b px-5 pt-5 pb-4">
            <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
              {isEdit ? "Sửa tiết kiệm" : "Thêm tiết kiệm"}
            </span>
            <Drawer.Close className="text-foreground-muted">
              <X size={20} />
            </Drawer.Close>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-5 py-5 pb-10"
          >
            {/* Ngân hàng */}
            <div className="flex flex-col gap-2">
              <Label>NGÂN HÀNG / VÍ ĐIỆN TỬ *</Label>
              <Controller
                name="bank_name"
                control={form.control}
                render={({ field }) => (
                  <BankPicker
                    selectedCode={field.value}
                    selectedName={field.value}
                    onSelect={(_code, name) => field.onChange(name)}
                    disabled={isPending}
                  />
                )}
              />
              {form.formState.errors.bank_name && (
                <ErrorMsg>{form.formState.errors.bank_name.message}</ErrorMsg>
              )}
            </div>

            {/* Tên sổ */}
            <div className="flex flex-col gap-2">
              <Label>TÊN SỔ / GỢI NHỚ (TÙY CHỌN)</Label>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  placeholder="VD: Sổ học phí, Quỹ du lịch..."
                  disabled={isPending}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                  {...form.register("account_name")}
                />
              </div>
            </div>

            {/* Số tiền gốc */}
            <div className="flex flex-col gap-2">
              <Label>SỐ TIỀN GỐC (VND) *</Label>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  inputMode="numeric"
                  placeholder="0"
                  value={principalDisplay}
                  onChange={handlePrincipalChange}
                  disabled={isPending}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                />
                <span className="text-foreground-muted shrink-0 text-[13px]">
                  ₫
                </span>
              </div>
              {form.formState.errors.principal && (
                <ErrorMsg>{form.formState.errors.principal.message}</ErrorMsg>
              )}
            </div>

            {/* Lãi suất */}
            <div className="flex flex-col gap-2">
              <Label>LÃI SUẤT (%/NĂM) *</Label>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  inputMode="decimal"
                  placeholder="5.2"
                  disabled={isPending}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                  {...form.register("interest_rate", {
                    setValueAs: (v: string) => {
                      const normalized = String(v).replace(",", ".");
                      const num = parseFloat(normalized);
                      return isNaN(num) ? NaN : num;
                    },
                  })}
                />
                <span className="text-foreground-muted shrink-0 text-[12px]">
                  %/năm
                </span>
              </div>
              {form.formState.errors.interest_rate && (
                <ErrorMsg>
                  {form.formState.errors.interest_rate.message}
                </ErrorMsg>
              )}
            </div>

            {/* Kỳ hạn */}
            <div className="flex flex-col gap-2">
              <Label>KỲ HẠN</Label>
              <Controller
                name="term_months"
                control={form.control}
                render={({ field }) => (
                  <OptionPicker
                    title="Chọn Kỳ Hạn"
                    options={TERM_OPTIONS.map((o) => ({
                      ...o,
                      value: o.value,
                    }))}
                    value={field.value}
                    onChange={(v) => field.onChange(Number(v))}
                    disabled={isPending}
                  />
                )}
              />
            </div>

            {/* Ngày gửi */}
            <div className="flex flex-col gap-2">
              <Label>NGÀY GỬI *</Label>
              <Controller
                name="start_date"
                control={form.control}
                render={({ field }) => (
                  <DatePickerDrawer
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
              {form.formState.errors.start_date && (
                <ErrorMsg>{form.formState.errors.start_date.message}</ErrorMsg>
              )}
            </div>

            {/* Hình thức tất toán */}
            <div className="flex flex-col gap-2">
              <Label>HÌNH THỨC TẤT TOÁN</Label>
              <Controller
                name="rollover_type"
                control={form.control}
                render={({ field }) => (
                  <OptionPicker
                    title="Hình Thức Tất Toán"
                    options={ROLLOVER_OPTIONS.map((o) => ({ ...o }))}
                    value={field.value}
                    onChange={(v) => field.onChange(String(v))}
                    disabled={isPending}
                  />
                )}
              />
            </div>

            {/* Ghi chú */}
            <div className="flex flex-col gap-2">
              <Label>GHI CHÚ (TÙY CHỌN)</Label>
              <div className="bg-background border-border flex min-h-[80px] items-start border px-3.5 py-3">
                <textarea
                  rows={3}
                  placeholder="Ghi chú thêm..."
                  disabled={isPending}
                  className="text-foreground placeholder:text-foreground-muted w-full resize-none bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                  {...form.register("note")}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-14 w-full"
            >
              {isPending
                ? isEdit
                  ? "ĐANG LƯU..."
                  : "ĐANG THÊM..."
                : isEdit
                  ? "CẬP NHẬT TIẾT KIỆM"
                  : "LƯU TIẾT KIỆM"}
            </Button>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px]">
      {children}
    </span>
  );
}

function ErrorMsg({ children }: { children: ReactNode }) {
  return <p className="text-status-negative text-[11px]">{children}</p>;
}
