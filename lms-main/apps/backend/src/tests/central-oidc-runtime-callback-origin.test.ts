import {describe,it,expect} from "vitest";
import {allowOidcCallbackHeaders} from "../modules/auth/central-oidc-callback-origin";
describe("OIDC browser callback metadata",()=>{
 it("allows normal browser top-level provider redirects",()=>{
  expect(allowOidcCallbackHeaders({"sec-fetch-site":"cross-site","sec-fetch-mode":"navigate","sec-fetch-dest":"document"})).toBe(true);
  expect(allowOidcCallbackHeaders({})).toBe(true);
 });
 it.each([{"origin":"https://evil.example.test"},{"sec-fetch-mode":"cors"},{"sec-fetch-dest":"iframe"},{"sec-fetch-site":"same-origin"}])(
  "rejects non-navigation callback shape %j",headers=>expect(allowOidcCallbackHeaders(headers)).toBe(false));
});