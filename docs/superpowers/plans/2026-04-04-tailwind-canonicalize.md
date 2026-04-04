# Tailwind Class Canonicalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace arbitrary text-size classes with canonical Tailwind equivalents and remove all tracking-\* classes from `src/app/`.

**Architecture:** Pure find-and-replace across 28 files — no logic changes, no component restructuring. Each task covers one feature group: verify violations exist, apply sed replacements, verify clean, commit.

**Tech Stack:** sed (in-place file editing), grep (verification)

---

## Sed Patterns Reference

These patterns are used across all tasks:

```bash
# Text size replacements
sed -i '' 's/text-\[12px\]/text-xs/g' <file>
sed -i '' 's/text-\[14px\]/text-sm/g' <file>
sed -i '' 's/text-\[16px\]/text-base/g' <file>

# Tracking removal (covers all forms found in codebase)
sed -i '' \
  -e 's/ tracking-\[[-0-9.]*px\]//g' \
  -e 's/ tracking-\[[-0-9.]*\]//g' \
  -e 's/ tracking-wider//g' \
  -e 's/ tracking-widest//g' \
  -e 's/ tracking-tight//g' \
  -e 's/ placeholder:tracking-normal//g' \
  <file>
```

---

## Task 1: Auth + Layout

**Files:**

- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(protected)/layout.tsx`

- [ ] **Step 1: Verify violations exist**

```bash
grep -n "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(auth\)/login/page.tsx \
  src/app/\(protected\)/layout.tsx
```

Expected: lines containing `tracking-[-1px]`, `tracking-[2px]`, `tracking-[1.5px]` in login; `tracking-[1px]` in layout; `text-[12px]` in login.

- [ ] **Step 2: Apply text-size fixes**

```bash
sed -i '' 's/text-\[12px\]/text-xs/g' src/app/\(auth\)/login/page.tsx
```

- [ ] **Step 3: Remove tracking classes**

```bash
sed -i '' \
  -e 's/ tracking-\[[-0-9.]*px\]//g' \
  -e 's/ tracking-\[[-0-9.]*\]//g' \
  src/app/\(auth\)/login/page.tsx

sed -i '' \
  -e 's/ tracking-\[[-0-9.]*px\]//g' \
  src/app/\(protected\)/layout.tsx
```

- [ ] **Step 4: Verify clean**

```bash
grep -n "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(auth\)/login/page.tsx \
  src/app/\(protected\)/layout.tsx
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/login/page.tsx src/app/\(protected\)/layout.tsx
git commit -m "style: canonicalize tailwind classes in auth and layout"
```

---

## Task 2: Settings

**Files:**

- Modify: `src/app/(protected)/settings/SettingsForm.tsx`
- Modify: `src/app/(protected)/settings/ResetDataSection.tsx`

- [ ] **Step 1: Verify violations exist**

```bash
grep -n "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/settings/SettingsForm.tsx \
  src/app/\(protected\)/settings/ResetDataSection.tsx
```

Expected: ~15 lines with tracking, text-[12px], text-[14px], text-[16px].

- [ ] **Step 2: Apply text-size fixes**

```bash
sed -i '' \
  -e 's/text-\[12px\]/text-xs/g' \
  -e 's/text-\[14px\]/text-sm/g' \
  -e 's/text-\[16px\]/text-base/g' \
  src/app/\(protected\)/settings/SettingsForm.tsx

sed -i '' \
  -e 's/text-\[12px\]/text-xs/g' \
  -e 's/text-\[14px\]/text-sm/g' \
  -e 's/text-\[16px\]/text-base/g' \
  src/app/\(protected\)/settings/ResetDataSection.tsx
```

- [ ] **Step 3: Remove tracking classes**

```bash
sed -i '' \
  -e 's/ tracking-\[[-0-9.]*px\]//g' \
  -e 's/ tracking-\[[-0-9.]*\]//g' \
  -e 's/ placeholder:tracking-normal//g' \
  src/app/\(protected\)/settings/SettingsForm.tsx

sed -i '' \
  -e 's/ tracking-\[[-0-9.]*px\]//g' \
  -e 's/ tracking-\[[-0-9.]*\]//g' \
  -e 's/ placeholder:tracking-normal//g' \
  src/app/\(protected\)/settings/ResetDataSection.tsx
```

- [ ] **Step 4: Verify clean**

```bash
grep -n "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/settings/SettingsForm.tsx \
  src/app/\(protected\)/settings/ResetDataSection.tsx
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/settings/
git commit -m "style: canonicalize tailwind classes in settings"
```

---

## Task 3: Savings

**Files:**

- Modify: `src/app/(protected)/savings/SavingsClient.tsx`
- Modify: `src/app/(protected)/savings/components/SavingsActionSheet.tsx`
- Modify: `src/app/(protected)/savings/components/BankPicker.tsx`
- Modify: `src/app/(protected)/savings/components/AddEditSavingsSheet.tsx`
- Modify: `src/app/(protected)/savings/components/SavingsCard.tsx`

- [ ] **Step 1: Verify violations exist**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/savings/
```

