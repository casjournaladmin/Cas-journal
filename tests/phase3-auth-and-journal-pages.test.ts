import assert from "node:assert/strict";
import test from "node:test";

import {
  ALL_DEV_IDENTITIES,
  CAS_DEV_IDENTITIES,
  IZU_DEV_IDENTITIES,
  getDevIdentityById,
  isDevIdentityEnabled,
} from "../lib/auth/dev-identities";
import {
  buildJournalMetadataFromRecord,
  getDefaultEditorialBoard,
  getJournalMetadata,
} from "../lib/editorial/editorial-board-data";

test("Authentication & Dev Identities: isDevIdentityEnabled respects NODE_ENV", () => {
  // In development/test environment, dev identity is enabled
  assert.equal(isDevIdentityEnabled(), true);

  // In production, isDevIdentityEnabled must return false
  const prevEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    assert.equal(isDevIdentityEnabled(), false);
    assert.equal(
      getDevIdentityById("00000000-0000-4000-d000-000000000001"),
      null,
    );
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
  }
});

test("Authentication & Dev Identities: Exactly 10 dev identities exist across two clean groups", () => {
  const casKeys = Object.keys(CAS_DEV_IDENTITIES);
  const izuKeys = Object.keys(IZU_DEV_IDENTITIES);
  const allKeys = Object.keys(ALL_DEV_IDENTITIES);

  assert.equal(
    casKeys.length,
    5,
    "Must have exactly 5 CAS database-backed accounts",
  );
  assert.equal(izuKeys.length, 5, "Must have exactly 5 Izu-scoped accounts");
  assert.equal(allKeys.length, 10, "Must have total of 10 dev accounts");

  // Verify all 5 CAS database accounts
  assert.deepEqual(
    casKeys.sort(),
    [
      "test-author-one",
      "test-author-two",
      "test-editor-one",
      "test-editor-two",
      "test-user-five",
    ].sort(),
  );

  // Verify all 5 Izu-scoped accounts
  assert.deepEqual(
    izuKeys.sort(),
    [
      "admin-izu",
      "author-one",
      "author-two",
      "editor-one",
      "editor-two",
    ].sort(),
  );

  // Verify all identities resolve by ID
  for (const identity of Object.values(ALL_DEV_IDENTITIES)) {
    const resolved = getDevIdentityById(identity.id);
    assert.ok(resolved, `Identity ${identity.key} must resolve by ID`);
    assert.equal(resolved?.email, identity.email);
    assert.equal(resolved?.isActive, true);
  }
});

test("Authentication & Dev Identities: Post-login destinations resolve correctly for all 10 accounts", async () => {
  const { getPostLoginDestination } = await import("../lib/auth/workspaces");

  // CAS Database-backed users all begin with global AUTHOR role -> /author
  for (const identity of Object.values(CAS_DEV_IDENTITIES)) {
    const dest = getPostLoginDestination(identity);
    assert.equal(
      dest,
      "/author",
      `${identity.key} must route to author workspace`,
    );
  }

  // Izu-scoped identities route to their scoped roles
  assert.equal(
    getPostLoginDestination(IZU_DEV_IDENTITIES["author-one"]),
    "/author",
  );
  assert.equal(
    getPostLoginDestination(IZU_DEV_IDENTITIES["author-two"]),
    "/author",
  );
  assert.equal(
    getPostLoginDestination(IZU_DEV_IDENTITIES["editor-one"]),
    "/editor/izu",
  );
  assert.equal(
    getPostLoginDestination(IZU_DEV_IDENTITIES["editor-two"]),
    "/editor/izu",
  );
  assert.equal(
    getPostLoginDestination(IZU_DEV_IDENTITIES["admin-izu"]),
    "/admin/izu",
  );
});

