/**
 * Trusted, unmounted Central OIDC completion handoff.
 * Call ONLY from a callback that validated OIDC signature/issuer/audience,
 * authorization code, PKCE, state and nonce. Never pass request.body here.
 */
import type { CentralDecision,SkilledCentralReaders } from "./central-account-resolution";
import { resolveSkilledCentralAccount } from "./central-account-resolution";
import type { SessionBinding } from "./central-session-store";
import { centralSessionSetCookie } from "./central-session-cookie";
type VerifiedOidc={issuer:string;subject:string;audience:string;applicationId:"academy"};
export type VerifiedCentralDecision={principal:VerifiedOidc;decision:CentralDecision};
export type CentralSessionIssue=(binding:SessionBinding)=>Promise<{token:string;expiresAt:Date}>;
const OPAQUE=/^[A-Za-z0-9:_-]{8,200}$/;
export function createCentralVerifiedHandoff(options:{
  issuer:string;audience:string;readers:SkilledCentralReaders;
  issue:CentralSessionIssue;maxAgeSeconds?:number;
}){
  const {issuer,audience,readers,issue}=options;
  if(typeof issuer!=="string"||!/^https:\/\/[^\s/?#]+$/.test(issuer)||
      typeof audience!=="string"||!OPAQUE.test(audience)||typeof issue!=="function"||
      !readers||typeof readers.isCentralAccessCurrent!=="function")
    throw new TypeError("Unverified Central integration configuration");
  return async(result:VerifiedCentralDecision)=>{
    const verified=result?.principal,decision=result?.decision;
    // This boundary checks the exact configured issuer and application;
    // the caller MUST cryptographically verify the token before calling.
    if(!verified||verified.issuer!==issuer||verified.audience!==audience||
        verified.applicationId!=="academy"||!OPAQUE.test(verified.subject)||
        !decision||decision.allowed!==true||decision.applicationId!=="academy")
      return null;
    const account=await resolveSkilledCentralAccount(decision,readers);
    if(!account)return null;
    const binding:SessionBinding={userId:account.userId,companyId:account.companyId,
      centralOrganisationId:decision.organisationId,localAccountId:decision.localAccountId};
    const established=await issue(binding);
    return {cookie:centralSessionSetCookie(established.token,options.maxAgeSeconds??3600),
      expiresAt:established.expiresAt,identity:account};
  };
}
