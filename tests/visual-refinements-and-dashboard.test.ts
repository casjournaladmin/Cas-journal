import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "@/lib/config/site";

test("1. Hero Images: Public routes use image-backed heroes with high-contrast gradients", () => {
  const cssPath = path.join(process.cwd(), "app/cas-theme.css");
  const css = fs.readFileSync(cssPath, "utf8");

  // Verify CSS image-backed classes exist
  assert.equal(css.includes(".cas-page-hero.cas-page-hero-authors"), true);
  assert.equal(css.includes(".cas-page-hero.cas-page-hero-current"), true);
  assert.equal(css.includes(".cas-page-hero.cas-page-hero-archive"), true);
  assert.equal(css.includes(".cas-page-hero.cas-page-hero-indexing"), true);
  assert.equal(css.includes(".cas-page-hero.cas-page-hero-contact"), true);
  assert.equal(css.includes(".cas-page-hero.cas-page-hero-about"), true);
  assert.equal(
    css.includes(".cas-page-hero.cas-page-hero-editorial-board"),
    true,
  );
  assert.equal(
    css.includes(".cas-page-hero.cas-page-hero-announcements"),
    true,
  );
  assert.equal(css.includes(".cas-page-hero.cas-page-hero-reviewer"), true);

  // Default fallback must not be a flat blue box
  assert.equal(
    css.includes('url("/assets/images/hero-scholarly-bg.jpg")'),
    true,
    "Default cas-page-hero must be image-backed",
  );

  // Check public pages use their respective classes
  const submissionsPage = fs.readFileSync(
    path.join(process.cwd(), "app/(public)/submissions/page.tsx"),
    "utf8",
  );
  assert.equal(submissionsPage.includes("cas-page-hero-authors"), true);

  const currentIssuePage = fs.readFileSync(
    path.join(process.cwd(), "app/(public)/current-issue/page.tsx"),
    "utf8",
  );
  assert.equal(currentIssuePage.includes("cas-page-hero-current"), true);

  const archivePage = fs.readFileSync(
    path.join(process.cwd(), "app/(public)/archives/page.tsx"),
    "utf8",
  );
  assert.equal(archivePage.includes("cas-page-hero-archive"), true);

  const aboutPage = fs.readFileSync(
    path.join(process.cwd(), "app/(public)/about/page.tsx"),
    "utf8",
  );
  assert.equal(aboutPage.includes("cas-page-hero-about"), true);

  const contactPage = fs.readFileSync(
    path.join(process.cwd(), "app/(public)/contact/page.tsx"),
    "utf8",
  );
  assert.equal(contactPage.includes("cas-page-hero-contact"), true);

  const editorialBoardPage = fs.readFileSync(
    path.join(process.cwd(), "app/(public)/editorial-board/page.tsx"),
    "utf8",
  );
  assert.equal(
    editorialBoardPage.includes("cas-page-hero-editorial-board"),
    true,
  );

  const announcementsPage = fs.readFileSync(
    path.join(process.cwd(), "app/(public)/announcements/page.tsx"),
    "utf8",
  );
  assert.equal(announcementsPage.includes("cas-page-hero-announcements"), true);

  const reviewerPage = fs.readFileSync(
    path.join(process.cwd(), "app/(public)/apply-reviewer/page.tsx"),
    "utf8",
  );
  assert.equal(reviewerPage.includes("cas-page-hero-reviewer"), true);
});

test("2. Public Navigation: Current Issue removed from main header navigation while route remains accessible", () => {
  const topNavLabels: string[] = siteConfig.publicNavigation.map(
    (item) => item.label,
  );
  assert.equal(
    topNavLabels.includes("Current Issue"),
    false,
    "Current Issue must be removed from public header navigation",
  );
  assert.equal(topNavLabels.includes("Archive"), true);

  // Verify page file exists and is intact
  const currentIssuePath = path.join(
    process.cwd(),
    "app/(public)/current-issue/page.tsx",
  );
  assert.equal(fs.existsSync(currentIssuePath), true);
});

