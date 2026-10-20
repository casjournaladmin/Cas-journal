"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = {
  href: string;
  label: string;
  icon:
    | "overview"
    | "requests"
    | "manuscripts"
    | "articles"
    | "governance"
    | "reviewers"
    | "announcements"
    | "users";
  badge?: string | number;
};

function NavIcon({ icon }: { icon: AdminNavItem["icon"] }) {
  const common = "size-4.5 shrink-0 transition-colors";

  switch (icon) {
    case "overview":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={common}>
          <rect
            x="3"
            y="3"
            width="6"
            height="6"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="11"
            y="3"
            width="6"
            height="6"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="3"
            y="11"
            width="6"
            height="6"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="11"
            y="11"
            width="6"
            height="6"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "requests":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={common}>
          <rect
            x="3"
            y="4"
            width="14"
            height="12"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M3 6L10 11L17 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "manuscripts":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={common}>
          <path
            d="M4 4C4 3.44772 4.44772 3 5 3H12L16 7V16C16 16.5523 15.5523 17 15 17H5C4.44772 17 4 16.5523 4 16V4Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M12 3V7H16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M7 10H13M7 13H11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "articles":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={common}>
          <path
            d="M4 5C4 4.44772 4.44772 4 5 4H15C15.5523 4 16 4.44772 16 5V16H5C4.44772 16 4 15.5523 4 15V5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M7 7H13M7 10H13M7 13H10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "governance":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={common}>
          <path
            d="M10 3L3 6V10C3 14 6 17 10 18C14 17 17 14 17 10V6L10 3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M10 7V13M7 10H13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "reviewers":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={common}>
          <path
            d="M9 11L11 13L16 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M3 16C3 13.7909 4.79086 12 7 12C8.1 12 9.09 12.45 9.8 13.18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "announcements":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={common}>
          <path
            d="M15 6V12M15 6L6 9V15L15 12M15 6H16C16.5523 6 17 6.44772 17 7V11C17 11.5523 16.5523 12 16 12H15M6 9H4C3.44772 9 3 9.44772 3 10V14C3 14.5523 3.44772 15 4 15H6M6 15V18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={common}>
          <circle
            cx="10"
            cy="6"
            r="3.2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M4.5 16C4.5 13 7 12 10 12C13 12 15.5 13 15.5 16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function AdminSidebarNav({
  items,
  isCollapsed = false,
  onItemClick,
}: {
  items: AdminNavItem[];
  isCollapsed?: boolean;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sidebar navigation" className="space-y-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onClick={onItemClick}
            aria-current={isActive ? "page" : undefined}
            title={isCollapsed ? item.label : undefined}
            className={`group flex items-center ${
              isCollapsed ? "justify-center px-2" : "justify-between px-3"
            } rounded-[var(--radius-md)] py-2.5 text-xs font-medium transition-all ${
              isActive
                ? "bg-[color:var(--color-accent-soft)] font-semibold text-[color:var(--color-accent)] shadow-xs"
                : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-strong)] hover:text-[color:var(--color-foreground)]"
            } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-focus)]`}
          >
            <div
              className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}
            >
              <span
                className={
                  isActive
                    ? "text-[color:var(--color-accent)]"
                    : "text-[color:var(--color-subtle)] group-hover:text-[color:var(--color-foreground)]"
                }
              >
                <NavIcon icon={item.icon} />
              </span>
              <span className={isCollapsed ? "sr-only" : undefined}>
                {item.label}
              </span>
            </div>
            {!isCollapsed && item.badge ? (
              <span className="rounded-full bg-[color:var(--color-surface-strong)] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-accent)]">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
