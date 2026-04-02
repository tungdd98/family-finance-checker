# Market Refresh Button — Design Spec

**Date:** 2026-04-02
**Status:** Approved

## Overview

Add a manual refresh button to the Thị Trường (Market) page so users can fetch the latest gold prices on demand without reloading the entire page.

## User Experience

- Button appears in the top-right of the page header, aligned with the "THỊ TRƯỜNG VÀNG" title
- While refreshing: list fades to `opacity-40` with `pointer-events-none`, button icon spins
- After success: timestamp next to the icon updates to show "Cập nhật lúc HH:mm"
- No toast or modal — the timestamp change is the confirmation signal

## Architecture

### Approach

Client-side fetch within `MarketClient`. All layout (title, description, refresh button, price list) moves into `MarketClient` so state can be shared without prop-drilling through a Server Component boundary.

`page.tsx` becomes a thin wrapper that only fetches `initialPrices` and renders `<MarketClient initialPrices={prices} />`.

### State

Two new state values added to `MarketClient`:

| State          | Type           | Purpose                           |
| -------------- | -------------- | --------------------------------- |
| `isRefreshing` | `boolean`      | Controls opacity + spin animation |
| `lastUpdated`  | `Date \| null` | Drives the timestamp display      |

### Refresh Flow

1. User taps refresh button
2. `isRefreshing = true` → list dims, icon spins
3. `fetch("/api/gold/prices")` called
4. On success: `setPrices(data)`, `setLastUpdated(new Date())`
5. `isRefreshing = false` (in finally block)

### Error Handling

Silent failure — if the fetch errors, `isRefreshing` resets to false and existing prices remain unchanged. No error UI needed for this feature.

## Component Structure

```
page.tsx (Server Component)
└── MarketClient (Client Component)
    ├── Header row (title + refresh button + timestamp)
    ├── World Gold Card (opacity controlled by isRefreshing)
    └── Local Prices Table (opacity controlled by isRefreshing)
```

## Visual Spec

- **Refresh icon:** `RefreshCw` from lucide-react, size 14
- **Spin:** `animate-spin` class applied when `isRefreshing === true`
- **Timestamp:** `text-foreground-muted text-[10px]` — format `HH:mm`
- **List during refresh:** `opacity-40 pointer-events-none transition-opacity duration-200`
- **Button:** No border, no background — icon + timestamp only, consistent with app's minimal chrome style

## Files Changed

| File                                          | Change                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| `src/app/(protected)/market/page.tsx`         | Remove header layout, keep only fetch + `<MarketClient>`               |
| `src/app/(protected)/market/MarketClient.tsx` | Add header layout, `isRefreshing`/`lastUpdated` state, refresh handler |
