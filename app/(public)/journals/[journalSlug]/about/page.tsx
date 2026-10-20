import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JournalNavigation } from "@/components/journal/journal-navigation";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";
import { getJournalAboutData } from "@/lib/editorial/journal-about-data";
import {
  JOURNAL_HERO_AFFILIATIONS,
  resolveCanonicalJournalSlug,
} from "@/lib/editorial/editorial-board-data";

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
  const data = getJournalAboutData(canonical);
  if (!data) return { title: "Journal Not Found" };

  return {
    title: `About ${data.shortName} | ${data.title} | ${siteConfig.name}`,
    description: data.aimsAndScope.slice(0, 160),
    alternates: {
      canonical: `/journals/${data.slug}/about`,
    },
  };
}

export default async function JournalAboutPage({
  params,
}: {
  params: Promise<{ journalSlug: string }>;
}) {
  const { journalSlug } = await params;
  const canonical = resolveCanonicalJournalSlug(journalSlug);
  const data = getJournalAboutData(canonical);

  if (!data) {
    notFound();
  }

  const affiliation = JOURNAL_HERO_AFFILIATIONS[data.slug] || data.affiliation;
  const heroImage =
    JOURNAL_HERO_MAP[data.slug] ||
    "/assets/images/journal-multidisciplinary.jpg";
  const submissionHref = `/author/submissions/new?journal=${data.slug}`;

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
            <Link href={`/journals/${data.slug}`} className="hover:underline">
              {data.shortName}
            </Link>
            <span className="sep">/</span>
            <span>About</span>
          </div>

          <span className="cas-hero-eyebrow mt-2">
            {data.shortName} · About
          </span>
          <h1 className="cas-page-title">{data.title}</h1>
          <p className="cas-page-subtitle">{affiliation}</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-sans text-xs text-sky-100/90">
            <span>
              Online ISSN:{" "}
              <strong className="font-semibold text-white">
                {data.issnOnline}
              </strong>
            </span>
            <span>
              Frequency:{" "}
              <strong className="font-semibold text-white">
                {data.publicationFrequency}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* ── Dedicated Secondary Journal Navigation ── */}
      <JournalNavigation journalSlug={data.slug} shortName={data.shortName} />

      <Container>
        <div className="mx-auto max-w-4xl space-y-12">
          {/* ── 1. Aims and Scope / Introduction ── */}
          <section className="space-y-4">
            <div className="border-b border-[color:var(--color-border)] pb-3">
              <span className="font-mono text-xs font-semibold tracking-wider text-[color:var(--color-accent)] uppercase">
                Mission &amp; Focus
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[color:var(--color-foreground)] sm:text-3xl">
                Aims and Scope
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[color:var(--color-foreground)]/90 sm:text-base">
              {data.aimsAndScope}
            </p>
          </section>

          {/* ── 2. Thematic & Disciplinary Scope ── */}
          {data.topicSections && data.topicSections.length > 0 ? (
            <section className="space-y-6">
              <div className="border-b border-[color:var(--color-border)] pb-3">
                <span className="font-mono text-xs font-semibold tracking-wider text-[color:var(--color-accent)] uppercase">
                  Curriculum &amp; Topics
                </span>
                <h2 className="mt-1 font-serif text-2xl font-bold text-[color:var(--color-foreground)] sm:text-3xl">
                  Thematic Coverage &amp; Disciplinary Domains
                </h2>
              </div>
              {data.topicsIntro ? (
                <p className="text-sm text-[color:var(--color-muted)]">
                  {data.topicsIntro}
                </p>
              ) : null}

              <div className="grid gap-6 sm:grid-cols-2">
                {data.topicSections.map((section, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5"
                  >
                    <h3 className="font-serif text-base font-bold text-[color:var(--color-foreground)]">
                      {section.title}
                    </h3>
                    <ul className="mt-3 space-y-1.5 text-xs text-[color:var(--color-foreground)]/85">
                      {section.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[color:var(--color-accent)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* ── 3. Author Submission Guidelines ── */}
          <section className="space-y-4">
            <div className="border-b border-[color:var(--color-border)] pb-3">
              <span className="font-mono text-xs font-semibold tracking-wider text-[color:var(--color-accent)] uppercase">
                Manuscript Preparation
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[color:var(--color-foreground)] sm:text-3xl">
                Submission Guidelines
              </h2>
            </div>
            <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6">
              <dl className="grid gap-4 text-xs sm:grid-cols-2">
                {data.guidelines.length ? (
                  <div>
                    <dt className="font-semibold text-[color:var(--color-accent)]">
                      Manuscript Length:
                    </dt>
                    <dd className="mt-0.5 text-[color:var(--color-foreground)]">
                      {data.guidelines.length}
                    </dd>
                  </div>
                ) : null}
                {data.guidelines.format ? (
                  <div>
                    <dt className="font-semibold text-[color:var(--color-accent)]">
                      Format:
                    </dt>
                    <dd className="mt-0.5 text-[color:var(--color-foreground)]">
                      {data.guidelines.format}
                    </dd>
                  </div>
                ) : null}
                {data.guidelines.style ? (
                  <div>
                    <dt className="font-semibold text-[color:var(--color-accent)]">
                      Referencing Style:
                    </dt>
                    <dd className="mt-0.5 text-[color:var(--color-foreground)]">
                      {data.guidelines.style}
                    </dd>
                  </div>
                ) : null}
                {data.guidelines.abstract ? (
                  <div>
                    <dt className="font-semibold text-[color:var(--color-accent)]">
                      Abstract:
                    </dt>
                    <dd className="mt-0.5 text-[color:var(--color-foreground)]">
                      {data.guidelines.abstract}
                    </dd>
                  </div>
                ) : null}
                {data.guidelines.keywords ? (
                  <div>
                    <dt className="font-semibold text-[color:var(--color-accent)]">
                      Keywords:
                    </dt>
                    <dd className="mt-0.5 text-[color:var(--color-foreground)]">
                      {data.guidelines.keywords}
                    </dd>
                  </div>
                ) : null}
                {data.guidelines.deadline ? (
                  <div>
                    <dt className="font-semibold text-[color:var(--color-accent)]">
                      Submission Timing:
                    </dt>
                    <dd className="mt-0.5 text-[color:var(--color-foreground)]">
                      {data.guidelines.deadline}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {data.guidelines.process ? (
                <p className="mt-4 border-t border-[color:var(--color-border)] pt-4 text-xs leading-relaxed text-[color:var(--color-muted)]">
                  <strong>Peer Review Note:</strong> {data.guidelines.process}
                </p>
              ) : null}
            </div>
          </section>

          {/* ── 4. Publication Frequency & Article Types ── */}
          <div className="grid gap-6 sm:grid-cols-2">
            <section className="space-y-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6">
              <span className="font-mono text-xs font-semibold tracking-wider text-[color:var(--color-accent)] uppercase">
                Schedule
              </span>
              <h3 className="font-serif text-lg font-bold text-[color:var(--color-foreground)]">
                Publication Frequency
              </h3>
              <p className="text-xs leading-relaxed text-[color:var(--color-muted)]">
                {data.publicationFrequency}
              </p>
            </section>

            <section className="space-y-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6">
              <span className="font-mono text-xs font-semibold tracking-wider text-[color:var(--color-accent)] uppercase">
                Formats
              </span>
              <h3 className="font-serif text-lg font-bold text-[color:var(--color-foreground)]">
                Types of Articles Published
              </h3>
              <ul className="space-y-1.5 text-xs text-[color:var(--color-foreground)]">
                {data.typesOfArticles.map((t, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-[color:var(--color-accent)]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* ── 5. Open Access, Review Process & Ethics ── */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5">
              <h3 className="font-serif text-sm font-bold text-[color:var(--color-foreground)]">
                Open Access Policy
              </h3>
              <p className="text-xs leading-relaxed text-[color:var(--color-muted)]">
                {data.openAccess}
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5">
              <h3 className="font-serif text-sm font-bold text-[color:var(--color-foreground)]">
                Double-Blind Peer Review
              </h3>
              <p className="text-xs leading-relaxed text-[color:var(--color-muted)]">
                {data.reviewProcess}
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5">
              <h3 className="font-serif text-sm font-bold text-[color:var(--color-foreground)]">
                Publication Ethics (COPE)
              </h3>
              <p className="text-xs leading-relaxed text-[color:var(--color-muted)]">
                {data.publicationEthics}
              </p>
            </div>
          </div>

          {/* ── 6. Article Processing Charge (APC) ── */}
          <section className="rounded-xl border border-sky-200 bg-[#f0f9ff] p-6 sm:p-8 dark:border-sky-800 dark:bg-sky-950/20">
            <span className="font-mono text-xs font-bold text-[#0284c7] uppercase">
              Financial Transparency
            </span>
            <h3 className="mt-1 font-serif text-xl font-bold text-[#032b45] dark:text-sky-200">
              Article Processing Charge (APC)
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {data.apc.details}
            </p>
            <div className="mt-4 flex flex-wrap gap-6 text-xs">
              <div>
                <span className="block text-slate-500">
                  Initial Submission:
                </span>
                <strong className="font-bold text-emerald-600 dark:text-emerald-400">
                  {data.apc.submissionFee}
                </strong>
              </div>
              <div>
                <span className="block text-slate-500">Nigerian Authors:</span>
                <strong className="font-bold text-[#032b45] dark:text-sky-200">
                  {data.apc.nigerianFee}
                </strong>
              </div>
              <div>
                <span className="block text-slate-500">
                  International Authors:
                </span>
                <strong className="font-bold text-[#032b45] dark:text-sky-200">
                  {data.apc.foreignFee}
                </strong>
              </div>
            </div>
          </section>

          {/* ── 7. Indexing & Discoverability ── */}
          <section className="space-y-4">
            <div className="border-b border-[color:var(--color-border)] pb-3">
              <span className="font-mono text-xs font-semibold tracking-wider text-[color:var(--color-accent)] uppercase">
                Scholarly Visibility
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[color:var(--color-foreground)] sm:text-3xl">
                Indexing and Abstracting
              </h2>
            </div>
            <p className="text-xs text-[color:var(--color-muted)]">
              Articles published in {data.shortName} are indexed in and
              discoverable through:
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {data.indexing.map((indexer, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 py-2 text-center text-xs font-semibold text-[color:var(--color-foreground)]"
                >
                  {indexer}
                </div>
              ))}
            </div>
          </section>

          {/* ── 8. Contact Information & Secretariat ── */}
          <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6">
            <span className="font-mono text-xs font-semibold tracking-wider text-[color:var(--color-accent)] uppercase">
              Secretariat
            </span>
            <h3 className="mt-1 font-serif text-lg font-bold text-[color:var(--color-foreground)]">
              {data.contact.title}
            </h3>
            <div className="mt-4 grid gap-3 text-xs text-[color:var(--color-foreground)] sm:grid-cols-2">
              <div>
                <strong className="text-[color:var(--color-muted)]">
                  Office:
                </strong>{" "}
                {data.contact.office}
              </div>
              <div>
                <strong className="text-[color:var(--color-muted)]">
                  Address:
                </strong>{" "}
                {data.contact.address}
              </div>
              {data.contact.email ? (
                <div>
                  <strong className="text-[color:var(--color-muted)]">
                    Email:
                  </strong>{" "}
                  <a
                    href={`mailto:${data.contact.email}`}
                    className="text-[color:var(--color-accent)] hover:underline"
                  >
                    {data.contact.email}
                  </a>
                </div>
              ) : null}
              {data.contact.phone ? (
                <div>
                  <strong className="text-[color:var(--color-muted)]">
                    Phone:
                  </strong>{" "}
                  {data.contact.phone}
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[color:var(--color-border)] pt-6">
              <Link href={submissionHref} className="cas-btn-primary">
                Submit Your Manuscript →
              </Link>
              <Link
                href={`/journals/${data.slug}/editorial-board`}
                className="cas-btn-secondary"
              >
                View Editorial Board
              </Link>
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
}
