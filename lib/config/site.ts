export type PublicJournalConfigItem = {
  name: string;
  shortName: string;
  slug: string;
  aliasSlug?: string;
  href: string;
  badge: string;
  image: string;
  description: string;
};

export type PublicNavigationSubItem = {
  label: string;
  shortName: string;
  href: string;
  description: string;
};

export const activeJournalsConfig: readonly PublicJournalConfigItem[] = [
  {
    name: "Existentia: Concrescence Journal of Arts and Humanities",
    shortName: "EXISTENTIA",
    slug: "existentia",
    href: "/journals/existentia",
    badge: "Arts & Humanities",
    image: "/assets/images/journal-arts-humanities.jpg",
    description:
      "Critical inquiry, cultural philosophy, historical studies, literary criticism, and creative theoretical discourses.",
  },
  {
    name: "Concrescence Journal of Multi-Disciplinary Research",
    shortName: "CJMR",
    slug: "cjmr",
    href: "/journals/cjmr",
    badge: "Multidisciplinary",
    image: "/assets/images/journal-multidisciplinary.jpg",
    description:
      "Cross-disciplinary research, methodological innovation, and original scholarship bridging social sciences, humanities, and empirical sciences.",
  },
  {
    name: "Izu: Journal of Critical Perspectives",
    shortName: "IZU",
    slug: "izu",
    href: "/journals/izu",
    badge: "Critical Perspectives",
    image: "/assets/images/journal-governance-security.jpg",
    description:
      "Peer-reviewed critical scholarship and interdisciplinary theoretical perspectives.",
  },
  {
    name: "The Polis: Journal of Political Studies",
    shortName: "POLIS",
    slug: "polis",
    href: "/journals/polis",
    badge: "Political Studies",
    image: "/assets/images/journal-political-studies.jpg",
    description:
      "Scholarly analysis of political theory, public policy, governance systems, international relations, and civic institutions.",
  },
];

export const siteConfig = {
  name: "CASJOURNALS",
  shortName: "CASJOURNALS",
  description:
    "CASJOURNALS provides a trusted open-access platform for peer-reviewed academic publishing across social sciences, humanities, and allied fields.",
  faculty: "Academic Publishing Directorate",
  institution: "CASJOURNALS",
  activeJournals: activeJournalsConfig,
  publicNavigation: [
    { label: "Home", href: "/" },
    {
      label: "Journals",
      href: "/#journals",
      children: activeJournalsConfig.map((journal) => ({
        label: journal.name,
        shortName: journal.shortName,
        href: journal.href,
        description: journal.description,
      })) as readonly PublicNavigationSubItem[],
    },
    { label: "For Authors", href: "/submissions" },
    { label: "Archive", href: "/archives" },
    { label: "Announcements", href: "/announcements" },
    { label: "Indexing & Abstracting", href: "/indexing-abstracting" },
    { label: "Contact", href: "/contact" },
  ],
  footerNavigation: [
    { label: "Home", href: "/" },
    { label: "Current Issue", href: "/current-issue" },
    { label: "Archive", href: "/archives" },
    { label: "Indexing & Abstracting", href: "/indexing-abstracting" },
    { label: "Editorial Team", href: "/editorial-board" },
    { label: "Announcements", href: "/announcements" },
    { label: "Become a Reviewer", href: "/apply-reviewer" },
    { label: "Sign In / Track", href: "/login" },
    { label: "Contact Us", href: "/contact" },
  ],
} as const;

export function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    if (raw.includes("localhost") || raw.includes("127.0.0.1")) {
      return raw.replace(/\/$/, "");
    }
    return raw.replace(/^http:\/\//, "https://").replace(/\/$/, "");
  }
  return "https://casjournals.org";
}
