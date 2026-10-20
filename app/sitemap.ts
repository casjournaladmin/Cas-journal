import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { getBaseUrl } from "@/lib/config/site";
import { CAS_STATIC_PAGES } from "@/lib/config/cas-pages";
import { CANONICAL_JOURNAL_ORDER } from "@/lib/editorial/editorial-board-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // Static core routes including canonical informational and policy pages
  const staticPaths = [
    "",
    "/about",
    "/editorial-board",
    "/current-issue",
    "/archives",
    "/announcements",
    "/submit",
    "/submissions",
    "/apply-reviewer",
    "/contact",
    ...Object.keys(CAS_STATIC_PAGES).map((slug) => `/${slug}`),
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Fetch active canonical journals strictly within CANONICAL_JOURNAL_ORDER
  let journalSlugs: readonly string[] = CANONICAL_JOURNAL_ORDER;
  try {
    const activeJournals = await prisma.journal.findMany({
      where: {
        isActive: true,
        slug: { in: [...CANONICAL_JOURNAL_ORDER] },
      },
      select: { slug: true, updatedAt: true },
    });
    if (activeJournals.length > 0) {
      journalSlugs = activeJournals.map((j) => j.slug);
    }
  } catch {
    // Fall back to canonical slugs
  }

  const journalRoutes: MetadataRoute.Sitemap = journalSlugs.map((slug) => ({
    url: `${baseUrl}/journals/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

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
