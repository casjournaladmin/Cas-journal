import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";
import { prisma } from "@/lib/db/prisma";
import {
  buildJournalMetadataFromRecord,
  getJournalDbSlugs,
  getJournalMetadata,
  type JournalMetadata,
  resolveCanonicalJournalSlug,
} from "@/lib/editorial/editorial-board-data";
import { getJournalEditorialBoard } from "@/lib/editorial/editorial-board-store";
import { isJournalActivated } from "@/lib/editorial/journal-activation";

export const dynamic = "force-dynamic";

async function resolvePublicJournalPageData(
  journalSlug: string,
): Promise<{ meta: JournalMetadata; isSubmissionOpen: boolean } | null> {
  const canonical = resolveCanonicalJournalSlug(journalSlug);
  if (!canonical) return null;

  const [journal, isActivated] = await Promise.all([
    prisma.journal.findFirst({
      where: {
        slug: canonical,
        isActive: true,
      },
      include: {
        department: {
          select: { id: true, name: true, slug: true, isActive: true },
        },
      },
    }),
    isJournalActivated(canonical),
  ]);

  if (journal) {
    if (journal.department && !journal.department.isActive) {
      return null;
    }
    return {
      meta: buildJournalMetadataFromRecord(journal),
      isSubmissionOpen: isActivated,
    };
  }

  const fallbackMeta = getJournalMetadata(canonical);
  if (!fallbackMeta) return null;

  return {
    meta: fallbackMeta,
    isSubmissionOpen: isActivated,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ journalSlug: string }>;
}): Promise<Metadata> {
  const { journalSlug } = await params;
  const resolved = await resolvePublicJournalPageData(journalSlug);
  if (!resolved) return { title: "Journal Not Found" };

  const { meta } = resolved;
  return {
    title: `${meta.title} (${meta.shortName}) | ${siteConfig.name}`,
    description: meta.aimsAndScope || undefined,
    alternates: {
      canonical: `/journals/${meta.slug}`,
    },
  };
}

