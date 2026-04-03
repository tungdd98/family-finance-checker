# Market Coin Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mở rộng trang Thị trường để hiển thị cả giá vàng và top 10 coin theo market cap từ CoinGecko, dùng tab switcher client-side trong MarketClient.

**Architecture:** `page.tsx` (RSC) vẫn chỉ fetch gold SSR. Coin prices được fetch lazy client-side khi user chuyển sang tab Coin lần đầu. Proxy route `/api/coin/prices` gọi CoinGecko Demo API và cache 60 giây. `MarketClient.tsx` quản lý toàn bộ tab state, coin state, và search query.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Vitest, CoinGecko Demo API (`https://api.coingecko.com/api/v3`), lucide-react

---

## File Map

| File                                                   | Action | Responsibility                                       |
| ------------------------------------------------------ | ------ | ---------------------------------------------------- |
| `next.config.ts`                                       | Modify | Add CoinGecko image domain to `remotePatterns`       |
| `.env.local`                                           | Modify | Add `COINGECKO_API_KEY`                              |
| `src/lib/services/coin.ts`                             | Create | `CoinPrice` type + `getExternalCoinPrices()`         |
| `src/app/api/coin/prices/route.ts`                     | Create | Proxy route → CoinGecko, cache 60s                   |
| `src/lib/coin-utils.ts`                                | Create | `formatCoinPrice()` + `filterCoins()` pure utilities |
| `src/lib/__tests__/coin-utils.test.ts`                 | Create | Unit tests cho coin-utils                            |
| `src/app/(protected)/market/components/MarketTabs.tsx` | Create | Tab switcher UI (Vàng / Coin)                        |
| `src/app/(protected)/market/components/CoinRow.tsx`    | Create | Một row coin: logo, tên, giá, % 24h                  |
| `src/app/(protected)/market/components/CoinList.tsx`   | Create | Search bar + danh sách coin                          |
| `src/app/(protected)/market/MarketClient.tsx`          | Modify | Thêm tab state, coin fetch, search logic             |

---

## Task 1: Add CoinGecko API key to environment + image domain to next.config.ts

**Files:**

- Modify: `next.config.ts`
- Modify: `.env.local`

- [ ] **Step 1: Add `COINGECKO_API_KEY` to `.env.local`**

Open `.env.local` và thêm vào cuối file:

```
COINGECKO_API_KEY=<paste_your_demo_api_key_here>
```

- [ ] **Step 2: Add CoinGecko image domain to `next.config.ts`**

Replace toàn bộ nội dung `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: allow CoinGecko image domain in Next.js config"
```

> **Lưu ý:** Không commit `.env.local` — nó đã có trong `.gitignore`.

---

## Task 2: Create coin service

**Files:**

- Create: `src/lib/services/coin.ts`

- [ ] **Step 1: Create `src/lib/services/coin.ts`**

```ts
export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export async function getExternalCoinPrices(): Promise<CoinPrice[]> {
  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false",
      {
        headers: apiKey ? { "x-cg-demo-api-key": apiKey } : {},
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data as CoinPrice[]).map((item) => ({
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      image: item.image,
      current_price: item.current_price,
      price_change_percentage_24h: item.price_change_percentage_24h ?? 0,
    }));
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/coin.ts
git commit -m "feat: add CoinGecko coin price service"
```

---

## Task 3: Create API proxy route for coin prices

**Files:**

- Create: `src/app/api/coin/prices/route.ts`

- [ ] **Step 1: Create directory và file**

```bash
mkdir -p src/app/api/coin/prices
```

- [ ] **Step 2: Create `src/app/api/coin/prices/route.ts`**

```ts
import { getExternalCoinPrices } from "@/lib/services/coin";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getExternalCoinPrices();
  return Response.json({ success: true, data });
}
```

- [ ] **Step 3: Verify API route works**

Chạy dev server (`npm run dev`) và mở `http://localhost:3000/api/coin/prices` trong browser. Expected: JSON response với `{ success: true, data: [...10 coins...] }`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/coin/prices/route.ts
git commit -m "feat: add /api/coin/prices proxy route to CoinGecko"
```

---

## Task 4: Create coin utility functions and tests

**Files:**

- Create: `src/lib/coin-utils.ts`
- Create: `src/lib/__tests__/coin-utils.test.ts`

- [ ] **Step 1: Write failing tests first**

Create `src/lib/__tests__/coin-utils.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatCoinPrice, filterCoins } from "@/lib/coin-utils";
import type { CoinPrice } from "@/lib/services/coin";

