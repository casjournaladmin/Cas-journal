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

async function runPreflight() {
  console.log("=== STARTING PRODUCTION DATABASE & DATA PREFLIGHT AUDIT ===");

  // 1. Connection check & Database target
  const dbUrl = process.env.DATABASE_URL || "";
  const maskedUrl = dbUrl.replace(/:([^@:]+)@/, ":****@");
  console.log(`Target Database URL: ${maskedUrl}`);

  // 2. Migration table check
  const appliedMigrations: Array<{
    id: string;
    migration_name: string;
    applied_steps_count: number;
    finished_at: Date;
  }> =
    await prisma.$queryRaw`SELECT id, migration_name, applied_steps_count, finished_at FROM _prisma_migrations ORDER BY finished_at ASC`;

  console.log("\n--- Applied Prisma Migrations in Database ---");
  appliedMigrations.forEach((m, idx) => {
    console.log(
      `[${idx + 1}] ${m.migration_name} (steps: ${m.applied_steps_count}, finished: ${m.finished_at})`,
    );
  });

  const alreadyApplied = appliedMigrations.some((m) =>
    m.migration_name.includes("production_mutation_integrity"),
  );
  console.log(
    `\nHas 'production_mutation_integrity' already been applied? ${alreadyApplied ? "YES (DUPLICATE)" : "NO (CLEAN TO APPLY)"}`,
  );

  // 3. Count rows in key operational tables
  const [
    userCount,
    journalCount,
    volumeCount,
    issueCount,
    articleCount,
    submissionCount,
    submissionVersionCount,
    reviewRoundCount,
    reviewAssignmentCount,
    reviewCount,
    adherenceReportCount,
    storedFileCount,
    requestCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.journal.count(),
    prisma.volume.count(),
    prisma.issue.count(),
    prisma.article.count(),
    prisma.submission.count(),
    prisma.submissionVersion.count(),
    prisma.reviewRound.count(),
    prisma.reviewAssignment.count(),
    prisma.review.count(),
    prisma.adherenceReport.count(),
    prisma.storedFile.count(),
    prisma.submissionRequest.count(),
  ]);

  console.log("\n--- Live Production Database Record Counts ---");
  console.log(`Users:                  ${userCount}`);
  console.log(`Journals:               ${journalCount}`);
  console.log(`Volumes:                ${volumeCount}`);
  console.log(`Issues:                 ${issueCount}`);
  console.log(`Articles:               ${articleCount}`);
  console.log(`Submissions:            ${submissionCount}`);
  console.log(`Submission Versions:    ${submissionVersionCount}`);
  console.log(`Review Rounds:          ${reviewRoundCount}`);
  console.log(`Review Assignments:     ${reviewAssignmentCount}`);
  console.log(`Reviews:                ${reviewCount}`);
  console.log(`Adherence Reports:      ${adherenceReportCount}`);
  console.log(`Stored Files:           ${storedFileCount}`);
  console.log(`Submission Requests:    ${requestCount}`);

  // 4. Orphan & Referential Integrity Check
  console.log("\n--- Referential Integrity & Orphan Audit ---");

  const orphanedReviewRounds: Array<{
    id: string;
    submissionVersionId: string;
  }> = await prisma.$queryRaw`
      SELECT rr.id, rr."submissionVersionId" 
      FROM "ReviewRound" rr 
      LEFT JOIN "SubmissionVersion" sv ON rr."submissionVersionId" = sv.id 
      WHERE sv.id IS NULL
    `;
  console.log(
    `Orphaned ReviewRounds (pointing to invalid SubmissionVersion): ${orphanedReviewRounds.length}`,
  );

  const orphanedVersions: Array<{ id: string; submissionId: string }> =
    await prisma.$queryRaw`
      SELECT sv.id, sv."submissionId" 
      FROM "SubmissionVersion" sv 
      LEFT JOIN "Submission" s ON sv."submissionId" = s.id 
      WHERE s.id IS NULL
    `;
  console.log(
    `Orphaned SubmissionVersions (pointing to invalid Submission): ${orphanedVersions.length}`,
  );

  const orphanedAssignments: Array<{ id: string }> = await prisma.$queryRaw`
      SELECT ra.id 
      FROM "ReviewAssignment" ra 
      LEFT JOIN "ReviewRound" rr ON ra."reviewRoundId" = rr.id 
      WHERE rr.id IS NULL
    `;
  console.log(`Orphaned ReviewAssignments: ${orphanedAssignments.length}`);

  // 5. JSON Store Analysis
  console.log("\n--- Local File-System Store (.data) Preflight Counts ---");
  const dataDir = path.join(process.cwd(), ".data");

  let announcementCount = 0;
  let journalSettingsCount = 0;
  let reviewerAppCount = 0;

  const annPath = path.join(dataDir, "announcements.json");
  if (fs.existsSync(annPath)) {
    const annData = JSON.parse(fs.readFileSync(annPath, "utf-8"));
    announcementCount = Array.isArray(annData.announcements)
      ? annData.announcements.length
      : 0;
  }

  const jsPath = path.join(dataDir, "journal-settings.json");
  if (fs.existsSync(jsPath)) {
    const jsData = JSON.parse(fs.readFileSync(jsPath, "utf-8"));
    journalSettingsCount = jsData.boards
      ? Object.keys(jsData.boards).length
      : 0;
  }

  const revPath = path.join(dataDir, "reviewer-applications.json");
  if (fs.existsSync(revPath)) {
    const revData = JSON.parse(fs.readFileSync(revPath, "utf-8"));
    reviewerAppCount = Array.isArray(revData.applications)
      ? revData.applications.length
      : 0;
  }

  console.log(
    `Announcements in .data/announcements.json:        ${announcementCount}`,
  );
  console.log(
    `Custom Boards in .data/journal-settings.json:     ${journalSettingsCount}`,
  );
  console.log(
    `Reviewer Apps in .data/reviewer-applications.json: ${reviewerAppCount}`,
  );

  console.log("\n=== PREFLIGHT AUDIT COMPLETE: READY FOR DRY RUN ===");
}

runPreflight()
  .catch((err) => {
    console.error("Preflight audit failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
