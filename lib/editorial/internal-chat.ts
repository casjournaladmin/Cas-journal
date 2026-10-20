import "server-only";

import { prisma } from "@/lib/db/prisma";
import { handleInternalChatMessageSent } from "@/lib/notifications/event-handlers";

export type InternalChatMessageDTO = {
  id: string;
  body: string | null;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    roleLabel: string;
  } | null;
  attachments: Array<{
    id: string;
    originalFileName: string;
    sizeBytes: number;
    mimeType: string;
  }>;
};

export type InternalChatUserSubject = {
  id: string;
  isActive?: boolean;
  globalRoles?: Array<{ role: string }>;
  roles?: string[];
  journalRoles?: Array<{
    journalId: string;
    journalSlug?: string;
    role: string;
    journal?: {
      id?: string;
      slug?: string;
      [key: string]: unknown;
    } | null;
  }>;
};

export async function checkInternalChatAccess(
  userOrId: string | InternalChatUserSubject,
  journalIdOrSlug: string,
): Promise<boolean> {
  const normalizedTarget = journalIdOrSlug.trim().toLowerCase();

  // 1. If an already-resolved user object is provided, evaluate directly
  if (typeof userOrId === "object" && userOrId !== null) {
    if (userOrId.isActive === false) return false;
    const globalRoles = Array.isArray(userOrId.globalRoles)
      ? userOrId.globalRoles.map((r) => (typeof r === "string" ? r : r.role))
      : Array.isArray((userOrId as { roles?: string[] }).roles)
        ? (userOrId as { roles?: string[] }).roles!
        : [];
    if (globalRoles.includes("SUPER_ADMIN")) return true;

    const journalRoles = Array.isArray(userOrId.journalRoles)
      ? userOrId.journalRoles
      : [];
    return journalRoles.some(
      (r) =>
        (r.role === "JOURNAL_ADMIN" || r.role === "EDITOR") &&
        (r.journalId === journalIdOrSlug ||
          r.journalSlug?.toLowerCase() === normalizedTarget ||
          r.journal?.id === journalIdOrSlug ||
          r.journal?.slug?.toLowerCase() === normalizedTarget),
    );
  }

  const userId = userOrId;

  // 2. Query database for user and their role assignments
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      globalRoles: { select: { role: true } },
      journalRoles: {
        select: {
          journalId: true,
          role: true,
          journal: { select: { id: true, slug: true } },
        },
      },
    },
  });

  if (dbUser) {
    if (!dbUser.isActive) return false;
    if (dbUser.globalRoles.some((r) => r.role === "SUPER_ADMIN")) return true;
    const hasRole = dbUser.journalRoles.some(
      (r) =>
        (r.role === "JOURNAL_ADMIN" || r.role === "EDITOR") &&
        (r.journalId === journalIdOrSlug ||
          r.journal?.id === journalIdOrSlug ||
          r.journal?.slug?.toLowerCase() === normalizedTarget),
    );
    if (hasRole) return true;
  }

  // 3. Fallback for non-production dev identities (e.g. memory tests without DB)
  if (process.env.NODE_ENV !== "production") {
    try {
      const { getActiveDevIdentity, getDevIdentityById } =
        await import("@/lib/auth/dev-identities");
      const activeDev = await getActiveDevIdentity();
      const devUser =
        activeDev && activeDev.id === userId
          ? activeDev
          : getDevIdentityById(userId);

      if (devUser) {
        if (!devUser.isActive) return false;
        if (
          devUser.globalRoles.some((r) => (r.role as string) === "SUPER_ADMIN")
        )
          return true;
        return devUser.journalRoles.some(
          (r) =>
            (r.role === "JOURNAL_ADMIN" || r.role === "EDITOR") &&
            (r.journalId === journalIdOrSlug ||
              r.journal?.id === journalIdOrSlug ||
              r.journal?.slug?.toLowerCase() === normalizedTarget),
        );
      }
    } catch {
      // Continue
    }
  }

  return false;
}

