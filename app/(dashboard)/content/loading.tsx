export default function ContentLoading() {
  return (
    <div className="flex gap-6 h-full">
      {/* Left panel with list items */}
      <div className="w-64 shrink-0 rounded-lg border bg-card p-4 space-y-3">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-10 w-full bg-muted rounded animate-pulse"
          />
        ))}
      </div>

      {/* Right panel empty */}
      <div className="flex-1 rounded-lg border bg-card p-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded mb-4" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-4 w-full bg-muted rounded mb-3"
          />
        ))}
      </div>
    </div>
  );
}
