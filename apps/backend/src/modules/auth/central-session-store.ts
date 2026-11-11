/**
 * Revocable Skilled-local session storage for a future verified Central OIDC handoff.
 *
 * NOT mounted on HTTP routes. Creation is permitted only after
 * resolveSkilledCentralAccount and a trusted Central decision.
 * Sessions use random opaque tokens with SHA-256 hashes stored in PostgreSQL.
 * They are independent of existing password-login JWT/refresh credentials.
 */
import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { SkilledCentralAccount } from "./central-account-resolution";

export type SessionBinding = {
  userId: string;
  companyId: string;
  centralOrganisationId: string;
  localAccountId: string;
};
export type SessionIdentity = SkilledCentralAccount & Pick<SessionBinding,"centralOrganisationId"|"localAccountId">;
type Db=Pick<PrismaClient,"skilledCentralSession"|"centralCompanyLink"|"companyMember"|"user"|"$transaction">;
export type CentralSessionVerifier = (binding: SessionBinding)=>Promise<boolean>;
const opaque=/^[A-Za-z0-9:_-]{8,200}$/;
const ttlMax=86400;
export class CentralSessionDenied extends Error {
  constructor(readonly code: "INVALID_INPUT"|"NOT_AUTHORISED"|"SESSION_UNAVAILABLE"){
    super("Skilled Central session unavailable");
    this.name="CentralSessionDenied";
  }
}
export function centralSessionDigest(raw:string):string{
  return createHash("sha256").update(raw,"utf8").digest("hex");
}
function validBinding(v:unknown):v is SessionBinding{
  if(!v||typeof v!=="object"||Array.isArray(v))return false;
  const p=v as Record<string,unknown>;
  return ["userId","companyId","centralOrganisationId","localAccountId"]
    .every(key=>typeof p[key]==="string"&&opaque.test(p[key]));
}
function validRaw(raw:unknown):raw is string{
  return typeof raw==="string"&&/^[A-Za-z0-9_-]{43,128}$/.test(raw);
}
async function bindingIsCurrent(db:Db,binding:SessionBinding,verifyCentral:CentralSessionVerifier){
  const [links,user,member]=await Promise.all([
    db.centralCompanyLink.findMany({
      where:{centralOrganisationId:binding.centralOrganisationId,
        localAccountId:binding.localAccountId,companyId:binding.companyId,state:"verified"},
      select:{id:true},take:2,
    }),
    db.user.findUnique({where:{id:binding.userId},
      select:{id:true,role:true,isActive:true,isEmailVerified:true,deletedAt:true}}),
    db.companyMember.findUnique({where:{companyId_userId:{
      companyId:binding.companyId,userId:binding.userId}},select:{id:true}}),
  ]);
  if(links.length!==1 || !member || !user || !user.isActive || !user.isEmailVerified || user.deletedAt)return null;
  // Revalidate trusted Central membership, entitlement and link status per access.
  if(!await verifyCentral(binding))return null;
  return {userId:user.id,companyId:binding.companyId,role:user.role,
    centralOrganisationId:binding.centralOrganisationId,localAccountId:binding.localAccountId};
}
export function createSkilledCentralSessionStore(db:Db, verifyCentral:CentralSessionVerifier,
  options:{clock?:()=>Date;randomToken?:()=>string;ttlSeconds?:number}={}){
  const ttl=options.ttlSeconds??3600;
  if(typeof verifyCentral!=="function"||!Number.isSafeInteger(ttl)||ttl<60||ttl>ttlMax)
    throw new CentralSessionDenied("INVALID_INPUT");
  const clock=options.clock??(()=>new Date());
  const randomToken=options.randomToken??(()=>randomBytes(48).toString("base64url"));
  const check=async(binding:SessionBinding)=>{
    const current=await bindingIsCurrent(db,binding,verifyCentral);
    if(!current)throw new CentralSessionDenied("NOT_AUTHORISED");
    return current;
  };
  async function create(binding:SessionBinding,previousToken?:string){
    if(!validBinding(binding)||(previousToken!==undefined&&!validRaw(previousToken)))
      throw new CentralSessionDenied("INVALID_INPUT");
    await check(binding);
    const raw=randomToken();
    if(!validRaw(raw))throw new CentralSessionDenied("SESSION_UNAVAILABLE");
    const now=clock();
    if(!Number.isFinite(now.getTime()))throw new CentralSessionDenied("SESSION_UNAVAILABLE");
    const tokenHash=centralSessionDigest(raw);
    const expiresAt=new Date(now.getTime()+ttl*1000);
    await db.$transaction(async(tx)=>{
      if(previousToken){
        const consumed=await tx.skilledCentralSession.updateMany({
          where:{tokenHash:centralSessionDigest(previousToken),revokedAt:null,expiresAt:{gt:now},
            userId:binding.userId,companyId:binding.companyId,
            centralOrganisationId:binding.centralOrganisationId,localAccountId:binding.localAccountId},
          data:{revokedAt:now},
        });
        if(consumed.count!==1)throw new CentralSessionDenied("NOT_AUTHORISED");
      }
      await tx.skilledCentralSession.create({data:{tokenHash,...binding,expiresAt}});
    });
    return {token:raw,expiresAt};
  }
  async function authenticate(token:unknown):Promise<SessionIdentity|null>{
    if(!validRaw(token))return null;
    const now=clock();
    if(!Number.isFinite(now.getTime()))return null;
    const record=await db.skilledCentralSession.findUnique({
      where:{tokenHash:centralSessionDigest(token)},
      select:{id:true,userId:true,companyId:true,centralOrganisationId:true,
        localAccountId:true,revokedAt:true,expiresAt:true},
    });
    if(!record||record.revokedAt||record.expiresAt<=now)return null;
    const binding:SessionBinding={userId:record.userId,companyId:record.companyId,
      centralOrganisationId:record.centralOrganisationId,localAccountId:record.localAccountId};
    const current=await bindingIsCurrent(db,binding,verifyCentral);
    if(!current)return null;
    // Conditional update refuses sessions revoked during the asynchronous Central check.
    const renewed=await db.skilledCentralSession.updateMany({
      where:{id:record.id,revokedAt:null,expiresAt:{gt:clock()}},
      data:{lastUsedAt:clock()},
    });
    return renewed.count===1?current:null;
  }
  async function revoke(token:unknown){
    if(!validRaw(token))return false;
    const result=await db.skilledCentralSession.updateMany({
      where:{tokenHash:centralSessionDigest(token),revokedAt:null},data:{revokedAt:clock()},
    });
    return result.count===1;
  }
  async function revokeUser(userId:string){
    if(!opaque.test(userId))throw new CentralSessionDenied("INVALID_INPUT");
    const changed=await db.skilledCentralSession.updateMany({
      where:{userId,revokedAt:null},data:{revokedAt:clock()},
    });
    return changed.count;
  }
  async function revokeCompany(companyId:string){
    if(!opaque.test(companyId))throw new CentralSessionDenied("INVALID_INPUT");
    const changed=await db.skilledCentralSession.updateMany({
      where:{companyId,revokedAt:null},data:{revokedAt:clock()},
    });
    return changed.count;
  }
  return {create,authenticate,revoke,revokeUser,revokeCompany};
}
