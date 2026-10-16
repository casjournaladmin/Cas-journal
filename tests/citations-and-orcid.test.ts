import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  isValidOrcid,
  normalizeOrcid,
  getOrcidUrl,
} from "../lib/utils/orcid.js";

import {
  generateApa7,
  generateMla9,
  generateChicago17,
  generateHarvard,
  generateBibTeX,
  generateCitations,
  parseAuthorName,
  type CitationArticleMetadata,
} from "../lib/citations/generator.js";

describe("ORCID Utilities", () => {
  it("validates and normalizes valid hyphenated ORCID iDs", () => {
    // Official test ORCIDs with valid MOD 11-2 check digits
    const valid1 = "0000-0002-1825-0097"; // Josiah Carberry (famous test ORCID)
    const validWithX = "0000-0001-5109-3700"; // Valid check digit '0'

    assert.equal(isValidOrcid(valid1), true);
    assert.equal(isValidOrcid(validWithX), true);
    assert.equal(normalizeOrcid(valid1), "0000-0002-1825-0097");
    assert.equal(getOrcidUrl(valid1), "https://orcid.org/0000-0002-1825-0097");
  });

  it("accepts and strips https://orcid.org/ URL prefixes", () => {
    const url = "https://orcid.org/0000-0002-1825-0097";
    assert.equal(isValidOrcid(url), true);
    assert.equal(normalizeOrcid(url), "0000-0002-1825-0097");
  });

  it("accepts and strips http:// or bare orcid.org/ prefixes", () => {
    const http = "http://orcid.org/0000-0002-1825-0097";
    assert.equal(isValidOrcid(http), true);
    assert.equal(normalizeOrcid(http), "0000-0002-1825-0097");
  });

  it("handles valid check digit X", () => {
    // 0000-0002-1694-233X is a real ORCID with 'X' checksum
    const orcidWithX = "0000-0002-1694-233X";
    assert.equal(isValidOrcid(orcidWithX), true);
    assert.equal(normalizeOrcid("000000021694233x"), "0000-0002-1694-233X");
  });

  it("rejects invalid checksums and non-ORCID strings", () => {
    assert.equal(isValidOrcid("0000-0002-1825-0098"), false); // Wrong check digit
    assert.equal(isValidOrcid("not-an-orcid"), false);
    assert.equal(isValidOrcid(""), false);
    assert.equal(isValidOrcid(null), false);
    assert.equal(normalizeOrcid("0000-0002-1825-0098"), null);
  });
});

describe("Author Name Parsing", () => {
  it("strips titles like Prof., Dr., etc.", () => {
    const parsed = parseAuthorName("Prof. Dr. Ngozi Okafor");
    assert.equal(parsed.lastName, "Okafor");
    assert.equal(parsed.firstName, "Ngozi");
    assert.equal(parsed.initials, "N.");
  });

  it("handles Lastname, Firstname format", () => {
    const parsed = parseAuthorName("Okafor, Ngozi Joy");
    assert.equal(parsed.lastName, "Okafor");
    assert.equal(parsed.firstName, "Ngozi Joy");
    assert.equal(parsed.initials, "N. J.");
  });

  it("handles single-word names gracefully", () => {
    const parsed = parseAuthorName("Aristotle");
    assert.equal(parsed.lastName, "Aristotle");
    assert.equal(parsed.initials, "A.");
  });
});

