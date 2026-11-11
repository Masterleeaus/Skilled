import {vi} from "vitest";
import type {PrismaClient} from "@prisma/client";
import {externalCentralRef} from "../../modules/auth/central-lms-contract";
export const issuer="https://id.example.test",audience="academy-client",subject="central-user-0001";
export const orgUuid="00000000-0000-4000-8000-000000000001";
export const org="logto-org-0001",company="skilled-company-0001",user="skilled-user-0001",account="skilled-account-0001";
export const identity={issuer,audience,subject,applicationId:"academy" as const};
export const decision={allowed:true,applicationId:"academy",organisationId:org,
 localUserId:user,localAccountId:account,membershipRevision:1,entitlementRevision:2,linkRevision:3};
export const registry=JSON.stringify({[org]:orgUuid});
export function stubDb({identities=1,membership=true,linkState="verified",linkOrg=org,linkCount=1}={}){
 return {
 academyExternalIdentity:{findMany:vi.fn(async ({where}:{where:{externalUserRef:string}})=>{
  if(where.externalUserRef!==externalCentralRef(issuer,subject))return [];
  return Array.from({length:identities},()=>({companyId:company,userId:user}));
 })},
 companyMember:{findUnique:vi.fn(async()=>membership?{id:"member-1"}:null)},
 centralCompanyLink:{findMany:vi.fn(async()=>Array.from({length:linkCount},()=>({
  centralOrganisationId:linkOrg,state:linkState
 })))}
 } as unknown as Pick<PrismaClient,"academyExternalIdentity"|"companyMember"|"centralCompanyLink">;
}
export function mockedResponse(body:unknown,status=200):Response{
 return {ok:status===200,status,redirected:false,headers:new Headers({"content-type":"application/json"}),
  text:async()=>JSON.stringify(body)} as Response;
}
