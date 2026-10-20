import assert from "node:assert/strict";
import test from "node:test";
import {
  recordRevision,
  EditorialMutationError,
} from "../lib/editorial/mutations";
import {
  matchesUploadSignature,
  validateUploadFile,
} from "../lib/submissions/validation";
import {
  createSubmissionObjectPath,
  storageBuckets,
} from "../lib/storage/paths";

test("correction-submission: recordRevision rejects empty author note", async () => {
  await assert.rejects(
    async () => {
      await recordRevision({
        ownerId: "00000000-0000-4000-a000-000000000001",
        submissionId: "sub-123",
        authorNote: "   ",
        manuscript: {
          bucket: storageBuckets.privateAcademicFiles,
          objectPath: "submissions/journal-1/sub-123/file.pdf",
          originalFileName: "file.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
        },
      });
    },
    (err: unknown) => {
      assert(err instanceof EditorialMutationError);
      assert.equal(
        err.message,
        "Add a short note explaining the changes in this version.",
      );
      return true;
    },
  );
});

test("correction-submission: file upload validation accepts valid PDF and DOCX", () => {
  // Valid PDF header (%PDF-1.5)
  const pdfBytes = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35,
  ]);
  assert.equal(matchesUploadSignature("application/pdf", pdfBytes), true);

  // Valid DOCX / ZIP header (PK\x03\x04)
  const docxBytes = new Uint8Array([
    0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00,
  ]);
  assert.equal(
    matchesUploadSignature(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      docxBytes,
    ),
    true,
  );

  // Invalid binary header
  const invalidBytes = new Uint8Array([
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  assert.equal(matchesUploadSignature("application/pdf", invalidBytes), false);

  // Oversized file (> 20MB)
  const oversizedFile = {
    name: "large.pdf",
    size: 25 * 1024 * 1024,
    type: "application/pdf",
  } as unknown as File;
  assert.equal(
    validateUploadFile(oversizedFile),
    "Choose a file no larger than 20 MB.",
  );
});

test("correction-submission: createSubmissionObjectPath formats path with journal and submission id", () => {
  const path = createSubmissionObjectPath({
    journalId: "journal-izu-1",
    submissionId: "sub-test-99",
    originalFileName: "my revised paper.pdf",
  });

  assert(path.startsWith("journal/journal-izu-1/submission/sub-test-99/"));
  assert(path.endsWith(".pdf"));
  // Should sanitize whitespace/special characters
  assert(!path.includes(" "));
});
