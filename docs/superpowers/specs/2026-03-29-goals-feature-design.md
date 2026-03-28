# Goals Feature Design

**Date:** 2026-03-29
**Scope:** Single financial goal with automatic progress tracking, monthly cash flow baseline, monthly actuals logging, and time-to-goal projection. Multi-goal support is explicitly out of scope for this phase.

---

## 1. Database

### `goals`

| Column          | Type                   | Notes                                                             |
| --------------- | ---------------------- | ----------------------------------------------------------------- |
| `id`            | `uuid` PK              |                                                                   |
| `user_id`       | `uuid` FK → auth.users | unique — only 1 active goal enforced at DB level via unique index |
| `name`          | `text`                 | e.g. "Mua nhà"                                                    |
| `emoji`         | `text`                 | e.g. "🏠"                                                         |
| `target_amount` | `bigint`               | VND                                                               |
| `deadline`      | `date`                 | nullable — optional target date                                   |
| `note`          | `text`                 | nullable                                                          |
| `is_completed`  | `boolean`              | default false — manually marked by user                           |
| `created_at`    | `timestamptz`          |                                                                   |
| `updated_at`    | `timestamptz`          | auto-updated via trigger                                          |

**Constraint:** `UNIQUE (user_id)` — each user has at most one goal row.

### `household_cash_flow`

| Column                | Type                   | Notes                                  |
| --------------------- | ---------------------- | -------------------------------------- |
| `id`                  | `uuid` PK              |                                        |
| `user_id`             | `uuid` FK → auth.users | unique — one record per user           |
| `avg_monthly_income`  | `bigint`               | VND — baseline estimate for projection |
| `avg_monthly_expense` | `bigint`               | VND — baseline estimate for projection |
| `created_at`          | `timestamptz`          |                                        |
| `updated_at`          | `timestamptz`          | auto-updated via trigger               |

**Derived:** `avg_monthly_surplus = avg_monthly_income - avg_monthly_expense`

### `monthly_actuals`

| Column           | Type                   | Notes     |
| ---------------- | ---------------------- | --------- |
| `id`             | `uuid` PK              |           |
| `user_id`        | `uuid` FK → auth.users |           |
| `year`           | `integer`              | e.g. 2026 |
| `month`          | `integer`              | 1–12      |
| `actual_income`  | `bigint`               | VND       |
| `actual_expense` | `bigint`               | VND       |
| `note`           | `text`                 | nullable  |
| `created_at`     | `timestamptz`          |           |

**Constraint:** `UNIQUE (user_id, year, month)` — one record per user per month.

**Derived:** `actual_surplus = actual_income - actual_expense`

### RLS policies (all three tables)

```sql
-- Users can only read/write their own rows
ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner" ON <table>
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## 2. Projection Formula

```
current_assets   = total_savings_principal
                 + gold_portfolio_value (live price × remaining qty)
                 + initial_cash_balance            -- from user_settings
remaining        = target_amount - current_assets
months_to_goal   = CEIL(remaining / avg_monthly_surplus)
estimated_date   = today + months_to_goal months
```

- If `current_assets >= target_amount`: goal is effectively reached — show 100% and a congratulations state.
- If `avg_monthly_surplus <= 0`: projection is not shown; display a warning "Thặng dư âm — không thể dự báo".
- Projection is recalculated client-side on every page load using fresh data; it is never stored in DB.

---

## 3. Routes & Pages

Single route: `/goals`

All actions (create goal, edit goal, edit cash flow, log monthly actual) use bottom sheets on the same page — no sub-routes.

### `/goals` page layout

#### State A — No goal yet (empty state)

- Centered empty state card with emoji 🎯, headline, subtitle
- "Đặt mục tiêu" CTA button (gold, full-width on card)
- Cash flow settings card below (dimmed), with "Cài đặt ngay →" link

#### State B — Goal exists

**Page header:** Title "🎯 Mục tiêu" + "Chỉnh sửa" ghost button (gold border/text, top-right)

**Banner card** (gold gradient border):

- Label: "TỔNG QUAN TÀI CHÍNH"
- Left stat: "Tài sản hiện tại" — computed total portfolio (VND)
- Right stat: "Thặng dư TB/tháng" — avg_monthly_surplus (green)

**Goal card** (main):

- Header row: emoji + name + target amount | big % (30px, gold) + "hoàn thành"
- Progress bar (8px height, gold gradient fill)
- Amounts row: current amount (gold) | "Còn thiếu X ₫" (muted)
- Projection pill: "⏱ Dự kiến đạt T10/2029 (~43 tháng)"
- Divider
- Monthly section: "Tháng M/YYYY" label
  - Thu nhập thực tế
  - Chi tiêu thực tế
  - Thặng dư tháng này (green if positive)
  - So với TB dự kiến (green/red delta with ↑↓)
  - If no monthly actual logged yet: "Chưa cập nhật tháng này" with "+ Cập nhật" tap target

**Cash flow settings card** (below goal card):

- Label: "CÀI ĐẶT THU CHI TRUNG BÌNH"
- Rows: Thu nhập TB/tháng | Chi tiêu TB/tháng | Thặng dư dự kiến (green)
- "Chỉnh sửa →" link (gold, right-aligned)

---

## 4. Bottom Sheets

### Set / Edit Goal sheet

Triggered by "Đặt mục tiêu" button (empty state) or "Chỉnh sửa" button (header).

Fields:
| Field | Input | Validation |
|---|---|---|
| Tên mục tiêu | Text input | Required, max 50 chars |
| Emoji | Emoji picker or text input | Required, default 🎯 |
| Số tiền mục tiêu | Number input (VND format) | Required, > 0 |
| Ngày mục tiêu | Date picker | Optional |
| Ghi chú | Textarea | Optional |

On submit: upsert `goals` row (insert or update by `user_id`).

### Edit Cash Flow sheet

Triggered by "Chỉnh sửa →" in cash flow card or "Cài đặt ngay →" in empty state.

Fields:
| Field | Input | Validation |
|---|---|---|
| Thu nhập TB/tháng | Number input (VND format) | Required, ≥ 0 |
| Chi tiêu TB/tháng | Number input (VND format) | Required, ≥ 0 |

Shows live preview: "Thặng dư dự kiến: X ₫" as user types.
On submit: upsert `household_cash_flow` row.

### Log Monthly Actual sheet

Triggered by "+ Cập nhật" tap on the monthly section of the goal card.
Pre-fills `year` and `month` to current month.

Fields:
| Field | Input | Validation |
|---|---|---|
| Thu nhập tháng M/YYYY | Number input (VND format) | Required, ≥ 0 |
| Chi tiêu tháng M/YYYY | Number input (VND format) | Required, ≥ 0 |
| Ghi chú | Textarea | Optional |

Shows live preview: "Thặng dư: X ₫" as user types.
On submit: upsert `monthly_actuals` for `(user_id, year, month)`.

---

## 5. Service Layer (`src/lib/services/goals.ts`)

```ts
export interface Goal { ... }           // mirrors DB columns
export interface HouseholdCashFlow { ... }
export interface MonthlyActual { ... }

