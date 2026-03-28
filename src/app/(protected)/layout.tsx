import Link from "next/link";
import { LogOut, Trophy } from "lucide-react";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import { TabBar } from "@/components/common";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/services/settings";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const settings = await getSettings(supabase, user.id);
  const displayName =
    settings?.display_name || user?.email?.split("@")[0] || "Bạn";

  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden">
      {/* Header Row - Fixed at top */}
      <div className="flex items-center justify-between px-5 py-4">
        {/* Left side: Greeting */}
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground-muted text-[10px] font-semibold tracking-[1px] uppercase">
            XIN CHÀO,
          </span>
          <span className="text-foreground text-[14px] font-bold">
            {displayName} 👋
          </span>
        </div>

        {/* Right side: Actions */}
        <div className="flex justify-end gap-2">
          <Link href="/goals">
            <div className="flex items-center gap-3">
              <div className="bg-surface/50 border-border flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border">
                <Trophy size={20} className="text-accent" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5">
        {children}
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-background h-[95px] px-5 pt-3 pb-[21px]">
        <TabBar />
      </div>
    </div>
  );
}
