/** Resolve a Central identity only through an operator-provisioned,
 * product-local scoped identity. CompanyRef is LMS-owned; callers must
 * independently verify the Central company-to-LMS company relationship.
 */
export type CentralLmsSubject={issuer:string;subject:string;companyRef:string;verifiedAt:string};
export type CentralLmsAccount={userId:string;companyId:string;companyRef:string;role:'ADMIN'|'TEACHER'|'STUDENT';membershipRole:string};
const SUBJECT=/^[^\s\x00-\x1f\x7f]{1,256}$/u;
function verified(input:unknown,now:number):input is CentralLmsSubject{
 if(!input||typeof input!=='object'||Array.isArray(input))return false;
 const x=input as Record<string,unknown>;
 if(Object.keys(x).sort().join(',')!=='companyRef,issuer,subject,verifiedAt'||
 typeof x.issuer!=='string'||typeof x.subject!=='string'||!SUBJECT.test(x.subject)||
 typeof x.companyRef!=='string'||!SUBJECT.test(x.companyRef)||
 typeof x.verifiedAt!=='string'||!Number.isFinite(Date.parse(x.verifiedAt))||
 Math.abs(now-Date.parse(x.verifiedAt))>120000)return false;
 try{const u=new URL(x.issuer);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&
 (x.issuer===u.origin||x.issuer===u.href)}catch{return false}
}
export function createCentralLmsAccountResolver({
 database,resolveCompanyBinding,authoriseCentral,clock=()=>Date.now()
}:{
 database:{
  company:{findUnique:(q:unknown)=>Promise<any>};
  academyExternalIdentity:{findUnique:(q:unknown)=>Promise<any>};
  companyMember:{findUnique:(q:unknown)=>Promise<any>};
  user:{findUnique:(q:unknown)=>Promise<any>};
 };
 resolveCompanyBinding:(companyRef:string)=>Promise<string|null>;
 authoriseCentral:(identity:CentralLmsSubject)=>Promise<boolean>;
 clock?:()=>number;
}){
 if(!database?.company||!database?.academyExternalIdentity||!database?.companyMember||
 !database?.user||typeof resolveCompanyBinding!=='function'||typeof authoriseCentral!=='function')
 throw new TypeError('trusted LMS Central identity dependencies required');
 return async(input:unknown):Promise<CentralLmsAccount|null>=>{
  if(!verified(input,clock()))return null;
  try{
   const binding=await resolveCompanyBinding(input.companyRef);
   if(!binding||await authoriseCentral(input)!==true)return null;
   const company=await database.company.findUnique({where:{externalRef:input.companyRef},select:{id:true}});
   if(!company||company.id!==binding)return null;
   const identity=await database.academyExternalIdentity.findUnique({
    where:{service_externalUserRef:{service:'titan-central',externalUserRef:input.issuer+'|'+input.subject}},
    select:{userId:true,companyId:true}
   });
   if(!identity||identity.companyId!==company.id)return null;
   const member=await database.companyMember.findUnique({
    where:{companyId_userId:{companyId:company.id,userId:identity.userId}},select:{role:true}
   });
   if(!member||typeof member.role!=='string')return null;
   const user=await database.user.findUnique({where:{id:identity.userId},
    select:{id:true,role:true,isActive:true,isEmailVerified:true,deletedAt:true}});
   if(!user||!user.isActive||!user.isEmailVerified||user.deletedAt||!['ADMIN','TEACHER','STUDENT'].includes(user.role))return null;
   return {userId:user.id,companyId:company.id,companyRef:input.companyRef,role:user.role,membershipRole:member.role};
  }catch{return null}
 };
}
