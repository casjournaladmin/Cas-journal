import Link from "next/link";
import { Container } from "@/components/ui/container";
import { publicSubmissionEntryPath } from "@/lib/auth/submission-entry";
import { activeJournalsConfig } from "@/lib/config/site";

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-24">
      <header className="cas-page-hero cas-page-hero-about">
        <div className="cas-page-hero-inner">
          <div className="cas-breadcrumbs">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span>About CAS Journals</span>
          </div>
          <h1 className="cas-page-title">
            Advancing Knowledge. Inspiring Growth.
          </h1>
          <p className="cas-page-desc">
            A trusted open-access platform for peer-reviewed academic publishing
            across the social sciences, arts, humanities, and allied fields.
          </p>
        </div>
      </header>

      <section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
            <div className="cas-main-card cas-prose space-y-8">
              <div>
                <h2>Platform Mission &amp; Scholarly Mandate</h2>
                <p>
                  CAS Journals is committed to advancing knowledge and
                  encouraging scholarly dialogue across a wide range of
                  disciplines. We provide a trusted platform for sharing
                  high-quality research and original ideas, reflecting our
                  dedication to academic excellence and intellectual growth.
                </p>
                <p>
                  All journals hosted on the CAS Journals platform operate under
                  rigorous double-anonymised peer review, assign permanent
                  Crossref Digital Object Identifiers (DOIs), and publish
                  immediately online under the Creative Commons Attribution 4.0
                  International License (CC-BY 4.0).
                </p>
              </div>

              <div>
                <h2>Our Scholarly Journals</h2>
                <div className="not-prose mt-6 grid gap-4">
                  {activeJournalsConfig.map((journal) => (
                    <Link
                      key={journal.slug}
                      href={`/journals/${journal.slug}`}
                      className="block rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition hover:border-[#0284c7]"
                    >
                      <div className="flex items-center justify-between font-mono text-xs text-[#0284c7]">
                        <span className="font-bold">{journal.shortName}</span>
                        <span>{journal.badge}</span>
                      </div>
                      <h3 className="mt-2 font-serif text-lg font-bold text-[color:var(--color-foreground)]">
                        {journal.name}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-muted)]">
                        {journal.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-card)]">
                <h3 className="font-serif text-base font-bold text-[color:var(--color-foreground)]">
                  Editorial Directorate
                </h3>
                <dl className="mt-4 space-y-3 text-xs">
                  <div>
                    <dt className="font-mono text-[10px] text-[color:var(--color-subtle)] uppercase">
                      Platform
                    </dt>
                    <dd className="mt-0.5 font-semibold text-[color:var(--color-foreground)]">
                      CAS Journals
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-[color:var(--color-subtle)] uppercase">
                      Editorial Email
                    </dt>
                    <dd className="mt-0.5 font-mono text-[#0284c7]">
                      editorial@casjournals.org
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-[color:var(--color-subtle)] uppercase">
                      Submissions Helpdesk
                    </dt>
                    <dd className="mt-0.5 font-mono text-[#0284c7]">
                      submissions@casjournals.org
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-[color:var(--color-subtle)] uppercase">
                      Open Access License
                    </dt>
                    <dd className="mt-0.5 text-[color:var(--color-muted)]">
                      Creative Commons Attribution (CC-BY 4.0)
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-card)]">
                <h3 className="font-serif text-base font-bold text-[color:var(--color-foreground)]">
                  Ready to Publish?
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-muted)]">
                  Submit your manuscript to our editorial board with zero
                  upfront submission fee.
                </p>
                <div className="mt-4">
                  <Link
                    href={publicSubmissionEntryPath}
                    className="cas-btn-primary w-full justify-center"
                  >
                    Submit Your Paper
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
