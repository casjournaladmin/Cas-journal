import assert from "node:assert/strict";
import test from "node:test";

import {
  ALLOWED_COVER_EXTENSIONS,
  ALLOWED_MANUSCRIPT_EXTENSIONS,
  buildPublishingStoragePath,
  getPublishingFileExtension,
  MAX_COVER_IMAGE_FILE_SIZE_BYTES,
  MAX_MANUSCRIPT_FILE_SIZE_BYTES,
  sanitizePublishingFileName,
  validatePublishingStorageObjectPath,
  validatePublishingUploadInput,
} from "@/lib/storage/publishing-upload-policy";

test("publishing upload constants enforce strict size and type bounds", () => {
  // Max manuscript size is 35 MB
  assert.equal(MAX_MANUSCRIPT_FILE_SIZE_BYTES, 35 * 1024 * 1024);
  // Max cover size is 10 MB
  assert.equal(MAX_COVER_IMAGE_FILE_SIZE_BYTES, 10 * 1024 * 1024);

  // Allowed extensions check
  assert.deepEqual([...ALLOWED_MANUSCRIPT_EXTENSIONS], ["pdf", "docx", "doc"]);
  assert.deepEqual(
    [...ALLOWED_COVER_EXTENSIONS],
    ["jpg", "jpeg", "png", "webp", "pdf"],
  );
});

test("sanitizePublishingFileName sanitizes illegal characters and preserves extension", () => {
  assert.equal(
    sanitizePublishingFileName("my dangerous & file #1.pdf"),
    "my_dangerous_file_1.pdf",
  );
  assert.equal(sanitizePublishingFileName("///"), "file.pdf");
  assert.equal(
    sanitizePublishingFileName("normal-name.pdf"),
    "normal-name.pdf",
  );
});

test("getPublishingFileExtension extracts normalized extension", () => {
  assert.equal(getPublishingFileExtension("MANUSCRIPT.PDF"), "pdf");
  assert.equal(getPublishingFileExtension("cover.JPEG"), "jpeg");
  assert.equal(getPublishingFileExtension("noextension"), "noextension");
});

test("validatePublishingUploadInput rejects empty and oversized files", () => {
  // Empty manuscript
  assert.throws(
    () => {
      validatePublishingUploadInput({
        category: "manuscript",
        originalFileName: "paper.pdf",
        sizeBytes: 0,
      });
    },
    { message: "File is empty." },
  );

  // Oversized manuscript (> 35 MB)
  assert.throws(() => {
    validatePublishingUploadInput({
      category: "manuscript",
      originalFileName: "paper.pdf",
      sizeBytes: 36 * 1024 * 1024,
    });
  }, /File exceeds maximum permitted size of 35 MB/);

  // Oversized cover (> 10 MB)
  assert.throws(() => {
    validatePublishingUploadInput({
      category: "cover",
      originalFileName: "cover.jpg",
      sizeBytes: 11 * 1024 * 1024,
    });
  }, /File exceeds maximum permitted size of 10 MB/);
});

test("validatePublishingUploadInput rejects invalid file extensions", () => {
  // Disallowed manuscript extension
  assert.throws(
    () => {
      validatePublishingUploadInput({
        category: "manuscript",
        originalFileName: "script.sh",
        sizeBytes: 1024,
      });
    },
    {
      message:
        "Only PDF and DOCX files are permitted for manuscript production files.",
    },
  );

  assert.throws(
    () => {
      validatePublishingUploadInput({
        category: "manuscript",
        originalFileName: "malware.exe",
        sizeBytes: 1024,
      });
    },
    {
      message:
        "Only PDF and DOCX files are permitted for manuscript production files.",
    },
  );

  // Disallowed cover extension
  assert.throws(
    () => {
      validatePublishingUploadInput({
        category: "cover",
        originalFileName: "script.py",
        sizeBytes: 1024,
      });
    },
    { message: "Cover images must be JPG, PNG, WEBP, or PDF." },
  );
});

