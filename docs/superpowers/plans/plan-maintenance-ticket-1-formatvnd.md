# Ticket 1: Gom formatVND local — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xóa 3 bản `formatVND` được định nghĩa local trong component, thay bằng import từ canonical source `@/lib/utils`.

**Architecture:** Đơn giản — xóa function local, thêm import. Lưu ý: các bản local trả `""` khi n=0, canonical trả `"0 ₫"`. Cần xác nhận rằng behavior thay đổi này không ảnh hưởng UX (các input field này dùng placeholder riêng, không hiển thị giá trị 0).

**Tech Stack:** TypeScript, Next.js App Router

---

## File Map

| File                                                             | Thay đổi                                            |
| ---------------------------------------------------------------- | --------------------------------------------------- |
| `src/app/(protected)/savings/components/AddEditSavingsSheet.tsx` | Xóa local `formatVND`, thêm import từ `@/lib/utils` |
| `src/app/(protected)/goals/components/GoalSheet.tsx`             | Xóa local `formatVND`, thêm import từ `@/lib/utils` |
| `src/app/(protected)/settings/SettingsForm.tsx`                  | Xóa local `formatVND`, thêm import từ `@/lib/utils` |

---

### Task 1: Fix AddEditSavingsSheet.tsx

**Files:**

- Modify: `src/app/(protected)/savings/components/AddEditSavingsSheet.tsx`

- [ ] **Step 1: Xóa local formatVND và thêm import**

Tìm dòng:

```ts
function formatVND(n: number) {
  return n > 0 ? new Intl.NumberFormat("vi-VN").format(n) : "";
}
```

Xóa hoàn toàn đoạn này. Sau đó thêm vào import block đầu file:

```ts
import { formatVND } from "@/lib/utils";
```

> **Lưu ý behavior:** Local version trả `""` khi n=0. Canonical (`@/lib/utils`) trả `"0 ₫"`. Trong file này, `formatVND` được dùng để format giá trị hiển thị cho input (`principalDisplay`). Input field có `placeholder` riêng nên khi value rỗng sẽ không vấn đề gì. Kiểm tra lại bằng mắt sau khi làm.

- [ ] **Step 2: Kiểm tra build không lỗi**

```bash
npx tsc --noEmit
```

Expected: no errors liên quan đến `formatVND`.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/savings/components/AddEditSavingsSheet.tsx
git commit -m "refactor: remove local formatVND in AddEditSavingsSheet, import from utils"
```

---

### Task 2: Fix GoalSheet.tsx

**Files:**

- Modify: `src/app/(protected)/goals/components/GoalSheet.tsx`

- [ ] **Step 1: Xóa local formatVND và thêm import**

Tìm dòng:

```ts
function formatVND(n: number) {
  return n > 0 ? new Intl.NumberFormat("vi-VN").format(n) : "";
}
```

Xóa hoàn toàn. Thêm import:

```ts
import { formatVND } from "@/lib/utils";
```

- [ ] **Step 2: Kiểm tra build**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/goals/components/GoalSheet.tsx
git commit -m "refactor: remove local formatVND in GoalSheet, import from utils"
```

---

### Task 3: Fix SettingsForm.tsx

**Files:**

- Modify: `src/app/(protected)/settings/SettingsForm.tsx`

- [ ] **Step 1: Xóa local formatVND và thêm import**

Tìm dòng:

```ts
function formatVND(n: number): string {
  return n > 0 ? new Intl.NumberFormat("vi-VN").format(n) : "";
}
```

Xóa hoàn toàn. Thêm import:

```ts
import { formatVND } from "@/lib/utils";
```

> **Lưu ý:** `formatVND` trong `SettingsForm` được dùng để khởi tạo `amountDisplay` state từ `initialData.initial_cash_balance`. Nếu balance = 0, local trả `""`, canonical trả `"0 ₫"`. Input field dùng behavior này để hiển thị placeholder khi balance chưa được set — cần kiểm tra UI sau khi thay.

- [ ] **Step 2: Kiểm tra build**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/settings/SettingsForm.tsx
git commit -m "refactor: remove local formatVND in SettingsForm, import from utils"
```
