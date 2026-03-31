# Dashboard — Recent Transactions Widget

**Date:** 2026-03-31
**Scope:** Add a "GIAO DỊCH GẦN ĐÂY" section below the stat-tile grid on the dashboard.

---

## Goal

Show the 8 most recent financial events across all asset types so the user can see activity at a glance without navigating away from the dashboard.

---

## Data Sources & Assembly

### Sources fetched server-side in `dashboard/page.tsx`

| Source                                    | Event kind           | Date field used               |
| ----------------------------------------- | -------------------- | ----------------------------- |
| `gold_assets` (all rows, not just active) | `gold_buy`           | `buy_date`                    |
| `gold_assets` where `sold_at IS NOT NULL` | `gold_sell`          | `sold_at`                     |
| `savings_accounts`                        | `savings`            | `start_date`                  |
| `monthly_actuals` — current month         | `income` / `expense` | `YYYY-MM-01` (first of month) |
| `monthly_actuals` — previous month        | `income` / `expense` | `YYYY-MM-01` (first of month) |

Income/expense detail items have no individual timestamp; the first day of their month is used as a sort proxy.

### Unified type (defined in `src/types/transactions.ts`)

```ts
export type TxKind =
  | "income"
  | "expense"
  | "gold_buy"
  | "gold_sell"
  | "savings";

export interface RecentTx {
  kind: TxKind;
  label: string; // e.g. "Lương Chồng", "SJC 1 chỉ", "VCB 6 tháng"
  amount: number; // VND, always positive
  date: string; // ISO date "YYYY-MM-DD"
  note?: string | null;
}
```

### Assembly logic (in `page.tsx`)

1. Fetch `getAllGoldAssets` (new query — same as `getActiveGoldAssets` but without the `sold_at IS NULL` filter) alongside existing fetches using `Promise.all`.
2. Fetch `monthly_actuals` for current month (already fetched) **and** previous month (new fetch).
3. Map each source into `RecentTx[]`:
   - Gold buy: `label = "${pos.brand_name} ${pos.quantity} chỉ"`, `amount = pos.quantity × pos.buy_price_per_chi`
   - Gold sell: `label = "${pos.brand_name} ${pos.sold_quantity} chỉ"`, `amount = pos.sold_quantity × pos.sell_price_per_chi`
   - Savings: `label = "${account.bank_name}${account.account_name ? ' · ' + account.account_name : ''}"`, `amount = account.principal`
   - Income detail: `label = detail.type`, `amount = detail.amount`
   - Expense detail: `label = detail.type`, `amount = detail.amount`
4. Merge all arrays, sort descending by `date`, slice top **8**.
5. Pass as `recentTxs: RecentTx[]` prop to `DashboardClient`.

### New server query needed

Add `cachedGetAllGoldAssets(userId)` to `server-queries.ts` — identical to `cachedGetActiveGoldAssets` but without `.is("sold_at", null)`.

Also add `cachedGetMonthlyActual` call for `(year, prevMonth)` — reuse existing helper.

---

## UI Component

**New file:** `src/app/(protected)/dashboard/components/RecentTransactions.tsx`

### Layout

```
GIAO DỊCH GẦN ĐÂY          (section heading, same style as stat tile labels)

[icon] Lương Chồng           +15 Tr đ    01/03
[icon] Ăn uống / Đi chợ     −3,5 Tr đ   01/03
[icon] SJC 2 chỉ (mua)      −17 Tr đ    15/02
...
```

Each row:

- **Left:** colored icon badge (16×16 circle or rounded square) + label text
- **Right:** amount (colored) + date (`dd/MM`)

No card border around individual rows — plain list with `divide-y divide-border`.

If `recentTxs` is empty: show a single muted line "Chưa có giao dịch nào".

### Icon & color legend

| Kind        | Icon char | Badge bg                | Amount color           |
| ----------- | --------- | ----------------------- | ---------------------- |
| `income`    | `↑`       | `bg-status-positive/20` | `text-status-positive` |
| `expense`   | `↓`       | `bg-status-negative/20` | `text-status-negative` |
| `gold_buy`  | `✦`       | `bg-accent/20`          | `text-accent`          |
| `gold_sell` | `✦`       | `bg-accent/20`          | `text-status-positive` |
| `savings`   | `⬡`       | `bg-[#6B7FD7]/20`       | `text-[#6B7FD7]`       |

Amount prefix: `+` for income/gold_sell/savings, `−` for expense/gold_buy.

### Date format

Use `dd/MM` (e.g. `31/03`). No year shown to save space.

---

## Files Changed

| File                                                              | Change                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| `src/types/transactions.ts`                                       | New — `TxKind` and `RecentTx` types                      |
| `src/lib/services/gold.ts`                                        | Add `getAllGoldAssets` (no sold_at filter)               |
| `src/lib/server-queries.ts`                                       | Add `cachedGetAllGoldAssets`                             |
| `src/app/(protected)/dashboard/page.tsx`                          | Fetch all sources, assemble `RecentTx[]`, pass to client |
| `src/app/(protected)/dashboard/DashboardClient.tsx`               | Accept `recentTxs` prop, render `<RecentTransactions />` |
| `src/app/(protected)/dashboard/components/RecentTransactions.tsx` | New component                                            |

---

## Out of Scope

- Pagination or "Xem thêm" link
- Click-through navigation from individual rows
- Real-time updates (uses same 30s cache as rest of dashboard)
