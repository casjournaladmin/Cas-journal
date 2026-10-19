import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { activeJournalsConfig } from "@/lib/config/site";
import { getJournalEditorialBoard } from "@/lib/editorial/editorial-board-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editorial Team & Governance | CAS Journals",
  description:
    "Editorial board leadership, governance structure, and call for expressions of interest across CAS Journals.",
};

export default async function EditorialBoardPage() {
  const journalBoards = await Promise.all(
    activeJournalsConfig.map(async (journal) => ({
      journal,
      members: await getJournalEditorialBoard(journal.slug),
    })),
  );

  return (
    <div className="space-y-16 pb-24">
      {/* CAS Page Hero */}
      <header className="cas-page-hero">
        <div className="cas-page-hero-inner">
          <div className="cas-breadcrumbs">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span>Editorial Team</span>
          </div>
          <h1 className="cas-page-title">Editorial Boards &amp; Governance</h1>
          <p className="cas-page-desc">
            Distinguished academic leadership overseeing peer review rigour,
            publication ethics, and scholarly excellence across CAS Journals.
          </p>
        </div>
      </header>

      {/* Journal Editorial Boards */}
      <section>
        <Container className="space-y-10">
          {journalBoards.map(({ journal, members }) => {
            const chiefEditor = members.find(
              (m) =>
                m.category === "CHIEF_EDITOR" ||
                m.category === "EDITOR_IN_CHIEF",
            );
            const otherMembers = members.filter(
              (m) =>
                m.category !== "CHIEF_EDITOR" &&
                m.category !== "EDITOR_IN_CHIEF",
            );

            return (
              <div
                key={journal.slug}
                className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-card)] sm:p-8"
              >
                <div className="flex flex-col gap-3 border-b border-[color:var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="inline-block rounded-full bg-sky-500/10 px-3 py-1 font-mono text-xs font-bold text-[#0284c7] uppercase">
                      {journal.shortName} &bull; {journal.badge}
                    </span>
                    <h2 className="mt-2 font-serif text-2xl font-bold text-[color:var(--color-foreground)]">
                      {journal.name}
                    </h2>
                  </div>
                  <Link
                    href={`/journals/${journal.slug}`}
                    className="text-xs font-semibold text-[#0284c7] hover:underline"
                  >
                    View Journal Portal →
                  </Link>
                </div>

                {members.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center">
                    <p className="font-serif text-sm font-semibold text-[color:var(--color-foreground)]">
                      Editorial Board Roster Pending Publication
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                      The verified editorial board roster for {journal.name}{" "}
                      will be published shortly by the editorial office.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    {chiefEditor ? (
                      <div className="rounded-xl border border-sky-300/50 bg-sky-50/70 p-5 shadow-sm dark:border-sky-800/60 dark:bg-sky-950/40">
                        <span className="inline-block rounded-md bg-[#0284c7] px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-white uppercase">
                          {chiefEditor.role}
                        </span>
                        <h3 className="mt-2.5 font-serif text-xl font-bold text-[color:var(--color-foreground)]">
                          {chiefEditor.name}
                        </h3>
                        {chiefEditor.affiliation?.trim() ? (
                          <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                            {chiefEditor.affiliation}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {otherMembers.length > 0 ? (
                      <div>
                        <h4 className="font-mono text-xs font-bold tracking-wider text-[color:var(--color-subtle)] uppercase">
                          Editorial Board Members
                        </h4>
                        <div
                          className={`mt-3 grid gap-3.5 ${
                            otherMembers.length === 1
                              ? "sm:grid-cols-2"
                              : "sm:grid-cols-2 lg:grid-cols-3"
                          }`}
                        >
                          {otherMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex flex-col justify-between rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-serif text-sm font-semibold text-[color:var(--color-foreground)]">
                                  {member.name}
                                </span>
                                <span className="shrink-0 rounded bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#0284c7]">
                                  {member.role}
                                </span>
                              </div>
                              {member.affiliation?.trim() ? (
                                <p className="mt-1.5 text-xs text-[color:var(--color-muted)]">
                                  {member.affiliation}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </Container>
      </section>

      {/* Governance & Call for Expressions of Interest (from CAS template editorial-team.html) */}
      <section>
        <Container>
          <div className="cas-main-card cas-prose mx-auto max-w-4xl">
            <p
              className="cas-lead"
              style={{
                fontSize: "16px",
                color: "#075985",
                fontWeight: 500,
                marginBottom: "24px",
              }}
            >
              CAS Journals operates an institutional governance model overseen
              by dedicated editorial boards, academic societies, and independent
              disciplinary scholars.
            </p>

            <h2>Editorial Governance Structure</h2>
            <p>
              Each journal on the CAS Journals platform is led by an
              Editor-in-Chief, supported by an Associate Editorial Board and
              international Advisory Panels across academic disciplines:
            </p>

            <ul>
              <li>
                <strong>Editors-in-Chief:</strong> Provide scholarly direction,
                initial manuscript triage, reviewer assignments, and final
                publication decisions.
              </li>
              <li>
                <strong>Associate Editors:</strong> Oversee subject-specific
                subfields, evaluate reviewer recommendations, and ensure
                editorial turnaround timelines.
              </li>
              <li>
                <strong>Editorial Advisory Board:</strong> Prominent senior
                scholars who advise on journal policy, indexing standards, and
                special thematic issues.
              </li>
              <li>
                <strong>Managing Editors:</strong> Oversee production
                formatting, Crossref DOI minting, plagiarism verification, and
                archiving compliance.
              </li>
            </ul>

            <h2>Call for Expressions of Interest</h2>
            <p>
              In accordance with our platform expansion for 2026, CAS Journals
              welcomes expressions of interest from distinguished academics to
              serve as Section Editors, Thematic Guest Editors, or Advisory
              Board Members.
            </p>

            <div className="cas-callout">
              <div className="cas-callout-title">
                Institutional Affiliation Note
              </div>
              <p>
                In keeping with our institutional publishing charter, editorial
                board appointments are conducted in consultation with partner
                academic societies, institutional faculties, and COPE governance
                guidelines.
              </p>
            </div>

            <h2>Contact the Editorial Secretariat</h2>
            <p>
              Qualified professors and senior researchers interested in
              contributing to journal editorial leadership are invited to send
              an academic dossier to the editorial office:
            </p>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid var(--cas-border)",
                borderRadius: "12px",
                padding: "24px",
                marginTop: "20px",
              }}
            >
              <p>
                <strong>Editorial Recruitment Secretariat:</strong>
                <br />
                CAS Journals Publishing Directorate
                <br />
                Email:{" "}
                <a
                  href="mailto:editorial@casjournals.org"
                  style={{ color: "#0284c7" }}
                >
                  editorial@casjournals.org
                </a>
                <br />
                Response window: 5&ndash;7 business days
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
