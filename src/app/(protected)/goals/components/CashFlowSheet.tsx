// src/app/(protected)/goals/components/CashFlowSheet.tsx
"use client";

import type { ReactNode } from "react";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ResponsiveModal } from "@/components/common";
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

export function CashFlowSheet({ cashFlow, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [incomeHusbandDisplay, setIncomeHusbandDisplay] = useState("");
  const [incomeWifeDisplay, setIncomeWifeDisplay] = useState("");
  const [expenseDisplay, setExpenseDisplay] = useState("");

  const form = useForm<CashFlowInput>({
    resolver: zodResolver(cashFlowSchema),
    defaultValues: {
      avg_monthly_income_husband: 0,
      avg_monthly_income_wife: 0,
      avg_monthly_expense: 0,
    },
  });

  const incomeHusband = form.watch("avg_monthly_income_husband") || 0;
  const incomeWife = form.watch("avg_monthly_income_wife") || 0;
  const expense = form.watch("avg_monthly_expense") || 0;
  const surplus = incomeHusband + incomeWife - expense;

  useEffect(() => {
    if (open) {
      if (cashFlow) {
        form.reset({
          avg_monthly_income_husband: cashFlow.avg_monthly_income_husband,
          avg_monthly_income_wife: cashFlow.avg_monthly_income_wife,
          avg_monthly_expense: cashFlow.avg_monthly_expense,
        });
        setIncomeHusbandDisplay(
          stripFormatting(cashFlow.avg_monthly_income_husband)
        );
        setIncomeWifeDisplay(stripFormatting(cashFlow.avg_monthly_income_wife));
        setExpenseDisplay(stripFormatting(cashFlow.avg_monthly_expense));
      } else {
        form.reset({
          avg_monthly_income_husband: 0,
          avg_monthly_income_wife: 0,
          avg_monthly_expense: 0,
        });
        setIncomeHusbandDisplay("");
        setIncomeWifeDisplay("");
        setExpenseDisplay("");
      }
    }
  }, [open, cashFlow, form]);

  const makeChangeHandler =
    (
      field:
        | "avg_monthly_income_husband"
        | "avg_monthly_income_wife"
        | "avg_monthly_expense",
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
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Thu chi trung bình / tháng"
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5 px-7 py-5 pb-10"
      >
        <div className="flex flex-col gap-2">
          <Label>Thu nhập chồng (TB/tháng) *</Label>
          <div className="bg-background border-border flex h-12 items-center border px-3.5">
            <input
              value={incomeHusbandDisplay}
              onChange={makeChangeHandler(
                "avg_monthly_income_husband",
                setIncomeHusbandDisplay
              )}
              inputMode="numeric"
              placeholder="VD: 25.000.000"
              disabled={isPending}
              className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-sm font-medium outline-none disabled:opacity-50"
            />
            <span className="text-foreground-muted shrink-0 text-sm">₫</span>
          </div>
          {form.formState.errors.avg_monthly_income_husband && (
            <ErrorMsg>
              {form.formState.errors.avg_monthly_income_husband.message}
            </ErrorMsg>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Thu nhập vợ (TB/tháng) *</Label>
          <div className="bg-background border-border flex h-12 items-center border px-3.5">
            <input
              value={incomeWifeDisplay}
              onChange={makeChangeHandler(
                "avg_monthly_income_wife",
                setIncomeWifeDisplay
              )}
              inputMode="numeric"
              placeholder="VD: 20.000.000"
              disabled={isPending}
              className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-sm font-medium outline-none disabled:opacity-50"
            />
            <span className="text-foreground-muted shrink-0 text-sm">₫</span>
          </div>
          {form.formState.errors.avg_monthly_income_wife && (
            <ErrorMsg>
              {form.formState.errors.avg_monthly_income_wife.message}
            </ErrorMsg>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Chi tiêu TB / tháng *</Label>
          <div className="bg-background border-border flex h-12 items-center border px-3.5">
            <input
              value={expenseDisplay}
              onChange={makeChangeHandler(
                "avg_monthly_expense",
                setExpenseDisplay
              )}
              inputMode="numeric"
              placeholder="VD: 28.000.000"
              disabled={isPending}
              className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-sm font-medium outline-none disabled:opacity-50"
            />
            <span className="text-foreground-muted shrink-0 text-sm">₫</span>
          </div>
          {form.formState.errors.avg_monthly_expense && (
            <ErrorMsg>
              {form.formState.errors.avg_monthly_expense.message}
            </ErrorMsg>
          )}
        </div>

        {/* Live preview */}
        <div className="bg-surface border-border border p-4">
          <p className="text-foreground-muted mb-2 text-xs font-semibold uppercase">
            Thặng dư dự kiến
          </p>
          <p
            className={`text-xl font-bold ${surplus >= 0 ? "text-green-500" : "text-red-400"}`}
          >
            {surplus >= 0 ? "+" : ""}
            {formatVND(surplus)}
          </p>
        </div>

        <Button type="submit" disabled={isPending} className="mt-2 h-14 w-full">
          {isPending ? "ĐANG LƯU..." : "LƯU CÀI ĐẶT"}
        </Button>
      </form>
    </ResponsiveModal>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <span className="type-card-label">{children}</span>;
}

function ErrorMsg({ children }: { children: ReactNode }) {
  return <p className="text-status-negative text-xs">{children}</p>;
}
