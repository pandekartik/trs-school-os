export default function TeacherLoading() {
  return (
    <div className="space-y-6">
      {/* Top bar skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
          <div className="h-5 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-20 bg-muted rounded-lg animate-pulse" />
        <div className="h-9 w-56 bg-muted rounded-lg animate-pulse" />
      </div>

      {/* 5 column week grid skeleton with 3 card shapes per column */}
      <div className="grid grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((day) => (
          <div key={day} className="flex flex-col gap-3">
            {/* Day header */}
            <div className="h-16 bg-muted rounded-lg animate-pulse" />

            {/* Period cards */}
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="rounded-lg border p-3 bg-muted animate-pulse space-y-2"
              >
                <div className="h-4 w-20 bg-background rounded" />
                <div className="h-4 w-full bg-background rounded" />
                <div className="h-3 w-16 bg-background rounded" />
                <div className="h-8 w-full bg-background rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
