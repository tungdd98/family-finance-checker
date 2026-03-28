# Phase 4 — Settings Page Design

**Date:** 2026-03-28
**Scope:** User settings page with display name, initial cash balance, and database scaffolding for cash transactions.

---

## 1. Database

### `user_settings`

| Column                 | Type                   | Notes                |
| ---------------------- | ---------------------- | -------------------- |
| `id`                   | `uuid` PK              |                      |
| `user_id`              | `uuid` FK → auth.users | unique               |
| `display_name`         | `text`                 | nullable             |
| `initial_cash_balance` | `bigint`               | default 0, unit: VND |
| `created_at`           | `timestamptz`          |                      |
| `updated_at`           | `timestamptz`          |                      |

### `cash_transactions`

| Column         | Type                   | Notes                                       |
| -------------- | ---------------------- | ------------------------------------------- |
| `id`           | `uuid` PK              |                                             |
| `user_id`      | `uuid` FK → auth.users |                                             |
| `amount`       | `bigint`               | positive = money in, negative = money out   |
| `type`         | `text`                 | `manual_deposit`, `gold_buy`, `gold_sell`   |
| `reference_id` | `uuid`                 | nullable, points to gold transaction if any |
| `note`         | `text`                 | nullable                                    |
| `created_at`   | `timestamptz`          |                                             |

> Effective cash balance = `initial_cash_balance` + SUM(`cash_transactions.amount`)

`cash_transactions` is created this phase only. No application code reads or writes it yet — that comes in the gold phase.

### RLS Policy

Both tables: users may only read/write rows where `user_id = auth.uid()`.

---

## 2. File Structure

```
src/lib/validations/settings.ts
src/lib/services/settings.ts
src/app/actions/settings.ts
src/app/(protected)/settings/
├── page.tsx          ← Server Component
└── SettingsForm.tsx  ← Client Component
```

---

## 3. Validation

**`src/lib/validations/settings.ts`**

```ts
export const settingsSchema = z.object({
  display_name: z.string().min(1, "Vui lòng nhập tên hiển thị"),
  initial_cash_balance: z.number().min(0, "Số dư không được âm"),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
```

---

## 4. Service Layer

**`src/lib/services/settings.ts`**

Service functions accept a Supabase client as their first argument so they work from both Server Components and server actions without importing the wrong client.

- `getSettings(supabase, userId)` — fetches the `user_settings` row; returns `null` if none exists yet.
- `upsertSettings(supabase, userId, data)` — inserts or updates the row using `onConflict: "user_id"`.

---

## 5. Server Action

**`src/app/actions/settings.ts`**

- Validates input with zod; returns `{ error: string }` on failure.
- Gets the current user via the server Supabase client.
- Calls `upsertSettings(supabase, userId, data)`.
- Returns `undefined` on success, `{ error: string }` on Supabase error.

---

## 6. Page Architecture

### `page.tsx` — Server Component

1. Creates server Supabase client.
2. Gets the current user via `supabase.auth.getUser()`.
3. Calls `getSettings(supabase, userId)`.
4. Renders `<SettingsForm initialData={settings ?? defaults} />`.

Defaults when no row exists: `{ display_name: "", initial_cash_balance: 0 }`.

### `SettingsForm.tsx` — Client Component

- `react-hook-form` + `zodResolver(settingsSchema)`, pre-populated with `initialData`.
- Inputs disabled while `isPending` (during server action call).
- On submit: calls `saveSettingsAction(data)`.
  - Success → `toast.success("Đã lưu cài đặt")`
  - Error → `toast.error(errorMessage)`

---

## 7. Number Input Behaviour

- `inputMode="numeric"` — triggers numeric keyboard on mobile.
- `onChange`: strip all non-digit characters, parse to `number`, store in form state.
- Display value: format stored number with Vietnamese thousands separator via `Intl.NumberFormat("vi-VN")` — e.g. `1000000` → `"1.000.000"`.
- Placeholder: `"0 đ"`.
- No external formatting library — implemented with a small inline helper.

---

## 8. Toast Setup

- Install `sonner`.
- Add `<Toaster />` to `src/app/layout.tsx` (root layout, one time).
- Call `toast.success` / `toast.error` from within `SettingsForm`.

---

## 9. Error Handling & Edge Cases

| Scenario                                                     | Behaviour                                                                    |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| First-time user (no row)                                     | `getSettings` returns `null`; form shows defaults; save creates the row      |
| Validation error (negative balance, empty name)              | `toast.error` with zod message; never reaches Supabase                       |
| Supabase write error                                         | Server action returns `{ error: "Không thể lưu cài đặt" }`; `toast.error`    |
| User changes `initial_cash_balance` after transactions exist | Intentional — it is the starting point, not a transaction; no warning needed |

---

## 10. UI Reference

See `docs/phase-4/design.pen` for exact colors, spacing, and typography. Key visual elements:

- Dark background `#111111`, surface `#1C1C1C`
- Two sections divided by gold (`#D4AF37`) accent bars: **TIỀN MẶT** and **THÔNG TIN CÁ NHÂN**
- Gold full-width save button labelled **LƯU CÀI ĐẶT**
- Typography: Space Grotesk throughout
