# Market Page — Coin Integration Design

**Date:** 2026-04-03
**Status:** Approved

## Overview

Mở rộng trang Thị trường để hiển thị cả giá vàng và giá coin (top 10 theo market cap) thông qua CoinGecko Demo API. Dùng tab switcher client-side trong `MarketClient` — không thêm route mới, không tách component thành nhiều page.

---

## 1. Architecture & Data Flow

### page.tsx (RSC)

Giữ nguyên — chỉ fetch gold prices SSR và pass `initialPrices` vào `MarketClient`. Coin prices **không** fetch SSR để tránh làm chậm page load khi user vào tab Vàng.

### Coin fetch strategy

- Lazy load: chỉ fetch khi user chuyển sang tab Coin lần đầu (`!coinLoaded`)
- Sau lần đầu: data được giữ trong state, không fetch lại khi chuyển tab qua lại
- Refresh button: fetch lại đúng API theo tab đang active

### API proxy — `GET /api/coin/prices`

- Gọi CoinGecko: `GET https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`
- Auth header: `x-cg-demo-api-key: <COINGECKO_API_KEY>`
- Cache: 60 giây (`Cache-Control: s-maxage=60`)
- Response contract: `{ success: boolean, data: CoinPrice[] }`

### CoinPrice type

```ts
type CoinPrice = {
  id: string; // "bitcoin"
  symbol: string; // "btc"
  name: string; // "Bitcoin"
  image: string; // logo URL từ CoinGecko
  current_price: number; // USD
  price_change_percentage_24h: number; // % thay đổi 24h
};
```

### State trong MarketClient

| State          | Type               | Mục đích                |
| -------------- | ------------------ | ----------------------- |
| `activeTab`    | `'gold' \| 'coin'` | Tab đang hiện           |
| `coinPrices`   | `CoinPrice[]`      | Data coin               |
| `coinLoaded`   | `boolean`          | Đã fetch lần đầu chưa   |
| `searchQuery`  | `string`           | Filter coin client-side |
| `isRefreshing` | `boolean`          | Chung cho cả 2 tab      |
| `lastUpdated`  | `Date \| null`     | Timestamp chung         |

### Refresh logic

- `activeTab === 'gold'` → fetch `/api/gold/prices`
- `activeTab === 'coin'` → fetch `/api/coin/prices`
- Cả hai: `isRefreshing = true` → dim + spin → set data + `lastUpdated` → `isRefreshing = false`

---

## 2. UI / Visual Design

### Header

- Tiêu đề: "THỊ TRƯỜNG" (bỏ "VÀNG")
- Subtitle: "Giá vàng & tiền điện tử trực tuyến"
- Refresh button + timestamp: giữ nguyên vị trí (top-right)

### Tab switcher

Nằm ngay dưới header, kiểu underline:

- Tab active: `border-b-2 border-accent text-foreground font-bold`
- Tab inactive: `text-foreground-muted`

### Tab Vàng

Giữ nguyên 100% layout hiện tại (World Gold card + bảng local prices).

### Tab Coin

**Search bar:** Ô input nhỏ phía trên danh sách, lọc theo `name` hoặc `symbol`, client-side (không gọi thêm API).

**Coin row layout:**

```
[Logo 32px]  Bitcoin           $94,250.00
             BTC               ▲ 2.34%
```

- Logo: `<Image>` Next.js từ `coin.image` (32×32, rounded)
- Tên: `text-[14px] font-bold`
- Symbol: `text-[11px] text-foreground-muted uppercase`
- Giá: `text-[15px] font-bold` align-right
- % 24h: `text-[11px]`, màu `text-status-positive` hoặc `text-status-negative`, kèm `TrendingUp`/`TrendingDown` icon (size 10)

**Loading state:** Skeleton rows (3 items) khi `!coinLoaded && isRefreshing`. Không dùng text "Đang tải...".

**Empty search result:** Text "Không tìm thấy coin" centered.

---

## 3. Component Structure

```
src/
  app/
    (protected)/
      market/
        page.tsx                    ← giữ nguyên
        MarketClient.tsx            ← thêm tab state, coin fetch, search logic
        components/
          MarketTabs.tsx            ← tab switcher UI
          CoinList.tsx              ← search bar + danh sách coin
          CoinRow.tsx               ← 1 row coin
    api/
      coin/
        prices/
          route.ts                  ← NEW: proxy CoinGecko + cache 60s
  lib/
    services/
      coin.ts                       ← NEW: fetchCoinPrices(), CoinPrice type

.env.local                          ← thêm COINGECKO_API_KEY=<demo_key>
```

---

## 4. Error Handling

| Tình huống                  | Behavior                                                              |
| --------------------------- | --------------------------------------------------------------------- |
| CoinGecko timeout / lỗi     | Silent failure — giữ data cũ, `isRefreshing = false`                  |
| Lần đầu fetch coin thất bại | `coinLoaded = true` nhưng `coinPrices = []` → hiện "Không có dữ liệu" |
| Image coin load lỗi         | Fallback: initials placeholder (ký tự đầu của symbol)                 |
| Rate limit CoinGecko        | Cache 60s ở proxy giảm thiểu; nếu vẫn bị → silent failure             |

---

## 5. Environment Variables

```bash
# .env.local
COINGECKO_API_KEY=<demo_api_key>
```

Không commit giá trị này vào git.
