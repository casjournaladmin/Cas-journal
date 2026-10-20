import type { Metadata } from "next";
import Link from "next/link";
import { ReviewerApplicationForm } from "@/components/public/reviewer-application-form";
import { getCurrentUser } from "@/lib/auth/authorization";
import { activeJournalsConfig } from "@/lib/config/site";
import { prisma } from "@/lib/db/prisma";
import { getJournalOrderPriority } from "@/lib/editorial/editorial-board-data";

export const metadata: Metadata = {
  title: "Become a Reviewer | CAS Journals",
  description:
    "Application portal for qualified scholars to serve as independent peer reviewers across CAS Journals.",
};

export default async function ApplyReviewerPage({
  searchParams,
}: {
  searchParams: Promise<{ journal?: string }>;
}) {
  const [{ journal }, user, dbJournals] = await Promise.all([
    searchParams,
    getCurrentUser(),
    prisma.journal.findMany({
      where: { isActive: true },
      select: { slug: true, name: true, shortName: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const journalOptions =
    dbJournals.length > 0
      ? dbJournals.sort(
          (a, b) =>
            getJournalOrderPriority(a.slug) - getJournalOrderPriority(b.slug),
        )
      : activeJournalsConfig.map((j) => ({
          slug: j.slug,
          name: j.name,
          shortName: j.shortName,
        }));

  return (
    <div>
      <header className="cas-page-hero cas-page-hero-reviewer">
        <div className="cas-page-hero-inner">
          <div className="cas-breadcrumbs">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span>Become a Reviewer</span>
          </div>
          <h1 className="cas-page-title">Become a Reviewer</h1>
          <p className="cas-page-desc">
            Application portal for qualified scholars to serve as independent
            peer reviewers.
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
                <Link href="/submit">Submit Your Paper</Link>
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
                <Link href="/apply-reviewer" className="active">
                  Become a Reviewer
                </Link>
              </li>
              <li>
                <Link href="/editorial-board">Join our Editorial Team</Link>
              </li>
            </ul>
          </div>

          <div className="cas-main-card cas-prose space-y-8">
            <div>
              <p
                className="cas-lead"
                style={{
                  fontSize: "16px",
                  color: "#075985",
                  fontWeight: 500,
                  marginBottom: "24px",
                }}
              >
                We welcome qualified scholars and subject specialists who would
                like to serve as peer reviewers across our disciplinary
                journals.
              </p>

              <h2>The Role of a Reviewer</h2>
              <p>
                Reviewers play an essential role in upholding the quality,
                credibility, and integrity of the work we publish. For an
                overview of what the role involves and how our review process
                works, please see our{" "}
                <Link
                  href="/peer-review-policy"
                  style={{ color: "#0284c7", textDecoration: "underline" }}
                >
                  Peer Review Policy
                </Link>
                .
              </p>

              <h2>Reviewer Qualifications &amp; Commitments</h2>
              <ul>
                <li>
                  Hold a doctoral degree (Ph.D.) or equivalent advanced research
                  credentials in a relevant discipline.
                </li>
                <li>
                  Possess an active publication record in peer-reviewed
                  scholarly journals.
                </li>
                <li>
                  Commit to conducting rigorous, objective, and constructive
                  evaluations within the agreed 4&ndash;8 week review window.
                </li>
                <li>
                  Strictly maintain absolute confidentiality regarding all
                  unpublished manuscripts and data.
                </li>
                <li>
                  Promptly declare any potential competing interests or
                  institutional conflicts of interest.
                </li>
              </ul>
            </div>

            <div className="not-prose pt-2">
              <ReviewerApplicationForm
                defaultJournal={journal || "ALL"}
                initialFullName={user?.displayName ?? ""}
                initialEmail={user?.email ?? ""}
                applicantUserId={user?.id}
                journals={journalOptions}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
