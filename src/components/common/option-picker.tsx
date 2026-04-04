"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Check, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface OptionItem {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface Props {
  title: string;
  options: OptionItem[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  autoOpen?: boolean;
  onAfterSelect?: () => void;
}

export function OptionPicker({
  title,
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  disabled,
  autoOpen,
  onAfterSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (autoOpen) {
      const t = setTimeout(() => setOpen(true), 0);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const selected = options.find((o) => o.value === value);

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="bg-background border-border flex h-12 w-full items-center justify-between border px-3.5 disabled:opacity-50"
      >
        <span
          className={`text-[13px] font-medium ${selected ? "text-foreground" : "text-foreground-muted"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className="text-foreground-muted h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dialog */}
      <Dialog.Root open={open} onOpenChange={setOpen} modal={true}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/60 opacity-100 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup
            className={`bg-surface z-[70] flex flex-col transition-all duration-300 ${
              isDesktop
                ? "fixed top-1/2 left-1/2 max-h-[90dvh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden opacity-100 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
                : "fixed inset-x-0 bottom-0 max-h-[92dvh] ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <Dialog.Title className="text-foreground text-[16px] font-bold tracking-[-0.5px]">
                {title}
              </Dialog.Title>
              <Dialog.Close className="text-foreground-muted">
                <X size={20} />
              </Dialog.Close>
            </div>

            {/* Options */}
            <div className="overflow-y-auto pb-8">
              {options.map((o) => {
                const isSelected = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      onAfterSelect?.();
                    }}
                    className={`border-border flex w-full items-center justify-between border-b px-5 py-4 last:border-b-0 ${
                      isSelected ? "text-accent" : "text-foreground"
                    }`}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-[14px] font-medium">{o.label}</span>
                      {o.sublabel && (
                        <span className="text-foreground-muted text-[11px]">
                          {o.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-accent shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
