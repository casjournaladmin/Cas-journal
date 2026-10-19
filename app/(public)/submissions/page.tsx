import type { Metadata } from "next";
import Link from "next/link";
import { publicSubmissionEntryPath } from "@/lib/auth/submission-entry";
import { activeJournalsConfig } from "@/lib/config/site";
import { getJournalActivationMap } from "@/lib/editorial/journal-activation";

export const metadata: Metadata = {
  title: "Submit Your Paper | CAS Journals",
  description:
    "Online manuscript submission portal, preparation checklist, and transparent open-access publication policies for CAS Journals.",
};

export default async function SubmissionsPage() {
  const activationMap = await getJournalActivationMap();
  const hasActiveJournals = Object.values(activationMap).some(Boolean);
  return (
    <div>
      <header className="cas-page-hero">
        <div className="cas-page-hero-inner">
          <div className="cas-breadcrumbs">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span>Submit Your Paper</span>
          </div>
          <h1 className="cas-page-title">Submit Your Paper</h1>
          <p className="cas-page-desc">
            Online manuscript submission portal for CAS Journals. Initial
            submission is completely free with zero upfront review fee.
          </p>
        </div>
      </header>

      <main className="cas-content-section">
        <div className="cas-layout-with-sidebar">
          <div className="cas-sidebar">
            <div className="cas-sidebar-title">Author Resources</div>
            <ul className="cas-sidebar-menu">
              <li>
                <Link href="/author-guidelines">Author Guidelines</Link>
              </li>
              <li>
                <Link href="/how-to-write">How to Write a Journal Paper</Link>
              </li>
              <li>
                <Link href="/submissions" className="active">
                  Submit Your Paper
                </Link>
              </li>
              <li>
                <Link href="/announcements">Call for Papers</Link>
              </li>
              <li>
                <Link href="/processing-charges">
                  Article Processing Charges
                </Link>
              </li>
              <li>
                <Link href="/withdrawal-correction">
                  Article Withdrawal &amp; Correction
                </Link>
              </li>
              <li>
                <Link href="/copyright-form">Copyright Form</Link>
              </li>
              <li>
                <Link href="/apply-reviewer">Become a Reviewer</Link>
              </li>
              <li>
                <Link href="/editorial-board">Join our Editorial Team</Link>
              </li>
            </ul>
          </div>

          <div className="cas-main-card cas-prose">
            <div className="mb-7 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
              <strong>✓ Free Submission — Zero Upfront Charge:</strong>{" "}
              Submitting your manuscript for peer review is completely free. The
              Article Processing Charge (₦30,000 for Nigerian authors / US $90
              for foreign authors) is payable{" "}
              <strong>only after formal acceptance</strong>.
            </div>

            <h2>Submit your article.</h2>
            <p>
              Sign in with your Google account to access the Author Workspace,
              select your target CAS journal, upload your anonymised manuscript
              and cover page, and track your peer review progress in real time:{" "}
              <strong>Start submission request</strong>, upload your manuscript,
              and <strong>Receive your tracking ID</strong> from the editorial
              secretariat.
            </p>

            {!hasActiveJournals ? (
              <div className="my-6 rounded-xl border border-sky-300 bg-sky-50/80 p-4 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
                <strong className="font-semibold text-[#032b45] dark:text-sky-200">
                  Standby Notice:
                </strong>{" "}
                Direct manuscript submissions for Volume 1 (2026) are scheduled
                to open shortly across all four journals. Authors may review the
                pre-submission checklist below and format their papers ahead of
                time.
              </div>
            ) : null}

            <div className="not-prose my-6 flex flex-wrap gap-4">
              <Link
                href={publicSubmissionEntryPath}
                className="cas-btn-primary"
              >
                Continue to Author Submission Portal →
              </Link>
              <Link href="/login" className="cas-btn-secondary">
                Sign In to Track Existing Submission
              </Link>
            </div>

            <h2>Select Your Target Journal</h2>
            <div className="not-prose my-4 space-y-3">
              {activeJournalsConfig.map((j) => {
                const isActive = Boolean(activationMap[j.slug]);
                return (
                  <div
                    key={j.slug}
                    className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-sky-50/40 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#032b45]">
                          {j.name}
                        </h3>
                        <span className="rounded bg-sky-100 px-2 py-0.5 font-mono text-[10px] font-bold text-[#0284c7]">
                          {j.shortName}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#5c6c7c]">
                        {j.description}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isActive ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
                          Accepting Submissions
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-600/20 ring-inset">
                          Standby (Opening Soon)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <h2>Pre-Submission Checklist</h2>
            <ul>
              <li>
                The manuscript is original, has not been previously published,
                and is not under simultaneous consideration elsewhere.
              </li>
              <li>
                The main manuscript file is prepared in Microsoft Word (
                <code>.doc</code> or <code>.docx</code>) or PDF and anonymised
                for double-blind peer review.
              </li>
              <li>
                An abstract of 150&ndash;250 words with 4&ndash;6 keywords is
                included.
              </li>
              <li>
                All references are consistently formatted according to APA (7th
                Edition), MLA, Chicago, or Harvard style.
              </li>
              <li>
                Any funding sources, ethical approvals, or competing interests
                are declared.
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
