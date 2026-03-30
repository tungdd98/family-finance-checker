import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  href: string;
  accentColor?: "gold" | "blue";
  children: React.ReactNode;
}

export function StatTile({
  label,
  href,
  accentColor,
  children,
}: StatTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        "bg-surface border-border flex flex-col gap-1.5 border p-3",
        accentColor === "gold" && "border-l-accent border-l-2",
        accentColor === "blue" && "border-l-2 border-l-[#6B7FD7]"
      )}
    >
      <span className="text-foreground-secondary text-[9px] font-bold tracking-[1.5px] uppercase">
        {label}
      </span>
      {children}
    </Link>
  );
}
