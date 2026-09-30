import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

async function dryRunMigration() {
  console.log(
    "=== EXECUTING DRY-RUN MIGRATION TEST (TRANSACTION ROLLBACK) ===",
  );
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");
    console.log("1. Transaction started.");

    // 1. Create Announcement table
    console.log("2. Testing CREATE TABLE Announcement...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Announcement" (
        "id" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'GENERAL',
        "targetJournal" TEXT NOT NULL DEFAULT 'ALL',
        "content" TEXT NOT NULL,
        "imageUrl" TEXT,
        "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3),
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "authorName" TEXT NOT NULL DEFAULT 'Editorial Directorate',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Announcement_slug_key" ON "Announcement"("slug");
      CREATE INDEX IF NOT EXISTS "Announcement_targetJournal_isActive_idx" ON "Announcement"("targetJournal", "isActive");
      CREATE INDEX IF NOT EXISTS "Announcement_publishedAt_idx" ON "Announcement"("publishedAt");
    `);
    console.log("   ✓ Announcement table & indexes created successfully.");

    // 2. Create EditorialBoardMember table
    console.log("3. Testing CREATE TABLE EditorialBoardMember...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "EditorialBoardMember" (
        "id" TEXT NOT NULL,
        "journalSlug" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "affiliation" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'BOARD_MEMBER',
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EditorialBoardMember_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "EditorialBoardMember_journalSlug_category_idx" ON "EditorialBoardMember"("journalSlug", "category");
      CREATE INDEX IF NOT EXISTS "EditorialBoardMember_journalSlug_order_idx" ON "EditorialBoardMember"("journalSlug", "order");
    `);
    console.log(
      "   ✓ EditorialBoardMember table & indexes created successfully.",
    );

    // 3. Create ReviewerApplication table
    console.log("4. Testing CREATE TABLE ReviewerApplication...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ReviewerApplication" (
        "id" TEXT NOT NULL,
        "trackingCode" TEXT NOT NULL,
        "applicantUserId" UUID,
        "fullName" TEXT NOT NULL,
        "academicTitle" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "affiliation" TEXT NOT NULL,
        "academicRank" TEXT NOT NULL,
        "specializationKeywords" TEXT NOT NULL,
        "targetJournal" TEXT NOT NULL,
        "profileUrl" TEXT,
        "statement" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "reviewedAt" TIMESTAMP(3),
        "reviewedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ReviewerApplication_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "ReviewerApplication_trackingCode_key" ON "ReviewerApplication"("trackingCode");
      CREATE INDEX IF NOT EXISTS "ReviewerApplication_targetJournal_status_idx" ON "ReviewerApplication"("targetJournal", "status");
      CREATE INDEX IF NOT EXISTS "ReviewerApplication_email_idx" ON "ReviewerApplication"("email");
      CREATE INDEX IF NOT EXISTS "ReviewerApplication_submittedAt_idx" ON "ReviewerApplication"("submittedAt");
    `);
    console.log(
      "   ✓ ReviewerApplication table & indexes created successfully.",
    );

    // 4. Test altering ReviewRound foreign key
    console.log("5. Testing ALTER TABLE ReviewRound constraint...");
    await client.query(`
      ALTER TABLE "ReviewRound" DROP CONSTRAINT IF EXISTS "ReviewRound_submissionVersionId_fkey";
      ALTER TABLE "ReviewRound" ADD CONSTRAINT "ReviewRound_submissionVersionId_fkey" 
        FOREIGN KEY ("submissionVersionId") REFERENCES "SubmissionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    console.log("   ✓ ReviewRound constraint altered to CASCADE successfully.");

    // 5. Test count verification inside transaction
    const res = await client.query(`SELECT COUNT(*) FROM "ReviewRound";`);
    console.log(
      `   ✓ Verified ReviewRound count inside transaction: ${res.rows[0].count}`,
    );

    // Rollback to leave database untouched
    await client.query("ROLLBACK;");
    console.log("6. Rollback executed successfully. Zero changes committed.");
    console.log("=== DRY-RUN VERIFICATION PASSED 100% ===");
  } catch (error) {
    await client.query("ROLLBACK;");
    console.error("Dry run failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

dryRunMigration();
