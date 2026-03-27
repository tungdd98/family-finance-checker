# Phase 3 — App Shell Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the authenticated App Shell layout (Status Bar + Header + Bottom Tab Bar) that wraps all protected pages, plus placeholder pages for new routes.

**Architecture:** Single `"use client"` layout component calls `usePathname()` and passes the active path to the existing `TabBar` component. Logout is a server action invoked via `<form>`. Middleware is expanded to protect all new routes.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, Supabase SSR, Lucide React icons.

---

## File Map

| File                                    | Change                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| `src/app/actions/auth.ts`               | Add `logoutAction` server action                       |
| `src/proxy.ts`                          | Expand `isProtected` to cover new routes               |
| `src/components/common/tab-bar.tsx`     | Switch tab items to vertical layout (icon above label) |
| `src/app/(protected)/layout.tsx`        | Implement full App Shell as Client Component           |
| `src/app/(protected)/gold/page.tsx`     | New placeholder page                                   |
| `src/app/(protected)/savings/page.tsx`  | New placeholder page                                   |
| `src/app/(protected)/settings/page.tsx` | New placeholder page                                   |
| `src/app/(protected)/goals/page.tsx`    | New placeholder page                                   |

---

### Task 1: Add `logoutAction` server action

**Files:**

- Modify: `src/app/actions/auth.ts`

The file already has `"use server"` at the top, so the new function is automatically a Server Action.

- [ ] **Step 1: Add `logoutAction` to `src/app/actions/auth.ts`**

Open `src/app/actions/auth.ts`. The current file ends after `loginAction`. Add the following function at the bottom:

```ts
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

The complete file should look like:

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

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/mac/Desktop/family-finance-tracker
npx tsc --noEmit
```

Expected: no errors on `auth.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/auth.ts
git commit -m "feat: add logoutAction server action"
```

---

### Task 2: Expand middleware to protect new routes

**Files:**

- Modify: `src/proxy.ts`

- [ ] **Step 1: Update `isProtected` in `src/proxy.ts`**

Find this line:

```ts
const isProtected = pathname.startsWith("/dashboard");
```

Replace with:

```ts
const isProtected =
  pathname.startsWith("/dashboard") ||
  pathname.startsWith("/gold") ||
  pathname.startsWith("/savings") ||
  pathname.startsWith("/settings") ||
  pathname.startsWith("/goals");
```

- [ ] **Step 2: Commit**

```bash
git add src/proxy.ts
git commit -m "feat: expand middleware to protect new routes"
```

---

### Task 3: Update `TabBar` to vertical layout

**Files:**

- Modify: `src/components/common/tab-bar.tsx`

The design specifies tab items as vertical (icon on top, label below), but the current component is horizontal. The nav element (`<nav>`) is the pill container itself.

Design tokens (from `globals.css`):

- `bg-surface` = `#1c1c1c` (pill background)
- `bg-accent` = `#d4af37` (active tab fill)
- `rounded-pill` = 36px (pill outer radius)
- `rounded-pill-item` = 26px (tab item radius)
- `text-foreground-muted` = `#666666` (inactive icon/label)
- `border-border` = `#2a2a2a` (pill border)

- [ ] **Step 1: Rewrite `src/components/common/tab-bar.tsx`**

```tsx
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface TabItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface TabBarProps {
  items: TabItem[];
  activeHref: string;
}

export function TabBar({ items, activeHref }: Readonly<TabBarProps>) {
  return (
    <nav className="bg-surface rounded-pill border-border flex h-full border p-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "bg-accent rounded-pill-item flex flex-1 flex-col items-center justify-center gap-1"
                : "rounded-pill-item flex flex-1 flex-col items-center justify-center gap-1"
            }
          >
            <Icon
              size={18}
              className={isActive ? "text-[#111111]" : "text-foreground-muted"}
            />
            <span
              className={`type-tab-label ${isActive ? "font-semibold text-[#111111]" : "text-foreground-muted font-medium"}`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/common/tab-bar.tsx
git commit -m "feat: update TabBar to vertical icon-above-label layout"
```

---

### Task 4: Implement App Shell layout

**Files:**

- Modify: `src/app/(protected)/layout.tsx`

Before writing: open the design file to verify token values.

```
docs/phase-3/design.pen — node 08FXG (App Shell)
  MJuL7 = Status Bar (h: 62, padding: [0,20])
  iIKaK = Content Area (gap: 20, padding: [24,28,28,28])
  HLr39 = Header Row (gap: 8, justifyContent: end)
  Kzrfu = Trophy btn (38×38, bg #1C1C1C, cornerRadius: 8, icon #A0A0A0)
  e3IGD = Logout btn (same style)
  aqrHI = Bottom Tab Bar (h: 95, padding: [12,21,21,21])
  m7lhM = Tab Pill (h: 62, p: 4, bg #1C1C1C, cornerRadius: 36)
```

