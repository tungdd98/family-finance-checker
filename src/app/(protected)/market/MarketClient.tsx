"use client";

import { useState, useCallback } from "react";
import {
  TrendingDown,
  TrendingUp,
  Globe,
  Clock,
  RefreshCw,
} from "lucide-react";
import { formatVND } from "@/lib/gold-utils";
import type { GoldPrice } from "@/lib/services/gold";
import type { CoinPrice } from "@/lib/services/coin";
import { MarketTabs } from "./components/MarketTabs";
import { CoinList } from "./components/CoinList";

interface Props {
  initialPrices: GoldPrice[];
}

export function MarketClient({ initialPrices = [] }: Props) {
  const [prices, setPrices] = useState<GoldPrice[]>(initialPrices);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"gold" | "coin">("gold");
  const [coinPrices, setCoinPrices] = useState<CoinPrice[]>([]);
  const [coinLoaded, setCoinLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCoinPrices = useCallback(async () => {
    const r = await fetch("/api/coin/prices");
    const json = await r.json();
    if (json.success && Array.isArray(json.data)) {
      setCoinPrices(json.data);
      setLastUpdated(new Date());
    }
    setCoinLoaded(true);
  }, []);

  const handleTabChange = useCallback(
    async (tab: "gold" | "coin") => {
      setActiveTab(tab);
      if (tab === "coin" && !coinLoaded && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await fetchCoinPrices();
        } catch {
          setCoinLoaded(true);
        } finally {
          setIsRefreshing(false);
        }
      }
    },
    [coinLoaded, fetchCoinPrices, isRefreshing]
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === "gold") {
        const r = await fetch("/api/gold/prices");
        const json = await r.json();
        if (json.success && Array.isArray(json.data)) {
          setPrices(json.data);
          setLastUpdated(new Date());
        }
      } else {
        await fetchCoinPrices();
      }
    } catch {
      // silent failure — existing data remains
    } finally {
      setIsRefreshing(false);
    }
  }, [activeTab, fetchCoinPrices]);

  const worldGold = prices.find((p) => p.type_code === "XAUUSD");
  const localPrices = prices.filter((p) => p.type_code !== "XAUUSD");

  const formatChange = (val: number, currency: "VND" | "USD" = "VND") => {
    if (val === 0) return null;
    const isUp = val > 0;
    const Icon = isUp ? TrendingUp : TrendingDown;
    const color = isUp ? "text-status-positive" : "text-status-negative";
    const formatted =
      currency === "USD"
        ? `$${Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
        : formatVND(Math.abs(val));
    return (
      <div
        className={`flex items-center justify-end gap-1 text-[10px] ${color} mt-0.5 font-medium`}
      >
        <Icon size={10} strokeWidth={3} />
        <span>{formatted}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-foreground text-[28px] font-bold tracking-[-1px] uppercase">
            THỊ TRƯỜNG
          </h1>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="shrink-0 disabled:cursor-not-allowed"
            aria-label="Làm mới"
          >
            <RefreshCw
              size={14}
              className={`text-foreground-muted ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        <p className="text-foreground-muted text-[13px]">
          Giá vàng & tiền điện tử trực tuyến
        </p>
        {lastUpdated && (
          <span className="text-foreground-muted text-[10px] opacity-60">
            {`Cập nhật lúc ${lastUpdated.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}`}
          </span>
        )}
      </div>

      {/* Tab Switcher */}
      <MarketTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content — dimmed while refreshing */}
      <div
        className={`flex flex-col gap-6 transition-opacity duration-200 ${
          isRefreshing ? "pointer-events-none opacity-40" : ""
        }`}
      >
        {activeTab === "gold" ? (
          <>
            {/* World Gold Card */}
            {worldGold && (
              <div className="bg-surface border-border border p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-accent/10 flex h-10 w-10 shrink-0 items-center justify-center">
                      <Globe size={20} className="text-accent" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-foreground truncate text-[15px] font-bold">
                        {worldGold.name}
                      </span>
                      <span className="text-foreground-muted text-[11px] font-semibold tracking-wider uppercase">
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
                    <div className="h-4">
                      {formatChange(worldGold.change_buy, "USD")}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Local Markets Table */}
            <div className="bg-surface border-border border">
              <div className="flex flex-col">
                <div className="bg-surface/90 border-border sticky top-0 z-10 flex items-center justify-between border-b px-5 py-3 backdrop-blur-md">
                  <span className="text-foreground-muted text-[10px] font-bold tracking-[1.5px] uppercase">
                    LOẠI VÀNG
                  </span>
                  <div className="flex items-center">
                    <span className="text-foreground-muted w-[100px] text-right text-[10px] font-bold tracking-[1.5px] uppercase">
                      MUA VÀO
                    </span>
                    <span className="text-foreground-muted w-[100px] text-right text-[10px] font-bold tracking-[1.5px] uppercase">
                      BÁN RA
                    </span>
                  </div>
                </div>
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
                          <div className="mt-1 flex items-center gap-1.5">
                            <Clock
                              size={10}
                              className="text-foreground-muted"
                            />
                            <span className="text-foreground-muted text-[10px]">
                              {p.update_time}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex w-[100px] flex-col items-end">
                            <span className="text-foreground text-[13px] font-bold">
                              {p.buy > 0 ? formatVND(p.buy) : "—"}
                            </span>
                            <div className="h-4">
                              {formatChange(p.change_buy)}
                            </div>
                          </div>
                          <div className="flex w-[100px] flex-col items-end">
                            <span className="text-foreground text-[13px] font-bold">
                              {p.sell > 0 ? formatVND(p.sell) : "—"}
                            </span>
                            <div className="h-4">
                              {formatChange(p.change_sell)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-32 items-center justify-center">
                      <span className="text-foreground-muted animate-pulse text-[13px] font-medium">
                        Đang tải dữ liệu...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <CoinList
            coins={coinPrices}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={!coinLoaded && isRefreshing}
          />
        )}
      </div>

      <div className="pb-8 text-center">
        <p className="text-foreground-muted text-[10px] font-medium tracking-wide uppercase opacity-70">
          {activeTab === "gold"
            ? "Đơn vị: VND/Lượng | Giá vàng TG: USD/Ounce"
            : "Nguồn: CoinGecko | Đơn vị: USD"}
        </p>
      </div>
    </div>
  );
}
