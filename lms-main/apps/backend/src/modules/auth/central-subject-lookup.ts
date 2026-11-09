/** Company-scoped, operator-provisioned Central subject lookup. Never match email. */
import type {PrismaClient} from "@prisma/client";
import {externalCentralRef} from "./central-lms-contract";
import type {SessionBinding} from "./central-session-store";
export type CentralSubject={issuer:string;subject:string;audience:string;applicationId:"academy"};
const ID=/^[A-Za-z0-9:_-]{8,200}$/;
export function createScopedCentralSubjectLookup(db:Pick<PrismaClient,"academyExternalIdentity">,issuer:string,audience:string){
 const u=new URL(issuer);
 if(u.protocol!=="https:"||u.origin!==issuer||u.username||u.password||!ID.test(audience))
 throw TypeError("Trusted Central issuer and audience required");
 return async(binding:SessionBinding):Promise<CentralSubject|null>=>{
  if(!binding||![binding.userId,binding.companyId,binding.centralOrganisationId,binding.localAccountId].every(x=>typeof x==="string"&&ID.test(x)))return null;
  const identities=await db.academyExternalIdentity.findMany({
   where:{service:"titan-central",companyId:binding.companyId,userId:binding.userId},
   select:{externalUserRef:true},take:2
  });
  if(identities.length!==1)return null;
  const ref=identities[0].externalUserRef;
  if(!ref.startsWith(issuer+"|"))return null;
  const subject=ref.slice(issuer.length+1);
  if(externalCentralRef(issuer,subject)!==ref||!ID.test(subject))return null;
  return {issuer,subject,audience,applicationId:"academy"};
 };
}