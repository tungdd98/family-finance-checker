import { Skeleton } from "@/components/ui/skeleton";

export function ScreenSkeleton() {
  return (
    <div className="flex flex-col gap-5 pt-2">
      {/* Page Title Skeleton */}
      <Skeleton className="h-9 w-40" />

      {/* Goal/Summary Card Skeleton */}
      <div className="bg-surface/50 border-border border p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="bg-accent h-3.5 w-0.75 shrink-0" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
        </div>
      </div>

      {/* Portfolio Chart Skeleton */}
      <div className="bg-surface/50 border-border border p-5">
        <Skeleton className="mb-4 h-3 w-32" />
        <div className="flex items-center justify-center py-6">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      </div>

      {/* Asset List Skeletons */}
      <div className="flex flex-col gap-5">
        {[1, 2].map((i) => (
          <div key={i} className="bg-surface/50 border-border border p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="bg-accent h-3.5 w-0.75 shrink-0" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
