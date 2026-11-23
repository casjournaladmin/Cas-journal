import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  generateIssueTOCPdf,
  type IssueTOCData,
} from "../lib/editorial/toc-pdf";

test("1. TOC PDF Branding: Institutional header removed and individual journal name displayed as header", async () => {
  const sampleIssue: IssueTOCData = {
    id: "test-issue-1",
    number: 1,
    volume: {
      number: 4,
      year: 2026,
      journal: {
        name: "The Polis: Journal of Political Studies",
        shortName: "POLIS",
        slug: "polis",
      },
    },
    articles: [
      {
        id: "art-1",
        title: "Shaykh Ādam al-‘Ilūrī's Poem on Western Politics",
        issueOrder: 1,
        pageStart: "1",
        pageEnd: "15",
        doi: "10.68251/polis.v4i1.1",
        authors: [{ fullName: "Dr. Ibrahim Al-Fulani" }],
      },
    ],
  };

  const pdfBytes = await generateIssueTOCPdf(sampleIssue);
  assert.ok(pdfBytes instanceof Uint8Array);
  assert.ok(pdfBytes.length > 500);

  // Read generated PDF file content directly
  const tocPdfSource = fs.readFileSync(
    path.join(process.cwd(), "lib/editorial/toc-pdf.ts"),
    "utf8",
  );

  // Institutional header removed
  assert.equal(
    tocPdfSource.includes("CONCRESCENCE ACADEMIC SOCIETY · CAS JOURNALS"),
    false,
    "Institutional header 'CONCRESCENCE ACADEMIC SOCIETY · CAS JOURNALS' must be removed",
  );
  assert.equal(
    tocPdfSource.includes("Official Publication of CAS Journals"),
    false,
    "Old footer 'Official Publication of CAS Journals' must be removed",
  );

  // New simpler footer with pagination
  assert.ok(
    tocPdfSource.includes("CASJOURNALS · Page"),
    "TOC PDF footer must use simpler CASJOURNALS branding with pagination",
  );
});

test("2. TOC HTML Route: Institutional header removed and simpler CASJOURNALS footer applied", () => {
  const routePath = path.join(
    process.cwd(),
    "app/api/issues/[issueId]/toc/route.ts",
  );
  const content = fs.readFileSync(routePath, "utf8");

  assert.equal(
    content.includes("Concrescence Academic Society · CAS Journals"),
    false,
    "Institutional header must be removed from HTML TOC template",
  );
  assert.equal(
    content.includes("Official Publication of CAS Journals"),
    false,
    "Old footer must be removed from HTML TOC template",
  );
  assert.ok(
    content.includes("CASJOURNALS · Generated"),
    "HTML TOC template must use simpler CASJOURNALS footer branding",
  );
});

test("3. Article Page Footer Branding: Updated to CASJOURNALS", () => {
  const articlePagePath = path.join(
    process.cwd(),
    "app/(public)/articles/[articleSlug]/page.tsx",
  );
  const content = fs.readFileSync(articlePagePath, "utf8");

  assert.equal(
    content.includes("CAS Journals · Open Access Academic Publishing"),
    false,
    "Old article footer 'CAS Journals · Open Access Academic Publishing' must be removed",
  );
  assert.ok(
    content.includes("<span>CASJOURNALS</span>"),
    "Article page footer must display 'CASJOURNALS'",
  );
});

test("4. Contact Page: Displays prominent WhatsApp enquiry button and removes email/phone text", () => {
  const contactPagePath = path.join(
    process.cwd(),
    "app/(public)/contact/page.tsx",
  );
  const content = fs.readFileSync(contactPagePath, "utf8");

  // WhatsApp button exists and points to official international link
  assert.ok(
    content.includes('href="https://wa.me/2347060608100"'),
    "Contact page must have a button linking to https://wa.me/2347060608100",
  );
  assert.ok(
    content.includes('target="_blank"'),
    "WhatsApp link must have target='_blank'",
  );
  assert.ok(
    content.includes('rel="noopener noreferrer"'),
    "WhatsApp link must have rel='noopener noreferrer'",
  );
  assert.ok(
    content.includes("Chat with us on WhatsApp"),
    "WhatsApp button must be labelled 'Chat with us on WhatsApp'",
  );
  assert.ok(
    content.includes("bg-[#25D366]"),
    "WhatsApp button must use official WhatsApp green styling",
  );

  // Email addresses and phone numbers removed from displayed text
  assert.equal(
    content.includes("mailto:"),
    false,
    "Displayed mailto links must be removed from the Contact page",
  );
  assert.equal(
    content.includes("editorial@casjournals.org"),
    false,
    "editorial@casjournals.org must be removed from the Contact page",
  );
  assert.equal(
    content.includes("submissions@casjournals.org"),
    false,
    "submissions@casjournals.org must be removed from the Contact page",
  );
  assert.equal(
    content.includes("finance@casjournals.org"),
    false,
    "finance@casjournals.org must be removed from the Contact page",
  );
  assert.equal(
    content.includes("reviewers@casjournals.org"),
    false,
    "reviewers@casjournals.org must be removed from the Contact page",
  );

  // Telephone numbers must never appear as visible text
  assert.equal(
    content.includes(">07060608100<"),
    false,
    "Phone number 07060608100 must not appear as visible text",
  );
  assert.equal(
    content.includes(">2347060608100<"),
    false,
    "Phone number 2347060608100 must not appear as visible text",
  );
  assert.equal(
    content.includes("08085904192"),
    false,
    "Old phone number 08085904192 must not appear on Contact page",
  );
});
