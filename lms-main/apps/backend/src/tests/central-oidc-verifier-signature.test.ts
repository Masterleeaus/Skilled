import {describe,it,expect} from "vitest";
import {verifyOidcIdToken} from "../modules/auth/central-oidc-verifier";
import {jwk,jwt,nowSeconds,issuer,clientId,nonce} from "./support/central-oidc-rsa-fixture";
const o={issuer,audience:clientId,nonce,nowSeconds};
describe("OIDC token algorithm, key and signature denial",()=>{
 it.each([{alg:"none"},{alg:"HS256"},{kid:"untrusted"},{crit:["custom"]},{jku:"https://evil.test/jwks"}])(
  "rejects unsafe JWT header %j",header=>expect(()=>verifyOidcIdToken(jwt({},header),[jwk],o)).toThrow());
 it("rejects modified claims after signing",()=>{
  const parts=jwt().split(".");
  parts[1]=Buffer.from(JSON.stringify({aud:clientId,sub:"other-user"})).toString("base64url");
  expect(()=>verifyOidcIdToken(parts.join("."),[jwk],o)).toThrow();
 });
 it("rejects ambiguous, missing and mismatched keys",()=>{
  expect(()=>verifyOidcIdToken(jwt(),[],o)).toThrow();
  expect(()=>verifyOidcIdToken(jwt(),[jwk,jwk],o)).toThrow();
  expect(()=>verifyOidcIdToken(jwt(),[{...jwk,kid:"other"}],o)).toThrow();
 });
});