"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Tabs } from "@base-ui/react/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  monthlyActualSchema,
  type MonthlyActualInput,
} from "@/lib/validations/goals";
import type { MonthlyActual, HouseholdCashFlow } from "@/lib/services/goals";
import { saveMonthlyActualAction } from "@/app/actions/goals";
import { Button } from "@/components/ui/button";
import { formatMil } from "./constants";
import { IncomeTab } from "./components/IncomeTab";
import { ExpenseTab } from "./components/ExpenseTab";
import { AllocationTab } from "./components/AllocationTab";

interface Props {
  year: number;
  month: number;
  existing: MonthlyActual | null;
  cashFlow: HouseholdCashFlow | null;
}

export function CashflowClient({ year, month, existing, cashFlow }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isNavigating, startNavTransition] = useTransition();
  const router = useRouter();
  const skipReset = useRef(false);

  const form = useForm<MonthlyActualInput>({
    resolver: zodResolver(monthlyActualSchema),
    defaultValues: {
      year,
      month,
      actual_income: 0,
      actual_income_details: [],
      actual_expense: 0,
      actual_expense_details: [],
      allocations: [],
      note: null,
    },
  });

  const {
    fields: allocationFields,
    append: appendAllocation,
    remove: removeAllocation,
  } = useFieldArray({
    control: form.control,
    name: "allocations",
  });

  const {
    fields: incomeFields,
    append: appendIncome,
    remove: removeIncome,
  } = useFieldArray({
    control: form.control,
    name: "actual_income_details",
  });

  const {
    fields: expenseFields,
    append: appendExpense,
    remove: removeExpense,
  } = useFieldArray({
    control: form.control,
    name: "actual_expense_details",
  });

  const [newIncomeIndex, setNewIncomeIndex] = useState<number | null>(null);

  useEffect(() => {
    if (newIncomeIndex !== null) setNewIncomeIndex(null);
  }, [incomeFields.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const [newExpenseIndex, setNewExpenseIndex] = useState<number | null>(null);

  useEffect(() => {
    if (newExpenseIndex !== null) setNewExpenseIndex(null);
  }, [expenseFields.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchedIncomes = form.watch("actual_income_details") || [];
  const watchedExpenses = form.watch("actual_expense_details") || [];
  const allocations = form.watch("allocations") || [];

  const totalIncome = watchedIncomes.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const totalExpense = watchedExpenses.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const surplus = totalIncome - totalExpense;

  useEffect(() => {
    form.setValue("actual_income", totalIncome);
  }, [totalIncome]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    form.setValue("actual_expense", totalExpense);
  }, [totalExpense]); // eslint-disable-line react-hooks/exhaustive-deps

  const incomeTotalDisplay =
    totalIncome > 0 ? new Intl.NumberFormat("vi-VN").format(totalIncome) : "";
  const expenseDisplay =
    totalExpense > 0 ? new Intl.NumberFormat("vi-VN").format(totalExpense) : "";

  // Reset form when year/month changes (replaces the Drawer open-based reset)
  useEffect(() => {
    if (skipReset.current) {
      skipReset.current = false;
      return;
    }
    if (existing) {
      form.reset({
        year: existing.year,
        month: existing.month,
        actual_income: existing.actual_income,
        actual_income_details: existing.actual_income_details || [],
        actual_expense: existing.actual_expense,
        actual_expense_details: existing.actual_expense_details || [],
        allocations: existing.allocations || [],
        note: existing.note,
      });
    } else {
      form.reset({
        year,
        month,
        actual_income: 0,
        actual_income_details: [
          { type: "Lương Chồng", amount: 0, note: "" },
          { type: "Lương Vợ", amount: 0, note: "" },
        ],
        actual_expense: 0,
        actual_expense_details: [],
        allocations: [],
        note: null,
      });
    }
  }, [year, month, existing]); // eslint-disable-line react-hooks/exhaustive-deps

  const baseline = cashFlow
    ? cashFlow.avg_monthly_income - cashFlow.avg_monthly_expense
    : null;
  const delta = baseline !== null ? surplus - baseline : null;

  const navigateMonth = (direction: -1 | 1) => {
    let newMonth = month + direction;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    window.dispatchEvent(new Event("navigation-start"));
    startNavTransition(() => {
      router.push(`/cashflow?year=${newYear}&month=${newMonth}`);
    });
  };

  const onSubmit = (data: MonthlyActualInput) => {
    startTransition(async () => {
      const result = await saveMonthlyActualAction(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Đã cập nhật tháng ${month}/${year}`);
        skipReset.current = true;
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col pb-20">
      {/* ── Page header ── */}
      <h1 className="text-foreground pt-2 text-3xl font-bold uppercase">
        THU / CHI
      </h1>

      <div
        className={
          isNavigating
            ? "pointer-events-none opacity-50 transition-opacity duration-150"
            : "transition-opacity duration-150"
        }
      >
        {/* ── Month selector ── */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            className="text-foreground-muted hover:text-foreground p-2"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-foreground text-base font-bold">
            Tháng {month} · {year}
          </span>
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            className="text-foreground-muted hover:text-foreground p-2"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* ── Summary cards ── */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="border-border border p-3">
            <div className="type-card-label">Thu</div>
            <div className="mt-1 text-base font-bold text-green-500">
              {totalIncome > 0 ? `+${formatMil(totalIncome)}tr` : "—"}
            </div>
          </div>
          <div className="border-border border p-3">
            <div className="type-card-label">Chi</div>
            <div className="mt-1 text-base font-bold text-red-400">
              {totalExpense > 0 ? `-${formatMil(totalExpense)}tr` : "—"}
            </div>
          </div>
          <div className="border-border border p-3">
            <div className="type-card-label">Thặng dư</div>
            <div
              className={`mt-1 text-base font-bold ${surplus > 0 ? "text-accent" : surplus < 0 ? "text-red-400" : "text-foreground-muted"}`}
            >
              {surplus !== 0
                ? `${surplus > 0 ? "+" : ""}${formatMil(surplus)}tr`
                : "—"}
            </div>
          </div>
        </div>

        {/* ── Form with tabs ── */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6">
          <Tabs.Root defaultValue="income">
            <Tabs.List className="border-border flex w-full border-b">
              <Tabs.Tab
                value="income"
                className="group type-tab-label data-[active]:text-accent data-[active]:bg-accent/5 text-foreground-muted relative flex-1 py-4 text-center font-bold underline-offset-8 transition-all"
              >
                THU NHẬP
                <div className="bg-accent absolute bottom-0 left-0 h-1 w-full scale-x-0 transition-transform duration-300 group-data-[active]:scale-x-100" />
              </Tabs.Tab>
              <Tabs.Tab
                value="expense"
                className="group type-tab-label data-[active]:text-accent data-[active]:bg-accent/5 text-foreground-muted border-border relative flex-1 border-x py-4 text-center font-bold underline-offset-8 transition-all"
              >
                CHI TIÊU
                <div className="bg-accent absolute bottom-0 left-0 h-1 w-full scale-x-0 transition-transform duration-300 group-data-[active]:scale-x-100" />
              </Tabs.Tab>
              <Tabs.Tab
                value="allocation"
                className="group type-tab-label data-[active]:text-accent data-[active]:bg-accent/5 text-foreground-muted relative flex-1 py-4 text-center font-bold underline-offset-8 transition-all"
              >
                PHÂN BỔ
                <div className="bg-accent absolute bottom-0 left-0 h-1 w-full scale-x-0 transition-transform duration-300 group-data-[active]:scale-x-100" />
              </Tabs.Tab>
            </Tabs.List>

            <div className="py-5">
              {/* ── TAB 1: THU NHẬP ─────────────────────────── */}
              <Tabs.Panel
                value="income"
                className="flex flex-col gap-5 outline-none"
              >
                <IncomeTab
                  form={form}
                  fields={incomeFields}
                  append={appendIncome}
                  remove={removeIncome}
                  isPending={isPending}
                  newIncomeIndex={newIncomeIndex}
                  incomeTotalDisplay={incomeTotalDisplay}
                />
              </Tabs.Panel>

              {/* ── TAB 2: CHI TIÊU ─────────────────────────── */}
              <Tabs.Panel
                value="expense"
                className="flex flex-col gap-5 outline-none"
              >
                <ExpenseTab
                  form={form}
                  fields={expenseFields}
                  append={appendExpense}
                  remove={removeExpense}
                  isPending={isPending}
                  newExpenseIndex={newExpenseIndex}
                  expenseDisplay={expenseDisplay}
                />
              </Tabs.Panel>

              {/* ── TAB 3: PHÂN BỔ ─────────────────────────── */}
              <Tabs.Panel
                value="allocation"
                className="flex flex-col gap-5 outline-none"
              >
                <AllocationTab
                  form={form}
                  fields={allocationFields}
                  append={appendAllocation}
                  remove={removeAllocation}
                  isPending={isPending}
                  surplus={surplus}
                  delta={delta}
                  allocations={allocations}
                />
              </Tabs.Panel>
            </div>
          </Tabs.Root>

          <Button type="submit" disabled={isPending} className="h-14 w-full">
            {isPending ? "ĐANG CẬP NHẬT..." : `LƯU THÁNG ${month}/${year}`}
          </Button>
        </form>
      </div>
    </div>
  );
}
