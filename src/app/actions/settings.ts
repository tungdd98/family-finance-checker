// src/app/actions/settings.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { settingsSchema, type SettingsInput } from "@/lib/validations/settings";
import { upsertSettings } from "@/lib/services/settings";

const ALLOWED_RESET_TABLES = [
  "savings_accounts",
  "gold_assets",
  "goals",
  "household_cash_flow",
  "monthly_actuals",
  "user_settings",
] as const;

export type ResetTable = (typeof ALLOWED_RESET_TABLES)[number];

export async function saveSettingsAction(
  data: SettingsInput
): Promise<{ error: string } | undefined> {
  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Chưa đăng nhập" };

  const error = await upsertSettings(supabase, user.id, parsed.data);
  if (error) return { error: "Không thể lưu cài đặt" };

  revalidateTag(`user-${user.id}`);
  revalidatePath("/", "layout");
}

export async function resetAllDataAction(
  tables: ResetTable[]
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Chưa đăng nhập" };
  if (!tables.length) return { error: "Chưa chọn mục nào để xóa" };

  // Whitelist check — never trust client input directly
  const safeTables = tables.filter((t) =>
    (ALLOWED_RESET_TABLES as readonly string[]).includes(t)
  );

  for (const table of safeTables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("user_id", user.id);
    if (error) return { error: `Không thể xóa dữ liệu (${table})` };
  }

  revalidateTag(`user-${user.id}`);
  revalidatePath("/", "layout");
}
