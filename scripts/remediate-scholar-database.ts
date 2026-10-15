import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function remediate() {
  console.log("=== REMEDIATING SCHOLAR DATA IN DATABASE ===\n");

  const combinedAuthorSlugs = [
    "art-assessment-of-environmental-impacts-of-u-mu4ojylp",
    "art-blame-reorientation-in-digital-moral-jud-mu4ngdw1",
    "art-developing-a-strategic-framing-of-public-mu4o4g1o",
    "art-from-locus-of-control-to-entrepreneurial-muu6m39c",
    "art-the-state-and-human-security-failures-in-mu4nngwa",
  ];

  for (const slug of combinedAuthorSlugs) {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: { authors: { orderBy: { position: "asc" } } },
    });

    if (!article) continue;

    console.log(`Checking article: ${slug}`);
    let needsSplit = false;
    const expandedAuthors: Array<{
      id?: string;
      fullName: string;
      affiliation?: string | null;
    }> = [];

    for (const a of article.authors) {
      if (a.fullName.includes(" & ")) {
        needsSplit = true;
        const [p1, p2] = a.fullName.split(" & ").map((s) => s.trim());
        expandedAuthors.push({
          id: a.id,
          fullName: p1,
          affiliation: a.affiliation,
        });
        expandedAuthors.push({ fullName: p2, affiliation: a.affiliation });
      } else {
        expandedAuthors.push({
          id: a.id,
          fullName: a.fullName,
          affiliation: a.affiliation,
        });
      }
    }

    if (needsSplit) {
      console.log(
        `  Article ${slug} requires author split. Total resulting authors: ${expandedAuthors.length}`,
      );

      // Step 1: Set temporary positions to avoid unique([articleId, position]) conflicts
      for (let i = 0; i < article.authors.length; i++) {
        await prisma.articleAuthor.update({
          where: { id: article.authors[i].id },
          data: { position: 1000 + i },
        });
      }

      // Step 2: Assign correct final positions and create newly split authors
      for (let i = 0; i < expandedAuthors.length; i++) {
        const item = expandedAuthors[i];
        const finalPos = i + 1;
        if (item.id) {
          await prisma.articleAuthor.update({
            where: { id: item.id },
            data: { fullName: item.fullName, position: finalPos },
          });
        } else {
          await prisma.articleAuthor.create({
            data: {
              articleId: article.id,
              fullName: item.fullName,
              position: finalPos,
              affiliation: item.affiliation,
            },
          });
        }
        console.log(`    pos ${finalPos}: "${item.fullName}"`);
      }
      console.log(`  ✓ Successfully updated author positions for ${slug}\n`);
    }
  }

  // 2. Remediate pageStart containing range
  console.log("Checking pageStart ranges across all published articles...");
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    select: { id: true, slug: true, pageStart: true, pageEnd: true },
  });

  let pageFixCount = 0;
  for (const art of articles) {
    if (art.pageStart && (!art.pageEnd || art.pageEnd.trim() === "")) {
      const match = art.pageStart.match(/^(\d+)\s*(?:[–—\-]|to)\s*(\d+)$/i);
      if (match) {
        const [, start, end] = match;
        await prisma.article.update({
          where: { id: art.id },
          data: {
            pageStart: start.trim(),
            pageEnd: end.trim(),
          },
        });
        pageFixCount++;
        console.log(
          `  ✓ Article ${art.slug}: "${art.pageStart}" => start: "${start}", end: "${end}"`,
        );
      }
    }
  }

  console.log(`\nRemediated page ranges for ${pageFixCount} articles.`);
  console.log("=== REMEDIATION COMPLETE ===");
  await pool.end();
}

remediate().catch((err) => {
  console.error("Remediation error:", err);
  pool.end();
  process.exit(1);
});
