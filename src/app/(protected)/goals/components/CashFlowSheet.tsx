// src/app/(protected)/goals/components/CashFlowSheet.tsx
"use client";

import type { ReactNode } from "react";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { cashFlowSchema, type CashFlowInput } from "@/lib/validations/goals";
import type { HouseholdCashFlow } from "@/lib/services/goals";
import { saveCashFlowAction } from "@/app/actions/goals";
import { formatVND } from "@/lib/gold-utils";
import { Button } from "@/components/ui/button";

interface Props {
  cashFlow: HouseholdCashFlow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function stripFormatting(n: number) {
  return n > 0 ? new Intl.NumberFormat("vi-VN").format(n) : "";
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

export function CashFlowSheet({ cashFlow, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [incomeDisplay, setIncomeDisplay] = useState("");
  const [expenseDisplay, setExpenseDisplay] = useState("");

  const form = useForm<CashFlowInput>({
    resolver: zodResolver(cashFlowSchema),
    defaultValues: { avg_monthly_income: 0, avg_monthly_expense: 0 },
  });

  const income = form.watch("avg_monthly_income");
  const expense = form.watch("avg_monthly_expense");
  const surplus = income - expense;

  useEffect(() => {
    if (open) {
      if (cashFlow) {
        form.reset({
          avg_monthly_income: cashFlow.avg_monthly_income,
          avg_monthly_expense: cashFlow.avg_monthly_expense,
        });

        setIncomeDisplay(stripFormatting(cashFlow.avg_monthly_income));

        setExpenseDisplay(stripFormatting(cashFlow.avg_monthly_expense));
      } else {
        form.reset({ avg_monthly_income: 0, avg_monthly_expense: 0 });

        setIncomeDisplay("");

        setExpenseDisplay("");
      }
    }
  }, [open, cashFlow, form]);

  const makeChangeHandler =
    (
      field: "avg_monthly_income" | "avg_monthly_expense",
      setDisplay: (v: string) => void
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      const num = raw ? parseInt(raw, 10) : 0;
      setDisplay(raw ? new Intl.NumberFormat("vi-VN").format(num) : "");
      form.setValue(field, num, { shouldValidate: true });
    };

  const onSubmit = (data: CashFlowInput) => {
    startTransition(async () => {
      const result = await saveCashFlowAction(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã cập nhật thu chi trung bình");
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
              Thu chi trung bình / tháng
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
              <Label>Thu nhập TB / tháng (₫) *</Label>
              <input
                value={incomeDisplay}
                onChange={makeChangeHandler(
                  "avg_monthly_income",
                  setIncomeDisplay
                )}
                inputMode="numeric"
                className="bg-surface border-border text-foreground border p-3 text-[15px]"
                placeholder="VD: 45.000.000"
              />
              {form.formState.errors.avg_monthly_income && (
                <ErrorMsg>
                  {form.formState.errors.avg_monthly_income.message}
                </ErrorMsg>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Chi tiêu TB / tháng (₫) *</Label>
              <input
                value={expenseDisplay}
                onChange={makeChangeHandler(
                  "avg_monthly_expense",
                  setExpenseDisplay
                )}
                inputMode="numeric"
                className="bg-surface border-border text-foreground border p-3 text-[15px]"
                placeholder="VD: 28.000.000"
              />
              {form.formState.errors.avg_monthly_expense && (
                <ErrorMsg>
                  {form.formState.errors.avg_monthly_expense.message}
                </ErrorMsg>
              )}
            </div>

            {/* Live preview */}
            <div className="bg-surface border-border border p-4">
              <p className="text-foreground-muted mb-2 text-[11px] font-semibold tracking-[1px] uppercase">
                Thặng dư dự kiến
              </p>
              <p
                className={`text-[20px] font-bold tracking-[-0.5px] ${surplus >= 0 ? "text-green-500" : "text-red-400"}`}
              >
                {surplus >= 0 ? "+" : ""}
                {formatVND(surplus)}
              </p>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-14 w-full"
            >
              {isPending ? "ĐANG LƯU..." : "LƯU CÀI ĐẶT"}
            </Button>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
