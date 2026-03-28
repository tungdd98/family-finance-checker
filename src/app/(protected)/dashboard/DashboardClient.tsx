// src/app/(protected)/dashboard/DashboardClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";
import { PortfolioChart } from "./components/PortfolioChart";
import { calcPnl, formatVND, formatPct, CHI_PER_LUONG } from "@/lib/gold-utils";
import {
  type SavingsAccount,
  calcAccruedInterest,
} from "@/lib/services/savings";

interface Props {
  goldPositions: GoldAsset[];
  initialPrices: GoldPrice[];
  savingsAccounts: SavingsAccount[];
}

export function DashboardClient({
  goldPositions,
  initialPrices = [],
  savingsAccounts,
}: Props) {
  const [prices, setPrices] = useState<GoldPrice[]>(initialPrices);

  useEffect(() => {
    // Fallback in case server-side fetch failed or returned empty
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

  const goldTotalPnl = goldTotalValue - goldTotalCapital;
  const goldTotalPnlPct =
    goldTotalCapital > 0 ? (goldTotalPnl / goldTotalCapital) * 100 : 0;
  const hasGoldPrices = goldTotalValue > 0;

  const trackedBrands = [
    ...new Map(
      goldPositions.map((p) => [p.brand_code, p.brand_name])
    ).entries(),
  ]
    .map(([code, name]) => ({ code, name, price: priceMap.get(code) }))
    .filter((b) => b.price !== undefined);

  // Savings math
  const savingsTotalPrincipal = savingsAccounts.reduce(
    (s: number, a: SavingsAccount) => s + a.principal,
    0
  );
  const savingsTotalAccrued = savingsAccounts.reduce(
    (s: number, a: SavingsAccount) => s + calcAccruedInterest(a),
    0
  );
  const savingsTotalValue = savingsTotalPrincipal + savingsTotalAccrued;

  const portfolioData = [
    { name: "TÀI SẢN VÀNG", value: goldTotalValue, color: "var(--accent)" },
    { name: "TIẾT KIỆM", value: savingsTotalValue, color: "#4f46e5" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-foreground pt-2 text-[28px] font-bold tracking-[-1px]">
        TỔNG QUAN
      </h1>

      {/* Portfolio Allocation Chart */}
      {(goldTotalValue > 0 || savingsTotalValue > 0) && (
        <div className="bg-surface border-border border p-5">
          <p className="text-foreground-muted pb-4 text-[11px] font-semibold tracking-[1.5px] uppercase">
            PHÂN BỔ TÀI SẢN
          </p>
          <PortfolioChart data={portfolioData} />
        </div>
      )}

      {/* Savings asset card */}
      <div className="bg-surface border-border overflow-visible border p-4">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-accent h-3.5 w-0.75 shrink-0" />
            <span className="text-foreground-secondary text-[11px] font-semibold tracking-[1.5px] uppercase">
              TIẾT KIỆM NGÂN HÀNG
            </span>
          </div>
          <Link
            href="/savings"
            className="text-foreground-muted flex items-center gap-1"
          >
            <ChevronRight size={14} />
          </Link>
        </div>

        {savingsAccounts.length === 0 ? (
          <p className="text-foreground-muted pt-4 text-[13px]">
            Chưa có tài sản tiết kiệm
          </p>
        ) : (
          <div className="flex flex-col gap-1 pt-3">
            <p className="text-foreground text-[24px] font-bold tracking-[-1px]">
              {formatVND(savingsTotalValue)}
            </p>
            <p className="text-foreground-secondary text-[12px]">
              Vốn: {formatVND(savingsTotalPrincipal)}
            </p>
            <p className="text-status-positive text-[12px] font-semibold">
              +{formatVND(savingsTotalAccrued)} (Lãi tích lũy)
            </p>
            <p className="text-foreground-muted pt-1 text-[11px]">
              {savingsAccounts.length} khoản tiết kiệm
            </p>
          </div>
        )}
      </div>

      {/* Gold asset card */}
      <div className="bg-surface border-border overflow-visible border p-4">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-accent h-3.5 w-0.75 shrink-0" />
            <span className="text-foreground-secondary text-[11px] font-semibold tracking-[1.5px]">
              TÀI SẢN VÀNG
            </span>
          </div>
          <Link
            href="/gold"
            className="text-foreground-muted flex items-center gap-1"
          >
            <ChevronRight size={14} />
          </Link>
        </div>

        {goldPositions.length === 0 ? (
          <p className="text-foreground-muted text-[13px]">
            Chưa có tài sản vàng
          </p>
        ) : (
          <>
            {/* Total value */}
            <div className="flex flex-col gap-1 pt-3">
              <p className="text-foreground text-[24px] font-bold tracking-[-1px]">
                {hasGoldPrices ? formatVND(goldTotalValue) : "—"}
              </p>
              <p className="text-foreground-secondary text-[12px]">
                Vốn: {formatVND(goldTotalCapital)}
              </p>
              {hasGoldPrices && (
                <p
                  className={`text-[12px] font-semibold ${
                    goldTotalPnl >= 0
                      ? "text-status-positive"
                      : "text-status-negative"
                  }`}
                >
                  {goldTotalPnl >= 0 ? "+" : ""}
                  {formatVND(goldTotalPnl)} ({formatPct(goldTotalPnlPct)})
                </p>
              )}
            </div>

            {/* Tracked prices */}
            {trackedBrands.length > 0 && (
              <div className="flex flex-col gap-0 pt-5">
                <div className="flex items-center gap-3 pb-2">
                  <div className="bg-accent h-3.5 w-0.75 shrink-0" />
                  <span className="text-foreground-secondary text-[11px] font-semibold tracking-[1.5px]">
                    VÀNG ĐANG THEO DÕI
                  </span>
                </div>
                <div className="flex flex-col">
                  {/* Header row */}
                  <div className="bg-surface/80 border-border sticky top-0 z-10 flex items-center justify-between border-b py-2 backdrop-blur-md">
                    <span className="text-foreground-muted items-center px-1 text-[10px] tracking-[1px] uppercase">
                      THƯƠNG HIỆU
                    </span>
                    <div className="flex">
                      <span className="text-foreground-muted w-[90px] text-right text-[10px] tracking-[1px] uppercase">
                        MUA VÀO
                      </span>
                      <span className="text-foreground-muted w-[90px] text-right text-[10px] tracking-[1px] uppercase">
                        BÁN RA
                      </span>
                    </div>
                  </div>
                  {trackedBrands.map(({ code, name, price }) => (
                    <div
                      key={code}
                      className="border-border flex items-center justify-between border-b py-2.5 last:border-b-0"
                    >
                      <span className="text-foreground text-[12px] font-medium">
                        {name}
                      </span>
                      <div className="flex">
                        <span className="text-status-positive w-[90px] text-right text-[12px] font-semibold">
                          {new Intl.NumberFormat("vi-VN").format(price!.buy)}
                        </span>
                        <span className="text-status-negative w-[90px] text-right text-[12px] font-semibold">
                          {new Intl.NumberFormat("vi-VN").format(price!.sell)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-foreground-muted pt-2 text-[10px]">
                    Đơn vị: VND/Lượng
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
