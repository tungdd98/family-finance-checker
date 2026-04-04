"use client";

import { useRouter } from "next/navigation";
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

  // Donut chart geometry
  const RING_R = 33;
  const RING_SW = 10;
  const circ = 2 * Math.PI * RING_R;
  const goldArc = (goldPct / 100) * circ;

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Page title */}
      <div className="pt-2">
        <h1 className="type-featured-stat uppercase">Tài Sản</h1>
      </div>

      {/* Net worth banner */}
      <div className="bg-surface border-border flex items-center gap-[18px] border p-5">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          style={{ display: "block" }}
        >
          {netWorth === 0 ? (
            <circle
              cx="40"
              cy="40"
              r={RING_R}
              fill="none"
              stroke="#1e1e1e"
              strokeWidth={RING_SW}
            />
          ) : (
            <>
              {/* Savings full ring (background) */}
              <circle
                cx="40"
                cy="40"
                r={RING_R}
                fill="none"
                stroke={SAVINGS_COLOR}
                strokeWidth={RING_SW}
              />
              {/* Gold arc overlay, starts at 12 o'clock */}
              <circle
                cx="40"
                cy="40"
                r={RING_R}
                fill="none"
                stroke={GOLD_COLOR}
                strokeWidth={RING_SW}
                strokeDasharray={`${goldArc} ${circ}`}
                transform="rotate(-90 40 40)"
              />
            </>
          )}
        </svg>

        <div className="flex flex-col gap-1">
          <span className="text-foreground-muted text-[9px] font-semibold uppercase">
            Tổng tài sản
          </span>
          <span className="text-accent text-[22px] font-black">
            {formatVND(netWorth)}
          </span>
          {netWorth > 0 && (
            <div className="mt-1 flex gap-2.5">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-1.75 w-1.75 rounded-full"
                  style={{ background: GOLD_COLOR }}
                />
                <span className="text-foreground-muted text-[9px]">
                  Vàng {goldPct}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="h-1.75 w-1.75 rounded-full"
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
      <span className="text-foreground-muted text-[9px] font-semibold uppercase">
        Danh mục tài sản
      </span>

      {/* Asset rows */}
      <div className="flex flex-col gap-2">
        {/* Gold */}
        <button
          onClick={() => router.push("/gold")}
          className="bg-surface border-border flex items-center justify-between border border-l-[3px] px-4 py-3.5 text-left"
          style={{ borderLeftColor: GOLD_COLOR }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground-muted text-[9px] font-semibold uppercase">
              Vàng
            </span>
            <span className="text-foreground text-[18px] font-extrabold">
              {formatVND(goldTotal)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {goldCost > 0 && (
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className={`text-xs font-bold ${goldPnl >= 0 ? "text-green-500" : "text-red-500"}`}
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
            <span className="text-foreground-muted text-sm">›</span>
          </div>
        </button>

        {/* Savings */}
        <button
          onClick={() => router.push("/savings")}
          className="bg-surface border-border flex items-center justify-between border border-l-[3px] px-4 py-3.5 text-left"
          style={{ borderLeftColor: SAVINGS_COLOR }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground-muted text-[9px] font-semibold uppercase">
              Tiết Kiệm
            </span>
            <span className="text-foreground text-[18px] font-extrabold">
              {formatVND(savingsTotal)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {savingsPrincipal > 0 && (
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className={`text-xs font-bold ${savingsPnl >= 0 ? "text-green-500" : "text-red-500"}`}
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
            <span className="text-foreground-muted text-sm">›</span>
          </div>
        </button>
      </div>

      {/* Coming soon */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-semibold uppercase opacity-40">
          Sắp ra mắt
        </span>
        <div className="grid grid-cols-2 gap-1.5 opacity-35">
          <div className="bg-surface border-border flex flex-col gap-1 border border-dashed p-3">
            <span className="text-foreground-muted text-[8px] font-semibold uppercase">
              Coin
            </span>
            <span className="text-foreground-muted text-[10px]">
              Sắp ra mắt
            </span>
          </div>
          <div className="bg-surface border-border flex flex-col gap-1 border border-dashed p-3">
            <span className="text-foreground-muted text-[8px] font-semibold uppercase">
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
