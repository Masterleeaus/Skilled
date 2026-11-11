-- Optional WebVTT caption track for a lesson video (private MinIO key). ADDITIVE ONLY: one nullable column.

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "captionTrackKey" TEXT;
