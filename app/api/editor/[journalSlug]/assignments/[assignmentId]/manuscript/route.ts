import { NextResponse } from "next/server";

import { requireJournalWorkspace } from "@/lib/auth/workspace-context";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  {
    params,
  }: { params: Promise<{ journalSlug: string; assignmentId: string }> },
) {
  const { journalSlug, assignmentId } = await params;
  const { user, journal } = await requireJournalWorkspace(
    "EDITOR",
    journalSlug,
  );

  // 1. Fetch assignment and round metadata
  const assignment = await prisma.reviewAssignment.findFirst({
    where: {
      id: assignmentId,
      status: { notIn: ["CANCELLED", "DECLINED"] },
      reviewRound: { submission: { journalId: journal.id } },
    },
    select: {
      id: true,
      editorId: true,
      reviewRound: {
        select: {
          roundNumber: true,
          submissionId: true,
          submission: {
            select: {
              id: true,
              trackingNumber: true,
              title: true,
              journalId: true,
            },
          },
          submissionVersion: {
            select: {
              versionNumber: true,
              manuscriptStoredFile: {
                select: {
                  id: true,
                  bucket: true,
                  objectPath: true,
                  originalFileName: true,
                  mimeType: true,
                  sizeBytes: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!assignment) {
    return NextResponse.json(
      { error: "Assignment not found." },
      { status: 404 },
    );
  }

  // 2. Strict authorization: Assigned editor OR Journal Admin for this journal OR Super Admin
  const isAssignedEditor = assignment.editorId === user.id;
  const isSuper = isSuperAdmin(user);
  const isJournalAdmin = user.journalRoles.some(
    (r) => r.journalId === journal.id && r.role === "JOURNAL_ADMIN",
  );

  if (!isAssignedEditor && !isSuper && !isJournalAdmin) {
    return NextResponse.json(
      { error: "Forbidden: You are not authorized to access this manuscript." },
      { status: 403 },
    );
  }

  // 3. Resolve manuscript stored file record
  type ManuscriptFileMeta = {
    id: string;
    bucket: string;
    objectPath: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: bigint;
  };

  let file: ManuscriptFileMeta | null =
    assignment.reviewRound.submissionVersion?.manuscriptStoredFile ?? null;
  if (!file) {
    const subFile = await prisma.submissionFile.findFirst({
      where: {
        submissionId: assignment.reviewRound.submissionId,
        type: "MANUSCRIPT",
      },
      select: {
        storedFile: {
          select: {
            id: true,
            bucket: true,
            objectPath: true,
            originalFileName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
      },
    });
    file = subFile?.storedFile ?? null;
  }

  if (!file) {
    return NextResponse.json(
      { error: "Manuscript file record not found." },
      { status: 404 },
    );
  }

  // 4. Download file from private storage using privileged service client
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(file.bucket)
    .download(file.objectPath);

  if (error || !data) {
    console.error(
      `[Editor Manuscript Route] Storage download failed for ${file.objectPath}:`,
      error?.message,
    );
    return NextResponse.json(
      { error: "Manuscript storage file unavailable." },
      { status: 502 },
    );
  }

  // 5. Determine preview vs download disposition
  const url = new URL(request.url);
  const isDownload =
    url.searchParams.get("download") === "1" ||
    url.searchParams.get("download") === "true";

  const isPdf =
    file.mimeType === "application/pdf" ||
    file.originalFileName.toLowerCase().endsWith(".pdf") ||
    file.objectPath.toLowerCase().endsWith(".pdf");

  const isDocx =
    file.mimeType.includes("wordprocessingml") ||
    file.originalFileName.toLowerCase().endsWith(".docx") ||
    file.originalFileName.toLowerCase().endsWith(".doc");

  // Keep double-blind: sanitize filename without exposing author identity
  const extension = isPdf ? ".pdf" : isDocx ? ".docx" : "";
  const tracking = assignment.reviewRound.submission.trackingNumber;
  const safeFilename = `${tracking || "manuscript"}-round-${assignment.reviewRound.roundNumber}${extension}`;

  const contentType = isPdf
    ? "application/pdf"
    : isDocx
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : file.mimeType || "application/octet-stream";

  // For PDF: inline for preview (default), attachment if download requested
  // For DOCX: always attachment since browsers cannot render DOCX inline natively
  const disposition = isDownload
    ? `attachment; filename="${safeFilename}"`
    : isPdf
      ? `inline; filename="${safeFilename}"`
      : `attachment; filename="${safeFilename}"`;

  return new Response(data.stream(), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
      "Content-Length": String(data.size),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
