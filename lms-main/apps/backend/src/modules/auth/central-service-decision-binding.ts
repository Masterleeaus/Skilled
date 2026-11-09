/** Single source for the Central server's new Academy decision contract. */
import type {PrismaClient} from "@prisma/client";
import {createAuthenticatedCentralDecisionClient} from "./central-decision-transport";
import {parseCentralOrganisationRegistry} from "./central-organisation-uuid-registry";
import {createCentralOrganisationSelector} from "./central-organisation-choice";
export function createSkilledCentralServiceDecision(input:{
 db:Pick<PrismaClient,"academyExternalIdentity"|"centralCompanyLink"|"companyMember">;
 endpoint:string;issuer:string;audience:string;serverCredential:string;
 centralOrganisationRegistryJson:string;fetcher?:typeof fetch;timeoutMs?:number;
}){
 if(!input||!input.db)throw TypeError("Central decision dependencies required");
 const registry=parseCentralOrganisationRegistry(input.centralOrganisationRegistryJson);
 const resolveCentralOrganisationId=createCentralOrganisationSelector(input.db,input.issuer,registry);
 return createAuthenticatedCentralDecisionClient({
  endpoint:input.endpoint,bearerToken:input.serverCredential,expectedIssuer:input.issuer,
  expectedAudience:input.audience,resolveCentralOrganisationId,
  ...(input.fetcher?{fetcher:input.fetcher}:{}),
  ...(input.timeoutMs?{timeoutMs:input.timeoutMs}:{})
 });
}
