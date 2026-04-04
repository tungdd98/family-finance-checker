# Ticket 2: Hardcoded Hex → Design Token — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay thế các màu hex hardcoded trong JSX bằng Tailwind token từ design system, giúp codebase nhất quán và dễ thay đổi theme sau này.

**Architecture:** Chỉ thay class string trong JSX/TSX — không đụng logic. Token mapping được định nghĩa trong `globals.css` dưới dạng CSS custom properties và ánh xạ vào Tailwind qua `@theme inline`.

**Tech Stack:** Tailwind CSS v4 (dùng `@theme inline`), Next.js

---

## Token Mapping

| Hex hardcode | Tailwind token | CSS variable                         |
| ------------ | -------------- | ------------------------------------ |
| `#D4AF37`    | `accent`       | `--accent`                           |
| `#2a2a2a`    | `border`       | `--border`                           |
| `#1a1a1a`    | `surface`      | `--surface` (xấp xỉ — verify visual) |
| `#6B7FD7`    | _giữ nguyên_   | không có token                       |

---

### Task 1: Thay `#D4AF37` → `accent` token (15 chỗ)

**Files:** Toàn bộ `src/app/(protected)/`

- [ ] **Step 1: Tìm tất cả chỗ dùng `#D4AF37`**

```bash
grep -rn "#D4AF37\|#d4af37" src/app --include="*.tsx"
```

Expected: ~15 kết quả trải đều ở nhiều file.

- [ ] **Step 2: Thay thế theo từng pattern**

Các pattern phổ biến và cách thay:

| Pattern cũ         | Thay bằng       |
| ------------------ | --------------- |
| `text-[#D4AF37]`   | `text-accent`   |
| `bg-[#D4AF37]`     | `bg-accent`     |
| `from-[#D4AF37]`   | `from-accent`   |
| `to-[#D4AF37]`     | `to-accent`     |
| `border-[#D4AF37]` | `border-accent` |

Ví dụ trong `GoalCard.tsx`:

```tsx
// Trước
<p className="text-[30px] leading-none font-black tracking-[-1px] text-[#D4AF37]">
// Sau
<p className="text-[30px] leading-none font-black tracking-[-1px] text-accent">
```

Ví dụ gradient trong progress bar:

```tsx
// Trước
className =
  "h-full bg-gradient-to-r from-[#D4AF37] to-[#f0d060] transition-all duration-500";
// Sau — giữ to-[#f0d060] vì không có token cho nó
className =
  "h-full bg-gradient-to-r from-accent to-[#f0d060] transition-all duration-500";
```

- [ ] **Step 3: Verify không còn `#D4AF37` nào sót**

```bash
grep -rn "#D4AF37\|#d4af37" src/app --include="*.tsx"
```

Expected: 0 kết quả (hoặc chỉ còn gradient `to-[#f0d060]` là chấp nhận được).

- [ ] **Step 4: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app
git commit -m "refactor: replace hardcoded #D4AF37 hex with text-accent/bg-accent tokens"
```

---

### Task 2: Thay `#2a2a2a` → `border` token (4 chỗ)

**Files:** Toàn bộ `src/app/(protected)/`

- [ ] **Step 1: Tìm tất cả chỗ dùng `#2a2a2a`**

```bash
grep -rn "#2a2a2a\|#2A2A2A" src/app --include="*.tsx"
```

Expected: ~4 kết quả.

- [ ] **Step 2: Thay thế**

| Pattern cũ         | Thay bằng       |
| ------------------ | --------------- |
| `bg-[#2a2a2a]`     | `bg-border`     |
| `border-[#2a2a2a]` | `border-border` |

Ví dụ trong `GoalCard.tsx`:

```tsx
// Trước
<div className="inline-flex items-center gap-1.5 self-start border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5">
// Sau (chỉ thay #2a2a2a, giữ #1a1a1a để xử lý ở Task 3)
<div className="inline-flex items-center gap-1.5 self-start border border-border bg-[#1a1a1a] px-3 py-1.5">
```

- [ ] **Step 3: Verify**

```bash
grep -rn "#2a2a2a\|#2A2A2A" src/app --include="*.tsx"
```

Expected: 0 kết quả.

- [ ] **Step 4: Commit**

```bash
git add src/app
git commit -m "refactor: replace hardcoded #2a2a2a hex with border token"
```

---

### Task 3: Xử lý `#1a1a1a` (3 chỗ)

**Files:** Toàn bộ `src/app/(protected)/`

- [ ] **Step 1: Tìm tất cả chỗ dùng `#1a1a1a`**

```bash
grep -rn "#1a1a1a\|#1A1A1A" src/app --include="*.tsx"
```

Expected: ~3 kết quả.

- [ ] **Step 2: So sánh visual**

`--surface` = `#1c1c1c`, `#1a1a1a` chỉ lệch 2 đơn vị. Mở browser, so sánh hai màu cạnh nhau:

- Nếu **không phân biệt được** → thay bằng `bg-surface`
- Nếu **thấy khác rõ ràng** (tối hơn surface, dùng để tạo depth) → thêm token mới `--surface-deep: #1a1a1a` vào `globals.css`

**Nếu thêm token mới**, thêm vào `src/app/globals.css`:

```css
:root {
  /* ... existing tokens ... */
  --surface-deep: #1a1a1a;
}

@theme inline {
  /* ... existing mappings ... */
  --color-surface-deep: var(--surface-deep);
}
```

Rồi dùng `bg-surface-deep`.

- [ ] **Step 3: Áp dụng quyết định từ Step 2**

Thay `bg-[#1a1a1a]` bằng `bg-surface` hoặc `bg-surface-deep`.

- [ ] **Step 4: Verify**

```bash
grep -rn "#1a1a1a\|#1A1A1A" src/app --include="*.tsx"
```

Expected: 0 kết quả.

- [ ] **Step 5: Commit**

```bash
git add src/app src/app/globals.css
git commit -m "refactor: replace hardcoded #1a1a1a hex with surface token"
```
