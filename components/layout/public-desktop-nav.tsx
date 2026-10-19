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
                onClick={() => setIsOpen((prev) => !prev)}
                className={`cas-nav-link inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent ${
                  isOpen || isActive ? "active" : ""
                }`}
              >
                <span>{item.label}</span>
                <svg
                  aria-hidden="true"
                  className={`size-3.5 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-[#38bdf8]" : ""
                  }`}
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {isOpen ? (
                <div className="animate-in fade-in slide-in-from-top-2 absolute top-full left-0 z-[100] w-[660px] pt-3 duration-150">
                  <div className="overflow-hidden rounded-2xl border border-[#075985]/60 bg-[#032b45] p-3.5 text-[#f0f9ff] shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-sky-400/20 px-3 pb-2.5">
                      <p className="font-mono text-[11px] font-bold tracking-wider text-[#38bdf8] uppercase">
                        CAS Scholarly Journals
                      </p>
                      <span className="text-[11px] text-sky-200/70">
                        Peer-Reviewed &bull; Open Access
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      {item.children.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setIsOpen(false)}
                          className="group flex flex-col justify-between rounded-xl border border-transparent bg-white/[0.04] p-3 transition hover:border-sky-400/40 hover:bg-white/10"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-sky-300">
                                {subItem.shortName}
                              </span>
                            </div>
                            <h4 className="mt-2 text-xs font-semibold leading-snug text-white transition group-hover:text-sky-300">
                              {subItem.label}
                            </h4>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-sky-100/75">
                              {subItem.description}
                            </p>
                          </div>
                          <div className="mt-2.5 flex items-center text-[10px] font-semibold text-[#38bdf8] opacity-0 transition group-hover:opacity-100">
                            <span>View Journal Portal</span>
                            <span className="ml-1">→</span>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-sky-400/20 px-3 pt-2.5">
                      <Link
                        href="/editorial-board"
                        onClick={() => setIsOpen(false)}
                        className="text-xs font-medium text-sky-200/80 transition hover:text-white"
                      >
                        Editorial Governance &amp; Boards
                      </Link>
                      <Link
                        href="/archives"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#38bdf8] transition hover:text-white"
                      >
                        <span>Browse All Archives</span>
                        <span>→</span>
                      </Link>
                    </div>
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
