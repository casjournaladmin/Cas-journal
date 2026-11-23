import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("1. Homepage journal imagery: POLIS card uses Plato & Aristotle image with preserved dimensions", () => {
  const homePath = path.join(process.cwd(), "app/(public)/page.tsx");
  const homeContent = fs.readFileSync(homePath, "utf8");

  // Verify POLIS card configuration
  assert.ok(
    homeContent.includes(
      'image: "/assets/images/journal-political-studies.jpg"',
    ),
    "POLIS card must point to journal-political-studies.jpg",
  );

  const polisImgPath = path.join(
    process.cwd(),
    "public/assets/images/journal-political-studies.jpg",
  );
  assert.ok(fs.existsSync(polisImgPath), "POLIS image file must exist");

  const stat = fs.statSync(polisImgPath);
  assert.ok(stat.size > 50000, "POLIS image must be a high quality asset");

  // Verify other journal images are untouched
  assert.ok(
    homeContent.includes('image: "/assets/images/journal-arts-humanities.jpg"'),
  );
  assert.ok(
    homeContent.includes(
      'image: "/assets/images/journal-multidisciplinary.jpg"',
    ),
  );
  assert.ok(
    homeContent.includes(
      'image: "/assets/images/journal-governance-security.jpg"',
    ),
  );
});

test("2. Clean up individual journal front pages: Redundant sections removed from landing page", () => {
  const journalLandingPath = path.join(
    process.cwd(),
    "app/(public)/journals/[journalSlug]/page.tsx",
  );
  const content = fs.readFileSync(journalLandingPath, "utf8");

  // 1. Editorial Board & Referees promotional section removed from landing page
  assert.equal(
    content.includes("Editorial Board &amp; Referees"),
    false,
    "Editorial Board & Referees promotional section must be removed from landing page",
  );
  assert.equal(
    content.includes("Scholarly Governance &amp; Leadership"),
    false,
    "Editorial Board promotional banner must be removed from landing page",
  );

  // 2. Peer Review & Publication Ethics section removed from landing page
  assert.equal(
    content.includes("Peer Review &amp; Publication Ethics"),
    false,
    "Peer Review & Publication Ethics section must be removed from landing page",
  );

  // 3. Editorial Secretariat & Office section removed from landing page
  assert.equal(
    content.includes("Editorial Secretariat &amp; Office"),
    false,
    "Editorial Secretariat & Office section must be removed from landing page",
  );

  // 4. Submission Guidelines & Accepted Article Types section removed from landing page
  assert.equal(
    content.includes("Submission Guidelines &amp; Accepted Article Types"),
    false,
    "Submission Guidelines & Accepted Article Types section must be removed from landing page",
  );
  assert.equal(
    content.includes("Accepted Article Types"),
    false,
    "Accepted Article Types block must be removed from landing page",
  );

  // Preserve core landing sections
  assert.ok(
    content.includes("Aims &amp; Scope"),
    "Aims & Scope section must be preserved",
  );
  assert.ok(
    content.includes("Recent Papers &amp; Issues"),
    "Current Issue & Recent Papers section must be preserved",
  );
  assert.ok(
    content.includes("Published Volumes &amp; Issues"),
    "Archives section must be preserved",
  );

  // Dedicated routes exist and are untouched
  assert.ok(
    fs.existsSync(
      path.join(
        process.cwd(),
        "app/(public)/journals/[journalSlug]/editorial-board/page.tsx",
      ),
    ),
    "Dedicated Editorial Board page must remain intact",
  );
  assert.ok(
    fs.existsSync(
      path.join(
        process.cwd(),
        "app/(public)/journals/[journalSlug]/about/page.tsx",
      ),
    ),
    "Dedicated About page must remain intact",
  );
});

test("3. Improved journal navigation buttons: Visual prominence, active states, and mobile touch targets", () => {
  const navPath = path.join(
    process.cwd(),
    "components/journal/journal-navigation.tsx",
  );
  const content = fs.readFileSync(navPath, "utf8");

  // All 9 navigation destinations present
  const requiredNavItems = [
    "Journal Home",
    "About",
    "Editorial Board",
    "Author Guidelines",
    "Current Issue",
    "Archives",
    "Announcements",
    "Submit",
    "Contact",
  ];

  for (const item of requiredNavItems) {
    assert.ok(
      content.includes(`"${item}"`),
      `Navigation item "${item}" must be present`,
    );
  }

  // Enhanced visual prominence
  assert.ok(
    content.includes("px-4 py-2") || content.includes("px-3.5 py-2"),
    "Button padding must be enhanced for prominence and touch targets",
  );
  assert.ok(
    content.includes("sm:text-[13px]"),
    "Typography sizing must be upgraded for readability",
  );

  // CAS brand color treatment and recognizable active states
  assert.ok(
    content.includes("#032b45"),
    "Active state must feature rich CAS deep blue branding",
  );
  assert.ok(
    content.includes("ring-2 ring-sky-500/30") || content.includes("ring-sky"),
    "Active state must feature distinct focus ring for immediate recognition",
  );

  // Mobile overflow safety
  assert.ok(
    content.includes("overflow-x-auto"),
    "Navigation must support horizontal scrolling on mobile without viewport breakage",
  );
});

test("4. Cross-journal selectors removed on individual Announcement and Archive pages", () => {
  const announcementsPath = path.join(
    process.cwd(),
    "app/(public)/announcements/page.tsx",
  );
  const announcementsContent = fs.readFileSync(announcementsPath, "utf8");

  // On individual journal announcement page, cross-journal selector is removed
  assert.ok(
    announcementsContent.includes("!activeJournalMeta ?"),
    "Cross-journal selector must only show on main announcements page, not individual journal pages",
  );

  const archivesPath = path.join(
    process.cwd(),
    "app/(public)/archives/page.tsx",
  );
  const archivesContent = fs.readFileSync(archivesPath, "utf8");

  // On individual journal archive page, cross-journal selector is removed
  assert.ok(
    archivesContent.includes("!canonical ?"),
    "Cross-journal selector must only show on main archives page, not individual journal pages",
  );
});

test("5. Correct Current Issue headings: Clean journal-specific heading without volume suffix or &mdash;", () => {
  const currentIssuePath = path.join(
    process.cwd(),
    "app/(public)/current-issue/page.tsx",
  );
  const content = fs.readFileSync(currentIssuePath, "utf8");

  // Extract <h1 className="cas-page-title"> block
  const h1Match = content.match(
    /<h1 className="cas-page-title">([\s\S]*?)<\/h1>/,
  );
  assert.ok(h1Match, "cas-page-title h1 heading must exist");
  const h1Content = h1Match[1];

  // Heading must not contain volume suffix or HTML entities
  assert.equal(
    h1Content.includes("&mdash;"),
    false,
    "Current Issue heading must not contain &mdash; HTML entities",
  );
  assert.equal(
    h1Content.includes("Volume 1 (2026)"),
    false,
    "Current Issue main heading must not contain Volume 1 (2026) suffix",
  );

  // Displays clean journal-specific heading
  assert.ok(
    h1Content.includes("${journalMeta.shortName} Current Issue"),
    "Current Issue must display clean ${journalMeta.shortName} Current Issue heading",
  );
});
