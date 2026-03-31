# Assets Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp tab Tài Sản với donut chart (Recharts), P&L tuyệt đối + phần trăm cho từng loại tài sản, và "coming soon" section gọn hơn.

**Architecture:** Server component (`page.tsx`) tính thêm `goldCost` và `savingsPrincipal` từ data đã fetch, truyền xuống `AssetsClient`. Client component rewrite với `PieChart` từ Recharts và asset rows full-width.

**Tech Stack:** Next.js App Router, Recharts v3 (`PieChart`, `Pie`, `Cell`), Vitest, Tailwind CSS, `formatVND` / `formatPct` từ `@/lib/gold-utils`

---

## File Map

| File                                          | Action  | Responsibility                                                 |
| --------------------------------------------- | ------- | -------------------------------------------------------------- |
| `src/app/(protected)/assets/page.tsx`         | Modify  | Tính `goldCost`, `savingsPrincipal`; truyền vào `AssetsClient` |
| `src/app/(protected)/assets/AssetsClient.tsx` | Rewrite | UI mới: donut chart + asset rows với P&L + coming soon         |

---

## Task 1: Mở rộng server props trong `page.tsx`

**Files:**

- Modify: `src/app/(protected)/assets/page.tsx`

- [ ] **Step 1: Đọc file hiện tại**

Đọc `src/app/(protected)/assets/page.tsx` để nắm rõ trước khi sửa. File hiện tính `savingsTotal` và `goldTotal` rồi truyền vào `AssetsClient`.

- [ ] **Step 2: Thêm `goldCost` và `savingsPrincipal`**

Sửa `src/app/(protected)/assets/page.tsx` — thêm 2 biến mới và cập nhật props của `AssetsClient`:

```ts
// Sau dòng const goldTotal = ...
const goldCost = goldPositions.reduce((s, pos) => {
  const remaining = pos.quantity - pos.sold_quantity;
  return s + pos.buy_price_per_chi * remaining;
}, 0);

const savingsPrincipal = savingsAccounts.reduce((s, a) => s + a.principal, 0);

// Cập nhật JSX:
return (
  <AssetsClient
    savingsTotal={savingsTotal}
    goldTotal={goldTotal}
    goldCost={goldCost}
    savingsPrincipal={savingsPrincipal}
  />
);
```

- [ ] **Step 3: Verify TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no errors (AssetsClient chưa nhận props mới — sẽ fix ở Task 2, nên bước này chạy sau Task 2).

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/assets/page.tsx
git commit -m "feat: pass goldCost and savingsPrincipal to AssetsClient"
```

---

## Task 2: Rewrite `AssetsClient.tsx`

**Files:**

- Modify: `src/app/(protected)/assets/AssetsClient.tsx`

- [ ] **Step 1: Đọc file hiện tại**

Đọc `src/app/(protected)/assets/AssetsClient.tsx` để hiểu structure hiện tại trước khi rewrite.

- [ ] **Step 2: Rewrite toàn bộ component**

Thay thế toàn bộ nội dung `src/app/(protected)/assets/AssetsClient.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell } from "recharts";
import { formatVND, formatPct } from "@/lib/gold-utils";

interface Props {
  savingsTotal: number;
  goldTotal: number;
  goldCost: number;
  savingsPrincipal: number;
}

const GOLD_COLOR = "#D4AF37";
const SAVINGS_COLOR = "#4e8c6a";

