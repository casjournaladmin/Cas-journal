import "server-only";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export async function serveArticlePdf(articleSlug: string): Promise<Response> {
  const article = await prisma.article.findUnique({
    where: { slug: articleSlug },
    include: {
      files: {
        where: { type: { in: ["PRODUCTION_FILE", "PUBLISHED_PDF"] } },
        include: { storedFile: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!article || !article.isPublished) {
    return NextResponse.json(
      { error: "Article unavailable." },
      { status: 404 },
    );
  }

  let fileBucket: string | null = null;
  let fileObjectPath: string | null = null;

  if (article.files.length > 0 && article.files[0].storedFile) {
    fileBucket = article.files[0].storedFile.bucket;
    fileObjectPath = article.files[0].storedFile.objectPath;
  } else {
    const submissionId = article.slug.startsWith("art-")
      ? article.slug.replace("art-", "")
      : null;

    if (submissionId) {
      const version = await prisma.submissionVersion.findFirst({
        where: { submissionId },
        orderBy: { versionNumber: "desc" },
        select: {
          manuscriptStoredFile: { select: { bucket: true, objectPath: true } },
        },
      });
      if (version?.manuscriptStoredFile) {
        fileBucket = version.manuscriptStoredFile.bucket;
        fileObjectPath = version.manuscriptStoredFile.objectPath;
      }
    }
  }

  if (!fileBucket || !fileObjectPath) {
    return NextResponse.json({ error: "PDF unavailable." }, { status: 404 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(fileBucket)
    .download(fileObjectPath);

  if (error || !data) {
    return NextResponse.json({ error: "PDF unavailable." }, { status: 404 });
  }

  const filename = `${article.slug}.pdf`;

  return new Response(data.stream(), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(data.size),
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "X-Robots-Tag": "all",
    },
  });
}
