// src/components/common/responsive-date-picker.tsx
"use client";

import { useState } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { Popover } from "@base-ui/react/popover";
import { format, parseISO, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}

const CALENDAR_STYLES = `
  .rdp-root {
    --rdp-accent-color: var(--accent);
    --rdp-background-color: var(--surface);
    --rdp-accent-background-color: var(--accent);
    --rdp-day_button-border-radius: 4px;
    --rdp-selected-font: bold;
    --rdp-selected-border: 2px solid var(--accent);
  }
  .rdp-day_button { font-size: 14px; height: 40px; width: 40px; }
  .rdp-day_selected, .rdp-day_selected:hover {
    background-color: var(--accent);
    color: var(--background);
    font-weight: bold;
  }
  .rdp-nav_button { color: var(--foreground-muted); }
  .rdp-nav_button:hover {
    background-color: var(--surface-elevated);
    color: var(--accent);
  }
  .rdp-month_caption { font-size: 16px; font-weight: 700; color: var(--foreground); }
  .rdp-weekday {
    font-size: 12px;
    font-weight: 600;
    color: var(--foreground-muted);
    text-transform: uppercase;
  }
  .rdp-today { color: var(--accent); font-weight: 700; }
`;

export function ResponsiveDatePicker({
  value,
  onChange,
  disabled,
}: Readonly<ResponsiveDatePickerProps>) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const dateValue = value ? parseISO(value) : undefined;
  const initMonth = dateValue && isValid(dateValue) ? dateValue : new Date();

  const calendar = (
    <div className="flex flex-col items-center justify-center p-6">
      <style>{CALENDAR_STYLES}</style>
      <DayPicker
        locale={vi}
        mode="single"
        defaultMonth={initMonth}
        selected={dateValue}
        onSelect={(date) => {
          if (date) {
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }
        }}
        showOutsideDays
        fixedWeeks
      />
    </div>
  );

  const triggerLabel =
    dateValue && isValid(dateValue)
      ? format(dateValue, "dd/MM/yyyy")
      : "Chọn ngày";

  if (isDesktop) {
    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          type="button"
          disabled={disabled}
          className="bg-background border-border flex h-12 w-full cursor-pointer items-center justify-between border px-3.5 disabled:opacity-50"
        >
          <span
            className={`text-sm font-medium ${value ? "text-foreground" : "text-foreground-muted"}`}
          >
            {triggerLabel}
          </span>
          <CalendarIcon size={16} className="text-foreground-muted" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            side="bottom"
            align="start"
            sideOffset={4}
            className="!z-[10000]"
          >
            <Popover.Popup className="bg-surface border-border !z-[10000] border shadow-lg">
              {calendar}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="bg-background border-border flex h-12 w-full cursor-pointer items-center justify-between border px-3.5 disabled:opacity-50"
      >
        <span
          className={`text-sm font-medium ${value ? "text-foreground" : "text-foreground-muted"}`}
        >
          {triggerLabel}
        </span>
        <CalendarIcon size={16} className="text-foreground-muted" />
      </button>

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 !z-[9999] bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Drawer.Popup className="bg-background fixed inset-x-0 bottom-0 !z-[10000] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
            <div className="border-border flex items-center justify-between border-b px-7 pt-5 pb-4">
              <span className="text-foreground text-lg font-bold">
                Chọn Ngày
              </span>
              <Drawer.Close className="text-foreground-muted cursor-pointer">
                <X size={20} />
              </Drawer.Close>
            </div>
            {calendar}
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
