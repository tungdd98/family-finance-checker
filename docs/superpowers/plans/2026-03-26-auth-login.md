# Auth Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement login page, route-protection proxy, and placeholder dashboard for Phase 2 auth.

**Architecture:** react-hook-form handles client-side validation; on valid submit it calls a Server Action via `startTransition`. The Server Action calls Supabase `signInWithPassword`, then either `redirect('/dashboard')` on success or returns `{ error: string }` on failure. A `proxy.ts` file (Next.js 16 — `middleware.ts` is deprecated) checks the session on every request and redirects unauthenticated users.

**Tech Stack:** Next.js 16 (`proxy.ts` for route protection), React 19 (`useTransition`), Supabase SSR (`@supabase/ssr`), react-hook-form 7, Zod 4, Tailwind CSS 4

---

## File Map

| File                                     | Status     | Responsibility                                                    |
| ---------------------------------------- | ---------- | ----------------------------------------------------------------- |
| `src/lib/validations/auth.ts`            | **Create** | Zod schema for login form                                         |
| `src/app/actions/auth.ts`                | **Create** | `loginAction` Server Action                                       |
| `src/proxy.ts`                           | **Create** | Route protection (NOT `middleware.ts` — deprecated in Next.js 16) |
| `src/app/(protected)/dashboard/page.tsx` | **Create** | Empty placeholder so proxy redirect target resolves               |
| `src/app/(auth)/login/page.tsx`          | **Modify** | Full login form UI (currently an empty stub)                      |

> **Note:** No test framework is configured in this project. Each task uses `pnpm dev` + manual browser verification in place of automated tests.

---

## Task 1: Validation Schema

**Files:**

- Create: `src/lib/validations/auth.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/validations/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations/auth.ts
git commit -m "feat: add login zod validation schema"
```

---

## Task 2: Login Server Action

**Files:**

- Create: `src/app/actions/auth.ts`

- [ ] **Step 1: Create the Server Action**

```ts
// src/app/actions/auth.ts
"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export async function loginAction(
  data: LoginInput
): Promise<{ error: string } | never> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Dữ liệu không hợp lệ." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  redirect("/dashboard");
}
```

> **Important:** `redirect()` is called **outside** any `try/catch` block — it throws internally and Next.js handles it. If you wrap it in try/catch, the redirect will be caught and swallowed.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/auth.ts
git commit -m "feat: add login server action"
```

---

## Task 3: Placeholder Dashboard

**Files:**

- Create: `src/app/(protected)/dashboard/page.tsx`

This page exists purely so the proxy redirect to `/dashboard` resolves without a 404. Content is implemented in a later phase.

- [ ] **Step 1: Create the placeholder**

```tsx
// src/app/(protected)/dashboard/page.tsx
export default function DashboardPage() {
  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/dashboard/page.tsx
git commit -m "feat: add placeholder dashboard page"
```

---

## Task 4: Proxy (Route Protection)

**Files:**

- Create: `src/proxy.ts`

> **Breaking change — Next.js 16:** The `middleware.ts` file convention is **deprecated**. Use `proxy.ts` with an exported `proxy()` function. The `config` matcher works the same way.

The proxy needs its own inline Supabase client because it runs before React rendering and cannot use `cookies()` from `next/headers`. It reads/writes cookies directly from `NextRequest`/`NextResponse`.

- [ ] **Step 1: Create `src/proxy.ts`**

```ts
// src/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() — not getSession() — is required for strict verification.
  // getSession() reads from the cookie without verifying the token with Supabase servers.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith("/dashboard");
  const isLoginPage = pathname === "/login";

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Verify proxy works (manual)**

Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`, then run:

```bash
pnpm dev
```

Open `http://localhost:3000/dashboard` in the browser while not logged in.
Expected: Browser redirects to `http://localhost:3000/login`.

- [ ] **Step 4: Commit**

```bash
git add src/proxy.ts
git commit -m "feat: add route protection proxy"
```

---

## Task 5: Login Page UI

**Files:**

- Modify: `src/app/(auth)/login/page.tsx`

Design reference: `docs/phase-2/design.pen` — dark card on black background, gold accent, Space Grotesk font. All colors are covered by the existing design system tokens (no hex values needed).

- [ ] **Step 1: Replace the empty stub**

```tsx
// src/app/(auth)/login/page.tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginAction } from "@/app/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      const result = await loginAction(data);
      if (result?.error) {
        form.setError("root", { message: result.error });
      }
    });
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-7">
      <div className="bg-surface w-full max-w-sm p-10">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4">
          <div className="bg-accent h-8 w-8" />
          <h1 className="text-foreground text-[28px] font-bold tracking-[-1px]">
            FAMILY FINANCE
          </h1>
          <p className="text-foreground-secondary text-[11px] font-medium tracking-[2px]">
            QUẢN LÝ TÀI SẢN GIA ĐÌNH
          </p>
          <div className="bg-accent h-px w-full" />
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="email"
                className="text-foreground-secondary flex items-center gap-2 text-[11px] tracking-[1.5px]"
              >
                <span className="text-accent">✦</span>
                EMAIL
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isPending}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-status-negative text-[11px]">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password"
                className="text-foreground-secondary flex items-center gap-2 text-[11px] tracking-[1.5px]"
              >
                <span className="text-accent">✦</span>
                MẬT KHẨU
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={isPending}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-status-negative text-[11px]">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Root error */}
            {form.formState.errors.root && (
              <p className="border-status-negative text-status-negative border px-4 py-3 text-[12px]">
                {form.formState.errors.root.message}
              </p>
            )}

            {/* Submit */}
            <Button type="submit" disabled={isPending} className="mt-2 h-14">
              {isPending ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Manual smoke test — field validation**

```bash
pnpm dev
```

Open `http://localhost:3000/login`.

1. Submit with empty fields → both inline errors appear
2. Enter invalid email format → "Email không hợp lệ" appears on blur
3. Tab through password without typing → "Vui lòng nhập mật khẩu" appears on blur

- [ ] **Step 4: Manual smoke test — auth flow**

> Requires `.env.local` with valid Supabase credentials and a test user created in Supabase Dashboard.

1. Enter wrong credentials → root error banner "Email hoặc mật khẩu không đúng." appears
2. During submit → button shows "ĐANG ĐĂNG NHẬP..." and is disabled
3. Enter correct credentials → redirects to `/dashboard`
4. While logged in, navigate to `http://localhost:3000/login` → auto-redirects to `/dashboard`
5. Log out via Supabase (or clear cookies) → navigate to `http://localhost:3000/dashboard` → redirects to `/login`

- [ ] **Step 5: Commit**

```bash
git add src/app/(auth)/login/page.tsx
git commit -m "feat: implement login page UI with react-hook-form"
```

---

## Task 6: Update Design Spec

The original spec referenced `src/middleware.ts` but Next.js 16 uses `src/proxy.ts`. Update the spec to reflect this.

- [ ] **Step 1: Update the spec file**

In `docs/superpowers/specs/2026-03-26-auth-login-design.md`:

- In the **File Structure** section, change `middleware.ts` → `proxy.ts`
- In the **`src/middleware.ts`** section heading, change to **`src/proxy.ts`**
- Add note: _"Next.js 16 breaking change: `middleware.ts` is deprecated; use `proxy.ts` with `export function proxy()`."_

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-03-26-auth-login-design.md
git commit -m "docs: update spec to reflect middleware→proxy rename (Next.js 16)"
```
