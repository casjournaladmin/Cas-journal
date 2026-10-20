import { redirect } from "next/navigation";

import { AuthenticatedShell } from "@/components/app/authenticated-shell";
import { EditorialBoardManager } from "@/components/admin/editorial-board-manager";
import { requireApplicationArea } from "@/lib/auth/authorization";
import { getAvailableWorkspaces } from "@/lib/auth/workspaces";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import {
  CANONICAL_JOURNAL_ORDER,
  buildJournalMetadataFromRecord,
  sortJournalsByCanonicalOrder,
  type EditorialBoardMember,
} from "@/lib/editorial/editorial-board-data";
import {
  getJournalEditorialBoard,
  isAuthorizedForJournal,
} from "@/lib/editorial/editorial-board-store";

export const dynamic = "force-dynamic";

export default async function AdminEditorialBoardPage() {
  const user = await requireApplicationArea("admin");
  const workspaces = getAvailableWorkspaces(user);
  const workspace =
    workspaces.find((item) => item.area === "platform") ?? workspaces[0];

  if (!workspace) {
    redirect("/unauthorized?reason=workspace");
  }

  const dbJournals = await prisma.journal.findMany({
    where: {
      isActive: true,
      slug: { in: [...CANONICAL_JOURNAL_ORDER] },
      OR: [{ departmentId: null }, { department: { isActive: true } }],
    },
    select: {
      slug: true,
      name: true,
      shortName: true,
      description: true,
      faculty: true,
      institution: true,
      department: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  const allJournals = sortJournalsByCanonicalOrder(dbJournals).map((j) =>
    buildJournalMetadataFromRecord(j),
  );

  const accessibleJournals = isSuperAdmin(user)
    ? allJournals
    : allJournals.filter((j) => isAuthorizedForJournal(user, j.slug));

  if (!isSuperAdmin(user) && accessibleJournals.length === 0) {
    redirect("/unauthorized?reason=scope");
  }

  const journals = accessibleJournals;
  const boardPairs = await Promise.all(
    accessibleJournals.map(async (j) => {
      const board = await getJournalEditorialBoard(j.slug);
      return [j.slug, board] as [string, EditorialBoardMember[]];
    }),
  );

  const initialBoards = Object.fromEntries(boardPairs);

  return (
    <AuthenticatedShell
      user={user}
      workspace={workspace}
      workspaces={workspaces}
      navigation={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/submissions", label: "Manuscripts" },
        { href: "/admin/articles", label: "Articles & Content" },
        { href: "/admin/editorial-board", label: "Editorial Board" },
        { href: "/admin/reviewers", label: "Reviewers" },
        { href: "/admin/announcements", label: "Announcements" },
        { href: "/admin/access", label: "Users" },
      ]}
    >
      <EditorialBoardManager
        journals={journals}
        initialBoards={initialBoards}
      />
    </AuthenticatedShell>
  );
}
