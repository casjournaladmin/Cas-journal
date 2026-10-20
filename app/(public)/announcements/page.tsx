import type { Metadata } from "next";
import Link from "next/link";
import { AnnouncementImage } from "@/components/announcements/announcement-image";
import { Container } from "@/components/ui/container";
import { activeJournalsConfig } from "@/lib/config/site";
import { prisma } from "@/lib/db/prisma";
import {
  type Announcement,
  getPublicAnnouncements,
} from "@/lib/editorial/announcements-store";
import {
  CANONICAL_JOURNAL_ORDER,
  getJournalOrderPriority,
} from "@/lib/editorial/editorial-board-data";
import { formatLongDate } from "@/lib/formatting/dates";

type DbJournalOption = {
  slug: string;
  shortName: string | null;
  name: string;
};

type JournalOptionItem = {
  slug: string;
  name: string;
};

export const metadata: Metadata = {
  title: "Announcements & Call for Papers | CAS Journals",
  description:
    "Official calls for papers, special issue deadlines, and publishing updates across CAS Journals.",
};

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ journal?: string }>;
}) {
  const { journal: activeJournal = "ALL" } = await searchParams;
  const [announcements, dbJournals]: [Announcement[], DbJournalOption[]] =
    await Promise.all([
      getPublicAnnouncements(
        activeJournal === "ALL" ? undefined : activeJournal,
      ),
      prisma.journal.findMany({
        where: {
          isActive: true,
          slug: { in: [...CANONICAL_JOURNAL_ORDER] },
        },
        select: { slug: true, shortName: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  const journalOptions: JournalOptionItem[] =
    dbJournals.length > 0
      ? dbJournals
          .map((j: DbJournalOption): JournalOptionItem => ({
            slug: j.slug,
            name: j.shortName || j.name,
          }))
          .sort(
            (a: JournalOptionItem, b: JournalOptionItem) =>
              getJournalOrderPriority(a.slug) - getJournalOrderPriority(b.slug),
          )
      : activeJournalsConfig.map((j): JournalOptionItem => ({
          slug: j.slug,
          name: j.shortName,
        }));

  const filterTabs: JournalOptionItem[] = [
    { slug: "ALL", name: "All Journals" },
    ...journalOptions,
  ];

  return (
    <div className="space-y-12 pb-24">
      <header className="cas-page-hero cas-page-hero-announcements">
        <div className="cas-page-hero-inner">
          <div className="cas-breadcrumbs">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span>Call for Papers &amp; Announcements</span>
          </div>
          <h1 className="cas-page-title">
            Call for Papers &amp; Editorial Notices
          </h1>
          <p className="cas-page-desc">
            Continuous rolling calls for Volume 1 (2026), special thematic
            issues, and official editorial updates across CAS Journals.
          </p>
        </div>
      </header>

      <Container>
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Journal Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto border-b border-[color:var(--color-border)] pb-3">
            {filterTabs.map((j: JournalOptionItem) => (
              <Link
                key={j.slug}
                href={
                  j.slug === "ALL"
                    ? "/announcements"
                    : `/announcements?journal=${j.slug}`
                }
                className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  activeJournal === j.slug
                    ? "bg-[color:var(--color-accent)] text-white"
                    : "border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                }`}
              >
                {j.name}
              </Link>
            ))}
          </div>

          {/* Open Call Banner */}
          <div className="rounded-2xl border border-sky-200 bg-[#f0f9ff] p-6 sm:p-8">
            <span className="inline-block rounded-full bg-sky-500/15 px-3 py-1 font-mono text-xs font-bold text-[#0284c7] uppercase">
              Rolling Call for Papers &bull; Volume 1 (2026)
            </span>
            <h2 className="mt-3 font-serif text-2xl font-bold text-[#032b45]">
              Continuous Rolling Submissions Across All CAS Journals
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              CAS Journals invites original empirical research papers,
              theoretical discourses, critical reviews, and policy analyses for
              publication across{" "}
              <strong>
                Existentia: Concrescence Journal of Arts and Humanities
              </strong>
              ,{" "}
              <strong>
                Concrescence Journal of Multi-Disciplinary Research
              </strong>
              , <strong>Izu: Journal of Critical Perspectives</strong>, and{" "}
              <strong>The Polis: Journal of Political Studies</strong>. Initial
              submission is free (₦0 upfront).
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/submit" className="cas-btn-primary">
                Submit Your Paper
              </Link>
              <Link href="/author-guidelines" className="cas-btn-secondary">
                Author Guidelines
              </Link>
            </div>
          </div>

          {/* Announcement Items */}
          {announcements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-12 text-center">
              <p className="font-serif text-lg font-semibold text-[color:var(--color-foreground)]">
                No Additional Editorial Notices Posted
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-[color:var(--color-muted)]">
                There are no additional notices matching this filter. Official
                special issue announcements and editorial updates published by
                administrators appear here automatically.
              </p>
              {activeJournal !== "ALL" ? (
                <div className="mt-4">
                  <Link
                    href="/announcements"
                    className="button-secondary text-xs"
                  >
                    View All Journals
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-6">
              {announcements.map((item: Announcement, index: number) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-sm transition hover:border-[color:var(--color-accent)]/50 sm:p-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-border)] pb-3">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span
                        className={`rounded px-2.5 py-0.5 font-bold uppercase ${
                          item.category === "CALL_FOR_PAPERS"
                            ? "bg-sky-500/15 text-[#0284c7]"
                            : item.category === "SPECIAL_ISSUE"
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-slate-500/15 text-slate-600"
                        }`}
                      >
                        {item.category.replace(/_/g, " ")}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-[color:var(--color-accent)] uppercase">
                        {item.targetJournal === "ALL"
                          ? "All CAS Journals"
                          : `Journal: ${item.targetJournal.toUpperCase()}`}
                      </span>
                    </div>

                    <span
                      suppressHydrationWarning
                      className="font-mono text-xs text-[color:var(--color-subtle)]"
                    >
                      {formatLongDate(item.publishedAt)}
                    </span>
                  </div>

                  <h2 className="mt-4 font-serif text-2xl font-semibold text-[color:var(--color-foreground)]">
                    {item.title}
                  </h2>

                  {item.imageUrl ? (
                    <AnnouncementImage
                      src={item.imageUrl}
                      alt={item.title}
                      priority={index < 2}
                    />
                  ) : null}

                  <div className="mt-3 text-sm leading-relaxed whitespace-pre-line text-[color:var(--color-muted)]">
                    {item.content}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[color:var(--color-border)] pt-4 text-xs">
                    <span className="font-mono text-[color:var(--color-subtle)]">
                      Editorial Desk · {item.authorName}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
