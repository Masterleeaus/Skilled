-- Durable queue of lesson video objects whose removal failed (issue #51). ADDITIVE ONLY: one new table.

-- CreateTable
CREATE TABLE "video_object_cleanup" (
    "id" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "video_object_cleanup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_object_cleanup_objectKey_key" ON "video_object_cleanup"("objectKey");

-- CreateIndex
CREATE INDEX "video_object_cleanup_completedAt_createdAt_idx" ON "video_object_cleanup"("completedAt", "createdAt");

