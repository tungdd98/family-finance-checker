import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/services/settings";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const settings = await getSettings(supabase, user.id);

  const initialData = {
    display_name: settings?.display_name ?? "",
    initial_cash_balance: settings?.initial_cash_balance ?? 0,
  };

  return (
    <div className="bg-background min-h-screen">
      <SettingsForm initialData={initialData} />
    </div>
  );
}
