import {describe,it,expect} from "vitest";
import {parseSkilledOidcConfig} from "../modules/auth/central-oidc-config";
import {skilledOidcReadiness} from "../modules/auth/central-oidc-status";
describe("no OIDC secrets in readiness output",()=>{
 it("returns only booleans and never signing or client secrets",()=>{
  const secret="a".repeat(45),key=Buffer.alloc(32,7).toString("base64");
  const config=parseSkilledOidcConfig({SKILLED_CENTRAL_OIDC_ENABLED:"true",
   SKILLED_CENTRAL_OIDC_ISSUER:"https://id.example.test",
   SKILLED_CENTRAL_OIDC_CLIENT_ID:"app-client",
   SKILLED_CENTRAL_OIDC_CLIENT_SECRET:secret,SKILLED_CENTRAL_OIDC_STATE_KEY:key,
   SKILLED_CENTRAL_OIDC_REDIRECT_URI:"https://site.example.test/auth/titan/academy/callback"});
  const report=JSON.stringify(skilledOidcReadiness(config!,{
   databaseMigrationApplied:false,centralDecisionTransportVerified:false,
   proxyRateLimitsVerified:false,twoTenantRehearsalPassed:false}));
  expect(report).not.toContain(secret);expect(report).not.toContain(key);
 });
});