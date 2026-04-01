// src/app/actions/goals.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  goalSchema,
  cashFlowSchema,
  monthlyActualSchema,
  type GoalInput,
  type CashFlowInput,
  type MonthlyActualInput,
} from "@/lib/validations/goals";
import {
  upsertGoal,
  upsertCashFlow,
  upsertMonthlyActual,
} from "@/lib/services/goals";

export async function saveGoalAction(
  data: GoalInput
): Promise<{ error: string } | undefined> {
  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const error = await upsertGoal(supabase, user.id, parsed.data);
  if (error) return { error: "Không thể lưu mục tiêu" };

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function saveCashFlowAction(
  data: CashFlowInput
): Promise<{ error: string } | undefined> {
  const parsed = cashFlowSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const error = await upsertCashFlow(supabase, user.id, parsed.data);
  if (error) return { error: "Không thể lưu thu chi" };

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function saveMonthlyActualAction(
  data: MonthlyActualInput
): Promise<{ error: string } | undefined> {
  const parsed = monthlyActualSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const error = await upsertMonthlyActual(supabase, user.id, parsed.data);
  if (error) return { error: "Không thể lưu số liệu tháng này" };

  revalidatePath("/cashflow");
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}
