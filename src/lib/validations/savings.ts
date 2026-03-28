// src/lib/validations/savings.ts
import { z } from "zod";

export const ROLLOVER_OPTIONS = [
  {
    value: "none",
    label: "Không tái tục",
    sublabel: "Nhận gốc + lãi khi đáo hạn",
  },
  {
    value: "principal",
    label: "Tái tục gốc",
    sublabel: "Gốc tiếp tục gửi, lãi nhận về",
  },
  {
    value: "principal_interest",
    label: "Tái tục gốc + lãi",
    sublabel: "Toàn bộ tự động gửi kỳ tiếp theo",
  },
] as const;

export const TERM_OPTIONS = [
  { value: 0, label: "Không kỳ hạn", sublabel: "Rút bất kỳ lúc nào" },
  { value: 1, label: "1 tháng", sublabel: "~30 ngày" },
  { value: 3, label: "3 tháng", sublabel: "~91 ngày" },
  { value: 6, label: "6 tháng", sublabel: "~182 ngày" },
  { value: 9, label: "9 tháng", sublabel: "~274 ngày" },
  { value: 12, label: "12 tháng", sublabel: "~365 ngày" },
  { value: 18, label: "18 tháng", sublabel: "~548 ngày" },
  { value: 24, label: "24 tháng", sublabel: "~730 ngày" },
  { value: 36, label: "36 tháng", sublabel: "~1095 ngày" },
] as const;

export const savingsSchema = z.object({
  bank_name: z.string().min(1, "Vui lòng nhập tên ngân hàng"),
  account_name: z.string().optional(),
  note: z.string().optional(),
  principal: z
    .number({ message: "Vui lòng nhập số tiền" })
    .min(1, "Số tiền phải lớn hơn 0"),
  interest_rate: z
    .number({ message: "Vui lòng nhập lãi suất" })
    .min(0, "Lãi suất không được âm")
    .max(100, "Lãi suất không hợp lệ"),
  term_months: z.number().min(0),
  start_date: z.string().min(1, "Vui lòng chọn ngày gửi"),
  rollover_type: z.enum(["none", "principal", "principal_interest"]),
});

export type SavingsInput = z.infer<typeof savingsSchema>;
