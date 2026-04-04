"use client";

import { Pencil, Trash2, CalendarDays, TrendingUp } from "lucide-react";
import {
  type SavingsAccount,
  calcAccruedInterest,
  calcMaturityValue,
  daysToMaturity,
  getSavingsDisplayStatus,
} from "@/lib/services/savings";
import { formatVND } from "@/lib/gold-utils";

interface Props {
  account: SavingsAccount;
  onTap: (account: SavingsAccount) => void;
}

const STATUS_CONFIG = {
  active: {
    label: "Đang chạy",
    dot: "bg-status-positive",
    text: "text-status-positive",
  },
  soon: { label: "Sắp đáo hạn", dot: "bg-accent", text: "text-accent" },
  matured: {
    label: "Đã đáo hạn",
    dot: "bg-status-negative",
    text: "text-status-negative",
  },
};

const ROLLOVER_LABEL: Record<string, string> = {
  none: "Không tái tục",
  principal: "Tái tục gốc",
  principal_interest: "Tái tục gốc + lãi",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function DetailRow({
  label,
  value,
  valueClass = "text-foreground",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground-muted text-xs">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

export function SavingsCard({ account, onTap }: Props) {
  const displayStatus = getSavingsDisplayStatus(account);
  const statusCfg = STATUS_CONFIG[displayStatus];
  const accrued = calcAccruedInterest(account);
  const maturityValue = calcMaturityValue(account);
  const daysLeft = daysToMaturity(account.maturity_date);

  return (
    <button
      onClick={() => onTap(account)}
      className="bg-surface active:bg-surface-elevated flex w-full flex-col gap-3 p-4 text-left transition-colors"
    >
      {/* Header row */}
      <div className="flex w-full items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-semibold">
            {account.account_name || account.bank_name}
          </span>
          {account.account_name && (
            <span className="text-foreground-muted text-xs">
              {account.bank_name}
            </span>
          )}
        </div>

        {/* Status badge */}
        <div className="flex shrink-0 items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
          <span className={`text-xs font-semibold ${statusCfg.text}`}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-border border-t" />

      {/* Detail rows */}
      <div className="flex w-full flex-col gap-2">
        <DetailRow label="Tiền gốc" value={formatVND(account.principal)} />
        <DetailRow
          label="Lãi tích lũy"
          value={`+${formatVND(accrued)}`}
          valueClass="text-status-positive"
        />
        <DetailRow
          label="Lãi suất"
          value={`${account.interest_rate}%/năm · ${account.term_months ? `${account.term_months} tháng` : "Không kỳ hạn"}`}
          valueClass="text-accent"
        />
        <DetailRow label="Ngày gửi" value={formatDate(account.start_date)} />
        {account.maturity_date && (
          <>
            <DetailRow
              label="Ngày đáo hạn"
              value={formatDate(account.maturity_date)}
            />
            <DetailRow
              label="Còn lại"
              value={
                daysLeft === null
                  ? "—"
                  : daysLeft < 0
                    ? `Quá hạn ${Math.abs(daysLeft)} ngày`
                    : daysLeft === 0
                      ? "Hôm nay đáo hạn"
                      : `${daysLeft} ngày`
              }
              valueClass={`font-semibold ${
                daysLeft === null
                  ? "text-foreground-muted"
                  : daysLeft < 0
                    ? "text-status-negative"
                    : daysLeft <= 7
                      ? "text-accent"
                      : "text-foreground-muted"
              }`}
            />
            <DetailRow
              label="GT đến đáo hạn"
              value={formatVND(maturityValue)}
              valueClass="text-foreground font-semibold"
            />
          </>
        )}
        <DetailRow
          label="Tất toán"
          value={ROLLOVER_LABEL[account.rollover_type]}
        />
        {account.note && <DetailRow label="Ghi chú" value={account.note} />}
      </div>
    </button>
  );
}
