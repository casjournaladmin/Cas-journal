import type { ArchiveIssueGroup } from "@/components/public/issue-archive-explorer";

export function CrawlableArticleDirectory({
  issueGroups,
}: {
  issueGroups: ArchiveIssueGroup[];
}) {
  if (!issueGroups || issueGroups.length === 0) {
    return null;
  }

  return (
    <>
      {/* Semantic Screen-Reader & Search Engine Crawler Directory (Rendered in initial SSR HTML) */}
      <nav
        aria-label="Academic Manuscript Directory"
        className="sr-only"
        data-crawler-index="google-scholar"
      >
        <h2>Published Academic Manuscripts and Table of Contents Directory</h2>
        {issueGroups.map((group) => {
          const journal = group.issue.volume.journal;
          const volNumber = group.issue.volume.number;
          const issueNumber = group.issue.number;
          const year = group.issue.volume.year;

          return (
            <section
              key={`crawler-issue-${group.issue.id}`}
              aria-label={`${journal.name} Vol ${volNumber} Issue ${issueNumber}`}
            >
              <h3>
                {journal.name} — Volume {volNumber}, Issue {issueNumber} ({year}
                )
              </h3>
              <ol>
                {group.articles.map((article) => (
                  <li key={`crawler-art-${article.id}`}>
                    <a href={`/articles/${article.slug}`}>{article.title}</a>
                    {article.authors && article.authors.length > 0 ? (
                      <span>
                        {" "}
                        by {article.authors.map((a) => a.fullName).join(", ")}
                      </span>
                    ) : null}
                    {article.pageStart && (
                      <span>
                        {" "}
                        (pp. {article.pageStart}
                        {article.pageEnd ? `–${article.pageEnd}` : ""})
                      </span>
                    )}
                    {article.doi && <span> — DOI: {article.doi}</span>}
                    <span>
                      {" "}
                      [
                      <a href={`/api/articles/${article.slug}/pdf`}>Full PDF</a>
                      ]
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </nav>

      {/* Non-JavaScript Fallback for Raw HTTP Crawlers & Bots */}
      <noscript>
        <div className="mx-auto my-8 max-w-4xl rounded-lg border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-300">
          <h2 className="mb-4 text-base font-bold text-white">
            Table of Contents & Archived Papers Directory
          </h2>
          <div className="space-y-6">
            {issueGroups.map((group) => (
              <div
                key={`noscript-issue-${group.issue.id}`}
                className="space-y-2"
              >
                <h3 className="font-semibold text-emerald-400">
                  {group.issue.volume.journal.name} — Vol.{" "}
                  {group.issue.volume.number}, Issue {group.issue.number} (
                  {group.issue.volume.year})
                </h3>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  {group.articles.map((article) => (
                    <li key={`noscript-art-${article.id}`}>
                      <a
                        href={`/articles/${article.slug}`}
                        className="text-white hover:underline"
                      >
                        {article.title}
                      </a>
                      {article.authors && article.authors.length > 0 ? (
                        <span className="text-slate-400">
                          {" "}
                          — {article.authors.map((a) => a.fullName).join(", ")}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </noscript>
    </>
  );
}
