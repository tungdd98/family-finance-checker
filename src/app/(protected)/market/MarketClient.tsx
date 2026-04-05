"use client";

import { useState, useCallback, useEffect } from "react";
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setLastUpdated(new Date());
  }, []);

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
        className={`flex items-center justify-end gap-1 text-xs ${color} mt-0.5 font-medium`}
      >
        <Icon size={10} strokeWidth={3} />
        <span>{formatted}</span>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-foreground pt-2 text-3xl font-bold uppercase">
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
        <p className="text-foreground-muted text-sm">
          Giá vàng & tiền điện tử trực tuyến
        </p>
        {isMounted && lastUpdated && (
          <span className="text-foreground-muted text-xs opacity-60">
            {`Cập nhật lúc ${lastUpdated.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}`}
          </span>
        )}
      </div>

      {/* Tab Switcher */}
      <MarketTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content — fills remaining height, dimmed while refreshing */}
      <div
        className={`mt-6 flex flex-1 flex-col overflow-hidden transition-opacity duration-200 ${
          isRefreshing ? "pointer-events-none opacity-40" : ""
        }`}
      >
        {activeTab === "gold" ? (
          <div className="flex h-full flex-col gap-6">
            {/* World Gold Card — fixed */}
            {worldGold && (
              <div className="bg-surface border-border shrink-0 border p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-accent/10 flex h-10 w-10 shrink-0 items-center justify-center">
                      <Globe size={20} className="text-accent" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-foreground truncate text-base font-bold">
                        {worldGold.name}
                      </span>
                      <span className="text-foreground-muted text-xs font-semibold uppercase">
                        {worldGold.type_code}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="text-foreground text-2xl font-bold">
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

            {/* Local Markets Table — scrollable */}
            <div className="border-border bg-surface flex flex-1 flex-col overflow-hidden border">
              <div className="border-border flex shrink-0 items-center justify-between border-b px-5 py-3">
                <span className="text-foreground-muted text-xs font-bold uppercase">
                  LOẠI VÀNG
                </span>
                <div className="flex items-center">
                  <span className="text-foreground-muted w-30 text-right text-xs font-bold uppercase">
                    MUA VÀO
                  </span>
                  <span className="text-foreground-muted w-30 text-right text-xs font-bold uppercase">
                    BÁN RA
                  </span>
                </div>
              </div>
              <div className="divide-border flex flex-1 flex-col divide-y overflow-y-auto">
                {localPrices.length > 0 ? (
                  localPrices.map((p) => (
                    <div
                      key={p.type_code}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="text-foreground truncate text-sm font-bold">
                          {p.name}
                        </span>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Clock size={10} className="text-foreground-muted" />
                          <span className="text-foreground-muted text-xs">
                            {p.update_time}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex w-30 flex-col items-end">
                          <span className="text-foreground text-sm font-bold">
                            {p.buy > 0 ? formatVND(p.buy) : "—"}
                          </span>
                          <div className="h-4">
                            {formatChange(p.change_buy)}
                          </div>
                        </div>
                        <div className="flex w-30 flex-col items-end">
                          <span className="text-foreground text-sm font-bold">
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
                    <span className="text-foreground-muted animate-pulse text-sm font-medium">
                      Đang tải dữ liệu...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <CoinList
            coins={coinPrices}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={!coinLoaded && isRefreshing}
          />
        )}
      </div>
    </div>
  );
}