test("Journal Metadata: All 4 CAS journals have enriched metadata without schema migration", () => {
  const expectedSlugs = ["cjmr", "existentia", "izu", "polis"];

  for (const slug of expectedSlugs) {
    const meta = getJournalMetadata(slug);
    assert.ok(meta, `Journal metadata for ${slug} must exist`);
    assert.ok(
      meta.title.length > 5,
      `Journal title for ${slug} must be complete`,
    );
    assert.ok(
      meta.aimsAndScope.length > 20,
      `Aims and scope for ${slug} must be complete`,
    );
    assert.ok(
      meta.subjectAreas && meta.subjectAreas.length >= 5,
      `${slug} must have subject areas list`,
    );
    assert.ok(
      meta.articleTypes && meta.articleTypes.length >= 3,
      `${slug} must have article types list`,
    );
    assert.ok(
      meta.guidelines?.abstractLength,
      `${slug} must specify abstract length`,
    );
    assert.ok(
      meta.guidelines?.keywordsCount,
      `${slug} must specify keywords count`,
    );
    assert.ok(
      meta.guidelines?.submissionEmail,
      `${slug} must specify submission email`,
    );
    assert.ok(
      meta.referencingStyle.includes("APA 7th"),
      `${slug} must specify APA 7th style`,
    );
    assert.ok(
      meta.peerReviewPolicy.includes("Double-blind"),
      `${slug} must specify double-blind peer review`,
    );
    assert.ok(
      meta.openAccessPolicy?.includes("CC BY 4.0"),
      `${slug} must specify CC BY 4.0`,
    );
    assert.ok(
      meta.apcInfo?.nigerianFee === "₦30,000",
      `${slug} APC Nigerian fee must be ₦30,000`,
    );
    assert.ok(
      meta.apcInfo?.foreignFee === "US $90",
      `${slug} APC foreign fee must be US $90`,
    );
    assert.ok(meta.officeAddress, `${slug} must have office address`);
    assert.ok(
      meta.contactPhone === "08085904192",
      `${slug} must have contact phone`,
    );
  }
});

test("Journal Metadata: Source inconsistencies handled correctly", () => {
  const cjmr = getJournalMetadata("cjmr");
  const izu = getJournalMetadata("izu");
  const existentia = getJournalMetadata("existentia");
  const polis = getJournalMetadata("polis");

  // CJMR indexing section mistakenly named EXISTENTIA in source doc -> must NOT be present
  assert.ok(
    !cjmr?.aimsAndScope.includes("EXISTENTIA"),
    "CJMR must not reference EXISTENTIA in scope",
  );

  // Izu indexing section mistakenly named PJPS in source doc -> must NOT be present
  assert.ok(
    !izu?.aimsAndScope.includes("PJPS"),
    "IZU must not reference PJPS in scope",
  );

  // ISSN discrepancies preserved as supplied for review
  assert.ok(
    cjmr?.issnOnline?.includes("1595-9287"),
    "CJMR online ISSN must be preserved",
  );
  assert.ok(
    cjmr?.issnPreservedNote?.includes("E-3093-0650"),
    "CJMR preserved note must mention E-3093-0650",
  );

  assert.ok(
    existentia?.issnOnline?.includes("3093-0650"),
    "Existentia online ISSN must be preserved",
  );
  assert.ok(
    existentia?.issnPreservedNote?.includes("E-3093-0650"),
    "Existentia note must mention E-3093-0650",
  );

  assert.ok(
    izu?.issnOnline?.includes("3093-0650"),
    "Izu online ISSN must be preserved",
  );
  assert.ok(
    izu?.issnPreservedNote?.includes("E-3093-0650"),
    "Izu note must mention E-3093-0650",
  );

  assert.ok(
    polis?.issnOnline?.includes("3092-9113"),
    "Polis online ISSN must be preserved",
  );
  assert.ok(
    polis?.issnPreservedNote?.includes("E-3093-0650"),
    "Polis note must mention E-3093-0650",
  );

  // Publication frequencies preserved
  assert.ok(
    cjmr?.frequency.includes("Six issues"),
    "CJMR frequency must be 6 issues/year",
  );
  assert.ok(
    existentia?.frequency.includes("Six issues"),
    "Existentia frequency must be 6 issues/year",
  );
  assert.ok(
    izu?.frequency.includes("Four issues"),
    "Izu frequency must be 4 issues/year",
  );
  assert.ok(
    polis?.frequency.includes("Four issues"),
    "Polis frequency must be 4 issues/year",
  );
});

