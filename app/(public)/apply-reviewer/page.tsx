import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/authorization";

export const metadata: Metadata = {
  title: "Become a Reviewer | CAS Journals",
  description:
    "Application portal for qualified scholars to serve as independent peer reviewers across CAS Journals.",
};

/**
 * Public Become a Reviewer Entry Point
 *
 * Directs anonymous visitors into the Google authentication flow while preserving
 * target journal context, or routes authenticated authors directly to the Reviewer
 * Application workspace.
 *
 * Template identity: cas-page-hero-reviewer
 */
export default async function ApplyReviewerPage({
  searchParams,
}: {
  searchParams: Promise<{ journal?: string }>;
}) {
  const [{ journal }, user] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);

  const targetPath = journal
    ? `/author/apply-reviewer?journal=${encodeURIComponent(journal)}`
    : "/author/apply-reviewer";

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(targetPath)}`);
  }

  redirect(targetPath);
}
