"use client";

import { useEffect, useState, useMemo } from "react";
import { Bell, X, AlertCircle, Banknote } from "lucide-react";
import { useRouter } from "next/navigation";
import { Drawer } from "@base-ui/react/drawer";
import type { NotiItem } from "@/app/actions/notifications";

export function NotificationBell({ allNotis }: { allNotis: NotiItem[] }) {
  const [open, setOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dismissed_notis");
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDismissedIds(JSON.parse(stored));
      }
    } catch (_e) {
      // ignore
    }
  }, []);

  const activeNotis = useMemo(() => {
    return allNotis.filter((noti) => !dismissedIds.includes(noti.id));
  }, [allNotis, dismissedIds]);

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem("dismissed_notis", JSON.stringify(newDismissed));
  };

  const handleAction = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const getIcon = (type: string) => {
    if (type === "surplus")
      return <AlertCircle size={20} className="text-[#D4AF37]" />;
    if (type === "savings")
      return <Banknote size={20} className="text-accent" />;
    return <AlertCircle size={20} className="text-foreground" />;
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className="bg-surface/50 border-border hover:bg-surface relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors">
        <Bell size={20} className="text-foreground" />
        {activeNotis.length > 0 && (
          <span className="absolute top-2.5 right-3 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
        )}
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 z-50 flex h-[92dvh] flex-col overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          <div className="bg-background border-border sticky top-0 z-10 flex items-center justify-between border-b px-7 pt-5 pb-4">
            <span className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
              THÔNG BÁO
            </span>
            <Drawer.Close className="text-foreground-muted">
              <X size={20} />
            </Drawer.Close>
          </div>

          <div className="flex flex-col gap-4 px-7 py-5 pb-10">
            {activeNotis.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 opacity-50">
                <Bell size={40} className="text-foreground-muted" />
                <p className="text-[13px] font-medium tracking-[0.5px]">
                  Không có thông báo mới
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeNotis.map((noti) => (
                  <div
                    key={noti.id}
                    className="border-border relative flex flex-col gap-2 border bg-[#141414] p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 pt-0.5">
                        {getIcon(noti.type)}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 pr-6">
                        <span className="text-foreground text-[13px] font-bold tracking-[0.2px]">
                          {noti.title}
                        </span>
                        <span className="text-foreground-muted text-[12px] leading-relaxed">
                          {noti.message}
                        </span>
                      </div>
                    </div>

                    <div className="border-border mt-1 flex justify-end border-t pt-2">
                      <button
                        onClick={() => handleAction(noti.actionUrl)}
                        className="text-[11px] font-bold tracking-[1px] text-[#D4AF37] uppercase hover:underline"
                      >
                        Xử lý ngay →
                      </button>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={(e) => handleDismiss(e, noti.id)}
                      className="text-foreground-muted absolute top-2 right-2 p-1 hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
