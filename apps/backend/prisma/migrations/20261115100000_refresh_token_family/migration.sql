-- Refresh-token families. Every credential in one rotation chain shares a familyId, so presenting a retired
-- credential again can revoke the whole chain. Additive: the column is backfilled so each existing row starts
-- its own family (its own id), which keeps current sessions valid until they rotate.

ALTER TABLE "refresh_tokens" ADD COLUMN "familyId" TEXT;
UPDATE "refresh_tokens" SET "familyId" = "id" WHERE "familyId" IS NULL;
ALTER TABLE "refresh_tokens" ALTER COLUMN "familyId" SET NOT NULL;

CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");
