"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { activeJournalsConfig } from "@/lib/config/site";
import { getJournalOrderPriority } from "@/lib/editorial/editorial-board-data";

type OperationalCounts = {
  newRequests?: number;
  pendingReceipts?: number;
  awaitingTracking: number;
  activeSubmissions?: number;
  readyForPublishing?: number;
  publishedArticles?: number;
};

type StaffCounts = {
  journalAdmins: number;
  editors: number;
};

type ActiveJournal = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  description?: string | null;
  department?: { id: string; name: string } | null;
  isActivated?: boolean;
};

type SuperAdminDashboardProps = {
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

function pluralise(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function OperationalTile({
  count,
  label,
  actionLabel,
  href,
}: {
  count: number;
  label: string;
  actionLabel: string;
  href: string;
}) {
  const hasItems = count > 0;
  return (
    <Link
      href={href}
      prefetch={true}
      className="group flex flex-col justify-between rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 transition hover:border-[color:var(--color-border-strong)] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-focus)]"
    >
      <div>
        <div className="flex items-start gap-2.5">
          <span
            className={`font-serif text-4xl leading-none font-medium tracking-[-0.035em] ${
              hasItems
                ? "text-[color:var(--color-foreground)]"
                : "text-[color:var(--color-subtle)]"
            }`}
          >
            {count}
          </span>
          {hasItems ? (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[color:var(--color-accent-secondary)]" />
          ) : null}
        </div>
        <p
          className={`mt-3 text-sm leading-snug font-semibold ${
            hasItems
              ? "text-[color:var(--color-foreground)]"
              : "text-[color:var(--color-muted)]"
          }`}
        >
          {label}
        </p>
      </div>
      <p className="mt-5 text-xs font-semibold text-[color:var(--color-accent)] transition group-hover:underline group-hover:underline-offset-4">
        {actionLabel} →
      </p>
    </Link>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-[color:var(--color-muted)] uppercase">
        {children}
      </p>
    </div>
  );
}

export function SuperAdminDashboard({
  operational,
  staff,
  journals,
  isBreakGlass = false,
  activateAction,
  upsertJournalAction,
}: SuperAdminDashboardProps) {
  const [showAllJournals, setShowAllJournals] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<ActiveJournal | null>(
    null,
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalItems =
    (operational.activeSubmissions ?? 0) + operational.awaitingTracking;

  const effectiveJournals = useMemo(() => {
    if (journals.length > 0) return journals;
    return activeJournalsConfig.map((j) => ({
      id: `catalog-${j.slug}`,
      slug: j.slug,
      name: j.name,
      shortName: j.shortName,
      description: j.description,
      department: { id: `scope-${j.slug}`, name: j.badge },
      isActivated: false,
    }));
  }, [journals]);

  const sortedJournals = useMemo(() => {
    return [...effectiveJournals].sort((a, b) => {
      const aActive = a.isActivated !== false ? 1 : 0;
      const bActive = b.isActivated !== false ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      const diff =
        getJournalOrderPriority(a.slug) - getJournalOrderPriority(b.slug);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }, [effectiveJournals]);

  const visibleJournals = showAllJournals
    ? sortedJournals
    : sortedJournals.slice(0, 4);

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

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      {/* Page header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-medium tracking-[0.14em] text-[color:var(--color-accent)] uppercase">
              Platform administration
            </p>
            <span className="text-[color:var(--color-border-strong)]">·</span>
            <span className="rounded-full bg-[color:var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-accent)]">
              {journals.length > 0
                ? `${journals.length} ${pluralise(journals.length, "Journal", "Journals")} Registered`
                : "4 CAS Journals Catalog"}
            </span>
          </div>
          <h1 className="mt-3 max-w-2xl font-serif text-3xl leading-[1.12] font-medium tracking-[-0.035em] text-[color:var(--color-foreground)] sm:text-4xl lg:text-[2.75rem]">
            {totalItems > 0
              ? "Here is what needs your attention."
              : "Everything is up to date."}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--color-muted)]">
            Live operational status across CAS Journals. Click any journal or
            action item to manage publishing operations.
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
              className="button-secondary inline-flex items-center gap-1.5 text-xs"
            >
              <span>+</span> Register / Edit Journal
            </button>
          ) : null}
          <Link
            href="/admin/articles/new"
            className="button-primary inline-flex items-center gap-2 text-xs"
          >
            <span>+</span> Direct Publish Manuscript
          </Link>
        </div>
      </header>

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

      {/* Operational queue */}
      <section>
        <SectionHeader>Operational queue</SectionHeader>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <OperationalTile
            count={operational.activeSubmissions ?? 0}
            label={pluralise(
              operational.activeSubmissions ?? 0,
              "Submitted Manuscript",
              "Submitted Manuscripts",
            )}
            actionLabel="View manuscripts"
            href="/admin/submissions"
          />
          <OperationalTile
            count={operational.awaitingTracking}
            label={pluralise(
              operational.awaitingTracking,
              "Submission awaiting tracking ID",
              "Submissions awaiting tracking IDs",
            )}
            actionLabel="Assign tracking IDs"
            href="/admin/submissions?status=SUBMITTED"
          />
          <OperationalTile
            count={operational.publishedArticles ?? 0}
            label={pluralise(
              operational.publishedArticles ?? 0,
              "Published Article in Catalog",
              "Published Articles in Catalog",
            )}
            actionLabel="Manage catalog"
            href="/admin/articles"
          />
        </div>
      </section>

      {/* Active journals */}
      <section>
        <div className="flex items-center justify-between">
          <SectionHeader>CAS Scholarly Journals</SectionHeader>
          {journals.length > 4 ? (
            <button
              type="button"
              onClick={() => setShowAllJournals(!showAllJournals)}
              className="text-xs font-semibold text-[color:var(--color-accent)] hover:underline"
            >
              {showAllJournals
                ? "Show fewer ↑"
                : `View all ${journals.length} journals ↓`}
            </button>
          ) : null}
        </div>

        {effectiveJournals.length === 0 ? (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-8 text-center">
            <p className="font-serif text-base font-semibold text-[color:var(--color-foreground)]">
              No Database Journal Records Provisioned Yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-[color:var(--color-muted)]">
              Click &quot;+ Register / Edit Journal&quot; above to register CAS
              journals (existentia, cjmr, izu, polis) in the database.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-1 transition-all">
            {journals.length === 0 ? (
              <div className="border-b border-[color:var(--color-border)]/60 bg-[color:var(--color-surface-strong)]/50 px-5 py-2.5 text-xs text-[color:var(--color-muted)]">
                <span className="font-semibold text-[color:var(--color-accent)]">Catalog Standby:</span> Submissions activation is intentionally closed. The 4 official CAS journals are displayed below.
              </div>
            ) : null}
            <ul className="divide-y divide-[color:var(--color-border)]/70">
              {visibleJournals.map((journal) => (
                <li key={journal.id} className="p-4 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold tracking-[-0.01em] text-[color:var(--color-foreground)]">
                          {journal.name}
                        </p>
                        {journal.shortName ? (
                          <span className="rounded bg-[color:var(--color-accent-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--color-accent)]">
                            {journal.shortName}
                          </span>
                        ) : null}
                        {journal.isActivated === false ? (
                          <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            Submissions Standby
                          </span>
                        ) : (
                          <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            Submissions Open
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-[12px] text-[color:var(--color-muted)]">
                        {journal.department
                          ? `Scope: ${journal.department.name}`
                          : "CAS Scholarly Journal"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {upsertJournalAction ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingJournal(journal);
                            setShowJournalModal(true);
                          }}
                          className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-muted)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
                        >
                          Edit metadata
                        </button>
                      ) : null}
                      {isBreakGlass && activateAction ? (
                        <form
                          action={async (formData) => {
                            await activateAction(undefined, formData);
                          }}
                        >
                          <input
                            type="hidden"
                            name="journalSlug"
                            value={journal.slug}
                          />
                          <input
                            type="hidden"
                            name="enabled"
                            value={
                              journal.isActivated === false ? "true" : "false"
                            }
                          />
                          <button
                            type="submit"
                            className={`rounded border px-2.5 py-1 text-xs font-semibold transition ${
                              journal.isActivated === false
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                            }`}
                          >
                            {journal.isActivated === false
                              ? "Activate submissions"
                              : "Pause submissions"}
                          </button>
                        </form>
                      ) : null}
                      <Link
                        href={`/admin/${journal.slug}`}
                        prefetch={true}
                        className="shrink-0 text-xs font-semibold text-[color:var(--color-accent)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-focus)]"
                      >
                        Open operations →
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {journals.length > 4 ? (
              <div className="border-t border-[color:var(--color-border)]/70 p-3 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllJournals(!showAllJournals)}
                  className="text-xs font-semibold text-[color:var(--color-accent)] hover:underline"
                >
                  {showAllJournals
                    ? "Show fewer journals ↑"
                    : `View all ${journals.length} journals ↓`}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* Platform staff */}
      <section>
        <SectionHeader>Platform staff</SectionHeader>
        <div className="mt-5 flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[color:var(--color-muted)]">
            <span className="font-semibold text-[color:var(--color-foreground)]">
              {staff.journalAdmins}
            </span>{" "}
            {pluralise(staff.journalAdmins, "Journal Admin", "Journal Admins")}
            <span className="mx-2 text-[color:var(--color-border-strong)]">
              ·
            </span>
            <span className="font-semibold text-[color:var(--color-foreground)]">
              {staff.editors}
            </span>{" "}
            {pluralise(staff.editors, "Editor", "Editors")} across active
            journals
          </p>
          <Link
            href="/admin/access"
            prefetch={true}
            className="shrink-0 text-xs font-semibold text-[color:var(--color-accent)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-focus)]"
          >
            Manage users →
          </Link>
        </div>
      </section>

      {/* Create / Edit Journal Metadata Modal */}
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
                  Full Journal Title *
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
                  Disciplinary Scope / Department
                </label>
                <input
                  type="text"
                  name="departmentName"
                  defaultValue={editingJournal?.department?.name ?? ""}
                  placeholder="e.g. Arts and Humanities"
                  className="app-field mt-1 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
                  Aims &amp; Scope Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingJournal?.description ?? ""}
                  placeholder="Brief description of the journal's disciplinary focus..."
                  className="app-field mt-1 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-[color:var(--color-border)] pt-3">
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
                <button
                  type="submit"
                  disabled={isPending}
                  className="button-primary text-xs"
                >
                  {isPending ? "Saving…" : "Save Journal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
