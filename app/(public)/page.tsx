import Link from "next/link";

import { publicSubmissionEntryPath } from "@/lib/auth/submission-entry";
import { activeJournalsConfig } from "@/lib/config/site";
import { prisma } from "@/lib/db/prisma";
import { getJournalOrderPriority } from "@/lib/editorial/editorial-board-data";
import { getJournalActivationMap } from "@/lib/editorial/journal-activation";

export const dynamic = "force-dynamic";

const JOURNAL_CARD_META: Record<
  string,
  { image: string; badge: string; defaultDesc: string }
> = {
  existentia: {
    image: "/assets/images/journal-arts-humanities.jpg",
    badge: "Arts & Humanities",
    defaultDesc:
      "Critical inquiry, cultural philosophy, historical studies, literary criticism, and creative theoretical discourses.",
  },
  cjmr: {
    image: "/assets/images/journal-multidisciplinary.jpg",
    badge: "Multidisciplinary",
    defaultDesc:
      "Cross-disciplinary research, methodological innovation, and original scholarship bridging social sciences, humanities, and empirical sciences.",
  },
  izu: {
    image: "/assets/images/journal-governance-security.jpg",
    badge: "Critical Perspectives",
    defaultDesc:
      "Rigorous philosophical, social, and interdisciplinary critical perspectives addressing contemporary theoretical and practical questions.",
  },
  polis: {
    image: "/assets/images/journal-political-studies.jpg",
    badge: "Political Studies",
    defaultDesc:
      "Scholarly analysis of political theory, public policy, governance systems, international relations, and civic institutions.",
  },
};

