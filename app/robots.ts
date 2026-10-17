import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/editorial-board",
          "/current-issue",
          "/archives",
          "/journals/",
          "/articles/",
          "/announcements/",
          "/submit",
          "/submissions",
          "/apply-reviewer",
          "/contact",
          "/api/articles/", // Allows Google Scholar & public academic crawlers to stream PDFs
          "/api/issues/", // Allows crawling of public TOC files
        ],
        disallow: [
          "/admin",
          "/author",
          "/editor",
          "/workspaces",
          "/account",
          "/login",
          "/unauthorized",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
