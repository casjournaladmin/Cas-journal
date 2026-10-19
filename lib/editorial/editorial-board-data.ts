export type EditorialMemberCategory =
  | "EDITOR_IN_CHIEF"
  | "CHIEF_EDITOR"
  | "DEPUTY_EDITOR"
  | "ASSOCIATE_EDITOR"
  | "MANAGING_EDITOR"
  | "CONSULTING_EDITOR"
  | "ADVISORY_BOARD"
  | "BOARD_MEMBER";

export interface EditorialBoardMember {
  id: string;
  journalSlug: string;
  name: string;
  role: string;
  affiliation: string;
  category: EditorialMemberCategory;
  order: number;
}

export interface JournalMetadata {
  slug: string;
  dbSlugs: string[];
  title: string;
  shortName: string;
  issnPrint?: string;
  issnOnline?: string;
  issnL?: string;
  department: string;
  faculty: string;
  institution: string;
  frequency: string;
  aimsAndScope: string;
  peerReviewPolicy: string;
  referencingStyle: string;
  contactEmail: string;
}

export const CANONICAL_JOURNAL_ORDER: readonly string[] = [
  "existentia",
  "cjmr",
  "izu",
  "polis",
];

export function getJournalOrderPriority(slug: string): number {
  const canonical = resolveCanonicalJournalSlug(slug);
  const index = (CANONICAL_JOURNAL_ORDER as readonly string[]).indexOf(
    canonical,
  );
  return index === -1 ? 999 : index;
}

export function sortJournalsByCanonicalOrder<T extends { slug: string }>(
  journals: T[],
): T[] {
  return [...journals].sort((a, b) => {
    const pA = getJournalOrderPriority(a.slug);
    const pB = getJournalOrderPriority(b.slug);
    if (pA !== pB) return pA - pB;
    return a.slug.localeCompare(b.slug);
  });
}

export const CANONICAL_JOURNAL_METADATA: Record<string, JournalMetadata> = {
  existentia: {
    slug: "existentia",
    dbSlugs: ["existentia"],
    title: "Existentia: Concrescence Journal of Arts and Humanities",
    shortName: "EXISTENTIA",
    department: "Arts and Humanities",
    faculty: "",
    institution: "",
    frequency: "",
    aimsAndScope:
      "Critical inquiry, cultural philosophy, historical studies, literary criticism, and creative theoretical discourses.",
    peerReviewPolicy: "",
    referencingStyle: "",
    contactEmail: "",
  },
  cjmr: {
    slug: "cjmr",
    dbSlugs: ["cjmr"],
    title: "Concrescence Journal of Multi-Disciplinary Research",
    shortName: "CJMR",
    department: "Multi-Disciplinary Research",
    faculty: "",
    institution: "",
    frequency: "",
    aimsAndScope:
      "Cross-disciplinary research, methodological innovation, and original scholarship bridging social sciences, humanities, and empirical sciences.",
    peerReviewPolicy: "",
    referencingStyle: "",
    contactEmail: "",
  },
  izu: {
    slug: "izu",
    dbSlugs: ["izu"],
    title: "Izu: Journal of Critical Perspectives",
    shortName: "IZU",
    department: "Critical Perspectives",
    faculty: "",
    institution: "",
    frequency: "",
    aimsAndScope: "",
    peerReviewPolicy: "",
    referencingStyle: "",
    contactEmail: "",
  },
  polis: {
    slug: "polis",
    dbSlugs: ["polis"],
    title: "The Polis: Journal of Political Studies",
    shortName: "POLIS",
    department: "Political Studies",
    faculty: "",
    institution: "",
    frequency: "",
    aimsAndScope:
      "Scholarly analysis of political theory, public policy, governance systems, international relations, and civic institutions.",
    peerReviewPolicy: "",
    referencingStyle: "",
    contactEmail: "",
  },
  ajsbs: {
    slug: "ajsbs",
    dbSlugs: ["ajsbs"],
    title: "African Journal of Social and Behavioural Sciences",
    shortName: "AJSBS",
    department: "Social Sciences",
    faculty: "",
    institution: "",
    frequency: "",
    aimsAndScope: "",
    peerReviewPolicy: "",
    referencingStyle: "",
    contactEmail: "",
    issnPrint: "2141-209X",
  },
};

export function resolveCanonicalJournalSlug(slug: string): string {
  return slug.toLowerCase().trim();
}

export function getJournalDbSlugs(slug: string): string[] {
  const canonical = resolveCanonicalJournalSlug(slug);
  return CANONICAL_JOURNAL_METADATA[canonical]?.dbSlugs ?? [canonical];
}

export function getJournalMetadata(slug: string): JournalMetadata | null {
  const canonical = resolveCanonicalJournalSlug(slug);
  return CANONICAL_JOURNAL_METADATA[canonical] ?? null;
}

