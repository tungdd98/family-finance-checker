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
    <nav className="bg-surface rounded-pill flex items-center gap-1 px-5.25 pt-3 pb-5.25">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "bg-accent rounded-pill-item flex items-center gap-1.5 px-3.5 py-1"
                : "rounded-pill-item flex items-center gap-1.5 px-3.5 py-1"
            }
          >
            <Icon
              size={18}
              className={isActive ? "text-[#111111]" : "text-foreground-muted"}
            />
            <span
              className={`type-tab-label font-semibold ${isActive ? "text-[#111111]" : "text-foreground-muted"}`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
