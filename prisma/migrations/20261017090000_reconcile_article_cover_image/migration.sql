-- AlterEnum
ALTER TYPE "ArticleFileType" ADD VALUE IF NOT EXISTS 'COVER_IMAGE';

-- AlterTable
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
