# Ticket 5: CashflowClient Decomposition — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tách `CashflowClient.tsx` (1004 dòng) thành các file nhỏ có trách nhiệm rõ ràng. File gốc chỉ còn là orchestrator: state, handlers, layout chính.

**Architecture:** Tách theo chiều dọc (responsibility), không theo chiều ngang (layer). Mỗi sub-component nhận đúng những gì nó cần qua props — không share global state, không context.

**Tech Stack:** React, `react-hook-form`, `@base-ui/react/tabs`, TypeScript

> **Prerequisite:** Ticket 6 (OptionPicker migration) cần làm trước ticket này để `CashflowClient` đã dùng import đúng từ `@/components/common`.

---

## File Map

| File                                                        | Trạng thái  | Trách nhiệm                                            |
| ----------------------------------------------------------- | ----------- | ------------------------------------------------------ |
| `src/app/(protected)/cashflow/constants.ts`                 | **Tạo mới** | EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatMil       |
| `src/app/(protected)/cashflow/components/IncomeTab.tsx`     | **Tạo mới** | Tab thu nhập: summary header + danh sách IncomeRow     |
| `src/app/(protected)/cashflow/components/ExpenseTab.tsx`    | **Tạo mới** | Tab chi tiêu: summary header + danh sách ExpenseRow    |
| `src/app/(protected)/cashflow/components/AllocationTab.tsx` | **Tạo mới** | Tab phân bổ: surplus display + danh sách AllocationRow |
| `src/app/(protected)/cashflow/CashflowClient.tsx`           | **Sửa**     | State, form setup, navigation, submit handler, layout  |

---

### Task 1: Tách constants và formatMil

**Files:**

- Create: `src/app/(protected)/cashflow/constants.ts`

- [ ] **Step 1: Tạo constants.ts**

```ts
// src/app/(protected)/cashflow/constants.ts

export const EXPENSE_CATEGORIES = [
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

export const INCOME_CATEGORIES = [
  { value: "Lương Chồng", label: "Lương Chồng" },
  { value: "Lương Vợ", label: "Lương Vợ" },
  { value: "Thưởng", label: "Thưởng" },
  { value: "Thu nhập ngoài", label: "Thu nhập ngoài" },
  { value: "Khác", label: "Khác" },
];

export function formatMil(value: number): string {
  const mil = value / 1_000_000;
  return mil % 1 === 0 ? mil.toFixed(0) : mil.toFixed(1);
}
```

- [ ] **Step 2: Update CashflowClient.tsx để dùng constants mới**

Trong `CashflowClient.tsx`:

- Xóa 3 định nghĩa: `EXPENSE_CATEGORIES`, `INCOME_CATEGORIES`, `formatMil`
- Thêm import:

```ts
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatMil } from "./constants";
```

- [ ] **Step 3: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/cashflow/constants.ts src/app/\(protected\)/cashflow/CashflowClient.tsx
git commit -m "refactor: extract cashflow constants and formatMil to constants.ts"
```

---

### Task 2: Tách IncomeTab

**Files:**

- Create: `src/app/(protected)/cashflow/components/IncomeTab.tsx`

> `IncomeRow` là function component hiện đang định nghĩa local trong `CashflowClient.tsx` (khoảng dòng 636). Nó sẽ được move vào cùng file với `IncomeTab`.

- [ ] **Step 1: Tìm IncomeRow và IncomeTab content trong CashflowClient**

```bash
grep -n "function IncomeRow\|IncomeRow\|Tabs.Panel.*income\|panel.*income" src/app/\(protected\)/cashflow/CashflowClient.tsx
```

- [ ] **Step 2: Tạo IncomeTab.tsx**

Cắt toàn bộ `function IncomeRow` và Tabs.Panel "income" từ CashflowClient. Tạo file:

```tsx
// src/app/(protected)/cashflow/components/IncomeTab.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import type { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Plus, ChevronUp, Trash2 } from "lucide-react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionPicker } from "@/components/common";
import type { MonthlyActualInput } from "@/lib/validations/goals";
import { INCOME_CATEGORIES } from "../constants";

