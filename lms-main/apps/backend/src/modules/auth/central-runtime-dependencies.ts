/** The same verified Central dependencies protect initial login and ongoing sessions. */
import type {PrismaClient} from "@prisma/client";
import {createScopedCentralSubjectLookup} from "./central-subject-lookup";
import {createFreshCentralVerifier,type CentralDecisionLookup} from "./central-fresh-access";
import {createCentralTenantResolver} from "./central-runtime-tenant";
import {currentDecisionReader} from "./central-current-decision";
import {createPrismaCentralAccountReaders} from "./central-prisma-readers";
import {createSkilledCentralSessionStore} from "./central-session-store";
import {createCentralVerifiedHandoff} from "./central-verified-handoff";
export function createCentralRuntimeDependencies(options:{
 db:PrismaClient;issuer:string;audience:string;decide:CentralDecisionLookup;
 sessionTtlSeconds?:number;clock?:()=>Date;
}){
 const {db,issuer,audience,decide}=options;
 if(!db||typeof decide!=="function")throw TypeError("Central runtime requires trusted database and transport");
 const subjectForBinding=createScopedCentralSubjectLookup(db,issuer,audience);
 const fresh=createFreshCentralVerifier({subjectForBinding,decide,issuer,audience});
 const tenant=createCentralTenantResolver(db);
 const readers=createPrismaCentralAccountReaders(db,currentDecisionReader(tenant,fresh.verifyDecision));
 const sessions=createSkilledCentralSessionStore(db,fresh.verifySession,{
  ...(options.sessionTtlSeconds?{ttlSeconds:options.sessionTtlSeconds}:{}),
  ...(options.clock?{clock:options.clock}:{})
 });
 const handoff=createCentralVerifiedHandoff({issuer,audience,readers,issue:sessions.create,
  maxAgeSeconds:options.sessionTtlSeconds??3600});
 return {readers,sessions,handoff,fresh,subjectForBinding};
}