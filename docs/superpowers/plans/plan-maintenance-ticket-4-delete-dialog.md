# Ticket 4: Unified DeleteConfirmDialog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo một `DeleteConfirmDialog` component dùng chung, thay thế hai bản copy-paste (`DeleteConfirmDialog` của gold và `DeleteSavingsDialog` của savings).

**Architecture:** Component mới nhận `title`, `description`, `onConfirm`, `isPending` qua props — caller tự xử lý action. Component luôn là centered dialog (không dùng `ResponsiveModal` vì delete confirmation không phải form dạng drawer — nó cần centered alert trên cả mobile lẫn desktop).

**Tech Stack:** `@base-ui/react/dialog`, TypeScript, Tailwind CSS

---

## File Map

| File                                                             | Thay đổi                        |
| ---------------------------------------------------------------- | ------------------------------- |
| `src/components/common/delete-confirm-dialog.tsx`                | **Tạo mới** — unified component |
| `src/components/common/index.ts`                                 | Thêm export                     |
| `src/app/(protected)/gold/components/DeleteConfirmDialog.tsx`    | **Xóa**                         |
| `src/app/(protected)/savings/components/DeleteSavingsDialog.tsx` | **Xóa**                         |
| `src/app/(protected)/gold/GoldClient.tsx`                        | Update import + usage           |
| `src/app/(protected)/savings/SavingsClient.tsx`                  | Update import + usage           |

---

### Task 1: Tạo unified DeleteConfirmDialog

**Files:**

- Create: `src/components/common/delete-confirm-dialog.tsx`

- [ ] **Step 1: Tạo file component**

```tsx
// src/components/common/delete-confirm-dialog.tsx
"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  isPending: boolean;
  confirmLabel?: string;
  pendingLabel?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isPending,
  confirmLabel = "XÓA",
  pendingLabel = "ĐANG XÓA...",
}: DeleteConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="bg-surface fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-48px)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-5 p-6 opacity-100 transition-all duration-300 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <Dialog.Title className="text-foreground text-[16px] font-bold">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-foreground-secondary text-[13px]">
            {description}
          </Dialog.Description>
          <div className="flex gap-3">
            <Dialog.Close className="bg-surface-elevated text-foreground flex-1 py-3 text-[11px] font-bold tracking-[2px]">
              HỦY
            </Dialog.Close>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="bg-status-negative flex-1 py-3 text-[11px] font-bold tracking-[2px] text-white disabled:opacity-50"
            >
              {isPending ? pendingLabel : confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

> **Width chuẩn hóa:** Dùng `w-[calc(100%-48px)]` (thay vì 56px hay 40px không nhất quán của hai bản cũ). 48px = 24px mỗi bên, margin cân đối.

- [ ] **Step 2: Export từ common/index.ts**

Mở `src/components/common/index.ts`, thêm dòng:

```ts
export { DeleteConfirmDialog } from "./delete-confirm-dialog";
```

- [ ] **Step 3: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/common/delete-confirm-dialog.tsx src/components/common/index.ts
git commit -m "feat: add unified DeleteConfirmDialog component to common"
```

---

### Task 2: Migrate GoldClient → dùng unified component

**Files:**

- Modify: `src/app/(protected)/gold/GoldClient.tsx`
- Delete: `src/app/(protected)/gold/components/DeleteConfirmDialog.tsx`

- [ ] **Step 1: Xem usage hiện tại trong GoldClient**

```bash
grep -n "DeleteConfirmDialog\|deleteTarget\|onOpenChange\|onConfirm" src/app/\(protected\)/gold/GoldClient.tsx
```

- [ ] **Step 2: Update import trong GoldClient.tsx**

Tìm:

```ts
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";
```

Thay bằng:

```ts
import { DeleteConfirmDialog } from "@/components/common";
```

- [ ] **Step 3: Update usage trong JSX**

Tìm `<DeleteConfirmDialog` trong GoldClient. Component cũ nhận `position` và tự gọi action bên trong. Component mới cần caller truyền `onConfirm`. Cần refactor:

