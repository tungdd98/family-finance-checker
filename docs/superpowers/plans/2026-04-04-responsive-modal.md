# Responsive Modal — Drawer → Dialog/Popover on PC

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On PC (≥ 1024px), replace bottom-sheet Drawers with centered Dialogs (form sheets), compact Dialogs (action menus), and Popovers (date picker), while preserving all mobile behavior.

**Architecture:** Three wrapper components (`ResponsiveModal`, `ResponsiveActionMenu`, `ResponsiveDatePicker`) plus a `useMediaQuery` hook centralize all breakpoint logic. Each existing sheet component swaps only its container — internal form logic, state, and server actions are unchanged.

**Tech Stack:** `@base-ui/react/dialog`, `@base-ui/react/popover`, `@base-ui/react/drawer` (existing), Tailwind `lg:` breakpoint, `react-day-picker` (existing).

---

## File Map

| File                                                             | Action                               |
| ---------------------------------------------------------------- | ------------------------------------ |
| `src/hooks/use-media-query.ts`                                   | Create                               |
| `src/components/common/responsive-modal.tsx`                     | Create                               |
| `src/components/common/responsive-action-menu.tsx`               | Create                               |
| `src/components/common/responsive-date-picker.tsx`               | Create (replaces `DatePickerDrawer`) |
| `src/components/common/index.ts`                                 | Modify — add 3 exports               |
| `src/app/(protected)/gold/components/AddEditAssetSheet.tsx`      | Modify                               |
| `src/app/(protected)/gold/components/SellAssetSheet.tsx`         | Modify                               |
| `src/app/(protected)/gold/components/PositionActionSheet.tsx`    | Modify                               |
| `src/app/(protected)/savings/components/AddEditSavingsSheet.tsx` | Modify                               |
| `src/app/(protected)/savings/components/SavingsActionSheet.tsx`  | Modify                               |
| `src/app/(protected)/goals/components/GoalSheet.tsx`             | Modify                               |
| `src/app/(protected)/goals/components/CashFlowSheet.tsx`         | Modify                               |
| `src/app/(protected)/gold/components/DatePickerDrawer.tsx`       | Delete                               |

---

### Task 1: Create `useMediaQuery` hook

**Files:**

- Create: `src/hooks/use-media-query.ts`

- [ ] **Step 1: Create the file**

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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/mac/Desktop/family-finance-tracker
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output (only the pre-existing goals-utils.test error is filtered out).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-media-query.ts
git commit -m "feat: add useMediaQuery hook"
```

---

### Task 2: Create `ResponsiveModal` wrapper

**Files:**

- Create: `src/components/common/responsive-modal.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/common/responsive-modal.tsx
"use client";

import { X } from "lucide-react";
import { Drawer } from "@base-ui/react/drawer";
import { Dialog } from "@base-ui/react/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  children,
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup
            className="bg-background scrollbar-thin fixed top-1/2 left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto opacity-100 transition-all duration-300 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
            style={{ maxHeight: "85dvh" }}
          >
            <div className="bg-background border-border sticky top-0 flex items-center justify-between border-b px-7 pt-5 pb-4">
              <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
                {title}
              </span>
              <Dialog.Close className="text-foreground-muted cursor-pointer">
                <X size={20} />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          <div className="bg-background border-border sticky top-0 flex items-center justify-between border-b px-7 pt-5 pb-4">
            <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
              {title}
            </span>
            <Drawer.Close className="text-foreground-muted cursor-pointer">
              <X size={20} />
            </Drawer.Close>
          </div>
          {children}
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/common/responsive-modal.tsx
git commit -m "feat: add ResponsiveModal wrapper component"
```

---

### Task 3: Create `ResponsiveActionMenu` wrapper

**Files:**

- Create: `src/components/common/responsive-action-menu.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/common/responsive-action-menu.tsx
"use client";

import { X } from "lucide-react";
import { Drawer } from "@base-ui/react/drawer";
import { Dialog } from "@base-ui/react/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveActionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function ResponsiveActionMenu({
  open,
  onOpenChange,
  children,
}: ResponsiveActionMenuProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="bg-surface fixed top-1/2 left-1/2 z-50 flex w-full max-w-xs -translate-x-1/2 -translate-y-1/2 flex-col pb-4 opacity-100 transition-all duration-300 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="flex justify-end px-4 pt-4 pb-2">
              <Dialog.Close className="text-foreground-muted cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Popup className="bg-surface fixed right-0 bottom-0 left-0 z-50 flex flex-col pb-8 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          <div className="flex justify-center pt-3 pb-4">
            <div className="bg-border-strong h-1 w-10 rounded-full" />
          </div>
          {children}
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/common/responsive-action-menu.tsx
git commit -m "feat: add ResponsiveActionMenu wrapper component"
```

---

### Task 4: Create `ResponsiveDatePicker` component

**Files:**

- Create: `src/components/common/responsive-date-picker.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/common/responsive-date-picker.tsx
"use client";

