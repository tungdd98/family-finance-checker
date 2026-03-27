import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface TabItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface TabBarProps {
  items: TabItem[];
  activeHref: string;
}

export function TabBar({ items, activeHref }: Readonly<TabBarProps>) {
  return (
    <nav className="bg-surface rounded-pill border-border flex h-full border p-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "bg-accent rounded-pill-item flex flex-1 flex-col items-center justify-center gap-1"
                : "rounded-pill-item flex flex-1 flex-col items-center justify-center gap-1"
            }
          >
            <Icon
              size={18}
              className={isActive ? "text-[#111111]" : "text-foreground-muted"}
            />
            <span
              className={`type-tab-label ${isActive ? "font-semibold text-[#111111]" : "text-foreground-muted font-medium"}`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
