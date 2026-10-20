import assert from "node:assert/strict";
import test from "node:test";
import { checkInternalChatAccess } from "../lib/editorial/internal-chat";
import type { InternalChatUserSubject } from "../lib/editorial/internal-chat";
import { IZU_DEV_IDENTITIES } from "../lib/auth/dev-identities";

test("internal-chat-auth: Super Admin has platform-wide chat access", async () => {
  const superAdmin: InternalChatUserSubject = {
    id: "user-super-admin-1",
    roles: ["SUPER_ADMIN"],
    journalRoles: [],
  };
  const hasAccess = await checkInternalChatAccess(
    superAdmin,
    "journal-psychology",
  );
  assert.equal(hasAccess, true);
});

test("internal-chat-auth: Journal Admin has chat access to their journal only", async () => {
  const journalAdmin: InternalChatUserSubject = {
    id: "user-admin-izu",
    roles: [],
    journalRoles: [
      { journalId: "journal-izu", journalSlug: "izu", role: "JOURNAL_ADMIN" },
    ],
  };
  assert.equal(
    await checkInternalChatAccess(journalAdmin, "journal-izu"),
    true,
  );
  assert.equal(
    await checkInternalChatAccess(journalAdmin, "journal-other"),
    false,
  );
});

test("internal-chat-auth: Editor has chat access to their journal only", async () => {
  const editor: InternalChatUserSubject = {
    id: "user-editor-izu",
    roles: [],
    journalRoles: [
      { journalId: "journal-izu", journalSlug: "izu", role: "EDITOR" },
    ],
  };
  assert.equal(await checkInternalChatAccess(editor, "journal-izu"), true);
  assert.equal(await checkInternalChatAccess(editor, "journal-other"), false);
});

test("internal-chat-auth: Author is forbidden from internal team chat", async () => {
  const author: InternalChatUserSubject = {
    id: "user-author-1",
    roles: ["AUTHOR"],
    journalRoles: [],
  };
  assert.equal(await checkInternalChatAccess(author, "journal-izu"), false);
});

test("internal-chat-auth: Dev identity editor has access to their assigned journal", async () => {
  const devEditor = IZU_DEV_IDENTITIES["editor-one"];
  // Editor one is scoped to "izu"
  const hasAccess = await checkInternalChatAccess(devEditor, "izu");
  assert.equal(hasAccess, true);

  // Editor one is NOT scoped to other journals
  const hasOtherAccess = await checkInternalChatAccess(devEditor, "existentia");
  assert.equal(hasOtherAccess, false);
});

test("internal-chat-auth: Dev identity author cannot access internal team chat", async () => {
  const devAuthor = IZU_DEV_IDENTITIES["author-one"];
  const hasAccess = await checkInternalChatAccess(devAuthor, "izu");
  assert.equal(hasAccess, false);
});
