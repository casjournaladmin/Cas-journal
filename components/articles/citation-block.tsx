"use client";

import { useState } from "react";
import {
  generateCitations,
  type CitationArticleMetadata,
  type CitationStyle,
} from "@/lib/citations/generator";

interface CitationBlockProps {
  metadata: CitationArticleMetadata;
}

export function CitationBlock({ metadata }: CitationBlockProps) {
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>("apa");
  const [copied, setCopied] = useState(false);

  const citations = generateCitations(metadata);
  const currentCitation = citations[selectedStyle];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCitation.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers or restricted environments
      const textarea = document.createElement("textarea");
      textarea.value = currentCitation.text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadBibTeX = () => {
    const bibtex = citations.bibtex.text;
    const blob = new Blob([bibtex], {
      type: "application/x-bibtex;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const slug = metadata.journalSlug || "article";
    link.href = url;
    link.setAttribute("download", `${slug}-citation.bib`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const styles: Array<{ id: CitationStyle; label: string }> = [
    { id: "apa", label: "APA 7th" },
    { id: "mla", label: "MLA 9th" },
    { id: "chicago", label: "Chicago 17th" },
    { id: "harvard", label: "Harvard" },
    { id: "bibtex", label: "BibTeX" },
  ];

  return (
    <section
      aria-labelledby="citation-heading"
      className="mt-8 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="citation-heading"
            className="text-xs font-bold tracking-wider text-[color:var(--color-foreground)] uppercase"
          >
            How to Cite This Article
          </h2>
          <p className="mt-0.5 text-[11px] text-[color:var(--color-muted)]">
            Official citation generated from verified editorial metadata.
          </p>
        </div>

        {/* Style Selector Buttons */}
        <div
          role="tablist"
          aria-label="Citation style format"
          className="flex flex-wrap items-center gap-1 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-1"
        >
          {styles.map((s) => {
            const isSelected = selectedStyle === s.id;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedStyle(s.id)}
                className={`rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-[color:var(--color-accent)] text-black"
                    : "text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Citation Output Box */}
      <div className="relative mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-raised)] p-4">
        {selectedStyle === "bibtex" ? (
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-[color:var(--color-foreground)]">
            <code>{currentCitation.text}</code>
          </pre>
        ) : (
          <p className="text-xs leading-relaxed break-words text-[color:var(--color-foreground)]">
            {currentCitation.text}
          </p>
        )}
      </div>

      {/* Action Controls */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span
          aria-live="polite"
          className="text-[11px] font-medium text-[color:var(--color-accent)]"
        >
          {copied ? "✓ Citation copied to clipboard" : ""}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {selectedStyle === "bibtex" ? (
            <button
              type="button"
              onClick={handleDownloadBibTeX}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
            >
              <svg
                className="size-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Download .bib</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleCopy}
            className="button-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
            aria-label={`Copy ${currentCitation.label} citation to clipboard`}
          >
            {copied ? (
              <>
                <svg
                  className="size-3.5 text-emerald-950"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg
                  className="size-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy Citation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
