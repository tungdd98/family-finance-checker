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
  const goldDisplayValue =
    goldTotalValue > 0 ? goldTotalValue : goldTotalCapital;
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
          <span className="text-foreground text-[15px] leading-tight font-bold tracking-[-0.5px]">
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
          <span className="text-foreground text-[15px] leading-tight font-bold tracking-[-0.5px]">
            {fmtTile(savingsTotalValue)} đ
          </span>
          <span className="text-[11px] font-semibold text-[#6B7FD7]">
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
              <span className="text-foreground text-[15px] leading-tight font-bold tracking-[-0.5px]">
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
