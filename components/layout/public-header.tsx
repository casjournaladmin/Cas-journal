"use client";

import Link from "next/link";
import { useState } from "react";
import { siteConfig } from "@/lib/config/site";
import { PublicDesktopNav } from "@/components/layout/public-desktop-nav";

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [journalsOpen, setJournalsOpen] = useState(true);

  return (
    <header className="cas-header-wrapper">
      <nav className="cas-nav" aria-label="Main Navigation">
        <Link href="/" className="cas-logo">
          CAS Journals <span>.</span>
        </Link>

        <PublicDesktopNav />

        <div className="cas-nav-actions">
          <Link href="/login" className="cas-btn-signin">
            Sign in
          </Link>
          <button
            type="button"
            className="cas-mobile-toggle"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
            </svg>
          </button>
        </div>
      </nav>

      <div className={`cas-mobile-menu ${mobileOpen ? "open" : ""}`}>
        {siteConfig.publicNavigation.map((item) => {
          if ("children" in item && item.children && item.children.length > 0) {
            return (
              <div key={item.label} className="border-b border-sky-200/15 pb-2">
                <button
                  type="button"
                  onClick={() => setJournalsOpen((prev) => !prev)}
                  className="cas-nav-link cas-mobile-dropdown-btn border-0 bg-transparent text-left"
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-sky-300 font-bold">
                    {journalsOpen ? "−" : "+"}
                  </span>
                </button>
                {journalsOpen ? (
                  <div className="mt-1 space-y-1 pl-3">
                    {item.children.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setMobileOpen(false)}
                        className="cas-mobile-sublink block rounded-lg px-3 py-2 text-xs font-medium transition hover:bg-white/10 hover:text-white"
                      >
                        <span className="font-semibold text-sky-300">
                          {subItem.shortName}
                        </span>{" "}
                        — {subItem.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="cas-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          );
        })}

        <div className="cas-mobile-actions">
          <Link
            href="/login"
            className="cas-btn-signin"
            onClick={() => setMobileOpen(false)}
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
