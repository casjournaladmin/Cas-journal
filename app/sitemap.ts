import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Static core routes
  const staticPaths = [
    "",
    "/about",
    "/editorial-board",
    "/current-issue",
    "/archives",
    "/submit",
    "/submissions",
    "/apply-reviewer",
    "/contact",
  ];

  // Canonical CAS journal slugs
  const canonicalJournalSlugs = ["existentia", "cjmr", "izu", "polis"];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Fetch active journals
  let journalSlugs = canonicalJournalSlugs;
  try {
    const activeJournals = await prisma.journal.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    if (activeJournals.length > 0) {
      journalSlugs = Array.from(
        new Set([...canonicalJournalSlugs, ...activeJournals.map((j) => j.slug)]),
      );
    }
  } catch {
    // Fall back to canonical slugs
  }

  const journalRoutes: MetadataRoute.Sitemap = journalSlugs.flatMap((slug) => [
    {
      url: `${baseUrl}/journals/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/journals/${slug}/editorial-board`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    },
  ]);

  // Dynamic published article routes
  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const publishedArticles = await prisma.article.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true, publishedAt: true },
    });

    articleRoutes = publishedArticles.map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: article.updatedAt || article.publishedAt || new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }));
  } catch {
    // DB unreachable fallback
  }

  return [...staticRoutes, ...journalRoutes, ...articleRoutes];
}
