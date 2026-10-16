/**
 * Academic Citation Generator
 *
 * Implements deterministic academic citation generation for published articles.
 * Supported Styles:
 * - APA 7th Edition (Default)
 * - MLA 9th Edition
 * - Chicago 17th Edition (Author-Date)
 * - Harvard
 * - BibTeX
 */

export type CitationAuthor = {
  fullName: string;
  affiliation?: string | null;
  orcid?: string | null;
  position?: number;
};

export type CitationArticleMetadata = {
  title: string;
  journalName: string;
  journalSlug?: string;
  volume?: number | null;
  issue?: number | null;
  year?: number | null;
  publishedAt?: Date | string | null;
  pageStart?: string | null;
  pageEnd?: string | null;
  doi?: string | null;
  canonicalUrl: string;
  authors: CitationAuthor[];
};

export type CitationStyle = "apa" | "mla" | "chicago" | "harvard" | "bibtex";

export interface CitationResult {
  style: CitationStyle;
  label: string;
  text: string;
  mimeType: "text/plain" | "application/x-bibtex";
}

type ParsedName = {
  firstName: string;
  initials: string;
  lastName: string;
  fullClean: string;
};

/**
 * Strips titles/suffixes and splits into First/Initials/Last components.
 */
export function parseAuthorName(rawName: string): ParsedName {
  const clean = rawName
    .replace(/\b(Prof\.|Dr\.|Rev\.|Mr\.|Mrs\.|Ms\.|Engr\.|Barr\.)\s*/gi, "")
    .replace(/,\s*(Ph\.?D\.?|M\.?Sc\.?|B\.?Sc\.?|OON|CON|CFR|SAN|Esq\.?)/gi, "")
    .trim();

  // If formatted as "Lastname, Firstname"
  if (clean.includes(",")) {
    const parts = clean.split(",").map((p) => p.trim());
    const lastName = parts[0];
    const givenNames = parts.slice(1).join(" ");
    const givenParts = givenNames.split(/\s+/).filter(Boolean);
    const initials = givenParts.map((p) => `${p[0]?.toUpperCase()}.`).join(" ");

    return {
      firstName: givenNames,
      initials: initials || `${lastName[0]?.toUpperCase()}.`,
      lastName,
      fullClean: `${givenNames} ${lastName}`.trim(),
    };
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return {
      firstName: "",
      initials: "",
      lastName: "Unknown",
      fullClean: "Unknown",
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      initials: `${parts[0][0]?.toUpperCase()}.`,
      lastName: parts[0],
      fullClean: parts[0],
    };
  }

  const lastName = parts[parts.length - 1];
  const givenParts = parts.slice(0, -1);
  const firstName = givenParts.join(" ");
  const initials = givenParts.map((p) => `${p[0]?.toUpperCase()}.`).join(" ");

  return {
    firstName,
    initials,
    lastName,
    fullClean: clean,
  };
}

/**
 * Resolves publication year from explicit year or publishedAt date.
 */
function resolveYear(meta: CitationArticleMetadata): number | null {
  if (meta.year && meta.year > 1900 && meta.year < 2200) {
    return meta.year;
  }
  if (meta.publishedAt) {
    const d = new Date(meta.publishedAt);
    if (!Number.isNaN(d.getTime())) {
      return d.getFullYear();
    }
  }
  return null;
}

/**
 * Resolves standard formatted page range string.
 */
function resolvePages(meta: CitationArticleMetadata): string | null {
  if (!meta.pageStart) return null;
  const start = meta.pageStart.trim();
  const end = meta.pageEnd?.trim();
  if (!start) return null;
  if (end && end !== start) {
    return `${start}–${end}`;
  }
  return start;
}

/**
 * Resolves standard DOI link or null.
 */
function resolveDoiUrl(doi: string | null | undefined): string | null {
  if (!doi) return null;
  const clean = doi.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  return `https://doi.org/${clean}`;
}

/**
 * APA 7th Edition Citation Generator
 */
