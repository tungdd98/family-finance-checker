# Dashboard Command Center — Design Spec

**Date:** 2026-03-30
**Status:** Approved
**Context:** Post-navigation-restructure dashboard redesign. Now that dedicated tabs exist for Tài Sản (`/assets`), Thu/Chi (`/cashflow`), Thị Trường (`/market`), and Mục Tiêu (`/goals`), the dashboard is redesigned as a "command center" — each section shows only the 2–3 most important numbers, with taps navigating to the relevant tab for detail.

---

## Overall Structure

The dashboard contains exactly two zones below the header:

1. **Unified Hero Card** — net worth + goal progress in a single card
2. **2×2 Stat Tile Grid** — four compact tiles (Vàng, Tiết Kiệm, Thu/Chi, Giá Vàng)

**Removed from dashboard:**

- `PortfolioChart` (donut chart) — moves to `/assets`
- `GoalsDashboardCard` (full goal card) — replaced by hero card
- Individual full-detail cards for savings and gold — live at `/assets`

---

## Unified Hero Card

Answers the primary user question: _"Where am I relative to my goal?"_

### Layout

```
┌─────────────────────────────────────┐
│  TỔNG TÀI SẢN          MỤC TIÊU    │
│  878 Triệu             61%          │
│  ████████████████░░░░░░░░░░░░░░░░  │
│  🏠 Mua nhà · 912/1.500 Tr   T12/2027 │
└─────────────────────────────────────┘
```

### Content

- **Top-left label:** "TỔNG TÀI SẢN" (small caps, subdued)
- **Top-right label:** "MỤC TIÊU" (small caps, subdued)
- **Bottom-left value:** Net worth in compact format (e.g. "878 Triệu") — white, large bold
- **Bottom-right value:** Goal progress % — gold, large bold
- **Progress bar:** fills to goal %, gold color
- **Footer row left:** emoji + goal name · current/target amounts (e.g. "🏠 Mua nhà · 912/1.500 Tr")
- **Footer row right:** Projected completion date in gold (e.g. "T12/2027")

### Edge Cases

- **No goal set:** Right side replaced with a "Đặt mục tiêu →" call-to-action link; progress bar hidden
- **No assets:** Hero card hidden entirely; show a brief welcome/empty state message instead

---

## 2×2 Stat Tile Grid

Four equal tiles in a two-column grid. All tiles are tappable and navigate to their respective tab.

### Tile 1 — Vàng (→ `/assets`)

| Element            | Value                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| Label              | VÀNG                                                                    |
| Primary            | Total gold value (e.g. "460,2 Tr")                                      |
| Secondary          | P&L % vs principal (e.g. "+39,25%"), green if positive, red if negative |
| Left border accent | Gold color                                                              |

### Tile 2 — Tiết Kiệm (→ `/assets`)

| Element            | Value                                                            |
| ------------------ | ---------------------------------------------------------------- |
| Label              | TIẾT KIỆM                                                        |
| Primary            | Total savings value including accrued interest (e.g. "417,6 Tr") |
| Secondary          | Number of accounts (e.g. "8 khoản"), blue/purple color           |
| Left border accent | Blue color                                                       |

### Tile 3 — Thu/Chi (→ `/cashflow`)

| Element   | Value                                                                |
| --------- | -------------------------------------------------------------------- |
| Label     | THU/CHI + abbreviated month (e.g. "THU/CHI T3")                      |
| Line 1    | ↑ income amount — green                                              |
| Line 2    | ↓ expense amount — red                                               |
| Line 3    | Net (= ±amount) — gold if positive, red if negative                  |
| Edge case | No data for current month: show "Chưa có dữ liệu" + "Bắt đầu nhập →" |

### Tile 4 — Giá Vàng (→ `/market`)

| Element   | Value                                     |
| --------- | ----------------------------------------- |
| Label     | GIÁ VÀNG                                  |
| Primary   | SJC price per lượng (e.g. "97,5 Tr")      |
| Sub-label | "mỗi lượng"                               |
| Secondary | % change today — green if up, red if down |

---

## Data Requirements

| Data                                 | Source                                                                                | Status                           |
| ------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------- |
| Gold total value + P&L               | `getGoldPositions` + live price                                                       | ✅ already fetched in dashboard  |
| Savings total (principal + interest) | `getSavingsAccounts`                                                                  | ✅ already fetched               |
| Primary goal + projection            | `getGoals`                                                                            | ✅ already fetched               |
| SJC market price + daily change      | `getMarketPrices`                                                                     | ✅ already fetched               |
| Current month cashflow summary       | `cachedGetMonthlyActual(userId, year, month)` — already exists in `server-queries.ts` | ⚠️ add to dashboard server query |

---

## Component Changes

### Deleted

- `GoalsDashboardCard.tsx` — replaced by `HeroCard`
- `PortfolioChart.tsx` — no longer used on dashboard

### New Components

**`HeroCard.tsx`**

```typescript
interface HeroCardProps {
  netWorth: number;
  goal: {
    name: string;
    current: number;
    target: number;
    emoji: string;
    projectedDate: string;
  } | null;
}
```

Renders the unified hero. If `goal` is null, shows net worth + "Đặt mục tiêu →" CTA.

**`StatTile.tsx`**

```typescript
interface StatTileProps {
  label: string;
  href: string;
  accentColor?: "gold" | "blue";
  children: React.ReactNode;
}
```

Reusable wrapper with border-left accent, tappable link, and consistent padding. The four dashboard tiles are built using this component.

### Modified

**`DashboardClient.tsx`** — replace current card layout with `HeroCard` + 2×2 grid of `StatTile` instances.

**`page.tsx` (server)** — add cashflow summary query for the current month alongside existing queries.

---

## Design Constraints

- Follow existing "Brutalist Luxury" design tokens (dark background, gold accents, bold condensed typography)
- No arbitrary Tailwind values — use canonical spacing scale
- Mobile-only layout (no desktop breakpoints needed)
- Layout padding provided by the protected layout (`px-7`) — do not add extra horizontal padding in page code
