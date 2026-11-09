import {describe,it,expect} from "vitest";
import {createOidcChallenge,browserBindingHash} from "../modules/auth/central-oidc-pkce";
import {challenge} from "../modules/auth/central-oidc-crypto";
describe("OIDC PKCE and browser nonce construction",()=>{
 it("creates distinct one-time state, verifier and nonce",()=>{
  const a=createOidcChallenge(),b=createOidcChallenge();
  expect(a.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(a.nonce).not.toBe(a.verifier);expect(a.state).not.toBe(b.state);
  expect(a.codeChallenge).toBe(challenge(a.verifier));
 });
 it("binds browser state through opaque SHA-256 digest",()=>{
  const hash=browserBindingHash("a".repeat(43));
  expect(hash).toMatch(/^[a-f0-9]{64}$/);expect(hash).not.toContain("aaa");
 });
});