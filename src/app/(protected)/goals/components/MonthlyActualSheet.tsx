// src/app/(protected)/goals/components/MonthlyActualSheet.tsx
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
import { Drawer } from "@base-ui/react/drawer";
import { Tabs } from "@base-ui/react/tabs";
import { X, Plus, Trash2, ChevronUp, Info, Pencil } from "lucide-react";
import {
  monthlyActualSchema,
  type MonthlyActualInput,
  type ExpenseDetail,
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

const EXPENSE_CATEGORIES = [
  { value: "Ăn uống / Đi chợ", label: "Ăn uống / Đi chợ" },
  { value: "Tiền nhà / Thuê nhà", label: "Tiền nhà / Thuê nhà" },
  { value: "Điện nước / Internet", label: "Điện nước / Internet" },
  { value: "Xăng xe / Đi lại", label: "Xăng xe / Đi lại" },
  { value: "Con cái / Giáo dục", label: "Con cái / Giáo dục" },
  { value: "Hiếu hỉ / Quà tặng", label: "Hiếu hỉ / Quà tặng" },
  { value: "Sức khỏe / Bảo hiểm", label: "Sức khỏe / Bảo hiểm" },
  { value: "Mua sắm / Giải trí", label: "Mua sắm / Giải trí" },
  { value: "Khác", label: "Khác" },
];

const INCOME_CATEGORIES = [
  { value: "Lương Chồng", label: "Lương Chồng" },
  { value: "Lương Vợ", label: "Lương Vợ" },
  { value: "Thưởng", label: "Thưởng" },
  { value: "Thu nhập ngoài", label: "Thu nhập ngoài" },
  { value: "Khác", label: "Khác" },
];

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
  }, [totalIncome, form]);

  useEffect(() => {
    form.setValue("actual_expense", totalExpense);
  }, [totalExpense, form]);

  const incomeTotalDisplay =
    totalIncome > 0 ? new Intl.NumberFormat("vi-VN").format(totalIncome) : "";
  const expenseDisplay =
    totalExpense > 0 ? new Intl.NumberFormat("vi-VN").format(totalExpense) : "";

  useEffect(() => {
    if (open && existing) {
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
    } else if (open && !existing) {
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
  }, [open, existing, year, month, form]);

  const totalAllocated = allocations.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const unallocated = surplus - totalAllocated;
  const baseline = cashFlow
    ? cashFlow.avg_monthly_income - cashFlow.avg_monthly_expense
    : null;
  const delta = baseline !== null ? surplus - baseline : null;

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
        <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-50 flex h-[90dvh] flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
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
            className="flex h-full flex-col overflow-hidden"
          >
            <Tabs.Root defaultValue="income" className="flex h-full flex-col">
              <Tabs.List className="border-border bg-background/80 sticky top-0 z-10 flex w-full border-b backdrop-blur-md">
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

              <div className="flex-1 overflow-y-auto px-7 py-5">
                {/* ── TAB 1: THU NHẬP ─────────────────────────── */}
                <Tabs.Panel
                  value="income"
                  className="flex flex-col gap-5 outline-none"
                >
                  <div className="bg-accent/5 border-accent/20 mb-1 flex items-center justify-between border p-4">
                    <div className="flex flex-col">
                      <span className="type-card-label text-accent">
                        Tổng thu nhập tháng
                      </span>
                      <span className="text-foreground text-[20px] font-bold tracking-[-0.5px]">
                        {incomeTotalDisplay || "0"} ₫
                      </span>
                    </div>
                    <Info size={20} className="text-accent/40" />
                  </div>

                  <div className="flex flex-col gap-4">
                    {incomeFields.map((field, index) => (
                      <IncomeRow
                        key={field.id}
                        index={index}
                        form={form}
                        remove={removeIncome}
                        isPending={isPending}
                        initiallyExpanded={index === newIncomeIndex}
                      />
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        const idx = incomeFields.length;
                        appendIncome({ type: "", amount: 0, note: "" });
                        setNewIncomeIndex(idx);
                      }}
                      className="text-foreground-muted hover:text-foreground mt-2 h-12 w-full border-dashed bg-transparent"
                    >
                      <Plus size={16} className="mr-2" />
                      THÊM KHOẢN THU
                    </Button>
                  </div>
                </Tabs.Panel>

                {/* ── TAB 2: CHI TIÊU ─────────────────────────── */}
                <Tabs.Panel
                  value="expense"
                  className="flex flex-col gap-5 outline-none"
                >
                  <div className="bg-accent/5 border-accent/20 mb-1 flex items-center justify-between border p-4">
                    <div className="flex flex-col">
                      <span className="type-card-label text-accent">
                        Tổng chi tiêu tháng
                      </span>
                      <span className="text-foreground text-[20px] font-bold tracking-[-0.5px]">
                        {expenseDisplay || "0"} ₫
                      </span>
                    </div>
                    <Info size={20} className="text-accent/40" />
                  </div>

                  <div className="flex flex-col gap-4">
                    {expenseFields.map((field, index) => (
                      <ExpenseRow
                        key={field.id}
                        index={index}
                        form={form}
                        remove={removeExpense}
                        isPending={isPending}
                        initiallyExpanded={index === newExpenseIndex}
                      />
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        const idx = expenseFields.length;
                        appendExpense({ type: "", amount: 0, note: "" });
                        setNewExpenseIndex(idx);
                      }}
                      className="text-foreground-muted hover:text-foreground mt-2 h-12 w-full border-dashed bg-transparent"
                    >
                      <Plus size={16} className="mr-2" />
                      THÊM KHOẢN CHI
                    </Button>
                  </div>
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
                        className={`text-[13px] font-bold ${unallocated > 0 ? "text-green-500" : unallocated < 0 ? "text-red-400" : "text-[#D4AF37]"}`}
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

              <div className="border-border bg-background sticky bottom-0 border-t p-7 pt-5">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-14 w-full"
                >
                  {isPending ? "ĐANG CẬP NHẬT..." : "CẬP NHẬT THÁNG"}
                </Button>
              </div>
            </Tabs.Root>
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

function IncomeRow({
  index,
  form,
  remove,
  isPending,
  initiallyExpanded = false,
}: {
  index: number;
  form: UseFormReturn<MonthlyActualInput>;
  remove: (index: number) => void;
  isPending: boolean;
  initiallyExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const watchedType = form.watch(`actual_income_details.${index}.type`);
  const watchedAmount = form.watch(`actual_income_details.${index}.amount`);
  const watchedNote = form.watch(`actual_income_details.${index}.note`);
  const displayValue =
    watchedAmount > 0
      ? new Intl.NumberFormat("vi-VN").format(watchedAmount)
      : "";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isExpanded) setIsConfirmingDelete(false);
  }, [isExpanded]);

  return (
    <div className="bg-background border-border overflow-hidden border">
      {/* ── Always-visible header row ── */}
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px] uppercase">
            Khoản Thu #{index + 1}
          </div>
          {!isExpanded && (
            <>
              <div
                className={`mt-0.5 truncate text-[13px] font-medium ${watchedType ? "text-foreground" : "text-foreground-muted"}`}
              >
                {watchedType || "Chưa chọn danh mục"}
              </div>
              {watchedNote && (
                <div className="text-foreground-muted mt-0.5 truncate text-[11px]">
                  {watchedNote}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isExpanded && (
            <span
              className={`text-[14px] font-bold ${watchedAmount > 0 ? "text-accent" : "text-foreground-muted"}`}
            >
              {watchedAmount > 0
                ? new Intl.NumberFormat("vi-VN").format(watchedAmount) + " ₫"
                : "—"}
            </span>
          )}
          {isExpanded ? (
            <>
              {isConfirmingDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="px-2 py-1 text-[10px] font-bold tracking-[1px] text-red-400 uppercase"
                  >
                    XOÁ?
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="text-foreground-muted hover:text-foreground px-2 py-1 text-[10px] font-bold tracking-[1px] uppercase"
                  >
                    HUỶ
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setIsExpanded(false)}
                    className="text-foreground-muted hover:text-foreground p-2 disabled:opacity-50"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setIsConfirmingDelete(true)}
                    className="text-foreground-muted -mr-1 px-2 hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsExpanded(true)}
              className="text-foreground-muted hover:text-foreground -mr-1 p-1 disabled:opacity-50"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Animated expandable form ── */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 px-4 pb-4">
            <Controller
              name={`actual_income_details.${index}.type`}
              control={form.control}
              render={({ field }) => (
                <OptionPicker
                  title="Chọn nguồn thu"
                  options={INCOME_CATEGORIES}
                  value={field.value}
                  onChange={(v) => field.onChange(String(v))}
                  placeholder="Chọn nguồn thu..."
                  disabled={isPending}
                  autoOpen={initiallyExpanded && watchedType === ""}
                  onAfterSelect={() => amountRef.current?.focus()}
                />
              )}
            />

            <div className="bg-background border-border flex h-12 items-center border px-3.5">
              <input
                ref={amountRef}
                inputMode="numeric"
                placeholder="Số tiền"
                value={displayValue}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  const num = parseInt(raw, 10) || 0;
                  form.setValue(`actual_income_details.${index}.amount`, num, {
                    shouldValidate: true,
                  });
                }}
                disabled={isPending}
                className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none"
              />
              <span className="text-foreground-muted shrink-0 text-[13px]">
                ₫
              </span>
            </div>

            <div className="bg-background border-border flex h-10 items-center border px-3.5">
              <input
                {...form.register(`actual_income_details.${index}.note`)}
                placeholder="Ghi chú (tùy chọn)..."
                disabled={isPending}
                className="text-foreground-muted placeholder:text-foreground-muted/50 w-full bg-transparent text-[11px] outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseRow({
  index,
  form,
  remove,
  isPending,
  initiallyExpanded = false,
}: {
  index: number;
  form: UseFormReturn<MonthlyActualInput>;
  remove: (index: number) => void;
  isPending: boolean;
  initiallyExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const watchedType = form.watch(
    `actual_expense_details.${index}.type` as const
  );
  const currentAmount = form.watch(
    `actual_expense_details.${index}.amount` as const
  );
  const watchedNote = form.watch(
    `actual_expense_details.${index}.note` as const
  );
  const amountDisplay =
    currentAmount > 0
      ? new Intl.NumberFormat("vi-VN").format(currentAmount)
      : "";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isExpanded) setIsConfirmingDelete(false);
  }, [isExpanded]);

  return (
    <div className="bg-background border-border overflow-hidden border">
      {/* ── Always-visible header row ── */}
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px] uppercase">
            Khoản Chi #{index + 1}
          </div>
          {!isExpanded && (
            <>
              <div
                className={`mt-0.5 truncate text-[13px] font-medium ${watchedType ? "text-foreground" : "text-foreground-muted"}`}
              >
                {watchedType || "Chưa chọn danh mục"}
              </div>
              {watchedNote && (
                <div className="text-foreground-muted mt-0.5 truncate text-[11px]">
                  {watchedNote}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isExpanded && (
            <span
              className={`text-[14px] font-bold ${currentAmount > 0 ? "text-accent" : "text-foreground-muted"}`}
            >
              {currentAmount > 0
                ? new Intl.NumberFormat("vi-VN").format(currentAmount) + " ₫"
                : "—"}
            </span>
          )}
          {isExpanded ? (
            <>
              {isConfirmingDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="px-2 py-1 text-[10px] font-bold tracking-[1px] text-red-400 uppercase"
                  >
                    XOÁ?
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="text-foreground-muted hover:text-foreground px-2 py-1 text-[10px] font-bold tracking-[1px] uppercase"
                  >
                    HUỶ
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setIsExpanded(false)}
                    className="text-foreground-muted hover:text-foreground p-2 disabled:opacity-50"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setIsConfirmingDelete(true)}
                    className="text-foreground-muted -mr-1 px-2 hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsExpanded(true)}
              className="text-foreground-muted hover:text-foreground -mr-1 p-1 disabled:opacity-50"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Animated expandable form ── */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 px-4 pb-4">
            <Controller
              name={`actual_expense_details.${index}.type` as const}
              control={form.control}
              render={({ field }) => (
                <OptionPicker
                  title="Loại chi tiêu"
                  options={EXPENSE_CATEGORIES}
                  value={field.value}
                  onChange={(v) => field.onChange(String(v))}
                  placeholder="Chọn loại chi tiêu..."
                  disabled={isPending}
                  autoOpen={initiallyExpanded && watchedType === ""}
                  onAfterSelect={() => amountRef.current?.focus()}
                />
              )}
            />

            <div className="bg-background border-border flex h-12 items-center border px-3.5">
              <input
                ref={amountRef}
                inputMode="numeric"
                placeholder="Số tiền"
                value={amountDisplay}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  const num = raw ? parseInt(raw, 10) : 0;
                  form.setValue(
                    `actual_expense_details.${index}.amount` as const,
                    num,
                    { shouldValidate: true }
                  );
                }}
                disabled={isPending}
                className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none"
              />
              <span className="text-foreground-muted shrink-0 text-[13px]">
                ₫
              </span>
            </div>

            <div className="bg-background border-border flex h-10 items-center border px-3.5">
              <input
                {...form.register(
                  `actual_expense_details.${index}.note` as const
                )}
                placeholder="Ghi chú (tùy chọn)..."
                disabled={isPending}
                className="text-foreground-muted placeholder:text-foreground-muted/50 w-full bg-transparent text-[11px] outline-none"
              />
            </div>
          </div>
        </div>
      </div>
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
