import "server-only";

import { GlobalRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CasDevUserDefinition = {
  key: string;
  id: string;
  email: string;
  displayName: string;
  description: string;
  institution: string;
  department: string;
};

export const CAS_DATABASE_DEV_USERS: CasDevUserDefinition[] = [
  {
    key: "test-author-one",
    id: "00000000-0000-4000-d000-000000000001",
    email: "test.author.one@cas.test",
    displayName: "Test Author One",
    description: "Primary testing author for manuscript submission and queries",
    institution: "CAS Testing Academy",
    department: "Social Sciences",
  },
  {
    key: "test-author-two",
    id: "00000000-0000-4000-d000-000000000002",
    email: "test.author.two@cas.test",
    displayName: "Test Author Two",
    description:
      "Independent second author for isolation and multi-author workflows",
    institution: "CAS Testing Academy",
    department: "Social Sciences",
  },
  {
    key: "test-editor-one",
    id: "00000000-0000-4000-d000-000000000003",
    email: "test.editor.one@cas.test",
    displayName: "Test Editor One",
    description:
      "Editorial staff account — assignable to journals via /admin/access",
    institution: "CAS Testing Academy",
    department: "Social Sciences",
  },
  {
    key: "test-editor-two",
    id: "00000000-0000-4000-d000-000000000004",
    email: "test.editor.two@cas.test",
    displayName: "Test Editor Two",
    description:
      "Second editorial staff account — assignable to journals via /admin/access",
    institution: "CAS Testing Academy",
    department: "Social Sciences",
  },
  {
    key: "test-user-five",
    id: "00000000-0000-4000-d000-000000000005",
    email: "test.user.five@cas.test",
    displayName: "Test User Five",
    description: "Flexible testing user for role management and verification",
    institution: "CAS Testing Academy",
    department: "Social Sciences",
  },
];

/**
 * Ensures the 5 development test accounts exist in the database with the minimal AUTHOR role.
 * Preserves all existing journal role assignments so admin role assignments persist across restarts.
 * Only runs in non-production environments.
 */
export async function ensureCasDevUsersInDatabase(db?: unknown): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  const client = (db && typeof db === "object" ? db : prisma) as typeof prisma;

  for (const user of CAS_DATABASE_DEV_USERS) {
    try {
      await client.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          displayName: user.displayName,
          isActive: true,
        },
        create: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          isActive: true,
          institution: user.institution,
          department: user.department,
        },
      });

      await client.userGlobalRole.upsert({
        where: {
          userId_role: {
            userId: user.id,
            role: GlobalRole.AUTHOR,
          },
        },
        update: {},
        create: {
          userId: user.id,
          role: GlobalRole.AUTHOR,
        },
      });
    } catch (error) {
      console.error(
        `[DevUsers] Failed to ensure database record for ${user.displayName}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