Expected: ~10 lines across 5 files.

- [ ] **Step 2: Apply all fixes**

```bash
for f in \
  src/app/\(protected\)/savings/SavingsClient.tsx \
  src/app/\(protected\)/savings/components/SavingsActionSheet.tsx \
  src/app/\(protected\)/savings/components/BankPicker.tsx \
  src/app/\(protected\)/savings/components/AddEditSavingsSheet.tsx \
  src/app/\(protected\)/savings/components/SavingsCard.tsx; do
  sed -i '' \
    -e 's/text-\[12px\]/text-xs/g' \
    -e 's/text-\[14px\]/text-sm/g' \
    -e 's/text-\[16px\]/text-base/g' \
    -e 's/ tracking-\[[-0-9.]*px\]//g' \
    -e 's/ tracking-\[[-0-9.]*\]//g' \
    "$f"
done
```

- [ ] **Step 3: Verify clean**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/savings/
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/savings/
git commit -m "style: canonicalize tailwind classes in savings"
```

---

## Task 4: Goals

**Files:**

- Modify: `src/app/(protected)/goals/GoalsClient.tsx`
- Modify: `src/app/(protected)/goals/components/GoalCard.tsx`
- Modify: `src/app/(protected)/goals/components/CashFlowSheet.tsx`
- Modify: `src/app/(protected)/goals/components/BannerCard.tsx`
- Modify: `src/app/(protected)/goals/components/CashFlowCard.tsx`

- [ ] **Step 1: Verify violations exist**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/goals/
```

Expected: ~20 lines — heavy `text-[12px]` in GoalCard, tracking across all files.

- [ ] **Step 2: Apply all fixes**

```bash
for f in \
  src/app/\(protected\)/goals/GoalsClient.tsx \
  src/app/\(protected\)/goals/components/GoalCard.tsx \
  src/app/\(protected\)/goals/components/CashFlowSheet.tsx \
  src/app/\(protected\)/goals/components/BannerCard.tsx \
  src/app/\(protected\)/goals/components/CashFlowCard.tsx; do
  sed -i '' \
    -e 's/text-\[12px\]/text-xs/g' \
    -e 's/text-\[14px\]/text-sm/g' \
    -e 's/text-\[16px\]/text-base/g' \
    -e 's/ tracking-\[[-0-9.]*px\]//g' \
    -e 's/ tracking-\[[-0-9.]*\]//g' \
    "$f"
done
```

- [ ] **Step 3: Verify clean**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/goals/
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/goals/
git commit -m "style: canonicalize tailwind classes in goals"
```

---

## Task 5: Cashflow

**Files:**

- Modify: `src/app/(protected)/cashflow/CashflowClient.tsx`
- Modify: `src/app/(protected)/cashflow/components/IncomeTab.tsx`
- Modify: `src/app/(protected)/cashflow/components/AllocationTab.tsx`
- Modify: `src/app/(protected)/cashflow/components/ExpenseTab.tsx`

- [ ] **Step 1: Verify violations exist**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/cashflow/
```

Expected: ~15 lines — `text-[16px]` ×4 in CashflowClient, tracking across all.

- [ ] **Step 2: Apply all fixes**

```bash
for f in \
  src/app/\(protected\)/cashflow/CashflowClient.tsx \
  src/app/\(protected\)/cashflow/components/IncomeTab.tsx \
  src/app/\(protected\)/cashflow/components/AllocationTab.tsx \
  src/app/\(protected\)/cashflow/components/ExpenseTab.tsx; do
  sed -i '' \
    -e 's/text-\[12px\]/text-xs/g' \
    -e 's/text-\[14px\]/text-sm/g' \
    -e 's/text-\[16px\]/text-base/g' \
    -e 's/ tracking-\[[-0-9.]*px\]//g' \
    -e 's/ tracking-\[[-0-9.]*\]//g' \
    "$f"
done
```

- [ ] **Step 3: Verify clean**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/cashflow/
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/cashflow/
git commit -m "style: canonicalize tailwind classes in cashflow"
```

---

## Task 6: Dashboard

**Files:**

- Modify: `src/app/(protected)/dashboard/DashboardClient.tsx`
- Modify: `src/app/(protected)/dashboard/components/HeroCard.tsx`
- Modify: `src/app/(protected)/dashboard/components/StatTile.tsx`
- Modify: `src/app/(protected)/dashboard/components/RecentTransactions.tsx`

- [ ] **Step 1: Verify violations exist**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/dashboard/
```

Expected: ~15 lines — tracking-[-1px], tracking-[-0.5px], tracking-[0.5px], tracking-[1.5px] across files.

- [ ] **Step 2: Apply all fixes**

