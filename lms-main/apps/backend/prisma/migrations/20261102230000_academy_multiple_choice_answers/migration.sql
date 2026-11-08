-- Stores multi-select responses as a JSONB array of option identifiers.
-- Existing single-choice answers remain in selectedOptionId, without destructive conversion.
-- The API validates all IDs against their owning question before insertion.
ALTER TABLE "answers" ADD COLUMN "selected_option_ids" JSONB;
