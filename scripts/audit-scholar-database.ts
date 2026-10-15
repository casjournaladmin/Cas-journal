import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { StorageClient } from "@supabase/storage-js";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secret = process.env.SUPABASE_SECRET_KEY!;
  return new StorageClient(`${url}/storage/v1`, {
    apikey: secret,
    Authorization: `Bearer ${secret}`,
  });
}

async function runAudit() {
  console.log(
    "===============================================================",
  );
  console.log(
    "   GOOGLE SCHOLAR INCLUSION & DATABASE-WIDE INTEGRITY AUDIT    ",
  );
  console.log(
    "===============================================================\n",
  );

  // 1. Total counts
  const totalArticles = await prisma.article.count();
  const publishedArticles = await prisma.article.count({
    where: { isPublished: true },
  });
  const unpublishedArticles = await prisma.article.count({
    where: { isPublished: false },
  });

  console.log(`Total Articles in Database:       ${totalArticles}`);
  console.log(`Published Articles (isPublished): ${publishedArticles}`);
  console.log(`Unpublished Articles:             ${unpublishedArticles}\n`);

  // 2. Fetch all published articles with relations
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    include: {
      issue: {
        include: {
          volume: {
            include: {
              journal: true,
            },
          },
        },
      },
      authors: {
        orderBy: { position: "asc" },
      },
      files: {
        where: { type: { in: ["PUBLISHED_PDF", "PRODUCTION_FILE"] } },
        include: { storedFile: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // 3. Slugs and Titles
  const slugs = new Set<string>();
  const duplicateSlugs: string[] = [];
  let missingSlugs = 0;
  let missingTitles = 0;
  let missingAbstracts = 0;
  let missingAuthors = 0;
  let missingPdfReferences = 0;
  let missingVolumeOrIssue = 0;
  let missingPageNumbers = 0;

  // Author splitting investigation
  const multiAuthorInSingleField: Array<{
    articleSlug: string;
    authorId: string;
    fullName: string;
  }> = [];

  for (const art of articles) {
    if (!art.slug || art.slug.trim() === "") missingSlugs++;
    if (slugs.has(art.slug)) duplicateSlugs.push(art.slug);
    slugs.add(art.slug);

    if (!art.title || art.title.trim() === "") missingTitles++;
    if (!art.abstract || art.abstract.trim() === "") missingAbstracts++;
    if (!art.authors || art.authors.length === 0) missingAuthors++;

    if (!art.issue || !art.issue.volume || !art.issue.volume.journal) {
      missingVolumeOrIssue++;
    }

    if (!art.pageStart) missingPageNumbers++;

    // PDF reference check
    const hasArticleFile = art.files.length > 0 && !!art.files[0].storedFile;
    if (!hasArticleFile) {
      // Check submission fallback
      const submissionId = art.slug.startsWith("art-")
        ? art.slug.replace("art-", "")
        : null;
      if (!submissionId) {
        missingPdfReferences++;
      }
    }

    // Check authors
    for (const author of art.authors) {
      const name = author.fullName.trim();
      // Check for '&', ' and ', ';', or multiple commas that indicate combined authors
      if (
        name.includes("&") ||
        /\band\b/i.test(name) ||
        name.includes(";") ||
        (name.match(/,/g) || []).length >= 2
      ) {
        multiAuthorInSingleField.push({
          articleSlug: art.slug,
          authorId: author.id,
          fullName: name,
        });
      }
    }
  }

  console.log("--- INTEGRITY CHECKS ---");
  console.log(`Missing Slugs:                    ${missingSlugs}`);
  console.log(
    `Duplicate Slugs:                  ${duplicateSlugs.length} ${duplicateSlugs.length ? `(${duplicateSlugs.join(", ")})` : ""}`,
  );
  console.log(`Missing Titles:                   ${missingTitles}`);
  console.log(`Missing Abstracts:                ${missingAbstracts}`);
  console.log(`Missing Authors:                  ${missingAuthors}`);
  console.log(`Missing Volume/Issue/Journal:     ${missingVolumeOrIssue}`);
  console.log(`Missing Page Numbers:             ${missingPageNumbers}`);
  console.log(`Missing PDF References:           ${missingPdfReferences}`);
  console.log(
    `Multi-Author in Single Field:     ${multiAuthorInSingleField.length}`,
  );

  if (multiAuthorInSingleField.length > 0) {
    console.log(
      `\nSample Multi-Author entries in single field (${Math.min(15, multiAuthorInSingleField.length)} samples):`,
    );
    multiAuthorInSingleField.slice(0, 15).forEach((item, idx) => {
      console.log(
        `  [${idx + 1}] Article: ${item.articleSlug} => "${item.fullName}"`,
      );
    });
  }

  // 4. Journals represented among published articles
  const journalArticleCounts: Record<string, number> = {};
  for (const art of articles) {
    const jName = art.issue?.volume?.journal?.name ?? "Unknown";
    journalArticleCounts[jName] = (journalArticleCounts[jName] || 0) + 1;
  }
  console.log("\n--- PUBLISHED ARTICLES PER JOURNAL ---");
  for (const [jName, count] of Object.entries(journalArticleCounts)) {
    console.log(`  - ${jName}: ${count} articles`);
  }

  // 5. Test PDF existence in Supabase storage for sample articles (10 articles across different issues)
  console.log(
    "\n--- TESTING PDF STORAGE ACCESSIBILITY (SAMPLE OF ARTICLES) ---",
  );
  const sampleIndices = [
    0,
    Math.floor(articles.length * 0.1),
    Math.floor(articles.length * 0.25),
    Math.floor(articles.length * 0.5),
    Math.floor(articles.length * 0.75),
    Math.floor(articles.length * 0.9),
    articles.length - 1,
  ];

  const storage = getStorageClient();

  for (const idx of sampleIndices) {
    const art = articles[idx];
    if (!art) continue;
    let bucket: string | undefined = art.files[0]?.storedFile?.bucket;
    let objectPath: string | undefined = art.files[0]?.storedFile?.objectPath;

    if (!bucket || !objectPath) {
      const submissionId = art.slug.startsWith("art-")
        ? art.slug.replace("art-", "")
        : null;
      if (submissionId) {
        const ver = await prisma.submissionVersion.findFirst({
          where: { submissionId },
          orderBy: { versionNumber: "desc" },
          select: { manuscriptStoredFile: true },
        });
        bucket = ver?.manuscriptStoredFile?.bucket ?? undefined;
        objectPath = ver?.manuscriptStoredFile?.objectPath ?? undefined;
      }
    }

    if (!bucket || !objectPath) {
      console.log(`  ❌ Article ${art.slug}: No file reference found`);
      continue;
    }

    const { data, error } = await storage
      .from(bucket)
      .createSignedUrl(objectPath, 3600);
    if (error || !data?.signedUrl) {
      console.log(
        `  ❌ Article ${art.slug}: Failed to sign URL (${bucket}/${objectPath}): ${error?.message}`,
      );
      continue;
    }

    // Try HEAD request on the signed URL
    try {
      const resp = await fetch(data.signedUrl, { method: "HEAD" });
      const contentType = resp.headers.get("content-type");
      const contentLength = resp.headers.get("content-length");
      console.log(
        `  ✅ Article ${art.slug}: HTTP ${resp.status} | Type: ${contentType} | Size: ${contentLength ? (parseInt(contentLength) / 1024).toFixed(1) + " KB" : "unknown"}`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  ❌ Article ${art.slug}: Fetch failed: ${message}`);
    }
  }

  await pool.end();
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  pool.end();
  process.exit(1);
});
