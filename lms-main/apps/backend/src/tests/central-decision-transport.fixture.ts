import {vi} from "vitest";
import {createAuthenticatedCentralDecisionClient} from "../modules/auth/central-decision-transport";
import type {VerifiedIdentity} from "../modules/auth/central-verified-completion";
export const principal:VerifiedIdentity={
 issuer:"https://central.example.test",subject:"central-user-0001",
 audience:"skilled-academy",applicationId:"academy"
};
export const decision={
 allowed:true,applicationId:"academy",organisationId:"central-org-0001",
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
  endpoint:"https://central.example.test/internal/academy/access-decision",
  expectedIssuer:principal.issuer,expectedAudience:principal.audience,
  bearerToken:"server-credential-".repeat(4),fetcher:fetcher as typeof fetch,
  generateRequestId:()=>requestId
 };
 const make=()=>createAuthenticatedCentralDecisionClient(config);
 return {fetcher,config,make};
}