describe("formatCoinPrice", () => {
  it("formats large price with 2 decimal places and thousands separator", () => {
    expect(formatCoinPrice(94250)).toBe("$94,250.00");
  });
  it("formats price between 0.01 and 1 with 4 decimal places", () => {
    expect(formatCoinPrice(0.45)).toBe("$0.4500");
  });
  it("formats very small price with 6 decimal places", () => {
    expect(formatCoinPrice(0.000045)).toBe("$0.000045");
  });
  it("formats exactly 1 with 2 decimal places", () => {
    expect(formatCoinPrice(1)).toBe("$1.00");
  });
});

const mockCoins: CoinPrice[] = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "",
    current_price: 94250,
    price_change_percentage_24h: 2.3,
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "",
    current_price: 3200,
    price_change_percentage_24h: -1.2,
  },
  {
    id: "solana",
    symbol: "sol",
    name: "Solana",
    image: "",
    current_price: 150,
    price_change_percentage_24h: 5.1,
  },
];

describe("filterCoins", () => {
  it("returns all coins for empty query", () => {
    expect(filterCoins(mockCoins, "")).toHaveLength(3);
  });
  it("filters by name case-insensitively", () => {
    expect(filterCoins(mockCoins, "bitcoin")).toHaveLength(1);
    expect(filterCoins(mockCoins, "BITCOIN")).toHaveLength(1);
  });
  it("filters by symbol", () => {
    expect(filterCoins(mockCoins, "eth")).toHaveLength(1);
    expect(filterCoins(mockCoins, "ETH")).toHaveLength(1);
  });
  it("returns empty array when no match", () => {
    expect(filterCoins(mockCoins, "xyz")).toHaveLength(0);
  });
  it("trims whitespace from query", () => {
    expect(filterCoins(mockCoins, "  btc  ")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- coin-utils
```

Expected: FAIL với "Cannot find module '@/lib/coin-utils'"

- [ ] **Step 3: Create `src/lib/coin-utils.ts`**

```ts
import type { CoinPrice } from "@/lib/services/coin";

export function formatCoinPrice(price: number): string {
  if (price >= 1) {
    return (
      "$" +
      price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  if (price >= 0.01) {
    return "$" + price.toFixed(4);
  }
  return "$" + price.toFixed(6);
}

export function filterCoins(coins: CoinPrice[], query: string): CoinPrice[] {
  const q = query.trim().toLowerCase();
  if (!q) return coins;
  return coins.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- coin-utils
```

Expected: PASS — 9 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/coin-utils.ts src/lib/__tests__/coin-utils.test.ts
git commit -m "feat: add coin utility functions with tests"
```

---

## Task 5: Create MarketTabs component

**Files:**

- Create: `src/app/(protected)/market/components/MarketTabs.tsx`

- [ ] **Step 1: Create components directory và file**

```bash
mkdir -p src/app/(protected)/market/components
```

- [ ] **Step 2: Create `src/app/(protected)/market/components/MarketTabs.tsx`**

```tsx
interface Props {
  activeTab: "gold" | "coin";
  onTabChange: (tab: "gold" | "coin") => void;
}

export function MarketTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="border-border flex border-b">
      {(["gold", "coin"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2.5 text-[13px] font-bold tracking-wider uppercase transition-colors ${
            activeTab === tab
              ? "border-accent text-foreground border-b-2"
              : "text-foreground-muted"
          }`}
        >
          {tab === "gold" ? "Vàng" : "Coin"}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/market/components/MarketTabs.tsx
git commit -m "feat: add MarketTabs tab switcher component"
```

---

## Task 6: Create CoinRow component

**Files:**

- Create: `src/app/(protected)/market/components/CoinRow.tsx`

- [ ] **Step 1: Create `src/app/(protected)/market/components/CoinRow.tsx`**

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { CoinPrice } from "@/lib/services/coin";
import { formatCoinPrice } from "@/lib/coin-utils";

interface Props {
  coin: CoinPrice;
}

export function CoinRow({ coin }: Props) {
  const [imgError, setImgError] = useState(false);
  const isUp = coin.price_change_percentage_24h >= 0;
  const changeColor = isUp ? "text-status-positive" : "text-status-negative";
  const ChangeIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="bg-surface border-border relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border">
          {imgError ? (
            <span className="text-foreground-muted text-[10px] font-bold uppercase">
              {coin.symbol.slice(0, 2)}
            </span>
          ) : (
            <Image
              src={coin.image}
              alt={coin.name}
              fill
              sizes="32px"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-foreground text-[14px] font-bold">
            {coin.name}
          </span>
          <span className="text-foreground-muted text-[11px] font-semibold uppercase">
            {coin.symbol}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-foreground text-[15px] font-bold">
          {formatCoinPrice(coin.current_price)}
        </span>
        <div
          className={`mt-0.5 flex items-center gap-1 text-[11px] font-medium ${changeColor}`}
        >
          <ChangeIcon size={10} strokeWidth={3} />
          <span>{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/market/components/CoinRow.tsx
git commit -m "feat: add CoinRow component"
```

---

## Task 7: Create CoinList component

**Files:**

- Create: `src/app/(protected)/market/components/CoinList.tsx`

- [ ] **Step 1: Create `src/app/(protected)/market/components/CoinList.tsx`**

```tsx
import type { CoinPrice } from "@/lib/services/coin";
import { filterCoins } from "@/lib/coin-utils";
import { CoinRow } from "./CoinRow";

interface Props {
  coins: CoinPrice[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
}

export function CoinList({
  coins,
  searchQuery,
  onSearchChange,
  isLoading,
}: Props) {
  const filtered = filterCoins(coins, searchQuery);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Tìm theo tên hoặc ký hiệu..."
        className="border-border bg-surface text-foreground placeholder:text-foreground-muted w-full border px-4 py-2.5 text-[13px] outline-none"
      />
      <div className="border-border bg-surface border">
        {isLoading ? (
          <div className="divide-border flex flex-col divide-y">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="border-border bg-border h-8 w-8 animate-pulse rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <div className="border-border bg-border h-3.5 w-24 animate-pulse" />
                    <div className="border-border bg-border h-3 w-12 animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="border-border bg-border h-3.5 w-20 animate-pulse" />
                  <div className="border-border bg-border h-3 w-12 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="divide-border flex flex-col divide-y">
            {filtered.map((coin) => (
              <CoinRow key={coin.id} coin={coin} />
            ))}
          </div>
        ) : coins.length > 0 ? (
          <div className="flex h-32 items-center justify-center">
            <span className="text-foreground-muted text-[13px] font-medium">
              Không tìm thấy coin
            </span>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center">
            <span className="text-foreground-muted text-[13px] font-medium">
              Không có dữ liệu
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/market/components/CoinList.tsx
git commit -m "feat: add CoinList component with search and skeleton loading"
```

---

## Task 8: Update MarketClient with tabs and coin logic

**Files:**

- Modify: `src/app/(protected)/market/MarketClient.tsx`

- [ ] **Step 1: Replace full content of `src/app/(protected)/market/MarketClient.tsx`**

```tsx
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
      if (tab === "coin" && !coinLoaded) {
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
    [coinLoaded, fetchCoinPrices]
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
```

- [ ] **Step 2: Run all tests to confirm nothing broken**

```bash
npm test
```

Expected: All existing tests (gold-utils, goals-utils) plus new coin-utils tests pass.

- [ ] **Step 3: Start dev server and verify manually**

```bash
npm run dev
```

Kiểm tra:

1. Mở `/market` — tab Vàng hiện đúng như trước
2. Bấm tab Coin — skeleton loading xuất hiện, rồi top 10 coins load
3. Gõ "btc" vào search — chỉ hiện Bitcoin
4. Bấm nút refresh trên tab Coin — data reload
5. Chuyển lại tab Vàng, bấm refresh — vàng reload
6. Chuyển sang Coin lại — data đã cached (không fetch lại)

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/market/MarketClient.tsx
git commit -m "feat: add coin tab to Market page with lazy fetch and search"
```
