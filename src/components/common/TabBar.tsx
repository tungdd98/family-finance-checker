"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeftRight,
  House,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface TabItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  href: string;
  childRoutes?: string[];
}

const TAB_ITEMS: TabItem[] = [
  { icon: House, label: "DASHBOARD", href: "/dashboard" },
  {
    icon: Wallet,
    label: "TÀI SẢN",
    href: "/assets",
    childRoutes: ["/gold", "/savings"],
  },
  { icon: TrendingUp, label: "THỊ TRƯỜNG", href: "/market" },
  { icon: ArrowLeftRight, label: "THU/CHI", href: "/cashflow" },
  { icon: Target, label: "MỤC TIÊU", href: "/goals" },
];

export function TabBar() {
  const realPathname = usePathname();
  const router = useRouter();

  // Optimistic active tab: update instantly on tap, sync back when navigation settles
  const [optimisticHref, setOptimisticHref] = useState(realPathname);

  // Sync when real pathname changes (navigation completed)
  useEffect(() => {
    setOptimisticHref(realPathname);
  }, [realPathname]);

  const handleTabPress = (href: string) => {
    if (optimisticHref === href) return;
    // Signal the global progress bar to start immediately
    window.dispatchEvent(new Event("navigation-start"));
    // Immediately reflect the tap — no waiting for server
    setOptimisticHref(href);
    router.push(href);
  };

  return (
    <nav className="bg-surface rounded-pill border-border flex h-full border p-1">
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === optimisticHref ||
          item.childRoutes?.some((r) => optimisticHref.startsWith(r)) === true;
        return (
          <button
            key={item.href}
            type="button"
            onClick={() => handleTabPress(item.href)}
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
              className={`text-2xs font-medium uppercase ${isActive ? "font-semibold text-[#111111]" : "text-foreground-muted font-medium"}`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