export function AssetsClient({
  savingsTotal,
  goldTotal,
  goldCost,
  savingsPrincipal,
}: Props) {
  const router = useRouter();
  const netWorth = savingsTotal + goldTotal;

  // P&L calculations
  const goldPnl = goldTotal - goldCost;
  const goldPnlPct = goldCost > 0 ? (goldPnl / goldCost) * 100 : 0;

  const savingsPnl = savingsTotal - savingsPrincipal;
  const savingsPnlPct =
    savingsPrincipal > 0 ? (savingsPnl / savingsPrincipal) * 100 : 0;

  // Portfolio percentages
  const goldPct = netWorth > 0 ? Math.round((goldTotal / netWorth) * 100) : 0;
  const savingsPct = netWorth > 0 ? 100 - goldPct : 0;

  // Recharts data — if netWorth is 0, show an empty ring
  const chartData =
    netWorth > 0
      ? [{ value: goldTotal }, { value: savingsTotal }]
      : [{ value: 1 }];
  const chartColors = netWorth > 0 ? [GOLD_COLOR, SAVINGS_COLOR] : ["#1e1e1e"];

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Page title */}
      <div className="pt-2">
        <h1 className="text-foreground text-[28px] font-bold tracking-[-1px] uppercase">
          Tài Sản
        </h1>
      </div>

      {/* Net worth banner */}
      <div className="bg-surface border-border flex items-center gap-[18px] border p-5">
        <PieChart width={76} height={76}>
          <Pie
            data={chartData}
            cx={38}
            cy={38}
            innerRadius={28}
            outerRadius={38}
            paddingAngle={netWorth > 0 ? 2 : 0}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            isAnimationActive
            stroke="none"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={chartColors[i]} />
            ))}
          </Pie>
        </PieChart>

        <div className="flex flex-col gap-1">
          <span className="text-foreground-muted text-[9px] font-semibold tracking-[1.5px] uppercase">
            Tổng tài sản
          </span>
          <span className="text-[22px] font-black tracking-[-1px] text-[#D4AF37]">
            {formatVND(netWorth)}
          </span>
          {netWorth > 0 && (
            <div className="mt-1 flex gap-2.5">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-[7px] w-[7px] rounded-full"
                  style={{ background: GOLD_COLOR }}
                />
                <span className="text-foreground-muted text-[9px]">
                  Vàng {goldPct}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="h-[7px] w-[7px] rounded-full"
                  style={{ background: SAVINGS_COLOR }}
                />
                <span className="text-foreground-muted text-[9px]">
                  Tiết kiệm {savingsPct}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section label */}
      <span className="text-foreground-muted text-[9px] font-semibold tracking-[1.5px] uppercase">
        Danh mục tài sản
      </span>

      {/* Asset rows */}
      <div className="flex flex-col gap-2">
        {/* Gold */}
        <button
          onClick={() => router.push("/gold")}
          className="bg-surface border-border flex items-center justify-between border border-l-[3px] px-4 py-[14px] text-left"
          style={{ borderLeftColor: GOLD_COLOR }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground-muted text-[9px] font-semibold tracking-[1.5px] uppercase">
              Vàng
            </span>
            <span className="text-foreground text-[18px] font-extrabold tracking-[-0.5px]">
              {formatVND(goldTotal)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {goldCost > 0 && (
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className={`text-[12px] font-bold tracking-[-0.3px] ${goldPnl >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {goldPnl >= 0 ? "+" : ""}
                  {formatVND(goldPnl)}
                </span>
                <span
                  className={`text-[11px] ${goldPnl >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {formatPct(goldPnlPct)}
                </span>
              </div>
            )}
            <span className="text-foreground-muted text-[14px]">›</span>
          </div>
        </button>

        {/* Savings */}
        <button
          onClick={() => router.push("/savings")}
          className="bg-surface border-border flex items-center justify-between border border-l-[3px] px-4 py-[14px] text-left"
          style={{ borderLeftColor: SAVINGS_COLOR }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground-muted text-[9px] font-semibold tracking-[1.5px] uppercase">
              Tiết Kiệm
            </span>
            <span className="text-foreground text-[18px] font-extrabold tracking-[-0.5px]">
              {formatVND(savingsTotal)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {savingsPrincipal > 0 && (
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className={`text-[12px] font-bold tracking-[-0.3px] ${savingsPnl >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {savingsPnl >= 0 ? "+" : ""}
                  {formatVND(savingsPnl)}
                </span>
                <span
                  className={`text-[11px] ${savingsPnl >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {formatPct(savingsPnlPct)}
                </span>
              </div>
            )}
            <span className="text-foreground-muted text-[14px]">›</span>
          </div>
        </button>
      </div>

      {/* Coming soon */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-semibold tracking-[1.5px] uppercase opacity-40">
          Sắp ra mắt
        </span>
        <div className="grid grid-cols-2 gap-1.5 opacity-35">
          <div className="bg-surface border-border flex flex-col gap-1 border border-dashed p-3">
            <span className="text-foreground-muted text-[8px] font-semibold tracking-[1.5px] uppercase">
              Coin
            </span>
            <span className="text-foreground-muted text-[10px]">
              Sắp ra mắt
            </span>
          </div>
          <div className="bg-surface border-border flex flex-col gap-1 border border-dashed p-3">
            <span className="text-foreground-muted text-[8px] font-semibold tracking-[1.5px] uppercase">
              Chứng Khoán
            </span>
            <span className="text-foreground-muted text-[10px]">
              Sắp ra mắt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no errors. Nếu có lỗi về Recharts types, kiểm tra import — `PieChart`, `Pie`, `Cell` đều export từ `"recharts"`.

- [ ] **Step 4: Chạy dev server và kiểm tra thủ công**

```bash
npm run dev
```

Mở `http://localhost:3000/assets` và kiểm tra:

- Donut chart hiển thị đúng 2 màu (vàng + xanh)
- Số tổng tài sản màu vàng `#D4AF37`
- Legend hiển thị tỷ lệ % của mỗi loại
- Row Vàng có border-left vàng, P&L xanh lá
- Row Tiết Kiệm có border-left xanh, P&L xanh lá
- Coming soon mờ, dashed border, nhỏ hơn
- Nhấn vào Vàng → điều hướng đến `/gold`
- Nhấn vào Tiết Kiệm → điều hướng đến `/savings`

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/assets/AssetsClient.tsx
git commit -m "feat: redesign assets tab with donut chart and P&L rows"
```

---

## Self-Review

**Spec coverage:**

- ✅ Donut chart với Recharts — Task 2
- ✅ Tổng tài sản màu vàng, legend tỷ trọng — Task 2
- ✅ Asset rows full-width với border-left accent — Task 2
- ✅ P&L tuyệt đối + phần trăm (cả hai) — Task 2
- ✅ P&L xanh/đỏ tùy dương/âm — Task 2
- ✅ Coming soon nhỏ hơn, mờ, grouped — Task 2
- ✅ `goldCost` và `savingsPrincipal` từ server — Task 1
- ✅ Edge case: `goldCost = 0` → ẩn P&L vàng — Task 2 (`{goldCost > 0 && ...}`)
- ✅ Edge case: `savingsPrincipal = 0` → ẩn P&L tiết kiệm — Task 2 (`{savingsPrincipal > 0 && ...}`)
- ✅ Edge case: `netWorth = 0` → hiện vòng trống màu `#1e1e1e` — Task 2

**Placeholder scan:** Không có TBD, TODO, hay bước mơ hồ.

**Type consistency:** `goldCost`, `savingsPrincipal` được định nghĩa ở Task 1 (page.tsx) và nhận vào interface Props ở Task 2 — nhất quán. `formatPct` nhận `number` (percentage đã × 100) — khớp với cách dùng (`goldPnlPct` đã × 100 trước khi truyền vào).
