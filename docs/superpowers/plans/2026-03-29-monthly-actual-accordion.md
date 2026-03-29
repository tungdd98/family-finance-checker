# Monthly Actual Sheet — Accordion UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert IncomeRow/ExpenseRow in MonthlyActualSheet to accordion-style components with collapsed summaries, auto-expand on add, OptionPicker auto-open, and amount auto-focus after type selection.

**Architecture:** Local `isExpanded` state per row; `newIncomeIndex`/`newExpenseIndex` state in parent to flag newly-added items; `autoOpen` + `onAfterSelect` props added to OptionPicker; `useRef` on amount input to receive focus after picker closes.

**Tech Stack:** React hooks (useState, useRef, useEffect), react-hook-form useFieldArray, Base UI Dialog (existing OptionPicker), Lucide icons (Pencil, ChevronUp)

---

### Task 1: Add `autoOpen` and `onAfterSelect` to OptionPicker

**Files:**

- Modify: `src/app/(protected)/savings/components/OptionPicker.tsx`

- [ ] **Step 1: Add useEffect to React import**

Replace the current import line:

```tsx
import { useState } from "react";
```

With:

```tsx
import { useState, useEffect } from "react";
```

- [ ] **Step 2: Add new props to the Props interface**

Replace:

```tsx
interface Props {
  title: string;
  options: OptionItem[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

With:

```tsx
interface Props {
  title: string;
  options: OptionItem[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  autoOpen?: boolean;
  onAfterSelect?: () => void;
}
```

- [ ] **Step 3: Destructure new props in function signature**

Replace:

```tsx
export function OptionPicker({
  title,
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
```

With:

```tsx
export function OptionPicker({
  title,
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  disabled,
  autoOpen,
  onAfterSelect,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) {
      const t = setTimeout(() => setOpen(true), 0);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 4: Call onAfterSelect in option click handler**

Replace:

```tsx
onClick={() => {
  onChange(o.value);
  setOpen(false);
}}
```

With:

```tsx
onClick={() => {
  onChange(o.value);
  setOpen(false);
  onAfterSelect?.();
}}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /Users/mac/Desktop/family-finance-tracker && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or pre-existing unrelated errors only — none in OptionPicker.tsx)

- [ ] **Step 6: Commit**

```bash
cd /Users/mac/Desktop/family-finance-tracker
git add src/app/(protected)/savings/components/OptionPicker.tsx
git commit -m "feat(option-picker): add autoOpen and onAfterSelect props"
```

---

### Task 2: Refactor IncomeRow to accordion

**Files:**

- Modify: `src/app/(protected)/goals/components/MonthlyActualSheet.tsx`

- [ ] **Step 1: Update Lucide import to add Pencil and ChevronUp**

Replace:

```tsx
import { X, Plus, Trash2, ChevronRight, Info } from "lucide-react";
```

With:

```tsx
import { X, Plus, Trash2, ChevronUp, Info, Pencil } from "lucide-react";
```

- [ ] **Step 2: Add useRef to React import**

Replace:

```tsx
import { useState, useTransition, useEffect } from "react";
```

With:

```tsx
import { useState, useTransition, useEffect, useRef } from "react";
```

- [ ] **Step 3: Add newIncomeIndex state and cleanup effect inside MonthlyActualSheet**

After the `useFieldArray` block for incomeFields (after `removeIncome` is declared), add:

```tsx
const [newIncomeIndex, setNewIncomeIndex] = useState<number | null>(null);

useEffect(() => {
  if (newIncomeIndex !== null) setNewIncomeIndex(null);
}, [incomeFields.length]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 4: Update "Thêm khoản thu" button onClick**

Replace:

```tsx
onClick={() =>
  appendIncome({ type: "", amount: 0, note: "" })
}
```

With:

```tsx
onClick={() => {
  const idx = incomeFields.length;
  appendIncome({ type: "", amount: 0, note: "" });
  setNewIncomeIndex(idx);
}}
```

- [ ] **Step 5: Pass initiallyExpanded prop to each IncomeRow**

Replace:

```tsx
{
  incomeFields.map((field, index) => (
    <IncomeRow
      key={field.id}
      index={index}
      form={form}
      remove={removeIncome}
      isPending={isPending}
    />
  ));
}
```

With:

```tsx
{
  incomeFields.map((field, index) => (
    <IncomeRow
      key={field.id}
      index={index}
      form={form}
      remove={removeIncome}
      isPending={isPending}
      initiallyExpanded={index === newIncomeIndex}
    />
  ));
}
```

- [ ] **Step 6: Rewrite the IncomeRow function**

Replace the entire `IncomeRow` function (from `function IncomeRow(` to its closing `}`) with:

```tsx
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
  const amountRef = useRef<HTMLInputElement>(null);

  const watchedType = form.watch(`actual_income_details.${index}.type`);
  const watchedAmount = form.watch(`actual_income_details.${index}.amount`);
  const displayValue =
    watchedAmount > 0
      ? new Intl.NumberFormat("vi-VN").format(watchedAmount)
      : "";

  if (!isExpanded) {
    return (
      <div className="bg-background border-border flex items-center gap-3 border p-4">
        <div className="min-w-0 flex-1">
          <div className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px] uppercase">
            Khoản Thu #{index + 1}
          </div>
          <div
            className={`mt-0.5 truncate text-[13px] font-medium ${watchedType ? "text-foreground" : "text-foreground-muted"}`}
          >
            {watchedType || "Chưa chọn danh mục"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={`text-[14px] font-bold ${watchedAmount > 0 ? "text-accent" : "text-foreground-muted"}`}
          >
            {watchedAmount > 0
              ? new Intl.NumberFormat("vi-VN").format(watchedAmount) + " ₫"
              : "—"}
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setIsExpanded(true)}
            className="text-foreground-muted hover:text-foreground -mr-1 p-1 disabled:opacity-50"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border-border flex flex-col gap-3 border p-4 transition-all">
      <div className="flex items-center justify-between">
        <Label>Khoản Thu #{index + 1}</Label>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-foreground-muted hover:text-foreground p-2"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => remove(index)}
            className="text-foreground-muted -mr-2 px-2 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
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

        <div className="flex gap-2">
          <div className="bg-background border-border flex h-12 flex-1 items-center border px-3.5">
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
  );
}
```

- [ ] **Step 7: Verify TypeScript**

```bash
cd /Users/mac/Desktop/family-finance-tracker && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in MonthlyActualSheet.tsx

- [ ] **Step 8: Commit**

```bash
cd /Users/mac/Desktop/family-finance-tracker
git add src/app/(protected)/goals/components/MonthlyActualSheet.tsx
git commit -m "feat(goals): accordion IncomeRow with auto-expand and auto-open picker"
```

---

### Task 3: Refactor ExpenseRow to accordion

**Files:**

- Modify: `src/app/(protected)/goals/components/MonthlyActualSheet.tsx`

- [ ] **Step 1: Add newExpenseIndex state and cleanup effect inside MonthlyActualSheet**

After the `newIncomeIndex` state + its useEffect, add:

```tsx
const [newExpenseIndex, setNewExpenseIndex] = useState<number | null>(null);

useEffect(() => {
  if (newExpenseIndex !== null) setNewExpenseIndex(null);
}, [expenseFields.length]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 2: Update "Thêm khoản chi" button onClick**

Replace:

```tsx
onClick={() =>
  appendExpense({ type: "", amount: 0, note: "" })
}
```

With:

```tsx
onClick={() => {
  const idx = expenseFields.length;
  appendExpense({ type: "", amount: 0, note: "" });
  setNewExpenseIndex(idx);
}}
```

- [ ] **Step 3: Pass initiallyExpanded prop to each ExpenseRow**

Replace:

```tsx
{
  expenseFields.map((field, index) => (
    <ExpenseRow
      key={field.id}
      index={index}
      form={form}
      remove={removeExpense}
      isPending={isPending}
    />
  ));
}
```

With:

```tsx
{
  expenseFields.map((field, index) => (
    <ExpenseRow
      key={field.id}
      index={index}
      form={form}
      remove={removeExpense}
      isPending={isPending}
      initiallyExpanded={index === newExpenseIndex}
    />
  ));
}
```

- [ ] **Step 4: Rewrite the ExpenseRow function**

Replace the entire `ExpenseRow` function (from `function ExpenseRow(` to its closing `}`) with:

```tsx
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
  const amountRef = useRef<HTMLInputElement>(null);

  const watchedType = form.watch(
    `actual_expense_details.${index}.type` as const
  );
  const currentAmount = form.watch(
    `actual_expense_details.${index}.amount` as const
  );
  const amountDisplay =
    currentAmount > 0
      ? new Intl.NumberFormat("vi-VN").format(currentAmount)
      : "";

  if (!isExpanded) {
    return (
      <div className="bg-background border-border flex items-center gap-3 border p-4">
        <div className="min-w-0 flex-1">
          <div className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px] uppercase">
            Khoản Chi #{index + 1}
          </div>
          <div
            className={`mt-0.5 truncate text-[13px] font-medium ${watchedType ? "text-foreground" : "text-foreground-muted"}`}
          >
            {watchedType || "Chưa chọn danh mục"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={`text-[14px] font-bold ${currentAmount > 0 ? "text-accent" : "text-foreground-muted"}`}
          >
            {currentAmount > 0
              ? new Intl.NumberFormat("vi-VN").format(currentAmount) + " ₫"
              : "—"}
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setIsExpanded(true)}
            className="text-foreground-muted hover:text-foreground -mr-1 p-1 disabled:opacity-50"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border-border flex flex-col gap-3 border p-4 transition-all">
      <div className="flex items-center justify-between">
        <Label>Khoản Chi #{index + 1}</Label>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-foreground-muted hover:text-foreground p-2"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => remove(index)}
            className="text-foreground-muted -mr-2 px-2 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
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

        <div className="flex gap-2">
          <div className="bg-background border-border flex h-12 flex-1 items-center border px-3.5">
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
        </div>

        <div className="bg-background border-border flex h-10 items-center border px-3.5">
          <input
            {...form.register(`actual_expense_details.${index}.note` as const)}
            placeholder="Ghi chú (tùy chọn)..."
            disabled={isPending}
            className="text-foreground-muted placeholder:text-foreground-muted/50 w-full bg-transparent text-[11px] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /Users/mac/Desktop/family-finance-tracker && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
cd /Users/mac/Desktop/family-finance-tracker
git add src/app/(protected)/goals/components/MonthlyActualSheet.tsx
git commit -m "feat(goals): accordion ExpenseRow with auto-expand and auto-open picker"
```