import { useState } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { Popover } from "@base-ui/react/popover";
import { format, parseISO, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}

const CALENDAR_STYLES = `
  .rdp-root {
    --rdp-accent-color: var(--accent);
    --rdp-background-color: var(--surface);
    --rdp-accent-background-color: var(--accent);
    --rdp-day_button-border-radius: 4px;
    --rdp-selected-font: bold;
    --rdp-selected-border: 2px solid var(--accent);
  }
  .rdp-day_button { font-size: 14px; height: 40px; width: 40px; }
  .rdp-day_selected, .rdp-day_selected:hover {
    background-color: var(--accent);
    color: var(--background);
    font-weight: bold;
  }
  .rdp-nav_button { color: var(--foreground-muted); }
  .rdp-nav_button:hover {
    background-color: var(--surface-elevated);
    color: var(--accent);
  }
  .rdp-month_caption { font-size: 16px; font-weight: 700; color: var(--foreground); }
  .rdp-weekday {
    font-size: 12px;
    font-weight: 600;
    color: var(--foreground-muted);
    text-transform: uppercase;
  }
  .rdp-today { color: var(--accent); font-weight: 700; }
`;

export function ResponsiveDatePicker({
  value,
  onChange,
  disabled,
}: Readonly<ResponsiveDatePickerProps>) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const dateValue = value ? parseISO(value) : undefined;
  const initMonth = dateValue && isValid(dateValue) ? dateValue : new Date();

  const calendar = (
    <div className="flex flex-col items-center justify-center p-6">
      <style>{CALENDAR_STYLES}</style>
      <DayPicker
        locale={vi}
        mode="single"
        defaultMonth={initMonth}
        selected={dateValue}
        onSelect={(date) => {
          if (date) {
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }
        }}
        showOutsideDays
        fixedWeeks
      />
    </div>
  );

  const triggerLabel =
    dateValue && isValid(dateValue)
      ? format(dateValue, "dd/MM/yyyy")
      : "Chọn ngày";

  if (isDesktop) {
    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          type="button"
          disabled={disabled}
          className="bg-background border-border flex h-12 w-full cursor-pointer items-center justify-between border px-3.5 disabled:opacity-50"
        >
          <span
            className={`text-[13px] font-medium ${value ? "text-foreground" : "text-foreground-muted"}`}
          >
            {triggerLabel}
          </span>
          <CalendarIcon size={16} className="text-foreground-muted" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="start" sideOffset={4}>
            <Popover.Popup className="bg-surface border-border z-50 border shadow-lg">
              {calendar}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="bg-background border-border flex h-12 w-full cursor-pointer items-center justify-between border px-3.5 disabled:opacity-50"
      >
        <span
          className={`text-[13px] font-medium ${value ? "text-foreground" : "text-foreground-muted"}`}
        >
          {triggerLabel}
        </span>
        <CalendarIcon size={16} className="text-foreground-muted" />
      </button>

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 z-[60] bg-black/60 opacity-100 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-[70] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:translate-y-full data-starting-style:translate-y-full">
            <div className="border-border flex items-center justify-between border-b px-7 pt-5 pb-4">
              <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
                Chọn Ngày
              </span>
              <Drawer.Close className="text-foreground-muted cursor-pointer">
                <X size={20} />
              </Drawer.Close>
            </div>
            {calendar}
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/common/responsive-date-picker.tsx
git commit -m "feat: add ResponsiveDatePicker component"
```

---

### Task 5: Export from `common/index.ts` and verify build

**Files:**

- Modify: `src/components/common/index.ts`

- [ ] **Step 1: Add exports**

Replace the entire file `src/components/common/index.ts` with:

```ts
export { Badge } from "./badge";
export { MetricCard } from "./metric-card";
export { TabBar } from "./tab-bar";
export { ResponsiveModal } from "./responsive-modal";
export { ResponsiveActionMenu } from "./responsive-action-menu";
export { ResponsiveDatePicker } from "./responsive-date-picker";
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/common/index.ts
git commit -m "feat: export responsive modal wrappers from common"
```

---

### Task 6: Update `AddEditAssetSheet`

**Files:**

- Modify: `src/app/(protected)/gold/components/AddEditAssetSheet.tsx`

This file currently has 320 lines. Only the imports and return wrapper change — all form fields inside stay identical.

- [ ] **Step 1: Replace import block (lines 1–18)**

Replace:

```tsx
// src/app/(protected)/gold/components/AddEditAssetSheet.tsx
"use client";

import type { ReactNode } from "react";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { addAssetSchema, type AddAssetInput } from "@/lib/validations/gold";
import { addAssetAction, editAssetAction } from "@/app/actions/gold";
import { convertInputToChiAndPrice, formatVND } from "@/lib/gold-utils";
import { BrandPicker } from "./BrandPicker";
import { DatePickerDrawer } from "./DatePickerDrawer";
import { Button } from "@/components/ui/button";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";
```

With:

```tsx
// src/app/(protected)/gold/components/AddEditAssetSheet.tsx
"use client";

import type { ReactNode } from "react";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addAssetSchema, type AddAssetInput } from "@/lib/validations/gold";
import { addAssetAction, editAssetAction } from "@/app/actions/gold";
import { convertInputToChiAndPrice, formatVND } from "@/lib/gold-utils";
import { BrandPicker } from "./BrandPicker";
import { Button } from "@/components/ui/button";
import type { GoldAsset, GoldPrice } from "@/lib/services/gold";
import { ResponsiveModal, ResponsiveDatePicker } from "@/components/common";
```

- [ ] **Step 2: Replace return wrapper (line 134–306)**

Replace from `return (` through `</Drawer.Root>` with:

```tsx
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "add" ? "Thêm tài sản" : "Sửa tài sản"}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5 px-7 py-5 pb-10"
      >
