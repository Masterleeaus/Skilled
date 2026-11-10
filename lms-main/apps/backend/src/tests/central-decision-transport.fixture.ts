import {vi} from "vitest";
import {createAuthenticatedCentralDecisionClient,createCentralOrganisationRegistry} from "../modules/auth/central-decision-transport";
import type {VerifiedIdentity} from "../modules/auth/central-verified-completion";
export const principal:VerifiedIdentity={
 issuer:"https://central.example.test",subject:"central-user-0001",
 audience:"skilled-academy",applicationId:"academy"
};
/** Trusted Logto organisation ID (verified by Central) and its Central internal UUID from the operator registry. */
export const logtoOrganisationId="logto-org-0001";
export const centralOrganisationId="00000000-0000-4000-8000-000000000001";
export const decision={
 allowed:true,applicationId:"academy",organisationId:logtoOrganisationId,
 localUserId:"skilled-user-0001",localAccountId:"account-0001",
 membershipRevision:1,entitlementRevision:1,linkRevision:1
};
export const requestId="R".repeat(32);
export const envelope=()=>({issuer:principal.issuer,subject:principal.subject,requestId,decision:{...decision}});
export const json=(payload:unknown,status=200,headers:Record<string,string>={"content-type":"application/json"})=>
 new Response(JSON.stringify(payload),{status,headers});
export function harness() {
 const fetcher=vi.fn(async(_url:RequestInfo|URL,_options?:RequestInit):Promise<Response>=>json(envelope()));
 const config={
  endpoint:"https://central.example.test/v1/integrations/academy/decision",
  expectedIssuer:principal.issuer,expectedAudience:principal.audience,
  bearerToken:"server-credential-".repeat(4),fetcher:fetcher as typeof fetch,
  generateRequestId:()=>requestId,
  resolveCentralOrganisationId:createCentralOrganisationRegistry([{logtoOrganisationId,centralOrganisationId}]),
 };
 /** Tests call the client with the verified identity; the fixture supplies the trusted Logto organisation. */
 const make=()=>{const client=createAuthenticatedCentralDecisionClient(config);return (identity:VerifiedIdentity)=>client(identity,logtoOrganisationId);};
 return {fetcher,config,make};
}
