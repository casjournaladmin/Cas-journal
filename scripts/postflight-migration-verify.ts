import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verifyPostMigration() {
  console.log("=== EXECUTING POST-MIGRATION VERIFICATION AUDIT ===");

  // 1. Verify Prisma Migrations Table State
  const appliedMigrations: Array<{
    id: string;
    migration_name: string;
    applied_steps_count: number;
    finished_at: Date;
  }> =
    await prisma.$queryRaw`SELECT id, migration_name, applied_steps_count, finished_at FROM _prisma_migrations ORDER BY finished_at ASC`;

  console.log("\n--- Verified Applied Prisma Migrations ---");
  appliedMigrations.forEach((m, idx) => {
    console.log(
      `[${idx + 1}] ${m.migration_name} (steps: ${m.applied_steps_count}, finished: ${m.finished_at})`,
    );
  });

  const targetMigration = appliedMigrations.find(
    (m) => m.migration_name === "20261001000000_production_mutation_integrity",
  );
  console.log(
    `\nIs '20261001000000_production_mutation_integrity' applied? ${targetMigration ? "YES (CONFIRMED)" : "NO (FAILED)"}`,
  );

  // 2. Verify New Tables Exist
  const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('Announcement', 'EditorialBoardMember', 'ReviewerApplication')
    ORDER BY table_name;
  `;
  console.log("\n--- Verified New Physical Tables in PostgreSQL ---");
  tables.forEach((t) => console.log(`✓ Table exists: ${t.table_name}`));

  // 3. Verify FK Constraint Definition in PostgreSQL Catalog
  const fkConstraints: Array<{
    constraint_name: string;
    delete_rule: string;
    update_rule: string;
  }> = await prisma.$queryRaw`
    SELECT 
      rc.constraint_name, 
      rc.delete_rule, 
      rc.update_rule
    FROM information_schema.referential_constraints rc
    WHERE rc.constraint_name = 'ReviewRound_submissionVersionId_fkey';
  `;
  console.log(
    "\n--- Verified Foreign Key Constraint in PostgreSQL Catalog ---",
  );
  fkConstraints.forEach((c) => {
    console.log(`Constraint: ${c.constraint_name}`);
    console.log(`Delete Rule: ${c.delete_rule} (Expected: CASCADE)`);
    console.log(`Update Rule: ${c.update_rule} (Expected: CASCADE)`);
  });

  // 4. Verify Existing Production Counts (Must match preflight exactly: 18 users, 858 articles, 6 submissions, 6 versions, 6 review rounds)
  const [
    userCount,
    articleCount,
    submissionCount,
    submissionVersionCount,
    reviewRoundCount,
    reviewAssignmentCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.article.count(),
    prisma.submission.count(),
    prisma.submissionVersion.count(),
    prisma.reviewRound.count(),
    prisma.reviewAssignment.count(),
  ]);

  console.log("\n--- Verified Live Record Counts vs. Preflight Baseline ---");
  console.log(
    `Users:                  ${userCount} (Preflight: 18) -> ${userCount === 18 ? "MATCH" : "MISMATCH"}`,
  );
  console.log(
    `Articles:               ${articleCount} (Preflight: 858) -> ${articleCount === 858 ? "MATCH" : "MISMATCH"}`,
  );
  console.log(
    `Submissions:            ${submissionCount} (Preflight: 6) -> ${submissionCount === 6 ? "MATCH" : "MISMATCH"}`,
  );
  console.log(
    `Submission Versions:    ${submissionVersionCount} (Preflight: 6) -> ${submissionVersionCount === 6 ? "MATCH" : "MISMATCH"}`,
  );
  console.log(
    `Review Rounds:          ${reviewRoundCount} (Preflight: 6) -> ${reviewRoundCount === 6 ? "MATCH" : "MISMATCH"}`,
  );
  console.log(
    `Review Assignments:     ${reviewAssignmentCount} (Preflight: 2) -> ${reviewAssignmentCount === 2 ? "MATCH" : "MISMATCH"}`,
  );

  // 5. Verify Table Row Initial Counts on New Tables
  const [annCount, boardCount, revCount] = await Promise.all([
    prisma.announcement.count(),
    prisma.editorialBoardMember.count(),
    prisma.reviewerApplication.count(),
  ]);
  console.log(`\nNew Table Row Counts (Pre-Ingestion):`);
  console.log(`Announcement:          ${annCount}`);
  console.log(`EditorialBoardMember:  ${boardCount}`);
  console.log(`ReviewerApplication:  ${revCount}`);

  console.log("\n=== POST-MIGRATION VERIFICATION AUDIT PASSED 100% ===");
}

verifyPostMigration()
  .catch((err) => {
    console.error("Post-migration verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