export function buildJournalMetadataFromRecord(journal: {
  slug: string;
  name: string;
  shortName?: string | null;
  description?: string | null;
  institution?: string | null;
  faculty?: string | null;
  department?: { name: string } | null;
}): JournalMetadata {
  const canonicalSlug = resolveCanonicalJournalSlug(journal.slug);
  const canonicalFallback = CANONICAL_JOURNAL_METADATA[canonicalSlug];

  return {
    slug: canonicalSlug,
    dbSlugs: [canonicalSlug],
    title: journal.name,
    shortName:
      journal.shortName?.trim() ||
      canonicalFallback?.shortName ||
      canonicalSlug.toUpperCase(),
    department: journal.department?.name ?? canonicalFallback?.department ?? "",
    faculty: journal.faculty ?? "",
    institution: journal.institution ?? "",
    frequency: "",
    aimsAndScope: journal.description ?? canonicalFallback?.aimsAndScope ?? "",
    peerReviewPolicy: "",
    referencingStyle: "",
    contactEmail: "",
  };
}

export const CANONICAL_EDITORIAL_BOARDS: Record<
  string,
  EditorialBoardMember[]
> = {
  existentia: [
    {
      id: "cas-existentia-1",
      journalSlug: "existentia",
      name: "Prof Izu M. Onyeocha",
      role: "Editor-in-Chief",
      affiliation: "",
      category: "EDITOR_IN_CHIEF",
      order: 1,
    },
    {
      id: "cas-existentia-2",
      journalSlug: "existentia",
      name: "Chidi K. Ogonnaya, PhD",
      role: "Deputy Editor",
      affiliation: "",
      category: "DEPUTY_EDITOR",
      order: 2,
    },
  ],
  cjmr: [
    {
      id: "cas-cjmr-1",
      journalSlug: "cjmr",
      name: "Uche Oputa, PhD",
      role: "Editor-in-Chief",
      affiliation: "",
      category: "EDITOR_IN_CHIEF",
      order: 1,
    },
    {
      id: "cas-cjmr-2",
      journalSlug: "cjmr",
      name: "Chidi K. Ogonnaya, PhD",
      role: "Editor",
      affiliation: "",
      category: "ASSOCIATE_EDITOR",
      order: 2,
    },
    {
      id: "cas-cjmr-3",
      journalSlug: "cjmr",
      name: "Bellarmine Nneji, PhD",
      role: "Editor",
      affiliation: "",
      category: "ASSOCIATE_EDITOR",
      order: 3,
    },
    {
      id: "cas-cjmr-4",
      journalSlug: "cjmr",
      name: "Ifeanyi Anyanwu, PhD",
      role: "Editor",
      affiliation: "",
      category: "ASSOCIATE_EDITOR",
      order: 4,
    },
    {
      id: "cas-cjmr-5",
      journalSlug: "cjmr",
      name: "Bernard Berm Assoh, PhD",
      role: "Editor",
      affiliation: "",
      category: "ASSOCIATE_EDITOR",
      order: 5,
    },
    {
      id: "cas-cjmr-6",
      journalSlug: "cjmr",
      name: "Francis Ofoegbu, PhD",
      role: "Editor",
      affiliation: "",
      category: "ASSOCIATE_EDITOR",
      order: 6,
    },
  ],
  izu: [
    {
      id: "cas-izu-1",
      journalSlug: "izu",
      name: "Prof Izu M. Onyeocha",
      role: "Editor-in-Chief",
      affiliation: "",
      category: "EDITOR_IN_CHIEF",
      order: 1,
    },
    {
      id: "cas-izu-2",
      journalSlug: "izu",
      name: "Chidi K. Ogonnaya, PhD",
      role: "Editor",
      affiliation: "",
      category: "ASSOCIATE_EDITOR",
      order: 2,
    },
  ],
  polis: [
    {
      id: "cas-polis-1",
      journalSlug: "polis",
      name: "Chidi K. Ogonnaya, PhD",
      role: "Editor-in-Chief",
      affiliation: "",
      category: "EDITOR_IN_CHIEF",
      order: 1,
    },
    {
      id: "cas-polis-2",
      journalSlug: "polis",
      name: "Christian Nwadinihu, PhD",
      role: "Associate Editor",
      affiliation: "",
      category: "ASSOCIATE_EDITOR",
      order: 2,
    },
    {
      id: "cas-polis-3",
      journalSlug: "polis",
      name: "Bellarmine Nneji, PhD",
      role: "Editor",
      affiliation: "",
      category: "BOARD_MEMBER",
      order: 3,
    },
    {
      id: "cas-polis-4",
      journalSlug: "polis",
      name: "Ifeanyi Anyanwu, PhD",
      role: "Editor",
      affiliation: "",
      category: "BOARD_MEMBER",
      order: 4,
    },
    {
      id: "cas-polis-5",
      journalSlug: "polis",
      name: "Bernard Berm Assoh, PhD",
      role: "Editor",
      affiliation: "",
      category: "BOARD_MEMBER",
      order: 5,
    },
    {
      id: "cas-polis-6",
      journalSlug: "polis",
      name: "Francis Ofoegbu, PhD",
      role: "Editor",
      affiliation: "",
      category: "BOARD_MEMBER",
      order: 6,
    },
  ],
};

export function getDefaultEditorialBoard(slug: string): EditorialBoardMember[] {
  const canonicalSlug = resolveCanonicalJournalSlug(slug);
  return CANONICAL_EDITORIAL_BOARDS[canonicalSlug] ?? [];
}