Pixel values translated to Tailwind v4 (base: 1 unit = 4px):

- h-[62px], px-5 (20px), gap-5 (20px), pt-6 (24px), px-7 (28px), pb-7 (28px)
- h-[95px], pt-3 (12px), px-[21px], pb-[21px]
- w-[38px] h-[38px], gap-2 (8px)

The layout is `"use client"` because it calls `usePathname()`. The `logoutAction` is imported from `@/app/actions/auth` (a file marked `"use server"` — Client Components can import and call Server Actions this way per Next.js 16 docs).

- [ ] **Step 1: Rewrite `src/app/(protected)/layout.tsx`**

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Battery,
  Coins,
  House,
  Landmark,
  LogOut,
  Settings,
  Signal,
  Trophy,
  Wifi,
} from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { TabBar } from "@/components/common";

const TAB_ITEMS = [
  { icon: House, label: "DASHBOARD", href: "/dashboard" },
  { icon: Coins, label: "VÀNG", href: "/gold" },
  { icon: Landmark, label: "TIẾT KIỆM", href: "/savings" },
  { icon: Settings, label: "CÀI ĐẶT", href: "/settings" },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="bg-background flex h-dvh flex-col">
      {/* Status Bar */}
      <div className="bg-background flex h-[62px] items-center justify-between px-5">
        <span className="text-[15px] font-semibold tracking-[-0.3px] text-white">
          9:41
        </span>
        <div className="flex items-center gap-1.5">
          <Signal size={18} className="text-white" />
          <Wifi size={18} className="text-white" />
          <Battery size={18} className="text-white" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto pt-6 pr-7 pb-7 pl-7">
        {/* Header Row */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => router.push("/goals")}
            className="border-border bg-surface flex h-[38px] w-[38px] items-center justify-center rounded-lg border"
          >
            <Trophy size={18} className="text-foreground-secondary" />
          </button>
          <form action={logoutAction}>
            <button
              type="submit"
              className="border-border bg-surface flex h-[38px] w-[38px] items-center justify-center rounded-lg border"
            >
              <LogOut size={18} className="text-foreground-secondary" />
            </button>
          </form>
        </div>

        {children}
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-background h-[95px] px-[21px] pt-3 pb-[21px]">
        <TabBar activeHref={pathname} items={TAB_ITEMS} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/layout.tsx
git commit -m "feat: implement App Shell layout with status bar, header, and tab bar"
```

---

### Task 5: Create placeholder pages

**Files:**

- Create: `src/app/(protected)/gold/page.tsx`
- Create: `src/app/(protected)/savings/page.tsx`
- Create: `src/app/(protected)/settings/page.tsx`
- Create: `src/app/(protected)/goals/page.tsx`

- [ ] **Step 1: Create `src/app/(protected)/gold/page.tsx`**

```tsx
export default function GoldPage() {
  return <div>Gold</div>;
}
```

- [ ] **Step 2: Create `src/app/(protected)/savings/page.tsx`**

```tsx
export default function SavingsPage() {
  return <div>Savings</div>;
}
```

- [ ] **Step 3: Create `src/app/(protected)/settings/page.tsx`**

```tsx
export default function SettingsPage() {
  return <div>Settings</div>;
}
```

- [ ] **Step 4: Create `src/app/(protected)/goals/page.tsx`**

```tsx
export default function GoalsPage() {
  return <div>Goals</div>;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/gold/page.tsx \
        src/app/\(protected\)/savings/page.tsx \
        src/app/\(protected\)/settings/page.tsx \
        src/app/\(protected\)/goals/page.tsx
git commit -m "feat: add placeholder pages for gold, savings, settings, goals"
```

---

### Task 6: Final build verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected output: build completes with no errors. You should see routes listed:

```
Route (app)
├ ○ /dashboard
├ ○ /gold
├ ○ /savings
├ ○ /settings
└ ○ /goals
```

(or similar — exact output format varies)

- [ ] **Step 2: Smoke test in browser**

```bash
npm run dev
```

1. Visit `http://localhost:3000/login` — should show login page
2. Log in — should redirect to `/dashboard` and show the App Shell (status bar, header buttons, tab bar)
3. Tap each tab — active tab should highlight in gold, icon+label should be vertical
4. Tap the logout button — should redirect to `/login`
5. Visit `http://localhost:3000/gold` without being logged in — should redirect to `/login`
