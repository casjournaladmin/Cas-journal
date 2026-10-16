"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";

interface AnnouncementImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function AnnouncementImage({
  src,
  alt,
  className = "",
  priority = false,
}: AnnouncementImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // When retrying, append a cache-busting parameter to ensure the browser
  // executes a fresh network request instead of reusing a cached network failure.
  const effectiveSrc = useMemo(() => {
    if (retryCount === 0) return src;
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}_retry=${retryCount}`;
  }, [src, retryCount]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoaded(false);
    setHasError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoaded(false);
    setRetryCount((prev) => prev + 1);
  }, []);

  // Inspect if the image was already completed by the browser
  // before React hydration or from browser memory cache.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (img.complete) {
      if (img.naturalWidth > 0) {
        setIsLoaded(true);
        setHasError(false);
      } else if (img.src) {
        setIsLoaded(false);
        setHasError(true);
      }
    }
  }, [effectiveSrc]);

  // Keyboard accessibility and body scroll lock for the lightbox modal
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  return (
    <>
      <figure
        className={`group relative mx-auto my-4 w-full max-w-sm overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] shadow-sm transition sm:max-w-md ${className}`}
      >
        {/* Network / Image Error Fallback */}
        {hasError ? (
          <div
            role="alert"
            aria-live="polite"
            className="flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="rounded-full bg-amber-500/10 p-3 text-amber-400">
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="mt-2 text-xs font-semibold text-[color:var(--color-foreground)]">
              Poster image could not be displayed
            </p>
            <p className="mt-1 max-w-sm text-[11px] text-[color:var(--color-muted)]">
              The image failed to load. This may be caused by an interrupted
              network connection or offline device state.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleRetry}
                className="button-secondary px-3 py-1 text-xs"
              >
                Retry Loading Image
              </button>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--color-accent)] hover:underline"
              >
                Open Direct Link ↗
              </a>
            </div>
          </div>
        ) : (
          /* Image and Skeleton stacked via CSS Grid to avoid display:none deadlocks */
          <div
            onClick={() => isLoaded && setIsModalOpen(true)}
            className={`relative grid w-full place-items-center bg-black/10 ${
              isLoaded ? "cursor-zoom-in" : ""
            }`}
          >
            {/* Loading Skeleton */}
            {!isLoaded ? (
              <div
                aria-label="Loading notice poster"
                className="col-start-1 row-start-1 flex min-h-[220px] w-full animate-pulse items-center justify-center bg-[color:var(--color-surface-raised)] p-6 text-center"
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="size-8 animate-spin text-[color:var(--color-subtle)] opacity-40"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="font-mono text-xs text-[color:var(--color-subtle)]">
                    Loading notice poster…
                  </span>
                </div>
              </div>
            ) : null}

            {/* Proportional Poster Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              key={retryCount}
              src={effectiveSrc}
              alt={alt}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              onLoad={handleLoad}
              onError={handleError}
              className={`col-start-1 row-start-1 block h-auto w-full max-w-full object-contain transition-opacity duration-300 ${
                isLoaded ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />

            {/* Hover Expand Cue */}
            {isLoaded ? (
              <div className="pointer-events-none absolute top-2.5 right-2.5 hidden rounded-full bg-black/65 px-2.5 py-1 font-mono text-[10px] font-medium text-white opacity-0 backdrop-blur-xs transition group-hover:opacity-100 sm:block">
                Click to expand 🔍
              </div>
            ) : null}
          </div>
        )}

        {/* Auxiliary Metadata & Full Resolution Action (only shown once loaded) */}
        {!hasError && isLoaded ? (
          <figcaption className="flex items-center justify-between border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3.5 py-2 text-[11px] text-[color:var(--color-muted)]">
            <span className="font-mono text-[10px] text-[color:var(--color-subtle)] uppercase">
              Official Notice / Call Poster
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1 font-medium text-[color:var(--color-accent)] hover:underline"
              >
                View Full Poster ↗
              </button>
            </div>
          </figcaption>
        ) : null}
      </figure>

      {/* Accessible Full-Resolution Lightbox Modal */}
      {isModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} - Full Resolution Preview`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative flex max-h-[94vh] max-w-[96vw] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex w-full items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 py-2.5 text-xs">
              <span className="max-w-[200px] truncate font-semibold text-[color:var(--color-foreground)] sm:max-w-md">
                {alt}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-secondary px-2.5 py-1 text-xs"
                >
                  Open in New Tab ↗
                </a>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close poster preview"
                  className="cursor-pointer rounded-md p-1.5 text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]"
                >
                  <svg
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Image Display */}
            <div className="flex max-h-[calc(94vh-50px)] items-center justify-center overflow-auto bg-black/20 p-2 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className="max-h-[82vh] w-auto max-w-full rounded object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
