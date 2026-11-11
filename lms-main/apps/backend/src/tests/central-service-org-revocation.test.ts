import {describe,it,expect} from "vitest";
import {createCentralOrganisationSelector} from "../modules/auth/central-organisation-choice";
import {parseCentralOrganisationRegistry} from "../modules/auth/central-organisation-uuid-registry";
import {issuer,identity,registry,stubDb} from "./support/central-service-decision-fixture";
describe("revoked or ambiguous local company records never reach Central",()=>{
 const registryMap=parseCentralOrganisationRegistry(registry);
 it("fails when verified company link was revoked",async()=>{
  const db=stubDb({linkState:"revoked",linkCount:0});
  expect(await createCentralOrganisationSelector(db,issuer,registryMap)(identity)).toBeNull();
 });
 it("fails on more than one matching local company binding",async()=>{
  expect(await createCentralOrganisationSelector(stubDb({linkCount:2}),issuer,registryMap)(identity)).toBeNull();
 });
 it("fails on different OIDC issuer",async()=>{
  expect(await createCentralOrganisationSelector(stubDb(),issuer,registryMap)(
   {...identity,issuer:"https://evil.example.test"})).toBeNull();
 });
});