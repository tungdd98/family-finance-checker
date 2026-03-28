"use client";

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
