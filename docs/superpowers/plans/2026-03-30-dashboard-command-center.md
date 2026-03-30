# Dashboard Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing dashboard with a "command center" layout — a unified hero card (net worth + goal progress) and a 2×2 stat tile grid (Vàng, Tiết Kiệm, Thu/Chi, Giá Vàng).

**Architecture:** Two new presentational components (`HeroCard`, `StatTile`) replace `GoalsDashboardCard` and `PortfolioChart`. `page.tsx` gains one additional parallel query (`cachedGetMonthlyActual`). `DashboardClient.tsx` is refactored to compose the new components. `ScreenSkeleton.tsx` is updated to match the new layout shape.

**Tech Stack:** Next.js App Router (server + client components), TypeScript, Tailwind CSS, `@/lib/gold-utils` (`formatVND`, `formatPct`, `calcPnl`, `CHI_PER_LUONG`), `@/lib/services/goals` (`MonthlyActual`, `GoalProjection`), `@/lib/services/savings` (`calcAccruedInterest`), `@/lib/services/gold` (`GoldPrice` with fields `sell`, `change_sell`).

---

## File Map

| Action     | Path                                                              | Purpose                                                                        |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Create** | `src/app/(protected)/dashboard/components/StatTile.tsx`           | Reusable tappable tile with optional accent border                             |
| **Create** | `src/app/(protected)/dashboard/components/HeroCard.tsx`           | Unified net worth + goal progress hero card                                    |
| **Modify** | `src/app/(protected)/dashboard/page.tsx`                          | Add `cachedGetMonthlyActual`, pass `monthlyActual` + `currentAssets` to client |
| **Modify** | `src/app/(protected)/dashboard/DashboardClient.tsx`               | Replace old card layout with `HeroCard` + 2×2 `StatTile` grid                  |
| **Modify** | `src/components/ScreenSkeleton.tsx`                               | Match new dashboard shape                                                      |
| **Delete** | `src/app/(protected)/dashboard/components/GoalsDashboardCard.tsx` | Replaced by `HeroCard`                                                         |
| **Delete** | `src/app/(protected)/dashboard/components/PortfolioChart.tsx`     | No longer used                                                                 |

---

### Task 1: Create `StatTile` component

**Files:**

- Create: `src/app/(protected)/dashboard/components/StatTile.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/(protected)/dashboard/components/StatTile.tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  href: string;
  accentColor?: "gold" | "blue";
  children: React.ReactNode;
}

export function StatTile({ label, href, accentColor, children }: StatTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        "bg-surface border-border flex flex-col gap-1.5 border p-3",
        accentColor === "gold" && "border-l-2 border-l-accent",
        accentColor === "blue" && "border-l-2 border-l-[#6B7FD7]"
      )}
    >
      <span className="text-foreground-secondary text-[9px] font-bold tracking-[1.5px] uppercase">
        {label}
      </span>
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors unrelated to this file)

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/dashboard/components/StatTile.tsx
git commit -m "feat: add StatTile component for dashboard command center"
```

---

### Task 2: Create `HeroCard` component

**Files:**

- Create: `src/app/(protected)/dashboard/components/HeroCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/(protected)/dashboard/components/HeroCard.tsx
import Link from "next/link";
import { formatVND } from "@/lib/gold-utils";

interface HeroGoal {
  name: string;
  emoji: string;
  target: number;
  currentAssets: number;
  progressPct: number;
  projectedDate: string | null;
}

interface HeroCardProps {
  netWorth: number;
  goal: HeroGoal | null;
}

export function HeroCard({ netWorth, goal }: HeroCardProps) {
  const compactNetWorth = new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumSignificantDigits: 3,
  }).format(netWorth);

  return (
    <div className="bg-surface border-border border p-4">
      {/* Top row: net worth (left) + goal % (right) */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground-secondary text-[9px] font-bold tracking-[1.5px] uppercase">
            Tổng tài sản
          </span>
          <span className="text-foreground text-[26px] font-black leading-none tracking-[-1px]">
            {compactNetWorth}
          </span>
        </div>

        {goal ? (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-foreground-secondary text-[9px] font-bold tracking-[1.5px] uppercase">
              Mục tiêu
            </span>
            <span className="text-accent text-[26px] font-black leading-none tracking-[-1px]">
              {goal.progressPct}%
            </span>
          </div>
        ) : (
          <Link
            href="/goals"
            className="text-accent text-[11px] font-bold tracking-[0.5px]"
          >
            Đặt mục tiêu →
          </Link>
        )}
      </div>

      {goal && (
        <>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 overflow-hidden bg-[#2a2a2a]">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#f0d060]"
              style={{ width: `${goal.progressPct}%` }}
            />
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-foreground-muted text-[11px]">
              {goal.emoji} {goal.name} · {formatVND(goal.currentAssets)} /{" "}
              {formatVND(goal.target)}
            </span>
            {goal.projectedDate && (
              <span className="text-foreground-muted text-[11px]">
                Dự kiến{" "}
                <span className="text-accent font-semibold">
                  {goal.projectedDate}
                </span>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/dashboard/components/HeroCard.tsx
git commit -m "feat: add HeroCard component for dashboard command center"
```

