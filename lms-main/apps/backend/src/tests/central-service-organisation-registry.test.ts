import {describe,it,expect} from "vitest";
import {parseCentralOrganisationRegistry} from "../modules/auth/central-organisation-uuid-registry";
import {org,orgUuid,registry} from "./support/central-service-decision-fixture";
describe("operator controlled Central UUID registry",()=>{
 it("parses exactly one external org -> Central internal UUID mapping",()=>{
  expect(parseCentralOrganisationRegistry(registry).get(org)).toBe(orgUuid);
 });
 it.each(["{}","[]","null","not-json",'{"bad":"wrong"}'])("denies malformed mapping %s",raw=>{
  expect(()=>parseCentralOrganisationRegistry(raw)).toThrow();
 });
 it("rejects an aliased internal UUID assigned to multiple organisations",()=>{
  expect(()=>parseCentralOrganisationRegistry(JSON.stringify({[org]:orgUuid,"logto-org-0002":orgUuid}))).toThrow();
 });
});