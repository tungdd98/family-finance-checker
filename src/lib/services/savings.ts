// src/lib/services/savings.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SavingsInput } from "@/lib/validations/savings";

export interface SavingsAccount {
  id: string;
  user_id: string;
  bank_name: string;
  account_name: string | null;
  note: string | null;
  principal: number;
  interest_rate: number;
  term_months: number | null;
  start_date: string;
  maturity_date: string | null;
  rollover_type: "none" | "principal" | "principal_interest";
  status: "active" | "matured" | "closed";
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Tính ngày đáo hạn từ ngày gửi + kỳ hạn (tháng)
 */
export function calcMaturityDate(
  startDate: string,
  termMonths: number
): string | null {
  if (termMonths === 0) return null;
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + termMonths);
  return d.toISOString().split("T")[0];
}

/**
 * Tính số ngày còn lại đến đáo hạn
 * Dương = còn hạn, âm = đã quá hạn
 */
export function daysToMaturity(maturityDate: string | null): number | null {
  if (!maturityDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const mat = new Date(maturityDate);
  return Math.round((mat.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Tính lãi đơn tích lũy đến hiện tại (hoặc đến ngày đáo hạn nếu đã qua)
 * Công thức: principal × rate/100/365 × days
 */
export function calcAccruedInterest(account: SavingsAccount): number {
  const start = new Date(account.start_date);
  const end = account.maturity_date
    ? new Date(
        new Date() < new Date(account.maturity_date)
          ? new Date()
          : new Date(account.maturity_date)
      )
    : new Date();

  const days = Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  return Math.floor(
    (account.principal * (account.interest_rate / 100) * days) / 365
  );
}

/**
 * Tính tổng giá trị đến ngày đáo hạn
 */
export function calcMaturityValue(account: SavingsAccount): number {
  if (!account.maturity_date || !account.term_months) {
    // Không kỳ hạn: lãi tính đến hôm nay
    return account.principal + calcAccruedInterest(account);
  }
  const days = account.term_months * 30;
  const interest = Math.floor(
    (account.principal * (account.interest_rate / 100) * days) / 365
  );
  return account.principal + interest;
}

/**
 * Xác định trạng thái hiển thị của khoản tiết kiệm
 */
export type SavingsStatus = "active" | "soon" | "matured";

export function getSavingsDisplayStatus(
  account: SavingsAccount
): SavingsStatus {
  if (!account.maturity_date) return "active";
  const days = daysToMaturity(account.maturity_date);
  if (days === null) return "active";
  if (days < 0) return "matured";
  if (days <= 7) return "soon";
  return "active";
}

// ── CRUD ─────────────────────────────────────────────────────

export async function getSavingsAccounts(
  supabase: SupabaseClient,
  userId: string
): Promise<SavingsAccount[]> {
  const { data, error } = await supabase
    .from("savings_accounts")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "closed")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addSavingsAccount(
  supabase: SupabaseClient,
  userId: string,
  input: SavingsInput
): Promise<void> {
  const maturity_date = calcMaturityDate(input.start_date, input.term_months);
  const { error } = await supabase.from("savings_accounts").insert({
    user_id: userId,
    bank_name: input.bank_name,
    account_name: input.account_name || null,
    note: input.note || null,
    principal: input.principal,
    interest_rate: input.interest_rate,
    term_months: input.term_months === 0 ? null : input.term_months,
    start_date: input.start_date,
    maturity_date,
    rollover_type: input.rollover_type,
  });
  if (error) throw error;
}

export async function updateSavingsAccount(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  input: SavingsInput
): Promise<void> {
  const maturity_date = calcMaturityDate(input.start_date, input.term_months);
  const { error } = await supabase
    .from("savings_accounts")
    .update({
      bank_name: input.bank_name,
      account_name: input.account_name || null,
      note: input.note || null,
      principal: input.principal,
      interest_rate: input.interest_rate,
      term_months: input.term_months === 0 ? null : input.term_months,
      start_date: input.start_date,
      maturity_date,
      rollover_type: input.rollover_type,
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteSavingsAccount(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("savings_accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
