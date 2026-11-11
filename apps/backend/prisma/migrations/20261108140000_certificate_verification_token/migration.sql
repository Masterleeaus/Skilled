-- Certificate verification tokens (issue #57).
-- verificationToken: 128-bit random, base64url. NULL for legacy certificates, which stay verifiable by
-- certificateNumber. No backfill: the PDF already issued for a legacy certificate does not print a token.
-- showNameOnVerify: opt-in flag. Existing rows default to false, so the learner's name is no longer
-- disclosed by the public verify endpoint unless the learner opts in.
ALTER TABLE "certificates"
    ADD COLUMN "verificationToken" TEXT,
    ADD COLUMN "showNameOnVerify" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "certificates_verificationToken_key" ON "certificates"("verificationToken");
