import Link from "next/link";
import { DirectArticleSubmissionForm } from "@/components/submissions/direct-submission-form";
import { requireApplicationArea } from "@/lib/auth/authorization";
import { getActiveDepartmentJournals } from "@/lib/requests/data";
import { getJournalActivationMap } from "@/lib/editorial/journal-activation";

export default async function NewDirectSubmissionPage({
  searchParams,
}: {
  searchParams?: Promise<{ journal?: string }>;
}) {
  const user = await requireApplicationArea("author");
  const params = searchParams ? await searchParams : undefined;
  const targetJournalSlug = params?.journal ?? "";

  const [journals, activationMap] = await Promise.all([
    getActiveDepartmentJournals(),
    getJournalActivationMap(),
  ]);

  const activeJournals = journals.filter((j) => Boolean(activationMap[j.slug]));

  if (activeJournals.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link
            href="/author"
            className="text-xs font-semibold text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
          >
            ← Back to Author Workspace
          </Link>
          <header className="mt-6 border-b border-[color:var(--color-border)] pb-6">
            <p className="text-xs font-semibold tracking-[0.12em] text-[color:var(--color-accent)] uppercase">
              Author Direct Submission
            </p>
            <h1 className="mt-3 font-serif text-3xl font-medium tracking-[-0.035em] text-[color:var(--color-foreground)] sm:text-4xl">
              Submissions Standby
            </h1>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
              Inaugural Volume 1 (2026) in Preparation.
            </p>
          </header>
        </div>

        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0284c7]">
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[color:var(--color-foreground)]">
                Journal Submission Portals Opening Soon
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-muted)]">
                The editorial secretariat is currently completing operational
                onboarding and roster validation for our four disciplinary
                journals:
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs text-[color:var(--color-foreground)]">
                <li>
                  <strong>Existentia</strong>: Concrescence Journal of Arts and
                  Humanities
                </li>
                <li>
                  <strong>CJMR</strong>: Concrescence Journal of
                  Multi-Disciplinary Research
                </li>
                <li>
                  <strong>Izu</strong>: Journal of Critical Perspectives
                </li>
                <li>
                  <strong>The Polis</strong>: Journal of Political Studies
                </li>
              </ul>
              <p className="mt-4 text-xs text-[color:var(--color-muted)]">
                Direct online manuscript submission will be enabled as soon as
                the respective journal portals complete administrative
                activation. In the meantime, please ensure your manuscript is
                prepared in accordance with our Author Guidelines.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/author-guidelines"
                  className="rounded-xl bg-[#032b45] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#075985]"
                >
                  Review Author Guidelines
                </Link>
                <Link
                  href="/author"
                  className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-xs font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-strong)]"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/author"
          className="text-xs font-semibold text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
        >
          ← Back to Author Workspace
        </Link>

        <header className="mt-6 border-b border-[color:var(--color-border)] pb-6">
          <p className="text-xs font-semibold tracking-[0.12em] text-[color:var(--color-accent)] uppercase">
            Author Direct Submission
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-[-0.035em] text-[color:var(--color-foreground)] sm:text-4xl">
            Submit an Article
          </h1>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
            Complete the 1-page submission form below to submit your manuscript
            directly to the CAS Journals editorial secretariat.
          </p>
        </header>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 sm:p-8">
        <DirectArticleSubmissionForm
          journals={activeJournals}
          defaultJournalSlug={targetJournalSlug}
          initialAuthorName={user.displayName ?? ""}
          initialAuthorEmail={user.email ?? ""}
        />
      </div>
    </div>
  );
}
