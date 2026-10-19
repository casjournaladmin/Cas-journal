import "server-only";

import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import {
  assignManagedRoleForActor,
  removeManagedRoleForActor,
  RoleManagementError,
  type ManagedRoleInput,
} from "@/lib/auth/role-management";
import { prisma } from "@/lib/db/prisma";

import { getHiddenBreakGlassEmails } from "@/lib/auth/provisioning";
import { sortJournalsByCanonicalOrder } from "@/lib/editorial/editorial-board-data";

export { RoleManagementError } from "@/lib/auth/role-management";

export async function assignManagedRole(input: ManagedRoleInput) {
  const actor = await requireAuthenticatedUser();
  return assignManagedRoleForActor(actor.id, input);
}

export async function removeManagedRole(input: ManagedRoleInput) {
  const actor = await requireAuthenticatedUser();
  return removeManagedRoleForActor(actor.id, input);
}

export async function searchRoleManagementUsers(query: string) {
  const actor = await requireAuthenticatedUser();
  const canManage =
    actor.globalRoles.some(({ role }) => role === "SUPER_ADMIN") ||
    actor.journalRoles.some(({ role }) => role === "JOURNAL_ADMIN");
  if (!canManage) throw new RoleManagementError("You cannot manage access.");

  if (process.env.NODE_ENV !== "production") {
    try {
      const { ensureCasDevUsersInDatabase } =
        await import("@/lib/auth/dev-database-users");
      await ensureCasDevUsersInDatabase();
    } catch {
      // Ignore background seeding error
    }
  }

  const hiddenBreakGlassEmails = Array.from(getHiddenBreakGlassEmails());
  const search = query.trim();
  const whereCondition =
    search.length >= 2
      ? {
          id: { not: actor.id },
          ...(hiddenBreakGlassEmails.length > 0
            ? { email: { notIn: hiddenBreakGlassEmails } }
            : {}),
          OR: [
            { displayName: { contains: search, mode: "insensitive" as const } },
            {
              email: {
                contains: search.toLowerCase(),
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {
          id: { not: actor.id },
          ...(hiddenBreakGlassEmails.length > 0
            ? { email: { notIn: hiddenBreakGlassEmails } }
            : {}),
        };

  return prisma.user.findMany({
    where: whereCondition,
    select: {
      id: true,
      email: true,
      displayName: true,
      isActive: true,
      globalRoles: { select: { role: true } },
      journalRoles: {
        select: {
          id: true,
          role: true,
          journalId: true,
          journal: {
            select: {
              name: true,
              slug: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { displayName: "asc" },
    take: 50,
  });
}

export async function listRoleManagementJournals() {
  const actor = await requireAuthenticatedUser();
  if (!actor.globalRoles.some(({ role }) => role === "SUPER_ADMIN")) {
    throw new RoleManagementError("Only a Super Admin can manage staff roles.");
  }

  const journals = await prisma.journal.findMany({
    where: {
      isActive: true,
      OR: [{ departmentId: null }, { department: { isActive: true } }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return sortJournalsByCanonicalOrder(journals);
}

export async function listRecentRoleChangeEvents(limit = 20) {
  const actor = await requireAuthenticatedUser();
  if (!actor.globalRoles.some(({ role }) => role === "SUPER_ADMIN")) {
    return [];
  }

  const hiddenBreakGlassEmails = Array.from(getHiddenBreakGlassEmails());

  return prisma.roleChangeEvent.findMany({
    where:
      hiddenBreakGlassEmails.length > 0
        ? {
            actor: { email: { notIn: hiddenBreakGlassEmails } },
            targetUser: { email: { notIn: hiddenBreakGlassEmails } },
          }
        : undefined,
    include: {
      actor: { select: { displayName: true, email: true } },
      targetUser: { select: { displayName: true, email: true } },
      journal: { select: { name: true, shortName: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
