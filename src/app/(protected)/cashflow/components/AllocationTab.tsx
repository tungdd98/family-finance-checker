"use client";

import type { ReactNode } from "react";
import type { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionPicker } from "@/components/common";
import { formatVND } from "@/lib/gold-utils";
import type { MonthlyActualInput } from "@/lib/validations/goals";

interface AllocationTabProps {
  form: UseFormReturn<MonthlyActualInput>;
  fields: FieldArrayWithId<MonthlyActualInput, "allocations">[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  append: (value: any) => void;
  remove: (index: number) => void;
  isPending: boolean;
  surplus: number;
  delta: number | null;
  allocations: MonthlyActualInput["allocations"];
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="type-card-label">{children}</span>;
}

export function AllocationTab({
  form,
  fields,
  append,
  remove,
  isPending,
  surplus,
  delta,
  allocations,
}: AllocationTabProps) {
  const totalAllocated = allocations.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const unallocated = surplus - totalAllocated;

  return (
    <div className="flex flex-col gap-5">
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
              type: "gold" as string,
              amount: unallocated > 0 ? unallocated : 0,
              is_executed: false,
            })
          }
          className="text-foreground-muted hover:text-foreground h-12 w-full border-dashed bg-transparent"
        >
          + THÊM KHOẢN PHÂN BỔ
        </Button>
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
