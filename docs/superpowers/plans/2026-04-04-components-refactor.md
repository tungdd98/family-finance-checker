# Components Folder Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `src/components/` into three clearly-scoped folders (`ui/`, `common/`, `layout/`) with consistent PascalCase file naming and barrel exports.

**Architecture:** No logic changes — pure file renames and moves. `ui/` stays untouched (shadcn). `common/` files get renamed to PascalCase. A new `layout/` folder absorbs the four loose root/pc components. All consumer imports updated accordingly.

**Tech Stack:** Next.js App Router, TypeScript, git mv for rename tracking

---

## File Map

### Files being renamed (common/)

| From                                               | To                                               |
| -------------------------------------------------- | ------------------------------------------------ |
| `src/components/common/badge.tsx`                  | `src/components/common/Badge.tsx`                |
| `src/components/common/delete-confirm-dialog.tsx`  | `src/components/common/DeleteConfirmDialog.tsx`  |
| `src/components/common/metric-card.tsx`            | `src/components/common/MetricCard.tsx`           |
| `src/components/common/option-picker.tsx`          | `src/components/common/OptionPicker.tsx`         |
| `src/components/common/responsive-action-menu.tsx` | `src/components/common/ResponsiveActionMenu.tsx` |
| `src/components/common/responsive-date-picker.tsx` | `src/components/common/ResponsiveDatePicker.tsx` |
| `src/components/common/responsive-modal.tsx`       | `src/components/common/ResponsiveModal.tsx`      |
| `src/components/common/tab-bar.tsx`                | `src/components/common/TabBar.tsx`               |

### Files being modified

- `src/components/common/index.ts` — update barrel paths to PascalCase

### Files being moved to layout/

| From                                    | To                                             |
| --------------------------------------- | ---------------------------------------------- |
| `src/components/NavigationProgress.tsx` | `src/components/layout/NavigationProgress.tsx` |
| `src/components/NotificationBell.tsx`   | `src/components/layout/NotificationBell.tsx`   |
| `src/components/ScreenSkeleton.tsx`     | `src/components/layout/ScreenSkeleton.tsx`     |
| `src/components/pc/Sidebar.tsx`         | `src/components/layout/Sidebar.tsx`            |

### Files being created

- `src/components/layout/index.ts` — new barrel export

### Files being deleted

- `src/components/pc/` — empty after Sidebar.tsx moved out

### Consumer files (import paths updated)

- `src/app/(protected)/layout.tsx`
- `src/app/(protected)/loading.tsx`
- `src/app/(protected)/dashboard/loading.tsx`
- `src/app/(protected)/cashflow/loading.tsx`
- `src/app/(protected)/goals/loading.tsx`
- `src/app/(protected)/settings/loading.tsx`
- `src/app/(protected)/savings/loading.tsx`
- `src/app/(protected)/gold/loading.tsx`
- `src/app/(protected)/market/loading.tsx`
- `src/app/(protected)/assets/loading.tsx`

---

## Task 1: Rename common/ files to PascalCase

**Files:**

- Rename: `src/components/common/*.tsx` (8 files)
- Modify: `src/components/common/index.ts`

- [ ] **Step 1: Git mv all 8 files**

```bash
cd /path/to/project
git mv src/components/common/badge.tsx src/components/common/Badge.tsx
git mv src/components/common/delete-confirm-dialog.tsx src/components/common/DeleteConfirmDialog.tsx
git mv src/components/common/metric-card.tsx src/components/common/MetricCard.tsx
git mv src/components/common/option-picker.tsx src/components/common/OptionPicker.tsx
git mv src/components/common/responsive-action-menu.tsx src/components/common/ResponsiveActionMenu.tsx
git mv src/components/common/responsive-date-picker.tsx src/components/common/ResponsiveDatePicker.tsx
git mv src/components/common/responsive-modal.tsx src/components/common/ResponsiveModal.tsx
git mv src/components/common/tab-bar.tsx src/components/common/TabBar.tsx
```

- [ ] **Step 2: Update common/index.ts barrel to reference PascalCase paths**

Replace the entire content of `src/components/common/index.ts` with:

```ts
export { DeleteConfirmDialog } from "./DeleteConfirmDialog";
export { Badge } from "./Badge";
export { MetricCard } from "./MetricCard";
export { TabBar } from "./TabBar";
export { ResponsiveModal } from "./ResponsiveModal";
export { ResponsiveActionMenu } from "./ResponsiveActionMenu";
export { ResponsiveDatePicker } from "./ResponsiveDatePicker";
export { OptionPicker, type OptionItem } from "./OptionPicker";
```

- [ ] **Step 3: Verify TypeScript — no new errors**

```bash
npx tsc --noEmit 2>&1
```

