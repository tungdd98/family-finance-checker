# Assets Tab Redesign

**Date:** 2026-03-31
**Status:** Approved

## Goal

Nâng cấp tab Tài Sản từ dạng lưới cơ bản lên trang wealth overview kết hợp phân tích danh mục (donut chart, tỷ trọng) và thông tin hiệu suất (P&L tuyệt đối + phần trăm) cho từng loại tài sản.

---

## Layout — Classic Stack (Approved)

```
┌──────────────────────────────────────┐
│  TÀI SẢN                             │
├──────────────────────────────────────┤
│  [Donut]  TỔNG TÀI SẢN               │
│           880.586.380 đ              │
│           ● Vàng 53%  ● Tiết kiệm 47%│
├──────────────────────────────────────┤
│  DANH MỤC TÀI SẢN                   │
│  ▌ VÀNG           462.855.000 đ  ›  │
│                +12.300.000 đ +2.7%  │
│  ▌ TIẾT KIỆM      417.731.380 đ  ›  │
│                 +8.500.000 đ +2.1%  │
├──────────────────────────────────────┤
│  SẮP RA MẮT (muted, dashed border)  │
│  [ COIN · Sắp ra mắt ] [ CK · ... ] │
└──────────────────────────────────────┘
```

---

## Components

### 1. Net Worth Banner (`NetWorthBanner`)

- Container: `bg-surface border border-border p-5`, flex row, `gap-[18px]`
- **Donut chart** — Recharts `PieChart` + `Pie` + `Cell`, `innerRadius=28`, `outerRadius=38`, `paddingAngle=2`, no tooltip, no legend, `isAnimationActive=true`
  - Vàng: `#D4AF37`
  - Tiết kiệm: `#4e8c6a`
  - Background arc (empty): `#1e1e1e` — rendered as third segment to fill 100%
- **Right side:**
  - Label: `TỔNG TÀI SẢN` — `text-[9px] font-semibold tracking-[1.5px] uppercase text-foreground-muted`
  - Value: formatted VND — `text-[22px] font-black tracking-[-1px] text-[#D4AF37]`
  - Legend row: two `legend-item` each with colored dot (7px circle) + label + percentage — `text-[9px] text-foreground-muted`

### 2. Asset Row (`AssetRow`)

Full-width clickable row, navigates to detail page on tap.

- Container: `bg-surface border border-border border-l-[3px] px-4 py-[14px]`, flex row, `justify-between items-center`
- Left border accent: Vàng = `border-l-[#D4AF37]`, Tiết kiệm = `border-l-[#4e8c6a]`
- **Left side:**
  - Category label: `text-[9px] font-semibold tracking-[1.5px] uppercase text-foreground-muted`
  - Value: `text-[18px] font-extrabold tracking-[-0.5px] text-foreground`
- **Right side:**
  - P&L absolute: `text-[12px] font-bold` — green (`text-green-500`) if positive, red (`text-red-500`) if negative. Format: `+12.300.000 đ` / `-5.000.000 đ`
  - P&L percent: `text-[11px]` — same color logic. Format: `+2.7%` / `-1.2%`
  - Chevron: `›` — `text-foreground-muted text-[14px] ml-2`
- On click: `router.push('/gold')` or `router.push('/savings')`

### 3. Coming Soon Section

- Section label "SẮP RA MẮT": `text-[9px] font-semibold tracking-[1.5px] uppercase` with `opacity-40`
- Grid: `grid grid-cols-2 gap-1.5 opacity-35`
- Each cell: `bg-surface border border-dashed border-border p-3 flex flex-col gap-1`
  - Label: `text-[8px] font-semibold tracking-[1.5px] uppercase text-foreground-muted`
  - Text: `text-[10px] text-foreground-muted` — "Sắp ra mắt"
- Items: Coin, Chứng Khoán

---

## Data & Calculations

### Server (`page.tsx`)

Current props passed to `AssetsClient`: `savingsTotal`, `goldTotal`

**New props to add:**

- `goldCost: number` — tổng giá vốn vàng
- `savingsPrincipal: number` — tổng gốc tiết kiệm

**Calculations:**

```ts
// Gold cost = sum of (buy_price_per_chi × remaining_quantity) for each position
const goldCost = goldPositions.reduce((s, pos) => {
  const remaining = pos.quantity - pos.sold_quantity;
  return s + pos.buy_price_per_chi * remaining;
}, 0);

// Savings principal (already computed, just expose it)
const savingsPrincipal = savingsAccounts.reduce((s, a) => s + a.principal, 0);
```

### Client (`AssetsClient.tsx`)

```ts
interface Props {
  savingsTotal: number;
  goldTotal: number;
  goldCost: number; // new
  savingsPrincipal: number; // new
}

// Derived
const goldPnl = goldTotal - goldCost;
const goldPnlPct = goldCost > 0 ? goldPnl / goldCost : 0;

const savingsPnl = savingsTotal - savingsPrincipal;
const savingsPnlPct = savingsPrincipal > 0 ? savingsPnl / savingsPrincipal : 0;

const goldPct = netWorth > 0 ? goldTotal / netWorth : 0;
const savingsPct = netWorth > 0 ? savingsTotal / netWorth : 0;
```

---

## Recharts Donut

```tsx
import { PieChart, Pie, Cell } from "recharts";

const data = [{ value: goldTotal }, { value: savingsTotal }];
const COLORS = ["#D4AF37", "#4e8c6a"];

<PieChart width={76} height={76}>
  <Pie
    data={data}
    cx={38}
    cy={38}
    innerRadius={28}
    outerRadius={38}
    paddingAngle={2}
    dataKey="value"
    startAngle={90}
    endAngle={-270}
    isAnimationActive={true}
    stroke="none"
  >
    {data.map((_, i) => (
      <Cell key={i} fill={COLORS[i]} />
    ))}
  </Pie>
</PieChart>;
```

> `PieChart` và `Pie` từ Recharts phải render trong `"use client"` component — `AssetsClient` đã là client component, không cần thay đổi gì thêm.

---

## P&L Formatting

```ts
function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatVND(value)}`;
}

function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}
```

---

## Edge Cases

- **goldCost = 0** (không có position vàng): ẩn P&L vàng, chỉ hiện `—` hoặc không render `AssetRow` vàng nếu `goldTotal = 0`
- **savingsPrincipal = 0**: tương tự, ẩn P&L tiết kiệm
- **netWorth = 0**: donut không render (tránh NaN), hiển thị vòng tròn trống màu `#1e1e1e`
- **P&L âm**: màu `text-red-500`, prefix `-` (formatVND đã xử lý dấu âm)

---

## Files to Change

| File                                          | Change                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| `src/app/(protected)/assets/page.tsx`         | Tính thêm `goldCost`, `savingsPrincipal`; truyền vào `AssetsClient`       |
| `src/app/(protected)/assets/AssetsClient.tsx` | Rewrite: thêm props, donut chart, asset rows với P&L, coming soon section |
