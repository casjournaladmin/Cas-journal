import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_JOURNAL_ORDER,
  getJournalDbSlugs,
  getJournalMetadata,
  getDefaultEditorialBoard,
  resolveCanonicalJournalSlug,
  sortJournalsByCanonicalOrder,
} from "@/lib/editorial/editorial-board-data";
import {
  addEditorialBoardMember,
  deleteEditorialBoardMember,
  getJournalEditorialBoard,
  isAuthorizedForJournal,
  resetEditorialBoard,
  updateEditorialBoardMember,
} from "@/lib/editorial/editorial-board-store";

test("Canonical journal ordering enforces Existentia first across platform", () => {
  assert.equal(CANONICAL_JOURNAL_ORDER[0], "existentia");
  assert.deepEqual(CANONICAL_JOURNAL_ORDER, [
    "existentia",
    "cjmr",
    "izu",
    "polis",
  ]);

  const rawList = [
    {
      slug: "polis",
      name: "The Polis: Journal of Political Studies",
    },
    {
      slug: "cjmr",
      name: "Concrescence Journal of Multi-Disciplinary Research",
    },
    {
      slug: "existentia",
      name: "Existentia: Concrescence Journal of Arts and Humanities",
    },
    {
      slug: "izu",
      name: "Izu: Journal of Critical Perspectives",
    },
  ];

  const sorted = sortJournalsByCanonicalOrder(rawList);
  assert.deepEqual(
    sorted.map((j) => j.slug),
    ["existentia", "cjmr", "izu", "polis"],
  );
});

test("Slug normalization maps canonical slugs properly", () => {
  assert.equal(resolveCanonicalJournalSlug("existentia"), "existentia");
  assert.equal(resolveCanonicalJournalSlug("EXISTENTIA"), "existentia");

  assert.equal(resolveCanonicalJournalSlug("cjmr"), "cjmr");
  assert.equal(resolveCanonicalJournalSlug("CJMR"), "cjmr");

  assert.equal(resolveCanonicalJournalSlug("izu"), "izu");
  assert.equal(resolveCanonicalJournalSlug("IZU"), "izu");

  assert.equal(resolveCanonicalJournalSlug("polis"), "polis");
  assert.equal(resolveCanonicalJournalSlug("POLIS"), "polis");
});

test("Database slug mapper expands slugs for queries", () => {
  assert.deepEqual(getJournalDbSlugs("existentia"), ["existentia"]);
  assert.deepEqual(getJournalDbSlugs("cjmr"), ["cjmr"]);
  assert.deepEqual(getJournalDbSlugs("izu"), ["izu"]);
  assert.deepEqual(getJournalDbSlugs("polis"), ["polis"]);
});

test("CAS Journal Metadata isolation", () => {
  const existentiaMeta = getJournalMetadata("existentia");
  assert.ok(existentiaMeta);
  assert.equal(
    existentiaMeta.title,
    "Existentia: Concrescence Journal of Arts and Humanities",
  );
  assert.equal(existentiaMeta.shortName, "EXISTENTIA");

  const cjmrMeta = getJournalMetadata("cjmr");
  assert.ok(cjmrMeta);
  assert.equal(
    cjmrMeta.title,
    "Concrescence Journal of Multi-Disciplinary Research",
  );
  assert.equal(cjmrMeta.shortName, "CJMR");

  const izuMeta = getJournalMetadata("izu");
  assert.ok(izuMeta);
  assert.equal(izuMeta.title, "Izu: Journal of Critical Perspectives");
  assert.equal(izuMeta.shortName, "IZU");

  const polisMeta = getJournalMetadata("polis");
  assert.ok(polisMeta);
  assert.equal(polisMeta.title, "The Polis: Journal of Political Studies");
  assert.equal(polisMeta.shortName, "POLIS");
});

test("Exact Editorial Board for Existentia", () => {
  const meta = getJournalMetadata("existentia");
  assert.ok(meta);
  assert.equal(
    meta.title,
    "Existentia: Concrescence Journal of Arts and Humanities",
  );
  assert.equal(meta.shortName, "EXISTENTIA");

  const board = getDefaultEditorialBoard("existentia");
  assert.equal(board.length, 2);

  // Editor-in-Chief
  const chief = board.find((m) => m.category === "EDITOR_IN_CHIEF");
  assert.ok(chief);
  assert.equal(chief.name, "Prof Izu M. Onyeocha");
  assert.equal(chief.role, "Editor-in-Chief");

  // Deputy Editor
  const deputy = board.find((m) => m.category === "DEPUTY_EDITOR");
  assert.ok(deputy);
  assert.equal(deputy.name, "Chidi K. Ogonnaya, PhD");
  assert.equal(deputy.role, "Deputy Editor");
});

test("Default editorial board configurations for CJMR, Izu, Polis", () => {
  const cjmrBoard = getDefaultEditorialBoard("cjmr");
  assert.equal(cjmrBoard.length, 6);
  assert.equal(
    cjmrBoard.find((m) => m.category === "EDITOR_IN_CHIEF")?.name,
    "Uche Oputa, PhD",
  );
  assert.ok(
    cjmrBoard.some((m) => m.name === "Chidi K. Ogonnaya, PhD"),
  );
  assert.ok(
    cjmrBoard.some((m) => m.name === "Bellarmine Nneji, PhD"),
  );

  const izuBoard = getDefaultEditorialBoard("izu");
  assert.equal(izuBoard.length, 2);
  assert.equal(
    izuBoard.find((m) => m.category === "EDITOR_IN_CHIEF")?.name,
    "Prof Izu M. Onyeocha",
  );
  assert.equal(
    izuBoard.find((m) => m.category === "ASSOCIATE_EDITOR")?.name,
    "Chidi K. Ogonnaya, PhD",
  );

  const polisBoard = getDefaultEditorialBoard("polis");
  assert.equal(polisBoard.length, 6);
  assert.equal(
    polisBoard.find((m) => m.category === "EDITOR_IN_CHIEF")?.name,
    "Chidi K. Ogonnaya, PhD",
  );
  assert.equal(
    polisBoard.find((m) => m.category === "ASSOCIATE_EDITOR")?.name,
    "Christian Nwadinihu, PhD",
  );
});

