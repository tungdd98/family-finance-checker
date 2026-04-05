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
}: Readonly<Props>) {
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

  const totalAllocated =
    monthlyActual?.allocations?.reduce((acc, curr) => acc + curr.amount, 0) ||
    0;
  const unallocated = actualSurplus ? actualSurplus - totalAllocated : 0;

  const TYPE_LABELS: Record<string, string> = {
    gold: "Vàng",
    savings: "Tiết kiệm",
    etf: "Quỹ ETF",
    coin: "Coin",
    other: "Khác",
  };
  const TYPE_COLORS: Record<string, string> = {
    gold: "bg-accent",
    savings: "bg-blue-500",
    etf: "bg-purple-500",
    coin: "bg-orange-400",
    other: "bg-zinc-500",
  };
  const TYPE_TEXT_COLORS: Record<string, string> = {
    gold: "text-accent",
    savings: "text-blue-500",
    etf: "text-purple-500",
    coin: "text-orange-400",
    other: "text-zinc-500",
  };

  return (
    <div className="bg-surface border-border overflow-hidden border">
      {/* Header row */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <span className="shrink-0 text-3xl leading-none">{goal.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-base font-bold">{goal.name}</p>
          <p className="text-foreground-muted mt-0.5 text-xs">
            Mục tiêu: {formatVND(goal.target_amount)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-accent text-3xl leading-none font-black">
            {progressPct}%
          </p>
          <p className="text-foreground-muted mt-0.5 text-xs">hoàn thành</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4">
        {/* Progress bar */}
        <div className="bg-border h-2 overflow-hidden">
          <div
            className="from-accent h-full bg-gradient-to-r to-[#f0d060] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Amounts */}
        <div className="flex items-baseline justify-between">
          <span className="text-accent text-base font-bold">
            {formatVND(currentAssets)}
          </span>
          {remaining > 0 && (
            <span className="text-foreground-muted text-xs">
              Còn thiếu {formatVND(remaining)}
            </span>
          )}
        </div>

        {/* Projection pill */}
        {monthsToGoal !== null && monthsToGoal > 0 && estimatedDate && (
          <div className="border-border bg-surface inline-flex items-center gap-1.5 self-start border px-3 py-1.5">
            <span className="text-foreground-muted text-xs">
              ⏱ Dự kiến đạt{" "}
              <span className="text-accent font-semibold">
                {formatEstimatedDate(estimatedDate)}
              </span>{" "}
              (~{monthsToGoal} tháng)
            </span>
          </div>
        )}
        {monthsToGoal === 0 && (
          <div className="bg-surface inline-flex items-center gap-1.5 self-start border border-green-800 px-3 py-1.5">
            <span className="text-xs font-semibold text-green-500">
              🎉 Đã đạt mục tiêu!
            </span>
          </div>
        )}
        {monthsToGoal === null && (
          <p className="text-foreground-muted text-xs">
            ⚠️ Không thể dự báo — thặng dư âm hoặc chưa cài đặt thu chi
          </p>
        )}

        {/* Divider */}
        <div className="h-px bg-[#222]" />

        {/* Monthly section */}
        <div>
          <p className="type-card-label mb-2">
            Tháng {currentMonth}/{currentYear}
          </p>
          {monthlyActual ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-foreground-secondary text-xs">
                  Thu nhập thực tế
                </span>
                <span className="text-foreground text-xs font-semibold">
                  {formatVND(monthlyActual.actual_income)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary text-xs">
                  Chi tiêu thực tế
                </span>
                <span className="text-foreground text-xs font-semibold">
                  {formatVND(monthlyActual.actual_expense)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary text-xs">
                  Thặng dư tháng này
                </span>
                <span
                  className={`text-xs font-bold ${actualSurplus! >= 0 ? "text-green-500" : "text-red-400"}`}
                >
                  {actualSurplus! >= 0 ? "+" : ""}
                  {formatVND(actualSurplus!)}
                </span>
              </div>
              {delta !== null && (
                <div className="flex justify-between">
                  <span className="text-foreground-secondary text-xs">
                    So với TB dự kiến
                  </span>
                  <span
                    className={`text-xs font-bold ${delta >= 0 ? "text-green-500" : "text-red-400"}`}
                  >
                    {delta >= 0 ? "+" : ""}
                    {formatVND(delta)} {delta >= 0 ? "↑" : "↓"}
                  </span>
                </div>
              )}

              {/* Box phân bổ Zero-Based Budget */}
              {actualSurplus! > 0 &&
                monthlyActual.allocations &&
                monthlyActual.allocations.length > 0 && (
                  <div className="border-border/50 mt-1.5 flex flex-col gap-2 border bg-[#141414] p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted text-xs font-bold uppercase">
                        Zero-Based Budget
                      </span>
                      <span
                        className={`text-xs font-bold uppercase ${
                          unallocated === 0
                            ? "text-accent"
                            : unallocated < 0
                              ? "text-red-400"
                              : "text-green-500"
                        }`}
                      >
                        {unallocated === 0
                          ? "✓ Hoàn hảo"
                          : unallocated < 0
                            ? "Cảnh báo lố"
                            : `Còn dư ${formatVND(unallocated)}`}
                      </span>
                    </div>

                    {/* Thanh Segments */}
                    <div className="bg-border flex h-1 w-full overflow-hidden rounded-none opacity-90">
                      {monthlyActual.allocations.map((a, i) => {
                        const wPct = Math.min(
                          100,
                          (a.amount / actualSurplus!) * 100
                        );
                        return (
                          <div
                            key={i}
                            style={{ width: `${wPct}%` }}
                            className={`h-full ${TYPE_COLORS[a.type] || "bg-gray-500"}`}
                          />
                        );
                      })}
                    </div>

                    {/* Chú thích hạng mục */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {monthlyActual.allocations.map((a, i) => {
                        const isExec = a.is_executed;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-1 text-xs font-medium ${TYPE_TEXT_COLORS[a.type] || "text-gray-500"} ${isExec ? "opacity-50" : ""}`}
                          >
                            <span className="text-xs">■</span>
                            <span className={isExec ? "line-through" : ""}>
                              {TYPE_LABELS[a.type] || a.type}
                            </span>
                            <span className="font-bold tabular-nums">
                              {new Intl.NumberFormat("vi-VN").format(
                                a.amount / 1000000
                              )}
                              tr
                            </span>
                            {isExec && (
                              <span className="ml-0.5 text-xs font-black text-green-500">
                                ✓
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              <button
                onClick={onLogMonth}
                className="text-accent mt-1 text-right text-xs font-semibold"
              >
                Chỉnh sửa →
              </button>
            </div>
          ) : (
            <button
              onClick={onLogMonth}
              className="text-foreground-muted flex w-full items-center gap-2 text-sm"
            >
              <span>Chưa cập nhật tháng này</span>
              <span className="text-accent ml-auto font-semibold">
                + Cập nhật
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
