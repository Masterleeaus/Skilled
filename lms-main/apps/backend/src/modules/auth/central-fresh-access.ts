/** Central authorization is never inferred from a prior cookie or a cache. */
import type {CentralDecision} from "./central-account-resolution";
import type {VerifiedIdentity,TrustedDecisionEnvelope} from "./central-verified-completion";
import type {SessionBinding} from "./central-session-store";
import {sameCentralDecision} from "./central-decision-compare";
export type CentralDecisionLookup=(identity:VerifiedIdentity)=>Promise<TrustedDecisionEnvelope|null>;
export type TrustedSubjectLookup=(binding:SessionBinding)=>Promise<VerifiedIdentity|null>;
export function createFreshCentralVerifier(options:{
 decide:CentralDecisionLookup;subjectForBinding:TrustedSubjectLookup;issuer:string;audience:string;
}){
 if(typeof options?.decide!=="function"||typeof options.subjectForBinding!=="function")
 throw TypeError("Authenticated Central decision and subject registry required");
 const subject=async(binding:SessionBinding)=>{
  const result=await options.subjectForBinding(binding);
  if(!result||result.issuer!==options.issuer||result.audience!==options.audience||
     result.applicationId!=="academy")return null;
  return result;
 };
 const retrieve=async(binding:SessionBinding)=>{
  const id=await subject(binding);if(!id)return null;
  const envelope=await options.decide(id);
  if(!envelope||envelope.issuer!==id.issuer||envelope.subject!==id.subject)return null;
  const decision=envelope.decision;
  if(!decision||decision.allowed!==true||decision.applicationId!=="academy"||
     decision.organisationId!==binding.centralOrganisationId||
     decision.localAccountId!==binding.localAccountId||decision.localUserId!==binding.userId)return null;
  return decision;
 };
 return {
  async verifyDecision(prior:CentralDecision,companyId:string){
   if(typeof companyId!=="string")return false;
   const binding={centralOrganisationId:prior.organisationId,localAccountId:prior.localAccountId,
    userId:prior.localUserId,companyId};
   const fresh=await retrieve(binding);
   return fresh!==null&&sameCentralDecision(prior,fresh);
  },
  async verifySession(binding:SessionBinding){return (await retrieve(binding))!==null;},
 };
}