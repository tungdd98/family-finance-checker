// src/lib/services/goals.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type {
  GoalInput,
  CashFlowInput,
  MonthlyActualInput,
  AllocationItem,
  ExpenseDetail,
  IncomeDetail,
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
  avg_monthly_income_husband: number;
  avg_monthly_income_wife: number;
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
  actual_income_details: IncomeDetail[];
  actual_expense: number;
  actual_expense_details: ExpenseDetail[];
  allocations: AllocationItem[];
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

export async function getGoal(userId: string): Promise<Goal | null> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
    [`goal-${userId}`],
    { tags: [`user-${userId}`], revalidate: 30 }
  )();
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

export async function getCashFlow(userId: string): Promise<HouseholdCashFlow | null> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("household_cash_flow")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
    [`cashflow-${userId}`],
    { tags: [`user-${userId}`], revalidate: 30 }
  )();
}

export async function upsertCashFlow(
  supabase: SupabaseClient,
  userId: string,
  data: CashFlowInput
) {
  const { error } = await supabase.from("household_cash_flow").upsert(
    {
      user_id: userId,
      avg_monthly_income_husband: data.avg_monthly_income_husband,
      avg_monthly_income_wife: data.avg_monthly_income_wife,
      avg_monthly_expense: data.avg_monthly_expense,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return error;
}

export async function getMonthlyActual(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyActual | null> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("monthly_actuals")
        .select("*")
        .eq("user_id", userId)
        .eq("year", year)
        .eq("month", month)
        .maybeSingle();
      return data;
    },
    [`monthly-${userId}-${year}-${month}`],
    { tags: [`user-${userId}`], revalidate: 30 }
  )();
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
      actual_income_details: data.actual_income_details ?? [],
      actual_expense: data.actual_expense,
      actual_expense_details: data.actual_expense_details ?? [],
      allocations: data.allocations ?? [],
      note: data.note ?? null,
    },
    { onConflict: "user_id, year, month" }
  );
  return error;
}
