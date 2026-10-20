import { NextResponse } from "next/server";

import { requireSubmissionOwner } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      submissionId: string;
      versionId: string;
      fileKind: string;
    }>;
  },
) {
  const { submissionId, versionId, fileKind } = await params;
  await requireSubmissionOwner(submissionId);
  if (!new Set(["manuscript", "response"]).has(fileKind)) {
    return NextResponse.json({ error: "File unavailable." }, { status: 404 });
  }
  const version = await prisma.submissionVersion.findFirst({
    where: { id: versionId, submissionId },
    select: {
      versionNumber: true,
      submission: { select: { trackingNumber: true } },
      manuscriptStoredFile: {
        select: {
          bucket: true,
          objectPath: true,
          originalFileName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
      responseStoredFile: {
        select: {
          bucket: true,
          objectPath: true,
          originalFileName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
  });
  const file =
    fileKind === "response"
      ? version?.responseStoredFile
      : version?.manuscriptStoredFile;
  if (!file) {
    return NextResponse.json({ error: "File unavailable." }, { status: 404 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(file.bucket)
    .download(file.objectPath);

  if (error || !data) {
    return NextResponse.json({ error: "File unavailable." }, { status: 502 });
  }

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

  const extension = isPdf ? ".pdf" : isDocx ? ".docx" : "";
  const tracking = version?.submission?.trackingNumber;
  const safeFilename = `${tracking || "manuscript"}-v${version?.versionNumber || 1}-${fileKind}${extension}`;

  const contentType = isPdf
    ? "application/pdf"
    : isDocx
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : file.mimeType || "application/octet-stream";

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
