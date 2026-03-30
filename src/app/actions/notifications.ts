"use server";

import { createClient } from "@/lib/supabase/server";
import { daysToMaturity } from "@/lib/services/savings";
import type { SavingsAccount } from "@/lib/services/savings";
import { formatVND } from "@/lib/gold-utils";

export type NotiItem = {
  id: string;
  type: "surplus" | "savings";
  title: string;
  message: string;
  actionUrl: string;
};

export async function getNotificationsAction(): Promise<NotiItem[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const notis: NotiItem[] = [];
    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1;

    // 1. Surplus Alert
    const { data: monthlyData } = await supabase
      .from("monthly_actuals")
      .select("actual_income, actual_expense, allocations")
      .eq("user_id", user.id)
      .eq("year", currentYear)
      .eq("month", currentMonth)
      .single();

    if (monthlyData && monthlyData.actual_income > 0) {
      const surplus = monthlyData.actual_income - monthlyData.actual_expense;
      const allocations =
        (monthlyData.allocations as { amount?: number }[]) || [];
      const totalAllocated = allocations.reduce(
        (acc: number, item: { amount?: number }) => acc + (item.amount || 0),
        0
      );
      const unallocated = surplus - totalAllocated;

      // Chỉ báo nếu còn dư trên 10.000đ (tránh các khoản lẻ quá nhỏ)
      if (unallocated >= 10000) {
        notis.push({
          id: `surplus_${currentYear}_${currentMonth}`,
          type: "surplus",
          title: "Chưa phân bổ xong thặng dư!",
          message: `Tháng ${currentMonth}/${currentYear} bạn còn dư ${formatVND(unallocated)} chưa được lên kế hoạch (Zero-based Budgeting).`,
          actionUrl: "/goals",
        });
      }
    }

    // 2. Savings Maturity Alert
    const { data: savingsData } = await supabase
      .from("savings_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (savingsData) {
      const accounts = savingsData as SavingsAccount[];
      const NOTI_DAYS_THRESHOLD = 7;

      accounts.forEach((acc) => {
        if (!acc.maturity_date) return;
        const daysLeft = daysToMaturity(acc.maturity_date);

        // Cảnh báo nếu đáo hạn trong vòng 7 ngày tới, hoặc đã quá hạn
        if (daysLeft !== null && daysLeft <= NOTI_DAYS_THRESHOLD) {
          const isOverdue = daysLeft < 0;
          const statusText = isOverdue
            ? `đã quá hạn ${Math.abs(daysLeft)} ngày`
            : daysLeft === 0
              ? "đáo hạn hôm nay"
              : `sắp đáo hạn trong ${daysLeft} ngày tới`;

          notis.push({
            id: `savings_maturity_${acc.id}`,
            type: "savings",
            title: isOverdue ? "Đã đáo hạn tiết kiệm" : "Sắp đáo hạn tiết kiệm",
            message: `Sổ "${acc.account_name || acc.bank_name}" với số tiền ${formatVND(acc.principal)} ${statusText}.`,
            actionUrl: "/savings",
          });
        }
      });
    }

    return notis;
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return [];
  }
}
