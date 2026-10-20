import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

import { CAS_DEV_IDENTITIES } from "../lib/auth/dev-identities";
import { CANONICAL_JOURNAL_ORDER } from "../lib/editorial/editorial-board-data";
import { formatJournalConfirmationInfo } from "../components/submissions/submission-confirmation-dialog";

test("1. Manuscript Confirmation Modal: Clean, compact, no abbreviation section or advisory text", () => {
  const dialogFilePath = path.join(
    process.cwd(),
    "components/submissions/submission-confirmation-dialog.tsx",
  );
  const content = fs.readFileSync(dialogFilePath, "utf8");

  // Formatter function preserves clean full name and sentence
  const info = formatJournalConfirmationInfo(
    "Existentia: Concrescence Journal of Arts and Humanities (EJAH)",
    "EJAH",
  );
  assert.equal(
    info.fullName,
    "Existentia: Concrescence Journal of Arts and Humanities",
  );

  // Abbreviation badge block removed from dialog UI
  assert.equal(
    content.includes("Journal Abbreviation / Code"),
    false,
    "Abbreviation badge section must be removed from confirmation modal",
  );

  // Advisory paragraph removed
  assert.equal(
    content.includes(
      "Once submitted, your manuscript will enter editorial screening",
    ),
    false,
    "Advisory paragraph must be removed from confirmation modal",
  );

  // Retains essential elements
  assert.equal(content.includes("Target Academic Journal"), true);
  assert.equal(content.includes("Manuscript Title"), true);
  assert.equal(content.includes("Go Back"), true);
  assert.equal(content.includes("Confirm &amp; Submit"), true);
});

test("2. Development Test Accounts: 5 database-backed accounts, no separate Izu section, dynamic roles", () => {
  const switcherPath = path.join(
    process.cwd(),
    "components/auth/dev-identity-switcher.tsx",
  );
  const switcherContent = fs.readFileSync(switcherPath, "utf8");

  // Verify all 5 CAS database accounts
  const casKeys = Object.keys(CAS_DEV_IDENTITIES);
  assert.equal(casKeys.length, 5);
  assert.deepEqual(
    casKeys.sort(),
    [
      "test-author-one",
      "test-author-two",
      "test-editor-one",
      "test-editor-two",
      "test-user-five",
    ].sort(),
  );

  // Izu workflow identities section removed from the switcher UI
  assert.equal(
    switcherContent.includes("izuWorkflowIdentities"),
    false,
    "Izu workflow identities must be removed from the switcher",
  );
  assert.equal(
    switcherContent.includes("Izu Pre-configured Roles"),
    false,
    "Izu preconfigured roles section must be removed from switcher UI",
  );

  // Dev switcher must accept dynamic users
  assert.equal(switcherContent.includes("users?: DevUserItem[]"), true);

  // Login page passes dynamically queried DB users with their live roles
  const loginPagePath = path.join(process.cwd(), "app/login/page.tsx");
  const loginContent = fs.readFileSync(loginPagePath, "utf8");
  assert.equal(loginContent.includes("devUsers={devUsers}"), true);
  assert.equal(loginContent.includes("test.author.one@cas.test"), true);
  assert.equal(loginContent.includes("Journal Admin ("), true);
  assert.equal(loginContent.includes("Editor ("), true);
});

test("3. Super Admin Journal Overview: Displays only journal name and Open operations", () => {
  const dashboardPath = path.join(
    process.cwd(),
    "components/admin/super-admin-dashboard.tsx",
  );
  const content = fs.readFileSync(dashboardPath, "utf8");

  // Verify list item contains journal.name and Open operations
  assert.equal(content.includes("{journal.name}"), true);
  assert.equal(content.includes("Open operations →"), true);

  // Verify status badges and buttons removed from the journal list item
  assert.equal(
    content.includes("Submissions Standby"),
    false,
    "Submissions Standby badge must be removed from journal rows",
  );
  assert.equal(
    content.includes("Submissions Open"),
    false,
    "Submissions Open badge must be removed from journal rows",
  );
  assert.equal(
    content.includes("Edit metadata"),
    false,
    "Edit metadata button must be removed from journal rows",
  );
  assert.equal(
    content.includes("Pause submissions"),
    false,
    "Pause submissions button must be removed from journal rows",
  );
});