Expected: only the pre-existing error in `src/lib/__tests__/goals-utils.test.ts`. Zero new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/common/
git commit -m "refactor: rename common components to PascalCase"
```

---

## Task 2: Create layout/ folder and move files

**Files:**

- Create: `src/components/layout/index.ts`
- Move (git mv): 4 files from root/pc → layout/

- [ ] **Step 1: Create the layout/ directory and move files**

```bash
mkdir src/components/layout
git mv src/components/NavigationProgress.tsx src/components/layout/NavigationProgress.tsx
git mv src/components/NotificationBell.tsx src/components/layout/NotificationBell.tsx
git mv src/components/ScreenSkeleton.tsx src/components/layout/ScreenSkeleton.tsx
git mv src/components/pc/Sidebar.tsx src/components/layout/Sidebar.tsx
```

- [ ] **Step 2: Create src/components/layout/index.ts**

```ts
export { NavigationProgress } from "./NavigationProgress";
export { NotificationBell } from "./NotificationBell";
export * from "./ScreenSkeleton";
export { Sidebar } from "./Sidebar";
```

Note: `ScreenSkeleton` uses `export *` because it exports many named functions (`DashboardSkeleton`, `CashflowSkeleton`, `GoalsSkeleton`, `SettingsSkeleton`, `AssetsSkeleton`, `MarketSkeleton`, `GoldSkeleton`, `SavingsSkeleton`, `ScreenSkeleton`).

- [ ] **Step 3: Remove empty pc/ folder**

```bash
git rm -r src/components/pc
```

- [ ] **Step 4: Verify TypeScript — no new errors**

```bash
npx tsc --noEmit 2>&1
```

Expected: only the pre-existing error in `src/lib/__tests__/goals-utils.test.ts` plus new errors for the 10 consumer files (these are fixed in Task 3). Zero unexpected errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ src/components/pc
git commit -m "refactor: create layout/ folder, move shell components from root and pc/"
```

---

## Task 3: Update consumer import paths

**Files:**

- Modify: `src/app/(protected)/layout.tsx`
- Modify: `src/app/(protected)/loading.tsx`
- Modify: `src/app/(protected)/dashboard/loading.tsx`
- Modify: `src/app/(protected)/cashflow/loading.tsx`
- Modify: `src/app/(protected)/goals/loading.tsx`
- Modify: `src/app/(protected)/settings/loading.tsx`
- Modify: `src/app/(protected)/savings/loading.tsx`
- Modify: `src/app/(protected)/gold/loading.tsx`
- Modify: `src/app/(protected)/market/loading.tsx`
- Modify: `src/app/(protected)/assets/loading.tsx`

- [ ] **Step 1: Update src/app/(protected)/layout.tsx**

Replace lines 6-8:

```ts
// Before
import { NotificationBell } from "@/components/NotificationBell";
import { NavigationProgress } from "@/components/NavigationProgress";
import { Sidebar } from "@/components/pc/Sidebar";

// After
import {
  NotificationBell,
  NavigationProgress,
  Sidebar,
} from "@/components/layout";
```

- [ ] **Step 2: Update all loading.tsx files**

Each file currently imports a named export from `@/components/ScreenSkeleton`. Update each one to import from `@/components/layout` instead. The named export stays the same — only the path changes.

`src/app/(protected)/loading.tsx`:

```tsx
import { ScreenSkeleton } from "@/components/layout";
```

`src/app/(protected)/dashboard/loading.tsx`:

```tsx
import { DashboardSkeleton } from "@/components/layout";
```

`src/app/(protected)/cashflow/loading.tsx`:

```tsx
import { CashflowSkeleton } from "@/components/layout";
```

`src/app/(protected)/goals/loading.tsx`:

```tsx
import { GoalsSkeleton } from "@/components/layout";
```

`src/app/(protected)/settings/loading.tsx`:

```tsx
import { SettingsSkeleton } from "@/components/layout";
```

`src/app/(protected)/savings/loading.tsx`:

```tsx
import { SavingsSkeleton } from "@/components/layout";
```

`src/app/(protected)/gold/loading.tsx`:

```tsx
import { GoldSkeleton } from "@/components/layout";
```

`src/app/(protected)/market/loading.tsx`:

```tsx
import { MarketSkeleton } from "@/components/layout";
```

`src/app/(protected)/assets/loading.tsx`:

```tsx
import { AssetsSkeleton } from "@/components/layout";
```

- [ ] **Step 3: Verify TypeScript — clean (except pre-existing)**

```bash
npx tsc --noEmit 2>&1
```

Expected: only the pre-existing error in `src/lib/__tests__/goals-utils.test.ts`. Zero other errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "refactor: update imports to use new layout/ barrel"
```
