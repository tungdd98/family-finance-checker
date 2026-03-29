# Navigation Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure app navigation — replace per-asset bottom tabs with an Asset Hub, promote Thu/Chi to a first-class page, move Goals to bottom nav, and relocate Settings to header.

**Architecture:** Five tasks in dependency order. Tasks 1–2 are pure nav wiring (no new pages). Tasks 3–4 create the two new pages. Task 5 cleans up Goals. Each task produces a working, committable state.

**Tech Stack:** Next.js 15 App Router (server + client components), Tailwind CSS, react-hook-form + zod, @base-ui/react Tabs/Drawer, lucide-react icons, Supabase server client.

---

## File Map

**Modified:**

- `src/components/common/tab-bar.tsx` — new TAB_ITEMS
- `src/app/(protected)/layout.tsx` — swap Trophy → Settings icon in header
- `src/app/(protected)/goals/GoalsClient.tsx` — remove MonthlyActualSheet, wire button to /cashflow
- `src/app/(protected)/goals/components/GoalCard.tsx` — change `onLogMonth` call site to navigate

**Created:**

- `src/app/(protected)/assets/page.tsx` — Asset Hub server component
- `src/app/(protected)/assets/AssetsClient.tsx` — hub UI (net worth banner + 2×2 grid)
- `src/app/(protected)/cashflow/page.tsx` — Cashflow server component (reads search params)
- `src/app/(protected)/cashflow/CashflowClient.tsx` — full form page (adapted from MonthlyActualSheet)

---

## Task 1: Update Tab Bar + Header

**Files:**

- Modify: `src/components/common/tab-bar.tsx`
- Modify: `src/app/(protected)/layout.tsx`

- [ ] **Step 1: Update TAB_ITEMS in tab-bar.tsx**

Replace the entire `TAB_ITEMS` array and imports:

```tsx
import {
  ArrowLeftRight,
  House,
  LayoutGrid,
  Target,
  TrendingUp,
} from "lucide-react";

const TAB_ITEMS = [
  { icon: House, label: "DASHBOARD", href: "/dashboard" },
  { icon: LayoutGrid, label: "TÀI SẢN", href: "/assets" },
  { icon: TrendingUp, label: "THỊ TRƯỜNG", href: "/market" },
  { icon: ArrowLeftRight, label: "THU/CHI", href: "/cashflow" },
  { icon: Target, label: "MỤC TIÊU", href: "/goals" },
];
```

- [ ] **Step 2: Update header in layout.tsx**

Replace the Trophy/Link block with a Settings icon. Change the import from `Trophy` to `Settings`, and update the JSX:

```tsx
import { Settings } from "lucide-react";

// Replace the <Link href="/goals">...</Link> block with:
<Link href="/settings">
  <div className="bg-surface/50 border-border flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border">
    <Settings size={20} className="text-accent" />
  </div>
</Link>;
```

- [ ] **Step 3: Run dev server and visually verify**

```bash
npm run dev
```

Open http://localhost:3000. Confirm:

- Bottom nav shows: Dashboard · Tài Sản · Thị Trường · Thu/Chi · Mục Tiêu
- Header right side shows: 🔔 bell + ⚙️ settings icon (no trophy)
- Tapping Dashboard, Thị Trường, Mục Tiêu still works
- Tapping Tài Sản and Thu/Chi shows 404 (expected — pages not created yet)

- [ ] **Step 4: Commit**

```bash
git add src/components/common/tab-bar.tsx src/app/\(protected\)/layout.tsx
git commit -m "feat(nav): restructure bottom nav and move settings to header"
```

---

## Task 2: Create Asset Hub Page (`/assets`)

**Files:**

- Create: `src/app/(protected)/assets/page.tsx`
- Create: `src/app/(protected)/assets/AssetsClient.tsx`

- [ ] **Step 1: Create AssetsClient.tsx**

