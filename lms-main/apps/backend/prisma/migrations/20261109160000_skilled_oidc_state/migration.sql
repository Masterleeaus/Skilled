-- Additive, one-use OIDC authorization-code state store.
-- The only persistent values are digests and AES-GCM sealed secrets.
CREATE TABLE "skilled_oidc_login_states" (
 "stateHash" TEXT NOT NULL,
 "applicationId" TEXT NOT NULL,
 "bindingHash" TEXT NOT NULL,
 "sealedVerifier" TEXT NOT NULL,
 "sealedNonce" TEXT NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "skilled_oidc_login_states_pkey" PRIMARY KEY ("stateHash"),
 CONSTRAINT "skilled_oidc_login_states_app_check" CHECK ("applicationId" = 'academy'),
 CONSTRAINT "skilled_oidc_login_states_hash_check" CHECK (length("stateHash") = 64 AND length("bindingHash") = 64)
);
CREATE INDEX "skilled_oidc_login_states_expiresAt_idx" ON "skilled_oidc_login_states"("expiresAt");
