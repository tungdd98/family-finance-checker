// src/components/common/responsive-action-menu.tsx
"use client";

import { X } from "lucide-react";
import { Drawer } from "@base-ui/react/drawer";
import { Dialog } from "@base-ui/react/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveActionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function ResponsiveActionMenu({
  open,
  onOpenChange,
  children,
}: ResponsiveActionMenuProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="bg-surface fixed top-1/2 left-1/2 z-50 flex w-full max-w-xs -translate-x-1/2 -translate-y-1/2 flex-col pb-4 opacity-100 transition-all duration-300 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="flex justify-end px-4 pt-4 pb-2">
              <Dialog.Close className="text-foreground-muted cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Popup className="bg-surface fixed right-0 bottom-0 left-0 z-50 flex flex-col pb-8 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          <div className="flex justify-center pt-3 pb-4">
            <div className="bg-border-strong h-1 w-10 rounded-full" />
          </div>
          {children}
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
