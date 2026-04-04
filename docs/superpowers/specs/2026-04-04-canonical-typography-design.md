# Canonical Typography Design

**Date:** 2026-04-04
**Goal:** Replace all `text-[Npx]` arbitrary size values with Tailwind canonical classes and remove the `type-*` design system from `globals.css`.

---

## Background

After the initial Tailwind canonicalization plan (`2026-04-04-tailwind-canonicalize.md`) replaced `text-[12px]`, `text-[14px]`, `text-[16px]`, and `tracking-*` classes, ~150+ `text-[Npx]` arbitrary size values remain across `src/app/` and `src/components/`. Additionally, `globals.css` defines a `type-*` component layer that bundles size + weight + color + case into single classes — violating Tailwind's single-responsibility principle.

## Design Decisions

### Remove `type-*` classes

The `@layer components` typography block in `globals.css` (lines 156–195) is deleted entirely. Components compose utility classes directly instead of relying on bundled abstractions.

### Strict canonical mapping — no tailwind.config changes

All non-canonical sizes map to the nearest Tailwind default. No custom aliases are added to `tailwind.config`.

### Mapping table

| Arbitrary     | Canonical   | Tailwind px | Δ    |
| ------------- | ----------- | ----------- | ---- |
| `text-[8px]`  | `text-xs`   | 12px        | +4px |
| `text-[9px]`  | `text-xs`   | 12px        | +3px |
| `text-[10px]` | `text-xs`   | 12px        | +2px |
| `text-[11px]` | `text-xs`   | 12px        | +1px |
| `text-[13px]` | `text-sm`   | 14px        | +1px |
| `text-[15px]` | `text-base` | 16px        | +1px |
| `text-[18px]` | `text-lg`   | 18px        | ±0   |
| `text-[20px]` | `text-xl`   | 20px        | ±0   |
| `text-[22px]` | `text-2xl`  | 24px        | +2px |
| `text-[26px]` | `text-2xl`  | 24px        | -2px |
| `text-[28px]` | `text-3xl`  | 30px        | +2px |
| `text-[36px]` | `text-4xl`  | 36px        | ±0   |

Result: 6 canonical font-size steps (`text-xs/sm/base/lg/xl/2xl/3xl/4xl`) replace 12 arbitrary values. Visual changes are intentionally accepted — all deltas are ≤4px.

### Out of scope

- `text-[#color]` arbitrary values (e.g. `text-[#6B7FD7]`) — color values, not size
- `w-[...]`, `h-[...]`, other arbitrary dimension classes
- `tailwind.config` — no changes needed
- `src/app/globals.css` except the typography block removal

---

## Implementation

### Files modified

- `src/app/globals.css` — remove `@layer components` typography block
- `src/components/common/TabBar.tsx` — expand `type-tab-label` usage
- All `.tsx` in `src/app/` and `src/components/` — sed replacements

### type-\* expansion (TabBar.tsx)

The only active `type-*` usage found:

```diff
- className={`type-tab-label ${...}`}
+ className={`text-xs font-medium uppercase ${...}`}
```

### sed patterns

```bash
sed -i '' \
  -e 's/text-\[8px\]/text-xs/g' \
  -e 's/text-\[9px\]/text-xs/g' \
  -e 's/text-\[10px\]/text-xs/g' \
  -e 's/text-\[11px\]/text-xs/g' \
  -e 's/text-\[13px\]/text-sm/g' \
  -e 's/text-\[15px\]/text-base/g' \
  -e 's/text-\[18px\]/text-lg/g' \
  -e 's/text-\[20px\]/text-xl/g' \
  -e 's/text-\[22px\]/text-2xl/g' \
  -e 's/text-\[26px\]/text-2xl/g' \
  -e 's/text-\[28px\]/text-3xl/g' \
  -e 's/text-\[36px\]/text-4xl/g' \
  <file>
```

### Verification command

```bash
grep -rn 'text-\[[0-9]' src/ --include="*.tsx"
# Expected: no output
```

### Commit strategy

```
style: remove type-* design system classes from globals.css
style: canonicalize text sizes in src/components/
style: canonicalize text sizes in src/app/
```
