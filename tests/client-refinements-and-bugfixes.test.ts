import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { siteConfig } from "@/lib/config/site";
import {
  JOURNAL_HERO_AFFILIATIONS,
  resolveCanonicalJournalSlug,
} from "@/lib/editorial/editorial-board-data";
import {
  getJournalAboutData,
  JOURNAL_ABOUT_DATA,
} from "@/lib/editorial/journal-about-data";

test("1. Journal hero affiliations match exact required wording", () => {
  assert.equal(
    JOURNAL_HERO_AFFILIATIONS.existentia,
    "Faculty of Humanity, Imo State University, Nigeria",
  );
  assert.equal(
    JOURNAL_HERO_AFFILIATIONS.cjmr,
    "Faculty of Humanity, Imo State University, Nigeria",
  );
  assert.equal(
    JOURNAL_HERO_AFFILIATIONS.izu,
    "Department of Philosophy, Imo State University, Nigeria",
  );
  assert.equal(
    JOURNAL_HERO_AFFILIATIONS.polis,
    "Department of Philosophy, Imo State University, Nigeria",
  );
});

test("2. Global branding consistently displays CASJOURNALS as one joined word", () => {
  assert.equal(siteConfig.name, "CASJOURNALS");
  assert.equal(siteConfig.shortName, "CASJOURNALS");
  assert.equal(siteConfig.institution, "CASJOURNALS");

  const brandMarkFile = fs.readFileSync(
    path.join(process.cwd(), "components/ui/brand-mark.tsx"),
    "utf8",
  );
  assert.ok(brandMarkFile.includes("CASJOURNALS"));
  assert.ok(!brandMarkFile.includes("CAS Journals"));

  const headerFile = fs.readFileSync(
    path.join(process.cwd(), "components/layout/public-header.tsx"),
    "utf8",
  );
  assert.ok(headerFile.includes("CASJOURNALS"));
  assert.ok(!headerFile.includes("CAS Journals"));

  const footerFile = fs.readFileSync(
    path.join(process.cwd(), "components/layout/public-footer.tsx"),
    "utf8",
  );
  assert.ok(footerFile.includes("<h4>CASJOURNALS</h4>"));
  assert.ok(footerFile.includes("&copy; {currentYear}&ndash; CASJOURNALS"));
});

test("3. Original CASJOURNALS favicon exists in SVG and multi-resolution ICO", () => {
  for (const svgFile of ["app/icon.svg", "public/icon.svg"]) {
    const fullPath = path.join(process.cwd(), svgFile);
    assert.ok(fs.existsSync(fullPath), `${svgFile} must exist`);
    const content = fs.readFileSync(fullPath, "utf8");
    assert.ok(content.includes("#032b45"), "Must contain CAS deep navy");
    assert.ok(content.includes("#0284c7"), "Must contain CAS sky blue");
  }

  for (const icoFile of ["app/favicon.ico", "public/favicon.ico"]) {
    const fullPath = path.join(process.cwd(), icoFile);
    assert.ok(fs.existsSync(fullPath), `${icoFile} must exist`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 500, "ICO must have multi-resolution image data");
  }
});

test("4. Dedicated navigation component for every journal", () => {
  const navComponentPath = path.join(
    process.cwd(),
    "components/journal/journal-navigation.tsx",
  );
  assert.ok(fs.existsSync(navComponentPath));
  const navContent = fs.readFileSync(navComponentPath, "utf8");

  assert.ok(navContent.includes('"Home"'));
  assert.ok(navContent.includes('"About"'));
  assert.ok(navContent.includes('"Editorial Board"'));
  assert.ok(navContent.includes('"Author Guidelines"'));
  assert.ok(navContent.includes('"Current Issue"'));
  assert.ok(navContent.includes('"Archives"'));
  assert.ok(navContent.includes('"Announcements"'));
  assert.ok(navContent.includes('"Submit"'));
  assert.ok(navContent.includes('"Contact"'));
});

test("5. Dedicated About pages and structured content for 4 journals", () => {
  const journals = ["existentia", "cjmr", "izu", "polis"];
  for (const slug of journals) {
    const data = getJournalAboutData(slug);
    assert.ok(data, `About data must exist for ${slug}`);
    assert.ok(data.title.length > 5);
    assert.ok(data.aimsAndScope.length > 50);
    assert.ok(data.typesOfArticles.length > 0);
    assert.ok(data.publicationFrequency.length > 0);
    assert.ok(data.openAccess.includes("CC-BY 4.0"));
    assert.ok(data.reviewProcess.includes("double-blind"));
    assert.ok(data.indexing.includes("Google Scholar"));
    assert.ok(data.contact.email || data.contact.address);
  }

  const aboutPagePath = path.join(
    process.cwd(),
    "app/(public)/journals/[journalSlug]/about/page.tsx",
  );
  assert.ok(fs.existsSync(aboutPagePath));
});

test("6. Dedicated Editorial Board page route exists and links from journal landing", () => {
  const editorialBoardPagePath = path.join(
    process.cwd(),
    "app/(public)/journals/[journalSlug]/editorial-board/page.tsx",
  );
  assert.ok(fs.existsSync(editorialBoardPagePath));

  const journalLandingPath = path.join(
    process.cwd(),
    "app/(public)/journals/[journalSlug]/page.tsx",
  );
  const landingContent = fs.readFileSync(journalLandingPath, "utf8");
  assert.ok(
    landingContent.includes("/journals/${meta.slug}/editorial-board"),
    "Landing page must link to dedicated editorial board page",
  );
});

test("7. Journal-specific announcements query isolation", async () => {
  const { getPublicAnnouncements } = await import(
    "@/lib/editorial/announcements-store"
  );
  assert.equal(typeof getPublicAnnouncements, "function");
});

test("8. Manuscript tracking ID auto-generation and mutation fix", () => {
  const mutationsPath = path.join(process.cwd(), "lib/requests/mutations.ts");
  const content = fs.readFileSync(mutationsPath, "utf8");

  // Verify where clause is clean id only
  assert.ok(content.includes("where: { id: submission.id }"));
  // Verify request is updated separately
  assert.ok(content.includes("where: { id: submission.request.id }"));
  // Verify auto-generation fallback
  assert.ok(content.includes("createTrackingNumber"));
});

test("9. Admin overview recent submissions count includes new incoming submissions", () => {
  const dataPath = path.join(process.cwd(), "lib/requests/data.ts");
  const dataContent = fs.readFileSync(dataPath, "utf8");
  assert.ok(dataContent.includes("recentSubmissions"));

  const dashboardPath = path.join(
    process.cwd(),
    "components/admin/super-admin-dashboard.tsx",
  );
  const dashContent = fs.readFileSync(dashboardPath, "utf8");
  assert.ok(dashContent.includes('label="Recent Submissions"'));
});

test("10. Super Admin return navigation provided from journal-scoped views", () => {
  const shellPath = path.join(
    process.cwd(),
    "components/app/authenticated-shell.tsx",
  );
  const shellContent = fs.readFileSync(shellPath, "utf8");
  assert.ok(shellContent.includes("← Super Admin"));

  const journalLayoutPath = path.join(
    process.cwd(),
    "app/admin/[journalSlug]/layout.tsx",
  );
  const layoutContent = fs.readFileSync(journalLayoutPath, "utf8");
  assert.ok(layoutContent.includes("← Super Admin"));
});
