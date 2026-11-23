"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";

interface JournalNavigationProps {
  journalSlug: string;
  shortName?: string;
}

interface NavItem {
  label: string;
  href: string;
  exact?: boolean;
  isActive?: boolean;
  highlight?: boolean;
}

function JournalNavigationContent({
  journalSlug,
  shortName,
}: JournalNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeJournalParam = searchParams?.get("journal");

  const isCurrentJournalActive =
    activeJournalParam === journalSlug ||
    (journalSlug === "cjmr" && activeJournalParam === "concrescence") ||
    (journalSlug === "concrescence" && activeJournalParam === "cjmr");

  const navItems: NavItem[] = [
    {
      label: "Journal Home",
      href: `/journals/${journalSlug}`,
      exact: true,
      isActive:
        (pathname === `/journals/${journalSlug}` ||
          pathname === `/${journalSlug}`) &&
        !pathname.includes("/about") &&
        !pathname.includes("/editorial-board"),
    },
    {
      label: "About",
      href: `/journals/${journalSlug}/about`,
      exact: true,
      isActive:
        pathname === `/journals/${journalSlug}/about` ||
        pathname === `/${journalSlug}/about`,
    },
    {
      label: "Editorial Board",
      href: `/journals/${journalSlug}/editorial-board`,
      exact: true,
      isActive:
        pathname === `/journals/${journalSlug}/editorial-board` ||
        pathname === `/${journalSlug}/editorial-board`,
    },
    {
      label: "Author Guidelines",
      href: `/author-guidelines?journal=${journalSlug}`,
      isActive:
        pathname.startsWith("/author-guidelines") && isCurrentJournalActive,
    },
    {
      label: "Current Issue",
      href: `/current-issue?journal=${journalSlug}`,
      isActive: pathname.startsWith("/current-issue") && isCurrentJournalActive,
    },
    {
      label: "Archives",
      href: `/archives?journal=${journalSlug}`,
      isActive: pathname.startsWith("/archives") && isCurrentJournalActive,
    },
    {
      label: "Announcements",
      href: `/announcements?journal=${journalSlug}`,
      isActive: pathname.startsWith("/announcements") && isCurrentJournalActive,
    },
    {
      label: "Submit",
      href: `/author/submissions/new?journal=${journalSlug}`,
      highlight: true,
    },
    {
      label: "Contact",
      href: `/contact?journal=${journalSlug}`,
      isActive: pathname.startsWith("/contact") && isCurrentJournalActive,
    },
  ];

  return (
    <nav
      aria-label={`${shortName || "Journal"} Section Navigation`}
      className="sticky top-0 z-20 border-b border-sky-100 bg-[color:var(--color-surface)]/95 shadow-xs backdrop-blur-md dark:border-sky-950/80"
    >
      <Container>
        <div className="flex [scrollbar-width:none] items-center gap-2 overflow-x-auto py-3 [-webkit-overflow-scrolling:touch]">
          {navItems.map((item) => {
            const isCurrent =
              item.isActive !== undefined
                ? item.isActive
                : pathname === item.href;

            if (item.highlight) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-sky-600 to-teal-600 px-4 py-2 text-xs font-bold !text-white shadow-xs transition hover:from-sky-700 hover:to-teal-700 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:text-[13px]"
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`inline-flex shrink-0 items-center justify-center rounded-lg px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:text-[13px] ${
                  isCurrent
                    ? "border border-sky-600 bg-[#032b45] !text-white shadow-xs ring-2 ring-sky-500/30 dark:border-sky-400 dark:bg-sky-600"
                    : "border border-slate-200 bg-[color:var(--color-surface-raised)] text-slate-700 shadow-2xs hover:border-sky-400 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-800 dark:text-slate-200 dark:hover:border-sky-600 dark:hover:bg-sky-950/50 dark:hover:text-sky-300"
                }`}
                aria-current={isCurrent ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </Container>
    </nav>
  );
}

export function JournalNavigation(props: JournalNavigationProps) {
  return (
    <Suspense
      fallback={
        <nav
          aria-label={`${props.shortName || "Journal"} Section Navigation`}
          className="sticky top-0 z-20 border-b border-sky-100 bg-[color:var(--color-surface)]/95 shadow-xs backdrop-blur-md dark:border-sky-950/80"
        >
          <Container>
            <div className="flex items-center gap-2 py-3">
              <span className="text-xs font-semibold text-[color:var(--color-muted)]">
                {props.shortName} Navigation
              </span>
            </div>
          </Container>
        </nav>
      }
    >
      <JournalNavigationContent {...props} />
    </Suspense>
  );
}
