import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessApplicationArea,
  hasGlobalRole,
  hasJournalRole,
  isSuperAdmin,
} from "../lib/auth/permissions";
import {
  IZU_DEV_IDENTITIES,
  isDevIdentityEnabled,
} from "../lib/auth/dev-identities";
import {
  getAvailableWorkspaces,
  getPostLoginDestination,
} from "../lib/auth/workspaces";
import {
  canManageSubmission,
  canAssignReviewer,
} from "../lib/editorial/policy";

test("1. Author One and Author Two have pure Author access", () => {
  const author1 = IZU_DEV_IDENTITIES["author-one"];
  const author2 = IZU_DEV_IDENTITIES["author-two"];

  assert.equal(hasGlobalRole(author1, "AUTHOR"), true);
  assert.equal(hasGlobalRole(author2, "AUTHOR"), true);

  assert.equal(canAccessApplicationArea(author1, "author"), true);
  assert.equal(canAccessApplicationArea(author2, "author"), true);

  assert.equal(canAccessApplicationArea(author1, "editor"), false);
  assert.equal(canAccessApplicationArea(author2, "editor"), false);

  assert.equal(canAccessApplicationArea(author1, "admin"), false);
  assert.equal(canAccessApplicationArea(author2, "admin"), false);

  assert.equal(isSuperAdmin(author1), false);
  assert.equal(isSuperAdmin(author2), false);

  // Author login destination is /author
  assert.equal(getPostLoginDestination(author1), "/author");
  assert.equal(getPostLoginDestination(author2), "/author");
});

test("2. Editor One and Editor Two are scoped strictly to Izu", () => {
  const editor1 = IZU_DEV_IDENTITIES["editor-one"];
  const editor2 = IZU_DEV_IDENTITIES["editor-two"];

  // Can access editor area
  assert.equal(canAccessApplicationArea(editor1, "editor"), true);
  assert.equal(canAccessApplicationArea(editor2, "editor"), true);

  // Scoped to Izu only
  assert.equal(hasJournalRole(editor1, "izu", "EDITOR"), true);
  assert.equal(hasJournalRole(editor2, "izu", "EDITOR"), true);

  // NOT scoped to any other journals
  assert.equal(hasJournalRole(editor1, "existentia", "EDITOR"), false);
  assert.equal(hasJournalRole(editor1, "cjmr", "EDITOR"), false);
  assert.equal(hasJournalRole(editor1, "polis", "EDITOR"), false);

  // NOT super admin or journal admin
  assert.equal(isSuperAdmin(editor1), false);
  assert.equal(hasJournalRole(editor1, "izu", "JOURNAL_ADMIN"), false);

  // Workspaces point to Izu editor
  const workspaces = getAvailableWorkspaces(editor1);
  assert.equal(workspaces.length, 1);
  assert.equal(workspaces[0].href, "/editor/izu");
  assert.equal(workspaces[0].journal?.slug, "izu");
});

test("3. Izu Journal Administrator is scoped strictly to Izu without platform Super Admin", () => {
  const adminIzu = IZU_DEV_IDENTITIES["admin-izu"];

  // Can access admin area for Izu
  assert.equal(canAccessApplicationArea(adminIzu, "admin"), true);
  assert.equal(hasJournalRole(adminIzu, "izu", "JOURNAL_ADMIN"), true);

  // NO platform Super Admin privileges
  assert.equal(isSuperAdmin(adminIzu), false);

  // Cannot manage other journals
  assert.equal(hasJournalRole(adminIzu, "existentia", "JOURNAL_ADMIN"), false);
  assert.equal(hasJournalRole(adminIzu, "cjmr", "JOURNAL_ADMIN"), false);
  assert.equal(hasJournalRole(adminIzu, "polis", "JOURNAL_ADMIN"), false);

  // Post-login destination points to Izu admin
  assert.equal(getPostLoginDestination(adminIzu), "/admin/izu");
});

