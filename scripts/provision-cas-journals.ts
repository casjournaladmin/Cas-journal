import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { activeJournalsConfig, siteConfig } from "../lib/config/site";
import {
  CANONICAL_JOURNAL_METADATA,
  getDefaultEditorialBoard,
} from "../lib/editorial/editorial-board-data";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * Idempotent provisioning script for CAS Journals.
 * Upserts the 4 canonical CAS journals, their academic departments, and their
 * editorial board rosters without activating manuscript submissions.
 */
async function provisionCasJournals() {
  console.log("Starting CAS Journals provisioning...");

  for (const journalCfg of activeJournalsConfig) {
    const departmentSlug = `${journalCfg.slug}-dept`;
    const canonicalMeta = CANONICAL_JOURNAL_METADATA[journalCfg.slug];
    const departmentName =
      canonicalMeta?.department || journalCfg.shortName || journalCfg.name;

    const department = await prisma.department.upsert({
      where: { slug: departmentSlug },
      update: {
        name: departmentName,
        description: journalCfg.description || null,
        isActive: true,
      },
      create: {
        slug: departmentSlug,
        name: departmentName,
        description: journalCfg.description || null,
        isActive: true,
      },
      select: { id: true, name: true },
    });

    const journal = await prisma.journal.upsert({
      where: { slug: journalCfg.slug },
      update: {
        name: journalCfg.name,
        shortName: journalCfg.shortName,
        description: journalCfg.description || null,
        faculty: siteConfig.faculty || null,
        institution: siteConfig.institution,
        departmentId: department.id,
        isActive: true,
      },
      create: {
        slug: journalCfg.slug,
        name: journalCfg.name,
        shortName: journalCfg.shortName,
        description: journalCfg.description || null,
        faculty: siteConfig.faculty || null,
        institution: siteConfig.institution,
        departmentId: department.id,
        isActive: true,
      },
      select: { id: true, slug: true, name: true },
    });

    console.log(`✓ Upserted journal: ${journal.name} (${journal.slug})`);

    const roster = getDefaultEditorialBoard(journalCfg.slug);
    const existingCount = await prisma.editorialBoardMember.count({
      where: { journalSlug: journalCfg.slug },
    });

    if (existingCount === 0 && roster.length > 0) {
      await prisma.editorialBoardMember.createMany({
        data: roster.map((member) => ({
          id: member.id,
          journalSlug: journalCfg.slug,
          name: member.name,
          role: member.role,
          affiliation: member.affiliation,
          category: member.category,
          order: member.order,
        })),
      });
      console.log(
        `  ↳ Seeded ${roster.length} editorial board members for ${journal.slug}`,
      );
    } else {
      console.log(
        `  ↳ Kept existing ${existingCount} editorial board members for ${journal.slug}`,
      );
    }

    await prisma.journalActivation.upsert({
      where: { journalSlug: journalCfg.slug },
      update: {
        activatedAt: new Date(),
        activatedBy: "SYSTEM_INITIAL_PROVISIONING",
      },
      create: {
        journalSlug: journalCfg.slug,
        activatedAt: new Date(),
        activatedBy: "SYSTEM_INITIAL_PROVISIONING",
      },
    });
    console.log(`  ↳ Activated submissions for ${journal.slug}`);
  }

  console.log("CAS Journals provisioning completed.");
}

provisionCasJournals()
  .catch((error) => {
    console.error("Provisioning failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
