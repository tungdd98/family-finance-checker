import { createClient } from "@/lib/supabase/server";
import { getSavingsAccounts } from "@/lib/services/savings";
import { SavingsClient } from "./SavingsClient";

export default async function SavingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const accounts = user ? await getSavingsAccounts(supabase, user.id) : [];

  return <SavingsClient initialAccounts={accounts} />;
}
