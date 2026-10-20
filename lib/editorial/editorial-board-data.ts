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
  issnPreservedNote?: string;
  department: string;
  faculty: string;
  institution: string;
  frequency: string;
  aimsAndScope: string;
  subjectAreas?: string[];
  articleTypes?: string[];
  guidelines?: {
    wordCount?: string;
    formatting?: string;
    abstractLength?: string;
    keywordsCount?: string;
    deadline?: string;
    submissionEmail?: string;
  };
  peerReviewPolicy: string;
  referencingStyle: string;
  openAccessPolicy?: string;
  publicationEthics?: string;
  apcInfo?: {
    submissionFee: string;
    nigerianFee: string;
    foreignFee: string;
    timing: string;
  };
  officeAddress?: string;
  contactEmail: string;
  contactPhone?: string;
}

export const CANONICAL_JOURNAL_ORDER: readonly string[] = [
  "existentia",
  "cjmr",
  "izu",
  "polis",
];

export const JOURNAL_HERO_AFFILIATIONS: Record<string, string> = {
  existentia: "Faculty of Humanity, Imo State University, Nigeria",
  cjmr: "Faculty of Humanity, Imo State University, Nigeria",
  izu: "Department of Philosophy, Imo State University, Nigeria",
  polis: "Department of Philosophy, Imo State University, Nigeria",
};

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
  return [...journals].sort((a: T, b: T) => {
    const pA = getJournalOrderPriority(a.slug);
    const pB = getJournalOrderPriority(b.slug);
    if (pA !== pB) return pA - pB;
    return a.slug.localeCompare(b.slug);
  });
}

