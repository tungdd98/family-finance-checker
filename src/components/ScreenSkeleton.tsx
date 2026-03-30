import { Skeleton } from "@/components/ui/skeleton";

export function ScreenSkeleton() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Page title */}
      <Skeleton className="h-9 w-36" />

      {/* Hero card */}
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

      {/* 2×2 tile grid */}
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
