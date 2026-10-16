"use server";

import { getCurrentUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementActive,
  updateAnnouncement,
  type AnnouncementCategory,
  type Announcement,
} from "@/lib/editorial/announcements-store";
import { uploadAnnouncementImage } from "@/lib/editorial/announcement-images";

export type AdminAnnouncementActionState = {
  success?: boolean;
  error?: string;
  announcement?: Announcement;
  isActive?: boolean;
};

export async function createAnnouncementAction(
  _prevState: AdminAnnouncementActionState,
  formData: FormData,
): Promise<AdminAnnouncementActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Authentication required." };

  const title = formData.get("title")?.toString() ?? "";
  const category = (formData.get("category")?.toString() ??
    "GENERAL") as AnnouncementCategory;
  const targetJournal = formData.get("targetJournal")?.toString() ?? "ALL";
  const content = formData.get("content")?.toString() ?? "";
  const expiresAt = formData.get("expiresAt")?.toString() ?? "";
  const isActive =
    formData.get("isActive") === "true" || formData.get("isActive") === "on";

  let imageUrl: string | undefined = undefined;
  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    const uploadResult = await uploadAnnouncementImage(imageFile);
    if (uploadResult.error) {
      return { error: uploadResult.error };
    }
    imageUrl = uploadResult.url;
  }

  return createAnnouncement({
    title,
    category,
    targetJournal,
    content,
    imageUrl,
    expiresAt: expiresAt || undefined,
    isActive,
    actor: user,
  });
}

export async function updateAnnouncementAction(
  _prevState: AdminAnnouncementActionState,
  formData: FormData,
): Promise<AdminAnnouncementActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Authentication required." };

  const announcementId = formData.get("announcementId")?.toString() ?? "";
  const title = formData.get("title")?.toString() ?? "";
  const category = (formData.get("category")?.toString() ??
    "GENERAL") as AnnouncementCategory;
  const targetJournal = formData.get("targetJournal")?.toString() ?? "ALL";
  const content = formData.get("content")?.toString() ?? "";
  const expiresAt = formData.get("expiresAt")?.toString() ?? "";
  const isActive =
    formData.get("isActive") === "true" || formData.get("isActive") === "on";

  let imageUrl: string | undefined = undefined;
  const removeImage = formData.get("removeImage") === "true";
  const imageFile = formData.get("image") as File | null;

  if (removeImage) {
    imageUrl = "";
  } else if (imageFile && imageFile.size > 0) {
    const uploadResult = await uploadAnnouncementImage(imageFile);
    if (uploadResult.error) {
      return { error: uploadResult.error };
    }
    imageUrl = uploadResult.url;
  }

  return updateAnnouncement({
    announcementId,
    title,
    category,
    targetJournal,
    content,
    imageUrl,
    expiresAt: expiresAt || undefined,
    isActive,
    actor: user,
  });
}

export async function deleteAnnouncementAction(
  _prevState: AdminAnnouncementActionState,
  formData: FormData,
): Promise<AdminAnnouncementActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Authentication required." };

  const announcementId = formData.get("announcementId")?.toString() ?? "";

  // Attempt to remove binary image from storage bucket if present
  try {
    const existing = await prisma.announcement.findUnique({
      where: { id: announcementId },
      select: { imageUrl: true },
    });
    if (
      existing?.imageUrl &&
      existing.imageUrl.includes("/published-articles/")
    ) {
      const match = existing.imageUrl.match(
        /published-articles\/(announcements\/[^?#]+)/,
      );
      if (match?.[1]) {
        const supabase = createAdminClient();
        await supabase.storage.from("published-articles").remove([match[1]]);
      }
    }
  } catch (cleanupErr) {
    console.warn(
      "Storage cleanup failed on announcement deletion:",
      cleanupErr,
    );
  }

  return deleteAnnouncement({
    announcementId,
    actor: user,
  });
}

export async function toggleAnnouncementActiveAction(
  _prevState: AdminAnnouncementActionState,
  formData: FormData,
): Promise<AdminAnnouncementActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Authentication required." };

  const announcementId = formData.get("announcementId")?.toString() ?? "";

  return toggleAnnouncementActive({
    announcementId,
    actor: user,
  });
}
