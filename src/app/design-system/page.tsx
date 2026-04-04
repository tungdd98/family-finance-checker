import { Plus } from "lucide-react";

import { Badge, MetricCard, TabBar } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ── Helpers ─────────────────────────────────────── */

function Section({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-4">
      <p className="type-section-label border-border border-b pb-2">{title}</p>
      {children}
    </div>
  );
}

function ColorSwatch({
  label,
  hex,
  bg,
  text = "text-foreground-muted",
}: Readonly<{
  label: string;
  hex: string;
  bg: string;
  text?: string;
}>) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`h-14 w-full ${bg}`} />
      <p className="type-card-label">{label}</p>
      <p className={`font-mono text-[10px] ${text}`}>{hex}</p>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────── */

export default function DesignSystemPage() {
  return (
    <div className="bg-background min-h-screen px-12 py-10">
      {/* Header */}
      <div className="mb-10 flex items-center gap-4">
        <span className="bg-accent h-8 w-0.75" />
        <h1 className="type-card-title">Brutalist Luxury — Design System</h1>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-[1fr_1fr] gap-10">
        {/* ── LEFT COLUMN ─────────────────────────────── */}
        <div className="flex flex-col gap-10">
          {/* Color Palette */}
          <Section title="Color Palette">
            <div className="flex flex-col gap-3">
              <p className="type-card-label text-foreground-secondary">
                Backgrounds
              </p>
              <div className="grid grid-cols-3 gap-3">
                <ColorSwatch
                  label="BACKGROUND"
                  hex="#111111"
                  bg="bg-background border border-border"
                />
                <ColorSwatch label="SURFACE" hex="#1C1C1C" bg="bg-surface" />
                <ColorSwatch
                  label="SURFACE ELEVATED"
                  hex="#282828"
                  bg="bg-surface-elevated"
                />
              </div>

              <p className="type-card-label text-foreground-secondary mt-2">
                Foreground
              </p>
              <div className="grid grid-cols-3 gap-3">
                <ColorSwatch
                  label="FOREGROUND"
                  hex="#FFFFFF"
                  bg="bg-foreground"
                  text="text-background"
                />
                <ColorSwatch
                  label="SECONDARY"
                  hex="#A0A0A0"
                  bg="bg-foreground-secondary"
                  text="text-background"
                />
                <ColorSwatch
                  label="MUTED"
                  hex="#666666"
                  bg="bg-foreground-muted"
                />
              </div>

              <p className="type-card-label text-foreground-secondary mt-2">
                Accent & Status
              </p>
              <div className="grid grid-cols-3 gap-3">
                <ColorSwatch
                  label="ACCENT"
                  hex="#D4AF37"
                  bg="bg-accent"
                  text="text-background"
                />
                <ColorSwatch
                  label="POSITIVE"
                  hex="#4CAF50"
                  bg="bg-status-positive"
                  text="text-background"
                />
                <ColorSwatch
                  label="NEGATIVE"
                  hex="#F44336"
                  bg="bg-status-negative"
                  text="text-background"
                />
              </div>
            </div>
          </Section>

          {/* Typography */}
          <Section title="Typography — Space Grotesk">
            <div className="flex flex-col gap-4">
              {[
                {
                  cls: "type-large-title",
                  label: "LARGE TITLE",
                  spec: "42px · 700 · −1",
                },
                {
                  cls: "type-metric-value",
                  label: "METRIC VALUE",
                  spec: "36px · 700 · −2",
                },
                {
                  cls: "type-featured-stat",
                  label: "FEATURED STAT",
                  spec: "28px · 700",
                },
                {
                  cls: "type-card-title",
                  label: "CARD TITLE",
                  spec: "18px · 700 · UPPER",
                },
                {
                  cls: "type-body",
                  label: "Body Text",
                  spec: "13px · 500",
                },
                {
                  cls: "type-callout",
                  label: "Callout text",
                  spec: "12px · 400",
                },
              ].map(({ cls, label, spec }) => (
                <div
                  key={cls}
                  className="border-border flex items-baseline justify-between gap-4 border-b pb-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-accent h-3.5 w-0.75 shrink-0" />
                    <span className={cls}>{label}</span>
                  </div>
                  <span className="type-card-label text-foreground-muted shrink-0">
                    {spec}
                  </span>
                </div>
              ))}

              {/* Small labels row */}
              <div className="flex flex-col gap-2 pt-1">
                {[
                  {
                    cls: "type-section-label",
                    label: "SECTION LABEL",
                    spec: "11px · 600 · +2",
                  },
                  {
                    cls: "type-card-label",
                    label: "CARD LABEL",
                    spec: "10px · 500 · +1.5",
                  },
                  {
                    cls: "type-tab-label text-foreground",
                    label: "TAB LABEL",
                    spec: "9px · 500 · +0.5",
                  },
                ].map(({ cls, label, spec }) => (
                  <div
                    key={cls}
                    className="border-border flex items-center justify-between border-b pb-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-accent h-3.5 w-0.75 shrink-0" />
                      <span className={cls}>{label}</span>
                    </div>
                    <span className="type-card-label text-foreground-muted shrink-0">
                      {spec}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────── */}
        <div className="flex flex-col gap-10">
          {/* Buttons */}
          <Section title="Buttons">
            <div className="flex flex-wrap gap-3">
              <Button variant="default">
                <Plus size={14} />
                Primary
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="sm">Small</Button>
            </div>
          </Section>

          {/* Form Controls */}
          <Section title="Form Controls">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ds-input-1" className="type-card-label">
                  Input — Default
                </Label>
                <Input id="ds-input-1" placeholder="Nhập số tiền..." />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ds-input-2" className="type-card-label">
                  Input — With Value
                </Label>
                <Input id="ds-input-2" defaultValue="10.000.000 ₫" />
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="ds-check-1" />
                <Label
                  htmlFor="ds-check-1"
                  className="type-body cursor-pointer"
                >
                  Unchecked
                </Label>
                <Checkbox id="ds-check-2" defaultChecked />
                <Label
                  htmlFor="ds-check-2"
                  className="type-body cursor-pointer"
                >
                  Checked
                </Label>
              </div>
            </div>
          </Section>

          {/* Badges */}
          <Section title="Badge & Status">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col items-start gap-2">
                <p className="type-card-label">Positive</p>
                <Badge variant="positive" />
              </div>
              <div className="flex flex-col items-start gap-2">
                <p className="type-card-label">Negative</p>
                <Badge variant="negative" />
              </div>
              <div className="flex flex-col items-start gap-2">
                <p className="type-card-label">Gold</p>
                <Badge variant="gold" label="Premium" />
              </div>
              <div className="flex flex-col items-start gap-2">
                <p className="type-card-label">Gold + Label</p>
                <Badge variant="gold" label="Vàng SJC" />
              </div>
            </div>
          </Section>

          {/* Metric Cards */}
          <Section title="Metric Cards">
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Tổng Thu" value="8,420" sub="Tháng này" />
              <MetricCard label="Tổng Chi" value="7.5H" sub="7 Tuần" />
              <MetricCard label="Tiết Kiệm" value="2,340" sub="Tháng trước" />
            </div>
          </Section>

          {/* Tab Bar */}
          <Section title="Tab Bar — Pill Nav">
            <div className="flex justify-start">
              <TabBar />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
