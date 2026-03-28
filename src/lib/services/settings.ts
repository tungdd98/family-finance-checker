// src/lib/services/settings.ts
import type { SupabaseClient } from "@supabase/supabase-js";

import type { SettingsInput } from "@/lib/validations/settings";

export async function getSettings(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("user_settings")
    .select("display_name, initial_cash_balance")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function upsertSettings(
  supabase: SupabaseClient,
  userId: string,
  data: SettingsInput
) {
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      display_name: data.display_name,
      initial_cash_balance: data.initial_cash_balance,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return error;
}
