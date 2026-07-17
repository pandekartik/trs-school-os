export default function ActivityLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-3">
        <div className="h-10 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-5 w-96 bg-muted rounded-lg animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 w-32 bg-muted rounded-lg animate-pulse"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-12 w-full bg-muted rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
