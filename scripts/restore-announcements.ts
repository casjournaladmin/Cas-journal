import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const RESTORE_ANNOUNCEMENTS = [
  {
    id: "ann-njsr-call-for-papers-2026",
    slug: "call-for-papers-njsr-2026",
    title: "Call for Papers: Nwaebere Journal of Scientific Research (NJSR)",
    targetJournal: "njsr",
    category: "CALL_FOR_PAPERS",
    authorName: "Editorial Directorate",
    publishedAt: new Date("2026-10-15T20:10:45.028Z"),
    isActive: true,
    expiresAt: null,
    imageUrl:
      "https://pcscnigceelxlnssuivc.supabase.co/storage/v1/object/public/published-articles/announcements/1792095043811_NJSR_Call_for_Papers_Final.png",
    content: `The Faculty of Social Sciences (FOSS), Imo State University, Owerri, Nigeria, advances research that deepens understanding of people, institutions and society.

The Nwaebere Journal of Scientific Research (NJSR) invites original, high-quality empirical and theoretical manuscripts grounded in African contexts and engaging with issues of global scientific and societal importance. Submissions undergo rigorous double-blind peer review with permanent CrossRef DOIs and Google Scholar indexing.

Research Focus:
• Empirical & Theoretical: Rigorous scientific inquiry across research approaches
• African Contexts: Research informed by regional knowledge and needs
• Global Relevance: Work addressing scientific and societal challenges

Submission Essentials:
• Formatting: A4 paper, 1-inch margins, double-spaced, 12pt Times New Roman, APA 7th edition references
• Length: Max 25 pages / 8,000 words (including tables, figures, references)
• Abstract: Up to 250 words
• Review & Publication Fees: Review fee ₦10,000 at submission; Publication fee ₦25,000 after acceptance
• Submission: fossjournals@gmail.com or submit directly through the Author Portal`,
  },
  {
    id: "ann-gjcsr-call-for-papers-2026",
    slug: "call-for-papers-gjcsr-2026",
    title:
      "Call for Papers: Global Journal of Contemporary Social Research (GJCSR)",
    targetJournal: "gjcsr",
    category: "CALL_FOR_PAPERS",
    authorName: "Editorial Directorate",
    publishedAt: new Date("2026-10-15T20:15:15.517Z"),
    isActive: true,
    expiresAt: null,
    imageUrl:
      "https://pcscnigceelxlnssuivc.supabase.co/storage/v1/object/public/published-articles/announcements/1792095315129_GJCSR_Call_for_Papers_-_Final.png",
    content: `The Faculty of Social Sciences (FOSS) at Imo State University (IMSU), Owerri, Nigeria, is one of the foremost faculties at IMSU.

We invite original, high-quality research papers for publication in the Global Journal of Contemporary Social Research (GJCSR) that will deepen understanding of human behaviour, social change and interconnected societies around the world.

Areas of Interest:
• Human behaviour and social change
• Economics and development
• Political science and public administration
• Geography and environmental management
• Sociology and psychology
• Information sciences
• Communication and media studies
• Interdisciplinary social and behavioural research

Submission Essentials:
• Formatting: A4 paper, 1-inch margins, double-spaced, 12pt Times New Roman, APA 7th edition references
• Length: Max 25 pages / 8,000 words (including tables, figures, references)
• Abstract: Up to 250 words
• Review & Publication Fees: Review fee ₦10,000 at submission; Publication fee ₦25,000 after acceptance
• Submission: fossjournals@gmail.com or submit directly through the Author Portal`,
  },
];

async function main() {
  console.log("=== NON-DESTRUCTIVE RESTORATION OF MISSING ANNOUNCEMENTS ===");

  const existingCount = await prisma.announcement.count();
  console.log(`Current announcements in database: ${existingCount}`);

  for (const item of RESTORE_ANNOUNCEMENTS) {
    const upserted = await prisma.announcement.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        targetJournal: item.targetJournal,
        category: item.category,
        authorName: item.authorName,
        publishedAt: item.publishedAt,
        isActive: item.isActive,
        expiresAt: item.expiresAt,
        imageUrl: item.imageUrl,
        content: item.content,
      },
      create: {
        id: item.id,
        slug: item.slug,
        title: item.title,
        targetJournal: item.targetJournal,
        category: item.category,
        authorName: item.authorName,
        publishedAt: item.publishedAt,
        isActive: item.isActive,
        expiresAt: item.expiresAt,
        imageUrl: item.imageUrl,
        content: item.content,
      },
    });

    console.log(
      `✓ Restored announcement: "${upserted.title}" [id: ${upserted.id}, target: ${upserted.targetJournal}]`,
    );
  }

  const finalCount = await prisma.announcement.count();
  console.log(`\nFinal announcements in database: ${finalCount}`);
  console.log("Restoration completed successfully without data loss.");
}

main()
  .catch((e) => {
    console.error("Restoration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
