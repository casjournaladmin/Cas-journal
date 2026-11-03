/**
 * Pure policy, validation rules, and path builders for direct-to-storage publishing uploads.
 * Free of Next.js server-only / navigation dependencies so it can be safely imported
 * in client components, server actions, and unit test suites.
 */

export const MAX_MANUSCRIPT_FILE_SIZE_BYTES = 35 * 1024 * 1024; // 35 MB
export const MAX_COVER_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MANUSCRIPT_EXTENSIONS = ["pdf", "docx", "doc"] as const;
export const ALLOWED_COVER_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "pdf",
] as const;

export type PublishingUploadCategory = "manuscript" | "cover";

export type PublishingUploadAuthorizationInput = {
  journalSlug: string;
  originalFileName: string;
  sizeBytes: number;
  mimeType?: string;
  category: PublishingUploadCategory;
};

export type PublishingUploadAuthorizationResult = {
  signedUrl: string;
  token: string;
  objectPath: string;
  bucket: string;
  maxSizeBytes: number;
};

export function sanitizePublishingFileName(name: string): string {
  const clean = name
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
  return clean || "file.pdf";
}

export function getPublishingFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

export function validatePublishingUploadInput(input: {
  category: PublishingUploadCategory;
  originalFileName: string;
  sizeBytes: number;
}): { maxSizeBytes: number; extension: string } {
  const maxSizeBytes =
    input.category === "manuscript"
      ? MAX_MANUSCRIPT_FILE_SIZE_BYTES
      : MAX_COVER_IMAGE_FILE_SIZE_BYTES;

  if (input.sizeBytes <= 0) {
    throw new Error("File is empty.");
  }

  if (input.sizeBytes > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    throw new Error(
      `File exceeds maximum permitted size of ${maxMb} MB. Please optimize or compress the file before uploading.`,
    );
  }

  const ext = getPublishingFileExtension(input.originalFileName);

  if (input.category === "manuscript") {
    if (
      !ALLOWED_MANUSCRIPT_EXTENSIONS.includes(
        ext as (typeof ALLOWED_MANUSCRIPT_EXTENSIONS)[number],
      )
    ) {
      throw new Error(
        "Only PDF and DOCX files are permitted for manuscript production files.",
      );
    }
  } else {
    if (
      !ALLOWED_COVER_EXTENSIONS.includes(
        ext as (typeof ALLOWED_COVER_EXTENSIONS)[number],
      )
    ) {
      throw new Error("Cover images must be JPG, PNG, WEBP, or PDF.");
    }
  }

  return { maxSizeBytes, extension: ext };
}

export function buildPublishingStoragePath(input: {
  category: PublishingUploadCategory;
  journalSlug: string;
  originalFileName: string;
  timestamp?: number;
}): { bucket: string; objectPath: string } {
  const cleanName = sanitizePublishingFileName(input.originalFileName);
  const time = input.timestamp ?? Date.now();
  const folder =
    input.category === "manuscript"
      ? `published-legacy/${input.journalSlug}`
      : `published-covers/${input.journalSlug}`;
  return {
    bucket: "published-articles",
    objectPath: `${folder}/${time}_${cleanName}`,
  };
}

export function validatePublishingStorageObjectPath(input: {
  bucket: string;
  objectPath: string;
  expectedJournalSlug: string;
  category: PublishingUploadCategory;
}): { folder: string; fileName: string } {
  if (input.bucket !== "published-articles") {
    throw new Error("Invalid storage bucket.");
  }

  // Prevent path traversal
  if (input.objectPath.includes("..") || input.objectPath.includes("//")) {
    throw new Error("Invalid storage path.");
  }

  const expectedPrefix =
    input.category === "manuscript"
      ? `published-legacy/${input.expectedJournalSlug}/`
      : `published-covers/${input.expectedJournalSlug}/`;

  if (!input.objectPath.startsWith(expectedPrefix)) {
    throw new Error("Storage object path does not match target journal.");
  }

  const pathParts = input.objectPath.split("/");
  const fileName = pathParts.pop();
  const folder = pathParts.join("/");

  if (!fileName) {
    throw new Error("Invalid object path.");
  }

  return { folder, fileName };
}
