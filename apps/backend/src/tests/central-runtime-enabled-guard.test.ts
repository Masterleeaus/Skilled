import {describe,it,expect} from "vitest";
import {centralRuntimeEnabled} from "../modules/auth/central-runtime-feature";
const good={migrationVerified:true,oidcRegistrationVerified:true,centralTransportVerified:true,
 proxyVerified:true,tenantIsolationVerified:true,logoutRehearsed:true};
describe("Central runtime activation requires operator evidence",()=>{
 it("flag alone does not activate",()=>expect(centralRuntimeEnabled(true,{...good,migrationVerified:false})).toBe(false));
 it.each(Object.keys(good))("denies unset %s",k=>expect(centralRuntimeEnabled(true,{...good,[k]:false})).toBe(false));
 it("all checks still require explicit true flag",()=>expect(centralRuntimeEnabled(false,good)).toBe(false));
});