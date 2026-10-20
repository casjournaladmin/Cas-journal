"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  AdminSidebarNav,
  type AdminNavItem,
} from "@/components/admin/admin-sidebar-nav";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SignOutForm } from "@/components/auth/sign-out-form";
import type { ProductWorkspace } from "@/lib/auth/workspaces";

type ShellUser = {
  displayName: string;
  email: string | null;
};

type PlatformAdminShellProps = {
  children: ReactNode;
  user: ShellUser;
  workspace: ProductWorkspace;
  availableWorkspaces: ProductWorkspace[];
};

const PLATFORM_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: "overview" },
  {
    href: "/admin/submissions",
    label: "Manuscripts / Tracking",
    icon: "manuscripts",
  },
  { href: "/admin/articles", label: "Published Articles", icon: "articles" },
  {
    href: "/admin/editorial-board",
    label: "Editorial Board & Governance",
    icon: "governance",
  },
  {
    href: "/admin/reviewers",
    label: "Reviewer Applications",
    icon: "reviewers",
  },
  {
    href: "/admin/announcements",
    label: "Announcements",
    icon: "announcements",
  },
  { href: "/admin/access", label: "User Directory & Roles", icon: "users" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function subscribeSidebar(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSidebarSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("cas-admin-sidebar-collapsed") === "true";
  } catch {
    return false;
  }
}

