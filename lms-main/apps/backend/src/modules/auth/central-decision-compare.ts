/** Exact revisions, user/account/company authority: no stale positive decision. */
import type {CentralDecision} from "./central-account-resolution";
const ID=/^[A-Za-z0-9:_-]{1,200}$/;
export function sameCentralDecision(a:CentralDecision,b:CentralDecision):boolean{
 return !!a&&!!b&&a.allowed===true&&b.allowed===true&&
  a.applicationId==="academy"&&b.applicationId==="academy"&&
  [a.organisationId,a.localAccountId,a.localUserId,b.organisationId,b.localAccountId,b.localUserId]
   .every(v=>typeof v==="string"&&ID.test(v))&&
  a.organisationId===b.organisationId&&a.localAccountId===b.localAccountId&&a.localUserId===b.localUserId&&
  ["membershipRevision","entitlementRevision","linkRevision"].every(k=>{
   const x=a[k as keyof CentralDecision],y=b[k as keyof CentralDecision];
   return Number.isSafeInteger(x)&&Number(x)>=0&&x===y;
  });
}