# Vàng (Gold) Feature Design

**Date:** 2026-03-28
**Scope:** Gold asset tracking — add, edit, partial sell, delete; live price integration; dashboard card. Silver (Bạc) is explicitly out of scope.

---

## 1. Database

### `gold_assets`

| Column               | Type                   | Notes                                        |
| -------------------- | ---------------------- | -------------------------------------------- |
| `id`                 | `uuid` PK              |                                              |
| `user_id`            | `uuid` FK → auth.users |                                              |
| `brand_code`         | `text`                 | type_code from vang.today API (e.g. `BTMH`)  |
| `brand_name`         | `text`                 | display name (e.g. `Bảo Tín Mạnh Hải`)       |
| `quantity`           | `numeric`              | total purchased quantity, unit: chỉ          |
| `buy_price_per_chi`  | `bigint`               | VND per chỉ                                  |
| `buy_date`           | `date`                 |                                              |
| `note`               | `text`                 | nullable                                     |
| `sold_quantity`      | `numeric`              | default 0; increases on each partial sell    |
| `sell_price_per_chi` | `bigint`               | nullable; price of most recent sell          |
| `sold_at`            | `timestamptz`          | nullable; set when sold_quantity == quantity |
| `created_at`         | `timestamptz`          |                                              |

**Remaining quantity** (computed in app): `quantity - sold_quantity`

**Fully sold condition**: `sold_at IS NOT NULL`

### `cash_transactions` (existing from Phase 4)

No new table needed. When selling gold, insert a row:

- `amount = sell_qty × sell_price_per_chi` (positive)
- `type = 'gold_sell'`
- `reference_id = gold_asset.id`

Both the `gold_assets` update and `cash_transactions` insert must happen in a single Supabase transaction.

---

## 2. Routes & Pages

Only one route is needed: `/gold`

All actions (add, edit, sell, delete) use modals/bottom sheets on the same page — no sub-routes.

### `/gold` page layout

**Header:**

- Total current portfolio value (live price × remaining qty, summed)
- Number of active positions

**Filter chips:** "Tất cả" + one chip per distinct brand in user's active positions

**Position cards** (where `sold_at IS NULL`):

- Brand name, buy date, days held
- Remaining quantity (chỉ)
- Buy price per chỉ, total capital invested, current value (live price), P&L in VND and %
- If brand has no live price match: show "—" for current value and P&L
- Tap → action bottom sheet

**FAB (+):** Opens Add asset sheet

**Sold positions:** Not shown in the main list (filtered out by `sold_at IS NULL`)

### Modals / Bottom Sheets

| Sheet          | Trigger                       | Fields                                                                                   |
| -------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| Add asset      | FAB                           | Brand picker, quantity + Chỉ/Lượng toggle, buy price per unit, buy date, note (optional) |
| Edit asset     | "Chỉnh sửa" in action sheet   | Same fields as Add, pre-filled                                                           |
| Sell asset     | "Bán tài sản" in action sheet | Sell quantity (≤ remaining), sell price per unit, sell date                              |
| Delete confirm | "Xóa tài sản" in action sheet | Confirmation dialog                                                                      |
| Action sheet   | Tap position card             | Options: Chỉnh sửa / Bán tài sản / Xóa tài sản                                           |

### Dashboard integration (`/dashboard`)

Add a **"Tài sản Vàng"** card:

- Total portfolio value, total capital, total P&L (VND + %)
- "Vàng đang theo dõi" section: live buy/sell prices for brands the user currently holds, fetched from API

---

## 3. Data Flow & API Integration

### Gold price API

- Source: `https://www.vang.today/api/prices`
- Public, no auth, CORS enabled, refreshes every 5 minutes
- Response: `{ success, current_time, data: [{ type_code, buy, sell, change_buy, change_sell, update_time }] }`

### Next.js proxy route

`GET /api/gold/prices`

- Proxies to vang.today, caches for 5 minutes (matching upstream refresh rate)
- Shields client from CORS and exposes a stable internal contract

### Brand picker

- Populated from the same `/api/gold/prices` response
- Maps `type_code` + display name to a searchable list
- On select: saves `brand_code` and `brand_name` to the form

### Portfolio valuation (client-side)

1. `page.tsx` (RSC) fetches positions from Supabase
2. `GoldClient.tsx` fetches live prices from `/api/gold/prices` on mount
3. Client matches `position.brand_code` → `price.type_code` → computes `current_value = remaining_qty × sell_price`
4. No live price match → display "—"

### Sell flow

Server Action (`sellAsset`):

1. Validate: `sell_qty ≤ remaining_qty`
2. Update `gold_assets`: increment `sold_quantity`, set `sell_price_per_chi`, set `sold_at` if fully sold
3. Insert `cash_transactions`: `amount = sell_qty × sell_price_per_chi`, `type = 'gold_sell'`, `reference_id = position.id`
4. Both writes in a single transaction
5. Revalidate `/gold` and `/dashboard`

---

## 4. Component Structure

```
src/
  app/
    (protected)/
      gold/
        page.tsx                  ← RSC: fetch positions from Supabase
        GoldClient.tsx            ← CSC: live prices, sheet state, filter state
        components/
          GoldSummaryHeader.tsx   ← total value, position count, filter chips
          PositionCard.tsx        ← single position card with P&L
          PositionActionSheet.tsx ← Chỉnh sửa / Bán / Xóa options
          AddEditAssetSheet.tsx   ← add and edit form (shared, mode prop)
          SellAssetSheet.tsx      ← sell quantity + price form
          DeleteConfirmDialog.tsx ← confirmation dialog
          BrandPicker.tsx         ← searchable brand list from API
    api/
      gold/
        prices/
          route.ts                ← proxy + 5-min cache to vang.today
  lib/
    gold.ts                       ← server actions: addAsset, editAsset, sellAsset, deleteAsset
    gold-utils.ts                 ← unit conversion (chỉ ↔ lượng), P&L calculations
```

### State management

- **Positions:** fetched server-side in `page.tsx`, passed as props
- **Live prices:** `useState` in `GoldClient.tsx`, fetched on mount
- **Sheet state:** `activeSheet: 'add' | 'edit' | 'sell' | 'delete' | null` + `selectedPosition: GoldAsset | null` in `GoldClient.tsx`
- **Forms:** uncontrolled with `FormData` (consistent with `SettingsForm.tsx` pattern)
- **Post-action refresh:** `useTransition` + `revalidatePath` in server actions

### Unit conversion

- DB storage unit: **chỉ** (always)
- UI toggle Chỉ/Lượng: 1 lượng = 10 chỉ
- Convert to chỉ before saving; convert for display only

### Error handling

- API timeout or unavailable → prices show "—", positions still load
- Brand not in price feed → "—" for current value, no crash
- Sell quantity > remaining → rejected both client-side (max attr on input) and server-side (validation in server action)