export async function getInternalChatJournal(journalSlug: string) {
  const normalized = journalSlug.trim().toLowerCase();
  return prisma.journal.findFirst({
    where: {
      OR: [{ slug: journalSlug }, { slug: normalized }],
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      shortName: true,
    },
  });
}

export async function listInternalChatMessages(
  journalId: string,
): Promise<InternalChatMessageDTO[]> {
  const messages = await prisma.internalChatMessage.findMany({
    where: { journalId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      sender: {
        select: {
          id: true,
          displayName: true,
          globalRoles: { select: { role: true } },
          journalRoles: {
            where: { journalId },
            select: { role: true },
          },
        },
      },
      attachments: {
        include: {
          storedFile: {
            select: {
              id: true,
              originalFileName: true,
              sizeBytes: true,
              mimeType: true,
            },
          },
        },
      },
    },
  });

  return messages.map((m) => {
    let roleLabel = "Staff";
    if (m.sender) {
      if (m.sender.globalRoles.some((r) => r.role === "SUPER_ADMIN")) {
        roleLabel = "Super Admin";
      } else if (
        m.sender.journalRoles.some((r) => r.role === "JOURNAL_ADMIN")
      ) {
        roleLabel = "Journal Admin";
      } else if (m.sender.journalRoles.some((r) => r.role === "EDITOR")) {
        roleLabel = "Editor";
      }
    }

    return {
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      sender: m.sender
        ? {
            id: m.sender.id,
            displayName: m.sender.displayName,
            roleLabel,
          }
        : null,
      attachments: m.attachments.map((a) => ({
        id: a.id,
        originalFileName: a.storedFile.originalFileName,
        sizeBytes: Number(a.storedFile.sizeBytes),
        mimeType: a.storedFile.mimeType,
      })),
    };
  });
}

export async function sendInternalChatMessage(input: {
  journalId: string;
  senderId: string;
  body?: string | null;
  attachments?: Array<{
    bucket: string;
    objectPath: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
  }>;
}) {
  const hasAccess = await checkInternalChatAccess(
    input.senderId,
    input.journalId,
  );
  if (!hasAccess) {
    throw new Error("Unauthorized to post in internal chat.");
  }

  const text = (input.body ?? "").trim();
  const atts = input.attachments ?? [];
  if (!text && atts.length === 0) {
    throw new Error("Message or attachment is required.");
  }

  const message = await prisma.$transaction(async (tx) => {
    const message = await tx.internalChatMessage.create({
      data: {
        journalId: input.journalId,
        senderId: input.senderId,
        body: text || (atts.length > 0 ? "Attachment" : null),
      },
      select: { id: true },
    });

    for (const att of atts) {
      const stored = await tx.storedFile.create({
        data: {
          bucket: att.bucket,
          objectPath: att.objectPath,
          originalFileName: att.originalFileName,
          mimeType: att.mimeType,
          sizeBytes: BigInt(att.sizeBytes),
          uploaderId: input.senderId,
        },
        select: { id: true },
      });

      await tx.internalChatAttachment.create({
        data: {
          messageId: message.id,
          storedFileId: stored.id,
        },
      });
    }

    return message;
  });

  try {
    const sender = await prisma.user.findUnique({
      where: { id: input.senderId },
      select: { displayName: true },
    });

    void handleInternalChatMessageSent({
      journalId: input.journalId,
      messageId: message.id,
      senderId: input.senderId,
      senderName: sender?.displayName || undefined,
    }).catch((err) => {
      console.error(
        "[InternalChat] Failed to dispatch chat notification:",
        err instanceof Error ? err.message : String(err),
      );
    });
  } catch (err) {
    console.error(
      "[InternalChat] Error preparing chat notification:",
      err instanceof Error ? err.message : String(err),
    );
  }

  return message;
}