test("4. Canonical 4 Journals: Accidental 5th journal excluded from public catalogue and queries", async () => {
  const homePath = path.join(process.cwd(), "app/(public)/page.tsx");
  const homeContent = fs.readFileSync(homePath, "utf8");

  // Home query scopes to canonical journal slugs
  assert.equal(
    homeContent.includes("slug: { in: [...CANONICAL_JOURNAL_ORDER] }"),
    true,
  );

  // Request data getActiveJournals also scopes to canonical journal slugs
  const dataPath = path.join(process.cwd(), "lib/requests/data.ts");
  const dataContent = fs.readFileSync(dataPath, "utf8");
  assert.equal(
    dataContent.includes("slug: { in: [...CANONICAL_JOURNAL_ORDER] }"),
    true,
  );

  // Canonical order is exactly the 4 journals
  assert.deepEqual(CANONICAL_JOURNAL_ORDER, [
    "existentia",
    "cjmr",
    "izu",
    "polis",
  ]);
});

test("5. CAS Journals Branding: Decorative blue dot removed", () => {
  const brandPath = path.join(process.cwd(), "components/ui/brand-mark.tsx");
  const brandContent = fs.readFileSync(brandPath, "utf8");
  assert.equal(
    brandContent.includes('text-[#38bdf8]">.</span>'),
    false,
    "Blue dot must be removed from BrandMark",
  );

  const loginPath = path.join(process.cwd(), "app/login/page.tsx");
  const loginContent = fs.readFileSync(loginPath, "utf8");
  assert.equal(
    loginContent.includes('text-[#38bdf8]">.</span>'),
    false,
    "Blue dot must be removed from login page header",
  );

  const headerPath = path.join(
    process.cwd(),
    "components/layout/public-header.tsx",
  );
  const headerContent = fs.readFileSync(headerPath, "utf8");
  assert.equal(
    headerContent.includes("CAS Journals <span>.</span>"),
    false,
    "Dot span must be removed from public header logo",
  );
});

test("6. Journal Navigation: No arrow beside Journals, compact accessible menu", () => {
  const navPath = path.join(
    process.cwd(),
    "components/layout/public-desktop-nav.tsx",
  );
  const navContent = fs.readFileSync(navPath, "utf8");

  // Check button does not contain the rotating chevron SVG
  assert.equal(
    navContent.includes("rotate-180 text-[#38bdf8]"),
    false,
    "Arrow chevron must be removed from Journals button",
  );

  // Dropdown is compact menu
  assert.equal(
    navContent.includes("w-[660px]"),
    false,
    "Oversized 660px dropdown must be removed",
  );
  assert.equal(navContent.includes('role="menu"'), true);
  assert.equal(navContent.includes('role="menuitem"'), true);
});

test("7 & 8. Journal Pages: Image-backed heroes and unbadged plain-text ISSN", () => {
  const journalPagePath = path.join(
    process.cwd(),
    "app/(public)/journals/[journalSlug]/page.tsx",
  );
  const content = fs.readFileSync(journalPagePath, "utf8");

  // Verify image-backed hero map
  assert.equal(content.includes("JOURNAL_HERO_MAP"), true);
  assert.equal(content.includes("journal-arts-humanities.jpg"), true);
  assert.equal(content.includes("journal-multidisciplinary.jpg"), true);
  assert.equal(content.includes("journal-governance-security.jpg"), true);
  assert.equal(content.includes("journal-political-studies.jpg"), true);

  // Verify blue pill / badge styling removed from ISSN
  assert.equal(
    content.includes(
      "rounded-full border border-sky-300/25 bg-white/10 px-5 py-2 font-mono",
    ),
    false,
    "Pill badge styling must be removed from ISSN",
  );
});

test("9 & 10. Journal Pages: Mature academic layout & clean typographic editorial board", () => {
  const editorialBoardPagePath = path.join(
    process.cwd(),
    "app/(public)/journals/[journalSlug]/editorial-board/page.tsx",
  );
  const content = fs.readFileSync(editorialBoardPagePath, "utf8");

  // Boxed cards removed from editorial board
  assert.equal(
    content.includes(
      "border-[color:var(--color-accent)]/40 bg-[color:var(--color-surface-raised)] p-6 shadow-sm",
    ),
    false,
    "Boxed cards must be removed from editorial leadership",
  );

  // Clean typographic roster present on dedicated editorial board page
  assert.equal(content.includes("Editorial Leadership"), true);
  assert.equal(content.includes("officer!.role"), true);
  assert.equal(content.includes("officer!.name"), true);
  assert.equal(content.includes("officer!.affiliation"), true);
});
