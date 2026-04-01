"use client";

import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell } from "recharts";
import { formatVND, formatPct } from "@/lib/gold-utils";

interface Props {
  savingsTotal: number;
  goldTotal: number;
  goldCost: number;
  savingsPrincipal: number;
}

const GOLD_COLOR = "#D4AF37";
const SAVINGS_COLOR = "#4e8c6a";

export function AssetsClient({
  savingsTotal,
  goldTotal,
  goldCost,
  savingsPrincipal,
}: Props) {
  const router = useRouter();
  const netWorth = savingsTotal + goldTotal;

  // P&L calculations
  const goldPnl = goldTotal - goldCost;
  const goldPnlPct = goldCost > 0 ? (goldPnl / goldCost) * 100 : 0;

  const savingsPnl = savingsTotal - savingsPrincipal;
  const savingsPnlPct =
    savingsPrincipal > 0 ? (savingsPnl / savingsPrincipal) * 100 : 0;

  // Portfolio percentages
  const goldPct = netWorth > 0 ? Math.round((goldTotal / netWorth) * 100) : 0;
  const savingsPct = netWorth > 0 ? 100 - goldPct : 0;

  // Recharts data — if netWorth is 0, show an empty ring
  const chartData =
    netWorth > 0
      ? [{ value: goldTotal }, { value: savingsTotal }]
      : [{ value: 1 }];
  const chartColors = netWorth > 0 ? [GOLD_COLOR, SAVINGS_COLOR] : ["#1e1e1e"];

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Page title */}
      <div className="pt-2">
        <h1 className="text-foreground text-[28px] font-bold tracking-[-1px] uppercase">
          Tài Sản
        </h1>
      </div>

      {/* Net worth banner */}
      <div className="bg-surface border-border flex items-center gap-[18px] border p-5">
        <PieChart width={76} height={76}>
          <Pie
            data={chartData}
            cx={38}
            cy={38}
            innerRadius={28}
            outerRadius={38}
            paddingAngle={netWorth > 0 ? 2 : 0}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            isAnimationActive
            stroke="none"
          >
            {chartData.map((_, i) => (
              <Cell key={chartColors[i]} fill={chartColors[i]} />
            ))}
          </Pie>
        </PieChart>

        <div className="flex flex-col gap-1">
          <span className="text-foreground-muted text-[9px] font-semibold tracking-[1.5px] uppercase">
            Tổng tài sản
          </span>
          <span className="text-[22px] font-black tracking-[-1px] text-[#D4AF37]">
            {formatVND(netWorth)}
          </span>
          {netWorth > 0 && (
            <div className="mt-1 flex gap-2.5">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-[7px] w-[7px] rounded-full"
                  style={{ background: GOLD_COLOR }}
                />
                <span className="text-foreground-muted text-[9px]">
                  Vàng {goldPct}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="h-[7px] w-[7px] rounded-full"
                  style={{ background: SAVINGS_COLOR }}
                />
                <span className="text-foreground-muted text-[9px]">
                  Tiết kiệm {savingsPct}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section label */}
      <span className="text-foreground-muted text-[9px] font-semibold tracking-[1.5px] uppercase">
        Danh mục tài sản
      </span>

      {/* Asset rows */}
      <div className="flex flex-col gap-2">
        {/* Gold */}
        <button
          onClick={() => router.push("/gold")}
          className="bg-surface border-border flex items-center justify-between border border-l-[3px] px-4 py-[14px] text-left"
          style={{ borderLeftColor: GOLD_COLOR }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground-muted text-[9px] font-semibold tracking-[1.5px] uppercase">
              Vàng
            </span>
            <span className="text-foreground text-[18px] font-extrabold tracking-[-0.5px]">
              {formatVND(goldTotal)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {goldCost > 0 && (
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className={`text-[12px] font-bold tracking-[-0.3px] ${goldPnl >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {goldPnl >= 0 ? "+" : ""}
                  {formatVND(goldPnl)}
                </span>
                <span
                  className={`text-[11px] ${goldPnl >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {formatPct(goldPnlPct)}
                </span>
              </div>
            )}
            <span className="text-foreground-muted text-[14px]">›</span>
          </div>
        </button>

        {/* Savings */}
        <button
          onClick={() => router.push("/savings")}
          className="bg-surface border-border flex items-center justify-between border border-l-[3px] px-4 py-[14px] text-left"
          style={{ borderLeftColor: SAVINGS_COLOR }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground-muted text-[9px] font-semibold tracking-[1.5px] uppercase">
              Tiết Kiệm
            </span>
            <span className="text-foreground text-[18px] font-extrabold tracking-[-0.5px]">
              {formatVND(savingsTotal)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {savingsPrincipal > 0 && (
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className={`text-[12px] font-bold tracking-[-0.3px] ${savingsPnl >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {savingsPnl >= 0 ? "+" : ""}
                  {formatVND(savingsPnl)}
                </span>
                <span
                  className={`text-[11px] ${savingsPnl >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {formatPct(savingsPnlPct)}
                </span>
              </div>
            )}
            <span className="text-foreground-muted text-[14px]">›</span>
          </div>
        </button>
      </div>

      {/* Coming soon */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-semibold tracking-[1.5px] uppercase opacity-40">
          Sắp ra mắt
        </span>
        <div className="grid grid-cols-2 gap-1.5 opacity-35">
          <div className="bg-surface border-border flex flex-col gap-1 border border-dashed p-3">
            <span className="text-foreground-muted text-[8px] font-semibold tracking-[1.5px] uppercase">
              Coin
            </span>
            <span className="text-foreground-muted text-[10px]">
              Sắp ra mắt
            </span>
          </div>
          <div className="bg-surface border-border flex flex-col gap-1 border border-dashed p-3">
            <span className="text-foreground-muted text-[8px] font-semibold tracking-[1.5px] uppercase">
              Chứng Khoán
            </span>
            <span className="text-foreground-muted text-[10px]">
              Sắp ra mắt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
