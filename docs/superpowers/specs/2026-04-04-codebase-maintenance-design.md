# Codebase Maintenance — Design Spec

**Date:** 2026-04-04  
**Scope:** Dọn dẹp kỹ thuật, không thêm tính năng mới  
**Approach:** Nhóm theo loại vấn đề, làm lần lượt từng ticket, commit riêng từng phần

---

## Bối cảnh

Project đã hoàn thiện Phase 1. Trước khi tiếp tục phát triển, cần dọn dẹp các vấn đề kỹ thuật tích lũy:

- Sử dụng design system chưa nhất quán (token, typography)
- Lặp code (formatVND, delete dialog)
- File quá lớn (CashflowClient)
- Cross-feature imports

---

## Ticket 1 — Gom `formatVND` local

**Vấn đề:**  
Ba file tự định nghĩa lại hàm `formatVND` thay vì import từ canonical source:

- `src/app/(protected)/savings/components/AddEditSavingsSheet.tsx` — trả `""` khi n=0
- `src/app/(protected)/goals/components/GoalSheet.tsx`
- `src/app/(protected)/settings/SettingsForm.tsx`

Canonical source: `src/lib/utils.ts` (trả `"0 ₫"` khi n=0), re-exported qua `src/lib/gold-utils.ts`.

**Fix:**

- Xóa các bản local
- Import từ `@/lib/utils` hoặc `@/lib/gold-utils`
- Kiểm tra UI cho trường hợp n=0 trong `AddEditSavingsSheet` để đảm bảo behavior không thay đổi

**Files cần sửa:**

- `src/app/(protected)/savings/components/AddEditSavingsSheet.tsx`
- `src/app/(protected)/goals/components/GoalSheet.tsx`
- `src/app/(protected)/settings/SettingsForm.tsx`

---

## Ticket 2 — Hardcoded hex → design token

**Vấn đề:**  
Design tokens đã định nghĩa trong `globals.css` nhưng một số màu vẫn bị hardcode trong JSX:

| Hex       | Số lần | Token tương ứng                                               |
| --------- | ------ | ------------------------------------------------------------- |
| `#D4AF37` | 15     | `--accent` → `text-accent`, `bg-accent`                       |
| `#2a2a2a` | 4      | `--border` → `bg-border`, `border-border`                     |
| `#1a1a1a` | 3      | gần `--surface` (`#1c1c1c`) — verify trực quan trước khi swap |
| `#6B7FD7` | 3      | màu riêng (không có token), giữ nguyên                        |

**Fix:**

- Thay `bg-[#D4AF37]`, `text-[#D4AF37]` bằng `bg-accent`, `text-accent`
- Thay `bg-[#2a2a2a]`, `border-[#2a2a2a]` bằng `bg-border`, `border-border`
- `#1a1a1a` — so sánh visual với `--surface`, nếu gần đủ thì dùng `bg-surface`; nếu cần tối hơn, xem xét thêm token mới
- `#6B7FD7` — giữ nguyên (màu đặc thù, chưa cần token)

**Files cần rà soát:** toàn bộ `src/app/(protected)/`

---

## Ticket 3 — Typography classes chưa áp dụng

**Vấn đề:**  
`globals.css` định nghĩa typography scale (`type-section-label`, `type-body`, `type-card-label`, v.v.) nhưng components vẫn viết thẳng combo class:

- `text-[11px] font-semibold tracking-[1.5px] uppercase` thay vì `.type-section-label`
- `text-[13px] font-medium` thay vì `.type-body`
- `text-[10px] font-medium tracking-[0.015em] uppercase` thay vì `.type-card-label`

**Typography scale hiện có:**

```
.type-large-title    → text-[42px] font-bold tracking-[-0.01em]
.type-metric-value   → text-[36px] font-bold tracking-[-0.02em]
.type-featured-stat  → text-[28px] font-bold
.type-card-title     → text-[18px] font-bold uppercase
.type-body           → text-[13px] font-medium
.type-callout        → text-[12px] font-normal
.type-section-label  → text-[11px] font-semibold tracking-[0.02em] uppercase (foreground-muted)
.type-card-label     → text-[10px] font-medium tracking-[0.015em] uppercase (foreground-muted)
.type-tab-label      → text-[9px] font-medium tracking-[0.005em] uppercase
```

**Fix:**

- Rà soát `text-[Npx]` kết hợp font/tracking, map sang class tương ứng
- Chỉ thay những combo khớp chính xác (size + weight + tracking) — không ép những chỗ khác biệt về color hoặc intent

---

## Ticket 4 — Unified `DeleteDialog` component

**Vấn đề:**  
`DeleteConfirmDialog` (gold) và `DeleteSavingsDialog` (savings) là copy-paste với nhau:

- Cùng structure, animation, button layout
- Khác nhau ở text và action function
- Còn không nhất quán: width `w-[calc(100%-56px)]` vs `w-[calc(100%-40px)]`
- Cả hai dùng raw `Dialog` từ `@base-ui/react/dialog` thay vì `ResponsiveModal` đã có

**Fix:**  
Tạo `src/components/common/delete-confirm-dialog.tsx` với interface:

```ts
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  isPending: boolean;
}
```

- Dùng `ResponsiveModal` thay vì raw `Dialog`
- Xóa `DeleteConfirmDialog.tsx` và `DeleteSavingsDialog.tsx`
- Export từ `src/components/common/index.ts`
- Update import tại `GoldClient.tsx` và `SavingsClient.tsx`

---

## Ticket 5 — CashflowClient tách nhỏ

**Vấn đề:**  
`src/app/(protected)/cashflow/CashflowClient.tsx` là 1004 dòng, đang đảm nhiệm:

- Constants (EXPENSE_CATEGORIES, INCOME_CATEGORIES)
- Local utility function (formatMil)
- Nhiều sub-components (form sections, tab panels)
- Business logic + state management
- Main render

**Fix — tách thành:**

- `cashflow/constants.ts` — EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatMil
- `cashflow/components/IncomeForm.tsx` — tab nhập thu nhập
- `cashflow/components/ExpenseForm.tsx` — tab nhập chi tiêu
- `cashflow/components/AllocationForm.tsx` — tab phân bổ
- `CashflowClient.tsx` — chỉ còn orchestration: state, handlers, layout chính

---

## Ticket 6 — Cross-feature import

**Vấn đề:**  
`CashflowClient.tsx` import `OptionPicker` từ `src/app/(protected)/savings/components/OptionPicker.tsx` — vượt ranh giới module.

**Fix:**

- Di chuyển `OptionPicker` lên `src/components/common/option-picker.tsx`
- Export từ `src/components/common/index.ts`
- Update import tại `CashflowClient.tsx`, `AddEditSavingsSheet.tsx`, và bất kỳ nơi nào khác đang dùng

---

## Thứ tự thực hiện

1. Ticket 1 (formatVND) — nhỏ, ít rủi ro
2. Ticket 2 (hex colors) — nhỏ, ít rủi ro
3. Ticket 3 (typography) — trung bình, cần rà soát kỹ
4. Ticket 4 (delete dialog) — trung bình, cần tạo component mới
5. Ticket 6 (cross-feature import) — làm trước Ticket 5 vì liên quan đến CashflowClient
6. Ticket 5 (CashflowClient) — lớn nhất, làm cuối
