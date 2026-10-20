import Link from "next/link";

import { requireJournalWorkspace } from "@/lib/auth/workspace-context";
import { listEditorAssignments } from "@/lib/editorial/data";

const date = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function JournalEditorPage({
  params,
}: {
  params: Promise<{ journalSlug: string }>;
}) {
  const { journalSlug } = await params;
  const { user, journal } = await requireJournalWorkspace(
    "EDITOR",
    journalSlug,
  );
  const assignments = await listEditorAssignments(journal.id, user.id);
  return (
    <div className="mx-auto max-w-5xl">
      <div className="border-b border-[color:var(--color-border)] pb-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-[color:var(--color-accent)] uppercase">
          Blinded peer review
        </p>
        <h1 className="mt-3 font-serif text-4xl font-medium tracking-[-0.035em] sm:text-5xl">
          Review assignments
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-muted)]">
          Manuscripts are shown without author, uploader, or original-file
          identity.
        </p>
      </div>
      <div className="mt-7 overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]">
        {assignments.length ? (
          <ol className="divide-y divide-[color:var(--color-border)]">
            {assignments.map((assignment) => (
              <li key={assignment.id}>
                <Link
                  href={`/editor/${journal.slug}/assignments/${assignment.id}`}
                  className="grid gap-4 p-5 hover:bg-[color:var(--color-surface)] sm:grid-cols-[minmax(0,1fr)_10rem_8rem] sm:items-center sm:p-6"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-[0.08em] text-[color:var(--color-accent)] uppercase">
                      Round {assignment.reviewRound.roundNumber}
                    </p>
                    <h2 className="mt-2 truncate text-sm font-semibold">
                      {assignment.reviewRound.submission.title ??
                        "Untitled manuscript"}
                    </h2>
                    <p className="mt-1 font-mono text-[11px] text-[color:var(--color-subtle)]">
                      {assignment.reviewRound.submission.trackingNumber}
                    </p>
                  </div>
                  <p className="text-xs font-semibold capitalize">
                    {assignment.status.toLowerCase().replaceAll("_", " ")}
                  </p>
                  <p className="text-xs text-[color:var(--color-subtle)] sm:text-right">
                    {assignment.dueAt
                      ? `Due ${date.format(assignment.dueAt)}`
                      : "No due date"}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <div className="px-6 py-14 text-center sm:px-12 sm:py-16">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <span className="mt-4 inline-block rounded-full bg-[color:var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--color-accent)]">
              Editor Account Active · {journal.shortName ?? journal.name}
            </span>
            <h2 className="mt-3 font-serif text-xl font-medium tracking-tight text-[color:var(--color-foreground)] sm:text-2xl">
              No Active Review Assignments
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[color:var(--color-muted)]">
              You are an authorized Editor for {journal.name}. When manuscripts
              are assigned to you for blinded peer review, they will appear
              here.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/editor/${journal.slug}/chat`}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs font-semibold text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
              >
                <span>💬 Open Team Chat</span>
              </Link>
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs font-semibold text-[color:var(--color-muted)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-foreground)]"
              >
                <span>Account & Permissions</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