test("validatePublishingUploadInput accepts valid files up to size limits", () => {
  // 35 MB PDF manuscript
  const manuscriptResult = validatePublishingUploadInput({
    category: "manuscript",
    originalFileName: "paper.pdf",
    sizeBytes: 35 * 1024 * 1024,
  });
  assert.equal(manuscriptResult.maxSizeBytes, 35 * 1024 * 1024);
  assert.equal(manuscriptResult.extension, "pdf");

  // 10 MB JPG cover image
  const coverResult = validatePublishingUploadInput({
    category: "cover",
    originalFileName: "cover.jpg",
    sizeBytes: 10 * 1024 * 1024,
  });
  assert.equal(coverResult.maxSizeBytes, 10 * 1024 * 1024);
  assert.equal(coverResult.extension, "jpg");
});

test("buildPublishingStoragePath constructs deterministic journal-scoped paths", () => {
  const timestamp = 1730628000000;
  const manuscript = buildPublishingStoragePath({
    category: "manuscript",
    journalSlug: "cjmr",
    originalFileName: "Vol 3 Paper.pdf",
    timestamp,
  });
  assert.equal(manuscript.bucket, "published-articles");
  assert.equal(
    manuscript.objectPath,
    "published-legacy/cjmr/1730628000000_Vol_3_Paper.pdf",
  );

  const cover = buildPublishingStoragePath({
    category: "cover",
    journalSlug: "cjmr",
    originalFileName: "Cover Art.png",
    timestamp,
  });
  assert.equal(cover.bucket, "published-articles");
  assert.equal(
    cover.objectPath,
    "published-covers/cjmr/1730628000000_Cover_Art.png",
  );
});

test("validatePublishingStorageObjectPath rejects invalid bucket", () => {
  assert.throws(
    () => {
      validatePublishingStorageObjectPath({
        bucket: "private-manuscripts",
        objectPath: "published-legacy/cjmr/test.pdf",
        expectedJournalSlug: "cjmr",
        category: "manuscript",
      });
    },
    { message: "Invalid storage bucket." },
  );
});

test("validatePublishingStorageObjectPath rejects path traversal sequences", () => {
  assert.throws(
    () => {
      validatePublishingStorageObjectPath({
        bucket: "published-articles",
        objectPath: "published-legacy/cjmr/../secrets.pdf",
        expectedJournalSlug: "cjmr",
        category: "manuscript",
      });
    },
    { message: "Invalid storage path." },
  );

  assert.throws(
    () => {
      validatePublishingStorageObjectPath({
        bucket: "published-articles",
        objectPath: "published-legacy/cjmr//secrets.pdf",
        expectedJournalSlug: "cjmr",
        category: "manuscript",
      });
    },
    { message: "Invalid storage path." },
  );
});

test("validatePublishingStorageObjectPath rejects cross-journal path mismatch", () => {
  assert.throws(
    () => {
      validatePublishingStorageObjectPath({
        bucket: "published-articles",
        objectPath: "published-legacy/other-journal/12345_paper.pdf",
        expectedJournalSlug: "cjmr",
        category: "manuscript",
      });
    },
    { message: "Storage object path does not match target journal." },
  );

  assert.throws(
    () => {
      validatePublishingStorageObjectPath({
        bucket: "published-articles",
        objectPath: "published-covers/other-journal/12345_cover.jpg",
        expectedJournalSlug: "cjmr",
        category: "cover",
      });
    },
    { message: "Storage object path does not match target journal." },
  );
});

test("validatePublishingStorageObjectPath decomposes valid object paths into folder and file", () => {
  const result = validatePublishingStorageObjectPath({
    bucket: "published-articles",
    objectPath: "published-legacy/cjmr/12345_paper.pdf",
    expectedJournalSlug: "cjmr",
    category: "manuscript",
  });
  assert.equal(result.folder, "published-legacy/cjmr");
  assert.equal(result.fileName, "12345_paper.pdf");
});
