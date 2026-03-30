import { createClient } from "@/lib/supabase/server";
import { cachedGetSavingsAccounts } from "@/lib/server-queries";
import { SavingsClient } from "./SavingsClient";

export default async function SavingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const accounts = user ? await cachedGetSavingsAccounts(user.id) : [];

  return <SavingsClient initialAccounts={accounts} />;
}
