# Vàng (Gold) Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement gold asset tracking — add/edit/sell/delete positions with live price integration from vang.today API, and a gold summary card on the dashboard.

**Architecture:** Position-based model where each buy creates a `gold_assets` row. Partial sells increment `sold_quantity`; when fully sold, `sold_at` is set. The sell operation atomically updates `gold_assets` and inserts a `cash_transactions` row via a Postgres RPC function. Live prices are fetched from a Next.js proxy route (`/api/gold/prices`) that caches the upstream vang.today API for 5 minutes.

**Tech Stack:** Next.js 16 App Router, Supabase, react-hook-form + zod, @base-ui/react (Drawer + Dialog), sonner, Tailwind CSS, TypeScript.

---

## File Map

| File                                                          | Action | Purpose                                                     |
| ------------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| `src/lib/gold-utils.ts`                                       | Create | Unit conversion (chỉ↔lượng), P&L calc, VND formatting       |
| `src/lib/__tests__/gold-utils.test.ts`                        | Create | Unit tests for pure functions                               |
| `src/lib/validations/gold.ts`                                 | Create | Zod schemas: AddAssetInput, EditAssetInput, SellAssetInput  |
| `src/lib/services/gold.ts`                                    | Create | Supabase CRUD + GoldAsset / GoldPrice types                 |
| `src/app/actions/gold.ts`                                     | Create | Server actions: addAsset, editAsset, sellAsset, deleteAsset |
| `src/app/api/gold/prices/route.ts`                            | Create | Proxy route: GET vang.today, cache 5 min                    |
| `src/app/(protected)/gold/page.tsx`                           | Modify | RSC: fetch positions, render GoldClient                     |
| `src/app/(protected)/gold/GoldClient.tsx`                     | Create | CSC: sheet state, filter state, live prices                 |
| `src/app/(protected)/gold/components/GoldSummaryHeader.tsx`   | Create | Total value, position count, filter chips                   |
| `src/app/(protected)/gold/components/PositionCard.tsx`        | Create | Single position card with P&L                               |
| `src/app/(protected)/gold/components/PositionActionSheet.tsx` | Create | Bottom sheet: Chỉnh sửa / Bán / Xóa                         |
| `src/app/(protected)/gold/components/DeleteConfirmDialog.tsx` | Create | Confirmation dialog                                         |
| `src/app/(protected)/gold/components/BrandPicker.tsx`         | Create | Searchable brand list from API                              |
| `src/app/(protected)/gold/components/AddEditAssetSheet.tsx`   | Create | Add/edit form (mode prop)                                   |
| `src/app/(protected)/gold/components/SellAssetSheet.tsx`      | Create | Sell quantity + price form                                  |
| `src/app/(protected)/dashboard/page.tsx`                      | Modify | Gold summary card + price tracking section                  |

---

## Task 1: Database Migration

**Files:**

- Run SQL in Supabase dashboard (SQL Editor)

- [ ] **Step 1: Run the migration SQL**

Open Supabase dashboard → SQL Editor → New query. Paste and run:

```sql
-- Gold assets table
CREATE TABLE IF NOT EXISTS gold_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_code text NOT NULL,
  brand_name text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  buy_price_per_chi bigint NOT NULL CHECK (buy_price_per_chi > 0),
  buy_date date NOT NULL,
  note text,
  sold_quantity numeric NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
  sell_price_per_chi bigint,
  sold_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT sold_lte_quantity CHECK (sold_quantity <= quantity)
);

-- Cash transactions table (from Phase 4 — CREATE IF NOT EXISTS is safe)
CREATE TABLE IF NOT EXISTS cash_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount bigint NOT NULL,
  type text NOT NULL,
  reference_id uuid,
  note text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS for gold_assets
ALTER TABLE gold_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gold_assets_user_policy"
  ON gold_assets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS for cash_transactions (safe to run even if already exists)
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cash_transactions'
    AND policyname = 'cash_transactions_user_policy'
  ) THEN
    CREATE POLICY "cash_transactions_user_policy"
      ON cash_transactions FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Atomic sell function
CREATE OR REPLACE FUNCTION sell_gold_asset(
  p_user_id uuid,
  p_asset_id uuid,
  p_sell_quantity numeric,
  p_sell_price_per_chi bigint
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quantity numeric;
  v_sold_quantity numeric;
  v_new_sold_qty numeric;
BEGIN
  SELECT quantity, sold_quantity
  INTO v_quantity, v_sold_quantity
  FROM gold_assets
  WHERE id = p_asset_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset not found';
  END IF;

  v_new_sold_qty := v_sold_quantity + p_sell_quantity;

  IF v_new_sold_qty > v_quantity THEN
    RAISE EXCEPTION 'Sell quantity exceeds available quantity';
  END IF;

  UPDATE gold_assets
  SET
    sold_quantity = v_new_sold_qty,
    sell_price_per_chi = p_sell_price_per_chi,
    sold_at = CASE WHEN v_new_sold_qty = v_quantity THEN now() ELSE sold_at END
  WHERE id = p_asset_id AND user_id = p_user_id;

  INSERT INTO cash_transactions (user_id, amount, type, reference_id)
  VALUES (p_user_id, p_sell_quantity * p_sell_price_per_chi, 'gold_sell', p_asset_id);
END;
$$;
```

- [ ] **Step 2: Verify**

In Supabase → Table Editor, confirm `gold_assets` table exists with the correct columns. In SQL Editor run:

```sql
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'sell_gold_asset';
```

Expected: 1 row returned.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add gold_assets DB migration and sell_gold_asset RPC"
```

---

## Task 2: Utility Functions + Tests

**Files:**

- Create: `src/lib/gold-utils.ts`
- Create: `src/lib/__tests__/gold-utils.test.ts`

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest @vitest/ui
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts` at project root:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 2: Write failing tests**

