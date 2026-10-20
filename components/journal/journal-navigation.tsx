"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";

interface JournalNavigationProps {
  journalSlug: string;
  shortName?: string;
}

export function JournalNavigation({
  journalSlug,
  shortName,
}: JournalNavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/" },
    {
      label: "Journal Home",
      href: `/journals/${journalSlug}`,
      exact: true,
    },
    {
      label: "About",
      href: `/journals/${journalSlug}/about`,
      exact: true,
    },
    {
      label: "Editorial Board",
      href: `/journals/${journalSlug}/editorial-board`,
      exact: true,
    },
    {
      label: "Author Guidelines",
      href: "/author-guidelines",
    },
    {
      label: "Current Issue",
      href: `/current-issue`,
    },
    {
      label: "Archives",
      href: `/archives?journal=${journalSlug}`,
      isActive:
        pathname.startsWith("/archives") &&
        pathname.includes(`journal=${journalSlug}`),
    },
    {
      label: "Announcements",
      href: `/announcements?journal=${journalSlug}`,
      isActive:
        pathname.startsWith("/announcements") &&
        pathname.includes(`journal=${journalSlug}`),
    },
    {
      label: "Submit",
      href: `/author/submissions/new?journal=${journalSlug}`,
      highlight: true,
    },
    {
      label: "Contact",
      href: "/contact",
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
                : item.exact
                  ? pathname === item.href
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
