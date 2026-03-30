import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { cachedGetSettings } from "@/lib/server-queries";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const settings = await cachedGetSettings(user.id);

  const displayName =
    settings?.display_name || user?.email?.split("@")[0] || "Bạn";

  const initialData = {
    display_name: settings?.display_name ?? "",
    initial_cash_balance: settings?.initial_cash_balance ?? 0,
  };

  return <SettingsForm initialData={initialData} displayName={displayName} />;
}
