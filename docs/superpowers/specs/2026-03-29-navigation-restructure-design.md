# Navigation Restructure Design

**Date:** 2026-03-29
**Status:** Approved
**Scope:** Bottom navigation, header, new Tài Sản hub page, new Thu/Chi page, Goals page cleanup

---

## Problem

The current navigation does not scale:

- Bottom nav has 5 tabs: Dashboard · Vàng · Thị trường · Tiết kiệm · Cài đặt
- Adding Coin and Chứng khoán would push it to 7 tabs — too many for mobile
- Goals is hidden behind a trophy icon in the header — undersells its importance
- Monthly income/expense entry (MonthlyActualSheet) lives inside the Goals page, which conflates data entry with goal planning

---

## Approved Design

### Header

| Slot        | Before                         | After                               |
| ----------- | ------------------------------ | ----------------------------------- |
| Left        | Greeting text                  | Greeting text (unchanged)           |
| Right icons | 🔔 Bell · 🏆 Trophy (→ /goals) | 🔔 Bell · ⚙️ Settings (→ /settings) |

The trophy icon is removed. Goals now has a dedicated bottom nav tab and no longer needs a header shortcut. Settings moves from bottom nav to a header icon — it is rarely used and does not need prime nav real estate.

### Bottom Navigation

| Position | Before     | After                  |
| -------- | ---------- | ---------------------- |
| 1        | Dashboard  | Dashboard              |
| 2        | Vàng       | **Tài Sản** (new hub)  |
| 3        | Thị Trường | Thị Trường             |
| 4        | Tiết Kiệm  | **Thu/Chi** (new page) |
| 5        | Cài Đặt    | **Mục Tiêu**           |

---

## New Pages

### Tài Sản Hub (`/assets`)

Replaces the dedicated Vàng tab. A hub page aggregating all asset types.

**Layout:**

1. **Total banner** — tổng tài sản (net worth across all asset types)
2. **Asset grid** — 2×2 cards, one per asset type:
   - Vàng → navigates to `/gold`
   - Tiết Kiệm → navigates to `/savings`
   - Coin → "Sắp ra mắt" placeholder (disabled)
   - Chứng Khoán → "Sắp ra mắt" placeholder (disabled)

Each card shows the asset name and current total value. When Coin and Chứng Khoán are implemented, their cards activate without any nav changes.

Thị Trường (gold market prices) remains its own tab — it is reference data, not an asset management screen.

### Thu/Chi Page (`/cashflow`)

Replaces the MonthlyActualSheet that previously lived inside the Goals page. Thu/Chi becomes a first-class feature: the canonical place to record actual monthly income and expenses.

**Layout:**

1. **Month selector** — ‹ Tháng N · YYYY › — navigate between months
2. **Summary row** — three cards: Tổng Thu (green) · Tổng Chi (red) · Thặng Dư (gold)
3. **Items list** — accordion rows, same UX as the existing MonthlyActualSheet (IncomeRow / ExpenseRow components with auto-expand and OptionPicker)
4. **Add button** — opens a new row in the accordion

**Data:** Uses the existing `monthly_actuals` table. No schema changes required.

---

## Modified Pages

### Goals Page (`/goals`)

No layout changes. The page retains:

- BannerCard (current assets summary)
- GoalCard (goal progress + projection)
- CashFlowCard (household cash flow **baseline** — expected monthly income/expense used for projection)

The GoalCard's "log monthly actual" action now links/navigates to `/cashflow` (the new Thu/Chi tab) instead of opening the MonthlyActualSheet inline. The MonthlyActualSheet component is retired.

**Distinction:**

- CashFlow baseline (in Goals) = planned/expected monthly figures → drives projection formula
- Monthly actuals (in Thu/Chi) = real figures recorded each month → also feeds projection as override when available

### Settings Page (`/settings`)

No content changes. Only its navigation entry point changes — from bottom nav tab to header icon.

### Existing Asset Pages (`/gold`, `/savings`)

No changes. They remain navigable from the Tài Sản hub cards (and from any internal links).

---

## Data & DB

No database schema changes required. This is a pure frontend restructuring:

- `monthly_actuals` table — read/written by the new `/cashflow` page instead of the Goals sheet
- `cash_flows` table — unchanged, still read/written by Goals
- `goals` table — unchanged

---

## What Is Not In Scope

- Implementing Coin or Chứng Khoán features (hub cards are placeholders)
- Redesigning individual asset pages (Vàng, Tiết Kiệm, Thị Trường)
- Redesigning the Goals page content
- Automated DB migrations
