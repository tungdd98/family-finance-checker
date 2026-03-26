# SPEC — Feature Auth: Login Page

## 1. Route & File Structure

```
src/app/(auth)/
└── login/
    └── page.tsx

src/middleware.ts
src/lib/validations/auth.ts
```

---

## 2. Middleware

**File:** `src/middleware.ts`

- User chưa đăng nhập, truy cập route protected → redirect `/login`
- User đã đăng nhập, truy cập `/login` → redirect `/dashboard`

```ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 3. Validation Schema

**File:** `src/lib/validations/auth.ts`

```ts
export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
```

---

## 4. Form Logic

**File:** `src/app/(auth)/login/page.tsx` — Client Component

- Dùng `react-hook-form` + `zod` resolver
- Submit → gọi `supabase.auth.signInWithPassword()`
- Thành công → redirect `/dashboard`
- Thất bại → `form.setError("root", { message: "Email hoặc mật khẩu không đúng" })`
- Lỗi field hiển thị inline khi blur
- Button disabled + text `"ĐANG ĐĂNG NHẬP..."` khi đang loading

---

## 5. Placeholder Dashboard

**File:** `src/app/(protected)/dashboard/page.tsx`

Trang trống để middleware không lỗi. Sẽ implement ở phase sau.

---

## 6. Ghi chú

- Không có đăng ký, quên mật khẩu — tạo user trực tiếp trên Supabase Dashboard
- Tham khảo file `design.pen` để implement UI
