/** Unmounted trust boundary: OIDC verification -> server-authenticated Central decision -> local session.
 * Browser claims, IDs and decisions are never accepted as authorization authority.
 */
import {createCentralVerifiedHandoff, type VerifiedCentralDecision} from "./central-verified-handoff";
import type {SkilledCentralReaders,CentralDecision} from "./central-account-resolution";
import type {SessionBinding} from "./central-session-store";
export type VerifiedIdentity = {issuer:string;subject:string;audience:string;applicationId:"academy"};
export type TrustedDecisionEnvelope = {
  issuer:string;subject:string;decision:CentralDecision;
};
/** Client MUST use authenticated server-to-server transport and check fresh revisions.
 * Caller cannot substitute a browser-provided decision or email-derived mapping.
 */
export function createCentralVerifiedCompletion(input:{
  oidc:{complete:(data:{state:string;code:string;browserBinding:string})=>Promise<VerifiedIdentity>};
  decide:(identity:VerifiedIdentity)=>Promise<TrustedDecisionEnvelope|null>;
  issuer:string;audience:string;readers:SkilledCentralReaders;
  issue:(binding:SessionBinding)=>Promise<{token:string;expiresAt:Date}>;
}) {
  if(!input || typeof input.oidc?.complete!=="function" || typeof input.decide!=="function")
    throw new TypeError("Verified Central OIDC and authenticated decision transport required");
  const handoff=createCentralVerifiedHandoff(input);
  return async(data:{state:string;code:string;browserBinding:string})=>{
    try {
      const principal=await input.oidc.complete(data);
      if(!principal || principal.issuer!==input.issuer||principal.audience!==input.audience||
         principal.applicationId!=="academy"||typeof principal.subject!=="string"||
         !/^[A-Za-z0-9:_-]{8,200}$/.test(principal.subject))return null;
      const result=await input.decide(principal);
      if(!result || result.issuer!==principal.issuer ||result.subject!==principal.subject)
        return null;
      // The old handoff verifies local membership, mapping, active account, and Central revisions.
      // All trust fields here derive from two server-only checks; never from a web request.
      return await handoff({principal,decision:result.decision} as VerifiedCentralDecision);
    }catch {
      // Do not disclose whether the OIDC subject, tenant, or local account exists.
      return null;
    }
  };
}
