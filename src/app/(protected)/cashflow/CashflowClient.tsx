"use client";

import type { ReactNode } from "react";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  useFieldArray,
  type UseFormReturn,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Tabs } from "@base-ui/react/tabs";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Info,
  Pencil,
} from "lucide-react";
import {
  monthlyActualSchema,
  type MonthlyActualInput,
} from "@/lib/validations/goals";
import type { MonthlyActual, HouseholdCashFlow } from "@/lib/services/goals";
import { saveMonthlyActualAction } from "@/app/actions/goals";
import { formatVND } from "@/lib/gold-utils";
import { Button } from "@/components/ui/button";
import { OptionPicker } from "@/app/(protected)/savings/components/OptionPicker";
import { formatMil } from "./constants";
import { IncomeTab } from "./components/IncomeTab";
import { ExpenseTab } from "./components/ExpenseTab";

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

  const totalAllocated = allocations.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const unallocated = surplus - totalAllocated;
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
      <h1 className="type-featured-stat uppercase">THU / CHI</h1>

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
          <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
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
            <div className="mt-1 text-[16px] font-bold text-green-500">
              {totalIncome > 0 ? `+${formatMil(totalIncome)}tr` : "—"}
            </div>
          </div>
          <div className="border-border border p-3">
            <div className="type-card-label">Chi</div>
            <div className="mt-1 text-[16px] font-bold text-red-400">
              {totalExpense > 0 ? `-${formatMil(totalExpense)}tr` : "—"}
            </div>
          </div>
          <div className="border-border border p-3">
            <div className="type-card-label">Thặng dư</div>
            <div
              className={`mt-1 text-[16px] font-bold ${surplus > 0 ? "text-accent" : surplus < 0 ? "text-red-400" : "text-foreground-muted"}`}
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

                <div className="bg-surface border-border flex flex-col gap-4 border p-4">
                  <div className="border-border/50 flex items-center justify-between border-b pb-3">
                    <span className="text-foreground text-[14px] font-bold tracking-[-0.5px]">
                      Phân Bổ Thặng Dư
                    </span>
                    <span
                      className={`text-[13px] font-bold ${unallocated > 0 ? "text-green-500" : unallocated < 0 ? "text-red-400" : "text-accent"}`}
                    >
                      {unallocated === 0 && surplus > 0
                        ? "✓ Hoàn hảo"
                        : `Còn lại: ${formatVND(unallocated)}`}
                    </span>
                  </div>

                  {allocationFields.map((field, index) => {
                    const currentAmount = allocations[index]?.amount || 0;
                    const fieldAvailable = unallocated + currentAmount;
                    return (
                      <AllocationRow
                        key={field.id}
                        index={index}
                        form={form}
                        remove={removeAllocation}
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
                      appendAllocation({
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

function AllocationRow({
  index,
  form,
  remove,
  fieldAvailable,
  isPending,
}: {
  index: number;
  form: UseFormReturn<MonthlyActualInput>;
  remove: (index: number) => void;
  fieldAvailable: number;
  isPending: boolean;
}) {
  const currentAmount = form.watch(`allocations.${index}.amount` as const);
  const is_executed = form.watch(`allocations.${index}.is_executed` as const);

  const amountDisplay =
    currentAmount > 0
      ? new Intl.NumberFormat("vi-VN").format(currentAmount)
      : "";

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = raw ? parseInt(raw, 10) : 0;
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
          <FieldLabel>Hạng Mục #{index + 1}</FieldLabel>
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
          <Trash2 size={14} />
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

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="type-card-label">{children}</span>;
}
