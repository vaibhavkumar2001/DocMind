export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-6 sm:px-8 sm:py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading...</span>

      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="mt-3 h-4 w-40 animate-pulse rounded bg-muted" />

      {/* Big block (upload box / create form) */}
      <div className="mt-8 h-40 animate-pulse rounded-2xl bg-muted" />

      {/* List rows */}
      <div className="mt-8 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </main>
  );
}