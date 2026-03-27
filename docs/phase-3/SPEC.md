# SPEC — App Shell Layout

## 1. Route & File Structure

```
src/app/(protected)/
├── layout.tsx          # App Shell — chứa header + bottom tab bar
├── dashboard/
│   └── page.tsx        # Placeholder
├── gold/
│   └── page.tsx        # Placeholder
├── savings/
│   └── page.tsx        # Placeholder
└── settings/
    └── page.tsx        # Placeholder
```

---

## 2. Layout — `(protected)/layout.tsx`

Client Component. Bọc toàn bộ các page protected.

Cấu trúc:

```
Screen
├── Status Bar          (static, UI only)
├── Content Area        (flex-1, scroll)
│   ├── Header Row      (trophy button + logout button)
│   └── {children}
└── Bottom Tab Bar
```

---

## 3. Bottom Tab Bar

4 tabs theo thứ tự:

| Tab       | Icon       | Label     | Route        |
| --------- | ---------- | --------- | ------------ |
| Dashboard | `house`    | DASHBOARD | `/dashboard` |
| Vàng      | `coins`    | VÀNG      | `/gold`      |
| Tiết Kiệm | `landmark` | TIẾT KIỆM | `/savings`   |
| Cài Đặt   | `settings` | CÀI ĐẶT   | `/settings`  |

**Logic active tab:**

- Dùng `usePathname()` để detect route hiện tại
- Tab active = route khớp với `pathname`

---

## 4. Header Actions

**Trophy button** → navigate `/goals` (placeholder, chưa có page — tạm thời `router.push("/goals")`, sẽ implement sau)

**Logout button** → gọi `supabase.auth.signOut()` → redirect `/login`

---

## 5. Placeholder Pages

Mỗi page chỉ cần render tên page, không có nội dung:

```tsx
// Ví dụ: dashboard/page.tsx
export default function DashboardPage() {
  return <div>Dashboard</div>;
}
```

Tương tự cho `gold`, `savings`, `settings`, `goals`.

---

## 6. Ghi chú

- Tham khảo file `design.pen` để implement UI