Create `src/lib/__tests__/gold-utils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  chiToLuong,
  luongToChi,
  formatVND,
  calcPnl,
  daysHeld,
  convertInputToChiAndPrice,
} from "@/lib/gold-utils";

describe("chiToLuong", () => {
  it("converts 10 chỉ to 1 lượng", () => {
    expect(chiToLuong(10)).toBe(1);
  });
  it("converts 5 chỉ to 0.5 lượng", () => {
    expect(chiToLuong(5)).toBe(0.5);
  });
});

describe("luongToChi", () => {
  it("converts 1 lượng to 10 chỉ", () => {
    expect(luongToChi(1)).toBe(10);
  });
  it("converts 0.5 lượng to 5 chỉ", () => {
    expect(luongToChi(0.5)).toBe(5);
  });
});

describe("formatVND", () => {
  it("formats 84300000 as VND string", () => {
    expect(formatVND(84300000)).toBe("84.300.000 ₫");
  });
  it("formats 0", () => {
    expect(formatVND(0)).toBe("0 ₫");
  });
});

describe("calcPnl", () => {
  it("calculates profit correctly", () => {
    const result = calcPnl(5, 17_000_000, 18_000_000);
    expect(result.currentValue).toBe(90_000_000);
    expect(result.pnlVnd).toBe(5_000_000);
    expect(result.pnlPercent).toBeCloseTo(5.88, 1);
  });
  it("calculates loss correctly", () => {
    const result = calcPnl(5, 17_100_000, 16_860_000);
    expect(result.pnlVnd).toBe(-1_200_000);
    expect(result.pnlPercent).toBeCloseTo(-1.4, 1);
  });
  it("returns 0 percent when cost is 0", () => {
    const result = calcPnl(0, 0, 17_000_000);
    expect(result.pnlPercent).toBe(0);
  });
});

describe("daysHeld", () => {
  it("returns 0 for today", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(daysHeld(today)).toBe(0);
  });
  it("returns 1 for yesterday", () => {
    const yesterday = new Date(Date.now() - 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(daysHeld(yesterday)).toBe(1);
  });
});

describe("convertInputToChiAndPrice", () => {
  it("returns chi and price unchanged when unit is chi", () => {
    const result = convertInputToChiAndPrice(5, 17_000_000, "chi");
    expect(result.quantityChi).toBe(5);
    expect(result.pricePerChi).toBe(17_000_000);
  });
  it("converts luong to chi and price per luong to price per chi", () => {
    const result = convertInputToChiAndPrice(1, 170_000_000, "luong");
    expect(result.quantityChi).toBe(10);
    expect(result.pricePerChi).toBe(17_000_000);
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
npm test
```

Expected: `Cannot find module '@/lib/gold-utils'`

- [ ] **Step 4: Implement `src/lib/gold-utils.ts`**

```typescript
export const CHI_PER_LUONG = 10;

export function chiToLuong(chi: number): number {
  return chi / CHI_PER_LUONG;
}

export function luongToChi(luong: number): number {
  return luong * CHI_PER_LUONG;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

export function formatPct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export interface PnlResult {
  currentValue: number;
  pnlVnd: number;
  pnlPercent: number;
}

export function calcPnl(
  remainingQty: number,
  buyPricePerChi: number,
  liveSellPrice: number
): PnlResult {
  const currentValue = remainingQty * liveSellPrice;
  const totalCost = remainingQty * buyPricePerChi;
  const pnlVnd = currentValue - totalCost;
  const pnlPercent = totalCost > 0 ? (pnlVnd / totalCost) * 100 : 0;
  return { currentValue, pnlVnd, pnlPercent };
}

export function daysHeld(buyDate: string): number {
  const now = new Date();
  const buy = new Date(buyDate);
  return Math.floor((now.getTime() - buy.getTime()) / (1000 * 60 * 60 * 24));
}

export function convertInputToChiAndPrice(
  quantity: number,
  pricePerUnit: number,
  unit: "chi" | "luong"
): { quantityChi: number; pricePerChi: number } {
  if (unit === "chi") {
    return { quantityChi: quantity, pricePerChi: pricePerUnit };
  }
  return {
    quantityChi: luongToChi(quantity),
    pricePerChi: Math.round(pricePerUnit / CHI_PER_LUONG),
  };
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/gold-utils.ts src/lib/__tests__/gold-utils.test.ts vitest.config.ts package.json
git commit -m "feat: add gold utility functions with vitest"
```

---

## Task 3: Validation Schemas

**Files:**

- Create: `src/lib/validations/gold.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/validations/gold.ts
import { z } from "zod";

export const addAssetSchema = z.object({
  brand_code: z.string().min(1, "Vui lòng chọn thương hiệu vàng"),
  brand_name: z.string().min(1),
  quantity: z.number().positive("Số lượng phải lớn hơn 0"),
  buy_price_per_chi: z.number().int().positive("Giá mua phải lớn hơn 0"),
  buy_date: z.string().min(1, "Vui lòng chọn ngày mua"),
  note: z.string().optional(),
});

export type AddAssetInput = z.infer<typeof addAssetSchema>;

// Edit uses the same fields as Add
export const editAssetSchema = addAssetSchema;
export type EditAssetInput = z.infer<typeof editAssetSchema>;

export const sellAssetSchema = z.object({
  sell_quantity: z.number().positive("Số lượng bán phải lớn hơn 0"),
  sell_price_per_chi: z.number().int().positive("Giá bán phải lớn hơn 0"),
  sell_date: z.string().min(1, "Vui lòng chọn ngày bán"),
});

export type SellAssetInput = z.infer<typeof sellAssetSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validations/gold.ts
git commit -m "feat: add gold validation schemas"
```

---

## Task 4: Gold Price API Route

**Files:**

- Create: `src/app/api/gold/prices/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/gold/prices/route.ts
export async function GET() {
  try {
    const res = await fetch("https://www.vang.today/api/prices", {
      next: { revalidate: 300 }, // 5 minutes
    });

    if (!res.ok) {
      return Response.json({ success: false, data: [] }, { status: 502 });
    }

    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ success: false, data: [] }, { status: 502 });
  }
}
```

- [ ] **Step 2: Verify manually**

Start dev server (`npm run dev`), then open browser at `http://localhost:3000/api/gold/prices`.

Expected: JSON response with `{ success: true, data: [...] }` containing gold price items with `type_code`, `buy`, `sell` fields.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/gold/prices/route.ts
git commit -m "feat: add gold prices proxy API route"
```

---

## Task 5: Gold Service Layer

**Files:**

- Create: `src/lib/services/gold.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/services/gold.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AddAssetInput,
  EditAssetInput,
  SellAssetInput,
} from "@/lib/validations/gold";

export interface GoldAsset {
  id: string;
  user_id: string;
  brand_code: string;
  brand_name: string;
  quantity: number;
  buy_price_per_chi: number;
  buy_date: string;
  note: string | null;
  sold_quantity: number;
  sell_price_per_chi: number | null;
  sold_at: string | null;
  created_at: string;
}

