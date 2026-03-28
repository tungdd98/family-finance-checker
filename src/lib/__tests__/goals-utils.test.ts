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
