import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/db/prisma";
import { deleteManuscriptSubmission } from "@/lib/editorial/mutations";

test("Manuscript Deletion: complete relationship graph deletion with review rounds and requests", async () => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // 1. Create isolated test fixtures for Journal, Super Admin, and Author
  const journal = await prisma.journal.create({
    data: {
      name: `CAS Deletion Integrity Test Journal ${uniqueSuffix}`,
      slug: `cas-del-test-${uniqueSuffix}`,
      shortName: "CDTJ",
      isActive: true,
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: `superadmin-del-${uniqueSuffix}@example.com`,
      displayName: "Deletion Test Super Admin",
      isActive: true,
      globalRoles: {
        create: [{ role: "SUPER_ADMIN" }, { role: "AUTHOR" }],
      },
    },
  });

  const author = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: `author-del-${uniqueSuffix}@example.com`,
      displayName: "Deletion Test Author",
      isActive: true,
      globalRoles: {
        create: [{ role: "AUTHOR" }],
      },
    },
  });

  let requestId: string | null = null;
  let submissionId: string | null = null;
  let storedFileId: string | null = null;

  try {
    // 2. Create a test StoredFile
    const storedFile = await prisma.storedFile.create({
      data: {
        bucket: "academic-private",
        objectPath: `test-manuscripts/test-${uniqueSuffix}.docx`,
        originalFileName: "test-manuscript.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sizeBytes: BigInt(1024),
        uploaderId: superAdmin.id,
      },
    });
    storedFileId = storedFile.id;

    // 3. Create a test Submission with complete graph (authors, versions, review round, assignment, request)
    const submission = await prisma.submission.create({
      data: {
        journalId: journal.id,
        ownerId: author.id,
        title: "Integrity Test Manuscript for Deletion",
        abstract: "Test abstract for deletion audit.",
        status: "UNDER_REVIEW",
        authors: {
          create: {
            fullName: "Dr. Deletion Test Author",
            position: 1,
            isCorrespondingAuthor: true,
          },
        },
        manuscriptVersions: {
          create: {
            versionNumber: 1,
            kind: "ORIGINAL",
            manuscriptStoredFileId: storedFile.id,
          },
        },
      },
      include: {
        manuscriptVersions: true,
      },
    });
    submissionId = submission.id;

    const version = submission.manuscriptVersions[0];
    assert.ok(version, "Version should be created");

    // Create review round attached to this version
    const reviewRound = await prisma.reviewRound.create({
      data: {
        submissionId: submission.id,
        submissionVersionId: version.id,
        roundNumber: 1,
        status: "ACTIVE",
      },
    });

    // Create review assignment
    const assignment = await prisma.reviewAssignment.create({
      data: {
        reviewRoundId: reviewRound.id,
        editorId: superAdmin.id,
        status: "IN_REVIEW",
      },
    });

    // Create submission request linked to this submission
    const request = await prisma.submissionRequest.create({
      data: {
        journalId: journal.id,
        authorId: author.id,
        status: "MANUSCRIPT_SUBMITTED",
        submissionId: submission.id,
      },
    });
    requestId = request.id;

    // 4. Verify everything exists in DB before deletion
    const preCheckSubmission = await prisma.submission.findUnique({
      where: { id: submission.id },
    });
    assert.ok(preCheckSubmission, "Submission must exist before delete");

    const preCheckRound = await prisma.reviewRound.findUnique({
      where: { id: reviewRound.id },
    });
    assert.ok(preCheckRound, "Review round must exist before delete");

    // 5. Execute deleteManuscriptSubmission
    const deleteResult = await deleteManuscriptSubmission({
      adminId: superAdmin.id,
      submissionId: submission.id,
    });

    assert.equal(deleteResult.success, true);
    assert.equal(deleteResult.journalSlug, journal.slug);

    // 6. Verify post-deletion state in PostgreSQL
    const postCheckSubmission = await prisma.submission.findUnique({
      where: { id: submission.id },
    });
    assert.equal(postCheckSubmission, null, "Submission must be deleted");

    const postCheckRound = await prisma.reviewRound.findUnique({
      where: { id: reviewRound.id },
    });
    assert.equal(
      postCheckRound,
      null,
      "Review round must be deleted via cascade",
    );

    const postCheckAssignment = await prisma.reviewAssignment.findUnique({
      where: { id: assignment.id },
    });
    assert.equal(
      postCheckAssignment,
      null,
      "Review assignment must be deleted via cascade",
    );

    const postCheckVersion = await prisma.submissionVersion.findUnique({
      where: { id: version.id },
    });
    assert.equal(
      postCheckVersion,
      null,
      "Submission version must be deleted via cascade",
    );

    // 7. Verify StoredFile record was cleaned up
    const postCheckStoredFile = await prisma.storedFile.findUnique({
      where: { id: storedFile.id },
    });
    assert.equal(
      postCheckStoredFile,
      null,
      "Associated StoredFile must be deleted",
    );

    // 8. Verify SubmissionRequest was safely unlinked and status reset
    const postCheckRequest = await prisma.submissionRequest.findUnique({
      where: { id: request.id },
    });
    assert.ok(postCheckRequest, "SubmissionRequest should survive deletion");
    assert.equal(
      postCheckRequest.submissionId,
      null,
      "Request must be unlinked from submission",
    );
    assert.equal(
      postCheckRequest.status,
      "SUBMISSION_ENABLED",
      "Request status must reset to SUBMISSION_ENABLED",
    );
  } finally {
    if (requestId) {
      await prisma.submissionRequest
        .delete({ where: { id: requestId } })
        .catch(() => {});
    }
    if (submissionId) {
      await prisma.submission
        .delete({ where: { id: submissionId } })
        .catch(() => {});
    }
    if (storedFileId) {
      await prisma.storedFile
        .delete({ where: { id: storedFileId } })
        .catch(() => {});
    }
    await prisma.user.delete({ where: { id: author.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: superAdmin.id } }).catch(() => {});
    await prisma.journal.delete({ where: { id: journal.id } }).catch(() => {});
  }
});
