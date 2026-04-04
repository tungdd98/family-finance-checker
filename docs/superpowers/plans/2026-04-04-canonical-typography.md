# Canonical Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all `text-[Npx]` arbitrary size values with Tailwind canonical classes and remove the `type-*` design system layer from `globals.css`.

**Architecture:** Pure find-and-replace across `src/app/` and `src/components/`. No logic changes. Globals.css typography block deleted; one component (TabBar) expanded from `type-tab-label` to equivalent utilities. All remaining `text-[Npx]` replaced via sed.

**Tech Stack:** sed (in-place file editing), grep (verification)

---

## Sed Patterns Reference

Used across all tasks:

```bash
sed -i '' \
  -e 's/text-\[8px\]/text-xs/g' \
  -e 's/text-\[9px\]/text-xs/g' \
  -e 's/text-\[10px\]/text-xs/g' \
  -e 's/text-\[11px\]/text-xs/g' \
  -e 's/text-\[13px\]/text-sm/g' \
  -e 's/text-\[15px\]/text-base/g' \
  -e 's/text-\[18px\]/text-lg/g' \
  -e 's/text-\[20px\]/text-xl/g' \
  -e 's/text-\[22px\]/text-2xl/g' \
  -e 's/text-\[26px\]/text-2xl/g' \
  -e 's/text-\[28px\]/text-3xl/g' \
  -e 's/text-\[36px\]/text-4xl/g' \
  <file>
```

**Note:** `text-[#color]` values (e.g. `text-[#6B7FD7]`) are NOT affected — the patterns only match digit-starting values.

---

## Task 1: Remove type-\* from globals.css

**Files:**

- Modify: `src/app/globals.css`

- [ ] **Step 1: Verify the typography block exists**

```bash
grep -n "type-" src/app/globals.css
```

Expected: lines 160–193 listing `.type-large-title`, `.type-metric-value`, `.type-featured-stat`, `.type-card-title`, `.type-body`, `.type-callout`, `.type-section-label`, `.type-card-label`, `.type-tab-label`.

- [ ] **Step 2: Delete the typography block**

```bash
sed -i '' '156,195d' src/app/globals.css
```

- [ ] **Step 3: Verify clean**

```bash
grep -n "type-" src/app/globals.css
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "style: remove type-* design system classes from globals.css"
```

---

## Task 2: Fix TabBar.tsx (expand type-tab-label)

**Files:**

- Modify: `src/components/common/TabBar.tsx`

- [ ] **Step 1: Verify current usage**

```bash
grep -n "type-tab-label" src/components/common/TabBar.tsx
```

Expected: line ~77 with `className={\`type-tab-label \${...}\`}`.

- [ ] **Step 2: Replace type-tab-label with utilities**

In `src/components/common/TabBar.tsx`, find:

```tsx
className={`type-tab-label ${isActive ? "font-semibold text-[#111111]" : "text-foreground-muted font-medium"}`}
```

Replace with:

```tsx
className={`text-xs font-medium uppercase ${isActive ? "font-semibold text-[#111111]" : "text-foreground-muted font-medium"}`}
```

- [ ] **Step 3: Verify no more type-\* references**

```bash
grep -rn "type-" src/components/ src/app/ --include="*.tsx"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/common/TabBar.tsx
git commit -m "style: expand type-tab-label to utility classes in TabBar"
```

---

## Task 3: Canonicalize text sizes in src/components/

**Files:**

- Modify: all `.tsx` in `src/components/`

- [ ] **Step 1: Verify violations exist**

```bash
grep -rn 'text-\[[0-9]' src/components/ --include="*.tsx"
```

Expected: matches in `DeleteConfirmDialog.tsx`, `Badge.tsx`, `MetricCard.tsx`, `ResponsiveModal.tsx`, `ResponsiveDatePicker.tsx`, `OptionPicker.tsx`, `Sidebar.tsx`, `NotificationBell.tsx`, `button.tsx`, `input.tsx`.

- [ ] **Step 2: Apply replacements**

```bash
find src/components -name "*.tsx" -exec sed -i '' \
  -e 's/text-\[8px\]/text-xs/g' \
  -e 's/text-\[9px\]/text-xs/g' \
  -e 's/text-\[10px\]/text-xs/g' \
  -e 's/text-\[11px\]/text-xs/g' \
  -e 's/text-\[13px\]/text-sm/g' \
  -e 's/text-\[15px\]/text-base/g' \
  -e 's/text-\[18px\]/text-lg/g' \
  -e 's/text-\[20px\]/text-xl/g' \
  -e 's/text-\[22px\]/text-2xl/g' \
  -e 's/text-\[26px\]/text-2xl/g' \
  -e 's/text-\[28px\]/text-3xl/g' \
  -e 's/text-\[36px\]/text-4xl/g' \
  {} \;
```

- [ ] **Step 3: Verify clean**

```bash
grep -rn 'text-\[[0-9]' src/components/ --include="*.tsx"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/
git commit -m "style: canonicalize text sizes in src/components/"
```

---

## Task 4: Canonicalize text sizes in src/app/

**Files:**

- Modify: all `.tsx` in `src/app/`

- [ ] **Step 1: Verify violations exist**

```bash
grep -rn 'text-\[[0-9]' src/app/ --include="*.tsx"
```

Expected: matches across auth, assets, dashboard, savings, market, settings, gold, goals, cashflow, design-system.

- [ ] **Step 2: Apply replacements**

```bash
find src/app -name "*.tsx" -exec sed -i '' \
  -e 's/text-\[8px\]/text-xs/g' \
  -e 's/text-\[9px\]/text-xs/g' \
  -e 's/text-\[10px\]/text-xs/g' \
  -e 's/text-\[11px\]/text-xs/g' \
  -e 's/text-\[13px\]/text-sm/g' \
  -e 's/text-\[15px\]/text-base/g' \
  -e 's/text-\[18px\]/text-lg/g' \
  -e 's/text-\[20px\]/text-xl/g' \
  -e 's/text-\[22px\]/text-2xl/g' \
  -e 's/text-\[26px\]/text-2xl/g' \
  -e 's/text-\[28px\]/text-3xl/g' \
  -e 's/text-\[36px\]/text-4xl/g' \
  {} \;
```

- [ ] **Step 3: Verify clean**

```bash
grep -rn 'text-\[[0-9]' src/app/ --include="*.tsx"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "style: canonicalize text sizes in src/app/"
```

---

## Task 5: Final verification

- [ ] **Step 1: Full scan — no arbitrary text sizes**

```bash
grep -rn 'text-\[[0-9]' src/ --include="*.tsx"
```

Expected: **no output**.

- [ ] **Step 2: Confirm color arbitraries are untouched**

```bash
grep -rn 'text-\[#' src/ --include="*.tsx" | head -5
```

Expected: results present (e.g. `text-[#6B7FD7]`, `text-[#111111]`) — these are color values and must remain.

- [ ] **Step 3: Confirm globals.css is clean**

```bash
grep -n "type-\|text-\[[0-9]" src/app/globals.css
```

Expected: no output.

- [ ] **Step 4: Run dev server to visually verify**

```bash
npm run dev
```

Navigate to dashboard, market, gold, savings, and settings pages. All labels and text should be readable — font sizes are intentionally 1–4px larger than before. Tab bar labels should still display correctly.
