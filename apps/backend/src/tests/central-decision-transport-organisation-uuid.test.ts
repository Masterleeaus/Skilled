import {it,expect} from "vitest";
import {harness,principal,envelope,json,decision,centralOrganisationId,logtoOrganisationId} from "./central-decision-transport.fixture";

const otherCentralOrganisationId="11111111-1111-4111-8111-111111111111";

it("accepts a decision naming the mapped Central organisation UUID that was requested",async()=>{
 const h=harness();
 h.fetcher.mockImplementation(async()=>json({...envelope(),decision:{...decision,organisationId:centralOrganisationId}}));
 expect(await h.make()(principal)).toEqual({issuer:principal.issuer,subject:principal.subject,decision:{...decision,organisationId:centralOrganisationId}});
});
it("refuses a decision naming a different Central organisation UUID",async()=>{
 const h=harness();
 h.fetcher.mockImplementation(async()=>json({...envelope(),decision:{...decision,organisationId:otherCentralOrganisationId}}));
 expect(await h.make()(principal)).toBeNull();
});
it("refuses a decision naming the Logto organisation ID instead of the Central UUID",async()=>{
 const h=harness();
 h.fetcher.mockImplementation(async()=>json({...envelope(),decision:{...decision,organisationId:logtoOrganisationId}}));
 expect(await h.make()(principal)).toBeNull();
});
