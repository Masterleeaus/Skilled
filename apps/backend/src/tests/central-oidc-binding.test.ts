import {describe,it,expect} from "vitest";
import {newBinding,setBinding,clearBinding,readBinding} from "../modules/auth/central-oidc-browser-binding";
describe("OIDC browser correlation cookie",()=>{
 it("creates distinct cryptographically random tokens of 43 base64url characters",()=>{
  const a=newBinding(),b=newBinding();expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);expect(a).not.toBe(b);
 });
 it("issues host-only secure HttpOnly cookie and exact clearing policy",()=>{
  const cookie=setBinding("a".repeat(43));expect(cookie).toContain("Secure; HttpOnly; SameSite=Lax");
  expect(cookie).not.toContain("Domain=");expect(clearBinding()).toContain("Max-Age=0");
 });
 it("rejects duplicate, oversized, invalid browser cookies",()=>{
  const cookie="titan_academy_oidc_binding="+"a".repeat(43);
  expect(readBinding(cookie)).toBe("a".repeat(43));expect(readBinding(cookie+"; "+cookie)).toBeNull();
  expect(readBinding(cookie+"x".repeat(9000))).toBeNull();expect(readBinding("titan_academy_oidc_binding=bad")).toBeNull();
  expect(()=>setBinding("unsafe\r\n")).toThrow();
 });
});