interface IncomeTabProps {
  form: UseFormReturn<MonthlyActualInput>;
  fields: FieldArrayWithId<MonthlyActualInput, "actual_income_details">[];
  append: (value: { type: string; amount: number; note: string }) => void;
  remove: (index: number) => void;
  isPending: boolean;
  newIncomeIndex: number | null;
  totalIncome: number;
  incomeTotalDisplay: string;
}

export function IncomeTab({
  form,
  fields,
  append,
  remove,
  isPending,
  newIncomeIndex,
  totalIncome,
  incomeTotalDisplay,
}: IncomeTabProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Summary header */}
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
        {fields.map((field, index) => (
          <IncomeRow
            key={field.id}
            index={index}
            form={form}
            remove={remove}
            isPending={isPending}
            initiallyExpanded={index === newIncomeIndex}
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
          THÊM KHOẢN THU
        </Button>
      </div>
    </div>
  );
}

// ── IncomeRow (local to this tab) ──────────────────────────────────────────

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
  // [Paste the full IncomeRow implementation from CashflowClient.tsx here]
  // Include all state, effects, and JSX exactly as-is from the original file
}
```

> **Quan trọng:** Paste nguyên phần implementation của `IncomeRow` từ `CashflowClient.tsx` vào chỗ comment trên. Không viết lại từ đầu.

- [ ] **Step 3: Update CashflowClient — xóa IncomeRow, dùng IncomeTab**

Trong `CashflowClient.tsx`:

1. Xóa `function IncomeRow` (toàn bộ)
2. Xóa Tabs.Panel "income" và content của nó
3. Thêm import:

```ts
import { IncomeTab } from "./components/IncomeTab";
```

4. Trong JSX, thay Tabs.Panel "income" bằng:

```tsx
<Tabs.Panel value="income" className="flex flex-col gap-5 outline-none">
  <IncomeTab
    form={form}
    fields={incomeFields}
    append={appendIncome}
    remove={removeIncome}
    isPending={isPending}
    newIncomeIndex={newIncomeIndex}
    totalIncome={totalIncome}
    incomeTotalDisplay={incomeTotalDisplay}
  />
</Tabs.Panel>
```

> Giữ `setNewIncomeIndex` ở `CashflowClient` — nó được set khi click "Thêm khoản thu". Truyền callback vào IncomeTab nếu cần, hoặc đơn giản hơn: trong handler của nút "Thêm" trong `IncomeTab`, gọi `append` rồi truyền index qua prop.

- [ ] **Step 4: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/cashflow/components/IncomeTab.tsx src/app/\(protected\)/cashflow/CashflowClient.tsx
git commit -m "refactor: extract IncomeRow and IncomeTab from CashflowClient"
```

---

### Task 3: Tách ExpenseTab

**Files:**

- Create: `src/app/(protected)/cashflow/components/ExpenseTab.tsx`

- [ ] **Step 1: Tìm ExpenseRow trong CashflowClient**

```bash
grep -n "function ExpenseRow\|ExpenseRow" src/app/\(protected\)/cashflow/CashflowClient.tsx
```

- [ ] **Step 2: Tạo ExpenseTab.tsx**

Cấu trúc tương tự `IncomeTab.tsx` nhưng cho expense:

```tsx
// src/app/(protected)/cashflow/components/ExpenseTab.tsx
"use client";

import { useState, useRef } from "react";
import type { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Plus, ChevronUp, Trash2, Info } from "lucide-react";
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
  totalExpense: number;
  expenseDisplay: string;
}

export function ExpenseTab({
  form,
  fields,
  append,
  remove,
  isPending,
  newExpenseIndex,
  totalExpense,
  expenseDisplay,
}: ExpenseTabProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Summary header */}
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
  // [Paste ExpenseRow implementation from CashflowClient.tsx here]
}
```

