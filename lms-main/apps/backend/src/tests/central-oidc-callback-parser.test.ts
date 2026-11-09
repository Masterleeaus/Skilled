import {describe,it,expect} from "vitest";
import {parseCallback} from "../modules/auth/central-oidc-callback-input";
import {CALLBACK} from "../modules/auth/central-oidc-paths";
describe("OIDC callback state/code parser",()=>{
 it("accepts only one code and one state",()=>expect(parseCallback(CALLBACK+"?state=123456789&code=123456789")).toEqual({state:"123456789",code:"123456789"}));
 it.each(["?state=123456789","?code=123456789","?state=123456789&code=short",
 "?state=123456789&code=123456789&email=leak","?state=123456789&state=another&code=123456789",
 "?error=access_denied&code=123456789","?state=123456789&code=%0Axxxxxxx"])("rejects invalid callback shape %s",q=>expect(parseCallback(CALLBACK+q)).toBeNull());
 it("rejects different path and extra-long URLs",()=>{expect(parseCallback("/auth/titan/field/callback?state=123456789&code=123456789")).toBeNull();expect(parseCallback(CALLBACK+"?"+("x".repeat(3000)))).toBeNull();});
});