export const CANONICAL_JOURNAL_METADATA: Record<string, JournalMetadata> = {
  cjmr: {
    slug: "cjmr",
    dbSlugs: ["cjmr"],
    title: "Concrescence Journal of Multi-Disciplinary Research",
    shortName: "CJMR",
    department: "Multi-Disciplinary Research",
    faculty: "Faculty of Humanities",
    institution: "Imo State University, Nigeria",
    frequency: "Six issues per year (rolling continuous publication)",
    issnOnline: "1595-9287 (Online) / E-3093-0650 (Online)",
    issnPreservedNote:
      "ISSN strings supplied: 1595-9287 and E-3093-0650 (retained as supplied pending editorial verification)",
    aimsAndScope:
      "A platform for innovative, interdisciplinary scholarship bridging gaps between academic disciplines and fostering comprehensive discussions that advance knowledge across traditional boundaries. The journal publishes high-quality research integrating perspectives from different disciplines to address complex issues and contribute to holistic understanding.",
    subjectAreas: [
      "Humanities and the Arts",
      "Social and Behavioural Sciences",
      "Education and Human Development",
      "Management, Business and Economics",
      "Governance and Public Policy",
      "Science, Technology and Environmental Studies",
      "Health, Well-being and Society",
    ],
    articleTypes: [
      "Original Research Articles",
      "Review Articles",
      "Critical Essays",
    ],
    guidelines: {
      wordCount:
        "Comprehensive manuscripts thoroughly proofread and clearly structured",
      formatting:
        "Formatted according to academic guidelines with clear organization",
      abstractLength: "150–250 words",
      keywordsCount: "4–6 keywords",
      deadline:
        "Submissions accepted all year round (continuous rolling intake)",
      submissionEmail: "cojomure@gmail.com",
    },
    peerReviewPolicy:
      "Double-blind peer review. Initial editorial assessment for scope and suitability, followed by independent evaluation by at least two expert reviewers.",
    referencingStyle:
      "APA 7th Edition (all cited sources must appear in the reference list)",
    openAccessPolicy:
      "Immediate open access without subscription barriers under Creative Commons Attribution (CC BY 4.0). Authors retain copyright.",
    publicationEthics:
      "Follows Committee on Publication Ethics (COPE) core practices and Publication Ethics and Malpractice standards.",
    apcInfo: {
      submissionFee: "Free (₦0 Upfront)",
      nigerianFee: "₦30,000",
      foreignFee: "US $90",
      timing: "Applies only after peer review acceptance",
    },
    officeAddress:
      "Faculty of Humanities, Imo State University, Owerri, Nigeria",
    contactEmail: "cojomure@gmail.com",
    contactPhone: "08085904192",
  },
  existentia: {
    slug: "existentia",
    dbSlugs: ["existentia"],
    title: "Existentia: Concrescence Journal of Arts and Humanities",
    shortName: "EXISTENTIA",
    department: "Arts and Humanities",
    faculty: "Faculty of Humanities",
    institution: "Imo State University, Nigeria",
    frequency: "Six issues per year (rolling continuous publication)",
    issnOnline: "3093-0650 (Online) / E-3093-0650 (Online)",
    issnPreservedNote:
      "ISSN strings supplied: 3093-0650 and E-3093-0650 (retained as supplied pending editorial verification)",
    aimsAndScope:
      "An online peer-reviewed journal publishing research at the intersection of humanities disciplines and real-world challenges and practices. Focuses on applied humanities and encourages innovative discussion and analysis connecting theoretical insights with practical applications.",
    subjectAreas: [
      "Thought, Value and Belief: Philosophy, ethics, questions of value, religion, theology, and anthropology",
      "Politics, Governance, and Society: Politics, governance, public policy, administration, leadership, peace, security, and human rights",
      "Culture, Art, and Expression: Art, aesthetics, creative practice, heritage, language, literature, media, and theatre arts",
      "People, Identity and Difference: Society, identity, social norms, gender studies, race, migration, diaspora, and health humanities",
      "Globalization, Environment and Knowledge: Globalization, environmental humanities, education, and digital humanities",
      "African and Decolonial Perspectives: African perspectives, indigenous knowledge systems, and decolonial studies",
    ],
    articleTypes: [
      "Original Research Articles",
      "Review Articles",
      "Critical Essays",
    ],
    guidelines: {
      wordCount: "5,000–8,000 words, including references",
      formatting:
        "Microsoft Word (.docx), Times New Roman, 12-point, double-spaced",
      abstractLength: "150–250 words",
      keywordsCount: "4–6 keywords",
      deadline:
        "Submissions accepted all year round (continuous rolling intake)",
      submissionEmail: "existentiajournal@gmail.com",
    },
    peerReviewPolicy:
      "Double-blind peer review. Initial editorial assessment for scope and suitability, followed by independent evaluation by at least two expert reviewers.",
    referencingStyle:
      "APA 7th Edition (strictly formatted citations and references)",
    openAccessPolicy:
      "Immediate open access without subscription barriers under Creative Commons Attribution (CC BY 4.0). Authors retain copyright.",
    publicationEthics:
      "Follows Committee on Publication Ethics (COPE) core practices and Publication Ethics and Malpractice standards.",
    apcInfo: {
      submissionFee: "Free (₦0 Upfront)",
      nigerianFee: "₦30,000",
      foreignFee: "US $90",
      timing: "Applies only after peer review acceptance",
    },
    officeAddress:
      "Faculty of Humanities, Imo State University, Owerri, Nigeria",
    contactEmail: "existentiajournal@gmail.com",
    contactPhone: "08085904192",
  },
  izu: {
    slug: "izu",
    dbSlugs: ["izu"],
    title: "Izu: Journal of Critical Perspectives",
    shortName: "IZU",
    department: "Department of Philosophy",
    faculty: "Faculty of Humanities",
    institution: "Imo State University, Nigeria",
    frequency: "Four issues per year (March, June, September, December)",
    issnOnline: "3093-0650 (Online) / E-3093-0650 (Online)",
    issnPreservedNote:
      "ISSN strings supplied: 3093-0650 and E-3093-0650 (retained as supplied pending editorial verification)",
    aimsAndScope:
      "A double-blind peer-reviewed online academic journal dedicated to advancing understanding of contemporary issues through rigorous scholarship. Welcomes original research and critical analyses from diverse fields that address pressing questions and offer innovative perspectives to stimulate intellectual engagement and societal impact.",
    subjectAreas: [
      "Critical Philosophy and Theoretical Inquiry",
      "Philosophical Anthropology and Ethics",
      "Epistemology, Hermeneutics and Social Theory",
      "Cultural Critique and Humanistic Discourse",
      "African Philosophy, Decolonial Thought and Value Systems",
      "Interdisciplinary Analyses on Contemporary Social Challenges",
    ],
    articleTypes: [
      "Original Research Articles",
      "Review Articles",
      "Critical Analyses",
    ],
    guidelines: {
      wordCount: "4,000–8,000 words, including references and appendices",
      formatting:
        "Microsoft Word, clearly structured with rigorous academic citations",
      abstractLength: "150–250 words",
      keywordsCount: "4–6 keywords",
      deadline:
        "Papers accepted all year round (continuous quarterly compilation)",
      submissionEmail: "izujournal@gmail.com",
    },
    peerReviewPolicy:
      "Double-blind peer review. Initial editorial assessment for scope and suitability, followed by independent evaluation by at least two expert reviewers.",
    referencingStyle: "APA 7th Edition",
    openAccessPolicy:
      "Immediate open access without subscription barriers under Creative Commons Attribution (CC BY 4.0). Authors retain copyright.",
    publicationEthics:
      "Follows Committee on Publication Ethics (COPE) core practices and Publication Ethics and Malpractice standards.",
    apcInfo: {
      submissionFee: "Free (₦0 Upfront)",
      nigerianFee: "₦30,000",
      foreignFee: "US $90",
      timing: "Applies only after peer review acceptance",
    },
    officeAddress:
      "Department of Philosophy, Faculty of Humanities, Imo State University, Owerri, Imo State, Nigeria",
    contactEmail: "izujournal@gmail.com",
    contactPhone: "08085904192",
  },
  polis: {
    slug: "polis",
    dbSlugs: ["polis"],
    title: "The Polis: Journal of Political Studies",
    shortName: "POLIS",
    department: "Department of Philosophy",
    faculty: "Faculty of Humanities",
    institution: "Imo State University, Nigeria",
    frequency: "Four issues per year (March, June, September, December)",
    issnOnline: "3092-9113 (Online) / E-3093-0650 (Online)",
    issnPreservedNote:
      "ISSN strings supplied: 3092-9113 and E-3093-0650 (retained as supplied pending editorial verification)",
    aimsAndScope:
      "An international, peer-reviewed, open-access journal dedicated to political research, social discussion, humanities, and related fields. Provides a platform for research that stimulates intellectual engagement and societal impact, connecting political thought with social and human questions shaping public life.",
    subjectAreas: [
      "Political Theory, Thought and Philosophy",
      "Comparative Politics and Government",
      "International Relations and Global Politics",
      "Public Policy, Administration and Governance",
      "Democracy, Elections and Political Institutions",
      "Political Economy and Development",
      "Peace, Conflict and Security Studies",
      "Political Sociology and Social Movements",
      "Civil Society, Citizenship and Participation",
      "Political Communication and Media",
      "Human Rights, Justice and the Rule of Law",
      "African Politics and Perspectives on the Global South",
    ],
    articleTypes: [
      "Original Research Articles",
      "Review Articles",
      "Critical Analyses",
    ],
    guidelines: {
      wordCount: "4,000–8,000 words, including references",
      formatting:
        "Rigorous scholarly structure, clear abstract, and comprehensive citation apparatus",
      abstractLength: "150–250 words",
      keywordsCount: "4–6 keywords",
      deadline:
        "Papers accepted all year round (continuous quarterly compilation)",
      submissionEmail: "casjournals@gmail.com",
    },
    peerReviewPolicy:
      "Double-blind peer review. Initial editorial assessment for scope and suitability, followed by independent evaluation by at least two expert reviewers.",
    referencingStyle: "APA 7th Edition",
    openAccessPolicy:
      "Immediate open access without subscription barriers under Creative Commons Attribution (CC BY 4.0). Authors retain copyright.",
    publicationEthics:
      "Follows Committee on Publication Ethics (COPE) core practices and Publication Ethics and Malpractice standards.",
    apcInfo: {
      submissionFee: "Free (₦0 Upfront)",
      nigerianFee: "₦30,000",
      foreignFee: "US $90",
      timing: "Applies only after peer review acceptance",
    },
    officeAddress:
      "Department of Philosophy, Faculty of Humanities, Imo State University, Owerri, Imo State, Nigeria",
    contactEmail: "casjournals@gmail.com",
    contactPhone: "08085904192",
  },
  ajsbs: {
    slug: "ajsbs",
    dbSlugs: ["ajsbs"],
    title: "African Journal of Social and Behavioural Sciences",
    shortName: "AJSBS",
    department: "Social Sciences",
    faculty: "Faculty of Social Sciences",
    institution: "Imo State University, Nigeria",
    frequency: "Biannual",
    aimsAndScope:
      "Scholarly research across the social and behavioural sciences.",
    peerReviewPolicy: "Double-blind peer review.",
    referencingStyle: "APA 7th Edition",
    contactEmail: "info@imsu-foss.edu.ng",
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
    title: journal.name || canonicalFallback?.title || canonicalSlug,
    shortName:
      journal.shortName?.trim() ||
      canonicalFallback?.shortName ||
      canonicalSlug.toUpperCase(),
    department: journal.department?.name ?? canonicalFallback?.department ?? "",
    faculty: journal.faculty ?? canonicalFallback?.faculty ?? "",
    institution: journal.institution ?? canonicalFallback?.institution ?? "",
    frequency: canonicalFallback?.frequency ?? "",
    aimsAndScope: journal.description ?? canonicalFallback?.aimsAndScope ?? "",
    subjectAreas: canonicalFallback?.subjectAreas,
    articleTypes: canonicalFallback?.articleTypes,
    guidelines: canonicalFallback?.guidelines,
    peerReviewPolicy: canonicalFallback?.peerReviewPolicy ?? "",
    referencingStyle: canonicalFallback?.referencingStyle ?? "",
    openAccessPolicy: canonicalFallback?.openAccessPolicy,
    publicationEthics: canonicalFallback?.publicationEthics,
    apcInfo: canonicalFallback?.apcInfo,
    officeAddress: canonicalFallback?.officeAddress,
    contactEmail: canonicalFallback?.contactEmail ?? "",
    contactPhone: canonicalFallback?.contactPhone,
    issnPrint: canonicalFallback?.issnPrint,
    issnOnline: canonicalFallback?.issnOnline,
    issnL: canonicalFallback?.issnL,
    issnPreservedNote: canonicalFallback?.issnPreservedNote,
  };
}

