/** Single source for the Central server's new Academy decision contract. */
import type {PrismaClient} from "@prisma/client";
import {createAuthenticatedCentralDecisionClient,createCentralOrganisationRegistry} from "./central-decision-transport";
import type {VerifiedIdentity} from "./central-verified-completion";
import {parseCentralOrganisationRegistry} from "./central-organisation-uuid-registry";
import {createCentralOrganisationSelector} from "./central-organisation-choice";
export function createSkilledCentralServiceDecision(input:{
 db:Pick<PrismaClient,"academyExternalIdentity"|"centralCompanyLink"|"companyMember">;
 endpoint:string;issuer:string;audience:string;serverCredential:string;
 centralOrganisationRegistryJson:string;fetcher?:typeof fetch;timeoutMs?:number;
}){
 if(!input||!input.db)throw TypeError("Central decision dependencies required");
 const registry=parseCentralOrganisationRegistry(input.centralOrganisationRegistryJson);
 const selectCentralOrganisationId=createCentralOrganisationSelector(input.db,input.issuer,registry);
 const resolveCentralOrganisationId=createCentralOrganisationRegistry([...registry].map(([logtoOrganisationId,centralOrganisationId])=>({logtoOrganisationId,centralOrganisationId})));
 const logtoByCentral=new Map([...registry].map(([logto,central])=>[central,logto]));
 const transport=createAuthenticatedCentralDecisionClient({
  endpoint:input.endpoint,bearerToken:input.serverCredential,expectedIssuer:input.issuer,
  expectedAudience:input.audience,resolveCentralOrganisationId,
  ...(input.fetcher?{fetcher:input.fetcher}:{}),
  ...(input.timeoutMs?{timeoutMs:input.timeoutMs}:{})
 });
 return async(identity:VerifiedIdentity)=>{
  try{
   const centralId=await selectCentralOrganisationId(identity);
   const logtoId=centralId===null?undefined:logtoByCentral.get(centralId);
   if(!logtoId)return null;
   return await transport(identity,logtoId);
  }catch{return null;}
 };
}
