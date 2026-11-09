/** Operator readiness report exposes boolean capabilities, never values of credentials. */
import type {SkilledOidcConfig} from "./central-oidc-config";
export function skilledOidcReadiness(config:SkilledOidcConfig|null,flags:{
 databaseMigrationApplied:boolean;centralDecisionTransportVerified:boolean;
 proxyRateLimitsVerified:boolean;twoTenantRehearsalPassed:boolean;
}){
 const checks={
  enabled:config!==null,
  schema:flags.databaseMigrationApplied===true,
  centralTransport:flags.centralDecisionTransportVerified===true,
  proxy:flags.proxyRateLimitsVerified===true,
  tenants:flags.twoTenantRehearsalPassed===true,
 };
 return {ready:Object.values(checks).every(Boolean),checks};
}
