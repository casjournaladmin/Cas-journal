import { Container } from "@/components/ui/container";

export default function AnnouncementsLoading() {
  return (
    <div className="space-y-12 pb-24">
      <header className="cas-page-hero cas-page-hero-announcements">
        <div className="cas-page-hero-inner">
          <div className="h-4 w-48 animate-pulse rounded bg-sky-200/20" />
          <div className="mt-3 h-10 w-80 animate-pulse rounded bg-sky-200/30" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded bg-sky-200/20" />
        </div>
      </header>

      <Container>
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Skeleton Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto border-b border-[color:var(--color-border)] pb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-7 w-24 animate-pulse rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]"
              />
            ))}
          </div>

          {/* Skeleton Call Banner */}
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 sm:p-8">
            <div className="h-4 w-40 animate-pulse rounded bg-sky-500/20" />
            <div className="mt-3 h-7 w-72 animate-pulse rounded bg-[color:var(--color-muted)]/20" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-[color:var(--color-muted)]/10" />
          </div>

          {/* Skeleton Announcement Cards */}
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-sm sm:p-7"
              >
                <div className="flex items-center justify-between border-b border-[color:var(--color-border)] pb-3">
                  <div className="h-4 w-36 animate-pulse rounded bg-[color:var(--color-muted)]/20" />
                  <div className="h-4 w-24 animate-pulse rounded bg-[color:var(--color-muted)]/20" />
                </div>
                <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-[color:var(--color-muted)]/20" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-[color:var(--color-muted)]/10" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-[color:var(--color-muted)]/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
