export interface JournalAboutTopicSection {
  title: string;
  items: string[];
}

import { resolveCanonicalJournalSlug } from "@/lib/editorial/editorial-board-data";

export interface JournalAboutData {
  slug: string;
  title: string;
  shortName: string;
  issnOnline: string;
  affiliation: string;
  aimsAndScope: string;
  topicsIntro?: string;
  topicSections?: JournalAboutTopicSection[];
  guidelines: {
    length?: string;
    format?: string;
    style?: string;
    abstract?: string;
    keywords?: string;
    process?: string;
    deadline?: string;
    submissionChannel?: string;
  };
  publicationFrequency: string;
  typesOfArticles: string[];
  openAccess: string;
  reviewProcess: string;
  publicationEthics: string;
  apc: {
    submissionFee: string;
    nigerianFee: string;
    foreignFee: string;
    details: string;
  };
  indexing: string[];
  contact: {
    title: string;
    office: string;
    address: string;
    email?: string;
    website?: string;
    phone?: string;
  };
}

export const JOURNAL_ABOUT_DATA: Record<string, JournalAboutData> = {
  existentia: {
    slug: "existentia",
    title: "EXISTENTIA: Concrescence Journal of Arts and Humanities",
    shortName: "EXISTENTIA",
    issnOnline: "ISSN: 3093-0650 (Online) / ISSN E-3093-0650 (Online)",
    affiliation: "Faculty of Humanity, Imo State University, Nigeria",
    aimsAndScope:
      "The EXISTENTIA: Concrescence Journal of Art and Humanities (ECOJAH) is an online peer-reviewed journal that publishes cutting-edge research examining the intersection of humanities disciplines with real-world challenges and practices. As a journal dedicated to the exploration and advancement of applied humanities, Existentia Journal seeks to foster innovative discussions and analysis that bridge theoretical insights with practical applications in various fields. The journal welcomes original research, review articles, and critical essays that bring humanities perspectives to bear on contemporary questions.",
    topicsIntro: "Topics welcomed include, but are not limited to:",
    topicSections: [
      {
        title: "Thought, Value and Belief",
        items: [
          "Philosophy, ethics and questions of value",
          "Religion, theology and the study of belief in society",
          "Anthropology",
        ],
      },
      {
        title: "Politics, Governance, and Society",
        items: [
          "Politics, governance, public policy and administration",
          "Leadership, development and institutions",
          "Human Existence, Peace security and conflict studies",
          "Human rights and social justice",
        ],
      },
      {
        title: "Culture, Art, and Expression",
        items: [
          "Art, aesthetics and creative practice",
          "Culture, history and heritage",
          "Language, literature and media",
          "Theatre Arts, identity and cultural expression",
        ],
      },
      {
        title: "People, Identity and Difference",
        items: [
          "Society, identity and social norms and values",
          "Gender and women’s studies",
          "Race, racism and questions of justice",
          "Migration, diaspora and belonging",
          "Health humanities and medical humanities",
        ],
      },
      {
        title: "Globalization, Environment and Knowledge",
        items: [
          "Globalization and global studies",
          "Environmental concerns and the humanities",
          "Education and the transmission of knowledge",
          "Digital humanities and the relationship between technology and society",
        ],
      },
      {
        title: "African and Decolonial Perspectives",
        items: [
          "African issues and perspectives",
          "Indigenous knowledge systems and decolonial studies",
        ],
      },
    ],
    guidelines: {
      length:
        "Articles should be between 5,000 and 8,000 words, including references.",
      format:
        "Submissions must be in Microsoft Word format (.docx), using Times New Roman, 12-point font, and double-spaced.",
      style:
        "Follow the 7th Edition of the APA style guide for citations and references.",
      abstract:
        "Abstract of 150 - 250 words summarizing the key points and significance of the paper.",
      keywords:
        "Provide 4-6 keywords that encapsulate the main themes of your paper.",
      process:
        "All submitted manuscripts undergo a double-blind peer-review process to ensure rigorous evaluation and uphold the highest academic standards. Authors may be asked to revise their papers based on review feedback before final acceptance.",
      deadline:
        "Papers are accepted all year round on a continuous rolling basis.",
      submissionChannel:
        "Online submission portal or email: existentiajournal@gmail.com",
    },
    publicationFrequency:
      "The journal publishes six issues per year. Articles are published online as soon as they are ready and compiled into an ongoing issue.",
    typesOfArticles: [
      "Original Research Articles",
      "Review Articles",
      "Critical Essays",
    ],
    openAccess:
      "This is an open-access journal: all content is freely available without charge to readers and their institutions. Users may read, download, copy, distribute, print, search or link to the full text of articles, or use them for any other lawful purpose, without seeking prior permission from the publisher or the author. Articles are published under a Creative Commons Attribution CC-BY 4.0 licence and authors retain copyright of their work.",
    reviewProcess:
      "The journal operates a double-blind peer-review process. Manuscripts are first assessed by the editorial team for scope and suitability, then sent by the Editor-in-Chief to at least two independent expert reviewers.",
    publicationEthics:
      "The journal is committed to the highest standards of publication ethics and follows the principles of the Committee on Publication Ethics (COPE).",
    apc: {
      submissionFee: "Free (₦0 Upfront)",
      nigerianFee: "₦30,000",
      foreignFee: "US $90",
      details:
        "There is no fee to submit. Article processing charges apply only after a manuscript has been formally accepted following peer review.",
    },
    indexing: [
      "Google Scholar",
      "Crossref (DOI)",
      "OpenAlex",
      "Scilit",
      "Semantic Scholar",
    ],
    contact: {
      title: "Existentia: Concrescence Journal of Arts and Humanities",
      office: "Editorial Office",
      address: "Faculty of Humanities, Imo State University, Owerri, Nigeria",
      email: "existentiajournal@gmail.com",
      website: "www.casjournals.org",
      phone: "08085904192",
    },
  },

  cjmr: {
    slug: "cjmr",
    title: "Concrescence Journal of Multi-Disciplinary Research",
    shortName: "CJMR",
    issnOnline: "ISSN: 1595-9287 (Online) / ISSN E-3093-0650 (Online)",
    affiliation: "Faculty of Humanity, Imo State University, Nigeria",
    aimsAndScope:
      "The Concrescence Journal of Multi-Disciplinary Research (Cojomure) is an esteemed online platform for innovative and interdisciplinary scholarship. It seeks to bridge the gaps between various academic disciplines and foster comprehensive discussions that advance knowledge across traditional boundaries. Concrescence Journal is dedicated to publishing high-quality research that integrates perspectives from different disciplines to address complex issues and contribute to the advancement of holistic understanding. The objective is to encourage dialogue and collaboration among researchers from diverse fields, thereby promoting interdisciplinary solutions to contemporary challenges.",
    topicsIntro:
      "We invite submissions that reflect rigorous research, theoretical advancements and empirical studies from:",
    topicSections: [
      {
        title: "Focus Areas & Disciplinary Domains",
        items: [
          "Humanities and the arts",
          "Social and behavioural sciences",
          "Education and human development",
          "Management, business and economics",
          "Governance and public policy",
          "Science, technology and environmental studies",
          "Health, well-being and society",
        ],
      },
    ],
    guidelines: {
      length:
        "Comprehensive scholarly articles (typically 4,000 to 8,000 words including references).",
      format:
        "Manuscripts must be well-organized, clearly written, and thoroughly proofread in Microsoft Word format.",
      style:
        "References and citations must be comprehensive and formatted according to 7th Edition APA style.",
      abstract:
        "Each submission must include a concise abstract (150-250 words).",
      keywords:
        "Provide 4-6 keywords that accurately reflect the content and focus of the paper.",
      process:
        "All submitted papers undergo a double-blind peer-review process. Authors receive constructive feedback and may be asked to make revisions prior to final acceptance.",
      deadline: "Manuscripts are accepted all year round.",
      submissionChannel:
        "Online submission portal or email: cojomure@gmail.com",
    },
    publicationFrequency:
      "The journal publishes six issues per year. Articles are published online as soon as they are ready and compiled into an ongoing issue.",
    typesOfArticles: [
      "Original Research Articles",
      "Review Articles",
      "Critical Essays",
    ],
    openAccess:
      "This is an open-access journal: all content is freely available without charge to readers and their institutions. Users may read, download, copy, distribute, print, search or link to the full text of articles, or use them for any other lawful purpose, without seeking prior permission from the publisher or the author. Articles are published under a Creative Commons Attribution CC-BY 4.0 licence and authors retain copyright of their work.",
    reviewProcess:
      "The journal operates a double-blind peer-review process. Manuscripts are first assessed by the editorial team for scope and suitability, then sent by the Editor-in-Chief to at least two independent expert reviewers.",
    publicationEthics:
      "The journal is committed to the highest standards of publication ethics and follows the principles of the Committee on Publication Ethics (COPE).",
    apc: {
      submissionFee: "Free (₦0 Upfront)",
      nigerianFee: "₦30,000",
      foreignFee: "US $90",
      details:
        "There is no fee to submit. A one-time article processing charge of ₦30,000 for Nigerian authors and US $90 for foreign authors applies only after a manuscript is accepted.",
    },
    indexing: [
      "Google Scholar",
      "Crossref (DOI)",
      "OpenAlex",
      "Scilit",
      "Semantic Scholar",
    ],
    contact: {
      title: "Concrescence Journal of Multi-Disciplinary Research",
      office: "Editorial Office",
      address: "Faculty of Humanities, Imo State University, Owerri, Nigeria",
      email: "cojomure@gmail.com",
      website: "www.casjournals.org",
      phone: "08085904192",
    },
  },

  izu: {
    slug: "izu",
    title: "Izu: Journal of Critical Perspectives",
    shortName: "IZU",
    issnOnline: "ISSN: 3093-0650 (Online) / ISSN E-3093-0650 (Online)",
    affiliation: "Department of Philosophy, Imo State University, Nigeria",
    aimsAndScope:
      "IZU: Journal of Critical Perspectives (IJCP) is a double-blind peer-reviewed online academic journal dedicated to advancing the understanding of contemporary issues through rigorous scholarship. The Journal welcomes original research and critical analyses from diverse fields that address pressing questions and offer innovative perspectives. The Journal is committed to publishing high-quality papers that address pressing questions, offer innovative perspectives and contribute to the ongoing discourse in various academic and practical domains. Our goal is to provide a platform for thought-provoking research that stimulates intellectual engagement and societal impact.",
    topicsIntro:
      "Scope encompasses critical perspectives across humanistic and theoretical disciplines:",
    topicSections: [
      {
        title: "Disciplinary Areas",
        items: [
          "Critical philosophy, epistemology, and metaphysics",
          "Ethics, moral philosophy, and questions of human value",
          "Hermeneutics, social theory, and institutional analysis",
          "African philosophy, decolonial thought, and indigenous systems",
          "Cultural critique, linguistics, and literature in perspective",
          "Interdisciplinary theoretical solutions to contemporary societal questions",
        ],
      },
    ],
    guidelines: {
      length:
        "Papers should be between 4,000 and 8,000 words, including references and appendices.",
      format:
        "Manuscripts should be formatted in Microsoft Word according to 7th Edition APA style.",
      style:
        "7th Edition APA style for all citations and bibliographic references.",
      abstract:
        "Abstract of 150-250 words summarizing the thesis, methodology, and significance.",
      keywords: "Provide 4-6 keywords capturing the core themes.",
      process:
        "All submissions undergo double-blind peer review to ensure the highest quality of scholarship.",
      deadline: "Papers are accepted all year round.",
      submissionChannel:
        "Online submission portal or email: izujournal@gmail.com",
    },
    publicationFrequency:
      "IJCP publishes four issues per year: March, June, September and December. Papers are published online as soon as they are ready and compiled into ongoing issues.",
    typesOfArticles: [
      "Original Research Articles",
      "Review Articles",
      "Critical Analyses",
    ],
    openAccess:
      "This is an open-access journal: all content is freely available without charge to readers and their institutions. Users may read, download, copy, distribute, print, search, or link to the full text of articles, or use them for any other lawful purpose, without seeking prior permission from the publisher or the author. Articles are published under a Creative Commons Attribution CC-BY 4.0 licence and authors retain copyright of their work.",
    reviewProcess:
      "The journal operates a double-blind peer-review process. Manuscripts are first assessed by the editorial team for scope and suitability, then sent by the Editor-in-Chief to at least two independent expert reviewers.",
    publicationEthics:
      "IJCP is committed to the highest standards of publication ethics and follows the principles of the Committee on Publication Ethics (COPE).",
    apc: {
      submissionFee: "Free (₦0 Upfront)",
      nigerianFee: "₦30,000",
      foreignFee: "US $90",
      details:
        "There is no fee to submit. A one-time article processing charge of ₦30,000 for Nigerian authors and US $90 for foreign authors applies only after a manuscript is accepted.",
    },
    indexing: [
      "Google Scholar",
      "Crossref (DOI)",
      "OpenAlex",
      "Scilit",
      "Semantic Scholar",
    ],
    contact: {
      title: "Izu: Journal of Critical Perspectives",
      office: "Editorial Office",
      address:
        "Department of Philosophy, Faculty of Humanities, Imo State University, Owerri, Imo State, Nigeria",
      email: "izujournal@gmail.com",
      website: "www.casjournals.org",
      phone: "08085904192",
    },
  },

  polis: {
    slug: "polis",
    title: "The Polis: Journal of Political Studies",
    shortName: "POLIS",
    issnOnline: "ISSN: 3092-9113 (Online) / ISSN E-3093-0650 (Online)",
    affiliation: "Department of Philosophy, Imo State University, Nigeria",
    aimsAndScope:
      "The Polis: Journal of Political Studies (PJPS) is an online international, peer-reviewed, open-access journal dedicated to studies on political research, social discussions, humanities and related fields. PJPS provides a platform for thought-provoking research that stimulates intellectual engagement and societal impact for scholars, institutions, researchers and professionals. The Journal welcomes original research and critical analyses from diverse fields that address pressing political issues. The journal values rigorous, intellectually engaged scholarship that connects political thought with the social and human questions that shape public life.",
    topicsIntro: "Its scope includes, but is not limited to:",
    topicSections: [
      {
        title: "Core Disciplinary Domains",
        items: [
          "Political theory, thought and philosophy",
          "Comparative politics and government",
          "International relations and global politics",
          "Public policy, administration and governance",
          "Democracy, elections and political institutions",
          "Political economy and development",
          "Peace, conflict and security studies",
          "Political sociology and social movements",
          "Civil society, citizenship and participation",
          "Political communication and media",
          "Human rights, justice and the rule of law",
          "African politics and perspectives on the Global South",
        ],
      },
    ],
    guidelines: {
      length:
        "Articles should be between 4,000 and 8,000 words, including references.",
      format:
        "Submissions must be prepared in Microsoft Word format, clearly written and thoroughly proofread.",
      style: "7th Edition of the APA style guide for citations and references.",
      abstract:
        "Abstract of 150 - 250 words summarizing the key thesis, findings, and civic impact.",
      keywords: "Provide 4-6 keywords capturing the main themes.",
      process:
        "Rigorous double-blind peer review by at least two independent expert referees.",
      deadline: "Submissions accepted all year round.",
      submissionChannel:
        "Online submission portal or email: casjournals@gmail.com",
    },
    publicationFrequency:
      "PJPS publishes four issues per year: March, June, September and December. Papers are published online as soon as they are ready and compiled into ongoing issues.",
    typesOfArticles: [
      "Original Research Articles",
      "Review Articles",
      "Critical Analyses",
    ],
    openAccess:
      "This is an open-access journal: all content is freely available without charge to readers and their institutions. Users may read, download, copy, distribute, print, search, or link to the full text of articles, or use them for any other lawful purpose, without seeking prior permission from the publisher or the author. Articles are published under a Creative Commons Attribution CC-BY 4.0 licence and authors retain copyright of their work.",
    reviewProcess:
      "The journal operates a double-blind peer-review process. Manuscripts are first assessed by the editorial team for scope and suitability, then sent by the Editor-in-Chief to at least two independent expert reviewers.",
    publicationEthics:
      "PJPS is committed to the highest standards of publication ethics and follows the principles of the Committee on Publication Ethics (COPE).",
    apc: {
      submissionFee: "Free (₦0 Upfront)",
      nigerianFee: "₦30,000",
      foreignFee: "US $90",
      details:
        "There is no fee to submit. A one-time article processing charge of ₦30,000 for Nigerian authors and US $90 for foreign authors applies only after a manuscript is accepted.",
    },
    indexing: [
      "Google Scholar",
      "Crossref (DOI)",
      "OpenAlex",
      "Scilit",
      "Semantic Scholar",
    ],
    contact: {
      title: "The Polis: Journal of Political Studies",
      office: "Editorial Office",
      address:
        "Department of Philosophy, Faculty of Humanities, Imo State University, Owerri, Imo State, Nigeria",
      email: "casjournals@gmail.com",
      website: "www.casjournals.org",
      phone: "08085904192",
    },
  },
};

export function getJournalAboutData(slug: string): JournalAboutData | null {
  const canonical = resolveCanonicalJournalSlug(slug);
  return JOURNAL_ABOUT_DATA[canonical] ?? null;
}
