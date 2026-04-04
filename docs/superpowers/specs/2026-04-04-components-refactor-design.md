# Components Folder Refactor Design

**Date:** 2026-04-04  
**Scope:** `src/components/` only — does not affect `src/app/` components

---

## Problem

The current `src/components/` folder has three structural issues:

1. **Unclear folder boundaries** — `common/` and `ui/` both contain reusable components but serve different purposes with no clear rule separating them
2. **Loose root files** — `NavigationProgress.tsx`, `NotificationBell.tsx`, `ScreenSkeleton.tsx` sit at the root of `components/` with no grouping
3. **Inconsistent file naming** — `common/` uses kebab-case (`responsive-modal.tsx`), `pc/` and root files use PascalCase (`Sidebar.tsx`, `NotificationBell.tsx`)

---

## Design

### Folder Structure

```
src/components/
├── ui/                          ← shadcn/ui primitives (unchanged)
│   ├── button.tsx
│   ├── checkbox.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   └── skeleton.tsx
│
├── common/                      ← app-specific reusable components
│   ├── index.ts                 ← barrel export (updated)
│   ├── Badge.tsx
│   ├── DeleteConfirmDialog.tsx
│   ├── MetricCard.tsx
│   ├── OptionPicker.tsx
│   ├── ResponsiveActionMenu.tsx
│   ├── ResponsiveDatePicker.tsx
│   ├── ResponsiveModal.tsx
│   └── TabBar.tsx
│
└── layout/                      ← app shell components (new)
    ├── index.ts                 ← barrel export (new)
    ├── NavigationProgress.tsx
    ├── NotificationBell.tsx
    ├── ScreenSkeleton.tsx
    └── Sidebar.tsx
```

**Deleted:** `src/components/pc/`

### Folder Definitions

| Folder    | Rule                                                                                                                       | Barrel export |
| --------- | -------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `ui/`     | shadcn/ui primitives only. Atomic, no business logic. Follow shadcn convention: kebab-case filenames, import by file path. | No            |
| `common/` | App-specific components reused across multiple features. May compose `ui/` primitives. Have some domain awareness.         | Yes           |
| `layout/` | App shell components rendered once in the protected layout. Handle navigation, sidebar, loading states.                    | Yes           |

### File Naming Convention

- **React component files** → PascalCase (`MetricCard.tsx`, `Sidebar.tsx`)
- **Next.js special files** → lowercase (`page.tsx`, `loading.tsx`, `layout.tsx`)
- **shadcn/ui `ui/` files** → kebab-case (shadcn convention, unchanged)

This creates a visual rule: lowercase = Next.js file, PascalCase = React component.

---

## Changes Required

### 1. Rename files in `common/` (kebab → PascalCase)

| Before                       | After                      |
| ---------------------------- | -------------------------- |
| `badge.tsx`                  | `Badge.tsx`                |
| `delete-confirm-dialog.tsx`  | `DeleteConfirmDialog.tsx`  |
| `metric-card.tsx`            | `MetricCard.tsx`           |
| `option-picker.tsx`          | `OptionPicker.tsx`         |
| `responsive-action-menu.tsx` | `ResponsiveActionMenu.tsx` |
| `responsive-date-picker.tsx` | `ResponsiveDatePicker.tsx` |
| `responsive-modal.tsx`       | `ResponsiveModal.tsx`      |
| `tab-bar.tsx`                | `TabBar.tsx`               |

### 2. Update `common/index.ts` barrel

Exports remain the same — only the file paths inside the barrel change.

### 3. Create `layout/` folder

Move these files:

- `src/components/NavigationProgress.tsx` → `src/components/layout/NavigationProgress.tsx`
- `src/components/NotificationBell.tsx` → `src/components/layout/NotificationBell.tsx`
- `src/components/ScreenSkeleton.tsx` → `src/components/layout/ScreenSkeleton.tsx`
- `src/components/pc/Sidebar.tsx` → `src/components/layout/Sidebar.tsx`

Create `src/components/layout/index.ts` with barrel exports for all four.

### 4. Update import paths in consumers

| Old import                        | New import            |
| --------------------------------- | --------------------- |
| `@/components/NavigationProgress` | `@/components/layout` |
| `@/components/NotificationBell`   | `@/components/layout` |
| `@/components/ScreenSkeleton`     | `@/components/layout` |
| `@/components/pc/Sidebar`         | `@/components/layout` |

`@/components/common` import path stays the same — consumers don't need to change.

---

## Out of Scope

- `src/app/` components — these are feature-specific, co-located by page, and are not part of this refactor
- Adding barrel exports to `ui/` — shadcn convention is intentional
- Renaming component function names (only file names change)