test("4. Editorial policy enforcement: Izu admin can manage Izu submissions but not Existentia", () => {
  const adminIzu = IZU_DEV_IDENTITIES["admin-izu"];
  const editorialActor = {
    id: adminIzu.id,
    active: adminIzu.isActive,
    adminJournalIds: ["izu"],
    editorJournalIds: [],
  };

  const izuSubmission = {
    id: "sub-izu-1",
    journalId: "izu",
    ownerId: "author-1",
  };
  const existentiaSubmission = {
    id: "sub-ex-1",
    journalId: "existentia",
    ownerId: "author-1",
  };

  assert.equal(canManageSubmission(editorialActor, izuSubmission), true);
  assert.equal(
    canManageSubmission(editorialActor, existentiaSubmission),
    false,
  );
});

test("5. Editorial policy enforcement: Izu editor can be assigned to Izu submission only", () => {
  const adminIzu = IZU_DEV_IDENTITIES["admin-izu"];
  const editor1 = IZU_DEV_IDENTITIES["editor-one"];

  const adminActor = {
    id: adminIzu.id,
    active: adminIzu.isActive,
    adminJournalIds: ["izu"],
    editorJournalIds: [],
  };

  const izuEditorActor = {
    id: editor1.id,
    active: editor1.isActive,
    adminJournalIds: [],
    editorJournalIds: ["izu"],
  };

  const crossEditorActor = {
    id: "cross-ed",
    active: true,
    adminJournalIds: [],
    editorJournalIds: ["polis"],
  };

  const izuSubmission = {
    id: "sub-izu-1",
    journalId: "izu",
    ownerId: "author-1",
  };

  // Can assign Izu editor to Izu submission
  assert.equal(
    canAssignReviewer({
      administrator: adminActor,
      editor: izuEditorActor,
      submission: izuSubmission,
      existingEditorIds: [],
    }),
    true,
  );

  // Cannot assign Polis editor to Izu submission
  assert.equal(
    canAssignReviewer({
      administrator: adminActor,
      editor: crossEditorActor,
      submission: izuSubmission,
      existingEditorIds: [],
    }),
    false,
  );
});

test("6. Production safety guard disables development accounts in production", () => {
  const envObj = process.env as Record<string, string | undefined>;
  const originalEnv = envObj.NODE_ENV;
  try {
    envObj.NODE_ENV = "production";
    assert.equal(isDevIdentityEnabled(), false);
  } finally {
    envObj.NODE_ENV = originalEnv;
  }
});

test("7. Journal role matching supports both CUID and slug", () => {
  const editor1 = IZU_DEV_IDENTITIES["editor-one"];
  const adminIzu = IZU_DEV_IDENTITIES["admin-izu"];

  // Matches by slug
  assert.equal(hasJournalRole(editor1, "izu", "EDITOR"), true);
  assert.equal(hasJournalRole(adminIzu, "izu", "JOURNAL_ADMIN"), true);

  // Matches by cuid
  assert.equal(
    hasJournalRole(editor1, "cmve0lnmo0005p3v16c6jlw7b", "EDITOR"),
    true,
  );
  assert.equal(
    hasJournalRole(adminIzu, "cmve0lnmo0005p3v16c6jlw7b", "JOURNAL_ADMIN"),
    true,
  );

  // Rejects other journal cuids and slugs
  assert.equal(
    hasJournalRole(editor1, "cmve0lfl00001p3v1u32e8wwt", "EDITOR"),
    false,
  );
  assert.equal(hasJournalRole(editor1, "existentia", "EDITOR"), false);
});

test("8. Dedicated dev actions module exports server action functions", async () => {
  const devActions = await import("../lib/auth/dev-actions");
  assert.equal(typeof devActions.switchDevIdentityAction, "function");
  assert.equal(typeof devActions.clearDevIdentityAction, "function");
});
