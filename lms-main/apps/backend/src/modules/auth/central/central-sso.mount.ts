/**
 * Production wiring for Central SSO. app.ts loads this module only when CENTRAL_SSO_ENABLED=true, so with the
 * flag off no Central code, Redis state or JWKS client is created and the email/password login is unchanged.
 */
import type { Express } from "express";
import type { Env } from "../../../config/env";
import { centralSsoProblems, CENTRAL_SSO_CALLBACK_PATH } from "../../../config/central-sso";
import { prisma } from "../../../config/prisma";
import { redis } from "../../../config/redis";
import { logger } from "../../../config/logger";
import { createCentralIdTokenVerifier } from "./central-id-token";
import { createCentralOidcClient } from "./central-oidc";
import { createRedisCentralStateStore } from "./central-state";
import { createCentralSsoRouter } from "./central-routes";

/** Returns true when mounted. Throws on invalid configuration, so the service refuses to start half-configured. */
export function mountCentralSso(app: Express, env: Env): boolean {
  if (!env.CENTRAL_SSO_ENABLED) return false;
  const settings = {
    enabled: true,
    issuer: env.CENTRAL_SSO_ISSUER,
    clientId: env.CENTRAL_SSO_CLIENT_ID,
    clientSecret: env.CENTRAL_SSO_CLIENT_SECRET,
    jwksUri: env.CENTRAL_SSO_JWKS_URI,
    redirectUri: env.CENTRAL_SSO_REDIRECT_URI,
  };
  const problems = centralSsoProblems(settings);
  if (problems.length > 0) throw new Error(`Central SSO is misconfigured: ${problems.join("; ")}`);

  const oidc = createCentralOidcClient({
    settings,
    store: createRedisCentralStateStore(redis),
    verifyIdToken: createCentralIdTokenVerifier({ issuer: settings.issuer, clientId: settings.clientId, jwksUri: settings.jwksUri }),
  });
  app.use(
    "/api/auth/central",
    createCentralSsoRouter({
      db: prisma,
      oidc,
      afterLoginUrl: env.CLIENT_URL,
      logger: (event, fields) => logger.info(event, { component: "central-sso", ...fields }),
    }),
  );
  logger.info("Central SSO routes mounted", { callbackPath: CENTRAL_SSO_CALLBACK_PATH });
  return true;
}
