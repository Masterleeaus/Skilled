# LMS/Skilled — native Titan Central account adapter
Central issue #27 remains open until live LMS domain and application client
identity are independently verified. This pass adds exact, tenant-scoped
Central identity lookup to the existing LMS Prisma models and product-native
refresh-token session issuance. The trusted offline provisioning utility
supports `titan-central` as a separately audited external identity service.

`central-lms-link.ts` requires a verified Central issuer/subject, current
Central entitlement, one approved Central company-to-LMS `companyRef`
binding, an exact scoped `academyExternalIdentity` row, company member,
and active/verified LMS local learner. It never links by email.

`central-lms-session.ts` uses existing LMS refresh-token hashing and native
access JWT. An optional prior refresh credential is conditionally revoked
inside the same transaction as new refresh record issuance. Real application
middleware must still recheck current company membership on each scoped API.

This is a **disabled server-only component**. Do not mount a public
`/central/login` endpoint or accept these values from HTTP body/headers
until an independently verified OIDC PKCE callback, browser-binding state,
real company grants and product session cookies are connected and tested.
Preserve native login, machine credential allowlists and existing LMS
provisioning audit. No real LMS domain, credential or database was changed.
