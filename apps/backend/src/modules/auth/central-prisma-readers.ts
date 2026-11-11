/**
 * Prisma-backed local Central company/account reader.
 * Central access verification is an injected authenticated server-side dependency:
 * never accept a caller's unauthenticated "allowed":true claim as authority.
 */
import type { PrismaClient } from "@prisma/client";
import type { CentralDecision, SkilledCentralReaders } from "./central-account-resolution";
import type { SkilledLocalLinkAuthority } from "./central-link-assertion";

type CentralCurrent = (decision: CentralDecision) => Promise<boolean>;
type Db = Pick<PrismaClient, "centralCompanyLink" | "companyMember" | "user">;

export function createPrismaCentralAccountReaders(
  db: Db, verifyCentralAccess: CentralCurrent,
): SkilledCentralReaders {
  if (typeof verifyCentralAccess!=="function") throw new TypeError("verified Central access reader is required");
  return {
    isCentralAccessCurrent: verifyCentralAccess,
    async findMappings(centralOrganisationId, localUserId, localAccountId) {
      const matches=await db.centralCompanyLink.findMany({
        where:{centralOrganisationId,localAccountId,state:"verified"},
        select:{centralOrganisationId:true,localAccountId:true,companyId:true,state:true},
        take:2,
      });
      // Do not derive company/account membership from a Central claim alone.
      const result=[];
      for(const link of matches){
        const member=await db.companyMember.findUnique({
          where:{companyId_userId:{companyId:link.companyId,userId:localUserId}},
          select:{id:true},
        });
        if(member)result.push({
          centralOrganisationId:link.centralOrganisationId,
          companyId:link.companyId,
          localAccountId:link.localAccountId,
          localUserId,
          status:"verified" as const,
        });
      }
      return result;
    },
    async findUser(userId) {
      return db.user.findUnique({
        where:{id:userId},
        select:{id:true,role:true,isActive:true,isEmailVerified:true,deletedAt:true},
      });
    },
    async isMember(companyId,userId) {
      const match=await db.companyMember.findUnique({
        where:{companyId_userId:{companyId,userId}},select:{id:true},
      });
      return match!==null;
    },
  };
}

export function createPrismaSkilledLinkAuthority(db: Db): SkilledLocalLinkAuthority {
  return {
    async centralOrganisationMapsToCompany(logtoOrganisationId,companyId) {
      const matches=await db.centralCompanyLink.findMany({
        where:{centralOrganisationId:logtoOrganisationId,companyId,state:"verified"},
        select:{id:true},take:2,
      });
      return matches.length===1;
    },
    async localAccountBelongsToUser(accountId,userId,companyId) {
      const matches=await db.centralCompanyLink.findMany({
        where:{localAccountId:accountId,companyId,state:"verified"},
        select:{id:true},take:2,
      });
      if(matches.length!==1)return false;
      return Boolean(await db.companyMember.findUnique({
        where:{companyId_userId:{companyId,userId}},select:{id:true},
      }));
    },
    async activeVerifiedMember(userId,companyId) {
      const user=await db.user.findUnique({
        where:{id:userId},select:{id:true,isActive:true,isEmailVerified:true,deletedAt:true},
      });
      if(!user || !user.isActive || !user.isEmailVerified || user.deletedAt)return false;
      return Boolean(await db.companyMember.findUnique({
        where:{companyId_userId:{companyId,userId}},select:{id:true},
      }));
    },
  };
}