export default async function Home() {
  const [
    currentIssueArticle,
    publishedArticlesCount,
    registeredDbJournals,
    activationMap,
  ] = await Promise.all([
    prisma.article.findFirst({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      include: {
        issue: {
          include: {
            volume: {
              include: {
                journal: {
                  select: {
                    name: true,
                    slug: true,
                    shortName: true,
                    department: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        authors: { orderBy: { position: "asc" } },
      },
    }),
    prisma.article.count({ where: { isPublished: true } }),
    prisma.journal.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        shortName: true,
        description: true,
        department: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    getJournalActivationMap(),
  ]);

  const catalogJournals =
    registeredDbJournals.length > 0
      ? registeredDbJournals
          .map((j) => {
            const visual = JOURNAL_CARD_META[j.slug];
            return {
              slug: j.slug,
              name: j.name,
              shortName: j.shortName,
              badge: visual?.badge ?? j.department?.name ?? j.shortName,
              image:
                visual?.image ?? "/assets/images/journal-multidisciplinary.jpg",
              description:
                j.description ??
                visual?.defaultDesc ??
                "Peer-reviewed open-access scholarly journal.",
              isSubmissionOpen: activationMap[j.slug] === true,
            };
          })
          .sort((a, b) => {
            const diff =
              getJournalOrderPriority(a.slug) - getJournalOrderPriority(b.slug);
            if (diff !== 0) return diff;
            return a.name.localeCompare(b.name);
          })
      : activeJournalsConfig.map((j) => ({
          slug: j.slug,
          name: j.name,
          shortName: j.shortName,
          badge: j.badge,
          image: j.image,
          description: j.description,
          isSubmissionOpen: activationMap[j.slug] === true,
        }));

  const hasActiveJournals = catalogJournals.some((j) => j.isSubmissionOpen);

  return (
    <div>
      {/* SECTION 1: HERO */}
      <section className="cas-home-hero" id="home">
        <div className="cas-home-hero-inner">
          <div className="cas-hero-editorial-content">
            <h1 className="cas-hero-headline">
              Advancing Knowledge.
              <br />
              Inspiring Growth.
            </h1>
            <p className="cas-hero-description">
              We are committed to advancing knowledge and encouraging scholarly
              dialogue across a wide range of disciplines. We provide a trusted
              platform for sharing high-quality research and original ideas,
              reflecting our dedication to academic excellence and intellectual
              growth.
            </p>
            <div className="cas-hero-actions">
              <Link
                href={publicSubmissionEntryPath}
                className="cas-btn-primary"
              >
                Submit Your Paper
              </Link>
              <a href="#journals" className="cas-btn-secondary">
                Explore Our Journals
              </a>
            </div>
          </div>

          <div className="cas-hero-discovery">
            <span className="cas-discovery-label">
              Indexed in &amp; Discoverable through:
            </span>
            <div className="cas-discovery-list">
              <div className="cas-discovery-item" title="Google Scholar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/logos/google-scholar.svg"
                  alt="Google Scholar"
                  className="cas-discovery-icon"
                />
                <span className="cas-discovery-text">Google Scholar</span>
              </div>
              <div className="cas-discovery-item" title="Crossref">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/logos/crossref-white.svg"
                  alt="Crossref"
                  className="cas-discovery-img-crossref"
                />
              </div>
              <div className="cas-discovery-item" title="OpenAlex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/logos/openalex-white.png"
                  alt="OpenAlex"
                  className="cas-discovery-img-openalex"
                />
              </div>
              <div className="cas-discovery-item" title="Scilit">
                <span className="cas-discovery-wordmark-scilit">Scilit</span>
              </div>
              <div className="cas-discovery-item" title="Semantic Scholar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/logos/semantic-scholar-white.svg"
                  alt="Semantic Scholar"
                  className="cas-discovery-img-semanticscholar"
                />
              </div>
              <div className="cas-discovery-item" title="The Lens">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/logos/lens-white.png"
                  alt="The Lens"
                  className="cas-discovery-img-lens"
                />
              </div>
              <div className="cas-discovery-item" title="Dimensions">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/logos/dimensions-white.png"
                  alt="Dimensions"
                  className="cas-discovery-img-dimensions"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHY AUTHORS CHOOSE OUR JOURNALS */}
      <section className="cas-section" id="why-choose">
        <div className="cas-section-header">
          <div className="cas-section-tag">Editorial Excellence</div>
          <h2 className="cas-section-title">Why Authors Choose Our Journals</h2>
          <p className="cas-section-subtitle">
            Dedicated to rigorous scholarship, author rights retention, and
            global research discoverability.
          </p>
        </div>

        <div className="cas-why-container">
          <div className="cas-why-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/features-researcher.jpg"
              alt="Academic researcher at desk evaluating manuscripts"
            />
          </div>

          <div className="cas-why-list">
            <div className="cas-why-card">
              <div className="cas-why-num">01</div>
              <div>
                <h4>Rigorous peer review</h4>
                <p>
                  Double blind peer-review by qualified reviewers across fields
                  to ensure impartial, constructive evaluation.
                </p>
              </div>
            </div>

            <div className="cas-why-card">
              <div className="cas-why-num">02</div>
              <div>
                <h4>Open access</h4>
                <p>
                  All our Journals are free to read worldwide the moment it is
                  published under CC-BY 4.0 licence.
                </p>
              </div>
            </div>

            <div className="cas-why-card">
              <div className="cas-why-num">03</div>
              <div>
                <h4>Permanent DOI</h4>
                <p>
                  Every published paper is assigned a DOI from Crossref,
                  ensuring permanent citation links and metadata harvesting.
                </p>
              </div>
            </div>

            <div className="cas-why-card">
              <div className="cas-why-num">04</div>
              <div>
                <h4>Multidisciplinary scope</h4>
                <p>
                  Open to research across the Social sciences, humanities, and
                  allied fields on a continuous rolling basis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: ARTICLE PROCESSING CHARGES */}
      <section className="cas-section" style={{ paddingTop: 0 }} id="apc">
        <div className="cas-apc-box">
          <div className="cas-apc-pill-tag">
            Article Processing Charge &bull; Transparent Policies
          </div>
          <h2
            style={{
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "32px",
              fontWeight: 700,
              color: "var(--cas-navy)",
              marginBottom: "12px",
            }}
          >
            Transparent, Sustainable Open-Access Publishing
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "var(--cas-text-muted)",
              maxWidth: "680px",
              margin: "0 auto 24px",
            }}
          >
            To sustain peer review management, copyediting, Crossref DOI
            registration, and global digital preservation, a modest single
            publication fee applies.
          </p>

          <div className="cas-apc-free-banner">
            &check; Submission is Free &mdash; Zero Upfront Submission Fee
          </div>

          <div className="cas-apc-rates">
            <div className="cas-apc-card">
              <div className="region">Nigerian Authors</div>
              <div className="price">&#8358;30,000</div>
              <div className="timing">Paid Only After Acceptance</div>
            </div>
            <div className="cas-apc-card">
              <div className="region">Foreign / International Authors</div>
              <div className="price">US $90</div>
              <div className="timing">Paid Only After Acceptance</div>
            </div>
          </div>

          <p className="cas-apc-waiver-text">
            <strong>Waivers and Discounts:</strong> We consider waiver or
            discount requests on a case-by-case basis, particularly for authors
            facing financial hardship and from developing countries. Requests
            should be made to the editorial office at the point of submission.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/processing-charges" className="cas-btn-primary">
              Learn More About Fees &amp; Waivers
            </Link>
            <Link
              href={publicSubmissionEntryPath}
              className="cas-btn-secondary"
            >
              Submit Manuscript
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: OUR JOURNALS (FEATURED FOUR) */}
      <section
        className="cas-section"
        id="journals"
        style={{ paddingTop: "20px" }}
      >
        <div className="cas-section-header">
          <div className="cas-section-tag">Scholarly Publications</div>
          <h2 className="cas-section-title">Our Journals</h2>
          <p className="cas-section-subtitle">
            Peer-reviewed academic journals across the arts, humanities,
            political studies, critical perspectives, and multidisciplinary
            research.
          </p>
        </div>

        <div className="cas-journals-4grid">
          {catalogJournals.map((journal) => (
            <Link
              key={journal.slug}
              href={`/journals/${journal.slug}`}
              className="cas-journal-card group block no-underline"
            >
              <div className="cas-journal-card-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={journal.image} alt={journal.name} />
                <span className="cas-journal-card-badge">{journal.badge}</span>
              </div>
              <div className="cas-journal-card-body">
                <h3 className="cas-journal-card-title group-hover:text-[#0284c7]">
                  {journal.name}
                </h3>
                <p className="cas-journal-card-desc">{journal.description}</p>
                <div className="cas-journal-card-footer">
                  <span>
                    {journal.isSubmissionOpen
                      ? "Accepting Submissions"
                      : "Submissions Opening Soon"}
                  </span>
                  <span>Free Sub. &bull; &#8358;30k / $90*</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 5: HOW TO PUBLISH YOUR PAPER (SIX STEPS) */}
      <section className="cas-section" id="publish-steps">
        <div className="cas-section-header">
          <div className="cas-section-tag">Author Journey</div>
          <h2 className="cas-section-title">How to Publish Your Paper</h2>
          <p className="cas-section-subtitle">
            A clear, transparent six-stage editorial workflow from initial
            submission to global online publication.
          </p>
        </div>

        <div className="cas-steps-6grid">
          <div className="cas-step-card">
            <div className="cas-step-header">
              <span className="cas-step-num">01</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#0284c7",
                  background: "#e0f2fe",
                  padding: "4px 10px",
                  borderRadius: "999px",
                }}
              >
                Step 1
              </span>
            </div>
            <h3 className="cas-step-title">Submit</h3>
            <p className="cas-step-desc">
              Submit your manuscript and author details through the online
              submission form. Initial submission is completely free with no fee
              required to begin review.
            </p>
          </div>

          <div className="cas-step-card">
            <div className="cas-step-header">
              <span className="cas-step-num">02</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#0284c7",
                  background: "#e0f2fe",
                  padding: "4px 10px",
                  borderRadius: "999px",
                }}
              >
                Step 2
              </span>
            </div>
            <h3 className="cas-step-title">Peer Review</h3>
            <p className="cas-step-desc">
              Qualified reviewers review your paper and return a decision. All
              evaluations are conducted via double-anonymised assessment to
              guarantee fairness and rigour.
            </p>
          </div>

          <div className="cas-step-card">
            <div className="cas-step-header">
              <span className="cas-step-num">03</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#0284c7",
                  background: "#e0f2fe",
                  padding: "4px 10px",
                  borderRadius: "999px",
                }}
              >
                Step 3
              </span>
            </div>
            <h3 className="cas-step-title">Acceptance</h3>
            <p className="cas-step-desc">
              On acceptance, confirm your details and complete the copyright
              form. Authors retain full copyright under Creative Commons
              Attribution (CC-BY 4.0).
            </p>
          </div>

          <div className="cas-step-card">
            <div className="cas-step-header">
              <span className="cas-step-num">04</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#0284c7",
                  background: "#e0f2fe",
                  padding: "4px 10px",
                  borderRadius: "999px",
                }}
              >
                Step 4
              </span>
            </div>
            <h3 className="cas-step-title">Processing</h3>
            <p className="cas-step-desc">
              Complete any applicable publication charge (&#8358;30,000 for
              Nigerian authors / US $90 for foreign authors). Eligible waivers
              are applied as approved.
            </p>
          </div>

          <div className="cas-step-card">
            <div className="cas-step-header">
              <span className="cas-step-num">05</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#0284c7",
                  background: "#e0f2fe",
                  padding: "4px 10px",
                  borderRadius: "999px",
                }}
              >
                Step 5
              </span>
            </div>
            <h3 className="cas-step-title">Publication</h3>
            <p className="cas-step-desc">
              Your paper is published online with a permanent Crossref DOI
              assigned, downloadable PDF, and automated distribution to indexing
              databases.
            </p>
          </div>

          <div className="cas-step-card">
            <div className="cas-step-header">
              <span className="cas-step-num">06</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#0284c7",
                  background: "#e0f2fe",
                  padding: "4px 10px",
                  borderRadius: "999px",
                }}
              >
                Step 6
              </span>
            </div>
            <h3 className="cas-step-title">Online-Only Publication</h3>
            <p className="cas-step-desc">
              All our Journals are published online only. Immediate open access
              allows researchers, practitioners, and students worldwide to
              access your work unrestricted.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: CURRENT ISSUE */}
      <section
        className="cas-section"
        id="current-issue"
        style={{ paddingTop: "20px" }}
      >
        <div className="cas-current-card">
          <div className="cas-current-card-body">
            <div className="cas-section-tag" style={{ textAlign: "left" }}>
              {currentIssueArticle
                ? `${currentIssueArticle.issue.volume.journal.shortName} · Vol. ${currentIssueArticle.issue.volume.number}, Issue ${currentIssueArticle.issue.number}`
                : "Volume 1 Compilation"}
            </div>
            <h2
              style={{
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "32px",
                fontWeight: 700,
                color: "var(--cas-navy)",
                marginBottom: "16px",
              }}
            >
              {currentIssueArticle ? (
                <Link
                  href={`/articles/${currentIssueArticle.slug}`}
                  className="hover:text-[#0284c7]"
                >
                  {currentIssueArticle.title}
                </Link>
              ) : (
                "Current Issue — Inaugural Volume 1 (2026)"
              )}
            </h2>
            <p
              style={{
                fontSize: "15px",
                color: "var(--cas-text-muted)",
                lineHeight: 1.6,
                marginBottom: "20px",
              }}
            >
              {currentIssueArticle?.abstract ??
                "CAS Journals operates on a continuous rolling publication model. Accepted original research papers, structured reviews, and scholarly case studies are typeset and published online immediately upon final editorial sign-off."}
            </p>
            <div
              style={{
                background: "#f0f9ff",
                borderLeft: "4px solid var(--cas-blue)",
                padding: "16px",
                borderRadius: "0 10px 10px 0",
                marginBottom: "24px",
                fontSize: "14px",
                color: "#0f172a",
              }}
            >
              {publishedArticlesCount > 0 ? (
                <>
                  <strong>{publishedArticlesCount} Published Papers:</strong>{" "}
                  Explore full-text open-access articles across our journals or
                  submit your manuscript for the current rolling issue.
                </>
              ) : hasActiveJournals ? (
                <>
                  <strong>Open Call for Volume 1:</strong> Submissions are open
                  across active disciplinary journals. Accepted papers receive
                  instant Crossref DOI activation.
                </>
              ) : (
                <>
                  <strong>Inaugural Volume 1 (2026) in Preparation:</strong>{" "}
                  Submissions opening soon across all disciplinary journals.
                  Review author guidelines to prepare your manuscript.
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link
                href={
                  hasActiveJournals
                    ? publicSubmissionEntryPath
                    : "/author-guidelines"
                }
                className="cas-btn-primary"
              >
                {hasActiveJournals
                  ? "Submit to Current Volume"
                  : "Review Author Guidelines"}
              </Link>
              <Link href="/current-issue" className="cas-btn-secondary">
                Current Issue Details
              </Link>
            </div>
          </div>
          <div className="cas-current-card-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                currentIssueArticle?.coverImageUrl ??
                "/assets/images/scope-library.jpg"
              }
              alt="Grand scholarly research library hall — CAS Journals"
            />
          </div>
        </div>
      </section>

      {/* SECTION 7: INDEXING & DISCOVERABILITY */}
      <section
        className="cas-section"
        id="indexing"
        style={{ paddingTop: "20px" }}
      >
        <div className="cas-section-header">
          <div className="cas-section-tag">Global Dissemination</div>
          <h2 className="cas-section-title">Indexing &amp; Discoverability</h2>
          <p className="cas-section-subtitle">
            Connecting your published scholarship to worldwide bibliographic
            databases, citation networks, and open research search engines.
          </p>
        </div>

        <div className="cas-indexing-7grid">
          <div className="cas-indexing-box">
            <h4>Google Scholar</h4>
            <p>Comprehensive academic search &amp; citation metrics</p>
          </div>
          <div className="cas-indexing-box">
            <h4>Crossref</h4>
            <p>Persistent DOIs &amp; machine-readable metadata</p>
          </div>
          <div className="cas-indexing-box">
            <h4>OpenAlex</h4>
            <p>Global open knowledge graph &amp; bibliometrics</p>
          </div>
          <div className="cas-indexing-box">
            <h4>Scilit</h4>
            <p>Scientific literature automated indexing crawler</p>
          </div>
          <div className="cas-indexing-box">
            <h4>Semantic Scholar</h4>
            <p>AI-driven semantic paper and citation explorer</p>
          </div>
          <div className="cas-indexing-box">
            <h4>Lens</h4>
            <p>Scholarly literature &amp; open patent mapping</p>
          </div>
          <div className="cas-indexing-box">
            <h4>Dimensions</h4>
            <p>Linked research insights, citations &amp; grants</p>
          </div>
        </div>
      </section>

      {/* SECTION 8: FINAL CTA */}
      <section className="cas-final-cta-section" id="final-cta">
        <h2 className="cas-final-cta-title">Ready to Publish Your Research?</h2>
        <p className="cas-final-cta-desc">
          Join the scholars who trust our Journals for rigorous, open-access,
          peer-reviewed publication. Share your research with a community
          committed to knowledge and excellence.
        </p>
        <div className="cas-final-cta-btns">
          <Link
            href={publicSubmissionEntryPath}
            className="cas-btn-primary"
            style={{
              background: "#ffffff",
              color: "var(--cas-navy)",
              borderColor: "#ffffff",
            }}
          >
            Submit Your Paper
          </Link>
          <Link
            href="/contact"
            className="cas-btn-secondary"
            style={{
              background: "rgba(3, 43, 69, 0.45)",
              color: "#ffffff",
              borderColor: "rgba(240, 249, 255, 0.6)",
            }}
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
