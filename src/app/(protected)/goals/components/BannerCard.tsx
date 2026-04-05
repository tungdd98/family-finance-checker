import { formatVND } from "@/lib/gold-utils";

interface Props {
  currentAssets: number;
  avgMonthlySurplus: number | null;
}

export function BannerCard({
  currentAssets,
  avgMonthlySurplus,
}: Readonly<Props>) {
  return (
    <div className="to-surface border border-[#3a3010] bg-gradient-to-br from-[#1c1800] p-4">
      <p className="type-card-label text-accent mb-3">Tổng quan tài chính</p>
      <div className="flex gap-0">
        <div className="flex-1">
          <p className="text-foreground-muted mb-1 text-xs">Tài sản hiện tại</p>
          <p className="text-foreground text-base font-bold">
            {formatVND(currentAssets)}
          </p>
        </div>
        <div className="mx-4 w-px shrink-0 bg-[#333]" />
        <div className="flex-1">
          <p className="text-foreground-muted mb-1 text-xs">
            Thặng dư TB/tháng
          </p>
          {avgMonthlySurplus !== null ? (
            <p
              className={`text-base font-bold ${avgMonthlySurplus >= 0 ? "text-green-500" : "text-red-400"}`}
            >
              {avgMonthlySurplus >= 0 ? "+" : ""}
              {formatVND(avgMonthlySurplus)}
            </p>
          ) : (
            <p className="text-foreground-muted text-sm">Chưa cài đặt</p>
          )}
        </div>
      </div>
    </div>
  );
}
