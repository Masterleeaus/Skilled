import {describe,it,expect} from "vitest";
import {verifyOidcIdToken} from "../modules/auth/central-oidc-verifier";
import {jwk,jwt,nowSeconds,issuer,clientId,nonce} from "./support/central-oidc-rsa-fixture";
const o={issuer,audience:clientId,nonce,nowSeconds};
describe("OIDC claim denial boundaries",()=>{
 for(const [label,claims] of Object.entries({
  issuer:{iss:"https://evil.example.test"},audience:{aud:"field-client"},nonce:{nonce:"wrong-nonce"},
  expiry:{exp:nowSeconds-1},futureIssue:{iat:nowSeconds+90},oldIssue:{iat:nowSeconds-10000},
  notYetValid:{nbf:nowSeconds+90},missingSubject:{sub:""},
  azp:{aud:[clientId,"another-client"],azp:"field-client"},
 })){
  it("rejects "+label,()=>expect(()=>verifyOidcIdToken(jwt(claims),[jwk],o)).toThrow());
 }
});