test("Journal Editorial Boards: Verified members match supplied assignments", () => {
  // CJMR
  const cjmrBoard = getDefaultEditorialBoard("cjmr");
  assert.equal(cjmrBoard.length, 6, "CJMR must have 6 board members");
  assert.equal(cjmrBoard[0].name, "Uche Oputa, PhD");
  assert.equal(cjmrBoard[0].role, "Editor-in-Chief");
  assert.ok(cjmrBoard.some((m) => m.name === "Chidi K. Ogonnaya, PhD"));
  assert.ok(cjmrBoard.some((m) => m.name === "Bellarmine Nneji, PhD"));
  assert.ok(cjmrBoard.some((m) => m.name === "Ifeanyi Anyanwu, PhD"));
  assert.ok(cjmrBoard.some((m) => m.name === "Bernard Berm Assoh, PhD"));
  assert.ok(cjmrBoard.some((m) => m.name === "Francis Ofoegbu, PhD"));

  // EXISTENTIA
  const existBoard = getDefaultEditorialBoard("existentia");
  assert.equal(existBoard.length, 2, "Existentia must have 2 officers");
  assert.equal(existBoard[0].name, "Prof Izu M. Onyeocha");
  assert.equal(existBoard[0].role, "Editor-in-Chief");
  assert.equal(existBoard[1].name, "Chidi K. Ogonnaya, PhD");
  assert.equal(existBoard[1].role, "Deputy Editor");

  // IZU
  const izuBoard = getDefaultEditorialBoard("izu");
  assert.equal(izuBoard.length, 2, "Izu must have 2 officers");
  assert.equal(izuBoard[0].name, "Prof Izu M. Onyeocha");
  assert.equal(izuBoard[0].role, "Editor-in-Chief");
  assert.equal(izuBoard[1].name, "Chidi K. Ogonnaya, PhD");
  assert.equal(izuBoard[1].role, "Editor");

  // POLIS
  const polisBoard = getDefaultEditorialBoard("polis");
  assert.equal(polisBoard.length, 6, "Polis must have 6 board members");
  assert.equal(polisBoard[0].name, "Chidi K. Ogonnaya, PhD");
  assert.equal(polisBoard[0].role, "Editor-in-Chief");
  assert.equal(polisBoard[1].name, "Christian Nwadinihu, PhD");
  assert.equal(polisBoard[1].role, "Associate Editor");
  assert.ok(polisBoard.some((m) => m.name === "Bellarmine Nneji, PhD"));
  assert.ok(polisBoard.some((m) => m.name === "Ifeanyi Anyanwu, PhD"));
  assert.ok(polisBoard.some((m) => m.name === "Bernard Berm Assoh, PhD"));
  assert.ok(polisBoard.some((m) => m.name === "Francis Ofoegbu, PhD"));
});

test("Journal Metadata Fallback: buildJournalMetadataFromRecord preserves static rich data", () => {
  const minimalDbJournal = {
    slug: "cjmr",
    name: "Concrescence Journal of Multi-Disciplinary Research",
    shortName: "CJMR",
    description: null,
    institution: null,
    faculty: null,
    department: null,
  };

  const meta = buildJournalMetadataFromRecord(minimalDbJournal);
  assert.equal(
    meta.title,
    "Concrescence Journal of Multi-Disciplinary Research",
  );
  assert.equal(meta.shortName, "CJMR");
  assert.ok(
    meta.aimsAndScope.length > 20,
    "Must fall back to canonical aims and scope",
  );
  assert.ok(
    meta.subjectAreas && meta.subjectAreas.length >= 5,
    "Must fall back to canonical subject areas",
  );
  assert.ok(
    meta.articleTypes && meta.articleTypes.length >= 3,
    "Must fall back to canonical article types",
  );
  assert.equal(
    meta.contactEmail,
    "cojomure@gmail.com",
    "Must fall back to canonical contact email",
  );
  assert.equal(
    meta.contactPhone,
    "08085904192",
    "Must fall back to canonical contact phone",
  );
});
