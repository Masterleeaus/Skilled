import {vi} from "vitest";
import {createCentralVerifiedCompletion} from "../modules/auth/central-verified-completion";
export const principal={issuer:"https://id.example.test",subject:"central-user-0001",audience:"skilled-app",applicationId:"academy" as const};
export const decision={allowed:true as const,applicationId:"academy" as const,organisationId:"central-org-a",localUserId:"user-a",localAccountId:"account-a",membershipRevision:1,entitlementRevision:1,linkRevision:1};
export const token="t".repeat(64);
export function harness() {
 const oidc={complete:vi.fn(async()=>({...principal}))};
 const decide=vi.fn(async()=>({issuer:principal.issuer,subject:principal.subject,decision:{...decision}}));
 const readers={
  isCentralAccessCurrent:vi.fn(async()=>true),
  findMappings:vi.fn(async()=>[{centralOrganisationId:"central-org-a",localUserId:"user-a",localAccountId:"account-a",companyId:"company-a",status:"verified" as const}]),
  findUser:vi.fn(async()=>({id:"user-a",role:"STUDENT" as "ADMIN"|"TEACHER"|"STUDENT",isActive:true,isEmailVerified:true,deletedAt:null as Date|null})),
  isMember:vi.fn(async()=>true)
 };
 const issue=vi.fn(async()=>({token,expiresAt:new Date(Date.now()+3600000)}));
 const make=()=>createCentralVerifiedCompletion({oidc,decide,issuer:principal.issuer,audience:principal.audience,readers,issue});
 const callback={state:"s".repeat(43),code:"authorization-code",browserBinding:"b".repeat(43)};
 return {oidc,decide,readers,issue,make,callback};
}
