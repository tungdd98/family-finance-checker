# Ticket 3: Typography Classes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay các combo class Tailwind viết tay bằng typography utility classes đã định nghĩa trong `globals.css`, giúp codebase nhất quán và dễ cập nhật typography scale toàn cục.

**Architecture:** Chỉ thay class string trong JSX — không đụng logic. Typography classes được định nghĩa trong `@layer components` của `globals.css`. Chỉ thay khi combo khớp **chính xác** — không ép những chỗ có intent riêng (color, size khác biệt nhỏ).

**Tech Stack:** Tailwind CSS v4, Next.js

---

## Typography Scale Reference

```
.type-large-title   → text-[42px] font-bold tracking-[-0.01em]
.type-metric-value  → text-[36px] font-bold tracking-[-0.02em]
.type-featured-stat → text-[28px] font-bold
.type-card-title    → text-[18px] font-bold uppercase
.type-body          → text-[13px] font-medium
.type-callout       → text-[12px] font-normal
.type-section-label → text-[11px] font-semibold tracking-[0.02em] uppercase + text-foreground-muted
.type-card-label    → text-[10px] font-medium tracking-[0.015em] uppercase + text-foreground-muted
.type-tab-label     → text-[9px] font-medium tracking-[0.005em] uppercase
```

**Quy tắc thay thế:**

- Class utility đã chứa color (`text-foreground-muted`) → khi thay bằng type class, **giữ nguyên** color override nếu cần màu khác
- Nếu một element chỉ cần 1-2 class khác ngoài combo → thay và giữ lại class riêng đó

---

### Task 1: Thay `.type-section-label` combos

**Pattern khớp:** `text-[11px] font-semibold tracking-[1.5px] uppercase` (với hoặc không có `text-foreground-muted`)

> Lưu ý: `tracking-[1.5px]` trong code và `tracking-[0.02em]` trong class định nghĩa là xấp xỉ nhau (với font-size 11px, 0.02em ≈ 0.22px, nhưng 1.5px là px tuyệt đối). Đây là chỗ cần quyết định: nếu giữ pixel thì vẫn dùng `tracking-[1.5px]`, nếu muốn nhất quán với design system thì dùng class `type-section-label`. Nô tỳ khuyến nghị ưu tiên class để nhất quán.

- [ ] **Step 1: Tìm tất cả pattern**

```bash
grep -rn "text-\[11px\].*font-semibold\|font-semibold.*text-\[11px\]" src/app --include="*.tsx"
```

- [ ] **Step 2: Rà soát từng kết quả**

Với mỗi kết quả, kiểm tra element có thêm class nào không nằm trong combo. Ví dụ:

```tsx
// Trước — khớp hoàn toàn
<div className="text-foreground-muted text-[11px] font-semibold tracking-[1.5px] uppercase">
// Sau
<div className="type-section-label">

// Trước — có thêm color override khác
<span className="text-accent text-[11px] font-semibold tracking-[1.5px] uppercase">
// Sau — giữ color, dùng class nhưng override color
<span className="type-section-label text-accent">
```

- [ ] **Step 3: Thay trong CashflowClient.tsx (nhiều nhất)**

Trong `src/app/(protected)/cashflow/CashflowClient.tsx`, tìm các header label của summary cards:

```tsx
// Trước
<div className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px] uppercase">
  Thu
</div>
// Sau
<div className="type-card-label">
  Thu
</div>
```

- [ ] **Step 4: Thay trong các file còn lại**

Các file cần kiểm tra:

- `src/app/(protected)/assets/AssetsClient.tsx`
- `src/app/(protected)/gold/components/*.tsx`
- `src/app/(protected)/savings/components/*.tsx`
- `src/app/(protected)/dashboard/components/*.tsx`

- [ ] **Step 5: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app
git commit -m "refactor: replace manual tracking/font combos with type-section-label class"
```

---

### Task 2: Thay `.type-card-label` combos

**Pattern khớp:** `text-[10px] font-semibold tracking-[1.5px] uppercase` hoặc `text-[10px] font-medium tracking-[0.015em] uppercase`

- [ ] **Step 1: Tìm tất cả pattern**

```bash
grep -rn "text-\[10px\].*uppercase\|uppercase.*text-\[10px\]" src/app --include="*.tsx"
```

- [ ] **Step 2: Thay thế**

```tsx
// Trước
<span className="text-foreground-muted text-[10px] font-semibold tracking-[1.5px] uppercase">
// Sau
<span className="type-card-label">

// Trước — có color khác
<span className="text-accent text-[10px] font-semibold tracking-[1.5px] uppercase">
// Sau
<span className="type-card-label text-accent">
```

- [ ] **Step 3: Build check và commit**

```bash
npx tsc --noEmit
git add src/app
git commit -m "refactor: replace manual combos with type-card-label class"
```

---

### Task 3: Thay `.type-featured-stat` combos

**Pattern khớp:** `text-[28px] font-bold tracking-[-1px]` (page titles)

- [ ] **Step 1: Tìm pattern**

```bash
grep -rn "text-\[28px\]" src/app --include="*.tsx"
```

- [ ] **Step 2: Thay thế page title headings**

```tsx
// Trước
<h1 className="text-foreground text-[28px] font-bold tracking-[-1px] uppercase">
// Sau — type-featured-stat chứa text-foreground, font-bold, text-[28px]; thêm uppercase riêng
<h1 className="type-featured-stat uppercase">
```

> `type-featured-stat` không chứa `uppercase` — chỉ thêm khi cần.

- [ ] **Step 3: Build check và commit**

```bash
npx tsc --noEmit
git add src/app
git commit -m "refactor: replace text-[28px] font-bold combos with type-featured-stat class"
```

---

### Task 4: Thay `.type-body` combos

**Pattern khớp:** `text-[13px] font-medium` (không có tracking đặc biệt)

- [ ] **Step 1: Tìm pattern**

```bash
grep -rn "text-\[13px\] font-medium\|font-medium.*text-\[13px\]" src/app --include="*.tsx"
```

- [ ] **Step 2: Xem xét từng kết quả**

Chỉ thay khi **không** có tracking tùy chỉnh, vì `type-body` không có tracking. Ví dụ:

```tsx
// Trước — khớp hoàn toàn
<span className="text-foreground text-[13px] font-medium">
// Sau
<span className="type-body">

// Trước — có tracking riêng → KHÔNG thay
<span className="text-foreground text-[13px] font-medium tracking-[-0.5px]">
```

- [ ] **Step 3: Build check và commit**

```bash
npx tsc --noEmit
git add src/app
git commit -m "refactor: replace text-[13px] font-medium combos with type-body class"
```
