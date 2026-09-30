import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface IngestAnnouncementItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  targetJournal: string;
  content: string;
  imageUrl?: string | null;
  publishedAt: Date;
  expiresAt?: Date | null;
  isActive: boolean;
  authorName: string;
}

const DEFAULT_ANNOUNCEMENTS: IngestAnnouncementItem[] = [
  {
    id: "ann-call-for-papers-2026",
    slug: "call-for-papers-2026-volume-11",
    title: "Call for Papers: 2026 Volume 11 Manuscript Submissions Now Open",
    category: "CALL_FOR_PAPERS",
    targetJournal: "ALL",
    content:
      "The Faculty of Social Sciences Journals (NJCP, AJSBS, NJSR, GJCSR) invite original empirical research papers, theoretical reviews, and methodological contributions for the 2026 publication volumes. Submissions undergo rapid, double-blind peer review with permanent CrossRef DOIs and Google Scholar indexing.",
    publishedAt: new Date(Date.now() - 7 * 86400000),
    isActive: true,
    authorName: "Editorial Directorate",
  },
  {
    id: "ann-special-issue-ajsbs",
    slug: "special-issue-african-social-behavioural-resilience",
    title:
      "Special Issue: African Social & Behavioural Resilience in the 21st Century",
    category: "SPECIAL_ISSUE",
    targetJournal: "ajsbs",
    content:
      "The African Journal of Social and Behavioural Sciences (AJSBS) announces a special themed section examining community resilience, institutional dynamics, and behavioral adaptations in Sub-Saharan Africa. Manuscripts formatted in APA 7th edition are welcomed from scholars across the continent and diaspora.",
    publishedAt: new Date(Date.now() - 14 * 86400000),
    isActive: true,
    authorName: "Prof. Ikechukwu J.D. Nwosu",
  },
  {
    id: "ann-review-speed-njcp",
    slug: "peer-review-turnaround-target",
    title: "Editorial Notice: 21-Day Expedited First-Decision Benchmark",
    category: "EDITORIAL_UPDATE",
    targetJournal: "njcp",
    content:
      "The Nigerian Journal of Contemporary Psychology (NJCP) editorial board has instituted a 21-day review benchmark for initial editorial decisions on submitted manuscripts. Authors can track progress live through their Author Operating Portal.",
    publishedAt: new Date(Date.now() - 21 * 86400000),
    isActive: true,
    authorName: "Prof Nkwam C. Uwaoma",
  },
];

async function ingestAnnouncements() {
  console.log("=== INGESTING ANNOUNCEMENTS INTO POSTGRESQL ===");

  let toIngest = [...DEFAULT_ANNOUNCEMENTS];

  const jsonPath = path.join(process.cwd(), ".data", "announcements.json");
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (
        Array.isArray(parsed.announcements) &&
        parsed.announcements.length > 0
      ) {
        console.log(
          `Found ${parsed.announcements.length} records in .data/announcements.json`,
        );
        toIngest = parsed.announcements.map(
          (a: {
            id?: string;
            slug: string;
            title: string;
            category?: string;
            targetJournal?: string;
            content: string;
            imageUrl?: string;
            publishedAt?: string;
            expiresAt?: string;
            isActive?: boolean;
            authorName?: string;
          }) => ({
            id:
              a.id ||
              `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            slug: a.slug,
            title: a.title,
            category: a.category || "GENERAL",
            targetJournal: a.targetJournal || "ALL",
            content: a.content,
            imageUrl: a.imageUrl || null,
            publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
            expiresAt: a.expiresAt ? new Date(a.expiresAt) : null,
            isActive: a.isActive !== undefined ? Boolean(a.isActive) : true,
            authorName: a.authorName || "Editorial Directorate",
          }),
        );
      }
    } catch (e) {
      console.warn(
        "Could not parse .data/announcements.json, using defaults:",
        e,
      );
    }
  }

  let count = 0;
  for (const item of toIngest) {
    await prisma.announcement.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        category: item.category,
        targetJournal: item.targetJournal,
        content: item.content,
        imageUrl: item.imageUrl ?? null,
        publishedAt: item.publishedAt,
        expiresAt: item.expiresAt ?? null,
        isActive: item.isActive,
        authorName: item.authorName,
      },
      create: {
        id: item.id,
        slug: item.slug,
        title: item.title,
        category: item.category,
        targetJournal: item.targetJournal,
        content: item.content,
        imageUrl: item.imageUrl ?? null,
        publishedAt: item.publishedAt,
        expiresAt: item.expiresAt ?? null,
        isActive: item.isActive,
        authorName: item.authorName,
      },
    });
    count++;
    console.log(
      `✓ Upserted announcement: "${item.title}" [slug: ${item.slug}]`,
    );
  }

  const totalInDb = await prisma.announcement.count();
  console.log(
    `\n✓ Ingestion complete. Processed ${count} items. Total Announcements in PostgreSQL: ${totalInDb}`,
  );
}

ingestAnnouncements()
  .catch((err) => {
    console.error("Announcement ingestion failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