```bash
for f in \
  src/app/\(protected\)/dashboard/DashboardClient.tsx \
  src/app/\(protected\)/dashboard/components/HeroCard.tsx \
  src/app/\(protected\)/dashboard/components/StatTile.tsx \
  src/app/\(protected\)/dashboard/components/RecentTransactions.tsx; do
  sed -i '' \
    -e 's/ tracking-\[[-0-9.]*px\]//g' \
    -e 's/ tracking-\[[-0-9.]*\]//g' \
    "$f"
done
```

- [ ] **Step 3: Verify clean**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/dashboard/
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/dashboard/
git commit -m "style: canonicalize tailwind classes in dashboard"
```

---

## Task 7: Gold

**Files:**

- Modify: `src/app/(protected)/gold/GoldClient.tsx`
- Modify: `src/app/(protected)/gold/components/GoldSummaryHeader.tsx`
- Modify: `src/app/(protected)/gold/components/PositionCard.tsx`
- Modify: `src/app/(protected)/gold/components/BrandPicker.tsx`
- Modify: `src/app/(protected)/gold/components/AddEditAssetSheet.tsx`
- Modify: `src/app/(protected)/gold/components/PositionActionSheet.tsx`
- Modify: `src/app/(protected)/gold/components/SellAssetSheet.tsx`

- [ ] **Step 1: Verify violations exist**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/gold/
```

Expected: ~15 lines across 7 files.

- [ ] **Step 2: Apply all fixes**

```bash
for f in \
  src/app/\(protected\)/gold/GoldClient.tsx \
  src/app/\(protected\)/gold/components/GoldSummaryHeader.tsx \
  src/app/\(protected\)/gold/components/PositionCard.tsx \
  src/app/\(protected\)/gold/components/BrandPicker.tsx \
  src/app/\(protected\)/gold/components/AddEditAssetSheet.tsx \
  src/app/\(protected\)/gold/components/PositionActionSheet.tsx \
  src/app/\(protected\)/gold/components/SellAssetSheet.tsx; do
  sed -i '' \
    -e 's/text-\[12px\]/text-xs/g' \
    -e 's/text-\[14px\]/text-sm/g' \
    -e 's/text-\[16px\]/text-base/g' \
    -e 's/ tracking-\[[-0-9.]*px\]//g' \
    -e 's/ tracking-\[[-0-9.]*\]//g' \
    "$f"
done
```

- [ ] **Step 3: Verify clean**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/gold/
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/gold/
git commit -m "style: canonicalize tailwind classes in gold"
```

---

## Task 8: Market, Assets, Design System

**Files:**

- Modify: `src/app/(protected)/market/MarketClient.tsx`
- Modify: `src/app/(protected)/market/components/MarketTabs.tsx`
- Modify: `src/app/(protected)/market/components/CoinRow.tsx`
- Modify: `src/app/(protected)/assets/AssetsClient.tsx`
- Modify: `src/app/design-system/page.tsx`

- [ ] **Step 1: Verify violations exist**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/market/ \
  src/app/\(protected\)/assets/ \
  src/app/design-system/
```

Expected: ~15 lines — `tracking-wider` in MarketClient and MarketTabs, `tracking-[-0.3px]` in AssetsClient, `tracking-[3px]` in design-system.

- [ ] **Step 2: Apply all fixes**

```bash
for f in \
  src/app/\(protected\)/market/MarketClient.tsx \
  src/app/\(protected\)/market/components/MarketTabs.tsx \
  src/app/\(protected\)/market/components/CoinRow.tsx \
  src/app/\(protected\)/assets/AssetsClient.tsx \
  src/app/design-system/page.tsx; do
  sed -i '' \
    -e 's/text-\[12px\]/text-xs/g' \
    -e 's/text-\[14px\]/text-sm/g' \
    -e 's/text-\[16px\]/text-base/g' \
    -e 's/ tracking-\[[-0-9.]*px\]//g' \
    -e 's/ tracking-\[[-0-9.]*\]//g' \
    -e 's/ tracking-wider//g' \
    -e 's/ tracking-widest//g' \
    "$f"
done
```

- [ ] **Step 3: Verify clean**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/\(protected\)/market/ \
  src/app/\(protected\)/assets/ \
  src/app/design-system/
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/market/ src/app/\(protected\)/assets/ src/app/design-system/
git commit -m "style: canonicalize tailwind classes in market, assets, design-system"
```

---

## Task 9: Final verification

- [ ] **Step 1: Full codebase scan**

```bash
grep -rn "text-\[12px\]\|text-\[14px\]\|text-\[16px\]\|tracking-" \
  src/app/ --include="*.tsx"
```

Expected: **no output** (zero violations remaining).

- [ ] **Step 2: Check globals.css is untouched**

```bash
grep -n "tracking-" src/app/globals.css
```

Expected: `.type-*` classes still present — globals.css is out of scope.

- [ ] **Step 3: Run dev server to visually check**

```bash
npm run dev
```

Navigate to login, dashboard, cashflow, gold, and assets pages and confirm UI looks correct. Slight visual changes from removed letter-spacing are expected and acceptable.
