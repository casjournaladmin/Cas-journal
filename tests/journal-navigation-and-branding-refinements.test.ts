import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { resolveCanonicalJournalSlug } from "@/lib/editorial/editorial-board-data";
import { getJournalAboutData } from "@/lib/editorial/journal-about-data";

test("1. Journal Navigation: Redundant Home removed, Journal Home retained", () => {
  const navPath = path.join(
    process.cwd(),
    "components/journal/journal-navigation.tsx",
  );
  const navContent = fs.readFileSync(navPath, "utf8");

  // Redundant Home must be removed
  assert.equal(navContent.includes('{ label: "Home", href: "/" }'), false);
  assert.equal(navContent.includes('label: "Home"'), false);

  // Journal Home must be present
  assert.equal(navContent.includes('label: "Journal Home"'), true);

  // Journal-scoped secondary navigation destinations
  assert.equal(navContent.includes('label: "About"'), true);
  assert.equal(navContent.includes('label: "Editorial Board"'), true);
  assert.equal(navContent.includes('label: "Current Issue"'), true);
  assert.equal(navContent.includes('label: "Archives"'), true);
  assert.equal(navContent.includes('label: "Announcements"'), true);
  assert.equal(navContent.includes('label: "Submit"'), true);
  assert.equal(navContent.includes('label: "Contact"'), true);
});

test("2. Complete CASJOURNALS rebrand on Login Page", () => {
  const loginPath = path.join(process.cwd(), "app/login/page.tsx");
  const loginContent = fs.readFileSync(loginPath, "utf8");

  // Must not contain spaced "CAS Journals"
  assert.equal(loginContent.includes("CAS Journals"), false);

  // Must contain CASJOURNALS branding
  assert.equal(loginContent.includes("CASJOURNALS"), true);
  assert.equal(
    loginContent.includes("Sign in to access your CASJOURNALS workspace."),
    true,
  );
  assert.equal(
    loginContent.includes('alt="Scholarly cosmic books — CASJOURNALS"'),
    true,
  );
});

test("3. Duplicate Super Admin navigation removed from left, retained on right", () => {
  const journalLayoutPath = path.join(
    process.cwd(),
    "app/admin/[journalSlug]/layout.tsx",
  );
  const layoutContent = fs.readFileSync(journalLayoutPath, "utf8");

  // Left-hand navigation list must not include duplicate Super Admin link
  assert.equal(layoutContent.includes('"← Super Admin"'), false);

  // Authenticated shell must retain the right-hand Super Admin button
  const shellPath = path.join(
    process.cwd(),
    "components/app/authenticated-shell.tsx",
  );
  const shellContent = fs.readFileSync(shellPath, "utf8");
  assert.equal(shellContent.includes("← Super Admin"), true);
  assert.equal(
    shellContent.includes("Return to Super Admin Operating Center"),
    true,
  );
});

test("4. Duplicate Delete Manuscript panel removed from bottom, retained at top", () => {
  const manuscriptPagePath = path.join(
    process.cwd(),
    "app/admin/[journalSlug]/submissions/[submissionId]/page.tsx",
  );
  const pageContent = fs.readFileSync(manuscriptPagePath, "utf8");

  // Bottom danger zone panel must be removed
  assert.equal(pageContent.includes("Admin Removal / Danger Zone"), false);
  assert.equal(
    pageContent.includes(
      "Permanently remove this manuscript submission, author files",
    ),
    false,
  );

  // Top/header delete button must be retained
  assert.equal(pageContent.includes("<DeleteManuscriptButton"), true);
});

test("5. Homepage submission fee banner does not render &check; entity", () => {
  const homePath = path.join(process.cwd(), "app/(public)/page.tsx");
  const homeContent = fs.readFileSync(homePath, "utf8");

  // Banner must not contain erroneous entity before message
  assert.equal(homeContent.includes("&check; Submission is Free"), false);

  // Banner must cleanly display the free submission policy
  assert.equal(
    homeContent.includes(
      "Submission is Free &mdash; Zero Upfront Submission Fee",
    ),
    true,
  );
});

test("6. Plain white theme restored: paper grain texture disabled", () => {
  const globalsPath = path.join(process.cwd(), "app/globals.css");
  const globalsContent = fs.readFileSync(globalsPath, "utf8");

  assert.equal(globalsContent.includes("--background: #ffffff;"), true);
  assert.equal(globalsContent.includes("--paper-grain: none;"), true);

  const themePath = path.join(process.cwd(), "app/cas-theme.css");
  const themeContent = fs.readFileSync(themePath, "utf8");
  assert.equal(
    themeContent.includes("--cas-bg: var(--background, #ffffff);"),
    true,
  );
});

test("7. Journal-aware route rewrites, scoping, and navigation helpers", () => {
  // Verify next.config.ts rewrites
  const configPath = path.join(process.cwd(), "next.config.ts");
  const configContent = fs.readFileSync(configPath, "utf8");

  assert.equal(configContent.includes("rewrites()"), true);
  assert.equal(
    configContent.includes("existentia|concrescence|cjmr|izu|polis"),
    true,
  );
  assert.equal(
    configContent.includes('destination: "/journals/:journal"'),
    true,
  );
  assert.equal(
    configContent.includes('destination: "/journals/:journal/about"'),
    true,
  );
  assert.equal(
    configContent.includes('destination: "/journals/:journal/editorial-board"'),
    true,
  );

  // Verify journal slug aliases resolve correctly
  assert.equal(resolveCanonicalJournalSlug("existentia"), "existentia");
  assert.equal(resolveCanonicalJournalSlug("concrescence"), "cjmr");
  assert.equal(resolveCanonicalJournalSlug("cjmr"), "cjmr");
  assert.equal(resolveCanonicalJournalSlug("izu"), "izu");
  assert.equal(resolveCanonicalJournalSlug("polis"), "polis");

  // Verify about data resolves for alias slug
  const cjmrAbout = getJournalAboutData("concrescence");
  assert.ok(cjmrAbout);
  assert.equal(cjmrAbout.shortName, "CJMR");

  // Verify current-issue page accepts journal param and renders journal navigation
  const currentIssuePath = path.join(
    process.cwd(),
    "app/(public)/current-issue/page.tsx",
  );
  const currentIssueContent = fs.readFileSync(currentIssuePath, "utf8");
  assert.equal(currentIssueContent.includes("searchParams"), true);
  assert.equal(currentIssueContent.includes("<JournalNavigation"), true);

  // Verify contact page accepts journal param and renders journal navigation
  const contactPath = path.join(process.cwd(), "app/(public)/contact/page.tsx");
  const contactContent = fs.readFileSync(contactPath, "utf8");
  assert.equal(contactContent.includes("searchParams"), true);
  assert.equal(contactContent.includes("<JournalNavigation"), true);

  // Verify static page route redirects top-level journal slugs
  const staticPageRoutePath = path.join(
    process.cwd(),
    "app/(public)/[casPageSlug]/page.tsx",
  );
  const staticPageContent = fs.readFileSync(staticPageRoutePath, "utf8");
  assert.equal(
    staticPageContent.includes("redirect(`/journals/${canonicalJournal}`)"),
    true,
  );
});
