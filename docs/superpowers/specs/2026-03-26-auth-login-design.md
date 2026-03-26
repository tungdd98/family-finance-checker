# Design: Auth Login — Phase 2

**Date:** 2026-03-26
**Status:** Approved

---

## Overview

Implement authentication for the Family Finance Tracker app. Phase 2 delivers a login page, route-protection middleware, and a placeholder dashboard. No signup or forgot-password flow — users are created directly in the Supabase Dashboard.

---

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          — Client Component (login form UI)
│   ├── (protected)/
│   │   ├── layout.tsx            — existing pass-through
│   │   └── dashboard/
│   │       └── page.tsx          — placeholder (to be built in a later phase)
│   └── actions/
│       └── auth.ts               — Server Action: loginAction()
├── lib/
│   ├── supabase/
│   │   ├── client.ts             — existing browser client
│   │   └── server.ts             — existing server client
│   └── validations/
│       └── auth.ts               — loginSchema (zod)
└── middleware.ts                  — route protection
```

---

## Architecture

### Approach: react-hook-form validate → call Server Action manually

react-hook-form handles client-side validation and UX. On a valid submission it calls the Server Action inside `startTransition`. The Server Action handles Supabase auth and session — it either redirects on success or returns a typed error object for the client to display.

**Data flow:**

```
LoginPage (Client Component)
  └─ react-hook-form validates on blur
      └─ handleSubmit → startTransition(loginAction(data))
          └─ loginAction (Server Action)
              ├─ zod.parse(data)
              ├─ supabase.auth.signInWithPassword()
              ├─ success → redirect('/dashboard')
              └─ error → return { error: "..." }
```

---

## Components

### `src/lib/validations/auth.ts`

```ts
export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

### `src/app/actions/auth.ts`

- `"use server"` directive
- Accepts `LoginInput`, validates with `loginSchema.parse()`
- Calls `createClient()` from `src/lib/supabase/server.ts`
- On success: `redirect('/dashboard')`
- On Supabase error: returns `{ error: "Email hoặc mật khẩu không đúng" }`
- On unexpected error: returns `{ error: "Đã có lỗi xảy ra. Vui lòng thử lại." }`

### `src/app/(auth)/login/page.tsx`

- `"use client"` directive
- Uses `react-hook-form` with `zodResolver(loginSchema)`
- Uses `useTransition` for loading state (`isPending`)
- `handleSubmit` calls `startTransition(() => loginAction(data))` then checks returned error
- On error response: `form.setError('root', { message: error })`
- UI matches `design.pen`: dark card (#1C1C1C), gold button (#D4AF37), dark fields (#282828)
- Uses `<Input>` and `<Button>` from Phase 1 design system with style overrides
- Field errors show inline on blur; root error shows as banner above the submit button

**Form states:**

| State                 | Button label        | Interactable                            |
| --------------------- | ------------------- | --------------------------------------- |
| Idle                  | `ĐĂNG NHẬP`         | Yes                                     |
| Loading (`isPending`) | `ĐANG ĐĂNG NHẬP...` | No (button + fields disabled)           |
| Field error           | `ĐĂNG NHẬP`         | Yes, error shown inline below field     |
| Root error            | `ĐĂNG NHẬP`         | Yes, error shown as banner above button |

### `src/middleware.ts`

- Creates a Supabase client inline using `createServerClient` from `@supabase/ssr`, with cookie adapter reading from `NextRequest` and writing to `NextResponse` (cannot use `server.ts` — middleware runs at Edge, no `cookies()` from `next/headers`)
- Calls `supabase.auth.getUser()` on every matched request (strict verification, no stale-cookie optimism)
- Unauthenticated user on protected route → `redirect('/login')`
- Authenticated user on `/login` → `redirect('/dashboard')`
- Otherwise → `NextResponse.next()` with refreshed cookies forwarded

```ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### `src/app/(protected)/dashboard/page.tsx`

Empty placeholder — just a named export returning `null` or a minimal `<div>`. Exists solely so the middleware redirect target resolves without a 404.

---

## Error Handling

- Zod validation errors surface client-side via react-hook-form (no server round-trip for field errors)
- Supabase auth errors (wrong credentials, rate limit, network) are caught in the Server Action and returned as `{ error: string }`
- The client maps all non-redirect returns to `form.setError('root', ...)`

---

## Out of Scope

- Signup / registration
- Forgot password / password reset
- OAuth / social login
- Remember me / session duration control
- Dashboard content (later phase)