describe("Academic Citation Generator", () => {
  const sampleArticle: CitationArticleMetadata = {
    title: "Cognitive Behavioral Interventions in Post-Primary Education",
    journalName: "Imo State University Journal of Psychology",
    journalSlug: "psychology",
    volume: 3,
    issue: 1,
    year: 2024,
    publishedAt: new Date("2024-06-15T00:00:00.000Z"),
    pageStart: "45",
    pageEnd: "58",
    doi: "10.4314/imsufoss.v3i1.4",
    canonicalUrl:
      "https://imsufoss.com/articles/cognitive-behavioral-interventions",
    authors: [
      {
        fullName: "Dr. Chukwuemeka Okoro",
        affiliation: "Department of Psychology, IMSU",
      },
      {
        fullName: "Adaobi Nwachukwu",
        affiliation: "Faculty of Education, UNN",
      },
    ],
  };

  it("generates APA 7th edition correctly", () => {
    const citation = generateApa7(sampleArticle);
    assert.match(citation, /^Okoro, C\., & Nwachukwu, A\. \(2024\)\./);
    assert.match(
      citation,
      /Cognitive Behavioral Interventions in Post-Primary Education\./,
    );
    assert.match(
      citation,
      /Imo State University Journal of Psychology, 3\(1\), 45–58\./,
    );
    assert.match(citation, /https:\/\/doi\.org\/10\.4314\/imsufoss\.v3i1\.4$/);
  });

  it("generates MLA 9th edition correctly", () => {
    const citation = generateMla9(sampleArticle);
    assert.match(citation, /^Okoro, Chukwuemeka, and Adaobi Nwachukwu\./);
    assert.match(
      citation,
      /"Cognitive Behavioral Interventions in Post-Primary Education\."/,
    );
    assert.match(citation, /vol\. 3, no\. 1, 2024, pp\. 45–58/);
  });

  it("generates Chicago 17th edition correctly", () => {
    const citation = generateChicago17(sampleArticle);
    assert.match(
      citation,
      /^Okoro, Chukwuemeka, and Adaobi Nwachukwu\. 2024\./,
    );
    assert.match(citation, /3, no\. 1: 45–58\./);
  });

  it("generates Harvard style correctly", () => {
    const citation = generateHarvard(sampleArticle);
    assert.match(citation, /^Okoro, C\. and Nwachukwu, A\. \(2024\)/);
    assert.match(
      citation,
      /'Cognitive Behavioral Interventions in Post-Primary Education',/,
    );
    assert.match(citation, /3\(1\), pp\. 45–58\./);
  });

  it("generates BibTeX correctly", () => {
    const bib = generateBibTeX(sampleArticle);
    assert.match(bib, /@article\{okoro2024cognitive,/);
    assert.match(bib, /author = \{Okoro, Chukwuemeka and Nwachukwu, Adaobi\},/);
    assert.match(
      bib,
      /journal = \{\{Imo State University Journal of Psychology\}\},/,
    );
    assert.match(bib, /volume = \{3\},/);
    assert.match(bib, /number = \{1\},/);
    assert.match(bib, /pages = \{45--58\},/);
    assert.match(bib, /doi = \{10\.4314\/imsufoss\.v3i1\.4\}/);
  });

  it("handles missing optional values without fabricating", () => {
    const sparseArticle: CitationArticleMetadata = {
      title: "An Exploration of Early Childhood Development",
      journalName: "Nigerian Journal of Social Review",
      canonicalUrl: "https://imsufoss.com/articles/early-childhood-dev",
      authors: [{ fullName: "Prof. Kenneth Eze" }],
    };

    const apa = generateApa7(sparseArticle);
    assert.match(apa, /^Eze, K\. \(n\.d\.\)\./);
    assert.doesNotMatch(apa, /Volume|Issue|Pages|doi\.org/);
    assert.match(apa, /https:\/\/imsufoss\.com\/articles\/early-childhood-dev/);

    const mla = generateMla9(sparseArticle);
    assert.match(mla, /^Eze, Kenneth\./);

    const citations = generateCitations(sparseArticle);
    assert.equal(citations.apa.style, "apa");
    assert.equal(citations.bibtex.mimeType, "application/x-bibtex");
  });
});

import { validateAuthors } from "../lib/submissions/validation.js";

describe("Submission Author Validation", () => {
  it("accepts valid authors with optional affiliation and valid ORCID", () => {
    const res = validateAuthors([
      {
        fullName: "Dr. Ngozi Okafor",
        email: "ngozi@imsu.edu.ng",
        affiliation: "Department of Psychology, IMSU",
        orcid: "https://orcid.org/0000-0002-1825-0097",
        isCorrespondingAuthor: true,
      },
      {
        fullName: "Chukwudi Eze",
        email: "eze@unn.edu.ng",
        affiliation: "Faculty of Social Sciences",
        orcid: "",
        isCorrespondingAuthor: false,
      },
    ]);

    assert.equal(res.valid, true);
    assert.equal(Object.keys(res.fieldErrors).length, 0);
  });

  it("flags invalid ORCID formats with clear error messages", () => {
    const res = validateAuthors([
      {
        fullName: "Dr. Ngozi Okafor",
        email: "ngozi@imsu.edu.ng",
        affiliation: "IMSU",
        orcid: "invalid-orcid-1234",
        isCorrespondingAuthor: true,
      },
    ]);

    assert.equal(res.valid, false);
    assert.match(res.fieldErrors["author-0-orcid"], /ORCID should look like/);
  });

  it("requires exactly one corresponding author", () => {
    const res = validateAuthors([
      {
        fullName: "Author One",
        email: "one@test.com",
        affiliation: "",
        orcid: "",
        isCorrespondingAuthor: false,
      },
      {
        fullName: "Author Two",
        email: "two@test.com",
        affiliation: "",
        orcid: "",
        isCorrespondingAuthor: false,
      },
    ]);

    assert.equal(res.valid, false);
    assert.match(
      res.fieldErrors.corresponding,
      /Choose exactly one corresponding author/,
    );
  });
});