export function generateApa7(meta: CitationArticleMetadata): string {
  const parsedAuthors = meta.authors.map((a) => parseAuthorName(a.fullName));
  let authorsStr = "";

  if (parsedAuthors.length === 0) {
    authorsStr = "Anonymous.";
  } else if (parsedAuthors.length === 1) {
    authorsStr = `${parsedAuthors[0].lastName}, ${parsedAuthors[0].initials}`;
  } else if (parsedAuthors.length === 2) {
    authorsStr = `${parsedAuthors[0].lastName}, ${parsedAuthors[0].initials}, & ${parsedAuthors[1].lastName}, ${parsedAuthors[1].initials}`;
  } else if (parsedAuthors.length <= 20) {
    const lead = parsedAuthors
      .slice(0, -1)
      .map((a) => `${a.lastName}, ${a.initials}`)
      .join(", ");
    const last = parsedAuthors[parsedAuthors.length - 1];
    authorsStr = `${lead}, & ${last.lastName}, ${last.initials}`;
  } else {
    const first19 = parsedAuthors
      .slice(0, 19)
      .map((a) => `${a.lastName}, ${a.initials}`)
      .join(", ");
    const last = parsedAuthors[parsedAuthors.length - 1];
    authorsStr = `${first19}, … ${last.lastName}, ${last.initials}`;
  }

  const year = resolveYear(meta);
  const yearStr = year ? `(${year}).` : "(n.d.).";

  let title = meta.title.trim();
  if (!title.endsWith(".") && !title.endsWith("?") && !title.endsWith("!")) {
    title += ".";
  }

  const journal = meta.journalName.trim();
  let pubLoc = journal;

  if (meta.volume) {
    pubLoc += `, ${meta.volume}`;
    if (meta.issue) {
      pubLoc += `(${meta.issue})`;
    }
  } else if (meta.issue) {
    pubLoc += `, (${meta.issue})`;
  }

  const pages = resolvePages(meta);
  if (pages) {
    pubLoc += `, ${pages}`;
  }
  pubLoc += ".";

  const link = resolveDoiUrl(meta.doi) || meta.canonicalUrl;

  return `${authorsStr} ${yearStr} ${title} ${pubLoc} ${link}`.trim();
}

/**
 * MLA 9th Edition Citation Generator
 */
export function generateMla9(meta: CitationArticleMetadata): string {
  const parsedAuthors = meta.authors.map((a) => parseAuthorName(a.fullName));
  let authorsStr = "";

  if (parsedAuthors.length === 0) {
    authorsStr = "";
  } else if (parsedAuthors.length === 1) {
    authorsStr = `${parsedAuthors[0].lastName}, ${parsedAuthors[0].firstName}.`;
  } else if (parsedAuthors.length === 2) {
    authorsStr = `${parsedAuthors[0].lastName}, ${parsedAuthors[0].firstName}, and ${parsedAuthors[1].firstName} ${parsedAuthors[1].lastName}.`;
  } else {
    authorsStr = `${parsedAuthors[0].lastName}, ${parsedAuthors[0].firstName}, et al.`;
  }

  let title = meta.title.trim();
  if (!title.endsWith(".") && !title.endsWith("?") && !title.endsWith("!")) {
    title += ".";
  }
  const titleStr = `"${title}"`;

  const journalStr = `${meta.journalName.trim()},`;

  const containerParts: string[] = [];
  if (meta.volume) containerParts.push(`vol. ${meta.volume}`);
  if (meta.issue) containerParts.push(`no. ${meta.issue}`);

  const year = resolveYear(meta);
  if (year) containerParts.push(`${year}`);

  const pages = resolvePages(meta);
  if (pages) {
    containerParts.push(
      pages.includes("–") || pages.includes("-")
        ? `pp. ${pages}`
        : `p. ${pages}`,
    );
  }

  const link = resolveDoiUrl(meta.doi) || meta.canonicalUrl;
  containerParts.push(`${link}.`);

  const containerStr = containerParts.join(", ");

  return [authorsStr, titleStr, journalStr, containerStr]
    .filter(Boolean)
    .join(" ");
}

/**
 * Chicago 17th Edition (Author-Date) Citation Generator
 */
export function generateChicago17(meta: CitationArticleMetadata): string {
  const parsedAuthors = meta.authors.map((a) => parseAuthorName(a.fullName));
  let authorsStr = "";

  if (parsedAuthors.length === 0) {
    authorsStr = "Anonymous.";
  } else if (parsedAuthors.length === 1) {
    authorsStr = `${parsedAuthors[0].lastName}, ${parsedAuthors[0].firstName}.`;
  } else if (parsedAuthors.length === 2) {
    authorsStr = `${parsedAuthors[0].lastName}, ${parsedAuthors[0].firstName}, and ${parsedAuthors[1].firstName} ${parsedAuthors[1].lastName}.`;
  } else if (parsedAuthors.length === 3) {
    authorsStr = `${parsedAuthors[0].lastName}, ${parsedAuthors[0].firstName}, ${parsedAuthors[1].firstName} ${parsedAuthors[1].lastName}, and ${parsedAuthors[2].firstName} ${parsedAuthors[2].lastName}.`;
  } else {
    authorsStr = `${parsedAuthors[0].lastName}, ${parsedAuthors[0].firstName}, et al.`;
  }

  const year = resolveYear(meta);
  const yearStr = year ? `${year}.` : "n.d.";

  let title = meta.title.trim();
  if (!title.endsWith(".") && !title.endsWith("?") && !title.endsWith("!")) {
    title += ".";
  }
  const titleStr = `"${title}"`;

  let details = meta.journalName.trim();
  if (meta.volume) {
    details += ` ${meta.volume}`;
    if (meta.issue) {
      details += `, no. ${meta.issue}`;
    }
  } else if (meta.issue) {
    details += `, no. ${meta.issue}`;
  }

  const pages = resolvePages(meta);
  if (pages) {
    details += `: ${pages}.`;
  } else {
    details += ".";
  }

  const link = resolveDoiUrl(meta.doi) || meta.canonicalUrl;

  return `${authorsStr} ${yearStr} ${titleStr} ${details} ${link}`.trim();
}

