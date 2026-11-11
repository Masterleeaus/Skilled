import {describe,it,expect} from "vitest";
import {createCentralOrganisationSelector} from "../modules/auth/central-organisation-choice";
import {parseCentralOrganisationRegistry} from "../modules/auth/central-organisation-uuid-registry";
import {issuer,identity,registry,orgUuid,stubDb} from "./support/central-service-decision-fixture";
describe("one exact provisioned company before Central service access",()=>{
 const config=parseCentralOrganisationRegistry(registry);
 it("selects Central internal UUID from verified local account mapping",async()=>{
  const select=createCentralOrganisationSelector(stubDb(),issuer,config);
  expect(await select(identity)).toBe(orgUuid);
 });
 it("refuses ambiguous provisioned company identities",async()=>{
  expect(await createCentralOrganisationSelector(stubDb({identities:2}),issuer,config)(identity)).toBeNull();
 });
 it("refuses no membership",async()=>{
  expect(await createCentralOrganisationSelector(stubDb({membership:false}),issuer,config)(identity)).toBeNull();
 });
 it("refuses an unregistered external organisation",async()=>{
  expect(await createCentralOrganisationSelector(stubDb({linkOrg:"logto-org-0002"}),issuer,config)(identity)).toBeNull();
 });
});