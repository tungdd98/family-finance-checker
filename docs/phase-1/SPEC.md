# SPEC — Phase 1: Project Setup & Design System Components

## Tổng quan

Khởi tạo dự án **Family Finance Tracker** và build component library dựa trên design system "Brutalist Luxury" từ Pencil Dev.

---

## 1. Project Setup

### 1.1 Khởi tạo project

```bash
npx create-next-app@latest family-finance-tracker \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### 1.2 Cài đặt dependencies

```bash
# UI & Form
npx shadcn@latest init
npm install react-hook-form zod @hookform/resolvers

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Font
npm install @fontsource/space-grotesk

# Tooling
npm install -D prettier prettier-plugin-tailwindcss
npm install -D @commitlint/cli @commitlint/config-conventional
npm install -D husky lint-staged
```

### 1.3 shadcn/ui components

```bash
npx shadcn@latest add button badge input label select checkbox
```

---

## 2. Cấu trúc thư mục

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (protected)/
│   │   └── layout.tsx        # placeholder, chưa implement
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                   # shadcn auto-generated
│   └── common/               # custom components (Phase 1)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils.ts
├── hooks/
├── types/
└── constants/
```

---

## 3. Cấu hình

### 3.1 Environment Variables — `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3.2 CSS Variables + Tailwind — `src/app/globals.css`

```css
@import "@fontsource/space-grotesk/400.css";
@import "@fontsource/space-grotesk/500.css";
@import "@fontsource/space-grotesk/600.css";
@import "@fontsource/space-grotesk/700.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: #111111;
    --surface: #1c1c1c;
    --surface-elevated: #282828;
    --foreground: #ffffff;
    --foreground-secondary: #a0a0a0;
    --foreground-muted: #666666;
    --accent: #d4af37;
    --accent-soft: #d4af3720;
    --status-positive: #4caf50;
    --status-negative: #f44336;
    --border: #2a2a2a;
    --border-strong: #3a3a3a;
    --radius-none: 0px;
    --radius-pill: 36px;
    --radius-pill-item: 26px;
    --font-primary: "Space Grotesk", sans-serif;

    /* shadcn overrides */
    --input: var(--surface-elevated);
    --ring: var(--accent);
  }

  * {
    @apply border-border;
  }

  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: var(--font-primary);
  }
}

@layer components {
  /* ── Typography Scale ────────────────────────────── */

  /* 42px · Bold 700 · tracking -1 */
  .type-large-title {
    @apply font-bold text-[42px] leading-tight tracking-[-0.01em] text-foreground;
  }
  /* 36px · Bold 700 · tracking -2 */
  .type-metric-value {
    @apply font-bold text-[36px] leading-tight tracking-[-0.02em] text-foreground;
  }
  /* 28px · Bold 700 */
  .type-featured-stat {
    @apply font-bold text-[28px] leading-tight text-foreground;
  }
  /* 18px · Bold 700 · uppercase */
  .type-card-title {
    @apply font-bold text-[18px] uppercase text-foreground;
  }
  /* 13px · Medium 500 */
  .type-body {
    @apply font-medium text-[13px] text-foreground;
  }
  /* 12px · Normal 400 */
  .type-callout {
    @apply font-normal text-[12px] text-foreground;
  }
  /* 11px · Semibold 600 · tracking +2 */
  .type-section-label {
    @apply font-semibold text-[11px] uppercase tracking-[0.02em] text-foreground-muted;
  }
  /* 10px · Medium 500 · tracking +1.5 */
  .type-card-label {
    @apply font-medium text-[10px] uppercase tracking-[0.015em] text-foreground-muted;
  }
  /* 9px · Medium 500 · tracking +0.5 */
  .type-tab-label {
    @apply font-medium text-[9px] uppercase tracking-[0.005em];
  }
}
```

### 3.3 `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        foreground: "var(--foreground)",
        "foreground-secondary": "var(--foreground-secondary)",
        "foreground-muted": "var(--foreground-muted)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "status-positive": "var(--status-positive)",
        "status-negative": "var(--status-negative)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
      },
      borderRadius: {
        none: "var(--radius-none)",
        pill: "var(--radius-pill)",
        "pill-item": "var(--radius-pill-item)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 3.4 Supabase Client

**`src/lib/supabase/client.ts`:**

```ts
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
```

**`src/lib/supabase/server.ts`:**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
};
```

### 3.5 Prettier — `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 3.6 Commitlint — `commitlint.config.ts`

```ts
export default { extends: ["@commitlint/config-conventional"] };
```

### 3.7 Husky

```bash
npx husky init
```

**`.husky/commit-msg`:**

```bash
npx --no -- commitlint --edit $1
```

**`.husky/pre-commit`:**

```bash
npx lint-staged
```

**`package.json`:**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

---

## 4. Components

> Chỉ build đúng những gì có trong design system. Tất cả custom components đặt tại `src/components/common/`.

---

### 4.1 Button — override shadcn variants

**File:** `src/components/ui/button.tsx`

Giữ nguyên shadcn, chỉ override `cva` variants:

