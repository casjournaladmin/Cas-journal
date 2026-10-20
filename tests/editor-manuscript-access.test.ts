import assert from "node:assert/strict";
import test from "node:test";

// Test disposition and content type logic
function computeManuscriptDisposition(params: {
  mimeType: string;
  originalFileName: string;
  trackingNumber: string;
  roundNumber: number;
  isDownload: boolean;
}) {
  const isPdf =
    params.mimeType === "application/pdf" ||
    params.originalFileName.toLowerCase().endsWith(".pdf");

  const isDocx =
    params.mimeType.includes("wordprocessingml") ||
    params.originalFileName.toLowerCase().endsWith(".docx") ||
    params.originalFileName.toLowerCase().endsWith(".doc");

  const extension = isPdf ? ".pdf" : isDocx ? ".docx" : "";
  const safeFilename = `${params.trackingNumber || "manuscript"}-round-${params.roundNumber}${extension}`;

  const contentType = isPdf
    ? "application/pdf"
    : isDocx
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : params.mimeType || "application/octet-stream";

  const disposition = params.isDownload
    ? `attachment; filename="${safeFilename}"`
    : isPdf
      ? `inline; filename="${safeFilename}"`
      : `attachment; filename="${safeFilename}"`;

  return { contentType, disposition, safeFilename, isPdf, isDocx };
}

// Test authorization policy logic for editor manuscript access
function canAccessEditorManuscript(params: {
  userId: string;
  assignedEditorId: string;
  journalId: string;
  userRoles: {
    isSuperAdmin: boolean;
    journalRoles: Array<{ journalId: string; role: string }>;
  };
}) {
  const isAssignedEditor = params.assignedEditorId === params.userId;
  const isSuper = params.userRoles.isSuperAdmin;
  const isJournalAdmin = params.userRoles.journalRoles.some(
    (r) => r.journalId === params.journalId && r.role === "JOURNAL_ADMIN",
  );

  return isAssignedEditor || isSuper || isJournalAdmin;
}

test("Editor Manuscript Access: PDF preview serves inline Content-Disposition", () => {
  const result = computeManuscriptDisposition({
    mimeType: "application/pdf",
    originalFileName: "author-confidential-submission.pdf",
    trackingNumber: "IZU-2026-0042",
    roundNumber: 1,
    isDownload: false,
  });

  assert.equal(result.contentType, "application/pdf");
  assert.equal(
    result.disposition,
    'inline; filename="IZU-2026-0042-round-1.pdf"',
  );
  // Ensures author identity from original filename is stripped for double-blind integrity
  assert.equal(result.safeFilename.includes("author-confidential"), false);
});

test("Editor Manuscript Access: PDF download serves attachment Content-Disposition when requested", () => {
  const result = computeManuscriptDisposition({
    mimeType: "application/pdf",
    originalFileName: "paper.pdf",
    trackingNumber: "IZU-2026-0042",
    roundNumber: 1,
    isDownload: true,
  });

  assert.equal(result.contentType, "application/pdf");
  assert.equal(
    result.disposition,
    'attachment; filename="IZU-2026-0042-round-1.pdf"',
  );
});

test("Editor Manuscript Access: DOCX format always defaults to attachment fallback", () => {
  // Even when isDownload is false (preview requested), DOCX cannot render inline in browser
  const result = computeManuscriptDisposition({
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    originalFileName: "submission.docx",
    trackingNumber: "EXIST-2026-0099",
    roundNumber: 2,
    isDownload: false,
  });

  assert.equal(
    result.contentType,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  assert.equal(
    result.disposition,
    'attachment; filename="EXIST-2026-0099-round-2.docx"',
  );
});

test("Editor Manuscript Authorization: Assigned editor can access manuscript", () => {
  const hasAccess = canAccessEditorManuscript({
    userId: "editor-user-1",
    assignedEditorId: "editor-user-1",
    journalId: "j-izu",
    userRoles: {
      isSuperAdmin: false,
      journalRoles: [{ journalId: "j-izu", role: "EDITOR" }],
    },
  });

  assert.equal(hasAccess, true);
});

test("Editor Manuscript Authorization: Unassigned editor is denied access", () => {
  const hasAccess = canAccessEditorManuscript({
    userId: "editor-user-2",
    assignedEditorId: "editor-user-1",
    journalId: "j-izu",
    userRoles: {
      isSuperAdmin: false,
      journalRoles: [{ journalId: "j-izu", role: "EDITOR" }],
    },
  });

  assert.equal(hasAccess, false);
});

test("Editor Manuscript Authorization: Cross-journal editor is denied access", () => {
  const hasAccess = canAccessEditorManuscript({
    userId: "editor-user-cjmr",
    assignedEditorId: "editor-user-1",
    journalId: "j-izu",
    userRoles: {
      isSuperAdmin: false,
      journalRoles: [{ journalId: "j-cjmr", role: "EDITOR" }],
    },
  });

  assert.equal(hasAccess, false);
});

test("Editor Manuscript Authorization: Journal Administrator for the journal has access", () => {
  const hasAccess = canAccessEditorManuscript({
    userId: "admin-izu-user",
    assignedEditorId: "editor-user-1",
    journalId: "j-izu",
    userRoles: {
      isSuperAdmin: false,
      journalRoles: [{ journalId: "j-izu", role: "JOURNAL_ADMIN" }],
    },
  });

  assert.equal(hasAccess, true);
});

test("Editor Manuscript Authorization: Super Administrator has platform-wide access", () => {
  const hasAccess = canAccessEditorManuscript({
    userId: "superadmin-user",
    assignedEditorId: "editor-user-1",
    journalId: "j-izu",
    userRoles: {
      isSuperAdmin: true,
      journalRoles: [],
    },
  });

  assert.equal(hasAccess, true);
});
