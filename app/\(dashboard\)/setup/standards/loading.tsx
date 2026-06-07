export default function StandardsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-3">
        <div className="h-10 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-5 w-96 bg-muted rounded-lg animate-pulse" />
      </div>

      {/* Two column card skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg border p-6 bg-card space-y-4 animate-pulse"
          >
            <div className="h-6 w-40 bg-muted rounded" />
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-4 w-full bg-muted rounded" />
            ))}
            <div className="h-10 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
