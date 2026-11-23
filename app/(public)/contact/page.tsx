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
  alternates: {
    canonical: "/contact",
  },
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
                <div className="my-5">
                  <a
                    href="https://wa.me/2347060608100"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#20ba5a] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] active:scale-[0.98]"
                    aria-label="Chat with us on WhatsApp (opens in new tab)"
                  >
                    <svg
                      className="size-5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>Chat with us on WhatsApp</span>
                  </a>
                </div>
                {journalMeta?.officeAddress ? (
                  <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                    <strong>Address:</strong> {journalMeta.officeAddress}
                  </p>
                ) : null}
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
                  <strong>Turnaround Time:</strong> Enquiries via WhatsApp are
                  addressed promptly during active office hours.
                </p>
                <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                  <strong>Manuscript Processing:</strong> Submission and
                  editorial evaluation operate continuously on a rolling
                  publication cycle.
                </p>
                <p style={{ fontSize: "14px", marginBottom: 0 }}>
                  <strong>Editorial Office:</strong> Dedicated assistance for
                  submission inquiries, APC waivers, and editorial coordination.
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
