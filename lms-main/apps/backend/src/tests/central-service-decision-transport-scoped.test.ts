import {describe,it,expect,vi} from "vitest";
import {createAuthenticatedCentralDecisionClient} from "../modules/auth/central-decision-transport";
import {issuer,audience,identity,decision,orgUuid,mockedResponse} from "./support/central-service-decision-fixture";
const endpoint="https://central.example.test/v1/integrations/academy/decision";
const token="t".repeat(64);
describe("Skilled request meets new Central server-to-server decision contract",()=>{
 it("sends Central UUID from a trusted callback, not user selected company",async()=>{
  const fetcher=vi.fn(async (_url:string,init:RequestInit)=>{
   const request=JSON.parse(init.body as string);
   expect(request).toEqual({applicationId:"academy",issuer,subject:identity.subject,
    requestId:"r".repeat(43),organisationId:orgUuid});
   expect((init.headers as Record<string,string>).authorization).toBe("Bearer "+token);
   return mockedResponse({issuer,subject:identity.subject,requestId:request.requestId,decision});
  });
  const client=createAuthenticatedCentralDecisionClient({
   endpoint,bearerToken:token,expectedIssuer:issuer,expectedAudience:audience,
   fetcher:fetcher as never,generateRequestId:()=> "r".repeat(43),
   resolveCentralOrganisationId:async()=>orgUuid,
  });
  expect(await client(identity)).toEqual({issuer,subject:identity.subject,decision});
  expect(fetcher).toHaveBeenCalledOnce();
 });
 it("refuses missing UUID before any HTTP request",async()=>{
  const fetcher=vi.fn(async()=>mockedResponse(null));
  const client=createAuthenticatedCentralDecisionClient({
   endpoint,bearerToken:token,expectedIssuer:issuer,expectedAudience:audience,
   fetcher:fetcher as never,resolveCentralOrganisationId:async()=>null,
  });
  expect(await client(identity)).toBeNull();expect(fetcher).not.toHaveBeenCalled();
 });
});