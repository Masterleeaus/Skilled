import {describe,it,expect,vi} from "vitest";
import {createSkilledCentralServiceDecision} from "../modules/auth/central-service-decision-binding";
import {identity,decision,issuer,audience,registry,orgUuid,stubDb,mockedResponse} from "./support/central-service-decision-fixture";
describe("bound Central service client composes operator registry and existing transport",()=>{
 it("end-to-end request uses scope and validates response",async()=>{
  const fetcher=vi.fn(async (_url:string,init:RequestInit)=>{
   const q=JSON.parse(init.body as string);expect(q.organisationId).toBe(orgUuid);
   return mockedResponse({issuer,subject:identity.subject,requestId:q.requestId,decision});
  });
  const client=createSkilledCentralServiceDecision({db:stubDb(),
   endpoint:"https://central.example.test/v1/integrations/academy/decision",issuer,audience,
   serverCredential:"s".repeat(64),centralOrganisationRegistryJson:registry,
   fetcher:fetcher as never});
  expect((await client(identity))?.decision.localUserId).toBe(decision.localUserId);
 });
 it("does not fetch when local identity is ambiguously mapped",async()=>{
  const fetcher=vi.fn(async()=>mockedResponse({}));
  const client=createSkilledCentralServiceDecision({db:stubDb({identities:2}),
   endpoint:"https://central.example.test/v1/integrations/academy/decision",issuer,audience,
   serverCredential:"s".repeat(64),centralOrganisationRegistryJson:registry,fetcher:fetcher as never});
  expect(await client(identity)).toBeNull();expect(fetcher).not.toHaveBeenCalled();
 });
});