export function PlatformAdminShell({
  children,
  user,
  availableWorkspaces,
}: PlatformAdminShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isStoredCollapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    () => false,
  );
  const [localCollapsed, setLocalCollapsed] = useState<boolean | null>(null);
  const isCollapsed =
    localCollapsed !== null ? localCollapsed : isStoredCollapsed;

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setLocalCollapsed(next);
    try {
      localStorage.setItem("cas-admin-sidebar-collapsed", String(next));
    } catch {
      // Ignore localStorage exceptions
    }
  };

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Determine active section label for context breadcrumb
  const currentItem = PLATFORM_NAV_ITEMS.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)),
  );
  const sectionLabel = currentItem ? currentItem.label : "Console";

  return (
    <div className="cas-paper-bg flex min-h-screen text-[color:var(--color-foreground)]">
      {/* ── Persistent Desktop Sidebar: Anchored Full-Height with Independent Scroll ── */}
      <aside
        className={`cas-glass-surface sticky top-0 z-20 hidden h-screen shrink-0 flex-col border-r border-[color:var(--color-border)] transition-[width] duration-200 ease-in-out lg:flex ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Brand Header — Exact 4rem / 64px height aligned with main utility header */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-[color:var(--color-border)] ${
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          {isCollapsed ? (
            <div className="flex w-full items-center justify-between px-0.5">
              <Link
                href="/admin"
                className="grid size-8 place-items-center rounded-[var(--radius-sm)] bg-[#0284c7] font-serif text-xs font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
                title="CAS Journals Overview"
              >
                CJ
              </Link>
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                aria-expanded="false"
                className="grid size-7 place-items-center rounded-[var(--radius-sm)] text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-surface-strong)] hover:text-[color:var(--color-foreground)] focus-visible:outline-2 focus-visible:outline-[color:var(--color-focus)]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="size-4"
                >
                  <path
                    d="M7.5 4.5L13 10L7.5 15.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-2.5">
                <Link
                  href="/admin"
                  className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[#0284c7] font-serif text-[14px] font-bold tracking-tight text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] transition hover:opacity-95"
                  title="CAS Journals Overview"
                >
                  CJ
                </Link>
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-serif text-[15px] font-bold tracking-tight text-[color:var(--color-foreground)]">
                    CAS Journals
                  </span>
                  <span className="shrink-0 rounded bg-[color:var(--color-accent-soft)] px-1.5 py-0.5 text-[9px] font-bold tracking-wider whitespace-nowrap text-[color:var(--color-accent)] uppercase">
                    Admin
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                aria-expanded="true"
                className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-surface-strong)] hover:text-[color:var(--color-foreground)] focus-visible:outline-2 focus-visible:outline-[color:var(--color-focus)]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="size-4"
                >
                  <path
                    d="M12.5 4.5L7 10L12.5 15.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Scrollable Navigation — flex-1 min-h-0 with independent scroll */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto ${
            isCollapsed ? "px-2 py-4" : "px-3 py-4"
          } space-y-1`}
        >
          {!isCollapsed ? (
            <p className="px-3 pb-2.5 text-[10px] font-semibold tracking-wider text-[color:var(--color-muted)] uppercase">
              Platform Management
            </p>
          ) : null}
          <AdminSidebarNav
            items={PLATFORM_NAV_ITEMS}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* ── Anchored Sidebar Footer: Restored Account Block & Utility Controls ── */}
        <div className="shrink-0 space-y-2 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 p-2.5">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              {/* Public Portal Icon */}
              <Link
                href="/"
                title="Public Portal"
                aria-label="Public Portal"
                className="grid size-9 place-items-center rounded-[var(--radius-md)] text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-surface-strong)] hover:text-[color:var(--color-foreground)]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="size-4.5"
                >
                  <path
                    d="M4.5 15.5L15.5 4.5M15.5 4.5H8.5M15.5 4.5V11.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              {/* Switch workspace (if multiple available) */}
              {availableWorkspaces.length > 1 ? (
                <Link
                  href="/workspaces"
                  title="Switch workspace"
                  aria-label="Switch workspace"
                  className="grid size-9 place-items-center rounded-[var(--radius-md)] text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-surface-strong)] hover:text-[color:var(--color-foreground)]"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="size-4.5"
                  >
                    <path
                      d="M6.5 4.5l-3 3 3 3M13.5 15.5l3-3-3-3M3.5 7.5h10M16.5 12.5h-10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              ) : null}

              {/* Appearance Toggle */}
              <div
                title="Toggle appearance"
                className="grid size-9 place-items-center"
              >
                <ThemeToggle />
              </div>

              {/* User Account Popover */}
              <details className="group relative">
                <summary
                  aria-label="User account menu"
                  className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-xs font-bold text-[color:var(--color-accent)] transition hover:border-[color:var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[color:var(--color-focus)]"
                >
                  {initials(user.displayName)}
                </summary>
                <div className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-2 shadow-lg backdrop-blur-md">
                  <div className="px-3 py-2">
                    <p className="truncate text-xs font-semibold text-[color:var(--color-foreground)]">
                      {user.displayName}
                    </p>
                    <p className="truncate text-[10px] text-[color:var(--color-subtle)]">
                      {user.email ?? "Authenticated account"}
                    </p>
                  </div>
                  <div className="my-1 h-px bg-[color:var(--color-border)]" />
                  <Link
                    href="/account"
                    className="block rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-strong)] hover:text-[color:var(--color-foreground)]"
                  >
                    Account and memberships
                  </Link>
                  <SignOutForm className="mt-1 w-full rounded-[var(--radius-md)] px-3 py-1.5 text-left text-xs font-medium text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-strong)] hover:text-[color:var(--color-foreground)]" />
                </div>
              </details>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Utilities row: Public Portal & Appearance */}
              <div className="flex items-center justify-between px-1">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--color-muted)] transition hover:text-[color:var(--color-foreground)]"
                >
                  <span>Public Portal</span>
                  <span aria-hidden="true" className="opacity-70">
                    ↗
                  </span>
                </Link>
                <div className="flex items-center gap-1">
                  {availableWorkspaces.length > 1 ? (
                    <Link
                      href="/workspaces"
                      title="Switch workspace"
                      className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-strong)] hover:text-[color:var(--color-foreground)]"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className="size-3.5 opacity-70"
                      >
                        <path
                          d="M6.5 4.5l-3 3 3 3M13.5 15.5l3-3-3-3M3.5 7.5h10M16.5 12.5h-10"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </Link>
                  ) : null}
                  <ThemeToggle />
                </div>
              </div>

              {/* Restored Account / Member Profile Block */}
              <div className="cas-glass-card rounded-[var(--radius-md)] p-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[color:var(--color-accent-soft)] text-xs font-bold text-[color:var(--color-accent)]">
                    {initials(user.displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[color:var(--color-foreground)]">
                      {user.displayName}
                    </p>
                    <span className="inline-block text-[9px] font-bold tracking-wider text-[color:var(--color-accent)] uppercase">
                      Super Administrator
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-[color:var(--color-border)]/60 pt-2 text-[11px]">
                  <Link
                    href="/account"
                    className="font-medium text-[color:var(--color-muted)] transition hover:text-[color:var(--color-foreground)] hover:underline"
                  >
                    Account
                  </Link>
                  <SignOutForm className="cursor-pointer font-medium text-[color:var(--color-muted)] transition hover:text-[color:var(--color-danger)] hover:underline" />
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer (Off-canvas) ── */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-3rem))] flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-[color:var(--color-border)] px-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-[var(--radius-sm)] bg-[#0284c7] font-serif text-xs font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
                  CJ
                </span>
                <span className="font-serif text-sm font-bold text-[color:var(--color-foreground)]">
                  CAS Journals
                </span>
                <span className="rounded bg-[color:var(--color-accent-soft)] px-1.5 py-0.5 text-[9px] font-bold text-[color:var(--color-accent)] uppercase">
                  Admin
                </span>
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setDrawerOpen(false)}
                className="grid size-8 place-items-center rounded-[var(--radius-md)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-strong)] hover:text-[color:var(--color-foreground)]"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <p className="px-3 pb-2.5 text-[10px] font-semibold tracking-wider text-[color:var(--color-muted)] uppercase">
                Platform Management
              </p>
              <AdminSidebarNav
                items={PLATFORM_NAV_ITEMS}
                onItemClick={() => setDrawerOpen(false)}
              />
            </div>
            <div className="space-y-1.5 border-t border-[color:var(--color-border)] p-3">
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-xs font-semibold text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-strong)]"
              >
                <span>Public Portal</span>
                <span>↗</span>
              </Link>
              {availableWorkspaces.length > 1 ? (
                <Link
                  href="/workspaces"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-xs font-semibold text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-strong)]"
                >
                  <span>Switch workspace</span>
                </Link>
              ) : null}
              <div className="flex items-center justify-between border-t border-[color:var(--color-border)]/60 px-3 pt-2">
                <span className="text-[11px] font-medium text-[color:var(--color-muted)]">
                  Appearance
                </span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Main Layout Column: Aligned & Independent Scroll ── */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Compact Top Utility Bar — Exact 4rem / 64px height aligned with sidebar header */}
        <header className="cas-glass-surface sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-[color:var(--color-border)] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className="grid size-9 place-items-center rounded-[var(--radius-md)] border border-[color:var(--color-border)] text-[color:var(--color-foreground)] transition hover:bg-[color:var(--color-surface-strong)] focus-visible:outline-2 focus-visible:outline-[color:var(--color-focus)] lg:hidden"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
                <path
                  d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>

            {/* Breadcrumb Context */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-[color:var(--color-muted)]">
                Super Admin
              </span>
              <span className="text-[color:var(--color-border-strong)]">/</span>
              <span className="font-semibold text-[color:var(--color-foreground)]">
                {sectionLabel}
              </span>
            </div>
          </div>

          {/* Right utility items */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/75 px-2.5 py-1.5 text-xs font-semibold text-[color:var(--color-foreground)] backdrop-blur-sm transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] sm:inline-flex"
            >
              <span>Public Portal</span>
              <span aria-hidden="true" className="opacity-70">
                ↗
              </span>
            </Link>
            <NotificationBell />
            <div className="lg:hidden">
              <ThemeToggle />
            </div>
            <Link
              href="/account"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-xs font-bold text-[color:var(--color-accent)] transition hover:border-[color:var(--color-accent)]"
              title={`${user.displayName} (${user.email ?? "Account"})`}
            >
              {initials(user.displayName)}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
