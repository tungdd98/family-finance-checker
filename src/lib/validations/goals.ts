// src/lib/validations/goals.ts
import { z } from "zod";

export const goalSchema = z.object({
  name: z
    .string()
    .min(1, "Vui lòng nhập tên mục tiêu")
    .max(50, "Tên không quá 50 ký tự"),
  emoji: z.string().min(1, "Vui lòng nhập emoji"),
  target_amount: z.number().int().min(1, "Số tiền mục tiêu phải lớn hơn 0"),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có định dạng YYYY-MM-DD")
    .nullable()
    .optional(),
  note: z.string().nullable().optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;

export const cashFlowSchema = z.object({
  avg_monthly_income_husband: z.number().int().min(0, "Thu nhập không được âm"),
  avg_monthly_income_wife: z.number().int().min(0, "Thu nhập không được âm"),
  avg_monthly_expense: z.number().int().min(0, "Chi tiêu không được âm"),
});

export type CashFlowInput = z.infer<typeof cashFlowSchema>;

export const allocationSchema = z.object({
  type: z.enum(["gold", "savings", "etf", "coin", "other"]),
  amount: z.number().int().min(1, "Số tiền phải lớn hơn 0"),
  is_executed: z.boolean(),
  note: z.string().nullable().optional(),
});

export type AllocationItem = z.infer<typeof allocationSchema>;

export const monthlyActualSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  actual_income_husband: z.number().int().min(0, "Thu nhập không được âm"),
  actual_income_wife: z.number().int().min(0, "Thu nhập không được âm"),
  actual_income_extra: z.number().int().min(0, "Thu nhập không được âm"),
  actual_expense: z.number().int().min(0, "Chi tiêu không được âm"),
  allocations: z.array(allocationSchema),
  note: z.string().nullable().optional(),
});

export type MonthlyActualInput = z.infer<typeof monthlyActualSchema>;
