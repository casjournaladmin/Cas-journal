import assert from "node:assert/strict";
import test from "node:test";
import {
  IZU_DEV_IDENTITIES,
  getDevIdentityById,
} from "../lib/auth/dev-identities";

import {
  createDirectArticleSubmission,
  DirectSubmissionError,
} from "../lib/submissions/direct-submission";
import {
  getAuthorSubmission,
  listAuthorSubmissions,
} from "../lib/submissions/data";

// Helper to create a valid minimal docx mock file in Node
function createMockDocxFile(filename = "test-manuscript.docx"): File {
  // PK zip magic header (0x50, 0x4B, 0x03, 0x04) required for docx
  const pkZipBytes = new Uint8Array([
    0x50,
    0x4b,
    0x03,
    0x04,
    0x14,
    0x00,
    0x06,
    0x00,
    0x08,
    0x00,
    0x00,
    0x00,
    ...new Array(100).fill(0x20),
  ]);
  const blob = new Blob([pkZipBytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  return new File([blob], filename, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

test("Dev Identities: getDevIdentityById accurately resolves development authors", () => {
  const authorOne = getDevIdentityById("00000000-0000-4000-a000-000000000001");
  assert.ok(authorOne, "Author One must resolve");
  assert.equal(authorOne?.displayName, "Author One");
  assert.equal(authorOne?.isActive, true);
  assert.ok(
    authorOne?.globalRoles.some((r) => r.role === "AUTHOR"),
    "Author One must have AUTHOR global role",
  );

  const authorTwo = getDevIdentityById("00000000-0000-4000-a000-000000000002");
  assert.ok(authorTwo, "Author Two must resolve");
  assert.equal(authorTwo?.displayName, "Author Two");
  assert.equal(authorTwo?.isActive, true);
  assert.ok(
    authorTwo?.globalRoles.some((r) => r.role === "AUTHOR"),
    "Author Two must have AUTHOR global role",
  );

  const unknown = getDevIdentityById("ffffffff-ffff-ffff-ffff-ffffffffffff");
  assert.equal(unknown, null, "Unknown ID must return null");
});

test("Direct Submission: Rejects inactive accounts for real non-dev IDs", async () => {
  const { prisma } = await import("../lib/db/prisma");
  const inactiveUserId = "00000000-0000-0000-0000-000000000099";

  // Create temporary inactive user in DB
  await prisma.user.upsert({
    where: { id: inactiveUserId },
    update: { isActive: false },
    create: {
      id: inactiveUserId,
      email: "test.inactive.author@example.com",
      displayName: "Inactive Test User",
      isActive: false,
    },
  });

  try {
    const file = createMockDocxFile();
    await assert.rejects(
      async () => {
        await createDirectArticleSubmission({
          authorId: inactiveUserId,
          journalSlug: "existentia",
          title: "Test Manuscript Title",
          abstract: "Valid abstract with sufficient text.",
          keywords: ["test", "economics"],
          authors: [
            {
              fullName: "Inactive Test User",
              email: "test.inactive.author@example.com",
              affiliation: "Test Dept",
              orcid: "",
              isCorrespondingAuthor: true,
            },
          ],
          file,
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof DirectSubmissionError);
        assert.equal(err.message, "Your account is not active.");
        return true;
      },
    );
  } finally {
    await prisma.user.delete({ where: { id: inactiveUserId } }).catch(() => {});
  }
});

test("Direct Submission: Rejects users without AUTHOR role", async () => {
  const { prisma } = await import("../lib/db/prisma");
  const nonAuthorUserId = "00000000-0000-0000-0000-000000000098";

  // Create temporary user with no roles
  await prisma.user.upsert({
    where: { id: nonAuthorUserId },
    update: { isActive: true },
    create: {
      id: nonAuthorUserId,
      email: "test.nonauthor@example.com",
      displayName: "Non-Author User",
      isActive: true,
    },
  });
  await prisma.userGlobalRole.deleteMany({
    where: { userId: nonAuthorUserId },
  });

  try {
    const file = createMockDocxFile();
    await assert.rejects(
      async () => {
        await createDirectArticleSubmission({
          authorId: nonAuthorUserId,
          journalSlug: "existentia",
          title: "Test Manuscript Title",
          abstract: "Valid abstract with sufficient text.",
          keywords: ["test", "economics"],
          authors: [
            {
              fullName: "Non-Author User",
              email: "test.nonauthor@example.com",
              affiliation: "Test Dept",
              orcid: "",
              isCorrespondingAuthor: true,
            },
          ],
          file,
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof DirectSubmissionError);
        assert.equal(err.message, "Only authors can submit manuscripts.");
        return true;
      },
    );
  } finally {
    await prisma.user
      .delete({ where: { id: nonAuthorUserId } })
      .catch(() => {});
  }
});

test("Direct Submission: Rejects unselected or invalid target journals", async () => {
  const file = createMockDocxFile();

  await assert.rejects(
    async () => {
      await createDirectArticleSubmission({
        authorId: IZU_DEV_IDENTITIES["author-two"].id,
        journalSlug: "",
        title: "Test Manuscript Title",
        abstract: "Valid abstract with sufficient text.",
        keywords: ["test"],
        authors: [
          {
            fullName: "Author Two",
            email: "author.two@izu.test",
            affiliation: "CAS",
            orcid: "",
            isCorrespondingAuthor: true,
          },
        ],
        file,
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof DirectSubmissionError);
      assert.equal(
        err.message,
        "Please select a target journal for your submission.",
      );
      return true;
    },
  );
});

test("Direct Submission & Isolation: Author Two submits valid manuscript and isolation is preserved", async () => {
  const { prisma } = await import("../lib/db/prisma");
  const authorTwoId = IZU_DEV_IDENTITIES["author-two"].id;
  const authorOneId = IZU_DEV_IDENTITIES["author-one"].id;
  const uniqueSuffix = Date.now().toString(36);
  const testTitle = `Decolonial Perspectives in Modern Pedagogy [Test ${uniqueSuffix}]`;

  const file = createMockDocxFile(`manuscript-${uniqueSuffix}.docx`);

  let createdSubmissionId: string | null = null;
  let createdStoredFileId: string | null = null;

  try {
    // 1. Author Two creates submission for 'existentia'
    const result = await createDirectArticleSubmission({
      authorId: authorTwoId,
      journalSlug: "existentia",
      title: testTitle,
      abstract:
        "This paper explores pedagogical frameworks in contemporary social sciences.",
      keywords: ["pedagogy", "decoloniality", "curriculum"],
      authors: [
        {
          fullName: "Author Two",
          email: "author.two@izu.test",
          affiliation: "CAS Critical Perspectives",
          orcid: "",
          isCorrespondingAuthor: true,
        },
      ],
      file,
    });

    assert.ok(result.submissionId, "Submission ID must be returned");
    createdSubmissionId = result.submissionId;

    // 2. Verify submission record in DB
    const submissionInDb = await prisma.submission.findUnique({
      where: { id: createdSubmissionId },
      include: {
        files: { include: { storedFile: true } },
        authors: true,
        request: true,
      },
    });

    assert.ok(submissionInDb, "Submission record must exist in DB");
    assert.equal(submissionInDb.ownerId, authorTwoId);
    assert.equal(submissionInDb.status, "SUBMITTED");
    assert.equal(submissionInDb.title, testTitle);
    assert.equal(submissionInDb.authors.length, 1);
    assert.equal(submissionInDb.authors[0].fullName, "Author Two");
    assert.equal(submissionInDb.authors[0].isCorrespondingAuthor, true);
    assert.ok(submissionInDb.request, "Linked submission request must exist");

    if (submissionInDb.files[0]?.storedFileId) {
      createdStoredFileId = submissionInDb.files[0].storedFileId;
    }

    // 3. Verify Author Two can access their own submission
    const authorTwoList = await listAuthorSubmissions(authorTwoId);
    const foundInAuthorTwo = authorTwoList.find(
      (s) => s.id === createdSubmissionId,
    );
    assert.ok(
      foundInAuthorTwo,
      "Author Two must see their newly created submission in their list",
    );

    const authorTwoDetail = await getAuthorSubmission(
      authorTwoId,
      createdSubmissionId,
    );
    assert.ok(
      authorTwoDetail,
      "Author Two must be able to load submission details",
    );
    assert.equal(authorTwoDetail.id, createdSubmissionId);

    // 4. CROSS-AUTHOR ISOLATION: Author One MUST NOT access Author Two's submission
    const authorOneList = await listAuthorSubmissions(authorOneId);
    const foundInAuthorOne = authorOneList.find(
      (s) => s.id === createdSubmissionId,
    );
    assert.equal(
      foundInAuthorOne,
      undefined,
      "Author One must NOT see Author Two's submission in their workspace",
    );

    const authorOneDetail = await getAuthorSubmission(
      authorOneId,
      createdSubmissionId,
    );
    assert.equal(
      authorOneDetail,
      null,
      "Author One must be denied access to Author Two's submission details",
    );

    // 5. Duplicate Submission Prevention: Same title and journal within 60s must be blocked
    await assert.rejects(
      async () => {
        await createDirectArticleSubmission({
          authorId: authorTwoId,
          journalSlug: "existentia",
          title: testTitle,
          abstract: "Duplicate attempt",
          keywords: ["duplicate"],
          authors: [
            {
              fullName: "Author Two",
              email: "author.two@izu.test",
              affiliation: "CAS",
              orcid: "",
              isCorrespondingAuthor: true,
            },
          ],
          file,
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof DirectSubmissionError);
        assert.ok(err.message.includes("was just submitted"));
        return true;
      },
    );
  } finally {
    // Isolated Cleanup: Ensure zero residual test data in live database
    if (createdSubmissionId) {
      await prisma.submissionRequest
        .deleteMany({ where: { submissionId: createdSubmissionId } })
        .catch(() => {});
      await prisma.submissionEvent
        .deleteMany({ where: { submissionId: createdSubmissionId } })
        .catch(() => {});
      await prisma.submissionVersion
        .deleteMany({ where: { submissionId: createdSubmissionId } })
        .catch(() => {});
      await prisma.submissionFile
        .deleteMany({ where: { submissionId: createdSubmissionId } })
        .catch(() => {});
      await prisma.submissionAuthor
        .deleteMany({ where: { submissionId: createdSubmissionId } })
        .catch(() => {});
      await prisma.submission
        .delete({ where: { id: createdSubmissionId } })
        .catch(() => {});
    }
    if (createdStoredFileId) {
      await prisma.storedFile
        .delete({ where: { id: createdStoredFileId } })
        .catch(() => {});
    }
  }
});

test("Direct Submission: Author One submits to Izu journal and cleans up completely", async () => {
  const { prisma } = await import("../lib/db/prisma");
  const authorOneId = IZU_DEV_IDENTITIES["author-one"].id;
  const uniqueSuffix = Date.now().toString(36);
  const testTitle = `Critical Epistemology in Izu Studies [Test ${uniqueSuffix}]`;

  const file = createMockDocxFile(`manuscript-author-one-${uniqueSuffix}.docx`);

  let createdSubmissionId: string | null = null;
  let createdStoredFileId: string | null = null;

  try {
    const result = await createDirectArticleSubmission({
      authorId: authorOneId,
      journalSlug: "izu",
      title: testTitle,
      abstract: "Critical analysis of epistemological paradigms in Izu.",
      keywords: ["epistemology", "izu", "philosophy"],
      authors: [
        {
          fullName: "Author One",
          email: "author.one@izu.test",
          affiliation: "CAS Critical Perspectives",
          orcid: "",
          isCorrespondingAuthor: true,
        },
      ],
      file,
    });

    assert.ok(
      result.submissionId,
      "Submission ID must be returned for Author One",
    );
    createdSubmissionId = result.submissionId;

    const submissionInDb = await prisma.submission.findUnique({
      where: { id: createdSubmissionId },
      include: { files: true },
    });
    assert.ok(submissionInDb);
    assert.equal(submissionInDb.ownerId, authorOneId);
    assert.equal(submissionInDb.status, "SUBMITTED");

    if (submissionInDb.files[0]?.storedFileId) {
      createdStoredFileId = submissionInDb.files[0].storedFileId;
    }

    const authorOneList = await listAuthorSubmissions(authorOneId);
    assert.ok(authorOneList.some((s) => s.id === createdSubmissionId));
  } finally {
    if (createdSubmissionId) {
      await prisma.submissionRequest
        .deleteMany({ where: { submissionId: createdSubmissionId } })
        .catch(() => {});
      await prisma.submissionEvent
        .deleteMany({ where: { submissionId: createdSubmissionId } })
        .catch(() => {});
      await prisma.submissionVersion
        .deleteMany({ where: { submissionId: createdSubmissionId } })
        .catch(() => {});
      await prisma.submissionFile
        .deleteMany({ where: { submissionId: createdSubmissionId } })
        .catch(() => {});
      await prisma.submissionAuthor
        .deleteMany({ where: { submissionId: createdSubmissionId } })
        .catch(() => {});
      await prisma.submission
        .delete({ where: { id: createdSubmissionId } })
        .catch(() => {});
    }
    if (createdStoredFileId) {
      await prisma.storedFile
        .delete({ where: { id: createdStoredFileId } })
        .catch(() => {});
    }
  }
});
