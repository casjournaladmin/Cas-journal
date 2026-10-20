export default function AdminLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading admin workspace"
      className="flex min-h-screen bg-[color:var(--color-app-background)]"
    >
      {/* ── Sidebar Skeleton ── */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:flex">
        {/* Brand header skeleton (h-16) */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[color:var(--color-border)] px-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-[var(--radius-sm)] bg-[#0284c7]/20" />
            <div className="h-4 w-24 rounded bg-[color:var(--color-surface-strong)]" />
          </div>
          <div className="size-8 rounded bg-[color:var(--color-surface-strong)]" />
        </div>
        {/* Navigation items skeleton */}
        <div className="flex-1 space-y-2 px-3 py-4">
          <div className="h-3 w-28 rounded bg-[color:var(--color-surface-strong)] px-3" />
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-9 w-full rounded-[var(--radius-md)] bg-[color:var(--color-surface-strong)]/60"
            />
          ))}
        </div>
      </aside>

      {/* ── Main Layout Column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header skeleton (h-16) */}
        <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 rounded bg-[color:var(--color-surface-strong)]" />
            <span className="text-[color:var(--color-border-strong)]">/</span>
            <div className="h-4 w-16 rounded bg-[color:var(--color-surface-strong)]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-[color:var(--color-surface-strong)]" />
            <div className="size-9 rounded-full bg-[color:var(--color-surface-strong)]" />
          </div>
        </div>

        {/* Content Skeleton */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="space-y-2">
              <div className="h-3 w-36 rounded bg-[color:var(--color-surface-strong)]" />
              <div className="h-8 w-48 rounded bg-[color:var(--color-surface-strong)]" />
              <div className="h-4 w-72 rounded bg-[color:var(--color-surface-strong)]" />
            </div>

            {/* Three metric cards skeleton */}
            <div className="space-y-3">
              <div className="h-5 w-40 rounded bg-[color:var(--color-surface-strong)]" />
              <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="h-32 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]"
                  />
                ))}
              </div>
            </div>

            {/* Four journal rows skeleton */}
            <div className="space-y-3">
              <div className="h-5 w-48 rounded bg-[color:var(--color-surface-strong)]" />
              <div className="divide-y divide-[color:var(--color-border)] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex items-center gap-4 p-5">
                    <div className="size-14 rounded-[var(--radius-md)] bg-[color:var(--color-surface-strong)] sm:size-16" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 rounded bg-[color:var(--color-surface-strong)]" />
                      <div className="h-3 w-1/4 rounded bg-[color:var(--color-surface-strong)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
