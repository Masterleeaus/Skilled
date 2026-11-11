/** Prevent selecting a different principal between proof, decision, and session. */
import type {VerifiedIdentity,TrustedDecisionEnvelope} from "./central-verified-completion";
export function exactVerifiedEnvelope(identity:VerifiedIdentity,envelope:TrustedDecisionEnvelope|null){
 return !!identity&&!!envelope&&identity.applicationId==="academy"&&
  identity.issuer===envelope.issuer&&identity.subject===envelope.subject&&
  envelope.decision?.allowed===true&&envelope.decision.applicationId==="academy";
}