# Field Services → Academy lesson context: draft-only sync

Status (static, unverified, 8 Nov 2026): this route is **not mounted** in `apps/backend/src`. The integration router exposes only the skills read route. `apps/backend/src/tests/integration/contract.test.ts` asserts this sync path is absent. The text below describes the intended contract, not a running endpoint.

Intended route: `POST /api/titan/integration/organisations/:externalOrganisationRef/business-fields/sync`. It would sit under the existing Titan integration router prefix. Use a **server-side** Field Services service credential provisioned for the exact external organisation reference, with headers `x-titan-service: field-services` and `Authorization: Bearer <secret>`.

```json
{"fields":[{"fieldKey":"equipment.primary_tool","value":"HEPA vacuum","sourceRecordRef":"equipment:102"},{"fieldKey":"business.support_phone","value":"+61 3 5555 0100","sourceRecordRef":"company:42"}]}
```

- Only registry fields in business, services, equipment, materials, safety, procedures, jobs, customers, quality, staff and compliance are accepted. Pricing, assessment and other sensitive fields are intentionally excluded.
- Requests are limited to 56 unique fields. Each must contain a source record reference. Unknown/duplicate keys are rejected before any writes.
- New fields are created as **DRAFT** and require an Academy manager to approve before learners can see them.
- Existing fields (including approved or manager-edited drafts) are never overwritten. Responses mark them `SKIPPED_EXISTING`. This avoids clobbering human-approved content. A subsequent manager edit must use the Academy management API.
- All changes are in one database transaction. The endpoint does **not** automatically pull data from Field Services; Field Services must send an authenticated push when its authoritative records change.
- The current API does not implement cross-service event replay protection or a Field Services webhook producer. Those require deployment-specific integration and live testing.
- This endpoint does not validate the truth of supplied operational values; managers remain responsible for review.

Test: `node apps/backend/scripts/verify-field-services-sync.mjs`. This is a source-contract test, **not** a database-backed integration test. Until the route exists, it exits 1 with the reason that the sync route is missing (static, unverified).
