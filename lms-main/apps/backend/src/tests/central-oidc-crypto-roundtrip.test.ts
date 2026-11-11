import {describe,it,expect} from "vitest";
import {stateKey,hash,sealOidc,openOidc} from "../modules/auth/central-oidc-crypto";
const key=Buffer.alloc(32,3);
describe("AES-256-GCM OIDC login state cryptography",()=>{
 it("hashes opaque state and binding deterministically",()=>expect(hash("some-state")).toMatch(/^[a-f0-9]{64}$/));
 it("seals with unique IV and recovers bound plaintext",()=>{
  const a=sealOidc("secret-nonce","academy|state|nonce",key);
  const b=sealOidc("secret-nonce","academy|state|nonce",key);
  expect(a).not.toBe(b);expect(a).not.toContain("secret");
  expect(openOidc(a,"academy|state|nonce",key)).toBe("secret-nonce");
 });
 it("rejects changed AAD, tampered ciphertext and truncated secret",()=>{
  const s=sealOidc("nonce","company-1",key);
  expect(()=>openOidc(s,"company-2",key)).toThrow();
  expect(()=>openOidc(s.slice(0,-6)+"AAAAAA","company-1",key)).toThrow();
  expect(()=>openOidc("v1.a","company-1",key)).toThrow();
 });
 it("rejects absent or malformed secret keys",()=>{
  expect(()=>stateKey(undefined)).toThrow();
  expect(()=>stateKey(Buffer.alloc(31).toString("base64"))).toThrow();
  expect(stateKey(Buffer.alloc(32,1).toString("base64"))).toHaveLength(32);
 });
});