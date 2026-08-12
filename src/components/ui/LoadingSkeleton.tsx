import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-slate-200 dark:bg-slate-700 rounded-lg",
        animate && "animate-pulse",
        className
      )}
    />
  );
}

export function WorkerCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <div className="flex gap-1">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-8 rounded" />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
      </div>

      <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>

      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 flex-1 rounded" />
        <Skeleton className="h-8 flex-1 rounded" />
        <Skeleton className="h-8 flex-1 rounded" />
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-pulse">
      <Skeleton className="h-40 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function WorkerProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <Skeleton className="h-64 w-full rounded-3xl" />

      <div className="flex items-start gap-6">
        <Skeleton className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl flex-shrink-0" />

        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-6 w-32 rounded" />
          <div className="flex gap-4">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-5 w-28 rounded" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-32 rounded" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
