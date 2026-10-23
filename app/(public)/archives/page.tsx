import Link from "next/link";
import { JournalNavigation } from "@/components/journal/journal-navigation";
import { PublicSearchBar } from "@/components/public-search-bar";
import { CrawlableArticleDirectory } from "@/components/public/crawlable-article-directory";
import { IssueArchiveExplorer } from "@/components/public/issue-archive-explorer";
import { Container } from "@/components/ui/container";
import { activeJournalsConfig } from "@/lib/config/site";
import { prisma } from "@/lib/db/prisma";
import {
  CANONICAL_JOURNAL_ORDER,
  getJournalDbSlugs,
  getJournalOrderPriority,
  resolveCanonicalJournalSlug,
} from "@/lib/editorial/editorial-board-data";

export const dynamic = "force-dynamic";

type CatalogJournalItem = {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  department: { name: string } | null;
};

export default async function ArchivesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; journal?: string; status?: string }>;
}) {
  const { q, journal, status } = await searchParams;
  const trimmedQ = q?.trim() || "";
  const isSearchMode = trimmedQ.length > 0;

  const allActiveJournalsPromise = prisma.journal.findMany({
    where: {
      isActive: true,
      slug: { in: [...CANONICAL_JOURNAL_ORDER] },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      shortName: true,
      department: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  const canonical = journal ? resolveCanonicalJournalSlug(journal) : null;
  const dbSlugs = canonical ? getJournalDbSlugs(canonical) : null;

  const articlesPromise = prisma.article.findMany({
    where: {
      isPublished: true,
      ...(dbSlugs
        ? { issue: { volume: { journal: { slug: { in: dbSlugs } } } } }
        : {}),
      ...(isSearchMode
        ? {
            OR: [
              { title: { contains: trimmedQ, mode: "insensitive" as const } },
              {
                abstract: {
                  contains: trimmedQ,
                  mode: "insensitive" as const,
                },
              },
              { doi: { contains: trimmedQ, mode: "insensitive" as const } },
              {
                authors: {
                  some: {
                    fullName: {
                      contains: trimmedQ,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: isSearchMode
      ? [{ publishedAt: "desc" }, { title: "asc" }]
      : [
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
  });

  const allActiveJournals = await allActiveJournalsPromise;
  const articles = await articlesPromise;

  const catalogJournals: CatalogJournalItem[] =
    allActiveJournals.length > 0
      ? allActiveJournals.sort(
          (a: CatalogJournalItem, b: CatalogJournalItem) => {
            const diff =
              getJournalOrderPriority(a.slug) - getJournalOrderPriority(b.slug);
            if (diff !== 0) return diff;
            return a.name.localeCompare(b.name);
          },
        )
      : activeJournalsConfig.map((j): CatalogJournalItem => ({
          id: j.slug,
          name: j.name,
          slug: j.slug,
          shortName: j.shortName,
          department: { name: j.badge },
        }));

  const activeJournalObj = catalogJournals.find((j) => j.slug === journal);

  type PublishedArticle = (typeof articles)[0];
  type IssueGroup = {
    issue: PublishedArticle["issue"];
    coverImageUrl: string | null;
    articles: PublishedArticle[];
  };

  const issueGroups: IssueGroup[] = [];
  const issueMap = new Map<string, IssueGroup>();

  if (!isSearchMode) {
    for (const article of articles) {
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
  }

  return (
    <div className="space-y-12 pb-24">
      {/* CAS Page Hero */}
      <header className="cas-page-hero cas-page-hero-archive">
        <div className="cas-page-hero-inner">
          <div className="cas-breadcrumbs">
            <Link href="/">Home</Link>
            {activeJournalObj ? (
              <>
                <span className="sep">/</span>
                <Link href={`/journals/${activeJournalObj.slug}`}>
                  {activeJournalObj.shortName || activeJournalObj.name}
                </Link>
              </>
            ) : null}
            <span className="sep">/</span>
            <span>Archive</span>
          </div>
          <h1 className="cas-page-title">
            {activeJournalObj ? activeJournalObj.name : "Journal Archives"}
          </h1>
          <p className="cas-page-desc">
            {activeJournalObj
              ? `Published volumes, issues, and full-text articles for ${activeJournalObj.name} (${activeJournalObj.shortName}).`
              : "Past volumes, published issues, and full-text open-access repository across CASJOURNALS."}
          </p>
        </div>
      </header>

      {canonical ? (
        <JournalNavigation
          journalSlug={canonical}
          shortName={activeJournalObj?.shortName || canonical.toUpperCase()}
        />
      ) : null}

      {/* Search & Filter Ribbon */}
      <section>
        <Container className="space-y-6">
          <div className="mx-auto max-w-xl">
            <PublicSearchBar />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto border-b border-[color:var(--color-border)] pb-4">
            <Link
              href={
                trimmedQ
                  ? `/archives?q=${encodeURIComponent(trimmedQ)}`
                  : "/archives"
              }
              className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                !journal
                  ? "bg-[color:var(--color-accent)] text-white"
                  : "border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
              }`}
            >
              All Journals
            </Link>
            {catalogJournals.map((j: CatalogJournalItem) => {
              const href = trimmedQ
                ? `/archives?journal=${j.slug}&q=${encodeURIComponent(trimmedQ)}`
                : `/archives?journal=${j.slug}`;
              return (
                <Link
                  key={j.id}
                  href={href}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                    journal === j.slug
                      ? "bg-[color:var(--color-accent)] text-white"
                      : "border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                  }`}
                >
                  {j.shortName || j.name}
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Content Section */}
      <section>
        <Container>
          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-12 text-center">
              <span className="inline-block rounded-full bg-sky-500/10 px-3 py-1 font-mono text-xs font-semibold text-[#0284c7]">
                {isSearchMode
                  ? "No Search Matches"
                  : status === "upcoming" || activeJournalObj
                    ? "Volume 1 (2026) in Preparation"
                    : "Inaugural Archive Repository"}
              </span>
              <h3 className="mt-4 font-serif text-xl font-semibold text-[color:var(--color-foreground)]">
                {isSearchMode
                  ? `No articles found matching "${trimmedQ}"`
                  : activeJournalObj
                    ? `Articles for the inaugural volume of ${activeJournalObj.name} are currently under editorial review.`
                    : "The CASJOURNALS archive repository will populate as Volume 1 issues are published."}
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-xs text-[color:var(--color-muted)]">
                {isSearchMode
                  ? "Try searching with different keywords, author names, or title phrases."
                  : "All published papers are preserved with permanent Crossref DOIs, downloadable PDFs, and full bibliographic metadata under CC-BY 4.0."}
              </p>
              <div className="mt-6 flex justify-center gap-4">
                {(journal || isSearchMode) && (
                  <Link
                    href="/archives"
                    className="button-secondary inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold"
                  >
                    Clear Filters &amp; Show All
                  </Link>
                )}
                <Link
                  href="/submit"
                  className="button-primary inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold"
                >
                  Submit Your Paper →
                </Link>
              </div>
            </div>
          ) : isSearchMode ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 border-b border-[color:var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-mono text-xs text-[color:var(--color-subtle)]">
                  Showing{" "}
                  <span className="font-bold text-[color:var(--color-accent)]">
                    {articles.length}
                  </span>{" "}
                  matching {articles.length === 1 ? "article" : "articles"} for
                  &ldquo;
                  <span className="text-[color:var(--color-foreground)]">
                    {trimmedQ}
                  </span>
                  &rdquo;
                </div>
                <Link
                  href={journal ? `/archives?journal=${journal}` : "/archives"}
                  className="button-secondary inline-flex items-center gap-1.5 self-start px-3 py-1.5 text-xs font-semibold sm:self-auto"
                >
                  <span>✕</span>
                  <span>Clear Search &amp; Browse Issue Shelf</span>
                </Link>
              </div>

              {articles.map((article: PublishedArticle) => (
                <article
                  key={article.id}
                  className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 transition hover:border-[color:var(--color-accent)]"
                >
                  <div className="grid gap-6 md:grid-cols-[160px_1fr]">
                    {article.coverImageUrl ? (
                      <Link
                        href={`/articles/${article.slug}`}
                        className="flex h-44 w-full items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-black/40 p-2 md:w-[160px]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={article.coverImageUrl}
                          alt={article.title}
                          className="max-h-40 w-auto object-contain transition-transform duration-300 hover:scale-105"
                        />
                      </Link>
                    ) : null}
                    <div>
                      <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[color:var(--color-accent)] uppercase">
                        <span>{article.issue.volume.journal.name}</span>
                        <span>·</span>
                        <span>
                          Vol. {article.issue.volume.number}, Issue{" "}
                          {article.issue.number} ({article.issue.volume.year})
                        </span>
                      </div>
                      <h2 className="mt-2 font-serif text-xl font-semibold text-[color:var(--color-foreground)]">
                        <Link
                          href={`/articles/${article.slug}`}
                          className="hover:text-[color:var(--color-accent)]"
                        >
                          {article.title}
                        </Link>
                      </h2>
                      {article.authors.length ? (
                        <p className="mt-2 font-mono text-xs text-[color:var(--color-subtle)]">
                          Authors:{" "}
                          {article.authors
                            .map((a: { fullName: string }) => a.fullName)
                            .join(", ")}
                        </p>
                      ) : null}
                      {article.doi ? (
                        <p className="mt-2 font-mono text-xs text-[color:var(--color-accent)]">
                          DOI: https://doi.org/{article.doi}
                        </p>
                      ) : null}
                      {article.abstract ? (
                        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-[color:var(--color-muted)]">
                          {article.abstract}
                        </p>
                      ) : null}
                      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium">
                        <Link
                          href={`/articles/${article.slug}`}
                          className="button-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
                        >
                          <span>Read Full Article</span>
                          <span>→</span>
                        </Link>
                        <a
                          href={`/api/articles/${article.slug}/pdf`}
                          download
                          className="button-secondary inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold"
                        >
                          <span>Download PDF</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
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
