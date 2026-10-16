import "server-only";

import { revalidatePath } from "next/cache";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { assertSafeDatabaseForDestructiveOps } from "@/lib/db/guard";
import { prisma } from "@/lib/db/prisma";
import { resolveCanonicalJournalSlug } from "@/lib/editorial/editorial-board-data";
import { isAuthorizedForJournal } from "@/lib/editorial/editorial-board-store";

export type AnnouncementCategory =
  "CALL_FOR_PAPERS" | "SPECIAL_ISSUE" | "EDITORIAL_UPDATE" | "GENERAL";

export interface Announcement {
  id: string;
  slug: string;
  title: string;
  category: AnnouncementCategory;
  targetJournal: string; // "ALL" | "njcp" | "ajsbs" | "njsr" | "gjcsr"
  content: string;
  imageUrl?: string;
  publishedAt: string; // ISO string
  expiresAt?: string; // ISO string
  isActive: boolean;
  authorName: string;
}

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-call-for-papers-2026",
    slug: "call-for-papers-2026-volume-11",
    title: "Call for Papers: 2026 Volume 11 Manuscript Submissions Now Open",
    category: "CALL_FOR_PAPERS",
    targetJournal: "ALL",
    content:
      "The Faculty of Social Sciences Journals (NJCP, AJSBS, NJSR, GJCSR) invite original empirical research papers, theoretical reviews, and methodological contributions for the 2026 publication volumes. Submissions undergo rapid, double-blind peer review with permanent CrossRef DOIs and Google Scholar indexing.",
    publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    isActive: true,
    authorName: "Editorial Directorate",
  },
  {
    id: "ann-special-issue-ajsbs",
    slug: "special-issue-african-social-behavioural-resilience",
    title:
      "Special Issue: African Social & Behavioural Resilience in the 21st Century",
    category: "SPECIAL_ISSUE",
    targetJournal: "ajsbs",
    content:
      "The African Journal of Social and Behavioural Sciences (AJSBS) announces a special themed section examining community resilience, institutional dynamics, and behavioral adaptations in Sub-Saharan Africa. Manuscripts formatted in APA 7th edition are welcomed from scholars across the continent and diaspora.",
    publishedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    isActive: true,
    authorName: "Prof. Ikechukwu J.D. Nwosu",
  },
  {
    id: "ann-review-speed-njcp",
    slug: "peer-review-turnaround-target",
    title: "Editorial Notice: 21-Day Expedited First-Decision Benchmark",
    category: "EDITORIAL_UPDATE",
    targetJournal: "njcp",
    content:
      "The Nigerian Journal of Contemporary Psychology (NJCP) editorial board has instituted a 21-day review benchmark for initial editorial decisions on submitted manuscripts. Authors can track progress live through their Author Operating Portal.",
    publishedAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    isActive: true,
    authorName: "Prof Nkwam C. Uwaoma",
  },
];

function formatAnnouncement(raw: {
  id: string;
  slug: string;
  title: string;
  category: string;
  targetJournal: string;
  content: string;
  imageUrl: string | null;
  publishedAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
  authorName: string;
}): Announcement {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    category: raw.category as AnnouncementCategory,
    targetJournal: raw.targetJournal,
    content: raw.content,
    imageUrl: raw.imageUrl || undefined,
    publishedAt: raw.publishedAt.toISOString(),
    expiresAt: raw.expiresAt ? raw.expiresAt.toISOString() : undefined,
    isActive: raw.isActive,
    authorName: raw.authorName,
  };
}

