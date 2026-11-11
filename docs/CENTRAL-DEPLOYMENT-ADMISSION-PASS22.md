# Central SSO deployment admission hardening — Pass 22

The runtime feature gate previously evaluated `Object.values(checks).length === 6` and required those six values to equal `true`. Six arbitrary fields could therefore substitute for the six actual readiness checks. This pass replaces count-only checking with an exact, own-property schema.

## Contract

The optional Central runtime remains **off by default**. An explicit boolean `true` feature flag and six correctly named, literal boolean `true` checks are necessary: `migrationVerified`, `oidcRegistrationVerified`, `centralTransportVerified`, `proxyVerified`, `tenantIsolationVerified`, and `logoutRehearsed`. Missing, extra, replaced, inherited, symbol-key, computed/getter and malformed values fail closed. No evaluated getter is allowed to assert deployment readiness.

The predicate accepts ordinary own-data objects and null-prototype own-data objects, but not arbitrary class instances. The predicate is not itself verification evidence: **operators must separately prove each check with a real provider, migration, credential, proxy and staging record.** There is no new enabling switch and no production router is mounted by this change.

## Validation

Nineteen distinct adversarial tests and the prior activation guard tests run under the dedicated GitHub CI workflow. Tests cover explicit true, false/omitted/string/number feature flags, unknown/extra/missing/substituted fields, truthy nonbooleans, inherited keys, non-enumerable true data, symbol injection, accessor execution, malicious proxies and incorrect object types. The same workflow typechecks backend source and the isolated admission suite.

The current Central SSO provider contract and server-to-server Central authorization endpoint have **not** been verified live. No production SSO, user privileges, tenant mapping, course content or human assessments are changed. Issues #71 and #68 remain open and the curriculum publication gate remains in force.
