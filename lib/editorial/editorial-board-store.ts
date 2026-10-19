import "server-only";

import { revalidatePath } from "next/cache";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import {
  type EditorialBoardMember,
  type EditorialMemberCategory,
  getDefaultEditorialBoard,
  resolveCanonicalJournalSlug,
} from "@/lib/editorial/editorial-board-data";

export function isAuthorizedForJournal(
  actor: Parameters<typeof isSuperAdmin>[0],
  canonicalSlug: string,
): boolean {
  if (!actor) return false;
  if (isSuperAdmin(actor)) return true;
  if (!actor.journalRoles || !Array.isArray(actor.journalRoles)) return false;

  const normalized = resolveCanonicalJournalSlug(canonicalSlug);

  return actor.journalRoles.some((r) => {
    if (r.role !== "JOURNAL_ADMIN") return false;
    if (r.journalId.trim().toLowerCase() === normalized) return true;
    if (
      "journal" in r &&
      (r.journal as { slug?: string })?.slug?.trim().toLowerCase() ===
        normalized
    ) {
      return true;
    }
    return false;
  });
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully ignore outside Next.js request/RSC context (e.g. unit tests)
  }
}

export async function getJournalEditorialBoard(
  journalSlug: string,
): Promise<EditorialBoardMember[]> {
  const canonical = resolveCanonicalJournalSlug(journalSlug);
  if (!canonical) return [];

  const dbMembers = await prisma.editorialBoardMember.findMany({
    where: { journalSlug: canonical },
    orderBy: { order: "asc" },
  });

  if (dbMembers.length === 0) {
    return getDefaultEditorialBoard(canonical);
  }

  return dbMembers.map((m) => ({
    id: m.id,
    journalSlug: m.journalSlug,
    name: m.name,
    role: m.role,
    affiliation: m.affiliation,
    category: m.category as EditorialMemberCategory,
    order: m.order,
  }));
}

async function ensureCustomBoardSeeded(canonical: string): Promise<void> {
  const existingCount = await prisma.editorialBoardMember.count({
    where: { journalSlug: canonical },
  });
  if (existingCount === 0) {
    const defaultBoard = getDefaultEditorialBoard(canonical);
    for (let i = 0; i < defaultBoard.length; i++) {
      const m = defaultBoard[i];
      await prisma.editorialBoardMember.create({
        data: {
          id: m.id,
          journalSlug: canonical,
          name: m.name,
          role: m.role,
          affiliation: m.affiliation,
          category: m.category,
          order: i + 1,
        },
      });
    }
  }
}

export async function addEditorialBoardMember({
  journalSlug,
  name,
  role,
  affiliation,
  category,
  actor,
}: {
  journalSlug: string;
  name: string;
  role: string;
  affiliation: string;
  category: EditorialMemberCategory;
  actor: Parameters<typeof isSuperAdmin>[0];
}): Promise<{
  success: boolean;
  error?: string;
  member?: EditorialBoardMember;
}> {
  const canonical = resolveCanonicalJournalSlug(journalSlug);
  if (!isAuthorizedForJournal(actor, canonical)) {
    return {
      success: false,
      error:
        "Unauthorized: Managing Editor permissions required for this journal.",
    };
  }

  if (!name.trim() || !role.trim()) {
    return {
      success: false,
      error: "Name and Role/Designation are required.",
    };
  }

  await ensureCustomBoardSeeded(canonical);

  const currentCount = await prisma.editorialBoardMember.count({
    where: { journalSlug: canonical },
  });

  const memberId = `${canonical}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const created = await prisma.editorialBoardMember.create({
    data: {
      id: memberId,
      journalSlug: canonical,
      name: name.trim(),
      role: role.trim(),
      affiliation: affiliation.trim(),
      category,
      order: currentCount + 1,
    },
  });

  safeRevalidatePath(`/journals/${canonical}`);
  safeRevalidatePath(`/journals/${journalSlug}`);
  safeRevalidatePath("/editorial-board");
  safeRevalidatePath("/admin/editorial-board");

  return {
    success: true,
    member: {
      id: created.id,
      journalSlug: created.journalSlug,
      name: created.name,
      role: created.role,
      affiliation: created.affiliation,
      category: created.category as EditorialMemberCategory,
      order: created.order,
    },
  };
}

export async function updateEditorialBoardMember({
  journalSlug,
  memberId,
  name,
  role,
  affiliation,
  category,
  actor,
}: {
  journalSlug: string;
  memberId: string;
  name: string;
  role: string;
  affiliation: string;
  category: EditorialMemberCategory;
  actor: Parameters<typeof isSuperAdmin>[0];
}): Promise<{ success: boolean; error?: string }> {
  const canonical = resolveCanonicalJournalSlug(journalSlug);
  if (!isAuthorizedForJournal(actor, canonical)) {
    return {
      success: false,
      error:
        "Unauthorized: Managing Editor permissions required for this journal.",
    };
  }

  const existing = await prisma.editorialBoardMember.findFirst({
    where: { id: memberId, journalSlug: canonical },
  });

  if (!existing) {
    return { success: false, error: "Editorial board member not found." };
  }

  await prisma.editorialBoardMember.update({
    where: { id: memberId },
    data: {
      name: name.trim(),
      role: role.trim(),
      affiliation: affiliation.trim(),
      category,
    },
  });

  safeRevalidatePath(`/journals/${canonical}`);
  safeRevalidatePath(`/journals/${journalSlug}`);
  safeRevalidatePath("/editorial-board");
  safeRevalidatePath("/admin/editorial-board");

  return { success: true };
}

export async function deleteEditorialBoardMember({
  journalSlug,
  memberId,
  actor,
}: {
  journalSlug: string;
  memberId: string;
  actor: Parameters<typeof isSuperAdmin>[0];
}): Promise<{ success: boolean; error?: string }> {
  const canonical = resolveCanonicalJournalSlug(journalSlug);
  if (!isAuthorizedForJournal(actor, canonical)) {
    return {
      success: false,
      error:
        "Unauthorized: Managing Editor permissions required for this journal.",
    };
  }

  const existing = await prisma.editorialBoardMember.findFirst({
    where: { id: memberId, journalSlug: canonical },
  });

  if (!existing) {
    return { success: false, error: "Editorial board member not found." };
  }

  await prisma.editorialBoardMember.delete({
    where: { id: memberId },
  });

  safeRevalidatePath(`/journals/${canonical}`);
  safeRevalidatePath(`/journals/${journalSlug}`);
  safeRevalidatePath("/editorial-board");
  safeRevalidatePath("/admin/editorial-board");

  return { success: true };
}

export async function resetEditorialBoard({
  journalSlug,
  actor,
}: {
  journalSlug: string;
  actor: Parameters<typeof isSuperAdmin>[0];
}): Promise<{ success: boolean; error?: string }> {
  const canonical = resolveCanonicalJournalSlug(journalSlug);
  if (!isAuthorizedForJournal(actor, canonical)) {
    return {
      success: false,
      error:
        "Unauthorized: Managing Editor permissions required for this journal.",
    };
  }

  await prisma.editorialBoardMember.deleteMany({
    where: { journalSlug: canonical },
  });

  safeRevalidatePath(`/journals/${canonical}`);
  safeRevalidatePath(`/journals/${journalSlug}`);
  safeRevalidatePath("/editorial-board");
  safeRevalidatePath("/admin/editorial-board");

  return { success: true };
}
