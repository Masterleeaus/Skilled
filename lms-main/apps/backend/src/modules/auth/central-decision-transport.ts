/** Unmounted server-to-server Central access-decision client (Central PR #68).
 * Contract: lms-main/docs/SKILLED-CENTRAL-DECISION-CLIENT.md, mirroring Central's
 * docs/SKILLED-SERVICE-DECISION-CONTRACT-PASS18.md.
 * TLS plus a server-held scoped credential; never accept a browser-supplied URL,
 * token, company, role, or decision. The credential and endpoint come only from operator configuration.
 * The client stays unmounted unless TITAN_SKILLED_DECISION_BEARER is set.
 */
import { randomBytes } from "node:crypto";
import type { CentralDecision } from "./central-account-resolution";
import type { VerifiedIdentity,TrustedDecisionEnvelope } from "./central-verified-completion";

const ID=/^[A-Za-z0-9:_-]{1,200}$/;
const REQUEST=/^[A-Za-z0-9_-]{32,128}$/;
const CENTRAL_ORG_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Path fixed by the Central contract. Any other path is refused at construction. */
export const CENTRAL_DECISION_PATH="/v1/integrations/academy/decision";
/** Operator configuration names. Nothing in a request, token or browser value can set these. */
export const CENTRAL_DECISION_ENV={bearer:"TITAN_SKILLED_DECISION_BEARER",endpoint:"TITAN_SKILLED_DECISION_ENDPOINT"} as const;

/** Maps a verified Central (Logto) organisation ID to the Central internal organisation UUID. Returns null when unmapped. */
export type CentralOrganisationResolver=(logtoOrganisationId:string)=>string|null;

export type CentralDecisionClient=(verified:VerifiedIdentity,logtoOrganisationId:string)=>Promise<TrustedDecisionEnvelope|null>;

type ClientConfig={
  endpoint:string; bearerToken:string; expectedIssuer:string; expectedAudience:string;
  resolveCentralOrganisationId:CentralOrganisationResolver;
  fetcher?:typeof fetch; timeoutMs?:number; generateRequestId?:()=>string;
};
function trustedEndpoint(value:string):boolean {
 try {
  const url=new URL(value);
  return url.protocol==="https:" && !url.username && !url.password &&
   !url.search && !url.hash && url.pathname===CENTRAL_DECISION_PATH && url.hostname.length>0 &&
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
  "membershipRevision","entitlementRevision","linkRevision"]) &&
  x.allowed===true && x.applicationId==="academy" &&
  [x.organisationId,x.localUserId,x.localAccountId].every(v=>typeof v==="string"&&ID.test(v)) &&
  [x.membershipRevision,x.entitlementRevision,x.linkRevision].every(v=>
   typeof v==="number"&&Number.isSafeInteger(v)&&v>=0);
}
/** Builds a one-to-one resolver from operator-provided pairs. Duplicates and malformed values fail at construction. */
export function createCentralOrganisationRegistry(
  pairs:ReadonlyArray<{logtoOrganisationId:string;centralOrganisationId:string}>,
):CentralOrganisationResolver {
 const byLogto=new Map<string,string>();
 const seenCentral=new Set<string>();
 for(const pair of pairs){
  if(!ID.test(pair.logtoOrganisationId)||!CENTRAL_ORG_UUID.test(pair.centralOrganisationId))
   throw new TypeError("Invalid Central organisation registry entry");
  if(byLogto.has(pair.logtoOrganisationId)||seenCentral.has(pair.centralOrganisationId.toLowerCase()))
   throw new TypeError("Duplicate Central organisation registry entry");
  byLogto.set(pair.logtoOrganisationId,pair.centralOrganisationId);
  seenCentral.add(pair.centralOrganisationId.toLowerCase());
 }
 return (logtoOrganisationId)=>byLogto.get(logtoOrganisationId)??null;
}
export function createAuthenticatedCentralDecisionClient(config:ClientConfig):CentralDecisionClient {
 if(!config||!trustedEndpoint(config.endpoint)||
    !ID.test(config.expectedAudience)||typeof config.expectedIssuer!=="string"||
    typeof config.resolveCentralOrganisationId!=="function"||
    typeof config.bearerToken!=="string"||
    config.bearerToken.length<32||config.bearerToken.length>1024||
    /[\r\n]/.test(config.bearerToken))throw new TypeError("Trusted Central endpoint and credential required");
 const timeoutMs=config.timeoutMs??4000;
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<500||timeoutMs>10000)
  throw new TypeError("Invalid Central decision timeout");
 const fetcher=config.fetcher??fetch;
 if(typeof fetcher!=="function")throw new TypeError("Trusted Central transport required");
 const nextId=config.generateRequestId??(()=>randomBytes(24).toString("base64url"));
 return async(verified,logtoOrganisationId)=>{
  if(!verified||verified.issuer!==config.expectedIssuer ||
     verified.audience!==config.expectedAudience || verified.applicationId!=="academy" ||
     typeof verified.subject!=="string"||!ID.test(verified.subject)||
     typeof logtoOrganisationId!=="string"||!ID.test(logtoOrganisationId))return null;
  // Fail closed before any network call when the organisation is not in the operator registry.
  let organisationId:string|null;
  try{organisationId=config.resolveCentralOrganisationId(logtoOrganisationId);}catch{return null;}
  if(typeof organisationId!=="string"||!CENTRAL_ORG_UUID.test(organisationId))return null;
  const requestId=nextId();
  if(typeof requestId!=="string"||!REQUEST.test(requestId))return null;
  let response:Response;
  try {
   response=await fetcher(config.endpoint,{
    method:"POST",redirect:"error",signal:AbortSignal.timeout(timeoutMs),
    headers:{"accept":"application/json","content-type":"application/json",
     "authorization":"Bearer "+config.bearerToken,"cache-control":"no-store"},
    body:JSON.stringify({applicationId:"academy",issuer:verified.issuer,
     subject:verified.subject,organisationId,requestId})
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
   // The decision is returned for the Logto organisation that was asked about, never for another one.
   if(envelope.decision.organisationId!==logtoOrganisationId)return null;
   return {issuer:verified.issuer,subject:verified.subject,decision:envelope.decision};
  }catch{return null;}
 };
}

/**
 * Builds the client from operator configuration only. Returns null (unmounted) when the credential is absent.
 * The caller supplies the trusted issuer, client ID and organisation registry; nothing is read from a request.
 */
export function loadCentralDecisionClientConfig(
  env:Readonly<Record<string,string|undefined>>,
  deps:{expectedIssuer:string;expectedAudience:string;resolveCentralOrganisationId:CentralOrganisationResolver;fetcher?:typeof fetch},
):CentralDecisionClient|null {
 const bearerToken=env[CENTRAL_DECISION_ENV.bearer];
 if(bearerToken===undefined||bearerToken==="")return null;
 const endpoint=env[CENTRAL_DECISION_ENV.endpoint];
 if(!endpoint)throw new TypeError(`${CENTRAL_DECISION_ENV.endpoint} is required when ${CENTRAL_DECISION_ENV.bearer} is set`);
 return createAuthenticatedCentralDecisionClient({
  endpoint,bearerToken,
  expectedIssuer:deps.expectedIssuer,expectedAudience:deps.expectedAudience,
  resolveCentralOrganisationId:deps.resolveCentralOrganisationId,fetcher:deps.fetcher,
 });
}
