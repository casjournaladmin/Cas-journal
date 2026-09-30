-- CreateTable Announcement
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "targetJournal" TEXT NOT NULL DEFAULT 'ALL',
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "authorName" TEXT NOT NULL DEFAULT 'Editorial Directorate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable EditorialBoardMember
CREATE TABLE IF NOT EXISTS "EditorialBoardMember" (
    "id" TEXT NOT NULL,
    "journalSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'BOARD_MEMBER',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorialBoardMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable ReviewerApplication
CREATE TABLE IF NOT EXISTS "ReviewerApplication" (
    "id" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "applicantUserId" UUID,
    "fullName" TEXT NOT NULL,
    "academicTitle" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "academicRank" TEXT NOT NULL,
    "specializationKeywords" TEXT NOT NULL,
    "targetJournal" TEXT NOT NULL,
    "profileUrl" TEXT,
    "statement" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Announcement_slug_key" ON "Announcement"("slug");
CREATE INDEX IF NOT EXISTS "Announcement_targetJournal_isActive_idx" ON "Announcement"("targetJournal", "isActive");
CREATE INDEX IF NOT EXISTS "Announcement_publishedAt_idx" ON "Announcement"("publishedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EditorialBoardMember_journalSlug_category_idx" ON "EditorialBoardMember"("journalSlug", "category");
CREATE INDEX IF NOT EXISTS "EditorialBoardMember_journalSlug_order_idx" ON "EditorialBoardMember"("journalSlug", "order");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReviewerApplication_trackingCode_key" ON "ReviewerApplication"("trackingCode");
CREATE INDEX IF NOT EXISTS "ReviewerApplication_targetJournal_status_idx" ON "ReviewerApplication"("targetJournal", "status");
CREATE INDEX IF NOT EXISTS "ReviewerApplication_email_idx" ON "ReviewerApplication"("email");
CREATE INDEX IF NOT EXISTS "ReviewerApplication_submittedAt_idx" ON "ReviewerApplication"("submittedAt");

-- Redefine ReviewRound foreign key constraint to CASCADE
ALTER TABLE "ReviewRound" DROP CONSTRAINT IF EXISTS "ReviewRound_submissionVersionId_fkey";
ALTER TABLE "ReviewRound" ADD CONSTRAINT "ReviewRound_submissionVersionId_fkey" 
    FOREIGN KEY ("submissionVersionId") REFERENCES "SubmissionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
