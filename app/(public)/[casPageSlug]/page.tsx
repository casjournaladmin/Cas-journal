import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CAS_STATIC_PAGES } from "@/lib/config/cas-pages";

const AUTHOR_SIDEBAR_LINKS = [
  { href: "/author-guidelines", label: "Author Guidelines" },
  { href: "/how-to-write", label: "How to Write a Journal Paper" },
  { href: "/submit", label: "Submit Your Paper" },
  { href: "/announcements", label: "Call for Papers" },
  { href: "/processing-charges", label: "Article Processing Charges" },
  { href: "/withdrawal-correction", label: "Article Withdrawal & Correction" },
  { href: "/copyright-form", label: "Copyright Form" },
  { href: "/apply-reviewer", label: "Become a Reviewer" },
  { href: "/editorial-board", label: "Join our Editorial Team" },
];

const POLICY_SIDEBAR_LINKS = [
  { href: "/ethics-malpractice", label: "Publication Ethics & Malpractice" },
  { href: "/peer-review-policy", label: "Peer Review Policy" },
  { href: "/open-access-policy", label: "Open Access Policy" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-conditions", label: "Terms & Conditions" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/manuscript-transfer-policy", label: "Manuscript Transfer Policy" },
  { href: "/ai-policy", label: "Artificial Intelligence (AI) Policy" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ casPageSlug: string }>;
}): Promise<Metadata> {
  const { casPageSlug } = await params;
  const page = CAS_STATIC_PAGES[casPageSlug];
  if (!page) return { title: "Page Not Found" };

  return {
    title: `${page.title.replace(/&amp;/g, "&")} | CAS Journals`,
    description: page.description,
  };
}

export default async function CasStaticPageRoute({
  params,
}: {
  params: Promise<{ casPageSlug: string }>;
}) {
  const { casPageSlug } = await params;
  const page = CAS_STATIC_PAGES[casPageSlug];

  if (!page) {
    notFound();
  }

  const sidebarLinks =
    page.sidebarType === "authors"
      ? AUTHOR_SIDEBAR_LINKS
      : page.sidebarType === "policies"
        ? POLICY_SIDEBAR_LINKS
        : null;

  const cleanTitle = page.title.replace(/&amp;/g, "&");
  const heroClass =
    page.slug === "indexing-abstracting"
      ? "cas-page-hero cas-page-hero-indexing"
      : page.sidebarType === "authors"
        ? "cas-page-hero cas-page-hero-authors"
        : "cas-page-hero";

  return (
    <div>
      <header className={heroClass}>
        <div className="cas-page-hero-inner">
          <div className="cas-breadcrumbs">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span>{cleanTitle}</span>
          </div>
          <h1 className="cas-page-title">{cleanTitle}</h1>
          <p className="cas-page-desc">{page.description}</p>
        </div>
      </header>

      <main className="cas-content-section">
        {sidebarLinks ? (
          <div className="cas-layout-with-sidebar">
            <div className="cas-sidebar">
              <div className="cas-sidebar-title">
                {page.sidebarType === "policies"
                  ? "Publishing Policies"
                  : "Author Resources"}
              </div>
              <ul className="cas-sidebar-menu">
                {sidebarLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={
                        item.href === `/${page.slug}` ? "active" : undefined
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="cas-main-card cas-prose"
              dangerouslySetInnerHTML={{ __html: page.htmlContent }}
            />
          </div>
        ) : (
          <div className="cas-layout-single">
            <div
              className="cas-main-card cas-prose"
              dangerouslySetInnerHTML={{ __html: page.htmlContent }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
