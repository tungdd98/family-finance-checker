import { formatVND } from "@/lib/gold-utils";

interface Props {
  currentAssets: number;
  avgMonthlySurplus: number | null;
}

export function BannerCard({ currentAssets, avgMonthlySurplus }: Props) {
  return (
    <div className="border border-[#3a3010] bg-gradient-to-br from-[#1c1800] to-[#1a1a1a] p-4">
      <p className="mb-3 text-[10px] font-semibold tracking-[1.5px] text-[#D4AF37] uppercase">
        Tổng quan tài chính
      </p>
      <div className="flex gap-0">
        <div className="flex-1">
          <p className="text-foreground-muted mb-1 text-[11px]">
            Tài sản hiện tại
          </p>
          <p className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
            {formatVND(currentAssets)}
          </p>
        </div>
        <div className="mx-4 w-px shrink-0 bg-[#333]" />
        <div className="flex-1">
          <p className="text-foreground-muted mb-1 text-[11px]">
            Thặng dư TB/tháng
          </p>
          {avgMonthlySurplus !== null ? (
            <p
              className={`text-[16px] font-bold tracking-[-0.5px] ${avgMonthlySurplus >= 0 ? "text-green-500" : "text-red-400"}`}
            >
              {avgMonthlySurplus >= 0 ? "+" : ""}
              {formatVND(avgMonthlySurplus)}
            </p>
          ) : (
            <p className="text-foreground-muted text-[13px]">Chưa cài đặt</p>
          )}
        </div>
      </div>
    </div>
  );
}
