# Ticket 6: OptionPicker Cross-Feature Import — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Di chuyển `OptionPicker` từ `savings/components/` lên `src/components/common/` để xóa bỏ cross-feature import, sau đó update tất cả nơi đang dùng.

**Architecture:** Cut-and-paste file, update imports. `OptionPicker` là generic UI component không phụ thuộc vào savings domain — xứng đáng nằm ở `common/`.

**Tech Stack:** TypeScript, Next.js

> **Thứ tự:** Ticket này nên làm **trước** Ticket 5 (CashflowClient decomposition) để khi tách `CashflowClient`, import đã trỏ đúng chỗ.

---

## File Map

| File                                                             | Thay đổi                                   |
| ---------------------------------------------------------------- | ------------------------------------------ |
| `src/components/common/option-picker.tsx`                        | **Tạo mới** — copy từ savings              |
| `src/components/common/index.ts`                                 | Thêm export `OptionPicker` và `OptionItem` |
| `src/app/(protected)/savings/components/OptionPicker.tsx`        | **Xóa**                                    |
| `src/app/(protected)/savings/components/AddEditSavingsSheet.tsx` | Update import                              |
| `src/app/(protected)/cashflow/CashflowClient.tsx`                | Update import                              |

---

### Task 1: Copy OptionPicker lên common

**Files:**

- Create: `src/components/common/option-picker.tsx`

- [ ] **Step 1: Tạo file mới tại common/**

Tạo `src/components/common/option-picker.tsx` với nội dung **giống hệt** `src/app/(protected)/savings/components/OptionPicker.tsx`:

```tsx
// src/components/common/option-picker.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Check, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface OptionItem {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface Props {
  title: string;
  options: OptionItem[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  autoOpen?: boolean;
  onAfterSelect?: () => void;
}

export function OptionPicker({
  title,
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  disabled,
  autoOpen,
  onAfterSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (autoOpen) {
      const t = setTimeout(() => setOpen(true), 0);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const selected = options.find((o) => o.value === value);

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="bg-background border-border flex h-12 w-full items-center justify-between border px-3.5 disabled:opacity-50"
      >
        <span
          className={`text-[13px] font-medium ${selected ? "text-foreground" : "text-foreground-muted"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className="text-foreground-muted h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dialog */}
      <Dialog.Root open={open} onOpenChange={setOpen} modal={true}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup
            className={`bg-surface z-[70] flex flex-col transition-all duration-300 ${
              isDesktop
                ? "fixed top-1/2 left-1/2 max-h-[90dvh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden opacity-100 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
                : "fixed inset-x-0 bottom-0 max-h-[92dvh] ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <Dialog.Title className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
                {title}
              </Dialog.Title>
              <Dialog.Close className="text-foreground-muted">
                <X size={20} />
              </Dialog.Close>
            </div>

            {/* Options */}
            <div className="overflow-y-auto pb-8">
              {options.map((o) => {
                const isSelected = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      onAfterSelect?.();
                    }}
                    className={`border-border flex w-full items-center justify-between border-b px-5 py-4 last:border-b-0 ${
                      isSelected ? "text-accent" : "text-foreground"
                    }`}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-[14px] font-medium">{o.label}</span>
                      {o.sublabel && (
                        <span className="text-foreground-muted text-[11px]">
                          {o.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-accent shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
```

- [ ] **Step 2: Export từ common/index.ts**

Mở `src/components/common/index.ts`, thêm:

```ts
export { OptionPicker, type OptionItem } from "./option-picker";
```

- [ ] **Step 3: Build check — file mới không lỗi**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit file mới**

```bash
git add src/components/common/option-picker.tsx src/components/common/index.ts
git commit -m "feat: add OptionPicker to common components"
```

---

### Task 2: Update imports và xóa file cũ

**Files:**

- Modify: `src/app/(protected)/savings/components/AddEditSavingsSheet.tsx`
- Modify: `src/app/(protected)/cashflow/CashflowClient.tsx`
- Delete: `src/app/(protected)/savings/components/OptionPicker.tsx`

- [ ] **Step 1: Update AddEditSavingsSheet.tsx**

Tìm:

```ts
import { OptionPicker } from "./OptionPicker";
```

Thay bằng:

```ts
import { OptionPicker } from "@/components/common";
```

> `OptionItem` type nếu được import riêng, thay tương tự:

```ts
import { OptionPicker, type OptionItem } from "@/components/common";
```

- [ ] **Step 2: Update CashflowClient.tsx**

Tìm:

```ts
import { OptionPicker } from "@/app/(protected)/savings/components/OptionPicker";
```

Thay bằng:

```ts
import { OptionPicker } from "@/components/common";
```

- [ ] **Step 3: Xóa file cũ**

```bash
rm src/app/\(protected\)/savings/components/OptionPicker.tsx
```

- [ ] **Step 4: Build check — verify không còn import đến savings/OptionPicker**

```bash
npx tsc --noEmit
grep -rn "savings/components/OptionPicker\|from.*OptionPicker" src --include="*.tsx" --include="*.ts"
```

Expected:

- `tsc` không lỗi
- `grep` trả về 0 kết quả có `savings/components/OptionPicker`

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/savings/components/AddEditSavingsSheet.tsx \
        src/app/\(protected\)/cashflow/CashflowClient.tsx
git rm src/app/\(protected\)/savings/components/OptionPicker.tsx
git commit -m "refactor: move OptionPicker from savings to common, update all imports"
```
