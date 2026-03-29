// src/app/(protected)/goals/components/MonthlyActualSheet.tsx
"use client";

import type { ReactNode } from "react";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
  const [incomeDisplay, setIncomeDisplay] = useState("");
  const [expenseDisplay, setExpenseDisplay] = useState("");

  const form = useForm<MonthlyActualInput>({
    resolver: zodResolver(monthlyActualSchema),
    defaultValues: {
      year,
      month,
      actual_income: 0,
      actual_expense: 0,
      note: null,
    },
  });

  const income = form.watch("actual_income");
  const expense = form.watch("actual_expense");
  const surplus = income - expense;
  const baseline = cashFlow
    ? cashFlow.avg_monthly_income - cashFlow.avg_monthly_expense
    : null;
  const delta = baseline !== null ? surplus - baseline : null;

  useEffect(() => {
    if (open) {
      if (existing) {
        form.reset({
          year,
          month,
          actual_income: existing.actual_income,
          actual_expense: existing.actual_expense,
          note: existing.note ?? null,
        });
        setIncomeDisplay(
          existing.actual_income > 0
            ? new Intl.NumberFormat("vi-VN").format(existing.actual_income)
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
          actual_income: 0,
          actual_expense: 0,
          note: null,
        });
        setIncomeDisplay("");
        setExpenseDisplay("");
      }
    }
  }, [open, existing, year, month, form]);

  const makeChangeHandler =
    (
      field: "actual_income" | "actual_expense",
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
                Thu nhập tháng {month}/{year} *
              </Label>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  value={incomeDisplay}
                  onChange={makeChangeHandler(
                    "actual_income",
                    setIncomeDisplay
                  )}
                  inputMode="numeric"
                  placeholder="VD: 47.500.000"
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
                <div className="flex items-center justify-between">
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
              {isPending ? "ĐANG LƯU..." : "LƯU"}
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
