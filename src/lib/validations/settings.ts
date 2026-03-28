// src/lib/validations/settings.ts
import { z } from "zod";

export const settingsSchema = z.object({
  display_name: z.string().min(1, "Vui lòng nhập tên hiển thị"),
  initial_cash_balance: z.number().min(0, "Số dư không được âm"),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
