# Goals Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-goal financial tracker that shows progress toward a target amount using total portfolio value and projects time-to-goal based on monthly surplus.

**Architecture:** Three new Supabase tables (`goals`, `household_cash_flow`, `monthly_actuals`) + a pure `calcProjection` function. RSC page fetches all data in parallel and passes to a single `GoalsClient` that manages three bottom sheet modals. Dashboard gets a Goals summary card.

**Tech Stack:** Next.js 15 App Router, React 19, Supabase SSR, react-hook-form + zod, @base-ui/react/drawer, sonner, Tailwind CSS v4, Vitest

---

## File Map

**New files:**

- `docs/goals-migration.sql` — DB schema for 3 tables
- `src/lib/services/goals.ts` — types + service functions + `calcProjection`
- `src/lib/validations/goals.ts` — zod schemas
- `src/lib/__tests__/goals-utils.test.ts` — unit tests for `calcProjection`
- `src/app/actions/goals.ts` — server actions
- `src/app/(protected)/goals/GoalsClient.tsx` — main client component
- `src/app/(protected)/goals/components/BannerCard.tsx` — tổng quan tài chính banner
- `src/app/(protected)/goals/components/CashFlowCard.tsx` — cài đặt thu chi display card
- `src/app/(protected)/goals/components/GoalCard.tsx` — main goal progress card
- `src/app/(protected)/goals/components/GoalSheet.tsx` — set/edit goal drawer
- `src/app/(protected)/goals/components/CashFlowSheet.tsx` — edit cash flow drawer
- `src/app/(protected)/goals/components/MonthlyActualSheet.tsx` — log monthly actual drawer
- `src/app/(protected)/dashboard/components/GoalsDashboardCard.tsx` — dashboard summary card

**Modified files:**

- `src/app/(protected)/goals/page.tsx` — replace stub with RSC data fetcher
- `src/app/(protected)/dashboard/page.tsx` — fetch goal + cash flow for dashboard card
- `src/app/(protected)/dashboard/DashboardClient.tsx` — render GoalsDashboardCard

---

## Task 1: DB Migration

**Files:**

- Create: `docs/goals-migration.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- docs/goals-migration.sql

-- goals: one row per user (UNIQUE user_id enforces single goal)
CREATE TABLE goals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  emoji           text NOT NULL DEFAULT '🎯',
  target_amount   bigint NOT NULL,
  deadline        date,
  note            text,
  is_completed    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner" ON goals
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- household_cash_flow: one row per user
CREATE TABLE household_cash_flow (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avg_monthly_income   bigint NOT NULL DEFAULT 0,
  avg_monthly_expense  bigint NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE household_cash_flow ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner" ON household_cash_flow
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- monthly_actuals: one row per user per (year, month)
CREATE TABLE monthly_actuals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year            integer NOT NULL,
  month           integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  actual_income   bigint NOT NULL DEFAULT 0,
  actual_expense  bigint NOT NULL DEFAULT 0,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);

ALTER TABLE monthly_actuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner" ON monthly_actuals
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

- [ ] **Step 2: Run migration in Supabase**

Open Supabase Dashboard → SQL Editor → paste contents of `docs/goals-migration.sql` → Run.
Verify: three new tables appear in Table Editor with RLS enabled.

- [ ] **Step 3: Commit**

```bash
git add docs/goals-migration.sql
git commit -m "feat(goals): add goals, household_cash_flow, monthly_actuals tables"
```

---

## Task 2: Service Layer

**Files:**

- Create: `src/lib/services/goals.ts`

- [ ] **Step 1: Write service file**

```typescript
// src/lib/services/goals.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GoalInput,
  CashFlowInput,
  MonthlyActualInput,
} from "@/lib/validations/goals";

