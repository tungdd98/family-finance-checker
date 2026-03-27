"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Battery,
  Coins,
  House,
  Landmark,
  LogOut,
  Settings,
  Signal,
  Trophy,
  Wifi,
} from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { TabBar } from "@/components/common";

const TAB_ITEMS = [
  { icon: House, label: "DASHBOARD", href: "/dashboard" },
  { icon: Coins, label: "VÀNG", href: "/gold" },
  { icon: Landmark, label: "TIẾT KIỆM", href: "/savings" },
  { icon: Settings, label: "CÀI ĐẶT", href: "/settings" },
];

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="bg-background flex h-dvh flex-col">
      {/* Status Bar */}
      <div className="bg-background flex h-[62px] items-center justify-between px-5">
        <span className="text-[15px] font-semibold tracking-[-0.3px] text-white">
          9:41
        </span>
        <div className="flex items-center gap-1.5">
          <Signal size={18} className="text-white" />
          <Wifi size={18} className="text-white" />
          <Battery size={18} className="text-white" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto pt-6 pr-7 pb-7 pl-7">
        {/* Header Row */}
        <div className="flex justify-end gap-2">
          <Link
            href="/goals"
            className="border-border bg-surface flex h-[38px] w-[38px] items-center justify-center rounded-lg border"
            aria-label="Mục tiêu"
          >
            <Trophy size={18} className="text-foreground-secondary" />
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Đăng xuất"
              className="border-border bg-surface flex h-[38px] w-[38px] items-center justify-center rounded-lg border"
            >
              <LogOut size={18} className="text-foreground-secondary" />
            </button>
          </form>
        </div>

        {children}
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-background h-[95px] px-[21px] pt-3 pb-[21px]">
        <TabBar activeHref={pathname} items={TAB_ITEMS} />
      </div>
    </div>
  );
}
