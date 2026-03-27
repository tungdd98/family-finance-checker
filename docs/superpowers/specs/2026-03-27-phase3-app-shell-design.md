# Design: Phase 3 — App Shell Layout

**Date:** 2026-03-27
**Status:** Approved

---

## 1. Overview

Implement the authenticated App Shell: a full-screen layout wrapping all protected pages. It contains a static Status Bar, a scrollable Content Area with header actions, and a bottom tab bar for primary navigation.

---

## 2. Files Changed

| File                                    | Action                                                          |
| --------------------------------------- | --------------------------------------------------------------- |
| `src/app/(protected)/layout.tsx`        | Modify — implement App Shell as Client Component                |
| `src/app/(protected)/gold/page.tsx`     | New — placeholder page                                          |
| `src/app/(protected)/savings/page.tsx`  | New — placeholder page                                          |
| `src/app/(protected)/settings/page.tsx` | New — placeholder page                                          |
| `src/app/(protected)/goals/page.tsx`    | New — placeholder page                                          |
| `src/app/actions/auth.ts`               | Modify — add `logoutAction` server action                       |
| `src/proxy.ts`                          | Modify — expand protected route matcher                         |
| `src/components/common/tab-bar.tsx`     | Modify — switch tab items to vertical layout (icon above label) |

---

## 3. Route Structure

```
src/app/(protected)/
├── layout.tsx          # App Shell
├── dashboard/
│   └── page.tsx        # Already exists
├── gold/
│   └── page.tsx        # Placeholder: <div>Gold</div>
├── savings/
│   └── page.tsx        # Placeholder: <div>Savings</div>
├── settings/
│   └── page.tsx        # Placeholder: <div>Settings</div>
└── goals/
    └── page.tsx        # Placeholder: <div>Goals</div>
```

---

## 4. App Shell Layout

`(protected)/layout.tsx` is a `"use client"` component. It calls `usePathname()` to detect the active tab and passes it to `<TabBar>`.

### Visual structure

```
<div> full-screen, vertical flex, bg #111111
  ├── Status Bar          static, h-62px, bg #111111, px-20, flex justify-between
  │   ├── "9:41" — Space Grotesk 15px/600, white, letter-spacing -0.3
  │   └── Icons row (signal, wifi, battery) — white, 18×18, gap-6
  │
  ├── Content Area        flex-1, overflow-y-auto, vertical flex, gap-20
  │                       padding: top-24 right-28 bottom-28 left-28
  │   ├── Header Row      flex, justify-end, gap-8, width full
  │   │   ├── Trophy btn  38×38, bg #1C1C1C, rounded-lg, border #2A2A2A 1px
  │   │   │               trophy icon #A0A0A0, 18×18
  │   │   │               onClick → router.push("/goals")
  │   │   └── Logout btn  38×38, same style, log-out icon
  │   │                   <form action={logoutAction}><button type="submit">
  │   └── {children}
  │
  └── Bottom Tab Bar      bg #111111, h-95px, padding: 12 21 21 21
      └── Tab Pill        bg #1C1C1C, rounded-full, h-62px, p-1, border #2A2A2A 1px
          └── <TabBar activeHref={pathname} items={TAB_ITEMS} />
```

### TAB_ITEMS (module-level const)

| Label     | Icon (lucide) | Route        |
| --------- | ------------- | ------------ |
| DASHBOARD | `House`       | `/dashboard` |
| VÀNG      | `Coins`       | `/gold`      |
| TIẾT KIỆM | `Landmark`    | `/savings`   |
| CÀI ĐẶT   | `Settings`    | `/settings`  |

---

## 5. TabBar Component Update

`src/components/common/tab-bar.tsx` — switch each tab item from horizontal to vertical layout:

- **Before:** `flex items-center gap-1.5 px-3.5 py-1` (icon left, label right)
- **After:** `flex flex-col items-center justify-center gap-1` (icon top, label bottom)

Active tab: gold background pill (`bg-accent rounded-pill-item`), icon and label `text-[#111111]`.
Inactive tab: no background, icon and label `text-foreground-muted`.

---

## 6. Logout Server Action

Add to `src/app/actions/auth.ts`:

```ts
export async function logoutAction(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

The logout button in the layout is a `<form action={logoutAction}><button type="submit">` — consistent with the existing `loginAction` pattern and works without JS.

---

## 7. Middleware — Protected Route Expansion

`src/proxy.ts` currently only guards `/dashboard`. Expand `isProtected` to cover all Phase 3 routes:

```ts
const isProtected =
  pathname.startsWith("/dashboard") ||
  pathname.startsWith("/gold") ||
  pathname.startsWith("/savings") ||
  pathname.startsWith("/settings") ||
  pathname.startsWith("/goals");
```

---

## 8. Placeholder Pages

Each new page is a minimal Server Component — no `"use client"`, no state. Example:

```tsx
export default function GoldPage() {
  return <div>Gold</div>;
}
```

Same pattern for `savings`, `settings`, `goals`.

---

## 9. Out of Scope

- Actual page content (Dashboard, Gold, Savings, Settings) — later phases
- Goals page content — later phase
- Auth session refresh logic — handled by existing proxy
