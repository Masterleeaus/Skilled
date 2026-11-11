import {describe,it,expect} from "vitest";
import {exactVerifiedEnvelope} from "../modules/auth/central-runtime-consistency";
import {id,decision,issuer} from "./support/central-runtime-fixture";
describe("verified OIDC principal cannot be swapped with another Central decision",()=>{
 it("accepts matching exact issuer and subject",()=>{
  expect(exactVerifiedEnvelope(id,{issuer,subject:id.subject,decision})).toBe(true);
 });
 it("rejects wrong subject, issuer or denied Central application",()=>{
  expect(exactVerifiedEnvelope(id,{issuer,subject:"different-user",decision})).toBe(false);
  expect(exactVerifiedEnvelope(id,{issuer:"https://evil.example",subject:id.subject,decision})).toBe(false);
  expect(exactVerifiedEnvelope(id,{issuer,subject:id.subject,decision:{...decision,allowed:false} as never})).toBe(false);
 });
});