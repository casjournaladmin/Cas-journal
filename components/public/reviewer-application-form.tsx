"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { applyAsReviewerAction } from "@/app/(public)/apply-reviewer/actions";
import { activeJournalsConfig } from "@/lib/config/site";

export type ReviewerJournalOption = {
  slug: string;
  name: string;
  shortName: string | null;
};

const DEFAULT_JOURNAL_OPTIONS: ReviewerJournalOption[] =
  activeJournalsConfig.map((j) => ({
    slug: j.slug,
    name: j.name,
    shortName: j.shortName,
  }));

export function ReviewerApplicationForm({
  defaultJournal = "ALL",
  initialFullName = "",
  initialEmail = "",
  applicantUserId,
  journals = DEFAULT_JOURNAL_OPTIONS,
}: {
  defaultJournal?: string;
  initialFullName?: string;
  initialEmail?: string;
  applicantUserId?: string;
  journals?: ReviewerJournalOption[];
}) {
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await applyAsReviewerAction({}, formData);
      if (res.success && res.trackingCode) {
        setSubmittedCode(res.trackingCode);
      } else {
        setErrorMessage(
          res.error ||
            "Failed to submit application. Please verify your entries.",
        );
      }
    });
  };

  if (submittedCode) {
    return (
      <div className="rounded-2xl border border-sky-400/40 bg-[color:var(--color-surface-raised)] p-8 text-center shadow-xl">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-sky-500/20 text-[#0284c7]">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-[color:var(--color-foreground)]">
          Reviewer Application Submitted
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[color:var(--color-muted)]">
          Thank you for applying to serve as a peer reviewer and editorial
          referee for CAS Journals. Your academic credentials and specialization
          profile have been registered.
        </p>

        <div className="mt-6 inline-block rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 py-3">
          <p className="font-mono text-[11px] text-[color:var(--color-subtle)] uppercase">
            Application Reference Code
          </p>
          <p className="mt-0.5 font-mono text-lg font-bold text-[color:var(--color-accent)]">
            {submittedCode}
          </p>
        </div>

        <p className="mt-4 text-[11px] text-[color:var(--color-subtle)]">
          The editorial directorate will review your application. If selected,
          you will receive manuscript review invitations matching your research
          specialization.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
            className="button-primary px-5 py-2.5 text-xs font-semibold"
          >
            Return to Homepage
          </Link>
          <Link
            href="/archives"
            className="button-secondary px-5 py-2.5 text-xs font-semibold"
          >
            Browse Archives
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm sm:p-8"
    >
      {errorMessage ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/15 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      ) : null}

      {applicantUserId ? (
        <input type="hidden" name="applicantUserId" value={applicantUserId} />
      ) : null}

      <div className="space-y-1 border-b border-[color:var(--color-border)] pb-4">
        <h2 className="font-serif text-xl font-semibold text-[color:var(--color-foreground)]">
          Applicant Information
        </h2>
        <p className="text-xs text-[color:var(--color-muted)]">
          Please provide accurate details regarding your academic position and
          domain expertise.
        </p>
      </div>

      {/* Row 1: Academic Title & Full Name */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
            Academic Title *
          </label>
          <select
            name="academicTitle"
            defaultValue="Dr."
            required
            className="app-field mt-1 w-full text-xs"
          >
            <option value="Prof.">Prof.</option>
            <option value="Assoc. Prof.">Assoc. Prof.</option>
            <option value="Dr.">Dr.</option>
            <option value="Mr.">Mr.</option>
            <option value="Mrs.">Mrs.</option>
            <option value="Ms.">Ms.</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
            Full Academic Name *
          </label>
          <input
            type="text"
            name="fullName"
            defaultValue={initialFullName}
            required
            placeholder="e.g. Sarah Okonjo"
            className="app-field mt-1 w-full text-xs"
          />
        </div>
      </div>

      {/* Row 2: Email & Phone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
            Official Academic Email *
          </label>
          <input
            type="email"
            name="email"
            defaultValue={initialEmail}
            required
            placeholder="reviewer@university.edu"
            className="app-field mt-1 w-full text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
            Phone / WhatsApp Number
          </label>
          <input
            type="tel"
            name="phone"
            placeholder="+234 800 000 0000"
            className="app-field mt-1 w-full text-xs"
          />
        </div>
      </div>

      {/* Row 3: Affiliation & Academic Rank */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
            Institutional Affiliation (University &amp; Department) *
          </label>
          <input
            type="text"
            name="affiliation"
            required
            placeholder="e.g. Department of Political Science, University of..."
            className="app-field mt-1 w-full text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
            Academic Rank / Highest Qualification *
          </label>
          <input
            type="text"
            name="academicRank"
            required
            placeholder="e.g. Professor, Senior Lecturer, PhD"
            className="app-field mt-1 w-full text-xs"
          />
        </div>
      </div>

      {/* Row 4: Journal of Interest & Profile URL */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
            Journal of Primary Interest *
          </label>
          <select
            name="targetJournal"
            defaultValue={defaultJournal}
            className="app-field mt-1 w-full text-xs"
          >
            <option value="ALL">All CAS Journals</option>
            {journals.map((j) => (
              <option key={j.slug} value={j.slug}>
                {j.name} ({j.shortName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
            ORCID iD / Google Scholar Profile URL (Optional)
          </label>
          <input
            type="url"
            name="profileUrl"
            placeholder="https://orcid.org/0000-0000-0000-0000"
            className="app-field mt-1 w-full text-xs"
          />
        </div>
      </div>

      {/* Specialization Keywords */}
      <div>
        <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
          Research Specialization &amp; Subject Keywords *
        </label>
        <input
          type="text"
          name="specializationKeywords"
          required
          placeholder="e.g. Political Philosophy, Public Policy, Comparative Politics, Research Methodology"
          className="app-field mt-1 w-full text-xs"
        />
        <p className="mt-1 text-[11px] text-[color:var(--color-subtle)]">
          Separate keywords with commas. Used by editors to match relevant
          manuscripts with your expertise.
        </p>
      </div>

      {/* Statement of Interest */}
      <div>
        <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
          Brief Statement of Reviewing Experience / Research Background
        </label>
        <textarea
          name="statement"
          rows={3}
          placeholder="Summarize your academic refereeing experience, key publication areas, and availability..."
          className="app-field mt-1 w-full text-xs"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-[color:var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="text-center text-xs font-medium text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] sm:text-left"
        >
          ← Cancel and return home
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="button-primary w-full px-6 py-3 text-xs font-semibold shadow-md transition disabled:opacity-50 sm:w-auto"
        >
          {isPending
            ? "Submitting Application…"
            : "Submit Reviewer Application →"}
        </button>
      </div>
    </form>
  );
}