/**
 * Harvard Citation Generator
 */
export function generateHarvard(meta: CitationArticleMetadata): string {
  const parsedAuthors = meta.authors.map((a) => parseAuthorName(a.fullName));
  let authorsStr = "";

  if (parsedAuthors.length === 0) {
    authorsStr = "Anon.";
  } else if (parsedAuthors.length === 1) {
    authorsStr = `${parsedAuthors[0].lastName}, ${parsedAuthors[0].initials}`;
  } else if (parsedAuthors.length === 2) {
    authorsStr = `${parsedAuthors[0].lastName}, ${parsedAuthors[0].initials} and ${parsedAuthors[1].lastName}, ${parsedAuthors[1].initials}`;
  } else if (parsedAuthors.length <= 3) {
    const lead = parsedAuthors
      .slice(0, -1)
      .map((a) => `${a.lastName}, ${a.initials}`)
      .join(", ");
    const last = parsedAuthors[parsedAuthors.length - 1];
    authorsStr = `${lead} and ${last.lastName}, ${last.initials}`;
  } else {
    authorsStr = `${parsedAuthors[0].lastName}, ${parsedAuthors[0].initials} et al.`;
  }

  const year = resolveYear(meta);
  const yearStr = year ? `(${year})` : "(no date)";

  let title = meta.title.trim();
  if (title.endsWith(".")) {
    title = title.slice(0, -1);
  }
  const titleStr = `'${title}',`;

  let details = `${meta.journalName.trim()},`;
  if (meta.volume) {
    details += ` ${meta.volume}`;
    if (meta.issue) {
      details += `(${meta.issue}),`;
    } else {
      details += ",";
    }
  } else if (meta.issue) {
    details += ` (${meta.issue}),`;
  }

  const pages = resolvePages(meta);
  if (pages) {
    details += ` pp. ${pages}.`;
  }

  const link = resolveDoiUrl(meta.doi) || meta.canonicalUrl;
  const linkStr = `Available at: ${link}`;

  return `${authorsStr} ${yearStr} ${titleStr} ${details} ${linkStr}`.trim();
}

/**
 * BibTeX Citation Generator
 */
export function generateBibTeX(meta: CitationArticleMetadata): string {
  const parsedAuthors = meta.authors.map((a) => parseAuthorName(a.fullName));
  const authorBib = parsedAuthors
    .map((a) => `${a.lastName}, ${a.firstName || a.initials}`)
    .join(" and ");

  const year = resolveYear(meta);
  const firstAuthorLast =
    parsedAuthors[0]?.lastName?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "article";
  const titleSlug =
    meta.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)[0] || "paper";
  const citeKey = `${firstAuthorLast}${year || "nd"}${titleSlug}`;

  const lines: string[] = [`@article{${citeKey},`];
  if (authorBib) lines.push(`  author = {${authorBib}},`);
  lines.push(`  title = {{${meta.title.replace(/([{}])/g, "\\$1")}}},`);
  lines.push(`  journal = {{${meta.journalName.replace(/([{}])/g, "\\$1")}}},`);
  if (year) lines.push(`  year = {${year}},`);
  if (meta.volume) lines.push(`  volume = {${meta.volume}},`);
  if (meta.issue) lines.push(`  number = {${meta.issue}},`);

  const pages = resolvePages(meta);
  if (pages) {
    const bibPages = pages.replace(/[–—]/g, "--");
    lines.push(`  pages = {${bibPages}},`);
  }

  if (meta.doi) {
    const cleanDoi = meta.doi
      .trim()
      .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
    lines.push(`  doi = {${cleanDoi}},`);
  }
  lines.push(`  url = {${meta.canonicalUrl}}`);
  lines.push(`}`);

  return lines.join("\n");
}

/**
 * Generates all implemented citation styles for an article.
 */
export function generateCitations(
  meta: CitationArticleMetadata,
): Record<CitationStyle, CitationResult> {
  return {
    apa: {
      style: "apa",
      label: "APA 7th",
      text: generateApa7(meta),
      mimeType: "text/plain",
    },
    mla: {
      style: "mla",
      label: "MLA 9th",
      text: generateMla9(meta),
      mimeType: "text/plain",
    },
    chicago: {
      style: "chicago",
      label: "Chicago 17th",
      text: generateChicago17(meta),
      mimeType: "text/plain",
    },
    harvard: {
      style: "harvard",
      label: "Harvard",
      text: generateHarvard(meta),
      mimeType: "text/plain",
    },
    bibtex: {
      style: "bibtex",
      label: "BibTeX",
      text: generateBibTeX(meta),
      mimeType: "application/x-bibtex",
    },
  };
}
