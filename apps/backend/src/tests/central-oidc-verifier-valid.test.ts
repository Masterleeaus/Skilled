import {describe,it,expect} from "vitest";
import {verifyOidcIdToken} from "../modules/auth/central-oidc-verifier";
import {jwk,jwt,nowSeconds,issuer,clientId,nonce} from "./support/central-oidc-rsa-fixture";
const o={issuer,audience:clientId,nonce,nowSeconds};
describe("RS256 verified Central identity",()=>{
 it("accepts signed ID token with exact nonce/issuer/audience",()=>expect(
  verifyOidcIdToken(jwt(),[jwk],o)).toEqual({issuer,subject:"central-user-0001",audience:clientId,nonce}));
 it("supports multiple audiences only with exact authorized party",()=>expect(
  verifyOidcIdToken(jwt({aud:[clientId,"another-client"],azp:clientId}),[jwk],o).subject).toBe("central-user-0001"));
});