```tsx
// src/app/(protected)/assets/AssetsClient.tsx
"use client";

import { useRouter } from "next/navigation";
import { formatVND } from "@/lib/gold-utils";

interface Props {
  savingsTotal: number;
  goldTotal: number;
}

export function AssetsClient({ savingsTotal, goldTotal }: Props) {
  const router = useRouter();
  const netWorth = savingsTotal + goldTotal;

  return (
    <div className="flex flex-col gap-5 pb-20">
      <div className="pt-2">
        <h1 className="text-foreground text-[28px] font-bold tracking-[-1px] uppercase">
          Tài Sản
        </h1>
      </div>

      {/* Net worth banner */}
      <div className="bg-surface border-border flex flex-col gap-1 border p-5">
        <span className="text-foreground-muted text-[10px] font-semibold tracking-[1px] uppercase">
          Tổng tài sản
        </span>
        <span className="text-[32px] font-black tracking-[-1px] text-[#D4AF37]">
          {formatVND(netWorth)}
        </span>
      </div>

      {/* 2×2 asset grid */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/gold")}
          className="bg-surface border-border flex flex-col gap-2 border p-4 text-left"
        >
          <span className="text-foreground-muted text-[10px] font-semibold tracking-[1px] uppercase">
            Vàng
          </span>
          <span className="text-foreground text-[20px] font-bold tracking-[-0.5px]">
            {formatVND(goldTotal)}
          </span>
        </button>

        <button
          onClick={() => router.push("/savings")}
          className="bg-surface border-border flex flex-col gap-2 border p-4 text-left"
        >
          <span className="text-foreground-muted text-[10px] font-semibold tracking-[1px] uppercase">
            Tiết Kiệm
          </span>
          <span className="text-foreground text-[20px] font-bold tracking-[-0.5px]">
            {formatVND(savingsTotal)}
          </span>
        </button>

        <div className="bg-surface border-border flex flex-col gap-2 border border-dashed p-4 opacity-40">
          <span className="text-foreground-muted text-[10px] font-semibold tracking-[1px] uppercase">
            Coin
          </span>
          <span className="text-foreground-muted text-[13px]">Sắp ra mắt</span>
        </div>

        <div className="bg-surface border-border flex flex-col gap-2 border border-dashed p-4 opacity-40">
          <span className="text-foreground-muted text-[10px] font-semibold tracking-[1px] uppercase">
            Chứng Khoán
          </span>
          <span className="text-foreground-muted text-[13px]">Sắp ra mắt</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create assets/page.tsx**

```tsx
// src/app/(protected)/assets/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getSavingsAccounts,
  calcAccruedInterest,
} from "@/lib/services/savings";
import {
  getActiveGoldAssets,
  getExternalGoldPrices,
} from "@/lib/services/gold";
import { calcPnl, CHI_PER_LUONG } from "@/lib/gold-utils";
import { AssetsClient } from "./AssetsClient";

export default async function AssetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [savingsAccounts, goldPositions, prices] = await Promise.all([
    getSavingsAccounts(supabase, user.id),
    getActiveGoldAssets(supabase, user.id),
    getExternalGoldPrices(),
  ]);

  const savingsTotal = savingsAccounts.reduce(
    (s, a) => s + a.principal + calcAccruedInterest(a),
    0
  );

  const priceMap = new Map((prices ?? []).map((p) => [p.type_code, p]));
  const goldTotal = goldPositions.reduce((s, pos) => {
    const remaining = pos.quantity - pos.sold_quantity;
    const livePrice = priceMap.get(pos.brand_code);
    if (livePrice) {
      return (
        s +
        calcPnl(
          remaining,
          pos.buy_price_per_chi,
          livePrice.sell / CHI_PER_LUONG
        ).currentValue
      );
    }
    return s + remaining * pos.buy_price_per_chi;
  }, 0);

  return <AssetsClient savingsTotal={savingsTotal} goldTotal={goldTotal} />;
}
```

- [ ] **Step 3: Verify /assets page renders**

Visit http://localhost:3000/assets. Confirm:

- Page title "TÀI SẢN" renders
- Net worth banner shows combined total
- Vàng and Tiết Kiệm cards show values and are tappable
- Coin and Chứng Khoán cards show "Sắp ra mắt" and are visually dimmed
- Tapping Vàng navigates to /gold; Tiết Kiệm → /savings

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/assets/
git commit -m "feat(assets): add Asset Hub page with net worth banner and 2x2 grid"
```

---

## Task 3: Create Cashflow Page (`/cashflow`)

This page replaces the MonthlyActualSheet that previously lived inside Goals. It is a full-page form for recording monthly income and expenses.

The page uses URL search params `?year=YYYY&month=M` for month navigation (server fetches the correct record). The form logic is adapted directly from `MonthlyActualSheet.tsx` — the Drawer/backdrop wrapper is removed, and a month selector + summary row are added at the top.

**Files:**

