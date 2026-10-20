"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { activeJournalsConfig } from "@/lib/config/site";
import {
  CANONICAL_JOURNAL_ORDER,
  getJournalOrderPriority,
} from "@/lib/editorial/editorial-board-data";

export type OperationalCounts = {
  newRequests?: number;
  pendingReceipts?: number;
  submissionRequests?: number;
  awaitingTracking: number;
  activeSubmissions?: number;
  readyForPublishing?: number;
  publishedArticles?: number;
  awaitingAction?: number;
};

export type StaffCounts = {
  journalAdmins: number;
  editors: number;
};

export type ActiveJournal = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  description?: string | null;
  department?: { id: string; name: string } | null;
  isActivated?: boolean;
  issueCount?: number;
  articleCount?: number;
};

export type SuperAdminDashboardProps = {
  operational: OperationalCounts;
  staff: StaffCounts;
  journals: ActiveJournal[];
  isBreakGlass?: boolean;
  activateAction?: (
    prevState: { error?: string; success?: boolean } | undefined,
    formData: FormData,
  ) => Promise<{ error?: string; success?: boolean }>;
  upsertJournalAction?: (
    prevState: { error?: string; success?: boolean } | undefined,
    formData: FormData,
  ) => Promise<{ error?: string; success?: boolean }>;
};

const JOURNAL_THUMBNAILS: Record<string, string> = {
  existentia: "/assets/images/journal-arts-humanities.jpg",
  cjmr: "/assets/images/journal-multidisciplinary.jpg",
  izu: "/assets/images/journal-governance-security.jpg",
  polis: "/assets/images/journal-political-studies.jpg",
};

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-[color:var(--color-border)] pb-3">
      <h2 className="font-serif text-lg font-semibold tracking-[-0.015em] text-[color:var(--color-foreground)] sm:text-xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function MetricCard({
  count,
  label,
  sublabel,
  actionLabel,
  href,
}: {
  count: number;
  label: string;
  sublabel: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      prefetch={true}
      className="group relative flex flex-col justify-between rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 transition-all hover:border-[color:var(--color-border-strong)] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-focus)]"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="font-serif text-3xl font-semibold tracking-tight text-[color:var(--color-foreground)] sm:text-4xl">
            {count}
          </span>
        </div>
        <h3 className="mt-2.5 text-sm font-semibold text-[color:var(--color-foreground)]">
          {label}
        </h3>
        <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">
          {sublabel}
        </p>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-[color:var(--color-border)]/60 pt-3 text-xs font-semibold text-[color:var(--color-accent)]">
        <span>{actionLabel}</span>
        <span className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </div>
    </Link>
  );
}

