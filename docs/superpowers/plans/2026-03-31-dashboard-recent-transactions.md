# Dashboard Recent Transactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement "Giao dịch gần đây" widget showing 8 most recent financial events on dashboard.

**Architecture:** Server-side data assembly in `page.tsx` fetches from multiple sources (gold_assets, savings_accounts, monthly_actuals), normalizes to unified `RecentTx[]` type, passes to client component for rendering as styled list.

**Tech Stack:** Next.js App Router, TypeScript, Supabase, Tailwind CSS.

---

### Task 1: Create Transaction Types

**Files:**

- Create: `src/types/transactions.ts`

- [ ] **Step 1: Create types file with TxKind and RecentTx**

```typescript
// src/types/transactions.ts
export type TxKind =
  | "income"
  | "expense"
  | "gold_buy"
  | "gold_sell"
  | "savings";

export interface RecentTx {
  kind: TxKind;
  label: string;
  amount: number;
  date: string;
  note?: string | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/transactions.ts
git commit -m "feat: add transaction types for recent transactions widget"
```

---

### Task 2: Add getAllGoldAssets Query

**Files:**

- Modify: `src/lib/services/gold.ts`

- [ ] **Step 1: Add getAllGoldAssets function (no sold_at filter)**

Add after `getActiveGoldAssets` function:

```typescript
export async function getAllGoldAssets(
  supabase: SupabaseClient,
  userId: string
): Promise<GoldAsset[]> {
  const { data, error } = await supabase
    .from("gold_assets")
    .select("*")
    .eq("user_id", userId)
    .order("buy_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/gold.ts
git commit -m "feat: add getAllGoldAssets query without sold_at filter"
```

---

### Task 3: Add Cached Queries for Recent Transactions

**Files:**

- Modify: `src/lib/server-queries.ts`

- [ ] **Step 1: Add import for getAllGoldAssets**

Update imports at top of file:

```typescript
import {
  getActiveGoldAssets,
  getAllGoldAssets,
  getExternalGoldPrices,
} from "@/lib/services/gold";
```

- [ ] **Step 2: Add cachedGetAllGoldAssets function**

Add after `cachedGetActiveGoldAssets` function:

```typescript
export function cachedGetAllGoldAssets(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      return getAllGoldAssets(supabase, userId);
    },
    [`gold-assets-all-${userId}`],
    { tags: [`user-${userId}`], revalidate: 30 }
  )();
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/server-queries.ts
git commit -m "feat: add cachedGetAllGoldAssets query"
```

---

### Task 4: Assemble Recent Transactions in Page

**Files:**

- Modify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Add imports**

Update imports at top of file:

```typescript
import {
  cachedGetActiveGoldAssets,
  cachedGetAllGoldAssets,
  cachedGetSavingsAccounts,
  cachedGetGoal,
  cachedGetCashFlow,
  cachedGetSettings,
  cachedGetMonthlyActual,
  getExternalGoldPrices,
} from "@/lib/server-queries";
import type { RecentTx } from "@/types/transactions";
```

- [ ] **Step 2: Update Promise.all to fetch all gold assets and previous month data**

Replace the existing `Promise.all` block:

```typescript
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;

// Calculate previous month
const prevMonth = month === 1 ? 12 : month - 1;
const prevYear = month === 1 ? year - 1 : year;

const [
  goldPositions,
  allGoldAssets,
  prices,
  savingsAccounts,
  goal,
  cashFlow,
  settings,
  currentMonthActual,
  prevMonthActual,
] = await Promise.all([
  cachedGetActiveGoldAssets(user.id),
  cachedGetAllGoldAssets(user.id),
  getExternalGoldPrices(),
  cachedGetSavingsAccounts(user.id),
  cachedGetGoal(user.id),
  cachedGetCashFlow(user.id),
  cachedGetSettings(user.id),
  cachedGetMonthlyActual(user.id, year, month),
  cachedGetMonthlyActual(user.id, prevYear, prevMonth),
]);
```

