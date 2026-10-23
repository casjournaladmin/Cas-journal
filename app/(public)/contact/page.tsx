import type { Metadata } from "next";
import Link from "next/link";
import { JournalNavigation } from "@/components/journal/journal-navigation";
import { publicSubmissionEntryPath } from "@/lib/auth/submission-entry";
import { activeJournalsConfig } from "@/lib/config/site";
import {
  getJournalMetadata,
  resolveCanonicalJournalSlug,
} from "@/lib/editorial/editorial-board-data";

export const metadata: Metadata = {
  title: "Contact Editorial Office | CASJOURNALS",
  description:
    "Direct communication channels, editorial helpdesk, and author support inquiry portal for CASJOURNALS.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ journal?: string }>;
}) {
  const { journal } = (await searchParams) ?? {};
  const canonical = journal ? resolveCanonicalJournalSlug(journal) : null;
  const journalMeta = canonical ? getJournalMetadata(canonical) : null;

  return (
    <div>
      <header className="cas-page-hero cas-page-hero-contact">
        <div className="cas-page-hero-inner">
          <div className="cas-breadcrumbs">
            <Link href="/">Home</Link>
            {journalMeta ? (
              <>
                <span className="sep">/</span>
                <Link href={`/journals/${journalMeta.slug}`}>
                  {journalMeta.shortName}
                </Link>
              </>
            ) : null}
            <span className="sep">/</span>
            <span>Contact</span>
          </div>
          <h1 className="cas-page-title">
            {journalMeta
              ? `Contact ${journalMeta.shortName} Editorial Office`
              : "Contact Editorial Office"}
          </h1>
          <p className="cas-page-desc">
            {journalMeta
              ? `Direct communication channels and author support for ${journalMeta.title}.`
              : "Direct communication channels, editorial helpdesk, and author support inquiry portal."}
          </p>
        </div>
      </header>

      {journalMeta ? (
        <JournalNavigation
          journalSlug={journalMeta.slug}
          shortName={journalMeta.shortName}
        />
      ) : null}

      <main className="cas-content-section">
        <div className="cas-layout-single">
          <div className="cas-main-card cas-prose">
            <p
              className="cas-lead"
              style={{
                fontSize: "16px",
                color: "#075985",
                fontWeight: 500,
                marginBottom: "24px",
              }}
            >
              Get in touch with the CASJOURNALS editorial management office for
              inquiries regarding manuscript submissions, peer review status,
              APC waivers, or institutional partnerships.
            </p>

            <div className="not-prose mb-9 grid gap-6 md:grid-cols-2">
              <div
                style={{
                  background: "#f0f9ff",
                  border: "1px solid var(--cas-border)",
                  borderRadius: "14px",
                  padding: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    color: "var(--cas-navy)",
                    marginTop: 0,
                    marginBottom: "12px",
                  }}
                >
                  {journalMeta
                    ? `${journalMeta.shortName} Editorial Office`
                    : "Editorial Office"}
                </h3>
                <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${journalMeta?.contactEmail || "editorial@casjournals.org"}`}
                    style={{ color: "#0284c7" }}
                  >
                    {journalMeta?.contactEmail || "editorial@casjournals.org"}
                  </a>
                </p>
                {journalMeta?.contactPhone ? (
                  <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                    <strong>Phone:</strong> {journalMeta.contactPhone}
                  </p>
                ) : null}
                {journalMeta?.officeAddress ? (
                  <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                    <strong>Address:</strong> {journalMeta.officeAddress}
                  </p>
                ) : (
                  <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                    <strong>Submissions Helpdesk:</strong>{" "}
                    <a
                      href="mailto:submissions@casjournals.org"
                      style={{ color: "#0284c7" }}
                    >
                      submissions@casjournals.org
                    </a>
                  </p>
                )}
                <p style={{ fontSize: "14px", marginBottom: 0 }}>
                  <strong>Office Hours:</strong> Monday &ndash; Friday, 9:00 AM
                  &ndash; 5:00 PM (GMT+1)
                </p>
              </div>

              <div
                style={{
                  background: "#f0f9ff",
                  border: "1px solid var(--cas-border)",
                  borderRadius: "14px",
                  padding: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    color: "var(--cas-navy)",
                    marginTop: 0,
                    marginBottom: "12px",
                  }}
                >
                  Author Support &amp; Enquiries
                </h3>
                <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                  <strong>Turnaround Time:</strong> Inquiries are acknowledged
                  within 2 working days.
                </p>
                <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                  <strong>APC &amp; Waiver Queries:</strong>{" "}
                  <a
                    href="mailto:finance@casjournals.org"
                    style={{ color: "#0284c7" }}
                  >
                    finance@casjournals.org
                  </a>
                </p>
                <p style={{ fontSize: "14px", marginBottom: 0 }}>
                  <strong>Reviewer Coordination:</strong>{" "}
                  <a
                    href="mailto:reviewers@casjournals.org"
                    style={{ color: "#0284c7" }}
                  >
                    reviewers@casjournals.org
                  </a>
                </p>
              </div>
            </div>

            <h2>Active Journals Under CAS Editorial Management</h2>
            <ul>
              {activeJournalsConfig.map((journal) => (
                <li key={journal.slug}>
                  <Link
                    href={`/journals/${journal.slug}`}
                    style={{ color: "#0284c7", fontWeight: 600 }}
                  >
                    {journal.name} ({journal.shortName})
                  </Link>
                </li>
              ))}
            </ul>

            <h2>Direct Author &amp; Editorial Portal</h2>
            <p>
              Authors who have submitted a manuscript or opened a submission
              request can message the assigned managing editor directly through
              the authenticated Author Workspace chatbox.
            </p>

            <div className="not-prose mt-6 flex flex-wrap gap-4">
              <Link
                href={publicSubmissionEntryPath}
                className="cas-btn-primary"
              >
                Submit Your Paper
              </Link>
              <Link href="/login" className="cas-btn-secondary">
                Sign In to Author Portal
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