---

### Task 3: Add monthly cashflow query to `page.tsx`

**Files:**

- Modify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Replace the file contents**

```typescript
// src/app/(protected)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  cachedGetActiveGoldAssets,
  cachedGetSavingsAccounts,
  cachedGetGoal,
  cachedGetCashFlow,
  cachedGetSettings,
  cachedGetMonthlyActual,
  getExternalGoldPrices,
} from "@/lib/server-queries";
import { calcAccruedInterest } from "@/lib/services/savings";
import { calcProjection } from "@/lib/services/goals";
import { calcPnl, CHI_PER_LUONG } from "@/lib/gold-utils";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [
    goldPositions,
    prices,
    savingsAccounts,
    goal,
    cashFlow,
    settings,
    monthlyActual,
  ] = await Promise.all([
    cachedGetActiveGoldAssets(user.id),
    getExternalGoldPrices(),
    cachedGetSavingsAccounts(user.id),
    cachedGetGoal(user.id),
    cachedGetCashFlow(user.id),
    cachedGetSettings(user.id),
    cachedGetMonthlyActual(user.id, year, month),
  ]);

  const priceMap = new Map((prices ?? []).map((p) => [p.type_code, p]));
  const savingsTotal = savingsAccounts.reduce(
    (s, a) => s + a.principal + calcAccruedInterest(a),
    0
  );
  const goldTotal = goldPositions.reduce((s, pos) => {
    const remaining = pos.quantity - pos.sold_quantity;
    const livePrice = priceMap.get(pos.brand_code);
    if (livePrice) {
      return (
        s +
        calcPnl(remaining, pos.buy_price_per_chi, livePrice.sell / CHI_PER_LUONG)
          .currentValue
      );
    }
    return s + remaining * pos.buy_price_per_chi;
  }, 0);
  const cashBalance = settings?.initial_cash_balance ?? 0;
  const currentAssets = savingsTotal + goldTotal + cashBalance;
  const goalProjection = goal ? calcProjection(goal, cashFlow, currentAssets) : null;

  return (
    <DashboardClient
      goldPositions={goldPositions}
      initialPrices={prices}
      savingsAccounts={savingsAccounts}
      goal={goal}
      goalProjection={goalProjection}
      monthlyActual={monthlyActual}
      currentAssets={currentAssets}
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: TypeScript will error on `monthlyActual` and `currentAssets` not existing in `DashboardClient` Props — that is expected and will be resolved in Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/dashboard/page.tsx
git commit -m "feat: add monthly cashflow query and currentAssets to dashboard server"
```

---

### Task 4: Refactor `DashboardClient.tsx`

**Files:**

- Modify: `src/app/(protected)/dashboard/DashboardClient.tsx`

- [ ] **Step 1: Replace the file contents**

