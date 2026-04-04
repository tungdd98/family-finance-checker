import { formatVND } from "@/lib/gold-utils";
import type { HouseholdCashFlow } from "@/lib/services/goals";

interface Props {
  cashFlow: HouseholdCashFlow | null;
  onEdit: () => void;
}

export function CashFlowCard({ cashFlow, onEdit }: Props) {
  const surplus = cashFlow
    ? cashFlow.avg_monthly_income - cashFlow.avg_monthly_expense
    : null;

  return (
    <div className="bg-surface border-border border p-4">
      <p className="type-card-label mb-3">Cài đặt thu chi trung bình</p>
      {cashFlow ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary text-sm">
              Thu nhập TB/tháng
            </span>
            <span className="text-foreground text-sm font-semibold">
              {formatVND(cashFlow.avg_monthly_income)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary text-sm">
              Chi tiêu TB/tháng
            </span>
            <span className="text-foreground text-sm font-semibold">
              {formatVND(cashFlow.avg_monthly_expense)}
            </span>
          </div>
          <div className="border-border mt-1 flex items-center justify-between border-t pt-1">
            <span className="text-foreground-secondary text-sm">
              Thặng dư dự kiến
            </span>
            <span
              className={`text-sm font-bold ${surplus! >= 0 ? "text-green-500" : "text-red-400"}`}
            >
              {surplus! >= 0 ? "+" : ""}
              {formatVND(surplus!)}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-foreground-muted text-sm">Chưa cài đặt</p>
      )}
      <button
        onClick={onEdit}
        className="text-accent mt-3 w-full text-right text-xs font-semibold"
      >
        {cashFlow ? "Chỉnh sửa →" : "Cài đặt ngay →"}
      </button>
    </div>
  );
}
