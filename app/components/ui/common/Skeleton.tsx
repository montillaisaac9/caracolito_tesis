import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    />
  );
}

export function UserCountSkeleton() {
  return (
    <div className="flex items-center space-x-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm h-36 flex flex-col justify-between"
        >
          <div>
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="flex items-end justify-between">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserGrowthSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-end space-x-2 h-40">
        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
          <div key={item} className="flex flex-col items-center flex-1">
            <Skeleton
              className="w-full rounded-t-sm"
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
            <Skeleton className="h-3 w-8 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}