export const CANONICAL_EDITORIAL_BOARDS: Record<
  string,
  EditorialBoardMember[]
> = {
  cjmr: [
    {
      id: "cas-cjmr-1",
      journalSlug: "cjmr",
      name: "Uche Oputa, PhD",
      role: "Editor-in-Chief",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "EDITOR_IN_CHIEF",
      order: 1,
    },
    {
      id: "cas-cjmr-2",
      journalSlug: "cjmr",
      name: "Chidi K. Ogonnaya, PhD",
      role: "Editor",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "ASSOCIATE_EDITOR",
      order: 2,
    },
    {
      id: "cas-cjmr-3",
      journalSlug: "cjmr",
      name: "Bellarmine Nneji, PhD",
      role: "Editor",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "ASSOCIATE_EDITOR",
      order: 3,
    },
    {
      id: "cas-cjmr-4",
      journalSlug: "cjmr",
      name: "Ifeanyi Anyanwu, PhD",
      role: "Editor",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "ASSOCIATE_EDITOR",
      order: 4,
    },
    {
      id: "cas-cjmr-5",
      journalSlug: "cjmr",
      name: "Bernard Berm Assoh, PhD",
      role: "Editor",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "ASSOCIATE_EDITOR",
      order: 5,
    },
    {
      id: "cas-cjmr-6",
      journalSlug: "cjmr",
      name: "Francis Ofoegbu, PhD",
      role: "Editor",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "ASSOCIATE_EDITOR",
      order: 6,
    },
  ],
  existentia: [
    {
      id: "cas-existentia-1",
      journalSlug: "existentia",
      name: "Prof Izu M. Onyeocha",
      role: "Editor-in-Chief",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "EDITOR_IN_CHIEF",
      order: 1,
    },
    {
      id: "cas-existentia-2",
      journalSlug: "existentia",
      name: "Chidi K. Ogonnaya, PhD",
      role: "Deputy Editor",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "DEPUTY_EDITOR",
      order: 2,
    },
  ],
  izu: [
    {
      id: "cas-izu-1",
      journalSlug: "izu",
      name: "Prof Izu M. Onyeocha",
      role: "Editor-in-Chief",
      affiliation:
        "Department of Philosophy, Faculty of Humanities, Imo State University",
      category: "EDITOR_IN_CHIEF",
      order: 1,
    },
    {
      id: "cas-izu-2",
      journalSlug: "izu",
      name: "Chidi K. Ogonnaya, PhD",
      role: "Editor",
      affiliation:
        "Department of Philosophy, Faculty of Humanities, Imo State University",
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
      affiliation:
        "Department of Philosophy, Faculty of Humanities, Imo State University",
      category: "EDITOR_IN_CHIEF",
      order: 1,
    },
    {
      id: "cas-polis-2",
      journalSlug: "polis",
      name: "Christian Nwadinihu, PhD",
      role: "Associate Editor",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "ASSOCIATE_EDITOR",
      order: 2,
    },
    {
      id: "cas-polis-3",
      journalSlug: "polis",
      name: "Bellarmine Nneji, PhD",
      role: "Editor",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "BOARD_MEMBER",
      order: 3,
    },
    {
      id: "cas-polis-4",
      journalSlug: "polis",
      name: "Ifeanyi Anyanwu, PhD",
      role: "Editor",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "BOARD_MEMBER",
      order: 4,
    },
    {
      id: "cas-polis-5",
      journalSlug: "polis",
      name: "Bernard Berm Assoh, PhD",
      role: "Editor",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "BOARD_MEMBER",
      order: 5,
    },
    {
      id: "cas-polis-6",
      journalSlug: "polis",
      name: "Francis Ofoegbu, PhD",
      role: "Editor",
      affiliation: "Faculty of Humanities, Imo State University",
      category: "BOARD_MEMBER",
      order: 6,
    },
  ],
};

export function getDefaultEditorialBoard(slug: string): EditorialBoardMember[] {
  const canonicalSlug = resolveCanonicalJournalSlug(slug);
  return CANONICAL_EDITORIAL_BOARDS[canonicalSlug] ?? [];
}