```

And close with `</form>` then `</ResponsiveModal>` instead of `</Drawer.Popup></Drawer.Portal></Drawer.Root>`.

The full return block becomes:

```tsx
return (
  <ResponsiveModal
    open={open}
    onOpenChange={onOpenChange}
    title={mode === "add" ? "Thêm tài sản" : "Sửa tài sản"}
  >
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5 px-7 py-5 pb-10"
    >
      {/* Brand picker */}
      <div className="flex flex-col gap-2">
        <Label>CHỌN THƯƠNG HIỆU VÀNG</Label>
        <Controller
          name="brand_code"
          control={form.control}
          render={({ field }) => (
            <BrandPicker
              prices={prices}
              selectedCode={brandCode}
              selectedName={brandName}
              onSelect={(code, name) => {
                field.onChange(code);
                form.setValue("brand_name", name);
              }}
            />
          )}
        />
        {form.formState.errors.brand_code && (
          <ErrorMsg>{form.formState.errors.brand_code.message}</ErrorMsg>
        )}
      </div>

      {/* Quantity + unit toggle */}
      <div className="flex flex-col gap-2">
        <Label>SỐ LƯỢNG</Label>
        <div className="flex items-center gap-2">
          <div className="bg-background border-border flex h-12 flex-1 items-center border px-3.5">
            <input
              type="number"
              step="0.1"
              min="0.1"
              placeholder={unit === "chi" ? "VD: 5" : "VD: 0.5"}
              disabled={isPending}
              className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
              {...form.register("quantity", { valueAsNumber: true })}
            />
          </div>
          <div className="bg-surface border-border flex h-12 items-center border">
            <button
              type="button"
              onClick={() => setUnit("chi")}
              className={`h-full px-3 py-2 text-[11px] font-bold tracking-[1px] transition-colors ${
                unit === "chi"
                  ? "bg-accent text-background"
                  : "text-foreground-muted"
              }`}
            >
              CHỈ
            </button>
            <button
              type="button"
              onClick={() => setUnit("luong")}
              className={`h-full px-3 py-2 text-[11px] font-bold tracking-[1px] transition-colors ${
                unit === "luong"
                  ? "bg-accent text-background"
                  : "text-foreground-muted"
              }`}
            >
              LƯỢNG
            </button>
          </div>
        </div>
        {form.formState.errors.quantity && (
          <ErrorMsg>{form.formState.errors.quantity.message}</ErrorMsg>
        )}
      </div>

      {/* Buy price */}
      <div className="flex flex-col gap-2">
        <Label>GIÁ MỖI {unit === "chi" ? "CHỈ" : "LƯỢNG"} (VND)</Label>
        <div className="bg-background border-border flex h-12 items-center border px-3.5">
          <input
            inputMode="numeric"
            placeholder="VD: 17.000.000"
            value={priceDisplay}
            disabled={isPending}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              const num = raw ? parseInt(raw, 10) : 0;
              setPriceDisplay(
                raw ? new Intl.NumberFormat("vi-VN").format(num) : ""
              );
              form.setValue("buy_price_per_chi", num, {
                shouldValidate: true,
              });
            }}
            className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
          />
          <span className="text-foreground-muted shrink-0 text-[13px]">₫</span>
        </div>
        {totalVnd > 0 && (
          <p className="text-foreground-muted text-right text-[12px]">
            Tổng: {formatVND(totalVnd)}
          </p>
        )}
        {form.formState.errors.buy_price_per_chi && (
          <ErrorMsg>{form.formState.errors.buy_price_per_chi.message}</ErrorMsg>
        )}
      </div>

      {/* Buy date */}
      <div className="flex flex-col gap-2">
        <Label>NGÀY MUA</Label>
        <Controller
          name="buy_date"
          control={form.control}
          render={({ field }) => (
            <ResponsiveDatePicker
              value={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
        {form.formState.errors.buy_date && (
          <ErrorMsg>{form.formState.errors.buy_date.message}</ErrorMsg>
        )}
      </div>

      {/* Note */}
      <div className="flex flex-col gap-2">
        <Label>GHI CHÚ (TÙY CHỌN)</Label>
        <div className="bg-background border-border flex min-h-[80px] items-start border px-3.5 py-3">
          <textarea
            placeholder="Mua tại SJC Lý Thường Kiệt..."
            disabled={isPending}
            rows={3}
            className="text-foreground placeholder:text-foreground-muted w-full resize-none bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
            {...form.register("note")}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 h-14 w-full">
        {isPending
          ? "ĐANG LƯU..."
          : mode === "add"
            ? "LƯU TÀI SẢN"
            : "CẬP NHẬT TÀI SẢN"}
      </Button>
    </form>
  </ResponsiveModal>
);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/gold/components/AddEditAssetSheet.tsx
git commit -m "feat: migrate AddEditAssetSheet to ResponsiveModal"
```

---

### Task 7: Update `SellAssetSheet`

**Files:**

- Modify: `src/app/(protected)/gold/components/SellAssetSheet.tsx`

- [ ] **Step 1: Replace import block**

Replace:

```tsx
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { sellAssetSchema, type SellAssetInput } from "@/lib/validations/gold";
import { sellAssetAction } from "@/app/actions/gold";
import { Button } from "@/components/ui/button";
import { DatePickerDrawer } from "./DatePickerDrawer";
import type { GoldAsset } from "@/lib/services/gold";
```

With:

```tsx
import { sellAssetSchema, type SellAssetInput } from "@/lib/validations/gold";
import { sellAssetAction } from "@/app/actions/gold";
import { Button } from "@/components/ui/button";
import type { GoldAsset } from "@/lib/services/gold";
import { ResponsiveModal, ResponsiveDatePicker } from "@/components/common";
```

- [ ] **Step 2: Replace return wrapper**

Replace the entire `return (` block with:

```tsx
return (
  <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Bán tài sản">
    {/* Asset info */}
    <div className="border-border border-b px-7 py-4">
      <p className="text-foreground-secondary text-[13px]">
        {remaining} chỉ {position?.brand_name}
      </p>
    </div>

    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5 px-7 py-5 pb-10"
    >
      {/* Sell quantity */}
      <div className="flex flex-col gap-2">
        <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px]">
          SỐ LƯỢNG BÁN (CHỈ)
        </span>
        <div className="bg-background border-border flex h-12 items-center border px-3.5">
          <input
            type="number"
            step="0.1"
            min="0.1"
            max={remaining}
            placeholder={`Tối đa ${remaining} chỉ`}
            disabled={isPending}
            className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
            {...form.register("sell_quantity", { valueAsNumber: true })}
          />
        </div>
        {form.formState.errors.sell_quantity && (
          <p className="text-status-negative text-[11px]">
            {form.formState.errors.sell_quantity.message}
          </p>
        )}
      </div>

      {/* Sell price */}
      <div className="flex flex-col gap-2">
        <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px]">
          GIÁ BÁN MỖI CHỈ (VND)
        </span>
        <div className="bg-background border-border flex h-12 items-center border px-3.5">
          <input
            inputMode="numeric"
            placeholder="VD: 16.860.000"
            value={priceDisplay}
            disabled={isPending}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              const num = raw ? parseInt(raw, 10) : 0;
              setPriceDisplay(
                raw ? new Intl.NumberFormat("vi-VN").format(num) : ""
              );
              form.setValue("sell_price_per_chi", num, {
                shouldValidate: true,
              });
            }}
            className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
          />
          <span className="text-foreground-muted shrink-0 text-[13px]">₫</span>
        </div>
        {form.formState.errors.sell_price_per_chi && (
          <p className="text-status-negative text-[11px]">
            {form.formState.errors.sell_price_per_chi.message}
          </p>
        )}
      </div>

      {/* Sell date */}
      <div className="flex flex-col gap-2">
        <span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px]">
          NGÀY BÁN
        </span>
        <Controller
          name="sell_date"
          control={form.control}
          render={({ field }) => (
            <ResponsiveDatePicker
              value={field.value ?? ""}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 h-14 w-full">
        {isPending ? "ĐANG XÁC NHẬN..." : "XÁC NHẬN BÁN"}
      </Button>
    </form>
  </ResponsiveModal>
);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/gold/components/SellAssetSheet.tsx
git commit -m "feat: migrate SellAssetSheet to ResponsiveModal"
```

---

### Task 8: Update `PositionActionSheet`

**Files:**

- Modify: `src/app/(protected)/gold/components/PositionActionSheet.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
// src/app/(protected)/gold/components/PositionActionSheet.tsx
"use client";

import type { ReactNode } from "react";
import { Pencil, TrendingUp, Trash2 } from "lucide-react";
import type { GoldAsset } from "@/lib/services/gold";
import { ResponsiveActionMenu } from "@/components/common";

interface Props {
  position: GoldAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onSell: () => void;
  onDelete: () => void;
}

export function PositionActionSheet({
  position,
  open,
  onOpenChange,
  onEdit,
  onSell,
  onDelete,
}: Props) {
  const remaining = position ? position.quantity - position.sold_quantity : 0;

  return (
    <ResponsiveActionMenu open={open} onOpenChange={onOpenChange}>
      <p className="text-foreground-muted px-7 pb-3 text-[11px] font-semibold tracking-[1.5px]">
        TÙY CHỌN TÀI SẢN
      </p>

      <ActionItem
        icon={<Pencil size={16} />}
        label="Chỉnh sửa"
        onClick={() => {
          onOpenChange(false);
          onEdit();
        }}
      />
      {remaining > 0 && (
        <ActionItem
          icon={<TrendingUp size={16} />}
          label="Bán tài sản"
          onClick={() => {
            onOpenChange(false);
            onSell();
          }}
        />
      )}
      <ActionItem
        icon={<Trash2 size={16} />}
        label="Xóa tài sản"
        destructive
        onClick={() => {
          onOpenChange(false);
          onDelete();
        }}
      />

      <div className="px-7 pt-4">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="bg-surface-elevated text-foreground w-full py-3.5 text-[11px] font-bold tracking-[2px]"
        >
          ĐÓNG
        </button>
      </div>
    </ResponsiveActionMenu>
  );
}

function ActionItem({
  icon,
  label,
  destructive = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 px-7 py-4 text-left ${
        destructive ? "text-status-negative" : "text-foreground"
      }`}
    >
      {icon}
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/gold/components/PositionActionSheet.tsx
git commit -m "feat: migrate PositionActionSheet to ResponsiveActionMenu"
```

---

### Task 9: Update `AddEditSavingsSheet`

**Files:**

- Modify: `src/app/(protected)/savings/components/AddEditSavingsSheet.tsx`

- [ ] **Step 1: Replace import block**

Replace:

```tsx
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
```

and

```tsx
import { DatePickerDrawer } from "@/app/(protected)/gold/components/DatePickerDrawer";
```

With:

```tsx
import { ResponsiveModal, ResponsiveDatePicker } from "@/components/common";
```

- [ ] **Step 2: Replace return wrapper**

Replace from `return (` through `</Drawer.Root>` with:

```tsx
return (
  <ResponsiveModal
    open={open}
    onOpenChange={onOpenChange}
    title={isEdit ? "Sửa tiết kiệm" : "Thêm tiết kiệm"}
  >
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5 px-5 py-5 pb-10"
    >
      {/* Ngân hàng */}
      <div className="flex flex-col gap-2">
        <Label>NGÂN HÀNG / VÍ ĐIỆN TỬ *</Label>
        <Controller
          name="bank_name"
          control={form.control}
          render={({ field }) => (
            <BankPicker
              selectedCode={field.value}
              selectedName={field.value}
              onSelect={(_code, name) => field.onChange(name)}
              disabled={isPending}
            />
          )}
        />
        {form.formState.errors.bank_name && (
          <ErrorMsg>{form.formState.errors.bank_name.message}</ErrorMsg>
        )}
      </div>

      {/* Tên sổ */}
      <div className="flex flex-col gap-2">
        <Label>TÊN SỔ / GỢI NHỚ (TÙY CHỌN)</Label>
        <div className="bg-background border-border flex h-12 items-center border px-3.5">
          <input
            placeholder="VD: Sổ học phí, Quỹ du lịch..."
            disabled={isPending}
            className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
            {...form.register("account_name")}
          />
        </div>
      </div>

      {/* Số tiền gốc */}
      <div className="flex flex-col gap-2">
        <Label>SỐ TIỀN GỐC (VND) *</Label>
        <div className="bg-background border-border flex h-12 items-center border px-3.5">
          <input
            inputMode="numeric"
            placeholder="0"
            value={principalDisplay}
            onChange={handlePrincipalChange}
            disabled={isPending}
            className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
          />
          <span className="text-foreground-muted shrink-0 text-[13px]">₫</span>
        </div>
        {form.formState.errors.principal && (
          <ErrorMsg>{form.formState.errors.principal.message}</ErrorMsg>
        )}
      </div>

      {/* Lãi suất */}
      <div className="flex flex-col gap-2">
        <Label>LÃI SUẤT (%/NĂM) *</Label>
        <div className="bg-background border-border flex h-12 items-center border px-3.5">
          <input
            inputMode="decimal"
            placeholder="5.2"
            value={interestRateDisplay}
            onChange={handleInterestRateChange}
            disabled={isPending}
            className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
          />
          <span className="text-foreground-muted shrink-0 text-[12px]">
            %/năm
          </span>
        </div>
        {form.formState.errors.interest_rate && (
          <ErrorMsg>{form.formState.errors.interest_rate.message}</ErrorMsg>
        )}
      </div>

      {/* Kỳ hạn */}
      <div className="flex flex-col gap-2">
        <Label>KỲ HẠN</Label>
        <Controller
          name="term_months"
          control={form.control}
          render={({ field }) => (
            <OptionPicker
              title="Chọn Kỳ Hạn"
              options={TERM_OPTIONS.map((o) => ({ ...o, value: o.value }))}
              value={field.value}
              onChange={(v) => field.onChange(Number(v))}
              disabled={isPending}
            />
          )}
        />
      </div>

      {/* Ngày gửi */}
      <div className="flex flex-col gap-2">
        <Label>NGÀY GỬI *</Label>
        <Controller
          name="start_date"
          control={form.control}
          render={({ field }) => (
            <ResponsiveDatePicker
              value={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
        {form.formState.errors.start_date && (
          <ErrorMsg>{form.formState.errors.start_date.message}</ErrorMsg>
        )}
      </div>

      {/* Hình thức tất toán */}
      <div className="flex flex-col gap-2">
        <Label>HÌNH THỨC TẤT TOÁN</Label>
        <Controller
          name="rollover_type"
          control={form.control}
          render={({ field }) => (
            <OptionPicker
              title="Hình Thức Tất Toán"
              options={ROLLOVER_OPTIONS.map((o) => ({ ...o }))}
              value={field.value}
              onChange={(v) => field.onChange(String(v))}
              disabled={isPending}
            />
          )}
        />
      </div>

      {/* Ghi chú */}
      <div className="flex flex-col gap-2">
        <Label>GHI CHÚ (TÙY CHỌN)</Label>
        <div className="bg-background border-border flex min-h-[80px] items-start border px-3.5 py-3">
          <textarea
            rows={3}
            placeholder="Ghi chú thêm..."
            disabled={isPending}
            className="text-foreground placeholder:text-foreground-muted w-full resize-none bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
            {...form.register("note")}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 h-14 w-full">
        {isPending
          ? isEdit
            ? "ĐANG LƯU..."
            : "ĐANG THÊM..."
          : isEdit
            ? "CẬP NHẬT TIẾT KIỆM"
            : "LƯU TIẾT KIỆM"}
      </Button>
    </form>
  </ResponsiveModal>
);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/savings/components/AddEditSavingsSheet.tsx
git commit -m "feat: migrate AddEditSavingsSheet to ResponsiveModal"
```

---

### Task 10: Update `SavingsActionSheet`

**Files:**

- Modify: `src/app/(protected)/savings/components/SavingsActionSheet.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
"use client";

import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { SavingsAccount } from "@/lib/services/savings";
import { ResponsiveActionMenu } from "@/components/common";

interface Props {
  account: SavingsAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SavingsActionSheet({
  account: _account,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: Props) {
  return (
    <ResponsiveActionMenu open={open} onOpenChange={onOpenChange}>
      <p className="text-foreground-muted px-7 pb-3 text-[11px] font-semibold tracking-[1.5px] uppercase">
        TÙY CHỌN TIẾT KIỆM
      </p>

      <ActionItem
        icon={<Pencil size={16} />}
        label="Chỉnh sửa"
        onClick={() => {
          onOpenChange(false);
          onEdit();
        }}
      />
      <ActionItem
        icon={<Trash2 size={16} />}
        label="Xóa khoản tiết kiệm"
        destructive
        onClick={() => {
          onOpenChange(false);
          onDelete();
        }}
      />

      <div className="px-7 pt-4">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="bg-surface-elevated text-foreground w-full py-3.5 text-[11px] font-bold tracking-[2px] uppercase"
        >
          ĐÓNG
        </button>
      </div>
    </ResponsiveActionMenu>
  );
}

function ActionItem({
  icon,
  label,
  destructive = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`active:bg-surface-elevated flex w-full items-center gap-4 px-7 py-4 text-left transition-colors ${
        destructive ? "text-status-negative" : "text-foreground"
      }`}
    >
      {icon}
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/savings/components/SavingsActionSheet.tsx
git commit -m "feat: migrate SavingsActionSheet to ResponsiveActionMenu"
```

---

### Task 11: Update `GoalSheet`

**Files:**

- Modify: `src/app/(protected)/goals/components/GoalSheet.tsx`

- [ ] **Step 1: Replace import block**

Replace:

```tsx
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
```

and

```tsx
import { DatePickerDrawer } from "@/app/(protected)/gold/components/DatePickerDrawer";
```

With:

```tsx
import { ResponsiveModal, ResponsiveDatePicker } from "@/components/common";
```

- [ ] **Step 2: Replace return wrapper**

Replace from `return (` through `</Drawer.Root>` with:

```tsx
return (
  <ResponsiveModal
    open={open}
    onOpenChange={onOpenChange}
    title={goal ? "Chỉnh sửa mục tiêu" : "Đặt mục tiêu"}
  >
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5 px-7 py-5 pb-10"
    >
      {/* Emoji + Tên */}
      <div className="flex gap-3">
        <div className="flex flex-col gap-2">
          <Label>Icon</Label>
          <div className="bg-background border-border flex h-12 w-14 items-center justify-center border">
            <input
              {...form.register("emoji")}
              maxLength={2}
              disabled={isPending}
              className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-center text-xl outline-none disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label>Tên mục tiêu *</Label>
          <div className="bg-background border-border flex h-12 items-center border px-3.5">
            <input
              {...form.register("name")}
              placeholder="VD: Mua nhà, Du lịch Nhật..."
              disabled={isPending}
              className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
            />
          </div>
          {form.formState.errors.name && (
            <ErrorMsg>{form.formState.errors.name.message}</ErrorMsg>
          )}
        </div>
      </div>

      {/* Số tiền mục tiêu */}
      <div className="flex flex-col gap-2">
        <Label>Số tiền mục tiêu *</Label>
        <div className="bg-background border-border flex h-12 items-center border px-3.5">
          <input
            value={amountDisplay}
            onChange={handleAmountChange}
            inputMode="numeric"
            placeholder="VD: 1.500.000.000"
            disabled={isPending}
            className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
          />
          <span className="text-foreground-muted shrink-0 text-[13px]">₫</span>
        </div>
        {form.formState.errors.target_amount && (
          <ErrorMsg>{form.formState.errors.target_amount.message}</ErrorMsg>
        )}
      </div>

      {/* Deadline */}
      <div className="flex flex-col gap-2">
        <Label>Ngày mục tiêu (không bắt buộc)</Label>
        <Controller
          name="deadline"
          control={form.control}
          render={({ field }) => (
            <ResponsiveDatePicker
              value={field.value ?? ""}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
      </div>

      {/* Ghi chú */}
      <div className="flex flex-col gap-2">
        <Label>Ghi chú</Label>
        <div className="bg-background border-border flex min-h-[80px] items-start border px-3.5 py-3">
          <textarea
            {...form.register("note")}
            rows={3}
            placeholder="Tuỳ chọn..."
            disabled={isPending}
            className="text-foreground placeholder:text-foreground-muted w-full resize-none bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 h-14 w-full">
        {isPending ? "ĐANG LƯU..." : goal ? "CẬP NHẬT" : "ĐẶT MỤC TIÊU"}
      </Button>
    </form>
  </ResponsiveModal>
);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/goals/components/GoalSheet.tsx
git commit -m "feat: migrate GoalSheet to ResponsiveModal"
```

---

### Task 12: Update `CashFlowSheet`

**Files:**

- Modify: `src/app/(protected)/goals/components/CashFlowSheet.tsx`

- [ ] **Step 1: Replace import block**

Replace:

```tsx
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
```

With:

```tsx
import { ResponsiveModal } from "@/components/common";
```

- [ ] **Step 2: Replace return wrapper**

Replace from `return (` through `</Drawer.Root>` with:

```tsx
return (
  <ResponsiveModal
    open={open}
    onOpenChange={onOpenChange}
    title="Thu chi trung bình / tháng"
  >
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5 px-7 py-5 pb-10"
    >
      <div className="flex flex-col gap-2">
        <Label>Thu nhập chồng (TB/tháng) *</Label>
        <div className="bg-background border-border flex h-12 items-center border px-3.5">
          <input
            value={incomeHusbandDisplay}
            onChange={makeChangeHandler(
              "avg_monthly_income_husband",
              setIncomeHusbandDisplay
            )}
            inputMode="numeric"
            placeholder="VD: 25.000.000"
            disabled={isPending}
            className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
          />
          <span className="text-foreground-muted shrink-0 text-[13px]">₫</span>
        </div>
        {form.formState.errors.avg_monthly_income_husband && (
          <ErrorMsg>
            {form.formState.errors.avg_monthly_income_husband.message}
          </ErrorMsg>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Thu nhập vợ (TB/tháng) *</Label>
        <div className="bg-background border-border flex h-12 items-center border px-3.5">
          <input
            value={incomeWifeDisplay}
            onChange={makeChangeHandler(
              "avg_monthly_income_wife",
              setIncomeWifeDisplay
            )}
            inputMode="numeric"
            placeholder="VD: 20.000.000"
            disabled={isPending}
            className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
          />
          <span className="text-foreground-muted shrink-0 text-[13px]">₫</span>
        </div>
        {form.formState.errors.avg_monthly_income_wife && (
          <ErrorMsg>
            {form.formState.errors.avg_monthly_income_wife.message}
          </ErrorMsg>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Chi tiêu TB / tháng *</Label>
        <div className="bg-background border-border flex h-12 items-center border px-3.5">
          <input
            value={expenseDisplay}
            onChange={makeChangeHandler(
              "avg_monthly_expense",
              setExpenseDisplay
            )}
            inputMode="numeric"
            placeholder="VD: 28.000.000"
            disabled={isPending}
            className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-[13px] font-medium outline-none disabled:opacity-50"
          />
          <span className="text-foreground-muted shrink-0 text-[13px]">₫</span>
        </div>
        {form.formState.errors.avg_monthly_expense && (
          <ErrorMsg>
            {form.formState.errors.avg_monthly_expense.message}
          </ErrorMsg>
        )}
      </div>

      {/* Live preview */}
      <div className="bg-surface border-border border p-4">
        <p className="text-foreground-muted mb-2 text-[11px] font-semibold tracking-[1px] uppercase">
          Thặng dư dự kiến
        </p>
        <p
          className={`text-[20px] font-bold tracking-[-0.5px] ${surplus >= 0 ? "text-green-500" : "text-red-400"}`}
        >
          {surplus >= 0 ? "+" : ""}
          {formatVND(surplus)}
        </p>
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 h-14 w-full">
        {isPending ? "ĐANG LƯU..." : "LƯU CÀI ĐẶT"}
      </Button>
    </form>
  </ResponsiveModal>
);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/goals/components/CashFlowSheet.tsx
git commit -m "feat: migrate CashFlowSheet to ResponsiveModal"
```

---

### Task 13: Delete `DatePickerDrawer` and final build check

**Files:**

- Delete: `src/app/(protected)/gold/components/DatePickerDrawer.tsx`

- [ ] **Step 1: Verify no remaining imports of DatePickerDrawer**

```bash
grep -r "DatePickerDrawer" src/ --include="*.tsx" --include="*.ts"
```

Expected: no output. If any files still reference it, fix them before proceeding.

- [ ] **Step 2: Delete the file**

```bash
rm src/app/\(protected\)/gold/components/DatePickerDrawer.tsx
```

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "goals-utils.test"
```

Expected: no output.

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: delete DatePickerDrawer, replaced by ResponsiveDatePicker"
```

---

### Manual Verification Checklist

After all tasks complete, start dev server and verify:

```bash
npm run dev
```

Open `http://localhost:3000` and check at **≥ 1024px wide** (PC):

| Action                          | Expected                                  |
| ------------------------------- | ----------------------------------------- |
| Click "Thêm vàng" button        | Dialog appears centered, not bottom sheet |
| Click "Bán tài sản"             | Dialog appears centered                   |
| Long press a gold position card | Compact Dialog appears with action list   |
| Click "Ngày mua" in gold form   | Popover calendar appears below the input  |
| Open savings sheet              | Dialog appears centered                   |
| Long press savings card         | Compact Dialog appears                    |
| Open goal sheet                 | Dialog appears centered                   |
| Open cashflow sheet             | Dialog appears centered                   |

At **< 1024px wide** (mobile):

| Action           | Expected                        |
| ---------------- | ------------------------------- |
| All of the above | Bottom sheet behavior unchanged |
