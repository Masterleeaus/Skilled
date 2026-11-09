import {describe,it,expect} from "vitest";
import {parseSkilledOidcConfig} from "../modules/auth/central-oidc-config";
const good={SKILLED_CENTRAL_OIDC_ENABLED:"true",SKILLED_CENTRAL_OIDC_ISSUER:"https://id.example.test",
 SKILLED_CENTRAL_OIDC_CLIENT_ID:"academy-client",SKILLED_CENTRAL_OIDC_CLIENT_SECRET:"a".repeat(40),
 SKILLED_CENTRAL_OIDC_REDIRECT_URI:"https://skilled.example.test/auth/titan/academy/callback",
 SKILLED_CENTRAL_OIDC_STATE_KEY:Buffer.alloc(32,9).toString("base64")};
describe("production OIDC configuration",()=>{
 it("is disabled when feature flag is not exact true",()=>expect(parseSkilledOidcConfig({...good,SKILLED_CENTRAL_OIDC_ENABLED:"false"})).toBeNull());
 it("only parses an exact HTTPS provider and registered callback",()=>expect(parseSkilledOidcConfig(good)?.stateKey).toHaveLength(32));
 it.each(["http://id.example.test","https://id.example.test/path","https://id.example.test?q=x","https://name:secret@id.example.test","https://name@id.example.test","https://id.example.test#fragment"])("rejects invalid issuer %s",issuer=>expect(()=>parseSkilledOidcConfig({...good,SKILLED_CENTRAL_OIDC_ISSUER:issuer})).toThrow());
 it("refuses incorrect callback and weak key",()=>{
  expect(()=>parseSkilledOidcConfig({...good,SKILLED_CENTRAL_OIDC_REDIRECT_URI:"https://skilled.example.test/auth/titan/field/callback"})).toThrow();
  expect(()=>parseSkilledOidcConfig({...good,SKILLED_CENTRAL_OIDC_STATE_KEY:"bad"})).toThrow();
 });
});