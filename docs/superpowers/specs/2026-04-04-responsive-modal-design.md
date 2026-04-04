# Design: Responsive Modal — Drawer → Dialog/Popover on PC

**Date:** 2026-04-04
**Status:** Approved

---

## 1. Overview

On mobile, all overlays are bottom sheets (Base UI Drawer). On PC (≥ 1024px), form sheets become centered Dialogs, action sheets become compact centered Dialogs, and the date picker becomes a Popover. Mobile behavior is unchanged.

Three wrapper components abstract the breakpoint logic into one place. All existing sheet components only swap their container — internal logic (forms, actions, state) is untouched.

---

## 2. Breakpoint

Same as the PC layout: `lg` = 1024px. Detected via a shared `useMediaQuery` hook.

---

## 3. Files Created

| File                                               | Responsibility                                   |
| -------------------------------------------------- | ------------------------------------------------ |
| `src/hooks/use-media-query.ts`                     | SSR-safe `useMediaQuery(query)` hook             |
| `src/components/common/responsive-modal.tsx`       | Drawer → Dialog wrapper for form sheets          |
| `src/components/common/responsive-action-menu.tsx` | Drawer → compact Dialog wrapper for action menus |
| `src/components/common/responsive-date-picker.tsx` | Drawer → Popover wrapper for date picker         |

---

## 4. Files Modified

| File                                                             | Change                                        |
| ---------------------------------------------------------------- | --------------------------------------------- |
| `src/components/common/index.ts`                                 | Export 3 new wrappers                         |
| `src/app/(protected)/gold/components/AddEditAssetSheet.tsx`      | Use `ResponsiveModal`, `ResponsiveDatePicker` |
| `src/app/(protected)/gold/components/SellAssetSheet.tsx`         | Use `ResponsiveModal`                         |
| `src/app/(protected)/gold/components/PositionActionSheet.tsx`    | Use `ResponsiveActionMenu`                    |
| `src/app/(protected)/savings/components/AddEditSavingsSheet.tsx` | Use `ResponsiveModal`                         |
| `src/app/(protected)/savings/components/SavingsActionSheet.tsx`  | Use `ResponsiveActionMenu`                    |
| `src/app/(protected)/goals/components/GoalSheet.tsx`             | Use `ResponsiveModal`                         |
| `src/app/(protected)/goals/components/CashFlowSheet.tsx`         | Use `ResponsiveModal`                         |

---

## 5. Files Deleted

| File                                                       | Reason                                                         |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| `src/app/(protected)/gold/components/DatePickerDrawer.tsx` | Replaced by `ResponsiveDatePicker` in `src/components/common/` |

---

## 6. Hook: `useMediaQuery`

```ts
// src/hooks/use-media-query.ts
"use client";
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
```

Returns `false` on server (SSR-safe — `useState(false)`, no `window` access until `useEffect`). Updates reactively when window is resized across the breakpoint.

---

## 7. `ResponsiveModal`

### Props

```ts
interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}
```

### Mobile behavior (< 1024px)

`Drawer.Root > Drawer.Portal > Drawer.Backdrop + Drawer.Popup`

- Popup: `fixed inset-x-0 bottom-0`, slides up from bottom, `max-h-[92dvh]`, `overflow-y-auto`
- Header: sticky top, title left + `Drawer.Close` X right
- Children: rendered below header

### PC behavior (≥ 1024px)

`Dialog.Root > Dialog.Portal > Dialog.Backdrop + Dialog.Popup`

- Popup: `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`, `w-full max-w-lg`, `max-h-[85vh]`, `overflow-y-auto`
- Header: same structure, uses `Dialog.Close` instead of `Drawer.Close`
- Backdrop: same `bg-black/60`
- Animation: fade in (opacity 0→1), no slide

### Usage (unchanged from caller's perspective)

```tsx
// Before
<Drawer.Root open={open} onOpenChange={onOpenChange}>
  <Drawer.Portal>
    <Drawer.Backdrop className="..." />
    <Drawer.Popup className="...">
      <div className="... sticky top-0 ...">
        <span>Thêm tài sản</span>
        <Drawer.Close><X size={20} /></Drawer.Close>
      </div>
      {/* form content */}
    </Drawer.Popup>
  </Drawer.Portal>
</Drawer.Root>

// After
<ResponsiveModal open={open} onOpenChange={onOpenChange} title="Thêm tài sản">
  {/* form content — unchanged */}
</ResponsiveModal>
```

---

## 8. `ResponsiveActionMenu`

### Props

```ts
interface ResponsiveActionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}
```

### Mobile behavior (< 1024px)

Same as current Drawer bottom sheet: drag handle at top, action list, "ĐÓNG" close button at bottom.

### PC behavior (≥ 1024px)

`Dialog.Root > Dialog.Portal > Dialog.Backdrop + Dialog.Popup`

- Popup: centered, `w-full max-w-xs`, no title, action list + close button
- No drag handle on PC
- "ĐÓNG" button replaced by a small X button top-right

### Usage

```tsx
// Before
<Drawer.Root open={open} onOpenChange={onOpenChange}>
  <Drawer.Portal>
    <Drawer.Backdrop ... />
    <Drawer.Popup ...>
      <div>{/* drag handle */}</div>
      {/* action items */}
      <div><Drawer.Close>ĐÓNG</Drawer.Close></div>
    </Drawer.Popup>
  </Drawer.Portal>
</Drawer.Root>

// After
<ResponsiveActionMenu open={open} onOpenChange={onOpenChange}>
  {/* action items — unchanged */}
</ResponsiveActionMenu>
```

---

## 9. `ResponsiveDatePicker`

Replaces `DatePickerDrawer` with identical external API.

### Props

```ts
interface ResponsiveDatePickerProps {
  value: string; // ISO date string "YYYY-MM-DD"
  onChange: (date: string) => void;
  disabled?: boolean;
}
```

### Mobile behavior (< 1024px)

Same as current `DatePickerDrawer`: button trigger → Drawer opens → calendar fullscreen.

### PC behavior (≥ 1024px)

`@base-ui/react/popover`: button trigger → `Popover.Popup` appears below the trigger button containing the `DayPicker` calendar. No backdrop. Closes on outside click.

### Migration

`AddEditAssetSheet` changes import only:

```tsx
// Before
import { DatePickerDrawer } from "./DatePickerDrawer";
// <DatePickerDrawer value={field.value} onChange={field.onChange} disabled={isPending} />

// After
import { ResponsiveDatePicker } from "@/components/common";
// <ResponsiveDatePicker value={field.value} onChange={field.onChange} disabled={isPending} />
```

`DatePickerDrawer.tsx` is deleted.

---

## 10. Out of Scope

- `DeleteConfirmDialog` and `DeleteSavingsDialog` — already use Dialog, no change needed
- `BrandPicker` — not a sheet, not in scope
- Adapting form layout for PC screen width (e.g., 2-column form fields) — separate concern