- Create: `src/app/(protected)/cashflow/page.tsx`
- Create: `src/app/(protected)/cashflow/CashflowClient.tsx`

- [ ] **Step 1: Create cashflow/page.tsx**

```tsx
// src/app/(protected)/cashflow/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getMonthlyActual, getCashFlow } from "@/lib/services/goals";
import { CashflowClient } from "./CashflowClient";

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function CashflowPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;

  const [existing, cashFlow] = await Promise.all([
    getMonthlyActual(supabase, user.id, year, month),
    getCashFlow(supabase, user.id),
  ]);

  return (
    <CashflowClient
      year={year}
      month={month}
      existing={existing}
      cashFlow={cashFlow}
    />
  );
}
```

- [ ] **Step 2: Create CashflowClient.tsx — imports and types**

```tsx
// src/app/(protected)/cashflow/CashflowClient.tsx
"use client";

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
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ChevronUp,
  Info,
  Pencil,
} from "lucide-react";
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

interface Props {
  year: number;
  month: number;
  existing: MonthlyActual | null;
  cashFlow: HouseholdCashFlow | null;
}
```

- [ ] **Step 3: Add CashflowClient main component body**

Append to `CashflowClient.tsx` after the `Props` interface:

```tsx
export function CashflowClient({ year, month, existing, cashFlow }: Props) {
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
  } = useFieldArray({ control: form.control, name: "allocations" });
  const {
    fields: incomeFields,
    append: appendIncome,
    remove: removeIncome,
  } = useFieldArray({ control: form.control, name: "actual_income_details" });
  const {
    fields: expenseFields,
    append: appendExpense,
    remove: removeExpense,
  } = useFieldArray({ control: form.control, name: "actual_expense_details" });

  const [newIncomeIndex, setNewIncomeIndex] = useState<number | null>(null);
  const [newExpenseIndex, setNewExpenseIndex] = useState<number | null>(null);

  useEffect(() => {
    if (newIncomeIndex !== null) setNewIncomeIndex(null);
  }, [incomeFields.length]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const totalAllocated = allocations.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const unallocated = surplus - totalAllocated;
  const baseline = cashFlow
    ? cashFlow.avg_monthly_income - cashFlow.avg_monthly_expense
    : null;
  const delta = baseline !== null ? surplus - baseline : null;

  // Reset form when props change (month navigation reloads the page, but keep logic here for safety)
  useEffect(() => {
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
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (data: MonthlyActualInput) => {
    startTransition(async () => {
      const result = await saveMonthlyActualAction(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Đã cập nhật tháng ${month}/${year}`);
        router.refresh();
      }
    });
  };

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
    router.push(`/cashflow?year=${newYear}&month=${newMonth}`);
  };

  const incomeTotalDisplay =
    totalIncome > 0 ? new Intl.NumberFormat("vi-VN").format(totalIncome) : "";
  const expenseDisplay =
    totalExpense > 0 ? new Intl.NumberFormat("vi-VN").format(totalExpense) : "";

  return (
    <div className="flex flex-col pb-20">
      {/* Page header */}
      <div className="flex items-center justify-between pt-2 pb-5">
        <h1 className="text-foreground text-[28px] font-bold tracking-[-1px] uppercase">
          Thu / Chi
        </h1>
      </div>

      {/* Month selector */}
      <div className="border-border bg-surface mb-5 flex items-center justify-between border px-4 py-3">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          className="text-foreground-muted p-1"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-foreground text-[14px] font-bold tracking-[1px] uppercase">
          Tháng {month} · {year}
        </span>
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="text-foreground-muted p-1"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="bg-surface border-border flex flex-col gap-1 border p-3">
          <span className="text-[9px] font-semibold tracking-[1px] text-green-500 uppercase">
            Thu
          </span>
          <span className="text-[15px] font-bold text-green-500">
            {totalIncome > 0
              ? `+${new Intl.NumberFormat("vi-VN").format(totalIncome / 1_000_000)}tr`
              : "—"}
          </span>
        </div>
        <div className="bg-surface border-border flex flex-col gap-1 border p-3">
          <span className="text-[9px] font-semibold tracking-[1px] text-red-400 uppercase">
            Chi
          </span>
          <span className="text-[15px] font-bold text-red-400">
            {totalExpense > 0
              ? `-${new Intl.NumberFormat("vi-VN").format(totalExpense / 1_000_000)}tr`
              : "—"}
          </span>
        </div>
        <div className="bg-surface border-border flex flex-col gap-1 border p-3">
          <span className="text-[9px] font-semibold tracking-[1px] text-[#D4AF37] uppercase">
            Thặng dư
          </span>
          <span
            className={`text-[15px] font-bold ${surplus >= 0 ? "text-[#D4AF37]" : "text-red-400"}`}
          >
            {surplus !== 0
              ? `${surplus >= 0 ? "+" : ""}${new Intl.NumberFormat("vi-VN").format(surplus / 1_000_000)}tr`
              : "—"}
          </span>
        </div>
      </div>

      {/* Tabs form */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-0"
      >
        <Tabs.Root defaultValue="income" className="flex flex-col">
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

          <div className="py-5">
            {/* TAB 1: THU NHẬP */}
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

            {/* TAB 2: CHI TIÊU */}
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
                    appendExpense({ category: "", amount: 0, note: "" });
                    setNewExpenseIndex(idx);
                  }}
                  className="text-foreground-muted hover:text-foreground mt-2 h-12 w-full border-dashed bg-transparent"
                >
                  <Plus size={16} className="mr-2" />
                  THÊM KHOẢN CHI
                </Button>
              </div>
            </Tabs.Panel>

            {/* TAB 3: PHÂN BỔ — copy the allocation tab content verbatim from MonthlyActualSheet.tsx lines ~330–560 */}
            <Tabs.Panel
              value="allocation"
              className="flex flex-col gap-5 outline-none"
            >
              {/* Paste allocation tab JSX from MonthlyActualSheet here */}
            </Tabs.Panel>
          </div>
        </Tabs.Root>

        {/* Save button */}
        <Button
          type="submit"
          disabled={isPending}
          className="bg-accent text-background h-14 w-full text-[14px] font-bold tracking-[1px] uppercase"
        >
          {isPending ? "Đang lưu..." : `Lưu tháng ${month}/${year}`}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Copy allocation tab JSX from MonthlyActualSheet**

