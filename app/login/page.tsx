import Link from "next/link";

import { LoginForm } from "@/app/login/login-form";
import { ScholarlyBookFolio } from "@/components/auth/scholarly-book-folio";
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
          const isSuper = u.globalRoles.some((gr) => gr.role === "SUPER_ADMIN");
          const journalAdminRole = u.journalRoles.find(
            (jr) => jr.role === "JOURNAL_ADMIN",
          );
          const editorRole = u.journalRoles.find((jr) => jr.role === "EDITOR");

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
    <main className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-[#010c16] text-white selection:bg-sky-500/30">
      {/* ── Immersive Full-Screen Cinematic Blue Galaxy Background ── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Deep midnight navy and near-black blue base with rich electric-blue and cyan nebula gradients */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 65% at 50% 38%, rgba(2, 132, 199, 0.28) 0%, rgba(7, 89, 133, 0.22) 28%, rgba(3, 43, 69, 0.45) 55%, #010c16 100%)",
          }}
        />

        {/* Concentrated blue-white celestial light source behind the central book */}
        <div className="absolute top-[35%] left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/20 blur-[90px]" />
        <div className="absolute top-[38%] left-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/25 blur-[50px]" />
        <div className="absolute top-[42%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-blue-600/10 blur-[120px]" />

        {/* Fine restrained orbital paths & luminous celestial rings */}
        <div className="absolute top-[38%] left-1/2 h-[420px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] border border-sky-400/15 shadow-[0_0_60px_rgba(56,189,248,0.08)]" />
        <div className="absolute top-[38%] left-1/2 h-[600px] w-[1040px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] border border-sky-400/8" />

        {/* Procedural multi-layer starfield with subtle twinkles */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: `
              radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.9) 1px, transparent 0),
              radial-gradient(1.5px 1.5px at 28% 32%, rgba(56,189,248,0.85) 1px, transparent 0),
              radial-gradient(1px 1px at 45% 15%, rgba(255,255,255,0.8) 1px, transparent 0),
              radial-gradient(2px 2px at 62% 24%, rgba(56,189,248,0.9) 1px, transparent 0),
              radial-gradient(1px 1px at 78% 12%, rgba(255,255,255,0.75) 1px, transparent 0),
              radial-gradient(1.5px 1.5px at 88% 36%, rgba(186,230,254,0.85) 1px, transparent 0),
              radial-gradient(1px 1px at 18% 68%, rgba(255,255,255,0.7) 1px, transparent 0),
              radial-gradient(2px 2px at 35% 82%, rgba(56,189,248,0.8) 1px, transparent 0),
              radial-gradient(1px 1px at 58% 75%, rgba(255,255,255,0.85) 1px, transparent 0),
              radial-gradient(1.5px 1.5px at 72% 88%, rgba(56,189,248,0.75) 1px, transparent 0),
              radial-gradient(1px 1px at 84% 64%, rgba(255,255,255,0.65) 1px, transparent 0),
              radial-gradient(1px 1px at 94% 80%, rgba(186,230,254,0.8) 1px, transparent 0)
            `,
            backgroundSize: "100% 100%",
          }}
        />

        {/* Delicate cosmic dust / nebula clouds */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle 380px at 25% 45%, rgba(14, 165, 233, 0.14) 0%, transparent 70%), radial-gradient(circle 420px at 75% 40%, rgba(2, 132, 199, 0.16) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── 1. Minimal Top Navigation ── */}
      <header className="relative z-20 flex shrink-0 items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="group flex items-center gap-2.5 opacity-90 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          <span className="grid size-8 place-items-center rounded bg-[#0284c7] font-serif text-xs font-bold text-white shadow-[0_0_12px_rgba(2,132,199,0.5),inset_0_0_0_1px_rgba(255,255,255,0.25)]">
            CJ
          </span>
          <span className="font-serif text-sm font-semibold tracking-[-0.015em] text-white">
            CAS Journals
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-medium text-sky-200/70 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          ← Back to journal site
        </Link>
      </header>

      {/* ── 2. Visual Centerpiece & Authentication ── */}
      <section className="relative z-10 mx-auto my-auto flex w-full max-w-[28rem] flex-col items-center px-4 py-4 text-center sm:px-6">
        {/* Abstract Luminous Open Book constructed from layered geometry of light */}
        <div className="w-full">
          <ScholarlyBookFolio />
        </div>

        {/* Brand identity & Tagline */}
        <div className="mt-2 text-center">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
            CAS Journals
          </h1>
          <p className="mt-1 text-xs font-medium tracking-wide text-sky-200/90 sm:text-sm">
            Advancing Knowledge. Inspiring Growth.
          </p>
          <p className="mt-1.5 text-xs text-sky-200/65">
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