export async function resetAnnouncements(): Promise<void> {
  assertSafeDatabaseForDestructiveOps("resetAnnouncements");
  await prisma.announcement.deleteMany({});
  for (const a of DEFAULT_ANNOUNCEMENTS) {
    await prisma.announcement.create({
      data: {
        id: a.id,
        slug: a.slug,
        title: a.title,
        category: a.category,
        targetJournal: a.targetJournal,
        content: a.content,
        imageUrl: a.imageUrl || null,
        publishedAt: new Date(a.publishedAt),
        expiresAt: a.expiresAt ? new Date(a.expiresAt) : null,
        isActive: a.isActive,
        authorName: a.authorName,
      },
    });
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeRevalidate() {
  try {
    revalidatePath("/");
    revalidatePath("/announcements");
    revalidatePath("/admin/announcements");
  } catch {
    // Gracefully ignore outside Next.js request context (e.g. CLI/unit tests)
  }
}

export async function getPublicAnnouncements(
  journalSlug?: string,
): Promise<Announcement[]> {
  const now = new Date();
  const canonical =
    journalSlug && journalSlug !== "ALL"
      ? resolveCanonicalJournalSlug(journalSlug)
      : null;

  const records = await prisma.announcement.findMany({
    where: {
      isActive: true,
      ...(canonical ? { targetJournal: { in: ["ALL", canonical] } } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { publishedAt: "desc" },
  });

  return records.map(formatAnnouncement);
}

export async function getAnnouncementBySlug(
  slug: string,
): Promise<Announcement | null> {
  const record = await prisma.announcement.findUnique({
    where: { slug },
  });
  return record ? formatAnnouncement(record) : null;
}

export async function getAnnouncements(
  actor: Parameters<typeof isSuperAdmin>[0],
  filter?: {
    journalSlug?: string;
    includeInactive?: boolean;
  },
): Promise<Announcement[]> {
  const isSuper = isSuperAdmin(actor);
  const targetJournalFilter =
    filter?.journalSlug && filter.journalSlug !== "ALL"
      ? resolveCanonicalJournalSlug(filter.journalSlug)
      : null;

  const records = await prisma.announcement.findMany({
    where: {
      ...(filter?.includeInactive ? {} : { isActive: true }),
      ...(targetJournalFilter
        ? { targetJournal: { in: ["ALL", targetJournalFilter] } }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
  });

  const formatted = records.map(formatAnnouncement);

  if (isSuper) {
    return formatted;
  }

  return formatted.filter((a) => {
    if (a.targetJournal === "ALL") return true;
    return isAuthorizedForJournal(actor, a.targetJournal);
  });
}

export async function createAnnouncement({
  title,
  category,
  targetJournal,
  content,
  imageUrl,
  expiresAt,
  isActive = true,
  authorName: customAuthorName,
  actor,
}: {
  title: string;
  category: AnnouncementCategory;
  targetJournal: string;
  content: string;
  imageUrl?: string;
  expiresAt?: string;
  isActive?: boolean;
  authorName?: string;
  actor: Parameters<typeof isSuperAdmin>[0];
}): Promise<{ success: boolean; error?: string; announcement?: Announcement }> {
  if (!title.trim() || !content.trim()) {
    return { success: false, error: "Title and Content are required." };
  }

  const normalizedJournal =
    targetJournal === "ALL"
      ? "ALL"
      : resolveCanonicalJournalSlug(targetJournal);

  const isAuthorized =
    isSuperAdmin(actor) ||
    normalizedJournal === "ALL" ||
    isAuthorizedForJournal(actor, normalizedJournal);

  if (!isAuthorized) {
    return {
      success: false,
      error:
        "Unauthorized: You do not have permission to publish announcements for this journal.",
    };
  }

  const slug = `${slugify(title)}-${Date.now().toString(36)}`;
  const authorEmail = (actor as { email?: string })?.email;
  const authorName =
    customAuthorName?.trim() ||
    (authorEmail ? authorEmail.split("@")[0] : "Administrator");

  const created = await prisma.announcement.create({
    data: {
      slug,
      title: title.trim(),
      category,
      targetJournal: normalizedJournal,
      content: content.trim(),
      imageUrl: imageUrl?.trim() || null,
      publishedAt: new Date(),
      expiresAt: expiresAt?.trim() ? new Date(expiresAt.trim()) : null,
      isActive: Boolean(isActive),
      authorName,
    },
  });

  safeRevalidate();

  return { success: true, announcement: formatAnnouncement(created) };
}

export async function updateAnnouncement({
  announcementId,
  title,
  category,
  targetJournal,
  content,
  imageUrl,
  expiresAt,
  isActive,
  actor,
}: {
  announcementId: string;
  title: string;
  category: AnnouncementCategory;
  targetJournal: string;
  content: string;
  imageUrl?: string;
  expiresAt?: string;
  isActive: boolean;
  actor: Parameters<typeof isSuperAdmin>[0];
}): Promise<{ success: boolean; error?: string; announcement?: Announcement }> {
  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });

  if (!existing) {
    return { success: false, error: "Announcement not found." };
  }

  const normalizedJournal =
    targetJournal === "ALL"
      ? "ALL"
      : resolveCanonicalJournalSlug(targetJournal);

  const isAuthorized =
    isSuperAdmin(actor) ||
    existing.targetJournal === "ALL" ||
    isAuthorizedForJournal(actor, existing.targetJournal);

  if (!isAuthorized) {
    return {
      success: false,
      error: "Unauthorized: Administrator permissions required.",
    };
  }

  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      title: title.trim(),
      category,
      targetJournal: normalizedJournal,
      content: content.trim(),
      ...(imageUrl !== undefined ? { imageUrl: imageUrl.trim() || null } : {}),
      ...(expiresAt !== undefined
        ? { expiresAt: expiresAt?.trim() ? new Date(expiresAt.trim()) : null }
        : {}),
      isActive: Boolean(isActive),
    },
  });

  safeRevalidate();

  return { success: true, announcement: formatAnnouncement(updated) };
}

export async function deleteAnnouncement({
  announcementId,
  actor,
}: {
  announcementId: string;
  actor: Parameters<typeof isSuperAdmin>[0];
}): Promise<{ success: boolean; error?: string }> {
  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });

  if (!existing) {
    return { success: false, error: "Announcement not found." };
  }

  const isAuthorized =
    isSuperAdmin(actor) ||
    existing.targetJournal === "ALL" ||
    isAuthorizedForJournal(actor, existing.targetJournal);

  if (!isAuthorized) {
    return {
      success: false,
      error: "Unauthorized: Administrator permissions required.",
    };
  }

  await prisma.announcement.delete({
    where: { id: announcementId },
  });

  safeRevalidate();

  return { success: true };
}

export async function toggleAnnouncementActive({
  announcementId,
  actor,
}: {
  announcementId: string;
  actor: Parameters<typeof isSuperAdmin>[0];
}): Promise<{ success: boolean; error?: string; isActive?: boolean }> {
  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });

  if (!existing) {
    return { success: false, error: "Announcement not found." };
  }

  const isAuthorized =
    isSuperAdmin(actor) ||
    existing.targetJournal === "ALL" ||
    isAuthorizedForJournal(actor, existing.targetJournal);

  if (!isAuthorized) {
    return {
      success: false,
      error: "Unauthorized: Administrator permissions required.",
    };
  }

  const newActive = !existing.isActive;
  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: { isActive: newActive },
  });

  safeRevalidate();

  return { success: true, isActive: updated.isActive };
}
