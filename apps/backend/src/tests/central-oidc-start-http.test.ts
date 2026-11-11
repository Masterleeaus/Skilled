import {describe,it,expect} from "vitest";
import {makeApp,START} from "./support/central-oidc-http-harness";
describe("OIDC provider start only from a cryptographically random binding",()=>{
 it("generates binding, starts trusted provider, and redirects with secure cookie",async()=>{
  const h=makeApp();const r=await h.request().get(START);expect(r.status).toBe(303);
  expect(r.headers.location).toContain("https://id.example.test/authorize");
  expect(r.headers["set-cookie"][0]).toContain("titan_academy_oidc_binding=");
  expect(r.headers["set-cookie"][0]).toContain("HttpOnly");
  expect(h.login.begin).toHaveBeenCalledOnce();
 });
 it("rejects unsolicited URL parameters before starting provider",async()=>{
  const h=makeApp();const r=await h.request().get(START+"?companyId=forged");expect(r.status).toBe(400);expect(h.login.begin).not.toHaveBeenCalled();
 });
 it("refuses provider outage without redirecting browser",async()=>{
  const h=makeApp({redirect:"https://attacker.example.test/authorize"});const r=await h.request().get(START);
  expect(r.status).toBe(503);expect(r.headers.location).toBeUndefined();expect(r.headers["set-cookie"]).toBeUndefined();
 });
});