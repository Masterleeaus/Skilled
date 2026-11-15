-- Additive: records when a refresh token was rotated into a successor, so that a replayed rotated token
-- can be told apart from a token that was revoked by logout. Nullable with no default and no backfill.
-- Rows created before this migration keep NULL, so a replay of a token rotated before deploy is refused
-- without revoking the user's other sessions. Every later rotation sets the column.
ALTER TABLE "refresh_tokens" ADD COLUMN "replacedAt" TIMESTAMP(3);