export function SuperAdminDashboard({
  operational,
  journals,
  upsertJournalAction,
}: SuperAdminDashboardProps) {
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<ActiveJournal | null>(
    null,
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [, startTransition] = useTransition();

  // Filter strictly to the 4 canonical CAS journals
  const effectiveJournals = useMemo(() => {
    const list =
      journals.length > 0
        ? journals
        : activeJournalsConfig.map((j) => ({
            id: `catalog-${j.slug}`,
            slug: j.slug,
            name: j.name,
            shortName: j.shortName,
            description: j.description,
            department: { id: `scope-${j.slug}`, name: j.badge },
            isActivated: true,
          }));
    return list
      .filter((j) =>
        (CANONICAL_JOURNAL_ORDER as readonly string[]).includes(j.slug),
      )
      .sort(
        (a, b) =>
          getJournalOrderPriority(a.slug) - getJournalOrderPriority(b.slug),
      );
  }, [journals]);

  const handleSaveJournal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!upsertJournalAction) return;
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await upsertJournalAction(undefined, formData);
      if (res.success) {
        setShowJournalModal(false);
        setEditingJournal(null);
        setFeedback({
          type: "success",
          message: "Journal metadata saved successfully.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to save journal metadata.",
        });
      }
    });
  };

  const submissionRequestsCount =
    operational.submissionRequests ??
    (operational.newRequests ?? 0) + (operational.pendingReceipts ?? 0);
  const publishedArticlesCount = operational.publishedArticles ?? 0;
  const awaitingActionCount =
    operational.awaitingAction ?? operational.awaitingTracking;

  return (
    <div className="space-y-8 pb-4">
      {/* ── Main Overview Header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-wider text-[color:var(--color-accent)] uppercase">
              Platform Administration
            </span>
            <span className="text-[color:var(--color-border-strong)]">·</span>
            <span className="text-xs text-[color:var(--color-muted)]">
              4 Canonical Journals
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[color:var(--color-foreground)] sm:text-3xl">
            Overview
          </h1>
          <p className="mt-1 text-xs text-[color:var(--color-muted)] sm:text-sm">
            Central publishing operations, manuscript tracking, and editorial
            governance.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {upsertJournalAction ? (
            <button
              type="button"
              onClick={() => {
                setEditingJournal(null);
                setShowJournalModal(true);
              }}
              className="button-secondary text-xs"
            >
              <span>+</span> Register / Edit Journal
            </button>
          ) : null}
          <Link href="/admin/articles/new" className="button-primary text-xs">
            <span>+</span> Direct Publish
          </Link>
        </div>
      </header>

      {/* Operational Feedback alert */}
      {feedback ? (
        <div
          className={`flex items-center justify-between rounded-[var(--radius-md)] p-3 text-xs font-semibold ${
            feedback.type === "success"
              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "border border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[10px] uppercase underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* ── 1. Operational Metrics (Three live database-backed cards) ── */}
      <section className="space-y-3">
        <SectionHeading
          title="Operational Metrics"
          description="Live database counts across active requests, publications, and review queues"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            count={submissionRequestsCount}
            label="Submission Requests"
            sublabel="Active and pending author requests"
            actionLabel="View requests"
            href="/admin/submissions?status=SUBMITTED"
          />
          <MetricCard
            count={publishedArticlesCount}
            label="Published Articles"
            sublabel="Live peer-reviewed catalog articles"
            actionLabel="Manage articles"
            href="/admin/articles"
          />
          <MetricCard
            count={awaitingActionCount}
            label="Manuscripts Awaiting Action"
            sublabel="Papers in review, revision, or decision"
            actionLabel="Review manuscripts"
            href="/admin/submissions"
          />
        </div>
      </section>

      {/* ── 2. CAS Scholarly Journals (4 Canonical Journals Only) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] pb-3">
          <div>
            <h2 className="font-serif text-lg font-semibold tracking-[-0.015em] text-[color:var(--color-foreground)] sm:text-xl">
              CAS Scholarly Journals
            </h2>
            <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">
              The four canonical scholarly publications operating under CAS
              Publishing Directorate
            </p>
          </div>
          <span className="text-xs font-semibold text-[color:var(--color-accent)]">
            4 Journals
          </span>
        </div>

        <div className="divide-y divide-[color:var(--color-border)] overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] shadow-xs">
          {effectiveJournals.map((journal) => {
            const thumbnail =
              JOURNAL_THUMBNAILS[journal.slug] ||
              "/assets/images/journal-multidisciplinary.jpg";

            return (
              <div
                key={journal.id}
                className="flex flex-col gap-4 p-4 transition-colors hover:bg-[color:var(--color-surface-strong)]/30 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  {/* Visual Identity Cover Thumbnail */}
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-slate-900 sm:size-16">
                    <Image
                      src={thumbnail}
                      alt={journal.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-serif text-base font-semibold tracking-[-0.01em] text-[color:var(--color-foreground)] sm:text-lg">
                        {journal.name}
                      </p>
                      {journal.shortName ? (
                        <span className="rounded bg-[color:var(--color-surface-strong)] px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--color-accent)] uppercase">
                          {journal.shortName}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                      Active Publication · Open Submissions
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-end">
                  <Link
                    href={`/admin/${journal.slug}`}
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3.5 py-2 text-xs font-semibold text-[color:var(--color-accent)] transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-focus)]"
                  >
                    <span>Open operations →</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Modal for Register / Edit Journal (Accessible via break-glass action only) ── */}
      {showJournalModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-raised)] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-[color:var(--color-foreground)]">
                {editingJournal
                  ? `Edit ${editingJournal.shortName || editingJournal.name}`
                  : "Register / Update CAS Journal"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowJournalModal(false);
                  setEditingJournal(null);
                }}
                className="text-sm font-bold text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-[color:var(--color-muted)]">
              Register or update a journal record in the CAS catalog without
              automatically opening manuscript submissions.
            </p>

            <form onSubmit={handleSaveJournal} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
                    Journal Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    required
                    defaultValue={editingJournal?.slug ?? ""}
                    placeholder="e.g. existentia, cjmr, izu, polis"
                    className="app-field mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
                    Short Name / Acronym *
                  </label>
                  <input
                    type="text"
                    name="shortName"
                    required
                    defaultValue={editingJournal?.shortName ?? ""}
                    placeholder="e.g. EXISTENTIA, CJMR, IZU, POLIS"
                    className="app-field mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
                  Journal Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingJournal?.name ?? ""}
                  placeholder="e.g. Existentia: Concrescence Journal of Arts and Humanities"
                  className="app-field mt-1 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
                  Description / Focus
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingJournal?.description ?? ""}
                  placeholder="Focus and scope summary..."
                  className="app-field mt-1 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[color:var(--color-border)] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowJournalModal(false);
                    setEditingJournal(null);
                  }}
                  className="button-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="button-primary text-xs">
                  Save Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
