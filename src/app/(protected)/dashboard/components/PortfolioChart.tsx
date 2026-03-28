"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatVND } from "@/lib/gold-utils";

interface PortfolioItem {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: PortfolioItem[];
}

export function PortfolioChart({ data }: Props) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-row items-center gap-6 overflow-hidden">
      {/* Compact Chart - Smaller size for mobile efficiency */}
      <div className="relative h-[110px] w-[110px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={48}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-surface-elevated border-border text-foreground border p-2 text-[11px] font-bold">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2"
                          style={{ backgroundColor: d.color }}
                        />
                        <p className="tracking-[1px] uppercase">{d.name}</p>
                      </div>
                      <p className="text-accent mt-1">{formatVND(d.value)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-foreground-muted text-[8px] font-bold tracking-[1.5px] uppercase">
            TỔNG
          </span>
          <span className="text-foreground text-[12px] font-bold tracking-[-0.5px]">
            {new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(
              total
            )}
          </span>
        </div>
      </div>

      {/* Dense Legend - Perfect for mobile screens */}
      <div className="flex flex-1 flex-col justify-center gap-3">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div
              key={index}
              className="flex flex-col gap-0.5 border-l-2 pl-3"
              style={{ borderColor: item.color }}
            >
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary text-[10px] font-bold tracking-[1px] uppercase">
                  {item.name}
                </span>
                <span className="text-foreground text-[10px] font-bold">
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <div className="text-foreground text-[14px] font-bold tracking-[-0.5px]">
                {formatVND(item.value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
