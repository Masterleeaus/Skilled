import {it,expect} from "vitest";
import {harness,principal,envelope,json,decision,centralOrganisationId,logtoOrganisationId} from "./central-decision-transport.fixture";

const otherCentralOrganisationId="11111111-1111-4111-8111-111111111111";

it("sends only applicationId, issuer, subject and requestId in the decision body",async()=>{
 const h=harness();
 await h.make()(principal);
 const init=h.fetcher.mock.calls[0][1] as RequestInit;
 expect(JSON.parse(init.body as string)).toEqual({applicationId:"academy",issuer:principal.issuer,
  subject:principal.subject,requestId:"R".repeat(32)});
});

it("never puts the organisation in the body, even when the operator registry maps it",async()=>{
 const h=harness();
 await h.make()(principal);
 const raw=(h.fetcher.mock.calls[0][1] as RequestInit).body as string;
 expect(raw).not.toContain("organisationId");
 expect(raw).not.toContain(centralOrganisationId);
 expect(raw).not.toContain(logtoOrganisationId);
});

it("still accepts only a decision for the registry-mapped organisation after the body change",async()=>{
 const h=harness();
 h.fetcher.mockImplementation(async()=>json({...envelope(),decision:{...decision,organisationId:centralOrganisationId}}));
 expect(await h.make()(principal)).not.toBeNull();
});

it("refuses a decision for another organisation even though the request named none",async()=>{
 const h=harness();
 h.fetcher.mockImplementation(async()=>json({...envelope(),decision:{...decision,organisationId:otherCentralOrganisationId}}));
 expect(await h.make()(principal)).toBeNull();
});

it("refuses before any request when the Logto organisation is not in the operator registry",async()=>{
 const h=harness();
 const client=(await import("../modules/auth/central-decision-transport")).createAuthenticatedCentralDecisionClient({
  ...h.config,resolveCentralOrganisationId:()=>null,
 });
 expect(await client(principal,logtoOrganisationId)).toBeNull();
 expect(h.fetcher).not.toHaveBeenCalled();
});
