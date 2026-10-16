import { createAdminClient } from "@/lib/supabase/admin";

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export function validateAnnouncementImageFile(
  file: { size: number; type?: string } | null | undefined,
): { valid: boolean; error?: string } {
  if (!file || file.size === 0) {
    return { valid: true };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: "Image exceeds 15MB limit. Please upload an image under 15MB.",
    };
  }

  const mimeType = file.type?.toLowerCase();
  if (mimeType && !ALLOWED_IMAGE_TYPES.has(mimeType)) {
    return {
      valid: false,
      error:
        "Unsupported image format. Please upload a JPG, PNG, WEBP, or GIF image.",
    };
  }

  return { valid: true };
}

export async function uploadAnnouncementImage(
  imageFile: File,
): Promise<{ url?: string; error?: string }> {
  const validation = validateAnnouncementImageFile(imageFile);
  if (!validation.valid) {
    return { error: validation.error };
  }

  try {
    const supabase = createAdminClient();
    const imgArrayBuffer = await imageFile.arrayBuffer();
    const imgBuffer = Buffer.from(imgArrayBuffer);
    const imgFileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const imgPath = `announcements/${Date.now()}_${imgFileName}`;

    const mimeType = imageFile.type?.toLowerCase() || "image/jpeg";
    const { error: uploadError } = await supabase.storage
      .from("published-articles")
      .upload(imgPath, imgBuffer, {
        contentType: mimeType,
        upsert: true,
        duplex: "half",
      });

    if (uploadError) {
      console.error("Failed to upload announcement image:", uploadError);
      return {
        error: `Failed to upload announcement image: ${uploadError.message}`,
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from("published-articles")
      .getPublicUrl(imgPath);

    return { url: publicUrlData.publicUrl };
  } catch (err) {
    console.error("Storage upload exception:", err);
    return {
      error: `Storage upload error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