// Computed, never stored
export interface GoalProjection {
  currentAssets: number
  remaining: number
  monthsToGoal: number | null          // null if surplus <= 0
  estimatedDate: Date | null
  progressPct: number                  // capped at 100
}

export async function getGoal(supabase): Promise<Goal | null>
export async function upsertGoal(supabase, input): Promise<void>
export async function getCashFlow(supabase): Promise<HouseholdCashFlow | null>
export async function upsertCashFlow(supabase, input): Promise<void>
export async function getMonthlyActual(supabase, year, month): Promise<MonthlyActual | null>
export async function upsertMonthlyActual(supabase, input): Promise<void>
export function calcProjection(goal, cashFlow, currentAssets): GoalProjection
```

`calcProjection` is a pure function — no async, no side effects. Tested in unit tests.

---

## 6. Validation Schemas (`src/lib/validations/goals.ts`)

```ts
GoalInput; // name, emoji, target_amount, deadline?, note?
CashFlowInput; // avg_monthly_income, avg_monthly_expense
MonthlyActualInput; // year, month, actual_income, actual_expense, note?
```

All use Vietnamese error messages consistent with existing schemas.

---

## 7. Server Actions (`src/app/actions/goals.ts`)

```ts
export async function saveGoal(input: GoalInput);
export async function saveCashFlow(input: CashFlowInput);
export async function saveMonthlyActual(input: MonthlyActualInput);
```

Pattern: validate with zod → call service → `revalidatePath("/goals")` → return `{ success, error }`.

---

## 8. Page Architecture

```
src/app/(protected)/goals/
├── page.tsx                    ← RSC: fetch goal + cash flow + monthly actual + portfolio totals
├── GoalsClient.tsx             ← CSC: renders all UI, manages sheet open/close state
└── components/
    ├── GoalCard.tsx            ← Goal card with progress, projection, monthly section
    ├── BannerCard.tsx          ← Tổng quan tài chính banner
    ├── CashFlowCard.tsx        ← Cài đặt thu chi card
    ├── GoalSheet.tsx           ← Set/Edit goal bottom sheet
    ├── CashFlowSheet.tsx       ← Edit cash flow bottom sheet
    └── MonthlyActualSheet.tsx  ← Log monthly actual bottom sheet
```

`page.tsx` fetches in parallel: `getGoal`, `getCashFlow`, `getMonthlyActual(currentYear, currentMonth)`, savings total, gold portfolio value (no live price fetch needed — use buy price as fallback if live unavailable). Passes all as props to `GoalsClient`.

---

## 9. Dashboard Integration

Add a **Goals card** to the dashboard summary (below existing cards):

- Shows goal name + emoji, progress bar, % complete, projection date
- If no goal set: shows "Chưa có mục tiêu" with link to /goals

---

## 10. Design System Tokens

Follows existing "Brutalist Luxury" system:

| Element           | Value                                                |
| ----------------- | ---------------------------------------------------- |
| Background        | `bg-[#111111]`                                       |
| Surface card      | `bg-[#1C1C1C]`                                       |
| Gold accent       | `text-[#D4AF37]`, `bg-[#D4AF37]`                     |
| Positive delta    | `text-green-500`                                     |
| Negative delta    | `text-red-400`                                       |
| Muted text        | `text-[#666]`, `text-[#888]`                         |
| Progress bar bg   | `bg-[#2a2a2a]`                                       |
| Progress bar fill | gradient `from-[#D4AF37] to-[#f0d060]`               |
| Font              | Space Grotesk (existing)                             |
| Spacing           | Tailwind canonical scale only                        |
| Bottom sheets     | Same `Sheet` component pattern as Savings/Gold pages |

---

## 11. Out of Scope

- Multiple simultaneous goals (UI enforces 1; DB allows future expansion)
- Push notifications / reminders
- Goal categories or tags
- Historical portfolio snapshots (projection uses current snapshot only)
- Sharing goals between separate Supabase accounts
