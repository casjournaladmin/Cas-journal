import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JournalNavigation } from "@/components/journal/journal-navigation";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";
import {
  JOURNAL_HERO_AFFILIATIONS,
  getJournalMetadata,
  resolveCanonicalJournalSlug,
} from "@/lib/editorial/editorial-board-data";
import { getJournalEditorialBoard } from "@/lib/editorial/editorial-board-store";

export const dynamic = "force-dynamic";

const JOURNAL_HERO_MAP: Record<string, string> = {
  existentia: "/assets/images/journal-arts-humanities.jpg",
  cjmr: "/assets/images/journal-multidisciplinary.jpg",
  izu: "/assets/images/journal-governance-security.jpg",
  polis: "/assets/images/journal-political-studies.jpg",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ journalSlug: string }>;
}): Promise<Metadata> {
  const { journalSlug } = await params;
  const canonical = resolveCanonicalJournalSlug(journalSlug);
  const meta = getJournalMetadata(canonical);
  if (!meta) return { title: "Journal Not Found" };

  return {
    title: `Editorial Board & Governance | ${meta.title} (${meta.shortName}) | ${siteConfig.name}`,
    description: `Official editorial board leadership, editors, and reviewers for ${meta.title}.`,
    alternates: {
      canonical: `/journals/${meta.slug}/editorial-board`,
    },
  };
}

