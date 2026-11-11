import {vi} from "vitest";
import {fakePrisma,resetFakeDb,seed,rows} from "./fake-prisma";
import type {VerifiedIdentity,TrustedDecisionEnvelope} from "../../modules/auth/central-verified-completion";
import type {CentralDecision} from "../../modules/auth/central-account-resolution";
export const issuer="https://id.example.test",audience="academy-client";
export const id:VerifiedIdentity={issuer,audience,applicationId:"academy",subject:"central-user-0001"};
export const decision:CentralDecision={allowed:true,applicationId:"academy",organisationId:"central-org-0001",
 localUserId:"skilled-user-0001",localAccountId:"skilled-acct-0001",
 membershipRevision:1,entitlementRevision:1,linkRevision:1};
export const binding={userId:decision.localUserId,companyId:"skilled-company-0001",
 centralOrganisationId:decision.organisationId,localAccountId:decision.localAccountId};
export async function prepare(){
 resetFakeDb();
 await seed("company",[{id:binding.companyId,name:"Business A"},{id:"skilled-company-0002",name:"Business B"}]);
 await seed("user",[{id:binding.userId,email:"learner@example.test",role:"STUDENT",
 isActive:true,isEmailVerified:true,deletedAt:null}]);
 await seed("companyMember",[{companyId:binding.companyId,userId:binding.userId,role:"LEARNER"}]);
 await seed("centralCompanyLink",[{centralOrganisationId:binding.centralOrganisationId,
 localAccountId:binding.localAccountId,companyId:binding.companyId,state:"verified"}]);
 await seed("academyExternalIdentity",[{service:"titan-central",
 externalUserRef:issuer+"|"+id.subject,companyId:binding.companyId,userId:binding.userId}]);
}
export function makeDecide(overrides:Partial<CentralDecision>={}){
 return vi.fn(async(identity:VerifiedIdentity):Promise<TrustedDecisionEnvelope|null>=>{
  if(identity.subject!==id.subject||identity.issuer!==issuer)return null;
  return {issuer,subject:id.subject,decision:{...decision,...overrides}};
 });
}
export {fakePrisma,rows};