Open `src/app/(protected)/goals/components/MonthlyActualSheet.tsx` and find the `<Tabs.Panel value="allocation">` block (approximately lines 330–560). Copy its entire JSX content into the allocation `Tabs.Panel` in `CashflowClient.tsx`, replacing the `{/* Paste allocation tab JSX... */}` comment.

Also copy the `IncomeRow` function (lines ~567–742) and `ExpenseRow` function (lines ~743–end) from `MonthlyActualSheet.tsx` and append them at the bottom of `CashflowClient.tsx` as module-level functions.

- [ ] **Step 5: Verify /cashflow renders and saves**

Visit http://localhost:3000/cashflow. Confirm:

- Page title "THU / CHI" renders
- Month selector shows current month, ‹/› buttons navigate to adjacent months
- Summary cards update as income/expense rows are edited
- Tabs (Thu nhập / Chi tiêu / Phân bổ) switch correctly
- "Thêm khoản thu/chi" adds a new accordion row
- Save button writes to DB and shows toast success

- [ ] **Step 6: Commit**

```bash
git add src/app/\(protected\)/cashflow/
git commit -m "feat(cashflow): add Thu/Chi page with month selector, summary, and form"
```

---

## Task 4: Update Goals — Remove MonthlyActualSheet, Wire Button to /cashflow

**Files:**

- Modify: `src/app/(protected)/goals/GoalsClient.tsx`
- Modify: `src/app/(protected)/goals/components/GoalCard.tsx`

- [ ] **Step 1: Update GoalsClient.tsx**

1. Remove the `MonthlyActualSheet` import
2. Remove `"monthly"` from the `openSheet` union type
3. Remove the `<MonthlyActualSheet>` JSX block
4. Change `onLogMonth={() => setOpenSheet("monthly")}` to use router navigation

Updated GoalsClient.tsx:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import type {
  Goal,
  HouseholdCashFlow,
  MonthlyActual,
  GoalProjection,
} from "@/lib/services/goals";
import { BannerCard } from "./components/BannerCard";
import { CashFlowCard } from "./components/CashFlowCard";
import { GoalCard } from "./components/GoalCard";
import { GoalSheet } from "./components/GoalSheet";
import { CashFlowSheet } from "./components/CashFlowSheet";

interface Props {
  goal: Goal | null;
  cashFlow: HouseholdCashFlow | null;
  monthlyActual: MonthlyActual | null;
  projection: GoalProjection | null;
  currentAssets: number;
  currentYear: number;
  currentMonth: number;
}

