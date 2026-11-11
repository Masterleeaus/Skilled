import {describe,it,expect} from "vitest";
import {exactPath,START,CALLBACK} from "../modules/auth/central-oidc-paths";
describe("Central OIDC exact registered paths",()=>{
 it("matches only the registered start and callback",()=>{expect(exactPath(START)).toBe("start");expect(exactPath(CALLBACK+"?state=s")).toBe("callback");});
 it.each(["/auth/titan/academy/callback/","/auth/titan/field/callback","/auth/titan/academy/callback%2F",
 "/auth/titan/academy/./callback","/auth/titan/academy/start/other","//auth/titan/academy/start",
 "/auth/titan/academy/call%62ack"])("refuses ambiguous path %s",value=>expect(exactPath(value)).toBeNull());
 it("rejects oversized and non-string requests",()=>{expect(exactPath("x".repeat(5000))).toBeNull();expect(exactPath(null)).toBeNull();});
});