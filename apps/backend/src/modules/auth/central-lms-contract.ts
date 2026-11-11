/** Central/LMS tenant and identity mapping protocol, without implicit
 * email matching or global admin authority. Browser requests must not be
 * passed directly to these server-only functions.
 */
export const CENTRAL_LMS_SERVICE='titan-central' as const;
export type CentralLmsMapping={issuer:string;subject:string;companyRef:string;userId:string};
export function externalCentralRef(issuer:unknown,subject:unknown):string|null{
 if(typeof issuer!=='string'||typeof subject!=='string'||subject.length<1||subject.length>180||
 /[\s\p{Cc}|]/u.test(subject))return null;
 try{const url=new URL(issuer);if(url.protocol!=='https:'||url.username||url.password||
 url.search||url.hash||!(issuer===url.origin||issuer===url.href))return null}
 catch{return null}
 const full=issuer+'|'+subject;
 return full.length<=200?full:null;
}
export function validateCentralLmsBinding(binding:unknown):binding is CentralLmsMapping{
 if(!binding||typeof binding!=='object'||Array.isArray(binding))return false;
 const value=binding as Record<string,unknown>;
 return Object.keys(value).sort().join(',')==='companyRef,issuer,subject,userId'&&
 typeof value.companyRef==='string'&&value.companyRef.length>0&&value.companyRef.length<=200&&
 typeof value.userId==='string'&&value.userId.length>0&&value.userId.length<=200&&
 externalCentralRef(value.issuer,value.subject)!==null;
}