Trước (trong GoldClient.tsx):

```tsx
<DeleteConfirmDialog
  position={deleteTarget}
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
/>
```

Sau — thêm `onConfirm` handler vào GoldClient:

```tsx
// Thêm import
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteAssetAction } from "@/app/actions/gold";

// Thêm state/transition trong component (nếu chưa có)
const [isDeleting, startDeleteTransition] = useTransition();
const router = useRouter(); // nếu chưa có

const handleDeleteConfirm = () => {
  if (!deleteTarget) return;
  startDeleteTransition(async () => {
    const result = await deleteAssetAction(deleteTarget.id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Đã xóa tài sản");
      router.refresh();
      setDeleteOpen(false);
    }
  });
};

// Trong JSX
<DeleteConfirmDialog
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  title="Xóa tài sản"
  description={
    deleteTarget
      ? `Bạn có chắc muốn xóa tài sản mua ${deleteTarget.quantity - deleteTarget.sold_quantity} chỉ ${deleteTarget.brand_name}?`
      : ""
  }
  onConfirm={handleDeleteConfirm}
  isPending={isDeleting}
/>;
```

- [ ] **Step 4: Xóa file cũ**

```bash
rm src/app/\(protected\)/gold/components/DeleteConfirmDialog.tsx
```

- [ ] **Step 5: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(protected\)/gold/GoldClient.tsx
git rm src/app/\(protected\)/gold/components/DeleteConfirmDialog.tsx
git commit -m "refactor: migrate gold delete dialog to unified DeleteConfirmDialog"
```

---

### Task 3: Migrate SavingsClient → dùng unified component

**Files:**

- Modify: `src/app/(protected)/savings/SavingsClient.tsx`
- Delete: `src/app/(protected)/savings/components/DeleteSavingsDialog.tsx`

- [ ] **Step 1: Xem usage hiện tại trong SavingsClient**

```bash
grep -n "DeleteSavingsDialog\|deleteTarget\|onOpenChange" src/app/\(protected\)/savings/SavingsClient.tsx
```

- [ ] **Step 2: Update import trong SavingsClient.tsx**

Tìm:

```ts
import { DeleteSavingsDialog } from "./components/DeleteSavingsDialog";
```

Thay bằng:

```ts
import { DeleteConfirmDialog } from "@/components/common";
```

- [ ] **Step 3: Update usage trong JSX**

Trước:

```tsx
<DeleteSavingsDialog
  account={deleteTarget}
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
/>
```

Sau — thêm handler trong SavingsClient:

```tsx
// Thêm import
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteSavingsAction } from "@/app/actions/savings";
import { formatVND } from "@/lib/utils";

// Thêm trong component
const [isDeleting, startDeleteTransition] = useTransition();

const handleDeleteConfirm = () => {
  if (!deleteTarget) return;
  startDeleteTransition(async () => {
    const result = await deleteSavingsAction(deleteTarget.id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Đã xóa khoản tiết kiệm");
      router.refresh();
      setDeleteOpen(false);
    }
  });
};

// Trong JSX
<DeleteConfirmDialog
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  title="Xóa khoản tiết kiệm"
  description={
    deleteTarget ? (
      <>
        Bạn có chắc muốn xóa khoản tiết kiệm{" "}
        <span className="text-foreground font-semibold">
          {deleteTarget.account_name || deleteTarget.bank_name}
        </span>{" "}
        — gốc {formatVND(deleteTarget.principal)}?
      </>
    ) : (
      ""
    )
  }
  onConfirm={handleDeleteConfirm}
  isPending={isDeleting}
/>;
```

- [ ] **Step 4: Xóa file cũ**

```bash
rm src/app/\(protected\)/savings/components/DeleteSavingsDialog.tsx
```

- [ ] **Step 5: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(protected\)/savings/SavingsClient.tsx
git rm src/app/\(protected\)/savings/components/DeleteSavingsDialog.tsx
git commit -m "refactor: migrate savings delete dialog to unified DeleteConfirmDialog"
```
