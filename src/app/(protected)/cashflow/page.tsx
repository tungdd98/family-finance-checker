import { createClient } from "@/lib/supabase/server";
import {
  cachedGetMonthlyActual,
  cachedGetCashFlow,
} from "@/lib/server-queries";
import { CashflowClient } from "./CashflowClient";

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function CashflowPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? "") || now.getFullYear();
  const month = parseInt(params.month ?? "") || now.getMonth() + 1;

  const [existing, cashFlow] = await Promise.all([
    cachedGetMonthlyActual(user.id, year, month),
    cachedGetCashFlow(user.id),
  ]);

  return (
    <CashflowClient
      year={year}
      month={month}
      existing={existing}
      cashFlow={cashFlow}
    />
  );
}
