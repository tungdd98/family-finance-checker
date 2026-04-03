// src/components/pc/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  House,
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  Target,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { logoutAction } from "@/app/actions/auth";

interface NavItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  href: string;
  childRoutes?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: House, label: "Dashboard", href: "/dashboard" },
  {
    icon: Wallet,
    label: "Tài Sản",
    href: "/assets",
    childRoutes: ["/gold", "/savings"],
  },
  { icon: TrendingUp, label: "Thị Trường", href: "/market" },
  { icon: ArrowLeftRight, label: "Thu/Chi", href: "/cashflow" },
  { icon: Target, label: "Mục Tiêu", href: "/goals" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const isActive = (href: string, childRoutes?: string[]) => {
    if (pathname === href) return true;
    return childRoutes?.some((r) => pathname.startsWith(r)) ?? false;
  };

  return (
    <aside
      className={`bg-surface border-border flex h-full flex-col border-r transition-all duration-200 ${
        collapsed ? "w-14" : "w-[200px]"
      }`}
    >
      {/* Logo + toggle */}
      <div className="border-border flex h-[65px] shrink-0 items-center border-b px-3">
        {!collapsed && (
          <span className="text-accent flex-1 truncate text-sm font-bold">
            Family Finance
          </span>
        )}
        <button
          type="button"
          onClick={toggle}
          className="bg-background border-border flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
          aria-label={collapsed ? "Mở sidebar" : "Thu sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={14} className="text-foreground-muted" />
          ) : (
            <ChevronLeft size={14} className="text-foreground-muted" />
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.childRoutes);
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-xl px-2 py-2.5 transition-colors ${
                collapsed ? "justify-center" : "gap-3"
              } ${
                active
                  ? "bg-accent text-[#111111]"
                  : "text-foreground-muted hover:bg-surface-elevated"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <span className="text-[11px] font-semibold tracking-wide uppercase">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-border flex flex-col gap-1 border-t p-2">
        <Link
          href="/settings"
          title={collapsed ? "Cài đặt" : undefined}
          className={`text-foreground-muted hover:bg-surface-elevated flex items-center rounded-xl px-2 py-2.5 transition-colors ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && (
            <span className="text-[11px] font-semibold tracking-wide uppercase">
              Cài đặt
            </span>
          )}
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            title={collapsed ? "Đăng xuất" : undefined}
            className={`text-foreground-muted hover:bg-surface-elevated flex w-full items-center rounded-xl px-2 py-2.5 transition-colors ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && (
              <span className="text-[11px] font-semibold tracking-wide uppercase">
                Đăng xuất
              </span>
            )}
          </button>
        </form>
      </div>
    </aside>
  );
}