- [ ] **Step 3: Add recent transactions assembly logic before return**

Add after the `currentAssets` calculation, before the `return` statement:

```typescript
// Assemble recent transactions
const recentTxs: RecentTx[] = [];

// Gold buys (all positions)
for (const pos of allGoldAssets) {
  recentTxs.push({
    kind: "gold_buy",
    label: `${pos.brand_name} ${pos.quantity} chỉ`,
    amount: pos.quantity * pos.buy_price_per_chi,
    date: pos.buy_date,
    note: pos.note,
  });
}

// Gold sells (only sold positions)
for (const pos of allGoldAssets.filter((p) => p.sold_at !== null)) {
  recentTxs.push({
    kind: "gold_sell",
    label: `${pos.brand_name} ${pos.sold_quantity} chỉ`,
    amount: pos.sold_quantity * (pos.sell_price_per_chi ?? 0),
    date: pos.sold_at!,
    note: pos.note,
  });
}

// Savings accounts
for (const acc of savingsAccounts) {
  recentTxs.push({
    kind: "savings",
    label: `${acc.bank_name}${acc.account_name ? " · " + acc.account_name : ""}`,
    amount: acc.principal,
    date: acc.start_date,
    note: acc.note,
  });
}

// Current month income/expense
if (currentMonthActual) {
  const currentMonthDate = `${year}-${String(month).padStart(2, "0")}-01`;
  for (const detail of currentMonthActual.income_details) {
    recentTxs.push({
      kind: "income",
      label: detail.type,
      amount: detail.amount,
      date: currentMonthDate,
    });
  }
  for (const detail of currentMonthActual.expense_details) {
    recentTxs.push({
      kind: "expense",
      label: detail.type,
      amount: detail.amount,
      date: currentMonthDate,
    });
  }
}

// Previous month income/expense
if (prevMonthActual) {
  const prevMonthDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
  for (const detail of prevMonthActual.income_details) {
    recentTxs.push({
      kind: "income",
      label: detail.type,
      amount: detail.amount,
      date: prevMonthDate,
    });
  }
  for (const detail of prevMonthActual.expense_details) {
    recentTxs.push({
      kind: "expense",
      label: detail.type,
      amount: detail.amount,
      date: prevMonthDate,
    });
  }
}

// Sort by date descending, take top 8
const recentTxsSorted = recentTxs
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 8);
```

- [ ] **Step 4: Pass recentTxs to DashboardClient**

Update the return statement:

```typescript
return (
  <DashboardClient
    goldPositions={goldPositions}
    initialPrices={prices}
    savingsAccounts={savingsAccounts}
    goal={goal}
    goalProjection={goalProjection}
    monthlyActual={monthlyActual}
    currentAssets={currentAssets}
    recentTxs={recentTxsSorted}
  />
);
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/dashboard/page.tsx
git commit -m "feat: assemble recent transactions data in dashboard page"
```

---

### Task 5: Update DashboardClient Props

**Files:**

- Modify: `src/app/(protected)/dashboard/DashboardClient.tsx`

- [ ] **Step 1: Add RecentTx import**

Add import at top of file:

```typescript
import type { RecentTx } from "@/types/transactions";
```

- [ ] **Step 2: Add recentTxs to Props interface**

Update the `Props` interface:

```typescript
interface Props {
  goldPositions: GoldAsset[];
  initialPrices: GoldPrice[];
  savingsAccounts: SavingsAccount[];
  goal: Goal | null;
  goalProjection: GoalProjection | null;
  monthlyActual: MonthlyActual | null;
  currentAssets: number;
  recentTxs: RecentTx[];
}
```

- [ ] **Step 3: Add recentTxs parameter to function signature**

Update function signature:

```typescript
export function DashboardClient({
  goldPositions,
  initialPrices = [],
  savingsAccounts,
  goal,
  goalProjection,
  monthlyActual,
  currentAssets,
  recentTxs,
}: Props) {
```