export interface GoldPrice {
  type_code: string;
  buy: number;
  sell: number;
  change_buy: number;
  change_sell: number;
  update_time: string;
}

export async function getActiveGoldAssets(
  supabase: SupabaseClient,
  userId: string
): Promise<GoldAsset[]> {
  const { data, error } = await supabase
    .from("gold_assets")
    .select("*")
    .eq("user_id", userId)
    .is("sold_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addGoldAsset(
  supabase: SupabaseClient,
  userId: string,
  input: AddAssetInput
): Promise<void> {
  const { error } = await supabase.from("gold_assets").insert({
    user_id: userId,
    brand_code: input.brand_code,
    brand_name: input.brand_name,
    quantity: input.quantity,
    buy_price_per_chi: input.buy_price_per_chi,
    buy_date: input.buy_date,
    note: input.note ?? null,
  });
  if (error) throw error;
}

export async function editGoldAsset(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  input: EditAssetInput
): Promise<void> {
  const { error } = await supabase
    .from("gold_assets")
    .update({
      brand_code: input.brand_code,
      brand_name: input.brand_name,
      quantity: input.quantity,
      buy_price_per_chi: input.buy_price_per_chi,
      buy_date: input.buy_date,
      note: input.note ?? null,
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function sellGoldAsset(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  input: SellAssetInput
): Promise<void> {
  const { error } = await supabase.rpc("sell_gold_asset", {
    p_user_id: userId,
    p_asset_id: id,
    p_sell_quantity: input.sell_quantity,
    p_sell_price_per_chi: input.sell_price_per_chi,
  });
  if (error) throw error;
}

export async function deleteGoldAsset(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("gold_assets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/gold.ts
git commit -m "feat: add gold service layer"
```

---

## Task 6: Server Actions

**Files:**

- Create: `src/app/actions/gold.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/app/actions/gold.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  addAssetSchema,
  editAssetSchema,
  sellAssetSchema,
  type AddAssetInput,
  type EditAssetInput,
  type SellAssetInput,
} from "@/lib/validations/gold";
import {
  addGoldAsset,
  editGoldAsset,
  sellGoldAsset,
  deleteGoldAsset,
} from "@/lib/services/gold";

type ActionResult = { error: string } | undefined;

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addAssetAction(
  data: AddAssetInput
): Promise<ActionResult> {
  const parsed = addAssetSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { error: "Chưa đăng nhập" };

  try {
    await addGoldAsset(supabase, user.id, parsed.data);
    revalidatePath("/gold");
    revalidatePath("/dashboard");
  } catch {
    return { error: "Không thể lưu tài sản" };
  }
}

export async function editAssetAction(
  id: string,
  data: EditAssetInput
): Promise<ActionResult> {
  const parsed = editAssetSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { error: "Chưa đăng nhập" };

  try {
    await editGoldAsset(supabase, user.id, id, parsed.data);
    revalidatePath("/gold");
    revalidatePath("/dashboard");
  } catch {
    return { error: "Không thể cập nhật tài sản" };
  }
}

export async function sellAssetAction(
  id: string,
  data: SellAssetInput,
  remainingQty: number
): Promise<ActionResult> {
  const parsed = sellAssetSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  if (parsed.data.sell_quantity > remainingQty) {
    return { error: "Số lượng bán vượt quá số lượng đang nắm giữ" };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { error: "Chưa đăng nhập" };

  try {
    await sellGoldAsset(supabase, user.id, id, parsed.data);
    revalidatePath("/gold");
    revalidatePath("/dashboard");
  } catch {
    return { error: "Không thể bán tài sản" };
  }
}

export async function deleteAssetAction(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { error: "Chưa đăng nhập" };

  try {
    await deleteGoldAsset(supabase, user.id, id);
    revalidatePath("/gold");
    revalidatePath("/dashboard");
  } catch {
    return { error: "Không thể xóa tài sản" };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/gold.ts
git commit -m "feat: add gold server actions"
```

---

## Task 7: Gold Page (RSC) + GoldClient Skeleton

**Files:**

- Modify: `src/app/(protected)/gold/page.tsx`
- Create: `src/app/(protected)/gold/GoldClient.tsx`

- [ ] **Step 1: Update `page.tsx`**

```typescript
// src/app/(protected)/gold/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getActiveGoldAssets } from "@/lib/services/gold";
import { GoldClient } from "./GoldClient";

export default async function GoldPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const positions = user ? await getActiveGoldAssets(supabase, user.id) : [];

  return <GoldClient initialPositions={positions} />;
}
```

- [ ] **Step 2: Create skeleton `GoldClient.tsx`**

```typescript
// src/app/(protected)/gold/GoldClient.tsx
"use client";

import { useState, useEffect } from "react";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";

interface Props {
  initialPositions: GoldAsset[];
}

export function GoldClient({ initialPositions }: Props) {
  const [positions] = useState<GoldAsset[]>(initialPositions);
  const [prices, setPrices] = useState<GoldPrice[]>([]);
  const [activeSheet, setActiveSheet] = useState<
    "add" | "edit" | "sell" | "delete" | null
  >(null);
  const [selectedPosition, setSelectedPosition] = useState<GoldAsset | null>(null);
  const [filterBrand, setFilterBrand] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gold/prices")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setPrices(json.data);
        }
      })
      .catch(() => {
        // prices stay empty — UI shows "—"
      });
  }, []);

  const priceMap = new Map<string, GoldPrice>(
    prices.map((p) => [p.type_code, p])
  );

  const filteredPositions = filterBrand
    ? positions.filter((p) => p.brand_code === filterBrand)
    : positions;

  const uniqueBrands = [...new Set(positions.map((p) => p.brand_code))].map(
    (code) => ({
      code,
      name: positions.find((p) => p.brand_code === code)!.brand_name,
    })
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="text-foreground-muted text-sm">
        {positions.length} tài sản — skeleton (wired in Task 13)
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Verify app loads**

Run `npm run dev`. Navigate to `/gold`. Expected: page renders without errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/gold/page.tsx src/app/(protected)/gold/GoldClient.tsx
git commit -m "feat: add gold page RSC and GoldClient skeleton"
```

---

## Task 8: GoldSummaryHeader + PositionCard

**Files:**

- Create: `src/app/(protected)/gold/components/GoldSummaryHeader.tsx`
- Create: `src/app/(protected)/gold/components/PositionCard.tsx`

- [ ] **Step 1: Create `GoldSummaryHeader.tsx`**

```tsx
// src/app/(protected)/gold/components/GoldSummaryHeader.tsx
import { formatVND } from "@/lib/gold-utils";

interface Brand {
  code: string;
  name: string;
}

interface Props {
  totalValue: number;
  positionCount: number;
  brands: Brand[];
  filterBrand: string | null;
  onFilterChange: (brandCode: string | null) => void;
}

export function GoldSummaryHeader({
  totalValue,
  positionCount,
  brands,
  filterBrand,
  onFilterChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Page title */}
      <h1 className="text-foreground pt-2 text-[28px] font-bold tracking-[-1px]">
        TÀI SẢN VÀNG
      </h1>

      {/* Summary card */}
      <div className="bg-surface flex flex-col gap-1 p-4">
        <p className="text-foreground-muted text-[11px] font-semibold tracking-[1.5px]">
          TỔNG GIÁ TRỊ ƯỚC TÍNH
        </p>
        <p className="text-foreground text-[28px] font-bold tracking-[-1px]">
          {totalValue > 0 ? formatVND(totalValue) : "—"}
        </p>
        <p className="text-foreground-secondary text-[12px]">
          {positionCount} tài sản đang nắm giữ
        </p>
      </div>

      {/* Filter chips */}
      {brands.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFilterChange(null)}
            className={`border px-3 py-1.5 text-[11px] font-semibold tracking-[1px] transition-colors ${
              filterBrand === null
                ? "bg-accent text-background border-accent"
                : "bg-surface border-border text-foreground-secondary"
            }`}
          >
            Tất cả
          </button>
          {brands.map((b) => (
            <button
              key={b.code}
              onClick={() => onFilterChange(b.code)}
              className={`border px-3 py-1.5 text-[11px] font-semibold tracking-[1px] transition-colors ${
                filterBrand === b.code
                  ? "bg-accent text-background border-accent"
                  : "bg-surface border-border text-foreground-secondary"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `PositionCard.tsx`**

```tsx
// src/app/(protected)/gold/components/PositionCard.tsx
import { formatVND, formatPct, calcPnl, daysHeld } from "@/lib/gold-utils";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";

interface Props {
  position: GoldAsset;
  livePrice: GoldPrice | undefined;
  onTap: () => void;
}

export function PositionCard({ position, livePrice, onTap }: Props) {
  const remaining = position.quantity - position.sold_quantity;
  const hasPnl = livePrice !== undefined;
  const pnl = hasPnl
    ? calcPnl(remaining, position.buy_price_per_chi, livePrice.sell)
    : null;
  const days = daysHeld(position.buy_date);
  const totalCapital = remaining * position.buy_price_per_chi;

  const pnlColor =
    pnl === null
      ? ""
      : pnl.pnlVnd >= 0
        ? "text-status-positive"
        : "text-status-negative";

  return (
    <button
      onClick={onTap}
      className="bg-surface flex w-full flex-col gap-3 p-4 text-left"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-[14px] font-semibold">
            {position.brand_name}
          </span>
          <span className="text-foreground-muted text-[11px]">
            {position.buy_date} · {days} ngày
          </span>
        </div>
        <div className="text-right">
          <span className="text-accent text-[16px] font-bold">
            {remaining} chỉ
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-border border-t" />

      {/* Detail rows */}
      <div className="flex flex-col gap-2">
        <DetailRow
          label="Giá mua"
          value={formatVND(position.buy_price_per_chi) + "/chỉ"}
        />
        <DetailRow label="Tổng tiền vốn" value={formatVND(totalCapital)} />
        <DetailRow
          label="Giá trị hiện tại"
          value={pnl ? formatVND(pnl.currentValue) : "—"}
        />
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted text-[12px]">Lãi dự tính</span>
          <span className={`text-[13px] font-semibold ${pnlColor}`}>
            {pnl
              ? `${pnl.pnlVnd >= 0 ? "+" : ""}${formatVND(pnl.pnlVnd)} (${formatPct(pnl.pnlPercent)})`
              : "—"}
          </span>
        </div>
      </div>
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground-muted text-[12px]">{label}</span>
      <span className="text-foreground text-[13px] font-medium">{value}</span>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/gold/components/GoldSummaryHeader.tsx src/app/(protected)/gold/components/PositionCard.tsx
git commit -m "feat: add GoldSummaryHeader and PositionCard components"
```

---

## Task 9: PositionActionSheet + DeleteConfirmDialog

**Files:**

- Create: `src/app/(protected)/gold/components/PositionActionSheet.tsx`
- Create: `src/app/(protected)/gold/components/DeleteConfirmDialog.tsx`

- [ ] **Step 1: Create `PositionActionSheet.tsx`**

```tsx
// src/app/(protected)/gold/components/PositionActionSheet.tsx
"use client";

import { Drawer } from "@base-ui/react/drawer";
import { Pencil, TrendingUp, Trash2 } from "lucide-react";
import type { GoldAsset } from "@/lib/services/gold";

interface Props {
  position: GoldAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onSell: () => void;
  onDelete: () => void;
}

export function PositionActionSheet({
  position,
  open,
  onOpenChange,
  onEdit,
  onSell,
  onDelete,
}: Props) {
  if (!position) return null;
  const remaining = position.quantity - position.sold_quantity;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60" />
        <Drawer.Popup className="bg-surface fixed right-0 bottom-0 left-0 z-50 flex flex-col pb-8">
          <div className="flex justify-center pt-3 pb-4">
            <div className="bg-border-strong h-1 w-10 rounded-full" />
          </div>

          <p className="text-foreground-muted px-7 pb-3 text-[11px] font-semibold tracking-[1.5px]">
            TÙY CHỌN TÀI SẢN
          </p>

          <ActionItem
            icon={<Pencil size={16} />}
            label="Chỉnh sửa"
            onClick={() => {
              onOpenChange(false);
              onEdit();
            }}
          />
          {remaining > 0 && (
            <ActionItem
              icon={<TrendingUp size={16} />}
              label="Bán tài sản"
              onClick={() => {
                onOpenChange(false);
                onSell();
              }}
            />
          )}
          <ActionItem
            icon={<Trash2 size={16} />}
            label="Xóa tài sản"
            destructive
            onClick={() => {
              onOpenChange(false);
              onDelete();
            }}
          />

          <div className="px-7 pt-4">
            <Drawer.Close className="bg-surface-elevated text-foreground w-full py-3.5 text-[11px] font-bold tracking-[2px]">
              ĐÓNG
            </Drawer.Close>
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function ActionItem({
  icon,
  label,
  destructive = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 px-7 py-4 text-left ${
        destructive ? "text-status-negative" : "text-foreground"
      }`}
    >
      {icon}
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  );
}
```

- [ ] **Step 2: Create `DeleteConfirmDialog.tsx`**

```tsx
// src/app/(protected)/gold/components/DeleteConfirmDialog.tsx
"use client";

import { useTransition } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { toast } from "sonner";
import { deleteAssetAction } from "@/app/actions/gold";
import type { GoldAsset } from "@/lib/services/gold";

interface Props {
  position: GoldAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteConfirmDialog({ position, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();

  if (!position) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAssetAction(position.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa tài sản");
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Popup className="bg-surface fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-56px)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-5 p-6">
          <Dialog.Title className="text-foreground text-[16px] font-bold">
            Xóa tài sản
          </Dialog.Title>
          <Dialog.Description className="text-foreground-secondary text-[13px]">
            Bạn có chắc muốn xóa tài sản mua{" "}
            {position.quantity - position.sold_quantity} chỉ{" "}
            {position.brand_name}?
          </Dialog.Description>
          <div className="flex gap-3">
            <Dialog.Close className="bg-surface-elevated text-foreground flex-1 py-3 text-[11px] font-bold tracking-[2px]">
              HỦY
            </Dialog.Close>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="bg-status-negative flex-1 py-3 text-[11px] font-bold tracking-[2px] text-white disabled:opacity-50"
            >
              {isPending ? "ĐANG XÓA..." : "XÓA"}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/gold/components/PositionActionSheet.tsx src/app/(protected)/gold/components/DeleteConfirmDialog.tsx
git commit -m "feat: add PositionActionSheet and DeleteConfirmDialog"
```

---

## Task 10: BrandPicker

**Files:**

- Create: `src/app/(protected)/gold/components/BrandPicker.tsx`

- [ ] **Step 1: Create `BrandPicker.tsx`**

```tsx
// src/app/(protected)/gold/components/BrandPicker.tsx
"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Search, X } from "lucide-react";
import type { GoldPrice } from "@/lib/services/gold";

interface Props {
  prices: GoldPrice[];
  selectedCode: string;
  selectedName: string;
  onSelect: (code: string, name: string) => void;
}

export function BrandPicker({
  prices,
  selectedCode,
  selectedName,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = prices.filter(
    (p) =>
      p.type_code.toLowerCase().includes(query.toLowerCase()) ||
      // type_code may not have a display name; use it directly
      p.type_code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-background border-border flex h-12 w-full items-center justify-between border px-3.5"
      >
        <span
          className={`text-[13px] font-medium ${selectedName ? "text-foreground" : "text-foreground-muted"}`}
        >
          {selectedName || "Chọn thương hiệu vàng"}
        </span>
        <svg
          className="text-foreground-muted h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dialog */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60" />
          <Dialog.Popup className="bg-surface fixed inset-x-0 bottom-0 z-50 flex max-h-[80dvh] flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-5 pb-4">
              <Dialog.Title className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
                Chọn Vàng
              </Dialog.Title>
              <Dialog.Close className="text-foreground-muted">
                <X size={20} />
              </Dialog.Close>
            </div>

            {/* Search */}
            <div className="px-7 pb-3">
              <div className="bg-background border-border flex h-10 items-center gap-2 border px-3">
                <Search size={14} className="text-foreground-muted shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] outline-none"
                />
              </div>
            </div>

            {/* Brand list */}
            <div className="flex-1 overflow-y-auto px-7 pb-8">
              {filtered.length === 0 && (
                <p className="text-foreground-muted py-4 text-center text-[13px]">
                  Không tìm thấy thương hiệu
                </p>
              )}
              {filtered.map((p) => (
                <button
                  key={p.type_code}
                  type="button"
                  onClick={() => {
                    onSelect(p.type_code, p.type_code);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`border-border flex w-full items-center gap-3 border-b py-3.5 last:border-b-0 ${
                    p.type_code === selectedCode
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      p.type_code === selectedCode
                        ? "bg-accent"
                        : "bg-foreground-muted"
                    }`}
                  />
                  <span className="text-[14px] font-medium">{p.type_code}</span>
                </button>
              ))}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
```

> **Note on brand names:** The vang.today API returns `type_code` as the identifier. In practice you may want to maintain a display name mapping. For now `type_code` is used as both code and display name. If the API response includes a display name field (check the actual response), update `onSelect(p.type_code, p.display_name ?? p.type_code)`.

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/gold/components/BrandPicker.tsx
git commit -m "feat: add BrandPicker component"
```

---

## Task 11: AddEditAssetSheet

**Files:**

- Create: `src/app/(protected)/gold/components/AddEditAssetSheet.tsx`

- [ ] **Step 1: Create `AddEditAssetSheet.tsx`**

```tsx
// src/app/(protected)/gold/components/AddEditAssetSheet.tsx
"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { addAssetSchema, type AddAssetInput } from "@/lib/validations/gold";
import { addAssetAction, editAssetAction } from "@/app/actions/gold";
import { convertInputToChiAndPrice, formatVND } from "@/lib/gold-utils";
import { BrandPicker } from "./BrandPicker";
import { Button } from "@/components/ui/button";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";

interface Props {
  mode: "add" | "edit";
  position?: GoldAsset;
  prices: GoldPrice[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Unit = "chi" | "luong";

export function AddEditAssetSheet({
  mode,
  position,
  prices,
  open,
  onOpenChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [unit, setUnit] = useState<Unit>("chi");
  const [priceDisplay, setPriceDisplay] = useState(
    position ? String(position.buy_price_per_chi) : ""
  );

  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<AddAssetInput>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: {
      brand_code: position?.brand_code ?? "",
      brand_name: position?.brand_name ?? "",
      quantity: position ? position.quantity : undefined,
      buy_price_per_chi: position?.buy_price_per_chi,
      buy_date: position?.buy_date ?? today,
      note: position?.note ?? "",
    },
  });

  const totalVnd =
    (form.watch("quantity") ?? 0) * (form.watch("buy_price_per_chi") ?? 0);

  const onSubmit = (data: AddAssetInput) => {
    // Convert from selected unit to chỉ before saving
    const { quantityChi, pricePerChi } = convertInputToChiAndPrice(
      data.quantity,
      data.buy_price_per_chi,
      unit
    );

    const payload: AddAssetInput = {
      ...data,
      quantity: quantityChi,
      buy_price_per_chi: pricePerChi,
    };

    startTransition(async () => {
      const result =
        mode === "add"
          ? await addAssetAction(payload)
          : await editAssetAction(position!.id, payload);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          mode === "add" ? "Đã thêm tài sản" : "Đã cập nhật tài sản"
        );
        onOpenChange(false);
        form.reset();
      }
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60" />
        <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-y-auto">
          {/* Header */}
          <div className="bg-background border-border sticky top-0 flex items-center justify-between border-b px-7 pt-5 pb-4">
            <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
              {mode === "add" ? "Thêm tài sản" : "Sửa tài sản"}
            </span>
            <Drawer.Close className="text-foreground-muted">
              <X size={20} />
            </Drawer.Close>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-7 py-5 pb-10"
          >
            {/* Brand picker */}
            <div className="flex flex-col gap-2">
              <Label>CHỌN THƯƠNG HIỆU VÀNG</Label>
              <Controller
                name="brand_code"
                control={form.control}
                render={() => (
                  <BrandPicker
                    prices={prices}
                    selectedCode={form.watch("brand_code")}
                    selectedName={form.watch("brand_name")}
                    onSelect={(code, name) => {
                      form.setValue("brand_code", code, {
                        shouldValidate: true,
                      });
                      form.setValue("brand_name", name);
                    }}
                  />
                )}
              />
              {form.formState.errors.brand_code && (
                <ErrorMsg>{form.formState.errors.brand_code.message}</ErrorMsg>
              )}
            </div>

            {/* Quantity + unit toggle */}
            <div className="flex flex-col gap-2">
              <Label>SỐ LƯỢNG</Label>
              <div className="flex items-center gap-2">
                <div className="bg-background border-border flex h-12 flex-1 items-center border px-3.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder={unit === "chi" ? "VD: 5" : "VD: 0.5"}
                    disabled={isPending}
                    className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                    {...form.register("quantity", { valueAsNumber: true })}
                  />
                </div>
                <div className="bg-surface border-border flex h-12 items-center border">
                  <button
                    type="button"
                    onClick={() => setUnit("chi")}
                    className={`h-full px-3 py-2 text-[11px] font-bold tracking-[1px] transition-colors ${
                      unit === "chi"
                        ? "bg-accent text-background"
                        : "text-foreground-muted"
                    }`}
                  >
                    CHỈ
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit("luong")}
                    className={`h-full px-3 py-2 text-[11px] font-bold tracking-[1px] transition-colors ${
                      unit === "luong"
                        ? "bg-accent text-background"
                        : "text-foreground-muted"
                    }`}
                  >
                    LƯỢNG
                  </button>
                </div>
              </div>
              {form.formState.errors.quantity && (
                <ErrorMsg>{form.formState.errors.quantity.message}</ErrorMsg>
              )}
            </div>

            {/* Buy price */}
            <div className="flex flex-col gap-2">
              <Label>GIÁ MỖI {unit === "chi" ? "CHỈ" : "LƯỢNG"} (VND)</Label>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  inputMode="numeric"
                  placeholder="VD: 17.000.000"
                  value={priceDisplay}
                  disabled={isPending}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    const num = raw ? parseInt(raw, 10) : 0;
                    setPriceDisplay(
                      raw ? new Intl.NumberFormat("vi-VN").format(num) : ""
                    );
                    form.setValue("buy_price_per_chi", num, {
                      shouldValidate: true,
                    });
                  }}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                />
                <span className="text-foreground-muted shrink-0 text-[13px]">
                  ₫
                </span>
              </div>
              {totalVnd > 0 && (
                <p className="text-foreground-muted text-right text-[12px]">
                  Tổng: {formatVND(totalVnd)}
                </p>
              )}
              {form.formState.errors.buy_price_per_chi && (
                <ErrorMsg>
                  {form.formState.errors.buy_price_per_chi.message}
                </ErrorMsg>
              )}
            </div>

            {/* Buy date */}
            <div className="flex flex-col gap-2">
              <Label>NGÀY MUA</Label>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  type="date"
                  disabled={isPending}
                  className="text-foreground w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                  {...form.register("buy_date")}
                />
              </div>
              {form.formState.errors.buy_date && (
                <ErrorMsg>{form.formState.errors.buy_date.message}</ErrorMsg>
              )}
            </div>

            {/* Note */}
            <div className="flex flex-col gap-2">
              <Label>GHI CHÚ (TÙY CHỌN)</Label>
              <div className="bg-background border-border flex min-h-[80px] items-start border px-3.5 py-3">
                <textarea
                  placeholder="Mua tại SJC Lý Thường Kiệt..."
                  disabled={isPending}
                  rows={3}
                  className="text-foreground placeholder:text-foreground-muted w-full resize-none bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                  {...form.register("note")}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-14 w-full"
            >
              {isPending
                ? "ĐANG LƯU..."
                : mode === "add"
                  ? "LƯU TÀI SẢN"
                  : "CẬP NHẬT TÀI SẢN"}
            </Button>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px]">
      {children}
    </span>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <p className="text-status-negative text-[11px]">{children}</p>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/gold/components/AddEditAssetSheet.tsx
git commit -m "feat: add AddEditAssetSheet component"
```

---

## Task 12: SellAssetSheet

**Files:**

- Create: `src/app/(protected)/gold/components/SellAssetSheet.tsx`

- [ ] **Step 1: Create `SellAssetSheet.tsx`**

```tsx
// src/app/(protected)/gold/components/SellAssetSheet.tsx
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { sellAssetSchema, type SellAssetInput } from "@/lib/validations/gold";
import { sellAssetAction } from "@/app/actions/gold";
import { Button } from "@/components/ui/button";
import type { GoldAsset } from "@/lib/services/gold";

interface Props {
  position: GoldAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SellAssetSheet({ position, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const [priceDisplay, setPriceDisplay] = useState("");

  if (!position) return null;

  const remaining = position.quantity - position.sold_quantity;
  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<SellAssetInput>({
    resolver: zodResolver(sellAssetSchema),
    defaultValues: {
      sell_quantity: undefined,
      sell_price_per_chi: undefined,
      sell_date: today,
    },
  });

  const onSubmit = (data: SellAssetInput) => {
    startTransition(async () => {
      const result = await sellAssetAction(position.id, data, remaining);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã bán tài sản");
        onOpenChange(false);
        form.reset();
        setPriceDisplay("");
      }
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60" />
        <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-50 flex flex-col">
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b px-7 pt-5 pb-4">
            <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
              Bán tài sản
            </span>
            <Drawer.Close className="text-foreground-muted">
              <X size={20} />
            </Drawer.Close>
          </div>

          {/* Asset info */}
          <div className="border-border border-b px-7 py-4">
            <p className="text-foreground-secondary text-[13px]">
              {remaining} chỉ {position.brand_name}
            </p>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-7 py-5 pb-10"
          >
            {/* Sell quantity */}
            <div className="flex flex-col gap-2">
              <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px]">
                SỐ LƯỢNG BÁN (CHỈ)
              </span>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={remaining}
                  placeholder={`Tối đa ${remaining} chỉ`}
                  disabled={isPending}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                  {...form.register("sell_quantity", { valueAsNumber: true })}
                />
              </div>
              {form.formState.errors.sell_quantity && (
                <p className="text-status-negative text-[11px]">
                  {form.formState.errors.sell_quantity.message}
                </p>
              )}
            </div>

            {/* Sell price */}
            <div className="flex flex-col gap-2">
              <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px]">
                GIÁ BÁN MỖI CHỈ (VND)
              </span>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  inputMode="numeric"
                  placeholder="VD: 16.860.000"
                  value={priceDisplay}
                  disabled={isPending}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    const num = raw ? parseInt(raw, 10) : 0;
                    setPriceDisplay(
                      raw ? new Intl.NumberFormat("vi-VN").format(num) : ""
                    );
                    form.setValue("sell_price_per_chi", num, {
                      shouldValidate: true,
                    });
                  }}
                  className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                />
                <span className="text-foreground-muted shrink-0 text-[13px]">
                  ₫
                </span>
              </div>
              {form.formState.errors.sell_price_per_chi && (
                <p className="text-status-negative text-[11px]">
                  {form.formState.errors.sell_price_per_chi.message}
                </p>
              )}
            </div>

            {/* Sell date */}
            <div className="flex flex-col gap-2">
              <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px]">
                NGÀY BÁN
              </span>
              <div className="bg-background border-border flex h-12 items-center border px-3.5">
                <input
                  type="date"
                  disabled={isPending}
                  className="text-foreground w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
                  {...form.register("sell_date")}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-14 w-full"
            >
              {isPending ? "ĐANG XÁC NHẬN..." : "✓ XÁC NHẬN BÁN"}
            </Button>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/gold/components/SellAssetSheet.tsx
git commit -m "feat: add SellAssetSheet component"
```

---

## Task 13: Wire Up GoldClient

**Files:**

- Modify: `src/app/(protected)/gold/GoldClient.tsx`

- [ ] **Step 1: Replace GoldClient skeleton with full implementation**

```tsx
// src/app/(protected)/gold/GoldClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";
import { calcPnl } from "@/lib/gold-utils";
import { GoldSummaryHeader } from "./components/GoldSummaryHeader";
import { PositionCard } from "./components/PositionCard";
import { PositionActionSheet } from "./components/PositionActionSheet";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";
import { AddEditAssetSheet } from "./components/AddEditAssetSheet";
import { SellAssetSheet } from "./components/SellAssetSheet";

interface Props {
  initialPositions: GoldAsset[];
}

export function GoldClient({ initialPositions }: Props) {
  const [positions] = useState<GoldAsset[]>(initialPositions);
  const [prices, setPrices] = useState<GoldPrice[]>([]);
  const [activeSheet, setActiveSheet] = useState<
    "add" | "edit" | "sell" | "delete" | "action" | null
  >(null);
  const [selectedPosition, setSelectedPosition] = useState<GoldAsset | null>(
    null
  );
  const [filterBrand, setFilterBrand] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gold/prices")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setPrices(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const priceMap = new Map<string, GoldPrice>(
    prices.map((p) => [p.type_code, p])
  );

  const filteredPositions = filterBrand
    ? positions.filter((p) => p.brand_code === filterBrand)
    : positions;

  const uniqueBrands = [
    ...new Map(positions.map((p) => [p.brand_code, p])).values(),
  ].map((p) => ({ code: p.brand_code, name: p.brand_name }));

  // Total portfolio value (sum of current values for positions that have a live price)
  const totalValue = positions.reduce((sum, pos) => {
    const livePrice = priceMap.get(pos.brand_code);
    if (!livePrice) return sum;
    const remaining = pos.quantity - pos.sold_quantity;
    const { currentValue } = calcPnl(
      remaining,
      pos.buy_price_per_chi,
      livePrice.sell
    );
    return sum + currentValue;
  }, 0);

  const openAction = (position: GoldAsset) => {
    setSelectedPosition(position);
    setActiveSheet("action");
  };

  return (
    <div className="flex flex-col gap-5 pb-5">
      <GoldSummaryHeader
        totalValue={totalValue}
        positionCount={positions.length}
        brands={uniqueBrands}
        filterBrand={filterBrand}
        onFilterChange={setFilterBrand}
      />

      {/* Position list */}
      {filteredPositions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-foreground-muted text-[14px]">
            Chưa có tài sản vàng nào
          </p>
          <p className="text-foreground-muted text-[12px]">
            Nhấn + để thêm tài sản đầu tiên
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPositions.map((pos) => (
            <PositionCard
              key={pos.id}
              position={pos}
              livePrice={priceMap.get(pos.brand_code)}
              onTap={() => openAction(pos)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setActiveSheet("add")}
        className="bg-accent text-background fixed right-7 bottom-[116px] flex h-14 w-14 items-center justify-center shadow-lg"
        aria-label="Thêm tài sản"
      >
        <Plus size={24} />
      </button>

      {/* Sheets */}
      <PositionActionSheet
        position={selectedPosition}
        open={activeSheet === "action"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
        onEdit={() => setActiveSheet("edit")}
        onSell={() => setActiveSheet("sell")}
        onDelete={() => setActiveSheet("delete")}
      />

      <AddEditAssetSheet
        mode="add"
        prices={prices}
        open={activeSheet === "add"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
      />

      <AddEditAssetSheet
        mode="edit"
        position={selectedPosition ?? undefined}
        prices={prices}
        open={activeSheet === "edit"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
      />

      <SellAssetSheet
        position={selectedPosition}
        open={activeSheet === "sell"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
      />

      <DeleteConfirmDialog
        position={selectedPosition}
        open={activeSheet === "delete"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify full flow manually**

1. Navigate to `/gold`
2. Tap FAB → AddEditAssetSheet opens
3. Select a brand from BrandPicker, enter quantity, price, date → "LƯU TÀI SẢN"
4. Verify the new position card appears
5. Tap a position card → PositionActionSheet opens
6. Tap "Bán tài sản" → SellAssetSheet opens → enter quantity/price → "XÁC NHẬN BÁN"
7. Tap "Chỉnh sửa" → AddEditAssetSheet opens pre-filled
8. Tap "Xóa tài sản" → DeleteConfirmDialog → confirm → card disappears

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/gold/GoldClient.tsx
git commit -m "feat: wire up full GoldClient with all sheets"
```

---

## Task 14: Dashboard Gold Card

**Files:**

- Modify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Implement dashboard page**

```tsx
// src/app/(protected)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getActiveGoldAssets } from "@/lib/services/gold";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const goldPositions = user
    ? await getActiveGoldAssets(supabase, user.id)
    : [];

  return <DashboardClient goldPositions={goldPositions} />;
}
```

- [ ] **Step 2: Create `src/app/(protected)/dashboard/DashboardClient.tsx`**

```tsx
// src/app/(protected)/dashboard/DashboardClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";
import { calcPnl, formatVND, formatPct } from "@/lib/gold-utils";

interface Props {
  goldPositions: GoldAsset[];
}

export function DashboardClient({ goldPositions }: Props) {
  const [prices, setPrices] = useState<GoldPrice[]>([]);

  useEffect(() => {
    fetch("/api/gold/prices")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setPrices(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const priceMap = new Map<string, GoldPrice>(
    prices.map((p) => [p.type_code, p])
  );

  // Aggregate portfolio stats
  let totalValue = 0;
  let totalCapital = 0;

  for (const pos of goldPositions) {
    const remaining = pos.quantity - pos.sold_quantity;
    const livePrice = priceMap.get(pos.brand_code);
    totalCapital += remaining * pos.buy_price_per_chi;
    if (livePrice) {
      totalValue += calcPnl(
        remaining,
        pos.buy_price_per_chi,
        livePrice.sell
      ).currentValue;
    }
  }

  const totalPnl = totalValue - totalCapital;
  const totalPnlPct = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;
  const hasPrices = totalValue > 0;

  // Brands held by the user that have a live price
  const trackedBrands = [
    ...new Map(
      goldPositions.map((p) => [p.brand_code, p.brand_name])
    ).entries(),
  ]
    .map(([code, name]) => ({ code, name, price: priceMap.get(code) }))
    .filter((b) => b.price !== undefined);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-foreground pt-2 text-[28px] font-bold tracking-[-1px]">
        TỔNG QUAN
      </h1>

      {/* Gold asset card */}
      <div className="bg-surface flex flex-col gap-4 p-4">
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
            <div className="flex flex-col gap-1">
              <p className="text-foreground text-[24px] font-bold tracking-[-1px]">
                {hasPrices ? formatVND(totalValue) : "—"}
              </p>
              <p className="text-foreground-secondary text-[12px]">
                Vốn: {formatVND(totalCapital)}
              </p>
              {hasPrices && (
                <p
                  className={`text-[12px] font-semibold ${
                    totalPnl >= 0
                      ? "text-status-positive"
                      : "text-status-negative"
                  }`}
                >
                  {totalPnl >= 0 ? "+" : ""}
                  {formatVND(totalPnl)} ({formatPct(totalPnlPct)})
                </p>
              )}
            </div>

            {/* Tracked prices */}
            {trackedBrands.length > 0 && (
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-3 pb-2">
                  <div className="bg-accent h-3.5 w-0.75 shrink-0" />
                  <span className="text-foreground-secondary text-[11px] font-semibold tracking-[1.5px]">
                    VÀNG ĐANG THEO DÕI
                  </span>
                </div>
                <div className="flex flex-col">
                  {/* Header row */}
                  <div className="border-border flex items-center justify-between border-b py-2">
                    <span className="text-foreground-muted text-[10px] tracking-[1px]">
                      THƯƠNG HIỆU
                    </span>
                    <div className="flex gap-6">
                      <span className="text-foreground-muted text-[10px] tracking-[1px]">
                        MUA VÀO
                      </span>
                      <span className="text-foreground-muted text-[10px] tracking-[1px]">
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
                      <div className="flex gap-6">
                        <span className="text-status-positive text-[12px] font-semibold">
                          {new Intl.NumberFormat("vi-VN").format(price!.buy)}
                        </span>
                        <span className="text-status-negative text-[12px] font-semibold">
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
```

- [ ] **Step 3: Verify dashboard**

Navigate to `/dashboard`. Expected: gold summary card renders with total value, capital, P&L, and tracked prices for brands you hold.

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/dashboard/page.tsx src/app/(protected)/dashboard/DashboardClient.tsx
git commit -m "feat: add dashboard gold summary card"
```

---

## Self-Review

**Spec coverage check:**

- ✅ DB: `gold_assets` with all columns, RLS, atomic `sell_gold_asset` RPC
- ✅ `cash_transactions` insert on sell (inside RPC)
- ✅ `/gold` page: RSC + positions fetch
- ✅ GoldSummaryHeader: total value, position count, filter chips
- ✅ PositionCard: brand, date, days held, remaining qty, P&L, "—" when no price
- ✅ FAB → AddEditAssetSheet
- ✅ PositionActionSheet: Chỉnh sửa / Bán / Xóa
- ✅ AddEditAssetSheet: brand picker, qty+unit toggle, price, date, note, add+edit mode
- ✅ SellAssetSheet: sell qty (≤ remaining), sell price, sell date
- ✅ DeleteConfirmDialog: confirmation with brand name + qty
- ✅ `/api/gold/prices`: proxy with 5-min cache
- ✅ BrandPicker: searchable, populated from API prices
- ✅ Dashboard: total value, capital, P&L, tracked prices per brand held
- ✅ Sell flow: server-side qty validation + RPC call
- ✅ Error handling: API down → "—", brand not in feed → "—"
- ✅ Unit conversion: chỉ↔lượng in form, always store in chỉ

**Potential issue — brand display name:** vang.today API may return only `type_code` (e.g. `BTMH`), not a full human-readable name. The BrandPicker and AddEditAssetSheet use `type_code` as both code and display name. After Task 4, check the actual API response structure and update `onSelect(p.type_code, p.display_name ?? p.type_code)` in BrandPicker if a display name field exists.
