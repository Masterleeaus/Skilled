import {describe,it,expect} from "vitest";
import {createOidcLimiter} from "../modules/auth/central-oidc-limiter";
describe("fallback OIDC rate limit",()=>{
 it("blocks excess attempts per client",()=>{const x=createOidcLimiter(2);expect(x.take("ip-1")).toBe(true);expect(x.take("ip-1")).toBe(true);expect(x.take("ip-1")).toBe(false);expect(x.take("ip-2")).toBe(true);});
 it("releases client bucket only after its clock window",()=>{let clock=0;const x=createOidcLimiter(1,1000,()=>clock);expect(x.take("ip")).toBe(true);clock=999;expect(x.take("ip")).toBe(false);clock=1000;expect(x.take("ip")).toBe(true);});
 it("fails closed on invalid configuration and untrusted keys",()=>{expect(()=>createOidcLimiter(0)).toThrow();expect(createOidcLimiter().take("")).toBe(false);expect(createOidcLimiter().take("x".repeat(500))).toBe(false);});
});