// ── Types ─────────────────────────────────────────────────────

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  target_amount: number;
  deadline: string | null;
  note: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface HouseholdCashFlow {
  id: string;
  user_id: string;
  avg_monthly_income: number;
  avg_monthly_expense: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyActual {
  id: string;
  user_id: string;
  year: number;
  month: number;
  actual_income: number;
  actual_expense: number;
  note: string | null;
  created_at: string;
}

export interface GoalProjection {
  currentAssets: number;
  remaining: number;
  monthsToGoal: number | null; // null when surplus <= 0
  estimatedDate: Date | null;
  progressPct: number; // 0–100, capped
}

// ── Pure computation ──────────────────────────────────────────

export function calcProjection(
  goal: Goal,
  cashFlow: HouseholdCashFlow | null,
  currentAssets: number
): GoalProjection {
  const progressPct = Math.min(
    100,
    Math.round((currentAssets / goal.target_amount) * 100)
  );
  const remaining = Math.max(0, goal.target_amount - currentAssets);

  if (remaining === 0) {
    return {
      currentAssets,
      remaining: 0,
      monthsToGoal: 0,
      estimatedDate: new Date(),
      progressPct: 100,
    };
  }

  if (!cashFlow) {
    return {
      currentAssets,
      remaining,
      monthsToGoal: null,
      estimatedDate: null,
      progressPct,
    };
  }

  const monthlySurplus =
    cashFlow.avg_monthly_income - cashFlow.avg_monthly_expense;

  if (monthlySurplus <= 0) {
    return {
      currentAssets,
      remaining,
      monthsToGoal: null,
      estimatedDate: null,
      progressPct,
    };
  }

  const monthsToGoal = Math.ceil(remaining / monthlySurplus);
  const estimatedDate = new Date();
  estimatedDate.setMonth(estimatedDate.getMonth() + monthsToGoal);

  return { currentAssets, remaining, monthsToGoal, estimatedDate, progressPct };
}

// ── DB helpers ────────────────────────────────────────────────

export async function getGoal(
  supabase: SupabaseClient,
  userId: string
): Promise<Goal | null> {
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function upsertGoal(
  supabase: SupabaseClient,
  userId: string,
  data: GoalInput
) {
  const { error } = await supabase.from("goals").upsert(
    {
      user_id: userId,
      name: data.name,
      emoji: data.emoji,
      target_amount: data.target_amount,
      deadline: data.deadline ?? null,
      note: data.note ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return error;
}

export async function getCashFlow(
  supabase: SupabaseClient,
  userId: string
): Promise<HouseholdCashFlow | null> {
  const { data } = await supabase
    .from("household_cash_flow")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function upsertCashFlow(
  supabase: SupabaseClient,
  userId: string,
  data: CashFlowInput
) {
  const { error } = await supabase.from("household_cash_flow").upsert(
    {
      user_id: userId,
      avg_monthly_income: data.avg_monthly_income,
      avg_monthly_expense: data.avg_monthly_expense,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return error;
}

export async function getMonthlyActual(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number
): Promise<MonthlyActual | null> {
  const { data } = await supabase
    .from("monthly_actuals")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();
  return data;
}

export async function upsertMonthlyActual(
  supabase: SupabaseClient,
  userId: string,
  data: MonthlyActualInput
) {
  const { error } = await supabase.from("monthly_actuals").upsert(
    {
      user_id: userId,
      year: data.year,
      month: data.month,
      actual_income: data.actual_income,
      actual_expense: data.actual_expense,
      note: data.note ?? null,
    },
    { onConflict: "user_id, year, month" }
  );
  return error;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/goals.ts
git commit -m "feat(goals): add service layer types and DB helpers"
```

---

## Task 3: Validation Schemas

**Files:**

- Create: `src/lib/validations/goals.ts`

- [ ] **Step 1: Write schemas**

```typescript
// src/lib/validations/goals.ts
import { z } from "zod";

export const goalSchema = z.object({
  name: z
    .string()
    .min(1, "Vui lòng nhập tên mục tiêu")
    .max(50, "Tên không quá 50 ký tự"),
  emoji: z.string().min(1, "Vui lòng nhập emoji"),
  target_amount: z.number().min(1, "Số tiền mục tiêu phải lớn hơn 0"),
  deadline: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;

export const cashFlowSchema = z.object({
  avg_monthly_income: z.number().min(0, "Thu nhập không được âm"),
  avg_monthly_expense: z.number().min(0, "Chi tiêu không được âm"),
});

export type CashFlowInput = z.infer<typeof cashFlowSchema>;

export const monthlyActualSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  actual_income: z.number().min(0, "Thu nhập không được âm"),
  actual_expense: z.number().min(0, "Chi tiêu không được âm"),
  note: z.string().nullable().optional(),
});

export type MonthlyActualInput = z.infer<typeof monthlyActualSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validations/goals.ts
git commit -m "feat(goals): add validation schemas"
```

---

## Task 4: Unit Tests for calcProjection

**Files:**

- Create: `src/lib/__tests__/goals-utils.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/__tests__/goals-utils.test.ts
import { describe, it, expect } from "vitest";
import { calcProjection } from "@/lib/services/goals";
import type { Goal, HouseholdCashFlow } from "@/lib/services/goals";

const baseGoal: Goal = {
  id: "g1",
  user_id: "u1",
  name: "Mua nhà",
  emoji: "🏠",
  target_amount: 1_500_000_000,
  deadline: null,
  note: null,
  is_completed: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const baseCashFlow: HouseholdCashFlow = {
  id: "cf1",
  user_id: "u1",
  avg_monthly_income: 45_000_000,
  avg_monthly_expense: 28_000_000,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("calcProjection", () => {
  it("calculates months to goal and progress correctly", () => {
    // 780M of 1.5B = 52%, remaining 720M / 17M surplus = 43 months (ceil)
    const result = calcProjection(baseGoal, baseCashFlow, 780_000_000);
    expect(result.progressPct).toBe(52);
    expect(result.remaining).toBe(720_000_000);
    expect(result.monthsToGoal).toBe(43);
    expect(result.estimatedDate).toBeInstanceOf(Date);
  });

  it("returns 100% and monthsToGoal=0 when already reached target", () => {
    const result = calcProjection(baseGoal, baseCashFlow, 1_600_000_000);
    expect(result.progressPct).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.monthsToGoal).toBe(0);
  });

  it("caps progressPct at 100 when assets exceed target", () => {
    const result = calcProjection(baseGoal, baseCashFlow, 2_000_000_000);
    expect(result.progressPct).toBe(100);
  });

  it("returns null monthsToGoal when surplus is zero", () => {
    const zeroCashFlow: HouseholdCashFlow = {
      ...baseCashFlow,
      avg_monthly_income: 28_000_000,
      avg_monthly_expense: 28_000_000,
    };
    const result = calcProjection(baseGoal, zeroCashFlow, 500_000_000);
    expect(result.monthsToGoal).toBeNull();
    expect(result.estimatedDate).toBeNull();
  });

  it("returns null monthsToGoal when surplus is negative", () => {
    const negativeCashFlow: HouseholdCashFlow = {
      ...baseCashFlow,
      avg_monthly_income: 20_000_000,
      avg_monthly_expense: 28_000_000,
    };
    const result = calcProjection(baseGoal, negativeCashFlow, 500_000_000);
    expect(result.monthsToGoal).toBeNull();
  });

  it("returns null monthsToGoal when no cash flow set", () => {
    const result = calcProjection(baseGoal, null, 500_000_000);
    expect(result.monthsToGoal).toBeNull();
    expect(result.estimatedDate).toBeNull();
  });

  it("ceils fractional months (e.g. 720M / 17M = 42.35 → 43)", () => {
    const result = calcProjection(baseGoal, baseCashFlow, 780_000_000);
    expect(result.monthsToGoal).toBe(43);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/goals-utils.test.ts
```

Expected: all tests FAIL with "Cannot find module" or import error (service not yet fully typed with validation imports).

- [ ] **Step 3: Run tests to verify they pass**

Now that Task 2 (service layer) is complete, run again:

```bash
npx vitest run src/lib/__tests__/goals-utils.test.ts
```

Expected: all 7 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/__tests__/goals-utils.test.ts
git commit -m "test(goals): add calcProjection unit tests"
```

---

## Task 5: Server Actions

**Files:**

- Create: `src/app/actions/goals.ts`

- [ ] **Step 1: Write server actions**

```typescript
// src/app/actions/goals.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  goalSchema,
  cashFlowSchema,
  monthlyActualSchema,
  type GoalInput,
  type CashFlowInput,
  type MonthlyActualInput,
} from "@/lib/validations/goals";
import {
  upsertGoal,
  upsertCashFlow,
  upsertMonthlyActual,
} from "@/lib/services/goals";

export async function saveGoalAction(
  data: GoalInput
): Promise<{ error: string } | undefined> {
  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const error = await upsertGoal(supabase, user.id, parsed.data);
  if (error) return { error: "Không thể lưu mục tiêu" };

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function saveCashFlowAction(
  data: CashFlowInput
): Promise<{ error: string } | undefined> {
  const parsed = cashFlowSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const error = await upsertCashFlow(supabase, user.id, parsed.data);
  if (error) return { error: "Không thể lưu thu chi" };

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function saveMonthlyActualAction(
  data: MonthlyActualInput
): Promise<{ error: string } | undefined> {
  const parsed = monthlyActualSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const error = await upsertMonthlyActual(supabase, user.id, parsed.data);
  if (error) return { error: "Không thể lưu số liệu tháng này" };

  revalidatePath("/goals");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/goals.ts
git commit -m "feat(goals): add server actions for goal, cash flow, monthly actual"
```

---

## Task 6: GoalSheet Component (Set / Edit Goal)

**Files:**

- Create: `src/app/(protected)/goals/components/GoalSheet.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/app/(protected)/goals/components/GoalSheet.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { goalSchema, type GoalInput } from "@/lib/validations/goals";
import type { Goal } from "@/lib/services/goals";
import { saveGoalAction } from "@/app/actions/goals";

interface Props {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatVND(n: number) {
  return n > 0 ? new Intl.NumberFormat("vi-VN").format(n) : "";
}

export function GoalSheet({ goal, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [amountDisplay, setAmountDisplay] = useState("");

  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      emoji: "🎯",
      target_amount: 0,
      deadline: null,
      note: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (goal) {
        form.reset({
          name: goal.name,
          emoji: goal.emoji,
          target_amount: goal.target_amount,
          deadline: goal.deadline ?? null,
          note: goal.note ?? null,
        });
        setAmountDisplay(formatVND(goal.target_amount));
      } else {
        form.reset({
          name: "",
          emoji: "🎯",
          target_amount: 0,
          deadline: null,
          note: null,
        });
        setAmountDisplay("");
      }
    }
  }, [open, goal, form]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = raw ? parseInt(raw, 10) : 0;
    setAmountDisplay(raw ? formatVND(num) : "");
    form.setValue("target_amount", num, { shouldValidate: true });
  };

  const onSubmit = (data: GoalInput) => {
    startTransition(async () => {
      const result = await saveGoalAction(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(goal ? "Đã cập nhật mục tiêu" : "Đã đặt mục tiêu");
        router.refresh();
        onOpenChange(false);
      }
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          <div className="bg-background border-border sticky top-0 flex items-center justify-between border-b px-5 pt-5 pb-4">
            <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
              {goal ? "Chỉnh sửa mục tiêu" : "Đặt mục tiêu"}
            </span>
            <Drawer.Close className="text-foreground-muted">
              <X size={20} />
            </Drawer.Close>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-5 py-5 pb-10"
          >
            {/* Emoji + Tên */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                  Icon
                </label>
                <input
                  {...form.register("emoji")}
                  className="bg-surface border-border text-foreground w-14 border p-3 text-center text-xl"
                  maxLength={2}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                  Tên mục tiêu *
                </label>
                <input
                  {...form.register("name")}
                  className="bg-surface border-border text-foreground border p-3 text-[15px]"
                  placeholder="VD: Mua nhà, Du lịch Nhật..."
                />
                {form.formState.errors.name && (
                  <p className="text-[12px] text-red-400">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>

            {/* Số tiền mục tiêu */}
            <div className="flex flex-col gap-2">
              <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                Số tiền mục tiêu (₫) *
              </label>
              <input
                value={amountDisplay}
                onChange={handleAmountChange}
                inputMode="numeric"
                className="bg-surface border-border text-foreground border p-3 text-[15px]"
                placeholder="VD: 1.500.000.000"
              />
              {form.formState.errors.target_amount && (
                <p className="text-[12px] text-red-400">
                  {form.formState.errors.target_amount.message}
                </p>
              )}
            </div>

            {/* Deadline (optional) */}
            <div className="flex flex-col gap-2">
              <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                Ngày mục tiêu (không bắt buộc)
              </label>
              <input
                type="date"
                {...form.register("deadline")}
                className="bg-surface border-border text-foreground border p-3 text-[15px]"
              />
            </div>

            {/* Ghi chú */}
            <div className="flex flex-col gap-2">
              <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                Ghi chú
              </label>
              <textarea
                {...form.register("note")}
                rows={2}
                className="bg-surface border-border text-foreground resize-none border p-3 text-[15px]"
                placeholder="Tuỳ chọn..."
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="bg-accent text-background mt-2 p-4 text-[14px] font-bold tracking-[1px] uppercase disabled:opacity-50"
            >
              {isPending ? "Đang lưu..." : goal ? "Cập nhật" : "Đặt mục tiêu"}
            </button>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/goals/components/GoalSheet.tsx
git commit -m "feat(goals): add GoalSheet drawer component"
```

---

## Task 7: CashFlowSheet Component

**Files:**

- Create: `src/app/(protected)/goals/components/CashFlowSheet.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/app/(protected)/goals/components/CashFlowSheet.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { cashFlowSchema, type CashFlowInput } from "@/lib/validations/goals";
import type { HouseholdCashFlow } from "@/lib/services/goals";
import { saveCashFlowAction } from "@/app/actions/goals";
import { formatVND } from "@/lib/gold-utils";

interface Props {
  cashFlow: HouseholdCashFlow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function stripFormatting(n: number) {
  return n > 0 ? new Intl.NumberFormat("vi-VN").format(n) : "";
}

export function CashFlowSheet({ cashFlow, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [incomeDisplay, setIncomeDisplay] = useState("");
  const [expenseDisplay, setExpenseDisplay] = useState("");

  const form = useForm<CashFlowInput>({
    resolver: zodResolver(cashFlowSchema),
    defaultValues: { avg_monthly_income: 0, avg_monthly_expense: 0 },
  });

  const income = form.watch("avg_monthly_income");
  const expense = form.watch("avg_monthly_expense");
  const surplus = income - expense;

  useEffect(() => {
    if (open) {
      if (cashFlow) {
        form.reset({
          avg_monthly_income: cashFlow.avg_monthly_income,
          avg_monthly_expense: cashFlow.avg_monthly_expense,
        });
        setIncomeDisplay(stripFormatting(cashFlow.avg_monthly_income));
        setExpenseDisplay(stripFormatting(cashFlow.avg_monthly_expense));
      } else {
        form.reset({ avg_monthly_income: 0, avg_monthly_expense: 0 });
        setIncomeDisplay("");
        setExpenseDisplay("");
      }
    }
  }, [open, cashFlow, form]);

  const makeChangeHandler =
    (
      field: "avg_monthly_income" | "avg_monthly_expense",
      setDisplay: (v: string) => void
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      const num = raw ? parseInt(raw, 10) : 0;
      setDisplay(raw ? new Intl.NumberFormat("vi-VN").format(num) : "");
      form.setValue(field, num, { shouldValidate: true });
    };

  const onSubmit = (data: CashFlowInput) => {
    startTransition(async () => {
      const result = await saveCashFlowAction(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã cập nhật thu chi trung bình");
        router.refresh();
        onOpenChange(false);
      }
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          <div className="bg-background border-border sticky top-0 flex items-center justify-between border-b px-5 pt-5 pb-4">
            <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
              Thu chi trung bình / tháng
            </span>
            <Drawer.Close className="text-foreground-muted">
              <X size={20} />
            </Drawer.Close>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-5 py-5 pb-10"
          >
            <div className="flex flex-col gap-2">
              <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                Thu nhập TB / tháng (₫) *
              </label>
              <input
                value={incomeDisplay}
                onChange={makeChangeHandler(
                  "avg_monthly_income",
                  setIncomeDisplay
                )}
                inputMode="numeric"
                className="bg-surface border-border text-foreground border p-3 text-[15px]"
                placeholder="VD: 45.000.000"
              />
              {form.formState.errors.avg_monthly_income && (
                <p className="text-[12px] text-red-400">
                  {form.formState.errors.avg_monthly_income.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                Chi tiêu TB / tháng (₫) *
              </label>
              <input
                value={expenseDisplay}
                onChange={makeChangeHandler(
                  "avg_monthly_expense",
                  setExpenseDisplay
                )}
                inputMode="numeric"
                className="bg-surface border-border text-foreground border p-3 text-[15px]"
                placeholder="VD: 28.000.000"
              />
              {form.formState.errors.avg_monthly_expense && (
                <p className="text-[12px] text-red-400">
                  {form.formState.errors.avg_monthly_expense.message}
                </p>
              )}
            </div>

            {/* Live preview */}
            <div className="bg-surface border-border border p-4">
              <p className="text-foreground-muted mb-2 text-[11px] font-semibold tracking-[1px] uppercase">
                Thặng dư dự kiến
              </p>
              <p
                className={`text-[20px] font-bold tracking-[-0.5px] ${surplus >= 0 ? "text-green-500" : "text-red-400"}`}
              >
                {surplus >= 0 ? "+" : ""}
                {formatVND(surplus)}
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="bg-accent text-background mt-2 p-4 text-[14px] font-bold tracking-[1px] uppercase disabled:opacity-50"
            >
              {isPending ? "Đang lưu..." : "Lưu cài đặt"}
            </button>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/goals/components/CashFlowSheet.tsx
git commit -m "feat(goals): add CashFlowSheet drawer component"
```

---

## Task 8: MonthlyActualSheet Component

**Files:**

- Create: `src/app/(protected)/goals/components/MonthlyActualSheet.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/app/(protected)/goals/components/MonthlyActualSheet.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import {
  monthlyActualSchema,
  type MonthlyActualInput,
} from "@/lib/validations/goals";
import type { MonthlyActual, HouseholdCashFlow } from "@/lib/services/goals";
import { saveMonthlyActualAction } from "@/app/actions/goals";
import { formatVND } from "@/lib/gold-utils";

interface Props {
  year: number;
  month: number;
  existing: MonthlyActual | null;
  cashFlow: HouseholdCashFlow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  const [incomeDisplay, setIncomeDisplay] = useState("");
  const [expenseDisplay, setExpenseDisplay] = useState("");

  const form = useForm<MonthlyActualInput>({
    resolver: zodResolver(monthlyActualSchema),
    defaultValues: {
      year,
      month,
      actual_income: 0,
      actual_expense: 0,
      note: null,
    },
  });

  const income = form.watch("actual_income");
  const expense = form.watch("actual_expense");
  const surplus = income - expense;
  const baseline = cashFlow
    ? cashFlow.avg_monthly_income - cashFlow.avg_monthly_expense
    : null;
  const delta = baseline !== null ? surplus - baseline : null;

  useEffect(() => {
    if (open) {
      if (existing) {
        form.reset({
          year,
          month,
          actual_income: existing.actual_income,
          actual_expense: existing.actual_expense,
          note: existing.note ?? null,
        });
        setIncomeDisplay(
          existing.actual_income > 0
            ? new Intl.NumberFormat("vi-VN").format(existing.actual_income)
            : ""
        );
        setExpenseDisplay(
          existing.actual_expense > 0
            ? new Intl.NumberFormat("vi-VN").format(existing.actual_expense)
            : ""
        );
      } else {
        form.reset({
          year,
          month,
          actual_income: 0,
          actual_expense: 0,
          note: null,
        });
        setIncomeDisplay("");
        setExpenseDisplay("");
      }
    }
  }, [open, existing, year, month, form]);

  const makeChangeHandler =
    (
      field: "actual_income" | "actual_expense",
      setDisplay: (v: string) => void
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      const num = raw ? parseInt(raw, 10) : 0;
      setDisplay(raw ? new Intl.NumberFormat("vi-VN").format(num) : "");
      form.setValue(field, num, { shouldValidate: true });
    };

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
        <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          <div className="bg-background border-border sticky top-0 flex items-center justify-between border-b px-5 pt-5 pb-4">
            <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
              Cập nhật tháng {month}/{year}
            </span>
            <Drawer.Close className="text-foreground-muted">
              <X size={20} />
            </Drawer.Close>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-5 py-5 pb-10"
          >
            <div className="flex flex-col gap-2">
              <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                Thu nhập tháng {month}/{year} (₫) *
              </label>
              <input
                value={incomeDisplay}
                onChange={makeChangeHandler("actual_income", setIncomeDisplay)}
                inputMode="numeric"
                className="bg-surface border-border text-foreground border p-3 text-[15px]"
                placeholder="VD: 47.500.000"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                Chi tiêu tháng {month}/{year} (₫) *
              </label>
              <input
                value={expenseDisplay}
                onChange={makeChangeHandler(
                  "actual_expense",
                  setExpenseDisplay
                )}
                inputMode="numeric"
                className="bg-surface border-border text-foreground border p-3 text-[15px]"
                placeholder="VD: 28.000.000"
              />
            </div>

            {/* Live preview */}
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
                <div className="flex items-center justify-between">
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

            <div className="flex flex-col gap-2">
              <label className="text-foreground-muted text-[11px] font-semibold tracking-[1px] uppercase">
                Ghi chú
              </label>
              <textarea
                {...form.register("note")}
                rows={2}
                className="bg-surface border-border text-foreground resize-none border p-3 text-[15px]"
                placeholder="Tuỳ chọn..."
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="bg-accent text-background mt-2 p-4 text-[14px] font-bold tracking-[1px] uppercase disabled:opacity-50"
            >
              {isPending ? "Đang lưu..." : "Lưu"}
            </button>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/goals/components/MonthlyActualSheet.tsx
git commit -m "feat(goals): add MonthlyActualSheet drawer component"
```

---

## Task 9: BannerCard + CashFlowCard Display Components

**Files:**

- Create: `src/app/(protected)/goals/components/BannerCard.tsx`
- Create: `src/app/(protected)/goals/components/CashFlowCard.tsx`

- [ ] **Step 1: Write BannerCard**

```tsx
// src/app/(protected)/goals/components/BannerCard.tsx
import { formatVND } from "@/lib/gold-utils";

interface Props {
  currentAssets: number;
  avgMonthlySurplus: number | null;
}

export function BannerCard({ currentAssets, avgMonthlySurplus }: Props) {
  return (
    <div className="border border-[#3a3010] bg-gradient-to-br from-[#1c1800] to-[#1a1a1a] p-4">
      <p className="mb-3 text-[10px] font-semibold tracking-[1.5px] text-[#D4AF37] uppercase">
        Tổng quan tài chính
      </p>
      <div className="flex gap-0">
        <div className="flex-1">
          <p className="text-foreground-muted mb-1 text-[11px]">
            Tài sản hiện tại
          </p>
          <p className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
            {formatVND(currentAssets)}
          </p>
        </div>
        <div className="mx-4 w-px shrink-0 bg-[#333]" />
        <div className="flex-1">
          <p className="text-foreground-muted mb-1 text-[11px]">
            Thặng dư TB/tháng
          </p>
          {avgMonthlySurplus !== null ? (
            <p
              className={`text-[16px] font-bold tracking-[-0.5px] ${avgMonthlySurplus >= 0 ? "text-green-500" : "text-red-400"}`}
            >
              {avgMonthlySurplus >= 0 ? "+" : ""}
              {formatVND(avgMonthlySurplus)}
            </p>
          ) : (
            <p className="text-foreground-muted text-[13px]">Chưa cài đặt</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write CashFlowCard**

```tsx
// src/app/(protected)/goals/components/CashFlowCard.tsx
import { formatVND } from "@/lib/gold-utils";
import type { HouseholdCashFlow } from "@/lib/services/goals";

interface Props {
  cashFlow: HouseholdCashFlow | null;
  onEdit: () => void;
}

export function CashFlowCard({ cashFlow, onEdit }: Props) {
  const surplus = cashFlow
    ? cashFlow.avg_monthly_income - cashFlow.avg_monthly_expense
    : null;

  return (
    <div className="bg-surface border-border border p-4">
      <p className="text-foreground-muted mb-3 text-[10px] font-semibold tracking-[1.5px] uppercase">
        Cài đặt thu chi trung bình
      </p>
      {cashFlow ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary text-[13px]">
              Thu nhập TB/tháng
            </span>
            <span className="text-foreground text-[13px] font-semibold">
              {formatVND(cashFlow.avg_monthly_income)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary text-[13px]">
              Chi tiêu TB/tháng
            </span>
            <span className="text-foreground text-[13px] font-semibold">
              {formatVND(cashFlow.avg_monthly_expense)}
            </span>
          </div>
          <div className="border-border mt-1 flex items-center justify-between border-t pt-1">
            <span className="text-foreground-secondary text-[13px]">
              Thặng dư dự kiến
            </span>
            <span
              className={`text-[13px] font-bold ${surplus! >= 0 ? "text-green-500" : "text-red-400"}`}
            >
              {surplus! >= 0 ? "+" : ""}
              {formatVND(surplus!)}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-foreground-muted text-[13px]">Chưa cài đặt</p>
      )}
      <button
        onClick={onEdit}
        className="mt-3 w-full text-right text-[12px] font-semibold text-[#D4AF37]"
      >
        {cashFlow ? "Chỉnh sửa →" : "Cài đặt ngay →"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/goals/components/BannerCard.tsx src/app/(protected)/goals/components/CashFlowCard.tsx
git commit -m "feat(goals): add BannerCard and CashFlowCard display components"
```

---

## Task 10: GoalCard Component

**Files:**

- Create: `src/app/(protected)/goals/components/GoalCard.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/app/(protected)/goals/components/GoalCard.tsx
import { formatVND } from "@/lib/gold-utils";
import type {
  Goal,
  GoalProjection,
  MonthlyActual,
  HouseholdCashFlow,
} from "@/lib/services/goals";

interface Props {
  goal: Goal;
  projection: GoalProjection;
  monthlyActual: MonthlyActual | null;
  cashFlow: HouseholdCashFlow | null;
  currentYear: number;
  currentMonth: number;
  onLogMonth: () => void;
}

function formatEstimatedDate(date: Date): string {
  return `T${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function GoalCard({
  goal,
  projection,
  monthlyActual,
  cashFlow,
  currentYear,
  currentMonth,
  onLogMonth,
}: Props) {
  const { progressPct, remaining, monthsToGoal, estimatedDate, currentAssets } =
    projection;

  const actualSurplus = monthlyActual
    ? monthlyActual.actual_income - monthlyActual.actual_expense
    : null;
  const baseline = cashFlow
    ? cashFlow.avg_monthly_income - cashFlow.avg_monthly_expense
    : null;
  const delta =
    actualSurplus !== null && baseline !== null
      ? actualSurplus - baseline
      : null;

  return (
    <div className="bg-surface border-border overflow-hidden border">
      {/* Header row */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <span className="shrink-0 text-[28px] leading-none">{goal.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-[15px] font-bold tracking-[-0.5px]">
            {goal.name}
          </p>
          <p className="text-foreground-muted mt-0.5 text-[12px]">
            Mục tiêu: {formatVND(goal.target_amount)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[30px] leading-none font-black tracking-[-1px] text-[#D4AF37]">
            {progressPct}%
          </p>
          <p className="text-foreground-muted mt-0.5 text-[10px]">hoàn thành</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4">
        {/* Progress bar */}
        <div className="h-2 overflow-hidden bg-[#2a2a2a]">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#f0d060] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Amounts */}
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-bold text-[#D4AF37]">
            {formatVND(currentAssets)}
          </span>
          {remaining > 0 && (
            <span className="text-foreground-muted text-[12px]">
              Còn thiếu {formatVND(remaining)}
            </span>
          )}
        </div>

        {/* Projection pill */}
        {monthsToGoal !== null && monthsToGoal > 0 && estimatedDate && (
          <div className="inline-flex items-center gap-1.5 self-start border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5">
            <span className="text-foreground-muted text-[12px]">
              ⏱ Dự kiến đạt{" "}
              <span className="font-semibold text-[#D4AF37]">
                {formatEstimatedDate(estimatedDate)}
              </span>{" "}
              (~{monthsToGoal} tháng)
            </span>
          </div>
        )}
        {monthsToGoal === 0 && (
          <div className="inline-flex items-center gap-1.5 self-start border border-green-800 bg-[#1a1a1a] px-3 py-1.5">
            <span className="text-[12px] font-semibold text-green-500">
              🎉 Đã đạt mục tiêu!
            </span>
          </div>
        )}
        {monthsToGoal === null && (
          <p className="text-foreground-muted text-[12px]">
            ⚠️ Không thể dự báo — thặng dư âm hoặc chưa cài đặt thu chi
          </p>
        )}

        {/* Divider */}
        <div className="h-px bg-[#222]" />

        {/* Monthly section */}
        <div>
          <p className="text-foreground-muted mb-2 text-[10px] font-semibold tracking-[1.5px] uppercase">
            Tháng {currentMonth}/{currentYear}
          </p>
          {monthlyActual ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-foreground-secondary text-[12px]">
                  Thu nhập thực tế
                </span>
                <span className="text-foreground text-[12px] font-semibold">
                  {formatVND(monthlyActual.actual_income)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary text-[12px]">
                  Chi tiêu thực tế
                </span>
                <span className="text-foreground text-[12px] font-semibold">
                  {formatVND(monthlyActual.actual_expense)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary text-[12px]">
                  Thặng dư tháng này
                </span>
                <span
                  className={`text-[12px] font-bold ${actualSurplus! >= 0 ? "text-green-500" : "text-red-400"}`}
                >
                  {actualSurplus! >= 0 ? "+" : ""}
                  {formatVND(actualSurplus!)}
                </span>
              </div>
              {delta !== null && (
                <div className="flex justify-between">
                  <span className="text-foreground-secondary text-[12px]">
                    So với TB dự kiến
                  </span>
                  <span
                    className={`text-[12px] font-bold ${delta >= 0 ? "text-green-500" : "text-red-400"}`}
                  >
                    {delta >= 0 ? "+" : ""}
                    {formatVND(delta)} {delta >= 0 ? "↑" : "↓"}
                  </span>
                </div>
              )}
              <button
                onClick={onLogMonth}
                className="mt-1 text-right text-[12px] font-semibold text-[#D4AF37]"
              >
                Chỉnh sửa →
              </button>
            </div>
          ) : (
            <button
              onClick={onLogMonth}
              className="text-foreground-muted flex w-full items-center gap-2 text-[13px]"
            >
              <span>Chưa cập nhật tháng này</span>
              <span className="ml-auto font-semibold text-[#D4AF37]">
                + Cập nhật
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/goals/components/GoalCard.tsx
git commit -m "feat(goals): add GoalCard component"
```

---

## Task 11: GoalsClient + page.tsx

**Files:**

- Create: `src/app/(protected)/goals/GoalsClient.tsx`
- Modify: `src/app/(protected)/goals/page.tsx`

- [ ] **Step 1: Write GoalsClient**

```tsx
// src/app/(protected)/goals/GoalsClient.tsx
"use client";

import { useState } from "react";
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
import { MonthlyActualSheet } from "./components/MonthlyActualSheet";

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
  const [openSheet, setOpenSheet] = useState<
    "goal" | "cashflow" | "monthly" | null
  >(null);

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
            onLogMonth={() => setOpenSheet("monthly")}
          />
          <CashFlowCard
            cashFlow={cashFlow}
            onEdit={() => setOpenSheet("cashflow")}
          />
        </>
      ) : (
        /* Empty state */
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
      {goal && (
        <MonthlyActualSheet
          year={currentYear}
          month={currentMonth}
          existing={monthlyActual}
          cashFlow={cashFlow}
          open={openSheet === "monthly"}
          onOpenChange={(o) => setOpenSheet(o ? "monthly" : null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write page.tsx**

```tsx
// src/app/(protected)/goals/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getGoal,
  getCashFlow,
  getMonthlyActual,
  calcProjection,
} from "@/lib/services/goals";
import {
  getSavingsAccounts,
  calcAccruedInterest,
} from "@/lib/services/savings";
import {
  getActiveGoldAssets,
  getExternalGoldPrices,
} from "@/lib/services/gold";
import { getSettings } from "@/lib/services/settings";
import { calcPnl, CHI_PER_LUONG } from "@/lib/gold-utils";
import { GoalsClient } from "./GoalsClient";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [
    goal,
    cashFlow,
    monthlyActual,
    savingsAccounts,
    goldPositions,
    prices,
    settings,
  ] = await Promise.all([
    getGoal(supabase, user.id),
    getCashFlow(supabase, user.id),
    getMonthlyActual(supabase, user.id, currentYear, currentMonth),
    getSavingsAccounts(supabase, user.id),
    getActiveGoldAssets(supabase, user.id),
    getExternalGoldPrices(),
    getSettings(supabase, user.id),
  ]);

  // Compute current total assets
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
        calcPnl(
          remaining,
          pos.buy_price_per_chi,
          livePrice.sell / CHI_PER_LUONG
        ).currentValue
      );
    }
    return s + remaining * pos.buy_price_per_chi;
  }, 0);
  const cashBalance = settings?.initial_cash_balance ?? 0;
  const currentAssets = savingsTotal + goldTotal + cashBalance;

  const projection = goal
    ? calcProjection(goal, cashFlow, currentAssets)
    : null;

  return (
    <GoalsClient
      goal={goal}
      cashFlow={cashFlow}
      monthlyActual={monthlyActual}
      projection={projection}
      currentAssets={currentAssets}
      currentYear={currentYear}
      currentMonth={currentMonth}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/goals/GoalsClient.tsx src/app/(protected)/goals/page.tsx
git commit -m "feat(goals): wire GoalsClient and RSC page"
```

---

## Task 12: Dashboard Integration

**Files:**

- Create: `src/app/(protected)/dashboard/components/GoalsDashboardCard.tsx`
- Modify: `src/app/(protected)/dashboard/page.tsx`
- Modify: `src/app/(protected)/dashboard/DashboardClient.tsx`

- [ ] **Step 1: Write GoalsDashboardCard**

```tsx
// src/app/(protected)/dashboard/components/GoalsDashboardCard.tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatVND } from "@/lib/gold-utils";
import type { Goal, GoalProjection } from "@/lib/services/goals";

interface Props {
  goal: Goal | null;
  projection: GoalProjection | null;
}

function formatEstimatedDate(date: Date): string {
  return `T${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function GoalsDashboardCard({ goal, projection }: Props) {
  return (
    <div className="bg-surface border-border border p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-accent h-3.5 w-0.75 shrink-0" />
          <span className="text-foreground-secondary text-[11px] font-semibold tracking-[1.5px] uppercase">
            Mục tiêu
          </span>
        </div>
        <Link
          href="/goals"
          className="text-foreground-muted flex items-center gap-1"
        >
          <span className="text-[12px]">Chi tiết</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {goal && projection ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[20px]">{goal.emoji}</span>
              <span className="text-foreground text-[14px] font-bold">
                {goal.name}
              </span>
            </div>
            <span className="text-[20px] font-black tracking-[-0.5px] text-[#D4AF37]">
              {projection.progressPct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden bg-[#2a2a2a]">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#f0d060]"
              style={{ width: `${projection.progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted text-[12px]">
              {formatVND(projection.currentAssets)} /{" "}
              {formatVND(goal.target_amount)}
            </span>
            {projection.estimatedDate && projection.monthsToGoal! > 0 && (
              <span className="text-foreground-muted text-[12px]">
                Dự kiến{" "}
                <span className="font-semibold text-[#D4AF37]">
                  {formatEstimatedDate(projection.estimatedDate)}
                </span>
              </span>
            )}
          </div>
        </div>
      ) : (
        <Link
          href="/goals"
          className="text-foreground-muted flex items-center justify-between text-[13px]"
        >
          <span>Chưa có mục tiêu nào</span>
          <span className="font-semibold text-[#D4AF37]">Đặt ngay →</span>
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update dashboard/page.tsx**

Add goal + cash flow fetch (in parallel with existing fetches):

```tsx
// src/app/(protected)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getActiveGoldAssets,
  getExternalGoldPrices,
} from "@/lib/services/gold";
import {
  getSavingsAccounts,
  calcAccruedInterest,
} from "@/lib/services/savings";
import { getGoal, getCashFlow, calcProjection } from "@/lib/services/goals";
import { getSettings } from "@/lib/services/settings";
import { calcPnl, CHI_PER_LUONG } from "@/lib/gold-utils";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [goldPositions, prices, savingsAccounts, goal, cashFlow, settings] =
    await Promise.all([
      getActiveGoldAssets(supabase, user.id),
      getExternalGoldPrices(),
      getSavingsAccounts(supabase, user.id),
      getGoal(supabase, user.id),
      getCashFlow(supabase, user.id),
      getSettings(supabase, user.id),
    ]);

  // Compute current assets for goal projection
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
        calcPnl(
          remaining,
          pos.buy_price_per_chi,
          livePrice.sell / CHI_PER_LUONG
        ).currentValue
      );
    }
    return s + remaining * pos.buy_price_per_chi;
  }, 0);
  const cashBalance = settings?.initial_cash_balance ?? 0;
  const currentAssets = savingsTotal + goldTotal + cashBalance;
  const goalProjection = goal
    ? calcProjection(goal, cashFlow, currentAssets)
    : null;

  return (
    <DashboardClient
      goldPositions={goldPositions}
      initialPrices={prices}
      savingsAccounts={savingsAccounts}
      goal={goal}
      goalProjection={goalProjection}
    />
  );
}
```

- [ ] **Step 3: Update DashboardClient.tsx**

Add `goal` and `goalProjection` props and render `GoalsDashboardCard` at the bottom:

```tsx
// Add to imports at top of DashboardClient.tsx:
import type { Goal, GoalProjection } from "@/lib/services/goals";
import { GoalsDashboardCard } from "./components/GoalsDashboardCard";

// Add to Props interface:
interface Props {
  goldPositions: GoldAsset[];
  initialPrices: GoldPrice[];
  savingsAccounts: SavingsAccount[];
  goal: Goal | null;
  goalProjection: GoalProjection | null;
}

// Add goal and goalProjection to destructured props in function signature.

// Add GoalsDashboardCard at the very end of the returned JSX, after the gold card:
<GoalsDashboardCard goal={goal} projection={goalProjection} />;
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/dashboard/components/GoalsDashboardCard.tsx \
        src/app/(protected)/dashboard/page.tsx \
        src/app/(protected)/dashboard/DashboardClient.tsx
git commit -m "feat(goals): add goals summary card to dashboard"
```

---

## Self-Review Checklist

- [x] **DB migration** — 3 tables with RLS and correct unique constraints
- [x] **calcProjection** tested: normal case, already reached, zero surplus, negative surplus, no cashflow
- [x] **Single goal enforced** — `UNIQUE (user_id)` on `goals` table + upsert on conflict
- [x] **Server actions** revalidate both `/goals` and `/dashboard`
- [x] **Empty state** shown when no goal exists
- [x] **CashFlowSheet** live preview of surplus as user types
- [x] **MonthlyActualSheet** shows delta vs baseline in live preview
- [x] **GoalCard** handles all projection states: on track, reached, null (no surplus)
- [x] **Dashboard card** shows progress bar + projection date
- [x] **No arbitrary Tailwind px values** except where no canonical equivalent exists
- [x] **formatVND** imported from `@/lib/gold-utils` in all client components
- [x] All Drawer patterns match `AddEditSavingsSheet` convention