test("Editorial board store supports adding, editing, deleting, and resetting members safely", async () => {
  const superAdminActor = {
    id: "admin-1",
    email: "casjournaladmin@gmail.com",
    globalRoles: [
      { role: "SUPER_ADMIN" as const },
      { role: "AUTHOR" as const },
    ],
    journalRoles: [],
  };

  const initialBoard = await getJournalEditorialBoard("existentia");
  const initialCount = initialBoard.length;

  // 1. Add member
  const addRes = await addEditorialBoardMember({
    journalSlug: "existentia",
    name: "Dr. Test Guest Scholar",
    role: "Visiting Research Fellow",
    affiliation: "University of Cambridge",
    category: "CONSULTING_EDITOR",
    actor: superAdminActor,
  });

  assert.equal(addRes.success, true);
  assert.ok(addRes.member);

  const updatedBoard = await getJournalEditorialBoard("existentia");
  assert.equal(updatedBoard.length, initialCount + 1);
  const added = updatedBoard.find((m) => m.id === addRes.member?.id);
  assert.ok(added);
  assert.equal(added.name, "Dr. Test Guest Scholar");

  // 2. Update member
  const updateRes = await updateEditorialBoardMember({
    journalSlug: "existentia",
    memberId: added.id,
    name: "Prof. Test Guest Scholar Updated",
    role: "Senior Visiting Professor",
    affiliation: "University of Oxford",
    category: "CONSULTING_EDITOR",
    actor: superAdminActor,
  });
  assert.equal(updateRes.success, true);

  const boardAfterUpdate = await getJournalEditorialBoard("existentia");
  const updatedItem = boardAfterUpdate.find((m) => m.id === added.id);
  assert.equal(updatedItem?.name, "Prof. Test Guest Scholar Updated");

  // 3. Delete member
  const deleteRes = await deleteEditorialBoardMember({
    journalSlug: "existentia",
    memberId: added.id,
    actor: superAdminActor,
  });
  assert.equal(deleteRes.success, true);

  const boardAfterDelete = await getJournalEditorialBoard("existentia");
  assert.equal(boardAfterDelete.length, initialCount);

  // 4. Reset board
  const resetRes = await resetEditorialBoard({
    journalSlug: "existentia",
    actor: superAdminActor,
  });
  assert.equal(resetRes.success, true);
});

test("Journal-scoped authorization enforces boundary on governance mutations", async () => {
  const existentiaAdminActor = {
    id: "admin-existentia",
    email: "existentiaadmin@cas-journals.org",
    globalRoles: [{ role: "AUTHOR" as const }],
    journalRoles: [
      {
        journalId: "existentia",
        role: "JOURNAL_ADMIN" as const,
        journal: { slug: "existentia" },
      },
    ],
  };

  const authorActor = {
    id: "author-1",
    email: "author@gmail.com",
    globalRoles: [{ role: "AUTHOR" as const }],
    journalRoles: [],
  };

  // 1. Check helper
  assert.equal(isAuthorizedForJournal(existentiaAdminActor, "existentia"), true);
  assert.equal(isAuthorizedForJournal(existentiaAdminActor, "cjmr"), false);
  assert.equal(isAuthorizedForJournal(authorActor, "existentia"), false);

  // 2. Existentia admin can add board member to Existentia
  try {
    const allowedRes = await addEditorialBoardMember({
      journalSlug: "existentia",
      name: "Dr. Existentia Fellow",
      role: "Editorial Assistant",
      affiliation: "CAS Humanities",
      category: "BOARD_MEMBER",
      actor: existentiaAdminActor,
    });
    assert.equal(allowedRes.success, true);

    if (allowedRes.member) {
      await deleteEditorialBoardMember({
        journalSlug: "existentia",
        memberId: allowedRes.member.id,
        actor: existentiaAdminActor,
      });
    }
  } finally {
    await resetEditorialBoard({
      journalSlug: "existentia",
      actor: existentiaAdminActor,
    });
  }

  // 3. Existentia admin is DENIED adding board members to CJMR
  const deniedBoardRes = await addEditorialBoardMember({
    journalSlug: "cjmr",
    name: "Dr. Intruder",
    role: "Intruder",
    affiliation: "Unknown",
    category: "BOARD_MEMBER",
    actor: existentiaAdminActor,
  });
  assert.equal(deniedBoardRes.success, false);
  assert.ok(deniedBoardRes.error?.includes("Unauthorized"));
});

test("Navbar streamlining and footer navigation consistency", async () => {
  const { siteConfig } = await import("@/lib/config/site");

  const topNavLabels = siteConfig.publicNavigation.map((item) => item.label);
  assert.deepEqual(topNavLabels, [
    "Home",
    "Journals",
    "For Authors",
    "Current Issue",
    "Archive",
    "Indexing & Abstracting",
    "Contact",
  ]);

  const footerLabels = siteConfig.footerNavigation.map((item) => item.label);
  assert.deepEqual(footerLabels, [
    "Home",
    "Current Issue",
    "Archive",
    "Indexing & Abstracting",
    "Editorial Team",
    "Announcements",
    "Become a Reviewer",
    "Sign In / Track",
    "Contact Us",
  ]);
});
