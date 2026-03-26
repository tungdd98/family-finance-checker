import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  sub,
  className,
}: Readonly<MetricCardProps>) {
  return (
    <div
      className={cn(
        "bg-surface flex flex-col gap-2 rounded-none p-[20px_18px]",
        className
      )}
    >
      <span className="bg-accent block h-3.5 w-0.75" />
      <p className="type-card-label">{label}</p>
      <p className="text-foreground text-[28px] leading-tight font-bold">
        {value}
      </p>
      {sub && (
        <p className="text-foreground-secondary text-[10px] font-medium tracking-[0.01em]">
          {sub}
        </p>
      )}
    </div>
  );
}