- [ ] **Step 4: Import RecentTransactions component**

Add import after StatTile import:

```typescript
import { RecentTransactions } from "./components/RecentTransactions";
```

- [ ] **Step 5: Render RecentTransactions component**

Add after the closing of the `grid` div (before the outer div closes):

```typescript
      {/* Recent Transactions Section */}
      <RecentTransactions transactions={recentTxs} />
    </div>
```

- [ ] **Step 6: Commit**

```bash
git add src/app/(protected)/dashboard/DashboardClient.tsx
git commit -m "feat: add recentTxs prop and render RecentTransactions component"
```

---

### Task 6: Create RecentTransactions Component

**Files:**

- Create: `src/app/(protected)/dashboard/components/RecentTransactions.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/(protected)/dashboard/components/RecentTransactions.tsx
"use client";

import type { RecentTx, TxKind } from "@/types/transactions";

interface Props {
  transactions: RecentTx[];
}

const iconConfig: Record<
  TxKind,
  {
    icon: string;
    bgClass: string;
    amountClass: string;
    prefix: string;
  }
> = {
  income: {
    icon: "↑",
    bgClass: "bg-status-positive/20",
    amountClass: "text-status-positive",
    prefix: "+",
  },
  expense: {
    icon: "↓",
    bgClass: "bg-status-negative/20",
    amountClass: "text-status-negative",
    prefix: "−",
  },
  gold_buy: {
    icon: "✦",
    bgClass: "bg-accent/20",
    amountClass: "text-accent",
    prefix: "−",
  },
  gold_sell: {
    icon: "✦",
    bgClass: "bg-accent/20",
    amountClass: "text-status-positive",
    prefix: "+",
  },
  savings: {
    icon: "⬡",
    bgClass: "bg-[#6B7FD7]/20",
    amountClass: "text-[#6B7FD7]",
    prefix: "+",
  },
};

function formatAmount(amount: number, config: (typeof iconConfig)[TxKind]): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function RecentTransactions({ transactions }: Props) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="mt-2">
        <h2 className="text-foreground text-[13px] font-bold tracking-[0.5px] uppercase mb-2">
          GIAO DỊCH GẦN ĐÂY
        </h2>
        <p className="text-foreground-muted text-[13px]">
          Chưa có giao dịch nào
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <h2 className="text-foreground text-[13px] font-bold tracking-[0.5px] uppercase mb-2">
        GIAO DỊCH GẦN ĐÂY
      </h2>
      <div className="flex flex-col divide-y divide-border">
        {transactions.map((tx, idx) => {
          const config = iconConfig[tx.kind];
          return (
            <div
              key={idx}
              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 ${config.bgClass} rounded-full flex items-center justify-center flex-shrink-0`}
                >
                  <span className={`${config.amountClass} text-[10px]`}>
                    {config.icon}
                  </span>
                </div>
                <span className="text-foreground text-[13px] font-medium">
                  {tx.label}
                </span>
              </div>
              <div className="text-right">
                <div className={`${config.amountClass} text-[13px] font-semibold`}>
                  {config.prefix}
                  {formatAmount(tx.amount, config)}
                </div>
                <div className="text-foreground-muted text-[11px] font-medium">
                  {formatDate(tx.date)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/dashboard/components/RecentTransactions.tsx
git commit -m "feat: add RecentTransactions component with icon legend and formatting"
```

---

### Task 7: Verify and Test

**Files:**

- All modified files

- [ ] **Step 1: Run TypeScript check**

```bash
npm run type-check
```

Expected: No errors

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors

- [ ] **Step 3: Start dev server and verify dashboard renders**

```bash
npm run dev
```

Then open browser to dashboard page and verify:

- "GIAO DỊCH GẦN ĐÂY" section appears below stat tiles
- 8 most recent transactions are displayed
- Icons, colors, and amounts render correctly
- Empty state shows "Chưa có giao dịch nào" when no transactions

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address any issues found during verification"
```

---
