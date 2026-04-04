# Tailwind Class Canonicalization Design

**Date:** 2026-04-04  
**Scope:** `src/app/` — all `.tsx` files

---

## Problem

Two categories of non-canonical Tailwind usage exist across all pages and feature components:

1. **Arbitrary text sizes with canonical equivalents** — `text-[12px]`, `text-[14px]`, `text-[16px]` are used when Tailwind provides exact canonical class names (`text-xs`, `text-sm`, `text-base`).

2. **Tracking classes** — `tracking-*` (both arbitrary `tracking-[Npx]` and canonical like `tracking-tight`, `tracking-wider`, `tracking-widest`) are scattered across ~15 files with inconsistent values. The design decision is to remove letter-spacing from all elements and rely on the default (`tracking-normal`).

---

## Design

### Part 1 — Text size canonicalization

Replace arbitrary px text sizes that have exact Tailwind canonical equivalents:

| Remove        | Replace with | Tailwind value  |
| ------------- | ------------ | --------------- |
| `text-[12px]` | `text-xs`    | 0.75rem = 12px  |
| `text-[14px]` | `text-sm`    | 0.875rem = 14px |
| `text-[16px]` | `text-base`  | 1rem = 16px     |

**Unchanged** (no canonical equivalent): `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[13px]`, `text-[15px]`, `text-[20px]`, `text-[26px]`, `text-[28px]`, `text-[30px]`, `text-[36px]`, `text-[42px]`

### Part 2 — Remove all tracking classes

Delete every `tracking-*` occurrence in `src/app/`. No replacement — elements fall back to CSS default `letter-spacing: normal`.

Includes:

- Arbitrary: `tracking-[0.5px]`, `tracking-[1px]`, `tracking-[1.5px]`, `tracking-[2px]`, `tracking-[-0.5px]`, `tracking-[-1px]`, `tracking-[0.2px]`, etc.
- Canonical: `tracking-tight`, `tracking-wider`, `tracking-widest`, `tracking-normal` (explicit)

**Note:** `tracking-normal` in `placeholder:tracking-normal` should also be removed (placeholder inherits normal by default).

---

## Scope

Files affected (all in `src/app/`):

- `(auth)/login/page.tsx`
- `(protected)/settings/SettingsForm.tsx`
- `(protected)/settings/ResetDataSection.tsx`
- `(protected)/savings/SavingsClient.tsx`
- `(protected)/savings/components/SavingsActionSheet.tsx`
- `(protected)/savings/components/BankPicker.tsx`
- `(protected)/savings/components/AddEditSavingsSheet.tsx`
- `(protected)/savings/components/SavingsCard.tsx`
- `(protected)/goals/GoalsClient.tsx`
- `(protected)/goals/components/GoalCard.tsx`
- `(protected)/goals/components/CashFlowSheet.tsx`
- `(protected)/goals/components/BannerCard.tsx`
- `(protected)/cashflow/CashflowClient.tsx`
- `(protected)/cashflow/components/IncomeTab.tsx`
- `(protected)/cashflow/components/AllocationTab.tsx`
- `(protected)/cashflow/components/ExpenseTab.tsx`
- `(protected)/dashboard/DashboardClient.tsx`
- `(protected)/dashboard/components/HeroCard.tsx`
- `(protected)/dashboard/components/StatTile.tsx`
- `(protected)/dashboard/components/RecentTransactions.tsx`
- `(protected)/gold/components/BrandPicker.tsx`
- Plus any additional files discovered during implementation

---

## Out of Scope

- `src/components/` — covered by separate components refactor
- `globals.css` — `.type-*` utility classes keep their tracking values (they are the design system definition)
- `text-[Npx]` values with no canonical equivalent — left as-is
