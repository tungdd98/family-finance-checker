"use client";

import { useState, useEffect, useRef } from "react";
import type { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Plus, ChevronUp, Trash2, Pencil, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionPicker } from "@/components/common";
import type { MonthlyActualInput } from "@/lib/validations/goals";
import { EXPENSE_CATEGORIES } from "../constants";

interface ExpenseTabProps {
  form: UseFormReturn<MonthlyActualInput>;
  fields: FieldArrayWithId<MonthlyActualInput, "actual_expense_details">[];
  append: (value: { type: string; amount: number; note: string }) => void;
  remove: (index: number) => void;
  isPending: boolean;
  newExpenseIndex: number | null;
  expenseDisplay: string;
}

export function ExpenseTab({
  form,
  fields,
  append,
  remove,
  isPending,
  newExpenseIndex,
  expenseDisplay,
}: ExpenseTabProps) {
  return (
    <div className="flex flex-col gap-5">
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
        {fields.map((field, index) => (
          <ExpenseRow
            key={field.id}
            index={index}
            form={form}
            remove={remove}
            isPending={isPending}
            initiallyExpanded={index === newExpenseIndex}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            append({ type: "", amount: 0, note: "" });
          }}
          className="text-foreground-muted hover:text-foreground mt-2 h-12 w-full border-dashed bg-transparent"
        >
          <Plus size={16} className="mr-2" />
          THÊM KHOẢN CHI
        </Button>
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
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="type-card-label">Khoản Chi #{index + 1}</div>
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
