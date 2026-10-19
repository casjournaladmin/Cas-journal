import Link from "next/link";

import { LoginForm } from "@/app/login/login-form";
import { BrandMark } from "@/components/ui/brand-mark";
import { getSafeLoginReturnPath } from "@/lib/auth/submission-entry";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
}) {
  const { next, error } = await searchParams;
  const returnTo = getSafeLoginReturnPath(Array.isArray(next) ? next[0] : next);
  return (
    <main className="min-h-screen bg-[color:var(--color-app-background)] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.95fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[linear-gradient(135deg,#032b45_0%,#075985_100%)] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-14 xl:py-12">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] bg-[#0284c7] font-serif text-base font-bold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]">
            CJ
          </span>
          <div>
            <p className="font-serif text-base font-bold tracking-[-0.02em]">
              CAS Journals <span className="text-[#38bdf8]">.</span>
            </p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-[0.1em] text-sky-200/75 uppercase">
              Academic Publishing Platform
            </p>
          </div>
        </div>

        <div className="relative max-w-2xl pb-8">
          <div className="mb-8 h-px w-16 bg-[#38bdf8]" />
          <p className="font-serif text-[clamp(2.7rem,4.2vw,4.85rem)] leading-[0.98] font-bold tracking-[-0.04em] text-white">
            Advancing Knowledge. Inspiring Growth.
          </p>
          <p className="mt-7 max-w-lg text-sm leading-7 text-sky-100/80">
            A trusted open-access platform for peer-reviewed academic publishing
            across the social sciences, arts, humanities, and multidisciplinary
            research.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-sky-200/15 pt-6 text-[11px] font-medium tracking-[0.04em] text-sky-200/60">
          <span>CAS Journals</span>
          <span>Peer-Reviewed Open-Access Scholarly Publishing</span>
        </div>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-[color:var(--color-subtle)] transition hover:text-[color:var(--color-foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--color-focus)]"
          >
            Back to journal site
          </Link>
        </header>

        <div className="flex flex-1 items-center py-14 sm:py-20">
          <div className="mx-auto w-full max-w-[27rem]">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--color-accent)] uppercase">
              One secure sign-in
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight font-medium tracking-[-0.035em] text-[color:var(--color-foreground)] sm:text-[2.85rem]">
              Sign in to continue.
            </h1>
            <p className="mt-4 text-sm leading-6 text-[color:var(--color-muted)]">
              Use your Google account. Your available workspaces appear after
              sign-in.
            </p>
            <LoginForm
              returnTo={returnTo ?? undefined}
              oauthError={typeof error === "string" ? error : undefined}
              showEmailLogin={true}
            />
          </div>
        </div>

        <footer className="text-center text-[11px] leading-5 text-[color:var(--color-subtle)] lg:text-left">
          New users begin with normal Author access. Staff access is assigned
          inside the platform.
        </footer>
      </section>
    </main>
  );
}
