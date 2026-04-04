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
        <h1 className="type-featured-stat uppercase">MỤC TIÊU</h1>
        {goal && (
          <button
            onClick={() => setOpenSheet("goal")}
            className="border-accent text-accent border px-4 py-2 text-sm font-semibold"
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
              <p className="text-foreground mb-1 text-base font-bold">
                Chưa có mục tiêu nào
              </p>
              <p className="text-foreground-muted text-sm">
                Đặt mục tiêu tài chính cho hai vợ chồng và theo dõi tiến độ mỗi
                ngày
              </p>
            </div>
            <button
              onClick={() => setOpenSheet("goal")}
              className="bg-accent text-background mt-2 px-6 py-3 text-sm font-bold uppercase"
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
