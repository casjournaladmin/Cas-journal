import Link from "next/link";
import { CrawlableArticleDirectory } from "@/components/public/crawlable-article-directory";
import {
  type ArchiveIssueGroup,
  IssueArchiveExplorer,
} from "@/components/public/issue-archive-explorer";
import { Container } from "@/components/ui/container";
import { publicSubmissionEntryPath } from "@/lib/auth/submission-entry";
import { prisma } from "@/lib/db/prisma";
import { getJournalActivationMap } from "@/lib/editorial/journal-activation";

export const dynamic = "force-dynamic";

export default async function CurrentIssuePage() {
  const [publishedArticles, activationMap] = await Promise.all([
    prisma.article.findMany({
      where: {
        isPublished: true,
        issue: { isClosed: false },
      },
      orderBy: [
        { issue: { volume: { year: "desc" } } },
        { issue: { volume: { number: "desc" } } },
        { issue: { number: "desc" } },
        { issueOrder: "asc" },
        { pageStart: "asc" },
        { publishedAt: "desc" },
      ],
      include: {
        issue: {
          include: {
            volume: {
              include: {
                journal: {
                  select: {
                    name: true,
                    slug: true,
                    shortName: true,
                    department: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        authors: { orderBy: { position: "asc" } },
      },
    }),
    getJournalActivationMap(),
  ]);

  const hasActiveJournals = Object.values(activationMap).some(Boolean);

  const issueGroups: ArchiveIssueGroup[] = [];
  const issueMap = new Map<string, ArchiveIssueGroup>();

  for (const article of publishedArticles) {
    const issueId = article.issue.id;
    let group = issueMap.get(issueId);
    if (!group) {
      group = {
        issue: article.issue,
        coverImageUrl: article.coverImageUrl ?? null,
        articles: [],
      };
      issueMap.set(issueId, group);
      issueGroups.push(group);
    } else if (!group.coverImageUrl && article.coverImageUrl) {
      group.coverImageUrl = article.coverImageUrl;
    }
    group.articles.push(article);
  }

  return (
    <div className="space-y-12 pb-24">
      <header className="cas-page-hero cas-page-hero-current">
        <div className="cas-page-hero-inner">
          <div className="cas-breadcrumbs">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span>Current Issue</span>
          </div>
          <h1 className="cas-page-title">
            Current Issue &mdash; Inaugural Volume 1 (2026)
          </h1>
          <p className="cas-page-desc">
            Continuous rolling publication of peer-reviewed research papers,
            structured reviews, and case studies across CASJOURNALS.
          </p>
        </div>
      </header>

      <section>
        <Container>
          {issueGroups.length === 0 ? (
            <div className="cas-main-card cas-prose mx-auto max-w-4xl">
              <div className="cas-callout">
                <div className="cas-callout-title">
                  Continuous Rolling Publication Model
                </div>
                <p>
                  CASJOURNALS operates on a continuous rolling publication
                  model. Accepted original research papers, structured reviews,
                  and scholarly case studies are typeset, assigned Crossref
                  DOIs, and published online immediately upon final editorial
                  sign-off.
                </p>
              </div>

              <h2>
                {hasActiveJournals
                  ? "Open Call for Volume 1 (2026)"
                  : "Inaugural Volume 1 (2026) in Preparation"}
              </h2>
              {hasActiveJournals ? (
                <p>
                  Manuscript submissions are actively accepted across our
                  operational disciplinary journals:{" "}
                  <strong>
                    Existentia: Concrescence Journal of Arts and Humanities
                  </strong>
                  ,{" "}
                  <strong>
                    Concrescence Journal of Multi-Disciplinary Research
                  </strong>
                  , <strong>Izu: Journal of Critical Perspectives</strong>, and{" "}
                  <strong>The Polis: Journal of Political Studies</strong>.
                </p>
              ) : (
                <p>
                  Editorial preparations for the inaugural Volume 1 (2026) are
                  underway across CASJOURNALS. Formal manuscript submissions
                  will open shortly for our four disciplinary journals:{" "}
                  <strong>
                    Existentia: Concrescence Journal of Arts and Humanities
                  </strong>
                  ,{" "}
                  <strong>
                    Concrescence Journal of Multi-Disciplinary Research
                  </strong>
                  , <strong>Izu: Journal of Critical Perspectives</strong>, and{" "}
                  <strong>The Polis: Journal of Political Studies</strong>.
                  Authors may review the submission guidelines and checklist to
                  prepare their manuscripts in advance.
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {hasActiveJournals ? (
                  <Link
                    href={publicSubmissionEntryPath}
                    className="cas-btn-primary"
                  >
                    Submit to Current Volume
                  </Link>
                ) : (
                  <Link href="/author-guidelines" className="cas-btn-primary">
                    Review Author Guidelines
                  </Link>
                )}
                <Link href="/archives" className="cas-btn-secondary">
                  Browse Archives
                </Link>
              </div>
            </div>
          ) : (
            <>
              <IssueArchiveExplorer issueGroups={issueGroups} />
              <CrawlableArticleDirectory issueGroups={issueGroups} />
            </>
          )}
        </Container>
      </section>
    </div>
  );
}
