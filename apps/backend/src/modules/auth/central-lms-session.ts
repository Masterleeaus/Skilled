/** Revocable LMS-native refresh session issuance after trusted Central
 * identity resolution. This does NOT accept browser-supplied identifiers.
 * This is a composition function; it is not exposed as an HTTP endpoint.
 */
import {generateRefreshToken,refreshExpiryDate,signAccessToken} from './token.utils';
import type {Role} from '@prisma/client';
import type {CentralLmsAccount} from './central-lms-link';
export function createCentralLmsSessionIssuer({
 resolve,transaction
}:{
 resolve:(input:unknown)=>Promise<CentralLmsAccount|null>;
 transaction:(create:(tx:{refreshToken:{updateMany:(v:unknown)=>Promise<unknown>;create:(v:unknown)=>Promise<unknown>}})=>Promise<void>)=>Promise<void>;
}){
 if(typeof resolve!=='function'||typeof transaction!=='function')
 throw new TypeError('trusted LMS session storage required');
 return async(selection:unknown,previousRefreshId?:string)=>{
  const account=await resolve(selection);
  if(!account)return null;
  const credential=generateRefreshToken();
  try{
   await transaction(async(tx)=>{
    if(previousRefreshId){
     const consumed=await tx.refreshToken.updateMany({
      where:{id:previousRefreshId,userId:account.userId,isRevoked:false,expiresAt:{gt:new Date()}},
      data:{isRevoked:true}
     }) as {count:number};
     if(consumed.count!==1)throw new Error('previous LMS refresh session not revocable');
    }
    await tx.refreshToken.create({data:{
     userId:account.userId,tokenHash:credential.hash,
     deviceInfo:'titan-central-sso:'+account.companyId,expiresAt:refreshExpiryDate()
    }});
   });
   // LMS access JWT is user-based; all company-scoped API operations must
   // recheck membership and resolve companyRef from current DB state.
   return {accessToken:signAccessToken({userId:account.userId,role:account.role as Role}),
    refreshToken:credential.raw,companyId:account.companyId,companyRef:account.companyRef};
  }catch{return null}
 };
}
