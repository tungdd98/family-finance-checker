// src/app/actions/settings.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { settingsSchema, type SettingsInput } from "@/lib/validations/settings";
import { upsertSettings } from "@/lib/services/settings";

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

  revalidatePath("/", "layout");
}
