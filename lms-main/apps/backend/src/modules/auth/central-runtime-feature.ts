/** Separate deployment admission. A set feature flag is insufficient by itself. */
export type CentralRuntimeChecks={
 migrationVerified:boolean;oidcRegistrationVerified:boolean;centralTransportVerified:boolean;
 proxyVerified:boolean;tenantIsolationVerified:boolean;logoutRehearsed:boolean;
};
export function centralRuntimeEnabled(flag:unknown,checks:CentralRuntimeChecks):boolean{
 return flag===true&&Object.values(checks).length===6&&Object.values(checks).every(value=>value===true);
}