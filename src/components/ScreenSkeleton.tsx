import { Skeleton } from "@/components/ui/skeleton";

export function ScreenSkeleton() {
  return <DashboardSkeleton />;
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <Skeleton className="h-9 w-36" />
      <div className="bg-surface/50 border-border border p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <Skeleton className="mt-3 h-1.5 w-full" />
        <div className="mt-2 flex justify-between">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface/50 border-border border p-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-2 w-14" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CashflowSkeleton() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <Skeleton className="h-9 w-44" />

      {/* Month selector */}
      <div className="mt-4 flex items-center justify-between px-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8" />
      </div>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface/50 border-border border p-3">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="mt-2 h-6 w-16" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-border mt-6 flex border-b">
        <Skeleton className="h-14 flex-1" />
        <Skeleton className="border-border h-14 flex-1 border-x" />
        <Skeleton className="h-14 flex-1" />
      </div>

      {/* Content area */}
      <div className="mt-5 flex flex-col gap-4">
        <div className="bg-accent/5 border-accent/20 border p-4">
          <Skeleton className="mb-2 h-3 w-32" />
          <Skeleton className="h-7 w-40" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface/50 border-border border p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GoalsSkeleton() {
  return (
    <div className="flex flex-col gap-5 pt-2 pb-20">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Banner card */}
      <div className="border-border bg-surface/50 border p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
      </div>

      {/* Goal card */}
      <div className="border-border bg-surface/50 border p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="mt-2 h-2 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>

      {/* Cashflow card */}
      <div className="border-border bg-surface/50 border p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-accent h-3.5 w-0.75" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-8 w-36" />
            </div>
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-12 pt-2 pb-20">
      <div className="flex flex-col gap-6">
        <Skeleton className="mt-4 h-9 w-36" />

        {/* Cash section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-accent h-3.5 w-0.75" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="bg-surface/50 border-border flex flex-col gap-3 border p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>

        {/* Info section */}
        <div className="border-border flex flex-col gap-4 border-b pb-12">
          <div className="flex items-center gap-3">
            <div className="bg-accent h-3.5 w-0.75" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="bg-surface/50 border-border flex flex-col gap-3 border p-5">
            <Skeleton className="h-2 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="mt-4 h-14 w-full" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-status-negative/40 h-3.5 w-0.75" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-14 w-full" />
        <div className="bg-surface/50 border-border flex flex-col gap-3 border p-5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export function AssetsSkeleton() {
  return (
    <div className="flex flex-col gap-5 pt-2 pb-20">
      <Skeleton className="h-9 w-36" />

      {/* Net worth banner */}
      <div className="bg-surface/50 border-border flex flex-col gap-2 border p-5">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-10 w-48" />
      </div>

      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface/50 border-border flex flex-col gap-3 border p-4"
          >
            <Skeleton className="h-2 w-16" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketSkeleton() {
  return (
    <div className="flex flex-col gap-6 pt-2 pb-20">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* World gold card */}
      <div className="bg-surface/50 border-border border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        </div>
      </div>

      {/* Market table */}
      <div className="bg-surface/50 border-border overflow-hidden border">
        <div className="border-border flex justify-between border-b p-4">
          <Skeleton className="h-2.5 w-24" />
          <div className="flex gap-10">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="border-border flex justify-between border-b p-4 last:border-0"
          >
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-16" />
            </div>
            <div className="flex items-start gap-10">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GoldSkeleton() {
  return (
    <div className="flex flex-col gap-5 pt-2 pb-20">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-32" />

        {/* Summary header */}
        <div className="bg-surface/50 border-border flex flex-col gap-2 border p-5">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-10 w-48" />
          <div className="mt-2 flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>

      {/* List of position cards */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface/50 border-border flex flex-col gap-3 border p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="border-border flex justify-between border-t pt-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SavingsSkeleton() {
  return (
    <div className="flex flex-col gap-5 pt-2 pb-20">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-11 w-11" />
      </div>

      {/* Summary card */}
      <div className="bg-surface/50 border-border flex flex-col gap-2 border p-4">
        <Skeleton className="h-2.5 w-28" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-3 w-40" />
      </div>

      {/* List of savings cards */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface/50 border-border flex flex-col gap-3 border p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
            </div>
            <div className="mt-1 flex items-end justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
