"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/config/site";

export function PublicDesktopNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <ul aria-label="Primary navigation" className="cas-nav-links">
      {siteConfig.publicNavigation.map((item) => {
        if ("children" in item && item.children && item.children.length > 0) {
          const isActive = pathname?.startsWith("/journals/");
          return (
            <li
              key={item.label}
              ref={dropdownRef}
              className="cas-nav-item relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-controls="journals-dropdown-menu"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`cas-nav-link inline-flex cursor-pointer items-center border-0 bg-transparent ${
                  isOpen || isActive ? "active" : ""
                }`}
              >
                <span>{item.label}</span>
              </button>

              {isOpen ? (
                <div
                  id="journals-dropdown-menu"
                  role="menu"
                  className="animate-in fade-in slide-in-from-top-1 absolute top-full left-0 z-[100] w-72 pt-2 duration-150"
                >
                  <div className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] py-1.5 shadow-xl backdrop-blur-md">
                    {item.children.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                        className="group flex items-center justify-between px-3.5 py-2.5 text-xs font-medium text-[color:var(--color-foreground)] transition hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-accent)] focus:bg-[color:var(--color-surface)] focus:text-[color:var(--color-accent)] focus-visible:outline-none"
                      >
                        <span className="leading-snug">{subItem.label}</span>
                        {subItem.shortName ? (
                          <span className="ml-2 shrink-0 rounded bg-[color:var(--color-surface-strong)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[color:var(--color-subtle)] group-hover:text-[color:var(--color-accent)]">
                            {subItem.shortName}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </li>
          );
        }

        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname?.startsWith(item.href);

        return (
          <li key={item.href} className="cas-nav-item">
            <Link
              href={item.href}
              className={`cas-nav-link ${isActive ? "active" : ""}`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
