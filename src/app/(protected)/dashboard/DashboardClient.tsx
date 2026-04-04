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
import type { RecentTx } from "@/types/transactions";
import { HeroCard } from "./components/HeroCard";
import { StatTile } from "./components/StatTile";
import { RecentTransactions } from "./components/RecentTransactions";

interface Props {
  goldPositions: GoldAsset[];
  initialPrices: GoldPrice[];
  savingsAccounts: SavingsAccount[];
  goal: Goal | null;
  goalProjection: GoalProjection | null;
  monthlyActual: MonthlyActual | null;
  currentAssets: number;
  recentTxs: RecentTx[];
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
  recentTxs,
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
  let goldTotalChi = 0;
  for (const pos of goldPositions) {
    const remaining = pos.quantity - pos.sold_quantity;
    const livePrice = priceMap.get(pos.brand_code);
    goldTotalCapital += remaining * pos.buy_price_per_chi;
    goldTotalChi += remaining;
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
  const savingsTotalAccrued = savingsAccounts.reduce(
    (s, a) => s + calcAccruedInterest(a),
    0
  );
  const savingsTotalValue =
    savingsAccounts.reduce((s, a) => s + a.principal, 0) + savingsTotalAccrued;

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

  // Market tile: Bảo Tín Mạnh Hải SJC as reference
  const marketPrice =
    prices.find((p) => p.type_code === "BTSJC") ??
    prices.find((p) => p.type_code.includes("SJC") && p.sell > 0) ??
    null;

  // Cashflow tile
  const currentMonth = new Date().getMonth() + 1;
  const cashflowNet = monthlyActual
    ? monthlyActual.actual_income - monthlyActual.actual_expense
    : null;

  return (
    <div className="flex flex-col gap-4 pb-20">
      <h1 className="text-foreground pt-2 text-3xl font-bold">TỔNG QUAN</h1>

      <HeroCard netWorth={currentAssets} goal={heroGoal} />

      <div className="grid grid-cols-2 gap-3">
        {/* Vàng tile */}
        <StatTile label="Vàng" href="/gold" accentColor="gold">
          <span className="text-foreground text-base leading-tight font-bold">
            {fmtTile(goldDisplayValue)} đ
          </span>
          <div className="flex items-center justify-between gap-2">
            {goldTotalChi > 0 && (
              <span className="text-foreground-muted text-xs font-semibold">
                {goldTotalChi} chỉ
              </span>
            )}
            {goldPnlPct !== null ? (
              <span
                className={`text-xs font-semibold ${goldPnlPct >= 0 ? "text-status-positive" : "text-status-negative"}`}
              >
                {goldPnlPct >= 0 ? "+" : ""}
                {goldPnlPct.toFixed(2)}%
              </span>
            ) : (
              goldPositions.length === 0 && (
                <span className="text-foreground-muted text-xs">
                  Chưa có tài sản
                </span>
              )
            )}
          </div>
        </StatTile>

        {/* Tiết Kiệm tile */}
        <StatTile label="Tiết kiệm" href="/savings" accentColor="blue">
          <span className="text-foreground text-base leading-tight font-bold">
            {fmtTile(savingsTotalValue)} đ
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#6B7FD7]">
              {savingsAccounts.length > 0
                ? `${savingsAccounts.length} khoản`
                : "Chưa có tài sản"}
            </span>
            {savingsTotalAccrued > 0 && (
              <span className="text-status-positive text-xs font-semibold">
                +{fmtTile(savingsTotalAccrued)} đ
              </span>
            )}
          </div>
        </StatTile>

        {/* Thu/Chi tile */}
        <StatTile label={`Thu/Chi T${currentMonth}`} href="/cashflow">
          {monthlyActual ? (
            <>
              <span className="text-status-positive text-xs font-semibold">
                ↑ {fmtTile(monthlyActual.actual_income)} đ
              </span>
              <span className="text-status-negative text-xs font-semibold">
                ↓ {fmtTile(monthlyActual.actual_expense)} đ
              </span>
              <span
                className={`text-xs font-bold ${(cashflowNet ?? 0) >= 0 ? "text-accent" : "text-status-negative"}`}
              >
                = {(cashflowNet ?? 0) >= 0 ? "+" : ""}
                {formatVND(cashflowNet ?? 0)}
              </span>
            </>
          ) : (
            <>
              <span className="text-foreground-muted text-xs">
                Chưa có dữ liệu
              </span>
              <span className="text-accent text-xs font-semibold">
                Bắt đầu nhập →
              </span>
            </>
          )}
        </StatTile>

        {/* Giá Vàng tile */}
        <StatTile label="Giá vàng BTMH" href="/market">
          {marketPrice ? (
            <div className="grid grid-cols-2 gap-2">
              {/* Mua */}
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground-muted text-xs font-semibold uppercase">
                  Mua
                </span>
                <span className="text-foreground text-sm leading-tight font-bold">
                  {fmtTile(marketPrice.buy)} đ
                </span>
                {marketPrice.change_buy !== 0 && (
                  <span
                    className={`text-xs font-semibold ${marketPrice.change_buy > 0 ? "text-status-positive" : "text-status-negative"}`}
                  >
                    {marketPrice.change_buy > 0 ? "+" : ""}
                    {(
                      (marketPrice.change_buy /
                        (marketPrice.buy - marketPrice.change_buy)) *
                      100
                    ).toFixed(2)}
                    %
                  </span>
                )}
              </div>
              {/* Bán */}
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground-muted text-xs font-semibold uppercase">
                  Bán
                </span>
                <span className="text-foreground text-sm leading-tight font-bold">
                  {fmtTile(marketPrice.sell)} đ
                </span>
                {marketPrice.change_sell !== 0 && (
                  <span
                    className={`text-xs font-semibold ${marketPrice.change_sell > 0 ? "text-status-positive" : "text-status-negative"}`}
                  >
                    {marketPrice.change_sell > 0 ? "+" : ""}
                    {(
                      (marketPrice.change_sell /
                        (marketPrice.sell - marketPrice.change_sell)) *
                      100
                    ).toFixed(2)}
                    %
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-foreground-muted text-xs">Đang tải...</span>
          )}
        </StatTile>
      </div>

      {/* Recent Transactions Section */}
      <RecentTransactions transactions={recentTxs} />
    </div>
  );
}
