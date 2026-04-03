# Design: PC Layout — Sidebar Navigation

**Date:** 2026-04-04
**Status:** Approved

---

## 1. Overview

Add a responsive PC layout to the existing mobile-first app. Below `lg` (1024px) the current mobile layout is preserved exactly. At `lg` and above, the bottom tab bar is replaced by a collapsible sidebar on the left, and the header is adjusted for the wider context.

---

## 2. Breakpoint

| Screen width    | Layout                                                                |
| --------------- | --------------------------------------------------------------------- |
| < 1024px (`lg`) | Mobile — bottom tab bar, full-height scroll, current layout unchanged |
| ≥ 1024px (`lg`) | PC — left sidebar, header spans main content area                     |

All responsive switching is done with Tailwind `lg:` prefixes. No JavaScript media query listeners needed.

---

## 3. PC Layout Structure

```
<div> full-screen, flex-row on lg+
  ├── Sidebar (hidden below lg, lg:flex)
  │   ├── Logo / App name + toggle button
  │   ├── Nav items (Dashboard · Tài Sản · Thị Trường · Thu/Chi · Mục Tiêu)
  │   └── Footer items (Cài đặt · Đăng xuất)
  │
  └── Main area (flex-1, flex-col)
      ├── Header (Greeting left · Notification bell right)
      └── Content (flex-1, overflow-y-auto, px padding)
```

---

## 4. Sidebar Specification

### Dimensions

| State              | Width | Content                                    |
| ------------------ | ----- | ------------------------------------------ |
| Expanded (default) | 200px | Icon + label for each nav item             |
| Collapsed          | 56px  | Icon only; label shown in tooltip on hover |

### Sections

**Top — Logo area**

- Expanded: "Family Finance" text (gold, bold) + toggle button `‹` aligned right
- Collapsed: "FF" abbreviation + toggle button `›` centered

**Middle — Navigation**

| Label      | Icon (lucide)    | Route        | Child routes        |
| ---------- | ---------------- | ------------ | ------------------- |
| Dashboard  | `House`          | `/dashboard` | —                   |
| Tài Sản    | `Wallet`         | `/assets`    | `/gold`, `/savings` |
| Thị Trường | `TrendingUp`     | `/market`    | —                   |
| Thu/Chi    | `ArrowLeftRight` | `/cashflow`  | —                   |
| Mục Tiêu   | `Target`         | `/goals`     | —                   |

Active item: `bg-accent text-[#111111]` pill. Inactive: `text-foreground-muted`.

**Bottom — Footer**

| Label     | Icon (lucide) | Action                                     |
| --------- | ------------- | ------------------------------------------ |
| Cài đặt   | `Settings`    | `router.push("/settings")`                 |
| Đăng xuất | `LogOut`      | `logoutAction` server action (form submit) |

On mobile (< lg), Settings remains as a header icon and the logout is accessed via the Settings page — the sidebar footer items are PC-only.

### Toggle Behavior

- State stored in `localStorage` key `"sidebar-collapsed"` (boolean)
- On mount, read from localStorage; default is expanded (`false`)
- Sidebar width transition: `transition-all duration-200`
- Collapsed labels: `hidden` when collapsed, visible when expanded

---

## 5. Header (PC)

On PC the header sits inside the main content column (not spanning the full width). It retains the same structure as mobile:

- **Left**: Greeting ("XIN CHÀO," label + display name + 👋)
- **Right**: Notification bell only — Settings icon is hidden on `lg+` (it moves to sidebar footer)

```
<div className="flex items-center justify-between px-7 py-4">
  <!-- greeting -->
  <!-- right: NotificationBell only (Settings link: hidden lg:hidden) -->
</div>
```

---

## 6. Mobile Layout — No Changes

Everything below `lg` remains identical to the current implementation:

- `(protected)/layout.tsx` header row — unchanged
- `TabBar` component — unchanged, shown only below `lg`
- Bottom tab bar container — `lg:hidden`
- Content area padding — `px-5` on mobile, `px-7` on PC

---

## 7. Files Changed

| File                                | Change                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `src/app/(protected)/layout.tsx`    | Main change — add sidebar, wrap in responsive flex-row, hide tab bar on lg |
| `src/components/common/tab-bar.tsx` | No change to component; wrapper becomes `lg:hidden`                        |
| `src/components/pc/Sidebar.tsx`     | New component — collapsible sidebar for PC                                 |

The sidebar is extracted into its own component (`src/components/pc/Sidebar.tsx`) to keep `layout.tsx` readable.

---

## 8. Sidebar Component Interface

```tsx
// src/components/pc/Sidebar.tsx
"use client";

export function Sidebar();
```

The component takes no props. The greeting stays in the header — sidebar only handles navigation and footer actions. Collapsed/expanded state is managed internally via `useState` + `localStorage`.

---

## 9. Responsive Layout Shell

```tsx
// (protected)/layout.tsx — structural outline
<div className="bg-background flex h-dvh flex-col overflow-hidden lg:flex-row">
  <NavigationProgress />

  {/* Sidebar — PC only */}
  <div className="hidden lg:flex">
    <Sidebar />
  </div>

  {/* Main column */}
  <div className="flex flex-1 flex-col overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 lg:px-7">
      {/* greeting */}
      {/* right: bell + settings (settings hidden on lg) */}
    </div>

    {/* Content */}
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 pb-5 lg:px-7">
      {children}
    </div>

    {/* Tab bar — mobile only */}
    <div className="bg-background border-border h-[95px] touch-none border-t px-5 pt-3 pb-[21px] select-none lg:hidden">
      <TabBar />
    </div>
  </div>
</div>
```

---

## 10. Out of Scope

- Adapting individual page content for wider screens (grid layouts per page) — each page can be enhanced independently later
- Right detail panel — not included (Option B was not chosen)
- Tablet-specific layout (768–1023px) — uses mobile layout
- User avatar or profile section in sidebar
