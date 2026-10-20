import Link from "next/link";
import Image from "next/image";

import { LoginForm } from "@/app/login/login-form";
import { getSafeLoginReturnPath } from "@/lib/auth/submission-entry";
import { prisma } from "@/lib/db/prisma";
import type { DevUserItem } from "@/components/auth/dev-identity-switcher";

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

  let devUsers: DevUserItem[] | undefined;

  if (process.env.NODE_ENV !== "production") {
    try {
      const dbUsers = await prisma.user.findMany({
        where: {
          email: {
            in: [
              "test.author.one@cas.test",
              "test.author.two@cas.test",
              "test.editor.one@cas.test",
              "test.editor.two@cas.test",
              "test.user.five@cas.test",
            ],
          },
        },
        include: {
          globalRoles: true,
          journalRoles: {
            include: {
              journal: {
                select: { shortName: true, name: true, slug: true },
              },
            },
          },
        },
        orderBy: { email: "asc" },
      });

      const emailToKey: Record<string, string> = {
        "test.author.one@cas.test": "test-author-one",
        "test.author.two@cas.test": "test-author-two",
        "test.editor.one@cas.test": "test-editor-one",
        "test.editor.two@cas.test": "test-editor-two",
        "test.user.five@cas.test": "test-user-five",
      };

      if (dbUsers.length > 0) {
        devUsers = dbUsers.map((u) => {
          const isSuper = u.globalRoles.some(
            (gr: { role: string }) => gr.role === "SUPER_ADMIN",
          );
          const journalAdminRole = u.journalRoles.find(
            (jr: { role: string }) => jr.role === "JOURNAL_ADMIN",
          );
          const editorRole = u.journalRoles.find(
            (jr: { role: string }) => jr.role === "EDITOR",
          );

          let roleLabel = "Author";
          let color = "bg-sky-500/10 text-sky-400 border-sky-500/30";

          if (isSuper) {
            roleLabel = "Super Admin";
            color = "bg-purple-500/10 text-purple-300 border-purple-500/30";
          } else if (journalAdminRole) {
            const jName =
              journalAdminRole.journal.shortName ||
              journalAdminRole.journal.name;
            roleLabel = `Journal Admin (${jName})`;
            color = "bg-amber-500/10 text-amber-300 border-amber-500/30";
          } else if (editorRole) {
            const jName =
              editorRole.journal.shortName || editorRole.journal.name;
            roleLabel = `Editor (${jName})`;
            color = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
          }

          const userEmail = u.email ?? "";
          return {
            key: (u.email && emailToKey[u.email]) || u.id,
            name: u.displayName,
            role: roleLabel,
            email: userEmail,
            color,
          };
        });
      }
    } catch {
      // Fallback to static dev user list if DB access fails
    }
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-[#02101e] text-white selection:bg-sky-500/30">
      {/* ── Immersive Cosmic Blue Atmosphere with Supplied Books-in-Cosmos Asset ── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden select-none"
        aria-hidden="true"
      >
        <Image
          src="/assets/images/login-cosmic-books.jpg"
          alt="Scholarly cosmic books — CAS Journals"
          fill
          priority
          sizes="100vw"
          className="scale-100 object-cover object-center opacity-95 transition-opacity duration-300"
        />

        {/* Delicate outer edge vignette to keep cosmic books, nebulae & stars radiantly visible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 110% 95% at 50% 40%, transparent 40%, rgba(2, 16, 30, 0.45) 80%, rgba(2, 16, 30, 0.85) 100%)",
          }}
        />
        {/* Soft atmospheric gradients at top and bottom for header and footer legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02101e]/60 via-transparent to-[#02101e]/75" />
      </div>

      {/* ── 1. Minimal Top Navigation ── */}
      <header className="relative z-20 flex shrink-0 items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-full border border-sky-400/20 bg-[#02182b]/60 px-3.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-md transition hover:border-sky-300/40 hover:bg-[#02182b]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          <span className="grid size-7 place-items-center rounded bg-[#0284c7] font-serif text-xs font-bold text-white shadow-[0_0_12px_rgba(2,132,199,0.5),inset_0_0_0_1px_rgba(255,255,255,0.25)]">
            CJ
          </span>
          <span className="font-serif text-sm font-semibold tracking-[-0.015em] text-white">
            CAS Journals
          </span>
        </Link>
        <Link
          href="/"
          className="rounded-full border border-sky-400/15 bg-[#02182b]/50 px-3 py-1.5 text-xs font-medium text-sky-200/80 backdrop-blur-md transition hover:border-sky-300/35 hover:bg-[#02182b]/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          ← Back to journal site
        </Link>
      </header>

      {/* ── 2. Centerpiece Branding & Authentication on Frosted Blue Glass Panel ── */}
      <section className="relative z-10 mx-auto my-auto flex w-full max-w-[32rem] flex-col items-center px-4 py-4 sm:px-6">
        <div className="w-full rounded-2xl border border-sky-300/30 bg-[#031d34]/75 p-6 shadow-[0_12px_40px_rgba(1,14,25,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-xl sm:p-8">
          {/* Luminous CJ Monogram */}
          <div className="mx-auto mb-3.5 grid size-13 place-items-center rounded-2xl bg-gradient-to-b from-[#0284c7] to-[#0369a1] font-serif text-lg font-bold text-white shadow-[0_0_28px_rgba(2,132,199,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)]">
            CJ
          </div>

          {/* Brand identity & Tagline */}
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(2,132,199,0.5)] sm:text-4xl">
              CAS Journals
            </h1>
            <p className="mt-1.5 text-xs font-medium tracking-wide text-sky-200/95 sm:text-sm">
              Advancing Knowledge. Inspiring Growth.
            </p>
            <p className="mt-2 text-xs text-sky-200/75">
              Sign in to access your CAS Journals workspace.
            </p>
          </div>

          {/* Refined Google sign-in button & collapsed dev testing section */}
          <div className="w-full">
            <LoginForm
              returnTo={returnTo ?? undefined}
              oauthError={typeof error === "string" ? error : undefined}
              devUsers={devUsers}
            />
          </div>
        </div>
      </section>

      {/* ── 3. Minimal Bottom Footer ── */}
      <footer className="relative z-20 shrink-0 pb-4 text-center text-[11px] text-sky-200/50">
        <p>
          New users begin with normal Author access. Staff access is assigned
          inside the platform.
        </p>
      </footer>
    </main>
  );
}
