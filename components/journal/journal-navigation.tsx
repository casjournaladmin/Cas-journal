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
      href: `/journals/${journalSlug}#guidelines`,
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
      className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]/95 shadow-xs backdrop-blur-md"
    >
      <Container>
        <div className="flex [scrollbar-width:none] items-center gap-1 overflow-x-auto py-2.5 [-webkit-overflow-scrolling:touch]">
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
                  className="inline-flex shrink-0 items-center rounded-full bg-[color:var(--color-accent)] px-3.5 py-1 text-xs font-semibold text-white shadow-xs transition hover:opacity-90"
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`inline-flex shrink-0 items-center rounded-md px-3 py-1 text-xs font-medium transition ${
                  isCurrent
                    ? "bg-[color:var(--color-surface-strong)] font-semibold text-[color:var(--color-accent)]"
                    : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-raised)] hover:text-[color:var(--color-foreground)]"
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
          className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]/95 shadow-xs backdrop-blur-md"
        >
          <Container>
            <div className="flex items-center gap-1 py-2.5">
              <span className="text-xs text-[color:var(--color-muted)]">
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
