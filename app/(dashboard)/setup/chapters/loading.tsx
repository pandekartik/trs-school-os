export default function ChaptersLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-3">
        <div className="h-10 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-5 w-96 bg-muted rounded-lg animate-pulse" />
      </div>

      {/* Three selector row skeleton */}
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-10 bg-muted rounded-lg animate-pulse"
          />
        ))}
      </div>

      {/* Card skeleton */}
      <div className="rounded-lg border p-6 bg-card space-y-4 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded" />
        {[1, 2, 3, 4, 5].map((j) => (
          <div key={j} className="h-4 w-full bg-muted rounded" />
        ))}
      </div>
    </div>
  );
}
