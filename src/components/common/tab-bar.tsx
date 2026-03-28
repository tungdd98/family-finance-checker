"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  House,
  Landmark,
  Settings,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

const TAB_ITEMS = [
  { icon: House, label: "DASHBOARD", href: "/dashboard" },
  { icon: Coins, label: "VÀNG", href: "/gold" },
  { icon: TrendingUp, label: "THỊ TRƯỜNG", href: "/market" },
  { icon: Landmark, label: "TIẾT KIỆM", href: "/savings" },
  { icon: Settings, label: "CÀI ĐẶT", href: "/settings" },
];

export function TabBar() {
  const activeHref = usePathname();
  return (
    <nav className="bg-surface rounded-pill border-border flex h-full border p-1">
      {TAB_ITEMS.map((item) => {
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