- [ ] **Step 3: Update CashflowClient — xóa ExpenseRow, dùng ExpenseTab**

1. Xóa `function ExpenseRow`
2. Xóa Tabs.Panel "expense"
3. Thêm import: `import { ExpenseTab } from "./components/ExpenseTab";`
4. Thay Panel:

```tsx
<Tabs.Panel value="expense" className="flex flex-col gap-5 outline-none">
  <ExpenseTab
    form={form}
    fields={expenseFields}
    append={appendExpense}
    remove={removeExpense}
    isPending={isPending}
    newExpenseIndex={newExpenseIndex}
    totalExpense={totalExpense}
    expenseDisplay={expenseDisplay}
  />
</Tabs.Panel>
```

- [ ] **Step 4: Build check và commit**

```bash
npx tsc --noEmit
git add src/app/\(protected\)/cashflow/components/ExpenseTab.tsx src/app/\(protected\)/cashflow/CashflowClient.tsx
git commit -m "refactor: extract ExpenseRow and ExpenseTab from CashflowClient"
```

---

### Task 4: Tách AllocationTab

**Files:**

- Create: `src/app/(protected)/cashflow/components/AllocationTab.tsx`

- [ ] **Step 1: Tạo AllocationTab.tsx**

`AllocationRow` hiện ở khoảng dòng 503 trong CashflowClient. Cắt và đặt vào:

```tsx
// src/app/(protected)/cashflow/components/AllocationTab.tsx
"use client";

import type { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { OptionPicker } from "@/components/common";
import { formatVND } from "@/lib/utils";
import type { MonthlyActualInput } from "@/lib/validations/goals";

interface AllocationTabProps {
  form: UseFormReturn<MonthlyActualInput>;
  fields: FieldArrayWithId<MonthlyActualInput, "allocations">[];
  append: (value: {
    type: string;
    amount: number;
    is_executed: boolean;
  }) => void;
  remove: (index: number) => void;
  isPending: boolean;
  surplus: number;
  delta: number | null;
  allocations: MonthlyActualInput["allocations"];
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
      {/* [Paste Tabs.Panel "allocation" content từ CashflowClient.tsx vào đây] */}
      {/* Bao gồm surplus summary và danh sách AllocationRow */}
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
  // [Paste AllocationRow implementation từ CashflowClient.tsx]
}
```

- [ ] **Step 2: Update CashflowClient — xóa AllocationRow, dùng AllocationTab**

1. Xóa `function AllocationRow`
2. Xóa Tabs.Panel "allocation" và `totalAllocated`, `unallocated` calculations (đã move vào AllocationTab)
3. Thêm import: `import { AllocationTab } from "./components/AllocationTab";`
4. Thay Panel:

```tsx
<Tabs.Panel value="allocation" className="flex flex-col gap-5 outline-none">
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
```

- [ ] **Step 3: Xóa các biến đã move khỏi CashflowClient**

Xóa khỏi CashflowClient (đã move vào AllocationTab):

- `const totalAllocated = ...`
- `const unallocated = ...`

- [ ] **Step 4: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors. Nếu có lỗi thiếu variable, kiểm tra lại xem biến nào cần giữ ở CashflowClient.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/cashflow/components/AllocationTab.tsx src/app/\(protected\)/cashflow/CashflowClient.tsx
git commit -m "refactor: extract AllocationRow and AllocationTab from CashflowClient"
```

---

### Task 5: Verify kích thước cuối cùng

- [ ] **Step 1: Kiểm tra số dòng**

```bash
wc -l src/app/\(protected\)/cashflow/CashflowClient.tsx \
       src/app/\(protected\)/cashflow/constants.ts \
       src/app/\(protected\)/cashflow/components/IncomeTab.tsx \
       src/app/\(protected\)/cashflow/components/ExpenseTab.tsx \
       src/app/\(protected\)/cashflow/components/AllocationTab.tsx
```

Expected: `CashflowClient.tsx` còn khoảng 200-250 dòng (state, form setup, navigation, submit, layout).
