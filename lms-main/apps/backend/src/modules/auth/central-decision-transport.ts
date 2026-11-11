/** Unmounted server-to-server Central access-decision client.
 * API contract REQUIRES matching authenticated Central endpoint implementation.
 * TLS plus a server-held scoped credential; never accept a browser-supplied URL,
 * token, company, role, or decision. No production endpoint is configured here.
 */
import { randomBytes } from "node:crypto";
import type { CentralDecision } from "./central-account-resolution";
import type { VerifiedIdentity,TrustedDecisionEnvelope } from "./central-verified-completion";

const ID=/^[A-Za-z0-9:_-]{1,200}$/;
const REQUEST=/^[A-Za-z0-9_-]{32,128}$/;
const CENTRAL_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type ClientConfig={
  endpoint:string; bearerToken:string; expectedIssuer:string; expectedAudience:string;
  fetcher?:typeof fetch; timeoutMs?:number; generateRequestId?:()=>string;
  /** Required by Central service decision v1. Never supplied by a browser. */
  resolveCentralOrganisationId?:(verified:VerifiedIdentity)=>Promise<string|null>;
};
function trustedEndpoint(value:string):boolean {
 try {
  const url=new URL(value);
  return url.protocol==="https:" && !url.username && !url.password &&
   !url.search && !url.hash && url.pathname!=="/" && url.hostname.length>0 &&
   value===url.href;
 }catch{return false;}
}
function exactKeys(value:Record<string,unknown>,fields:string[]):boolean {
 return Object.keys(value).sort().join("|")===fields.sort().join("|");
}
function boundedDecision(value:unknown):value is CentralDecision {
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const x=value as Record<string,unknown>;
 return exactKeys(x,["allowed","applicationId","organisationId","localUserId","localAccountId",
  "membershipRevision","entitlementRevision","linkRevision",...(Object.hasOwn(x,"expiresAt")?["expiresAt"]:[])]) &&
  x.allowed===true && x.applicationId==="academy" &&
  [x.organisationId,x.localUserId,x.localAccountId].every(v=>typeof v==="string"&&ID.test(v)) &&
  [x.membershipRevision,x.entitlementRevision,x.linkRevision].every(v=>
   typeof v==="number"&&Number.isSafeInteger(v)&&v>=0) &&
  (!Object.hasOwn(x,"expiresAt") || validDecisionExpiry(x.expiresAt));
}
/** Central issues short-lived decisions; reject malformed, expired, or excessively long grants. */
function validDecisionExpiry(value:unknown):boolean {
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))return false;
 const expiry=Date.parse(value),now=Date.now();
 return Number.isFinite(expiry)&&expiry>now&&expiry-now<=300_000;
}
export function createAuthenticatedCentralDecisionClient(config:ClientConfig):
  (verified:VerifiedIdentity)=>Promise<TrustedDecisionEnvelope|null> {
 if(!config||!trustedEndpoint(config.endpoint)||!trustedEndpoint(config.expectedIssuer+"/decision")||
    !ID.test(config.expectedAudience)||typeof config.bearerToken!=="string"||
    config.bearerToken.length<32||config.bearerToken.length>1024||
    /[\r\n]/.test(config.bearerToken))throw new TypeError("Trusted Central endpoint and credential required");
 const timeoutMs=config.timeoutMs??4000;
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<500||timeoutMs>10000)
  throw new TypeError("Invalid Central decision timeout");
 const fetcher=config.fetcher??fetch;
 if(typeof fetcher!=="function")throw new TypeError("Trusted Central transport required");
 const nextId=config.generateRequestId??(()=>randomBytes(24).toString("base64url"));
 return async(verified)=>{
  if(!verified||verified.issuer!==config.expectedIssuer ||
     verified.audience!==config.expectedAudience || verified.applicationId!=="academy" ||
     typeof verified.subject!=="string"||!ID.test(verified.subject))return null;
  const requestId=nextId();
  if(typeof requestId!=="string"||!REQUEST.test(requestId))return null;
  // The legacy client may omit this for older unit contracts; the new Central
  // service endpoint mandates a privately resolved internal organisation UUID.
  let organisationId:string|undefined;
  if(config.resolveCentralOrganisationId){
   try{const selected=await config.resolveCentralOrganisationId(verified);
    if(typeof selected!=="string"||!CENTRAL_UUID.test(selected))return null;
    organisationId=selected;
   }catch{return null;}
  }
  let response:Response;
  try {
   response=await fetcher(config.endpoint,{
    method:"POST",redirect:"error",signal:AbortSignal.timeout(timeoutMs),
    headers:{"accept":"application/json","content-type":"application/json",
     "authorization":"Bearer "+config.bearerToken,"cache-control":"no-store"},
    body:JSON.stringify({applicationId:"academy",issuer:verified.issuer,
     subject:verified.subject,requestId,...(organisationId?{organisationId}:{})})
   });
   if(!response.ok||response.redirected||response.status!==200||
      response.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json")return null;
   const raw=await response.text();
   if(Buffer.byteLength(raw,"utf8")>16384)return null;
   const parsed:unknown=JSON.parse(raw);
   if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return null;
   const envelope=parsed as Record<string,unknown>;
   if(!exactKeys(envelope,["issuer","subject","requestId","decision"])||
      envelope.issuer!==verified.issuer || envelope.subject!==verified.subject ||
      envelope.requestId!==requestId || !boundedDecision(envelope.decision))return null;
   const {expiresAt: _expiresAt,...bounded}=envelope.decision as CentralDecision & {expiresAt?:string};
   return {issuer:verified.issuer,subject:verified.subject,decision:bounded};
  }catch{return null;}
 };
}
