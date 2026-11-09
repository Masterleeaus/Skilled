/** Resolve tenant strictly through a local verified organisation/account mapping. */
import type {PrismaClient} from "@prisma/client";
import type {CentralDecision} from "./central-account-resolution";
export function createCentralTenantResolver(db:Pick<PrismaClient,"centralCompanyLink">){
 return async(decision:CentralDecision):Promise<string|null>=>{
  if(!decision||decision.allowed!==true||decision.applicationId!=="academy")return null;
  const records=await db.centralCompanyLink.findMany({
   where:{centralOrganisationId:decision.organisationId,localAccountId:decision.localAccountId,state:"verified"},
   select:{companyId:true},take:2
  });
  return records.length===1?records[0].companyId:null;
 };
}