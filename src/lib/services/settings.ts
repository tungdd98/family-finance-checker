// src/lib/services/settings.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { SettingsInput } from "@/lib/validations/settings";

export async function getSettings(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("user_settings")
        .select("display_name, initial_cash_balance")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
    [`settings-${userId}`],
    { tags: [`user-${userId}`], revalidate: 30 }
  )();
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
