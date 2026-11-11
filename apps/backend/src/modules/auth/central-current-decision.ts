/** Bind stale decision checks to an independently resolved, product-local company. */
import type {CentralDecision} from "./central-account-resolution";
import type {SkilledCentralReaders} from "./central-account-resolution";
export function currentDecisionReader(
 resolveCompany:(decision:CentralDecision)=>Promise<string|null>,
 verify:(decision:CentralDecision,companyId:string)=>Promise<boolean>
):SkilledCentralReaders["isCentralAccessCurrent"]{
 if(typeof resolveCompany!=="function"||typeof verify!=="function")throw TypeError("Current Central decision dependencies required");
 return async(decision)=>{
  if(!decision||decision.allowed!==true)return false;
  const companyId=await resolveCompany(decision);
  if(!companyId)return false;
  return verify(decision,companyId);
 };
}