export function GoalsClient({
  goal,
  cashFlow,
  monthlyActual,
  projection,
  currentAssets,
  currentYear,
  currentMonth,
}: Props) {
  const router = useRouter();
  const [openSheet, setOpenSheet] = useState<"goal" | "cashflow" | null>(null);

  const avgSurplus = cashFlow
    ? cashFlow.avg_monthly_income - cashFlow.avg_monthly_expense
    : null;

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Page header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-foreground text-[28px] font-bold tracking-[-1px] uppercase">
          MỤC TIÊU
        </h1>
        {goal && (
          <button
            onClick={() => setOpenSheet("goal")}
            className="border border-[#D4AF37] px-4 py-2 text-[13px] font-semibold text-[#D4AF37]"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      {goal && projection ? (
        <>
          <BannerCard
            currentAssets={currentAssets}
            avgMonthlySurplus={avgSurplus}
          />
          <GoalCard
            goal={goal}
            projection={projection}
            monthlyActual={monthlyActual}
            cashFlow={cashFlow}
            currentYear={currentYear}
            currentMonth={currentMonth}
            onLogMonth={() =>
              router.push(`/cashflow?year=${currentYear}&month=${currentMonth}`)
            }
          />
          <CashFlowCard
            cashFlow={cashFlow}
            onEdit={() => setOpenSheet("cashflow")}
          />
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3 border border-dashed border-[#333] p-8 text-center">
            <Target size={36} className="text-[#444]" />
            <div>
              <p className="text-foreground mb-1 text-[15px] font-bold">
                Chưa có mục tiêu nào
              </p>
              <p className="text-foreground-muted text-[13px]">
                Đặt mục tiêu tài chính cho hai vợ chồng và theo dõi tiến độ mỗi
                ngày
              </p>
            </div>
            <button
              onClick={() => setOpenSheet("goal")}
              className="bg-accent text-background mt-2 px-6 py-3 text-[14px] font-bold tracking-[1px] uppercase"
            >
              + Đặt mục tiêu
            </button>
          </div>
          <CashFlowCard
            cashFlow={cashFlow}
            onEdit={() => setOpenSheet("cashflow")}
          />
        </>
      )}

      {/* Sheets */}
      <GoalSheet
        goal={goal}
        open={openSheet === "goal"}
        onOpenChange={(o) => setOpenSheet(o ? "goal" : null)}
      />
      <CashFlowSheet
        cashFlow={cashFlow}
        open={openSheet === "cashflow"}
        onOpenChange={(o) => setOpenSheet(o ? "cashflow" : null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify Goals page still works**

Visit http://localhost:3000/goals. Confirm:

- Page renders with BannerCard, GoalCard, CashFlowCard
- "Chỉnh sửa" button still opens GoalSheet
- "CashFlowCard" edit button still opens CashFlowSheet
- Monthly section in GoalCard: "Chưa cập nhật" button and "Chỉnh sửa →" link both navigate to /cashflow?year=…&month=…
- No MonthlyActualSheet drawer appears

- [ ] **Step 3: Delete MonthlyActualSheet.tsx**

Verify no other files import MonthlyActualSheet:

```bash
grep -r "MonthlyActualSheet" src/ --include="*.tsx" --include="*.ts"
```

Expected: zero results (GoalsClient no longer imports it). Then delete:

```bash
rm src/app/\(protected\)/goals/components/MonthlyActualSheet.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/goals/GoalsClient.tsx
git add src/app/\(protected\)/goals/components/MonthlyActualSheet.tsx
git commit -m "feat(goals): retire MonthlyActualSheet, wire log-month button to /cashflow"
```

---

## Task 5: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```

Expected: all existing tests pass (no logic was changed — only moved between files).

- [ ] **Step 2: Manual smoke test — full navigation flow**

1. Bottom nav: tap each of the 5 tabs — all navigate correctly
2. Header: tap ⚙️ icon → goes to /settings
3. /assets: net worth shows, Vàng card → /gold, Tiết Kiệm card → /savings
4. /cashflow: month selector works (‹/›), tabs switch, save writes to DB
5. /cashflow → navigate to previous month → shows that month's data (or empty defaults)
6. /goals: tapping "Cập nhật" or "Chỉnh sửa →" in GoalCard → navigates to /cashflow with correct year/month params

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: final nav restructure cleanup"
```
