// src/app/(protected)/goals/components/MonthlyActualSheet.tsx
"use client";

import type { ReactNode } from "react";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  useFieldArray,
  type UseFormReturn,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import {
  monthlyActualSchema,
  type MonthlyActualInput,
} from "@/lib/validations/goals";
import type { MonthlyActual, HouseholdCashFlow } from "@/lib/services/goals";
import { saveMonthlyActualAction } from "@/app/actions/goals";
import { formatVND } from "@/lib/gold-utils";
import { Button } from "@/components/ui/button";
import { OptionPicker } from "@/app/(protected)/savings/components/OptionPicker";

interface Props {
  year: number;
  month: number;
  existing: MonthlyActual | null;
  cashFlow: HouseholdCashFlow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MonthlyActualSheet({
  year,
  month,
  existing,
  cashFlow,
  open,
  onOpenChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [incomeHusbandDisplay, setIncomeHusbandDisplay] = useState("");
  const [incomeWifeDisplay, setIncomeWifeDisplay] = useState("");
  const [incomeExtraDisplay, setIncomeExtraDisplay] = useState("");
  const [expenseDisplay, setExpenseDisplay] = useState("");

  const form = useForm<MonthlyActualInput>({
    resolver: zodResolver(monthlyActualSchema),
    defaultValues: {
      year,
      month,
      actual_income_husband: 0,
      actual_income_wife: 0,
      actual_income_extra: 0,
      actual_expense: 0,
      allocations: [],
      note: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "allocations",
  });

  const incomeHusband = form.watch("actual_income_husband") || 0;
  const incomeWife = form.watch("actual_income_wife") || 0;
  const incomeExtra = form.watch("actual_income_extra") || 0;
  const expense = form.watch("actual_expense") || 0;
  const surplus = incomeHusband + incomeWife + incomeExtra - expense;
  const baseline = cashFlow
    ? cashFlow.avg_monthly_income - cashFlow.avg_monthly_expense
    : null;
  const delta = baseline !== null ? surplus - baseline : null;

  const allocations = form.watch("allocations") || [];
  const totalAllocated = allocations.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const unallocated = surplus - totalAllocated;

  useEffect(() => {
    if (open) {
      if (existing) {
        form.reset({
          year,
          month,
          actual_income_husband: existing.actual_income_husband,
          actual_income_wife: existing.actual_income_wife,
          actual_income_extra: existing.actual_income_extra,
          actual_expense: existing.actual_expense,
          allocations: (existing.allocations ?? []).map((a) => ({
            ...a,
            is_executed: a.is_executed ?? false,
          })),
          note: existing.note ?? null,
        });
        setIncomeHusbandDisplay(
          existing.actual_income_husband > 0
            ? new Intl.NumberFormat("vi-VN").format(
                existing.actual_income_husband
              )
            : ""
        );
        setIncomeWifeDisplay(
          existing.actual_income_wife > 0
            ? new Intl.NumberFormat("vi-VN").format(existing.actual_income_wife)
            : ""
        );
        setIncomeExtraDisplay(
          existing.actual_income_extra > 0
            ? new Intl.NumberFormat("vi-VN").format(
                existing.actual_income_extra
              )
            : ""
        );
        setExpenseDisplay(
          existing.actual_expense > 0
            ? new Intl.NumberFormat("vi-VN").format(existing.actual_expense)
            : ""
        );
      } else {
        form.reset({
          year,
          month,
          actual_income_husband: 0,
          actual_income_wife: 0,
          actual_income_extra: 0,
          actual_expense: 0,
          allocations: [],
          note: null,
        });
        setIncomeHusbandDisplay("");
        setIncomeWifeDisplay("");
        setIncomeExtraDisplay("");
        setExpenseDisplay("");
      }
    }
  }, [open, existing, year, month, form]);

  const makeChangeHandler =
    (
      field:
        | "actual_income_husband"
        | "actual_income_wife"
        | "actual_income_extra"
        | "actual_expense",
      setDisplay: (v: string) => void
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      const num = raw ? parseInt(raw, 10) : 0;
      setDisplay(raw ? new Intl.NumberFormat("vi-VN").format(num) : "");
      form.setValue(field, num, { shouldValidate: true });
    };

  const onSubmit = (data: MonthlyActualInput) => {
    startTransition(async () => {
      const result = await saveMonthlyActualAction(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Đã cập nhật tháng ${month}/${year}`);
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
              Cập nhật tháng {month}/{year}
            </span>
            <Drawer.Close className="text-foreground-muted">
              <X size={20} />
            </Drawer.Close>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-7 py-5 pb-10"
          >
            <div className="flex flex-col gap-2">
              <Label>
                Thu nhập chồng ({month}/{year}) *
              </Label>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  value={incomeHusbandDisplay}
                  onChange={makeChangeHandler(
                    "actual_income_husband",
                    setIncomeHusbandDisplay
                  )}
                  inputMode="numeric"
                  placeholder="VD: 25.000.000"
                  disabled={isPending}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                />
                <span className="text-foreground-muted shrink-0 text-[13px]">
                  ₫
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>
                Thu nhập vợ ({month}/{year}) *
              </Label>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  value={incomeWifeDisplay}
                  onChange={makeChangeHandler(
                    "actual_income_wife",
                    setIncomeWifeDisplay
                  )}
                  inputMode="numeric"
                  placeholder="VD: 20.000.000"
                  disabled={isPending}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                />
                <span className="text-foreground-muted shrink-0 text-[13px]">
                  ₫
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>T.Nhập Ngoài (Tùy Chọn)</Label>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  value={incomeExtraDisplay}
                  onChange={makeChangeHandler(
                    "actual_income_extra",
                    setIncomeExtraDisplay
                  )}
                  inputMode="numeric"
                  placeholder="VD: 2.500.000 (Để trống nếu 0)"
                  disabled={isPending}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                />
                <span className="text-foreground-muted shrink-0 text-[13px]">
                  ₫
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>
                Chi tiêu tháng {month}/{year} *
              </Label>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  value={expenseDisplay}
                  onChange={makeChangeHandler(
                    "actual_expense",
                    setExpenseDisplay
                  )}
                  inputMode="numeric"
                  placeholder="VD: 28.000.000"
                  disabled={isPending}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                />
                <span className="text-foreground-muted shrink-0 text-[13px]">
                  ₫
                </span>
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-surface border-border flex flex-col gap-2 border p-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted text-[12px]">
                  Thặng dư tháng này
                </span>
                <span
                  className={`text-[14px] font-bold ${surplus >= 0 ? "text-green-500" : "text-red-400"}`}
                >
                  {surplus >= 0 ? "+" : ""}
                  {formatVND(surplus)}
                </span>
              </div>
              {delta !== null && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-foreground-muted text-[12px]">
                    So với TB dự kiến
                  </span>
                  <span
                    className={`text-[14px] font-bold ${delta >= 0 ? "text-green-500" : "text-red-400"}`}
                  >
                    {delta >= 0 ? "+" : ""}
                    {formatVND(delta)}
                  </span>
                </div>
              )}
            </div>

            {/* Phân bổ thặng dư */}
            <div className="bg-surface border-border flex flex-col gap-4 border p-4">
              <div className="border-border/50 flex items-center justify-between border-b pb-3">
                <span className="text-foreground text-[14px] font-bold tracking-[-0.5px]">
                  Phân Bổ Thặng Dư
                </span>
                <span
                  className={`text-[13px] font-bold ${unallocated > 0 ? "text-green-500" : unallocated < 0 ? "text-red-400" : "text-[#D4AF37]"}`}
                >
                  {unallocated === 0 && surplus > 0
                    ? "✓ Hoàn hảo"
                    : `Còn lại: ${formatVND(unallocated)}`}
                </span>
              </div>

              {fields.map((field, index) => {
                const currentAmount = allocations[index]?.amount || 0;
                const fieldAvailable = unallocated + currentAmount;
                return (
                  <AllocationRow
                    key={field.id}
                    index={index}
                    form={form}
                    remove={remove}
                    fieldAvailable={fieldAvailable}
                    isPending={isPending}
                  />
                );
              })}

              <Button
                type="button"
                variant="outline"
                disabled={isPending || unallocated <= 0}
                onClick={() =>
                  append({
                    type: "gold",
                    amount: unallocated > 0 ? unallocated : 0,
                    is_executed: false,
                  })
                }
                className="text-foreground-muted hover:text-foreground h-12 w-full border-dashed bg-transparent"
              >
                + THÊM KHOẢN PHÂN BỔ
              </Button>
            </div>

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
              {isPending ? "ĐANG CẬP NHẬT..." : "CẬP NHẬT"}
            </Button>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function AllocationRow({
  index,
  form,
  remove,
  fieldAvailable,
  isPending,
}: {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  remove: (index: number) => void;
  fieldAvailable: number;
  isPending: boolean;
}) {
  const [amountDisplay, setAmountDisplay] = useState("");
  const currentAmount = form.watch(`allocations.${index}.amount` as const);
  const is_executed = form.watch(`allocations.${index}.is_executed` as const);

  useEffect(() => {
    if (currentAmount) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmountDisplay(new Intl.NumberFormat("vi-VN").format(currentAmount));
    } else {
      setAmountDisplay("");
    }
  }, [currentAmount]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = raw ? parseInt(raw, 10) : 0;
    setAmountDisplay(raw ? new Intl.NumberFormat("vi-VN").format(num) : "");
    form.setValue(`allocations.${index}.amount` as const, num, {
      shouldValidate: true,
    });
  };

  return (
    <div
      className={`border-border/50 relative flex flex-col gap-3 border-b pb-4 last:border-0 last:pb-0 ${is_executed ? "opacity-80" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label>Hạng Mục #{index + 1}</Label>
          <button
            type="button"
            onClick={() =>
              form.setValue(
                `allocations.${index}.is_executed` as const,
                !is_executed,
                { shouldValidate: true }
              )
            }
            className={`border px-1.5 py-0.5 text-[9px] font-bold tracking-[1px] uppercase transition-colors ${
              is_executed
                ? "border-green-500/30 bg-green-500/10 text-green-500"
                : "border-border text-foreground-muted hover:text-foreground"
            }`}
          >
            {is_executed ? "✓ Đã xử lý" : "Chờ xử lý"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => remove(index)}
          className="text-foreground-muted -mr-2 px-2 text-[10px] font-bold tracking-[1px] uppercase hover:text-red-400"
        >
          Xoá
        </button>
      </div>

      <div
        className={`flex gap-2 transition-opacity ${is_executed ? "pointer-events-none opacity-40 grayscale-[0.5]" : ""}`}
      >
        <div className="flex-[0.8]">
          <Controller
            name={`allocations.${index}.type` as const}
            control={form.control}
            render={({ field }) => (
              <OptionPicker
                title="Chọn hạng mục"
                placeholder="Chọn..."
                options={[
                  { value: "gold", label: "Vàng" },
                  { value: "savings", label: "Tiết kiệm" },
                  { value: "etf", label: "Quỹ ETF" },
                  { value: "coin", label: "Coin" },
                  { value: "other", label: "Khác" },
                ]}
                value={field.value}
                onChange={(v) => field.onChange(String(v))}
                disabled={isPending || is_executed}
              />
            )}
          />
        </div>

        <div
          className={`bg-background border-border flex h-12 flex-[1.2] items-center border px-3 ${is_executed ? "bg-black/10" : ""}`}
        >
          <input
            value={amountDisplay}
            onChange={onChange}
            inputMode="numeric"
            disabled={isPending || is_executed}
            placeholder="Số tiền..."
            className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
          />
          <span className="text-foreground-muted ml-1 shrink-0 text-[13px]">
            ₫
          </span>
        </div>
      </div>

      {!is_executed && (
        <div className="mt-0.5 flex gap-2">
          {[0.25, 0.5, 0.75, 1].map((pct) => (
            <button
              key={pct}
              type="button"
              disabled={isPending || fieldAvailable <= 0}
              onClick={() => {
                if (fieldAvailable > 0) {
                  form.setValue(
                    `allocations.${index}.amount` as const,
                    Math.floor(fieldAvailable * pct),
                    { shouldValidate: true }
                  );
                }
              }}
              className="bg-background border-border text-foreground-muted hover:text-foreground hover:border-foreground/30 disabled:hover:text-foreground-muted disabled:hover:border-border flex-1 border px-2 py-2 text-[10px] font-bold tracking-[0.5px] transition-colors disabled:opacity-30"
            >
              {pct * 100}%
            </button>
          ))}
        </div>
      )}
    </div>
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