test("3. Super Admin Overview: Layout, 3 metrics, 4 canonical journals, and collapsible sidebar", () => {
  const dashboardPath = path.join(
    process.cwd(),
    "components/admin/super-admin-dashboard.tsx",
  );
  const dashboard = fs.readFileSync(dashboardPath, "utf8");

  // Overview title and Operating Center removal
  assert.equal(dashboard.includes("Overview"), true);
  assert.equal(dashboard.includes("Operating Center"), false);
  assert.equal(dashboard.includes("Operational Metrics"), true);

  // Three database-backed metric cards without pulsating dots
  assert.equal(dashboard.includes("Submission Requests"), true);
  assert.equal(dashboard.includes("Published Articles"), true);
  assert.equal(dashboard.includes("Manuscripts Awaiting Action"), true);
  assert.equal(dashboard.includes("animate-pulse"), false);

  // 4 canonical journals with cover thumbnail and open operations
  assert.equal(dashboard.includes("CAS Scholarly Journals"), true);
  assert.equal(dashboard.includes("{journal.name}"), true);
  assert.equal(dashboard.includes("Open operations →"), true);

  // Recent platform activity feed section removed as requested
  assert.equal(dashboard.includes("Recent Platform Activity"), false);

  // Platform admin shell with collapsible sidebar
  const shellPath = path.join(
    process.cwd(),
    "components/admin/platform-admin-shell.tsx",
  );
  assert.equal(fs.existsSync(shellPath), true);
  const shell = fs.readFileSync(shellPath, "utf8");
  assert.equal(shell.includes("AdminSidebarNav"), true);
  assert.equal(shell.includes("isCollapsed"), true);
  assert.equal(shell.includes("cas-admin-sidebar-collapsed"), true);

  // Brand and compact Admin badge that does not break into multiple lines
  assert.equal(shell.includes("whitespace-nowrap"), true);
  assert.equal(shell.includes("h-16"), true);

  // Submission Requests removed from sidebar (accessible via metric card)
  assert.equal(shell.includes('{ href: "/admin/requests"'), false);

  // Other platform nav items present
  assert.equal(shell.includes("/admin/submissions"), true);
  assert.equal(shell.includes("/admin/articles"), true);
  assert.equal(shell.includes("/admin/editorial-board"), true);
  assert.equal(shell.includes("/admin/reviewers"), true);
  assert.equal(shell.includes("/admin/announcements"), true);
  assert.equal(shell.includes("/admin/access"), true);
});

test("5. Stability & Anti-Flickering: Loading skeleton matches sidebar shell and theme script prevents hydration flash", () => {
  const loadingPath = path.join(process.cwd(), "app/admin/loading.tsx");
  assert.equal(fs.existsSync(loadingPath), true);
  const loading = fs.readFileSync(loadingPath, "utf8");
  // Loading skeleton must include the sidebar to prevent horizontal content jumping
  assert.equal(loading.includes("<aside"), true);
  assert.equal(loading.includes("w-64"), true);
  assert.equal(loading.includes("h-16"), true);

  // Root layout must include inline theme initialization script
  const layoutPath = path.join(process.cwd(), "app/layout.tsx");
  const layout = fs.readFileSync(layoutPath, "utf8");
  assert.equal(layout.includes("localStorage.getItem('app-theme')"), true);
  assert.equal(layout.includes("suppressHydrationWarning"), true);
});

test("4. Login Page Redesign: Full-screen immersive experience with abstract open-book folio", () => {
  const loginPath = path.join(process.cwd(), "app/login/page.tsx");
  const login = fs.readFileSync(loginPath, "utf8");

  // Single full-viewport composition: no split-screen grid
  assert.equal(login.includes("lg:grid"), false);
  assert.equal(login.includes("hero-scholarly-bg.jpg"), false);

  // Visual centerpiece: ScholarlyBookFolio component
  assert.equal(login.includes("ScholarlyBookFolio"), true);
  const folioPath = path.join(
    process.cwd(),
    "components/auth/scholarly-book-folio.tsx",
  );
  assert.equal(fs.existsSync(folioPath), true);
  const folio = fs.readFileSync(folioPath, "utf8");
  assert.equal(folio.includes("folio-aura"), true);
  assert.equal(folio.includes("prefers-reduced-motion"), true);

  // Brand copy directly beneath book
  assert.equal(login.includes("CAS Journals"), true);
  assert.equal(login.includes("Advancing Knowledge. Inspiring Growth."), true);
  assert.equal(
    login.includes("Sign in to access your CAS Journals workspace."),
    true,
  );

  // Google sign in only (no email/password fields)
  const formPath = path.join(process.cwd(), "app/login/login-form.tsx");
  const form = fs.readFileSync(formPath, "utf8");
  assert.equal(form.includes("Continue with Google"), true);
  assert.equal(form.includes('type="password"'), false);

  // Dev switcher preserved with 5 DB accounts
  assert.equal(login.includes("devUsers={devUsers}"), true);
});