```typescript
// src/app/(protected)/dashboard/DashboardClient.tsx
"use client";

import { useEffect, useState } from "react";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";
import { calcPnl, formatVND, CHI_PER_LUONG } from "@/lib/gold-utils";
import {
  type SavingsAccount,
  calcAccruedInterest,
} from "@/lib/services/savings";
import type { Goal, GoalProjection, MonthlyActual } from "@/lib/services/goals";
import { HeroCard } from "./components/HeroCard";
import { StatTile } from "./components/StatTile";

interface Props {
  goldPositions: GoldAsset[];
  initialPrices: GoldPrice[];
  savingsAccounts: SavingsAccount[];
  goal: Goal | null;
  goalProjection: GoalProjection | null;
  monthlyActual: MonthlyActual | null;
  currentAssets: number;
}

function formatEstimatedDate(date: Date): string {
  return `T${date.getMonth() + 1}/${date.getFullYear()}`;
}

// Compact formatter for tile values (e.g. "460 Tr", "97,5 Tr")
function fmtTile(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumSignificantDigits: 3,
  }).format(value);
}

export function DashboardClient({
  goldPositions,
  initialPrices = [],
  savingsAccounts,
  goal,
  goalProjection,
  monthlyActual,
  currentAssets,
}: Props) {
  const [prices, setPrices] = useState<GoldPrice[]>(initialPrices);

  useEffect(() => {
    if (prices.length === 0) {
      fetch("/api/gold/prices")
        .then((r) => r.json())
        .then((json: { success: boolean; data: GoldPrice[] }) => {
          if (json.success && Array.isArray(json.data)) {
            setPrices(json.data);
          }
        })
        .catch(() => {});
    }
  }, [prices.length]);

  const priceMap = new Map<string, GoldPrice>(
    (prices || []).map((p) => [p.type_code, p])
  );

  // Gold computations
  let goldTotalValue = 0;
  let goldTotalCapital = 0;
  for (const pos of goldPositions) {
    const remaining = pos.quantity - pos.sold_quantity;
    const livePrice = priceMap.get(pos.brand_code);
    goldTotalCapital += remaining * pos.buy_price_per_chi;
    if (livePrice) {
      goldTotalValue += calcPnl(
        remaining,
        pos.buy_price_per_chi,
        livePrice.sell / CHI_PER_LUONG
      ).currentValue;
    }
  }
  const goldDisplayValue = goldTotalValue > 0 ? goldTotalValue : goldTotalCapital;
  const goldPnlPct =
    goldTotalCapital > 0 && goldTotalValue > 0
      ? ((goldTotalValue - goldTotalCapital) / goldTotalCapital) * 100
      : null;

  // Savings computations
  const savingsTotalValue = savingsAccounts.reduce(
    (s, a) => s + a.principal + calcAccruedInterest(a),
    0
  );

  // Hero card goal data
  const heroGoal =
    goal && goalProjection
      ? {
          name: goal.name,
          emoji: goal.emoji,
          target: goal.target_amount,
          currentAssets,
          progressPct: goalProjection.progressPct,
          projectedDate:
            goalProjection.estimatedDate &&
            goalProjection.monthsToGoal !== null &&
            goalProjection.monthsToGoal > 0
              ? formatEstimatedDate(goalProjection.estimatedDate)
              : null,
        }
      : null;

  // Market tile: prefer SJC, fall back to first available
  const marketPrice =
    prices.find((p) => p.type_code === "SJC") ?? prices[0] ?? null;

  // Cashflow tile
  const currentMonth = new Date().getMonth() + 1;
  const cashflowNet = monthlyActual
    ? monthlyActual.actual_income - monthlyActual.actual_expense
    : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground pt-2 text-[28px] font-bold tracking-[-1px]">
        TỔNG QUAN
      </h1>

      <HeroCard netWorth={currentAssets} goal={heroGoal} />

      <div className="grid grid-cols-2 gap-3">
        {/* Vàng tile */}
        <StatTile label="Vàng" href="/assets" accentColor="gold">
          <span className="text-foreground text-[15px] font-bold leading-tight tracking-[-0.5px]">
            {fmtTile(goldDisplayValue)} đ
          </span>
          {goldPnlPct !== null ? (
            <span
              className={`text-[11px] font-semibold ${goldPnlPct >= 0 ? "text-status-positive" : "text-status-negative"}`}
            >
              {goldPnlPct >= 0 ? "+" : ""}
              {goldPnlPct.toFixed(2)}%
            </span>
          ) : (
            goldPositions.length === 0 && (
              <span className="text-foreground-muted text-[11px]">
                Chưa có tài sản
              </span>
            )
          )}
        </StatTile>

        {/* Tiết Kiệm tile */}
        <StatTile label="Tiết kiệm" href="/assets" accentColor="blue">
          <span className="text-foreground text-[15px] font-bold leading-tight tracking-[-0.5px]">
            {fmtTile(savingsTotalValue)} đ
          </span>
          <span className="text-[#6B7FD7] text-[11px] font-semibold">
            {savingsAccounts.length > 0
              ? `${savingsAccounts.length} khoản`
              : "Chưa có tài sản"}
          </span>
        </StatTile>

        {/* Thu/Chi tile */}
        <StatTile label={`Thu/Chi T${currentMonth}`} href="/cashflow">
          {monthlyActual ? (
            <>
              <span className="text-status-positive text-[11px] font-semibold">
                ↑ {fmtTile(monthlyActual.actual_income)} đ
              </span>
              <span className="text-status-negative text-[11px] font-semibold">
                ↓ {fmtTile(monthlyActual.actual_expense)} đ
              </span>
              <span
                className={`text-[11px] font-bold ${(cashflowNet ?? 0) >= 0 ? "text-accent" : "text-status-negative"}`}
              >
                = {(cashflowNet ?? 0) >= 0 ? "+" : ""}
                {formatVND(cashflowNet ?? 0)}
              </span>
            </>
          ) : (
            <>
              <span className="text-foreground-muted text-[11px]">
                Chưa có dữ liệu
              </span>
              <span className="text-accent text-[10px] font-semibold tracking-[0.5px]">
                Bắt đầu nhập →
              </span>
            </>
          )}
        </StatTile>

        {/* Giá Vàng tile */}
        <StatTile label="Giá vàng" href="/market">
          {marketPrice ? (
            <>
              <span className="text-foreground text-[15px] font-bold leading-tight tracking-[-0.5px]">
                {fmtTile(marketPrice.sell)} đ
              </span>
              <span className="text-foreground-muted text-[9px]">
                mỗi lượng (bán ra)
              </span>
              {marketPrice.change_sell !== 0 && (
                <span
                  className={`text-[11px] font-semibold ${marketPrice.change_sell > 0 ? "text-status-positive" : "text-status-negative"}`}
                >
                  {marketPrice.change_sell > 0 ? "+" : ""}
                  {fmtTile(marketPrice.change_sell)} đ
                </span>
              )}
            </>
          ) : (
            <span className="text-foreground-muted text-[11px]">
              Đang tải...
            </span>
          )}
        </StatTile>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Start dev server and verify visually**

```bash
npm run dev
```

Open http://localhost:3000/dashboard. Verify:

- Hero card shows net worth (compact) and goal % side by side
- Progress bar fills to goal %
- Footer shows goal name, current/target amounts, projected date
- All 4 tiles render with data
- Each tile is tappable (navigates to `/assets`, `/cashflow`, `/market`)
- Cashflow tile shows "Chưa có dữ liệu" if no monthly actual for current month

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/dashboard/DashboardClient.tsx
git commit -m "feat: refactor dashboard to command center layout with HeroCard and StatTile"
```

