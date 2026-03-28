"use client";

import { useState, useEffect } from "react";
import { TrendingDown, TrendingUp, Globe, Clock } from "lucide-react";
import { formatVND } from "@/lib/gold-utils";
import type { GoldPrice } from "@/lib/services/gold";

interface Props {
  initialPrices: GoldPrice[];
}

export function MarketClient({ initialPrices = [] }: Props) {
  const [prices, setPrices] = useState<GoldPrice[]>(initialPrices);

  useEffect(() => {
    // Refresh prices if initial was empty or just to keep it fresh
    if (prices.length === 0) {
      fetch("/api/gold/prices")
        .then((r) => r.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setPrices(json.data);
          }
        })
        .catch(() => {});
    }
  }, [prices.length]);

  const worldGold = prices.find((p) => p.type_code === "XAUUSD");
  const localPrices = prices.filter((p) => p.type_code !== "XAUUSD");

  const formatChange = (val: number) => {
    if (val === 0) return null;
    const isUp = val > 0;
    const Icon = isUp ? TrendingUp : TrendingDown;
    const color = isUp ? "text-status-positive" : "text-status-negative";
    return (
      <div
        className={`flex items-center justify-end gap-1 text-[10px] ${color} mt-0.5 font-medium`}
      >
        <Icon size={10} strokeWidth={3} />
        <span>{formatVND(Math.abs(val))}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* World Gold Card */}
      {worldGold && (
        <div className="bg-surface border-border rounded-xl border p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-accent/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Globe size={20} className="text-accent" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground truncate text-[15px] font-bold">
                  {worldGold.name}
                </span>
                <span className="text-foreground-muted text-[11px] tracking-wider uppercase">
                  {worldGold.type_code}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span className="text-foreground text-[22px] font-bold tracking-[-1px]">
                $
                {worldGold.buy.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
              {formatChange(worldGold.change_buy)}
            </div>
          </div>
        </div>
      )}

      {/* Local Markets Table */}
      <div className="bg-surface border-border overflow-visible rounded-xl border">
        <div className="flex flex-col">
          {/* Table Header */}
          <div className="bg-surface/80 border-border sticky top-0 z-10 flex items-center justify-between border-b px-5 py-3 backdrop-blur-md">
            <span className="text-foreground-muted text-[10px] font-bold tracking-[1px] uppercase">
              LOẠI VÀNG
            </span>
            <div className="flex">
              <span className="text-foreground-muted w-[90px] text-right text-[10px] font-bold tracking-[1px] uppercase">
                MUA VÀO
              </span>
              <span className="text-foreground-muted w-[90px] text-right text-[10px] font-bold tracking-[1px] uppercase">
                BÁN RA
              </span>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-border flex flex-col divide-y">
            {localPrices.length > 0 ? (
              localPrices.map((p) => (
                <div
                  key={p.type_code}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="text-foreground truncate text-[14px] font-bold">
                      {p.name}
                    </span>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Clock size={10} className="text-foreground-muted" />
                      <span className="text-foreground-muted text-[10px]">
                        {p.update_time}
                      </span>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex w-[90px] flex-col items-end">
                      <span className="text-foreground text-[13px] font-bold">
                        {p.buy > 0 ? formatVND(p.buy) : "-"}
                      </span>
                      {formatChange(p.change_buy)}
                    </div>
                    <div className="ml-2 flex w-[90px] flex-col items-end">
                      <span className="text-foreground text-[13px] font-bold">
                        {p.sell > 0 ? formatVND(p.sell) : "-"}
                      </span>
                      {formatChange(p.change_sell)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-32 items-center justify-center">
                <span className="text-foreground-muted text-[13px]">
                  Đang tải dữ liệu...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pb-8 text-center">
        <p className="text-foreground-muted text-[11px] italic">
          Đơn vị: VND/Lượng | Giá vàng TG: USD/Ounce
        </p>
      </div>
    </div>
  );
}
