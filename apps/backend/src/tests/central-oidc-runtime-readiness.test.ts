import {describe,it,expect} from "vitest";
import {skilledOidcReadiness} from "../modules/auth/central-oidc-status";
const flags={databaseMigrationApplied:true,centralDecisionTransportVerified:true,
 proxyRateLimitsVerified:true,twoTenantRehearsalPassed:true};
describe("OIDC deployment readiness is separate from source compilation",()=>{
 it("cannot claim readiness with disabled config",()=>expect(skilledOidcReadiness(null,flags).ready).toBe(false));
 it.each(Object.keys(flags))("does not claim readiness missing %s",field=>{
  expect(skilledOidcReadiness({} as never,{...flags,[field]:false}).ready).toBe(false);
 });
 it("requires all explicit operator checks",()=>expect(skilledOidcReadiness({} as never,flags).ready).toBe(true));
});