---

### Task 5: Delete old components and update ScreenSkeleton

**Files:**

- Delete: `src/app/(protected)/dashboard/components/GoalsDashboardCard.tsx`
- Delete: `src/app/(protected)/dashboard/components/PortfolioChart.tsx`
- Modify: `src/components/ScreenSkeleton.tsx`

- [ ] **Step 1: Delete the old components**

```bash
rm "src/app/(protected)/dashboard/components/GoalsDashboardCard.tsx"
rm "src/app/(protected)/dashboard/components/PortfolioChart.tsx"
```

- [ ] **Step 2: Confirm no remaining imports of deleted files**

```bash
grep -r "GoalsDashboardCard\|PortfolioChart" src/
```

Expected: no output

- [ ] **Step 3: Verify TypeScript still compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Replace ScreenSkeleton to match the new dashboard shape**

```typescript
// src/components/ScreenSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function ScreenSkeleton() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Page title */}
      <Skeleton className="h-9 w-36" />

      {/* Hero card */}
      <div className="bg-surface/50 border-border border p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <Skeleton className="mt-3 h-1.5 w-full" />
        <div className="mt-2 flex justify-between">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* 2×2 tile grid */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface/50 border-border border p-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-2 w-14" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Final smoke test**

```bash
npm run dev
```

Open http://localhost:3000/dashboard. Verify the full page renders correctly, all tiles link to correct routes, and no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ScreenSkeleton.tsx
git add "src/app/(protected)/dashboard/components/GoalsDashboardCard.tsx"
git add "src/app/(protected)/dashboard/components/PortfolioChart.tsx"
git commit -m "chore: remove GoalsDashboardCard and PortfolioChart, update ScreenSkeleton"
```
