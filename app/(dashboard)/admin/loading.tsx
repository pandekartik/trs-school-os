export default function AdminLoading() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton */}
      <div className="space-y-3">
        <div className="h-10 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-5 w-96 bg-muted rounded-lg animate-pulse" />
      </div>

      {/* 4 stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-lg border bg-card animate-pulse space-y-3"
          >
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted rounded" />
            <div className="h-3 w-32 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg border p-6 bg-card space-y-4"
          >
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-4 w-full bg-muted rounded animate-pulse" />
            ))}
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
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