export default async function JournalEditorialBoardPage({
  params,
}: {
  params: Promise<{ journalSlug: string }>;
}) {
  const { journalSlug } = await params;
  const canonical = resolveCanonicalJournalSlug(journalSlug);
  const meta = getJournalMetadata(canonical);

  if (!meta) {
    notFound();
  }

  const [boardMembers] = await Promise.all([
    getJournalEditorialBoard(meta.slug),
  ]);

  const affiliation =
    JOURNAL_HERO_AFFILIATIONS[meta.slug] ||
    [meta.faculty, meta.institution].filter(Boolean).join(", ");
  const heroImage =
    JOURNAL_HERO_MAP[meta.slug] ||
    "/assets/images/journal-multidisciplinary.jpg";

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

  return (
    <div className="space-y-12 pb-24">
      {/* ── Journal Hero Banner ── */}
      <section
        className="cas-page-hero relative overflow-hidden text-white"
        style={{
          background: `linear-gradient(135deg, rgba(3, 43, 69, 0.92) 0%, rgba(7, 89, 133, 0.88) 100%), url("${heroImage}") center 35% / cover no-repeat`,
        }}
      >
        <div className="cas-page-hero-inner">
          <div className="cas-breadcrumbs text-sky-200/80">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span className="sep">/</span>
            <Link href={`/journals/${meta.slug}`} className="hover:underline">
              {meta.shortName}
            </Link>
            <span className="sep">/</span>
            <span>Editorial Board</span>
          </div>

          <span className="cas-hero-eyebrow mt-2">
            {meta.shortName} · Governance
          </span>
          <h1 className="cas-page-title">{meta.title}</h1>
          <p className="cas-page-subtitle">{affiliation}</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-sans text-xs text-sky-100/90">
            {meta.issnOnline ? (
              <span>
                Online ISSN:{" "}
                <strong className="font-semibold text-white">
                  {meta.issnOnline}
                </strong>
              </span>
            ) : null}
            <span>
              Standard:{" "}
              <strong className="font-semibold text-white">
                {meta.referencingStyle}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* ── Dedicated Secondary Journal Navigation ── */}
      <JournalNavigation journalSlug={meta.slug} shortName={meta.shortName} />

      <Container>
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Header context */}
          <div className="border-b border-[color:var(--color-border)] pb-4">
            <span className="font-mono text-xs font-semibold tracking-wider text-[color:var(--color-accent)] uppercase">
              Scholarly Leadership
            </span>
            <h2 className="mt-1 font-serif text-2xl font-bold text-[color:var(--color-foreground)] sm:text-3xl">
              Editorial Board &amp; Scientific Referees
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-muted)] sm:text-sm">
              The editorial governance for {meta.title} is entrusted to
              distinguished scholars and disciplinary specialists adhering to
              international peer review and COPE standards.
            </p>
          </div>

          {boardMembers.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-8 text-center">
              <p className="font-serif text-base font-semibold text-[color:var(--color-foreground)]">
                Editorial Board Roster Pending Publication
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-[color:var(--color-muted)]">
                The verified editorial board roster for {meta.title} will be
                published shortly by the editorial secretariat.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Editorial Leadership */}
              {chiefEditor || deputyEditor || managingEditor ? (
                <section className="space-y-4">
                  <h3 className="font-mono text-xs font-bold tracking-wider text-[color:var(--color-accent)] uppercase">
                    Editorial Leadership
                  </h3>
                  <div className="divide-y divide-[color:var(--color-border)] rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]">
                    {[chiefEditor, deputyEditor, managingEditor]
                      .filter(Boolean)
                      .map((officer) => (
                        <div
                          key={officer!.id}
                          className="flex flex-col gap-1 p-5 sm:flex-row sm:items-baseline sm:justify-between"
                        >
                          <div>
                            <span className="font-mono text-[10px] font-bold tracking-wider text-[color:var(--color-accent)] uppercase">
                              {officer!.role}
                            </span>
                            <p className="font-serif text-base font-bold text-[color:var(--color-foreground)]">
                              {officer!.name}
                            </p>
                          </div>
                          {officer!.affiliation?.trim() ? (
                            <p className="text-xs text-[color:var(--color-muted)] sm:max-w-md sm:text-right">
                              {officer!.affiliation}
                            </p>
                          ) : null}
                        </div>
                      ))}
                  </div>
                </section>
              ) : null}

              {/* Associate Editors & Board Members */}
              {associateEditors.length > 0 || boardMemberList.length > 0 ? (
                <section className="space-y-4">
                  <h3 className="font-mono text-xs font-bold tracking-wider text-[color:var(--color-accent)] uppercase">
                    {associateEditors.length > 0
                      ? "Associate Editors & Board Members"
                      : "Editorial Board Members"}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...associateEditors, ...boardMemberList].map((member) => (
                      <div
                        key={member.id}
                        className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4"
                      >
                        <p className="font-serif text-sm font-semibold text-[color:var(--color-foreground)]">
                          {member.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] font-semibold text-[color:var(--color-accent)]">
                          {member.role}
                        </p>
                        {member.affiliation?.trim() ? (
                          <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-muted)]">
                            {member.affiliation}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Consulting & Advisory Board */}
              {consultingEditors.length > 0 || advisoryBoard.length > 0 ? (
                <section className="space-y-4">
                  <h3 className="font-mono text-xs font-bold tracking-wider text-[color:var(--color-accent)] uppercase">
                    Advisory Board &amp; Consulting Editors
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[...consultingEditors, ...advisoryBoard].map((member) => (
                      <div
                        key={member.id}
                        className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4"
                      >
                        <p className="font-serif text-sm font-semibold text-[color:var(--color-foreground)]">
                          {member.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] font-semibold text-[color:var(--color-accent)]">
                          {member.role}
                        </p>
                        {member.affiliation?.trim() ? (
                          <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-muted)]">
                            {member.affiliation}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}

          {/* ── Join the Board / Apply CTA ── */}
          <section className="rounded-xl border border-sky-200 bg-[#f0f9ff] p-6 sm:p-8 dark:border-sky-800 dark:bg-sky-950/20">
            <h3 className="font-serif text-xl font-bold text-[#032b45] dark:text-sky-200">
              Join the Editorial Board or Reviewer Pool
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              CASJOURNALS continuously welcomes qualified professors, readers,
              and doctorate-holding researchers to serve as peer reviewers and
              section editors for {meta.title}.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/apply-reviewer?journal=${meta.slug}`}
                className="cas-btn-primary"
              >
                Apply as Peer Reviewer
              </Link>
              <Link
                href={`/author/submissions/new?journal=${meta.slug}`}
                className="cas-btn-secondary"
              >
                Submit Manuscript
              </Link>
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
}
