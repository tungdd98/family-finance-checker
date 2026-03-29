# Monthly Actual Sheet — Accordion UX Design

**Date:** 2026-03-29
**Scope:** `MonthlyActualSheet` — tabs Thu nhập & Chi tiêu

## Problem

Each income/expense item always renders fully expanded (1 select + 2 inputs), making the list tall and hard to scan. When a new item is appended, it appears without any visual focus cue, so the user must locate it before starting to type.

## Solution Overview

Convert `IncomeRow` and `ExpenseRow` to accordion-style components: collapsed by default showing a compact summary, expanded on demand for editing. New items open expanded with the OptionPicker auto-triggered and focus handed to the amount field after selection.

---

## Collapsed State

Each item in collapsed mode shows:

- **Label** (uppercase muted): `KHOẢN THU #1` / `KHOẢN CHI #1`
- **Category name** (bold, foreground): e.g. "Lương Chồng" — or muted placeholder "Chưa chọn danh mục" if empty
- **Amount** (bold, accent): formatted VND — or `—` if zero
- **Edit icon** (`Pencil`, size 14, muted) on the far right — the only tap target to expand

Tapping anywhere other than the Pencil icon does nothing (no accidental expand on scroll).

---

## Expanded State

Expanded state is identical to the current always-expanded layout:

- Header row: label + `ChevronUp` icon (collapse) + `Trash2` icon (delete)
- `OptionPicker` for type
- Amount input
- Note input (optional)

Multiple items can be expanded simultaneously. There is no "only one open at a time" constraint.

---

## Add New Item Flow

When the user taps "Thêm khoản thu" / "Thêm khoản chi":

1. `appendIncome` / `appendExpense` adds `{ type: "", amount: 0, note: "" }`
2. New item renders with `initiallyExpanded={true}` → starts expanded
3. OptionPicker receives `autoOpen={true}` → opens its dialog after 1 tick (via `useEffect` with `[]` deps, `setTimeout(fn, 0)`)
4. User picks a category → dialog closes, `onAfterSelect` callback fires
5. `onAfterSelect` calls `amountRef.current?.focus()` to move focus to the amount input

`autoOpen` fires only once on mount. Subsequent re-renders do not re-trigger it.

---

## Component Changes

### `OptionPicker.tsx`

Add two optional props:

| Prop            | Type         | Purpose                                             |
| --------------- | ------------ | --------------------------------------------------- |
| `autoOpen`      | `boolean`    | Open dialog once on mount                           |
| `onAfterSelect` | `() => void` | Called after user picks an option and dialog closes |

Implementation:

```
useEffect(() => {
  if (autoOpen) setTimeout(() => setOpen(true), 0);
}, []);
```

In the option click handler, call `onAfterSelect?.()` after `onChange` and before/after `setOpen(false)`.

### `MonthlyActualSheet.tsx` — `IncomeRow` / `ExpenseRow`

New props added to each row:

| Prop                | Type      | Purpose                      |
| ------------------- | --------- | ---------------------------- |
| `initiallyExpanded` | `boolean` | Whether item starts expanded |

Internal changes:

- `isExpanded` state initialized from `initiallyExpanded`
- `amountRef = useRef<HTMLInputElement>()` — passed to amount input
- `autoOpenPicker` derived from `initiallyExpanded && type === ""` — passed to OptionPicker as `autoOpen`
- `onAfterSelect` passes `() => amountRef.current?.focus()` to OptionPicker

Collapsed JSX renders the summary row. Expanded JSX renders the existing form fields.

When appending:

```ts
appendIncome({ type: "", amount: 0, note: "" });
// IncomeRow for this field gets initiallyExpanded={true} automatically
// because it's the last item with type === ""
```

The simplest approach: track a `newlyAdded` ref that is `true` only for the item just appended. Pass `initiallyExpanded={index === incomeFields.length - 1 && field.type === ""}` — or simpler, maintain a `lastAddedId` state set on append, cleared on first expand.

Cleanest: pass `initiallyExpanded` as a direct prop from parent, set `true` only for the item just appended. Use a state variable `newItemId: string | null` in the parent, set it to `field.id` on append, pass `initiallyExpanded={field.id === newItemId}` to each row. Clear `newItemId` in a `useEffect` after the next render.

---

## Out of Scope

- Allocation tab rows — no change
- Collapse-all button — not needed
- Drag-to-reorder — not needed
- Animation on expand/collapse — keep simple, no framer-motion
