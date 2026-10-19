import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/authorization";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { canAccessRequest } from "@/lib/requests/policy";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;
  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }

  const subRequest = await prisma.submissionRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      authorId: true,
      journalId: true,
      departmentId: true,
    },
  });

  if (!subRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const actor = {
    id: user.id,
    active: user.isActive,
    superAdmin: isSuperAdmin(user),
    author: user.globalRoles.some((r) => r.role === "AUTHOR"),
    adminDepartmentIds: user.journalRoles
      .filter((r) => r.role === "JOURNAL_ADMIN")
      .map((r) => r.journal.department?.id)
      .filter((id): id is string => Boolean(id)),
    adminJournalIds: user.journalRoles
      .filter((r) => r.role === "JOURNAL_ADMIN")
      .map((r) => r.journalId),
  };

  if (!canAccessRequest(actor, subRequest)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.submissionConversationMessage.findMany({
    where: { requestId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      sender: { select: { id: true, displayName: true } },
      attachments: { include: { storedFile: true } },
    },
  });

  const formattedMessages = messages.map((message) => ({
    id: message.id,
    kind: message.kind,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    sender: message.sender,
    attachments: message.attachments.map((attachment) => ({
      id: attachment.id,
      type: attachment.type,
      originalFileName: attachment.storedFile.originalFileName,
      sizeBytes: Number(attachment.storedFile.sizeBytes),
    })),
  }));

  return NextResponse.json(
    { messages: formattedMessages },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
