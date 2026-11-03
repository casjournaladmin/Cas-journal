import "server-only";

import { requireApplicationArea } from "@/lib/auth/authorization";
import { isSuperAdmin, hasJournalRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPublishingStoragePath,
  validatePublishingStorageObjectPath,
  validatePublishingUploadInput,
  type PublishingUploadAuthorizationInput,
  type PublishingUploadAuthorizationResult,
  type PublishingUploadCategory,
} from "./publishing-upload-policy";

export * from "./publishing-upload-policy";

/**
 * Server-authorizes a direct upload to Supabase Storage for publication files.
 * Enforces role checks, journal scoping, allowed MIME types, and size caps.
 */
export async function requestPublishingUploadUrl(
  input: PublishingUploadAuthorizationInput,
): Promise<PublishingUploadAuthorizationResult> {
  const user = await requireApplicationArea("admin");

  const journal = await prisma.journal.findUnique({
    where: { slug: input.journalSlug },
    select: { id: true, slug: true, isActive: true },
  });

  if (!journal || !journal.isActive) {
    throw new Error("Target journal not found or inactive.");
  }

  const isSuper = isSuperAdmin(user);
  const isJournalAdmin = hasJournalRole(user, journal.id, "JOURNAL_ADMIN");

  if (!isSuper && !isJournalAdmin) {
    throw new Error(
      "You are not authorized to upload content for this journal.",
    );
  }

  const { maxSizeBytes } = validatePublishingUploadInput({
    category: input.category,
    originalFileName: input.originalFileName,
    sizeBytes: input.sizeBytes,
  });

  const { bucket, objectPath } = buildPublishingStoragePath({
    category: input.category,
    journalSlug: journal.slug,
    originalFileName: input.originalFileName,
  });

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(objectPath, { upsert: false });

  if (error || !data) {
    throw new Error(
      `Failed to generate upload authorization: ${error?.message || "Storage error"}`,
    );
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    objectPath,
    bucket,
    maxSizeBytes,
  };
}

/**
 * Validates that an object was successfully uploaded to Supabase Storage,
 * belongs to the expected journal folder, and conforms to security & size boundaries.
 */
export async function verifyUploadedPublishingObject(input: {
  bucket: string;
  objectPath: string;
  expectedJournalSlug: string;
  category: PublishingUploadCategory;
}): Promise<{ sizeBytes: number; mimeType: string }> {
  const { folder, fileName } = validatePublishingStorageObjectPath(input);

  const supabase = createAdminClient();
  const { data: list, error: listError } = await supabase.storage
    .from(input.bucket)
    .list(folder, { search: fileName, limit: 10 });

  if (listError) {
    throw new Error(`Failed to verify upload in storage: ${listError.message}`);
  }

  const match = list?.find((item) => item.name === fileName);
  if (!match) {
    throw new Error(
      "Uploaded file was not found in storage. Please try uploading again.",
    );
  }

  const size = match.metadata?.size ?? 0;
  const { maxSizeBytes } = validatePublishingUploadInput({
    category: input.category,
    originalFileName: fileName,
    sizeBytes: size,
  });

  if (size <= 0) {
    throw new Error("Uploaded file in storage is empty.");
  }

  if (size > maxSizeBytes) {
    throw new Error(
      `Uploaded file exceeds the maximum allowed size of ${maxSizeBytes} bytes.`,
    );
  }

  const mimeType =
    match.metadata?.mimetype ||
    (input.category === "manuscript" ? "application/pdf" : "image/jpeg");

  return {
    sizeBytes: size,
    mimeType,
  };
}
