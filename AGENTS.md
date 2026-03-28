<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# UI Implementation

When implementing UI components or pages, use the design specs in `docs/superpowers/specs/` as the source of truth for colors, spacing, typography, layout, and component structure. Refer to the existing implemented components for visual patterns — never hardcode visual values from memory.

**Mobile mockup chrome — do not implement:** The iOS-style status bar (showing static time "9:41", signal, wifi, and battery icons) that appears at the top of mobile screen mockups is design decoration only. It simulates a real phone screen for visual context. Do NOT render it as app UI.

# Tailwind CSS

**Use canonical class names — never arbitrary values when a canonical equivalent exists.** The IDE enforces `suggestCanonicalClasses`. Examples:

- `h-[2px]` → `h-0.5` (0.5 × 4 = 2px)
- `h-[4px]` → `h-1`
- `w-[8px]` → `w-2`
- `p-[16px]` → `p-4`

Always prefer Tailwind's spacing scale over `[Npx]` arbitrary values. Only use `[value]` syntax when no canonical class exists (e.g. `text-[13px]`, `tracking-[-1px]`, `text-[28px]`).

Common canonical equivalents (Npx → scale):

- `2px` → `0.5` · `3px` → `0.75` · `4px` → `1` · `6px` → `1.5`
- `8px` → `2` · `10px` → `2.5` · `12px` → `3` · `14px` → `3.5`
- `16px` → `4` · `18px` → `4.5` · `20px` → `5` · `24px` → `6`
- `28px` → `7` · `32px` → `8` · `36px` → `9` · `40px` → `10`