export default async function JournalLandingPage({
  params,
}: {
  params: Promise<{ journalSlug: string }>;
}) {
  const { journalSlug } = await params;
  const resolved = await resolvePublicJournalPageData(journalSlug);

  if (!resolved) {
    notFound();
  }

  const { meta, isSubmissionOpen } = resolved;
  const dbSlugs = getJournalDbSlugs(meta.slug);

  const [boardMembers, publishedArticles, journalVolumes] = await Promise.all([
    getJournalEditorialBoard(meta.slug),
    prisma.article.findMany({
      where: {
        isPublished: true,
        issue: {
          volume: {
            journal: {
              slug: { in: dbSlugs },
            },
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: {
        issue: {
          include: {
            volume: true,
          },
        },
        authors: { orderBy: { position: "asc" } },
      },
    }),
    prisma.volume.findMany({
      where: {
        journal: {
          slug: { in: dbSlugs },
        },
      },
      orderBy: [{ year: "desc" }, { number: "desc" }],
      include: {
        issues: {
          where: { isPublished: true },
          orderBy: { number: "desc" },
          include: {
            _count: { select: { articles: { where: { isPublished: true } } } },
          },
        },
      },
    }),
  ]);

  const chiefEditor = boardMembers.find(
    (m) => m.category === "CHIEF_EDITOR" || m.category === "EDITOR_IN_CHIEF",
  );
  const deputyEditor = boardMembers.find((m) => m.category === "DEPUTY_EDITOR");
  const managingEditor = boardMembers.find(
    (m) => m.category === "MANAGING_EDITOR",
  );
  const associateEditors = boardMembers.filter(
    (m) => m.category === "ASSOCIATE_EDITOR",
  );
  const boardMemberList = boardMembers.filter(
    (m) => m.category === "BOARD_MEMBER",
  );
  const consultingEditors = boardMembers.filter(
    (m) => m.category === "CONSULTING_EDITOR",
  );
  const advisoryBoard = boardMembers.filter(
    (m) => m.category === "ADVISORY_BOARD",
  );

  const submissionHref = `/author/submissions/new?journal=${meta.slug}`;
  const institutionalAffiliation = [meta.faculty, meta.institution]
    .filter((value) => Boolean(value && value.trim()))
    .join(", ");

  return (
    <div className="space-y-16 pb-24">
      {/* ── CAS HERO BANNER ── */}
      <section className="cas-page-hero">
        <div className="cas-page-hero-inner">
          <span className="cas-hero-eyebrow">
            {meta.shortName}
            {meta.department ? ` · ${meta.department}` : ""}
          </span>
          <h1 className="cas-page-title">{meta.title}</h1>
          {institutionalAffiliation ? (
            <p className="cas-page-subtitle">{institutionalAffiliation}</p>
          ) : (
            <p className="cas-page-subtitle">
              Peer-reviewed open-access scholarly journal published on a
              continuous rolling basis under Creative Commons Attribution (CC-BY
              4.0).
            </p>
          )}

          {meta.issnPrint ||
          meta.issnL ||
          meta.frequency ||
          meta.referencingStyle ? (
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full border border-sky-300/25 bg-white/10 px-5 py-2 font-mono text-xs text-sky-100">
              {meta.issnPrint ? (
                <span>
                  ISSN: <strong className="text-white">{meta.issnPrint}</strong>
                </span>
              ) : null}
              {meta.issnL ? (
                <span>
                  ISSN-L: <strong className="text-white">{meta.issnL}</strong>
                </span>
              ) : null}
              {meta.frequency ? (
                <span>
                  Frequency:{" "}
                  <strong className="text-white">{meta.frequency}</strong>
                </span>
              ) : null}
              {meta.referencingStyle ? (
                <span>
                  Standard:{" "}
                  <strong className="text-white">
                    {meta.referencingStyle}
                  </strong>
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isSubmissionOpen ? (
              <Link href={submissionHref} className="cas-btn-primary">
                Submit to this Journal →
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl border border-sky-300/35 bg-white/10 px-5 py-3 text-sm font-semibold text-sky-100">
                Submissions Opening Soon
              </span>
            )}
            <Link
              href={`/archives?journal=${meta.slug}`}
              className="cas-btn-secondary"
            >
              Browse {meta.shortName} Archive
            </Link>
            <Link
              href={`/apply-reviewer?journal=${meta.slug}`}
              className="cas-btn-secondary"
            >
              Apply as Reviewer
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: AIMS & SCOPE ── */}
      <section>
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div className="border-b border-[color:var(--color-border)] pb-3">
                <p className="font-mono text-xs font-semibold text-[color:var(--color-accent)] uppercase">
                  Journal Focus &amp; Policy
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[color:var(--color-foreground)]">
                  Aims &amp; Scope
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-[color:var(--color-muted)]">
                {meta.aimsAndScope ||
                  "Aims and scope for this journal will be published by the editorial board."}
              </p>

              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
                  <p className="font-mono text-xs font-bold text-[color:var(--color-foreground)]">
                    Double-Blind Peer Review
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                    {meta.peerReviewPolicy ||
                      "Double-anonymised evaluation coordinated by the journal editorial board."}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
                  <p className="font-mono text-xs font-bold text-[color:var(--color-foreground)]">
                    Open Access &amp; Indexing
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                    Immediate open access under CC-BY 4.0 with Crossref DOI
                    registration and Google Scholar metadata.
                  </p>
                </div>
              </div>
            </div>

            {/* Author Quick Info Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div>
                <p className="font-mono text-xs font-semibold text-[color:var(--color-accent)] uppercase">
                  Submission Summary
                </p>
                <h3 className="mt-2 font-serif text-xl font-semibold text-[color:var(--color-foreground)]">
                  Publishing Schedule &amp; Fees
                </h3>
                <dl className="mt-4 space-y-3 text-xs">
                  <div className="flex flex-wrap items-baseline justify-between gap-1 border-b border-[color:var(--color-border)] pb-2">
                    <dt className="text-[color:var(--color-subtle)]">
                      Initial Submission Fee:
                    </dt>
                    <dd className="shrink-0 font-bold text-emerald-600">
                      Free (₦0 Upfront)
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-1 border-b border-[color:var(--color-border)] pb-2">
                    <dt className="text-[color:var(--color-subtle)]">
                      Publication Charge (Nigerian Authors):
                    </dt>
                    <dd className="shrink-0 font-bold text-[color:var(--color-foreground)]">
                      ₦30,000 (After Acceptance)
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-1 border-b border-[color:var(--color-border)] pb-2">
                    <dt className="text-[color:var(--color-subtle)]">
                      Foreign / International Authors:
                    </dt>
                    <dd className="shrink-0 font-bold text-[color:var(--color-accent)]">
                      US $90 (After Acceptance)
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-1 pb-1">
                    <dt className="text-[color:var(--color-subtle)]">
                      Submission Status:
                    </dt>
                    <dd className="font-semibold text-[color:var(--color-foreground)]">
                      {isSubmissionOpen
                        ? "Open for Submissions"
                        : "Standby (Opening Soon)"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 border-t border-[color:var(--color-border)] pt-4">
                {isSubmissionOpen ? (
                  <Link
                    href={submissionHref}
                    className="button-primary inline-flex w-full items-center justify-center gap-2 py-2.5 text-xs font-semibold"
                  >
                    <span>Submit Manuscript</span>
                    <span>→</span>
                  </Link>
                ) : (
                  <Link
                    href="/author-guidelines"
                    className="button-secondary inline-flex w-full items-center justify-center gap-2 py-2.5 text-xs font-semibold"
                  >
                    <span>Review Author Guidelines</span>
                    <span>→</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── SECTION 2: EDITORIAL BOARD ── */}
      <section className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 py-12">
        <Container>
          <div className="flex flex-col gap-3 border-b border-[color:var(--color-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold text-[color:var(--color-accent)] uppercase">
                Governance &amp; Leadership
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[color:var(--color-foreground)] sm:text-3xl">
                Editorial Board
              </h2>
            </div>
            <Link
              href="/editorial-board"
              className="text-xs font-semibold text-[color:var(--color-accent)] hover:underline"
            >
              View Full Editorial Team →
            </Link>
          </div>

          {boardMembers.length === 0 ? (
            <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-8 text-center">
              <p className="font-serif text-base font-semibold text-[color:var(--color-foreground)]">
                Editorial Board Roster Pending Publication
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-[color:var(--color-muted)]">
                The verified editorial board roster for {meta.title} will be
                published shortly by the editorial office.
              </p>
            </div>
          ) : (
            <>
              {/* Principal Officers */}
              <div
                className={`mt-8 grid gap-6 ${
                  chiefEditor && deputyEditor && !managingEditor
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {chiefEditor ? (
                  <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-accent)]/40 bg-[color:var(--color-surface-raised)] p-6 shadow-sm">
                    <span className="rounded bg-[color:var(--color-surface-strong)] px-2.5 py-1 font-mono text-[10px] font-bold text-[color:var(--color-accent)] uppercase">
                      {chiefEditor.role}
                    </span>
                    <h3 className="mt-3 font-serif text-lg font-semibold text-[color:var(--color-foreground)]">
                      {chiefEditor.name}
                    </h3>
                    {chiefEditor.affiliation?.trim() ? (
                      <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                        {chiefEditor.affiliation}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {deputyEditor ? (
                  <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6">
                    <span className="rounded bg-[color:var(--color-surface)] px-2.5 py-1 font-mono text-[10px] font-bold text-[color:var(--color-accent)] uppercase">
                      {deputyEditor.role}
                    </span>
                    <h3 className="mt-3 font-serif text-lg font-semibold text-[color:var(--color-foreground)]">
                      {deputyEditor.name}
                    </h3>
                    {deputyEditor.affiliation?.trim() ? (
                      <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                        {deputyEditor.affiliation}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {managingEditor ? (
                  <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 sm:col-span-2 lg:col-span-1">
                    <span className="rounded bg-[color:var(--color-surface)] px-2.5 py-1 font-mono text-[10px] font-bold text-[color:var(--color-accent)] uppercase">
                      {managingEditor.role}
                    </span>
                    <h3 className="mt-3 font-serif text-lg font-semibold text-[color:var(--color-foreground)]">
                      {managingEditor.name}
                    </h3>
                    {managingEditor.affiliation?.trim() ? (
                      <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                        {managingEditor.affiliation}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Associate Editors / Board Members */}
              {associateEditors.length > 0 || boardMemberList.length > 0 ? (
                <div className="mt-10">
                  <h3 className="font-serif text-lg font-semibold text-[color:var(--color-foreground)]">
                    {associateEditors.length > 0
                      ? "Associate Editors & Editorial Board"
                      : "Editorial Board Members"}
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...associateEditors, ...boardMemberList].map((member) => (
                      <div
                        key={member.id}
                        className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-[color:var(--color-accent)]" />
                            <p className="font-serif text-sm font-semibold text-[color:var(--color-foreground)]">
                              {member.name}
                            </p>
                          </div>
                          <span className="rounded bg-[color:var(--color-surface-strong)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[color:var(--color-accent)]">
                            {member.role}
                          </span>
                        </div>
                        {member.affiliation?.trim() ? (
                          <p className="mt-1 pl-3.5 text-xs text-[color:var(--color-muted)]">
                            {member.affiliation}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Consulting Editors / Advisory Council */}
              {consultingEditors.length > 0 || advisoryBoard.length > 0 ? (
                <div className="mt-10">
                  <h3 className="font-serif text-lg font-semibold text-[color:var(--color-foreground)]">
                    {consultingEditors.length > 0
                      ? "Consulting Editors"
                      : "Advisory Council"}
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...consultingEditors, ...advisoryBoard].map((member) => (
                      <div
                        key={member.id}
                        className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4"
                      >
                        <p className="font-serif text-sm font-semibold text-[color:var(--color-foreground)]">
                          {member.name}
                        </p>
                        {member.affiliation?.trim() ? (
                          <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                            {member.affiliation}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Container>
      </section>

      {/* ── SECTION 3: CURRENT ISSUE & ARTICLES ── */}
      <section>
        <Container>
          <div className="flex flex-col gap-3 border-b border-[color:var(--color-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold text-[color:var(--color-accent)] uppercase">
                Latest Publications
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[color:var(--color-foreground)] sm:text-3xl">
                Recent Papers &amp; Issues
              </h2>
            </div>
            <Link
              href={`/archives?journal=${meta.slug}`}
              className="text-xs font-semibold text-[color:var(--color-accent)] hover:underline"
            >
              Browse Full {meta.shortName} Archive →
            </Link>
          </div>

          {publishedArticles.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {publishedArticles.map((article) => (
                <article
                  key={article.id}
                  className="flex flex-col justify-between rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 transition hover:border-[color:var(--color-accent)]"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-[color:var(--color-accent)] uppercase">
                      <span>
                        Vol. {article.issue.volume.number}, Issue{" "}
                        {article.issue.number} ({article.issue.volume.year})
                      </span>
                      {article.pageStart ? (
                        <>
                          <span>·</span>
                          <span>
                            pp. {article.pageStart}
                            {article.pageEnd ? `–${article.pageEnd}` : ""}
                          </span>
                        </>
                      ) : null}
                    </div>

                    <h3 className="mt-2 font-serif text-lg font-semibold text-[color:var(--color-foreground)]">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="transition hover:text-[color:var(--color-accent)]"
                      >
                        {article.title}
                      </Link>
                    </h3>

                    {article.authors.length ? (
                      <p className="mt-2 font-mono text-xs text-[color:var(--color-subtle)]">
                        By {article.authors.map((a) => a.fullName).join(", ")}
                      </p>
                    ) : null}

                    {article.doi ? (
                      <p className="mt-1 font-mono text-[11px] text-[color:var(--color-accent)]">
                        DOI: {article.doi}
                      </p>
                    ) : null}

                    {article.abstract ? (
                      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-[color:var(--color-muted)]">
                        {article.abstract}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[color:var(--color-border)] pt-4">
                    <Link
                      href={`/articles/${article.slug}`}
                      className="button-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold"
                    >
                      <span>Read Article</span>
                      <span>→</span>
                    </Link>
                    <a
                      href={`/api/articles/${article.slug}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold"
                    >
                      <span>PDF</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-8 text-center sm:p-10">
              <span className="inline-block rounded-full bg-sky-500/10 px-3.5 py-1 font-mono text-xs font-semibold text-[#0284c7]">
                Volume in Preparation
              </span>
              <h3 className="mt-3 font-serif text-xl font-semibold text-[color:var(--color-foreground)] sm:text-2xl">
                Inaugural Volume of {meta.title}
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[color:var(--color-muted)] sm:text-sm">
                {isSubmissionOpen
                  ? `Articles for the upcoming volume of ${meta.shortName} are currently in peer review. Submit your research today to be included in the next issue.`
                  : `${meta.title} is registered in the CAS Journals catalog. Manuscript intake for the upcoming issue will open as soon as submission activation is enabled.`}
              </p>
              {isSubmissionOpen ? (
                <div className="mt-6 flex justify-center gap-3">
                  <Link
                    href={submissionHref}
                    className="button-primary inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold"
                  >
                    <span>Submit Manuscript to {meta.shortName}</span>
                    <span>→</span>
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </Container>
      </section>

      {/* ── SECTION 4: ARCHIVES DIRECTORY ── */}
      {journalVolumes.length > 0 ? (
        <section className="border-t border-[color:var(--color-border)] pt-12">
          <Container>
            <div className="flex flex-col gap-3 border-b border-[color:var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-xs font-semibold text-[color:var(--color-accent)] uppercase">
                  Periodical Shelves
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[color:var(--color-foreground)]">
                  Published Volumes &amp; Issues
                </h2>
              </div>
              <Link
                href={`/archives?journal=${meta.slug}`}
                className="button-secondary w-full px-3.5 py-1.5 text-center text-xs font-semibold sm:w-auto"
              >
                Open Periodical Shelf
              </Link>
            </div>

            <div className="mt-6 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {journalVolumes.map((vol) => (
                <div
                  key={vol.id}
                  className="flex flex-col rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-[color:var(--color-border)]/60 pb-3 font-mono text-xs text-[color:var(--color-accent)]">
                    <span className="font-bold">Volume {vol.number}</span>
                    <span>{vol.year}</span>
                  </div>
                  <div className="mt-3 max-h-80 space-y-1.5 overflow-y-auto pr-1">
                    {vol.issues.map((iss) => (
                      <Link
                        key={iss.id}
                        href={`/archives?journal=${meta.slug}`}
                        className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[color:var(--color-surface)] p-2.5 text-xs transition hover:bg-[color:var(--color-surface-strong)] hover:text-[color:var(--color-accent)]"
                      >
                        <span className="font-medium text-[color:var(--color-foreground)]">
                          Issue {iss.number}
                        </span>
                        <span className="font-mono text-[10px] text-[color:var(--color-subtle)]">
                          {iss._count.articles}{" "}
                          {iss._count.articles === 1 ? "Paper" : "Papers"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </div>
  );
}
