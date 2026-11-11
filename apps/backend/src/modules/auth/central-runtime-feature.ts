/** Explicit deployment admission: no feature flag or an arbitrary list of six values is evidence.
 * Reject inherited, computed, extra, missing and non-boolean operator checks.
 * This remains an offline predicate, not proof that any check was performed.
 */
export type CentralRuntimeChecks={
 migrationVerified:boolean;oidcRegistrationVerified:boolean;centralTransportVerified:boolean;
 proxyVerified:boolean;tenantIsolationVerified:boolean;logoutRehearsed:boolean;
};
export const CENTRAL_RUNTIME_CHECK_NAMES=Object.freeze([
 "migrationVerified","oidcRegistrationVerified","centralTransportVerified",
 "proxyVerified","tenantIsolationVerified","logoutRehearsed"
] as const);
const exactNames=new Set<string>(CENTRAL_RUNTIME_CHECK_NAMES);
export function centralRuntimeEnabled(flag:unknown,checks:unknown):boolean{
 if(flag!==true||checks===null||typeof checks!=="object"||Array.isArray(checks))return false;
 try{
  const object=checks as Record<string,unknown>;
  if(Object.getPrototypeOf(object)!==Object.prototype&&Object.getPrototypeOf(object)!==null)return false;
  if(Reflect.ownKeys(object).length!==CENTRAL_RUNTIME_CHECK_NAMES.length)return false;
  const descriptors=Object.getOwnPropertyDescriptors(object);
  return Reflect.ownKeys(descriptors).every(key=>typeof key==="string"&&exactNames.has(key))&&
   CENTRAL_RUNTIME_CHECK_NAMES.every(key=>Object.hasOwn(descriptors,key)&&
    Object.hasOwn(descriptors[key],"value")&&descriptors[key].value===true);
 }catch{return false;}
}
