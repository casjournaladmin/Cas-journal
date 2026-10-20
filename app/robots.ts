import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

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
