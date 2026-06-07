export default function BuilderLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-3">
        <div className="h-10 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-5 w-96 bg-muted rounded-lg animate-pulse" />
      </div>

      {/* Pill selectors skeleton */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 w-32 bg-muted rounded-full animate-pulse"
          />
        ))}
      </div>

      {/* Grid skeleton (9 rows x 6 columns) */}
      <div className="overflow-x-auto">
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(6, minmax(100px, 1fr))" }}>
          {[...Array(54)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-muted rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
