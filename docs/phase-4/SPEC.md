# SPEC — Feature Settings

## 1. Database

### Bảng `user_settings`

| Column                 | Type                   | Note                   |
| ---------------------- | ---------------------- | ---------------------- |
| `id`                   | `uuid` PK              |                        |
| `user_id`              | `uuid` FK → auth.users | unique                 |
| `display_name`         | `text`                 | nullable               |
| `initial_cash_balance` | `bigint`               | mặc định 0, đơn vị VND |
| `created_at`           | `timestamptz`          |                        |
| `updated_at`           | `timestamptz`          |                        |

### Bảng `cash_transactions`

| Column         | Type                   | Note                                      |
| -------------- | ---------------------- | ----------------------------------------- |
| `id`           | `uuid` PK              |                                           |
| `user_id`      | `uuid` FK → auth.users |                                           |
| `amount`       | `bigint`               | dương = tiền vào, âm = tiền ra            |
| `type`         | `text`                 | `manual_deposit`, `gold_buy`, `gold_sell` |
| `reference_id` | `uuid`                 | nullable, trỏ tới giao dịch vàng nếu có   |
| `note`         | `text`                 | nullable                                  |
| `created_at`   | `timestamptz`          |                                           |

> Số dư tiền mặt hiện tại = `initial_cash_balance` + SUM(`cash_transactions.amount`)

### RLS Policy

- Tất cả bảng: user chỉ đọc/ghi được row của chính mình (`user_id = auth.uid()`)

---

## 2. Route & File Structure

```
src/app/(protected)/settings/
└── page.tsx

src/lib/validations/settings.ts
src/lib/services/settings.ts
```

---

## 3. Validation Schema

**File:** `src/lib/validations/settings.ts`

```ts
export const settingsSchema = z.object({
  display_name: z.string().min(1, "Vui lòng nhập tên hiển thị"),
  initial_cash_balance: z.number().min(0, "Số dư không được âm"),
});
```

---

## 4. Service

**File:** `src/lib/services/settings.ts`

- `getSettings(userId)` → fetch row từ `user_settings` theo `user_id`
- `upsertSettings(userId, data)` → insert hoặc update row `user_settings`

---

## 5. Page Logic

**File:** `src/app/(protected)/settings/page.tsx` — Client Component

### 5.1 Khởi tạo

- Khi mount: gọi `getSettings()` để load dữ liệu hiện tại vào form
- Nếu chưa có row → form hiển thị giá trị mặc định (tên rỗng, số dư 0)

### 5.2 Input số tiền

- `inputMode="numeric"` để mobile tự mở keyboard số
- Chỉ cho nhập số, loại bỏ ký tự không phải số khi onChange
- Format hiển thị: tự động thêm dấu phân cách hàng nghìn khi người dùng nhập
  ```
  1000000 → hiển thị "1.000.000"
  ```
- Lưu vào form state dạng `number` (không phải string đã format)

### 5.3 Submit

- Gọi `upsertSettings()` với dữ liệu từ form
- Thành công → hiện toast "Đã lưu cài đặt"
- Thất bại → hiện toast lỗi

### 5.4 Lưu ý quan trọng về `initial_cash_balance`

Khi người dùng **thay đổi** `initial_cash_balance` sau khi đã có giao dịch → số dư tiền mặt hiện tại sẽ thay đổi theo. Đây là behavior đúng vì `initial_cash_balance` là điểm xuất phát, không phải giao dịch.

---

## 6. Checklist

- [ ] Bảng `user_settings` và `cash_transactions` tạo đúng trên Supabase
- [ ] RLS policy hoạt động đúng
- [ ] Load được settings hiện tại khi vào trang
- [ ] Input số tiền chỉ nhận số, tự format dấu phân cách
- [ ] Mobile mở keyboard số khi focus vào ô số tiền
- [ ] Lưu thành công → toast xác nhận
- [ ] Tham khảo file `design.pen` để implement UI

---

## 7. Ghi chú cho Claude Code

- `cash_transactions` chỉ tạo bảng trong phase này, chưa có UI quản lý — sẽ dùng ở phase Vàng
- Chưa cần tính toán hay hiển thị số dư tiền mặt trong phase này
