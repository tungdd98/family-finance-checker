# Market Refresh Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual refresh button to the Thị Trường page header that refetches gold prices client-side and shows a live timestamp on success.

**Architecture:** Move the page header (title + description) from the Server Component into `MarketClient` so refresh state can control both the button and the dimmed data list without prop-drilling across a Server/Client boundary. `page.tsx` becomes a thin fetch wrapper. The refresh handler calls the existing `/api/gold/prices` endpoint.

**Tech Stack:** Next.js App Router, React `useState`, lucide-react (`RefreshCw`), Tailwind CSS

---

### Task 1: Move header into `MarketClient` and add refresh state + button

**Files:**

- Modify: `src/app/(protected)/market/MarketClient.tsx`

- [ ] **Step 1: Add `isRefreshing` and `lastUpdated` state + refresh handler**

Replace the top of `MarketClient.tsx` (the imports and component opening) with:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingDown, TrendingUp, Globe, Clock, RefreshCw } from "lucide-react";
import { formatVND } from "@/lib/gold-utils";
import type { GoldPrice } from "@/lib/services/gold";

interface Props {
  initialPrices: GoldPrice[];
}

export function MarketClient({ initialPrices = [] }: Props) {
  const [prices, setPrices] = useState<GoldPrice[]>(initialPrices);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const r = await fetch("/api/gold/prices");
      const json = await r.json();
      if (json.success && Array.isArray(json.data)) {
        setPrices(json.data);
        setLastUpdated(new Date());
      }
    } catch {
      // silent failure — existing prices remain
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
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
```

- [ ] **Step 2: Add header row with refresh button inside the return statement**

Replace the opening `<div className="flex flex-col gap-6 px-1">` and everything before the World Gold Card with:

```tsx
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
    <div className="flex flex-col gap-6 px-1">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-[28px] font-bold tracking-[-1px] uppercase">
            THỊ TRƯỜNG VÀNG
          </h1>
          <p className="text-foreground-muted text-[13px]">
            Giá vàng trực tuyến từ các thương hiệu hàng đầu
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 pt-1 disabled:cursor-not-allowed"
          aria-label="Làm mới giá vàng"
        >
          <RefreshCw
            size={14}
            className={`text-foreground-muted ${isRefreshing ? "animate-spin" : ""}`}
          />
          {lastUpdated && (
            <span className="text-foreground-muted text-[10px]">
              {lastUpdated.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </button>
      </div>
```

- [ ] **Step 3: Apply dimming to data sections during refresh**

Wrap the World Gold Card and Local Markets Table in a shared div with opacity. The full return statement from the header row onwards should look like this:

```tsx
  return (
    <div className="flex flex-col gap-6 px-1">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-[28px] font-bold tracking-[-1px] uppercase">
            THỊ TRƯỜNG VÀNG
          </h1>
          <p className="text-foreground-muted text-[13px]">
            Giá vàng trực tuyến từ các thương hiệu hàng đầu
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 pt-1 disabled:cursor-not-allowed"
          aria-label="Làm mới giá vàng"
        >
          <RefreshCw
            size={14}
            className={`text-foreground-muted ${isRefreshing ? "animate-spin" : ""}`}
          />
          {lastUpdated && (
            <span className="text-foreground-muted text-[10px]">
              {lastUpdated.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </button>
      </div>

      {/* Data sections — dimmed while refreshing */}
      <div
        className={`flex flex-col gap-6 transition-opacity duration-200 ${
          isRefreshing ? "pointer-events-none opacity-40" : ""
        }`}
      >
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
                <div className="h-4">{formatChange(worldGold.change_buy, "USD")}</div>
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
                        <Clock size={10} className="text-foreground-muted" />
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
                        <div className="h-4">{formatChange(p.change_buy)}</div>
                      </div>
                      <div className="flex w-[100px] flex-col items-end">
                        <span className="text-foreground text-[13px] font-bold">
                          {p.sell > 0 ? formatVND(p.sell) : "—"}
                        </span>
                        <div className="h-4">{formatChange(p.change_sell)}</div>
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
      </div>

      <div className="pb-8 text-center">
        <p className="text-foreground-muted text-[10px] font-medium tracking-wide uppercase opacity-70">
          Đơn vị: VND/Lượng | Giá vàng TG: USD/Ounce
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the full file compiles — run type check**

```bash
npx tsc --noEmit
```

Expected: no errors

---

### Task 2: Simplify `page.tsx` — remove header, delegate to `MarketClient`

**Files:**

- Modify: `src/app/(protected)/market/page.tsx`

- [ ] **Step 1: Replace entire file content**

```tsx
import { getExternalGoldPrices } from "@/lib/services/gold";
import { MarketClient } from "./MarketClient";

export default async function MarketPage() {
  const prices = await getExternalGoldPrices();
  return <MarketClient initialPrices={prices} />;
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Start dev server and manually verify**

```bash
npm run dev
```

Open `http://localhost:3000/market` and verify:

1. Title "THỊ TRƯỜNG VÀNG" renders as before
2. Refresh icon (`↻`) appears top-right of header
3. No timestamp shown before first manual refresh
4. Tap refresh → icon spins, list fades to ~40% opacity
5. After fetch completes → list returns to full opacity, timestamp appears ("Cập nhật lúc HH:mm")
6. Tapping refresh while refreshing does nothing (button disabled)

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/market/page.tsx src/app/\(protected\)/market/MarketClient.tsx
git commit -m "feat(market): add manual refresh button with timestamp to market page"
```
