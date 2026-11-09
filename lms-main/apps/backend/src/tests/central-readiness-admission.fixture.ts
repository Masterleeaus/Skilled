import {centralRuntimeEnabled,CENTRAL_RUNTIME_CHECK_NAMES} from "../modules/auth/central-runtime-feature";
export {centralRuntimeEnabled,CENTRAL_RUNTIME_CHECK_NAMES};
export const good=()=>({
 migrationVerified:true,oidcRegistrationVerified:true,centralTransportVerified:true,
 proxyVerified:true,tenantIsolationVerified:true,logoutRehearsed:true
});
export const without=(name:string)=>Object.fromEntries(Object.entries(good()).filter(([key])=>key!==name));
export const replace=(remove:string,add:string,value:unknown=true)=>({...without(remove),[add]:value});