| Variant             | Height      | Background           | Border                        | Text                                                            |
| ------------------- | ----------- | -------------------- | ----------------------------- | --------------------------------------------------------------- |
| `default` (Primary) | h-12 (48px) | `bg-accent`          | —                             | `text-background` · 11px 700 · tracking-[2px] · uppercase       |
| `secondary`         | h-12        | `bg-surface`         | `border border-border-strong` | `text-foreground` · 11px 700 · tracking-[2px] · uppercase       |
| `outline`           | h-12        | transparent          | `border border-accent`        | `text-accent` · 11px 700 · tracking-[2px] · uppercase           |
| `ghost`             | h-12        | transparent          | —                             | `text-foreground-muted` · 11px 700 · tracking-[2px] · uppercase |
| `destructive`       | h-12        | `bg-status-negative` | —                             | `text-white` · 11px 700 · tracking-[2px] · uppercase            |
| `sm` (small)        | h-9 (36px)  | `bg-surface`         | `border border-border-strong` | `text-foreground` · 10px 700 · tracking-[1.5px]                 |

**Quy tắc bắt buộc:** Tất cả variants dùng `rounded-none` — không có border-radius.

---

### 4.2 Badge — `src/components/common/badge.tsx`

```ts
interface BadgeProps {
  variant: "positive" | "negative" | "gold";
  label?: string; // chỉ cần khi variant = "gold"
}
```

Cấu trúc: `flex items-center gap-[6px] h-6 px-[10px]`

| Variant    | Background       | Dot (6×6 square)     | Label                                                 |
| ---------- | ---------------- | -------------------- | ----------------------------------------------------- |
| `positive` | `bg-[#4CAF5030]` | `bg-status-positive` | —                                                     |
| `negative` | `bg-[#F4433620]` | `bg-status-negative` | —                                                     |
| `gold`     | `bg-accent-soft` | `bg-accent`          | `text-accent` · 10px 600 · tracking-[1px] · uppercase |

> Dot là `<span className="w-[6px] h-[6px] block">` — hình **vuông**, không phải tròn (brutalist, không dùng rounded-full).

---

### 4.3 MetricCard — `src/components/common/metric-card.tsx`

```ts
interface MetricCardProps {
  label: string; // vd: "TỔNG VÀNG"
  value: string; // vd: "125.000.000 ₫"
  sub?: string; // vd: "TỔNG CỘNG"
  className?: string;
}
```

**Cấu trúc:**

```
div.bg-surface.rounded-none.p-[20px_18px].flex.flex-col.gap-2
  span 3×14px bg-accent          ← accent bar
  p.type-card-label               ← label (10px 500 +1.5)
  p.text-[28px].font-bold         ← value
  p.text-[10px].font-medium       ← sub (optional, foreground-secondary, +1 tracking)
```

---

### 4.4 Checkbox — override shadcn

**File:** override style trong `src/components/ui/checkbox.tsx`

| State     | Style                                                                        |
| --------- | ---------------------------------------------------------------------------- |
| Unchecked | 18×18 · `bg-surface border border-border-strong rounded-none`                |
| Checked   | 18×18 · `bg-accent rounded-none` · icon lucide `Check` 12×12 · màu `#111111` |

---

### 4.5 Input — override shadcn

Không cần tạo file mới. Override trong `globals.css` (đã có ở mục 3.2 phần shadcn overrides) và thêm className mặc định vào shadcn Input:

```
bg-surface-elevated border border-border-strong rounded-none
text-foreground placeholder:text-foreground-muted
h-12 focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0
```

---

### 4.6 TabBar — `src/components/common/tab-bar.tsx`

```ts
interface TabItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface TabBarProps {
  items: TabItem[];
  activeHref: string;
}
```

**Container:** `bg-surface rounded-pill flex items-center gap-1 px-[21px] pt-[12px] pb-[21px]`

**Tab item active:** `bg-accent rounded-pill-item flex items-center gap-[6px] px-[14px] py-1`

- Icon: 18×18 · màu `#111111`
- Label: `type-tab-label font-semibold text-[#111111]`

**Tab item inactive:** `rounded-pill-item flex items-center gap-[6px] px-[14px] py-1`

- Icon: 18×18 · `text-foreground-muted`
- Label: `type-tab-label text-foreground-muted`

> Phase này chưa tích hợp vào layout, chỉ build component.

---

### 4.7 Export barrel — `src/components/common/index.ts`

```ts
export { Badge } from "./badge";
export { MetricCard } from "./metric-card";
export { TabBar } from "./tab-bar";
```

---

## 5. Utils

**`src/lib/utils.ts`** — thêm helper format tiền VND:

```ts
export const formatVND = (amount: number): string =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount,
  );
```

---

## 6. Checklist hoàn thành

- [ ] `npm run dev` không lỗi
- [ ] Font Space Grotesk load đúng (kiểm tra DevTools)
- [ ] Tất cả CSS variables đúng giá trị hex trong `:root`
- [ ] Tailwind color names khớp đúng với design system token
- [ ] `Button` — 6 variants đúng style, tất cả `border-radius: 0`
- [ ] `Badge` — 3 variants đúng màu, dot hình vuông 6×6
- [ ] `MetricCard` — accent bar 3×14, typography đúng scale
- [ ] `Checkbox` — checked = accent bg, unchecked = surface bg, cả 2 `rounded-none`
- [ ] `Input` — focus ring màu accent, height 48px, `rounded-none`
- [ ] `TabBar` — active = accent pill, inactive = transparent
- [ ] 9 class `type-*` dùng được ở bất kỳ đâu trong project
- [ ] `formatVND` hoạt động đúng
- [ ] Husky block commit sai format
- [ ] Supabase client không lỗi TypeScript
- [ ] Không có `any` trong codebase

---

## 7. Ghi chú cho Claude Code

- **Không build layout** (sidebar, wrapper page) — để phase sau khi có screen design
- **Không tạo Supabase tables** — chỉ setup client kết nối
- shadcn components chỉ override className/CSS variables, **không sửa logic component**
- TypeScript strict — không dùng `any`
