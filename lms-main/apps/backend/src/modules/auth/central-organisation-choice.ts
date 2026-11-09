/** A verified OIDC subject may map to only one tenant without explicit choice. */
import type {PrismaClient} from "@prisma/client";
import type {VerifiedIdentity} from "./central-verified-completion";
import {externalCentralRef} from "./central-lms-contract";
const OPAQUE=/^[A-Za-z0-9:_-]{8,200}$/;
export function createCentralOrganisationSelector(
 db:Pick<PrismaClient,"academyExternalIdentity"|"centralCompanyLink"|"companyMember">,
 issuer:string,uuidRegistry:ReadonlyMap<string,string>){
 if(typeof issuer!=="string"||!issuer.startsWith("https://")||!(uuidRegistry instanceof Map))
  throw TypeError("Trusted Central organisation selector required");
 return async(identity:VerifiedIdentity):Promise<string|null>=>{
  if(!identity||identity.issuer!==issuer||identity.applicationId!=="academy"||
   typeof identity.subject!=="string"||!OPAQUE.test(identity.subject))return null;
  const externalUserRef=externalCentralRef(issuer,identity.subject);
  const rows=await db.academyExternalIdentity.findMany({
   where:{service:"titan-central",externalUserRef,companyId:{not:null}},
   select:{companyId:true,userId:true},take:3,
  });
  if(rows.length!==1||!rows[0].companyId)return null;
  const companyId=rows[0].companyId;
  const [member,links]=await Promise.all([
   db.companyMember.findUnique({where:{companyId_userId:{companyId,userId:rows[0].userId}},select:{id:true}}),
   db.centralCompanyLink.findMany({where:{companyId,state:"verified"},
    select:{centralOrganisationId:true},take:2}),
  ]);
  if(!member||links.length!==1)return null;
  return uuidRegistry.get(links[0].centralOrganisationId)??null;
 };
}
