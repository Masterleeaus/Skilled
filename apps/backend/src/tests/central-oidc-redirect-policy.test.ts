import {describe,it,expect} from "vitest";
import {trustedRedirect,afterLogin} from "../modules/auth/central-oidc-redirect";
describe("strict provider redirect and post-login destination policy",()=>{
 it("accepts only an HTTPS identity provider in the explicit allowlist",()=>{
  expect(trustedRedirect("https://id.example.test/authorize?state=token",["https://id.example.test"])).toBe("https://id.example.test/authorize?state=token");
 });
 it.each(["http://id.example.test/auth","https://evil.example.test/auth","https://user:pass@id.example.test/auth",
 "https://id.example.test/auth#fragment","//id.example.test/auth","javascript:alert(1)"])("rejects unsafe redirect %s",value=>
  expect(trustedRedirect(value,["https://id.example.test"])).toBeNull());
 it.each(["//evil.test","/\\evil.test","https://evil.test/","/foo\r\nSet-Cookie: bad"])("rejects open redirect destination %s",p=>expect(afterLogin(p)).toBeNull());
 it("accepts local dashboard routes",()=>expect(afterLogin("/dashboard?tab=activity")).toBe("/dashboard?tab=activity"));
});