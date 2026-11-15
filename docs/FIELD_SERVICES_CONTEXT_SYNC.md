# Field Services → Academy lesson context: draft-only sync

> **Not part of this release.** The Field Services sync is not implemented and is not shipped in this release (tracked in issue #165). Nothing below runs in production. The route is absent, and the UI does not sync data from Field Services. This document is a design contract for future work only.

Status (static, unverified, 8 Nov 2026): this route is **not mounted** in `apps/backend/src`. The integration router exposes only the skills read route. `apps/backend/src/tests/integration/contract.test.ts` asserts this sync path is absent. The text below describes the intended contract, not a running endpoint.

Skip decision (#165): DEFERRED. The route is intentionally not implemented. It needs owner decisions on the response and error shapes, and cross-service work on the Field Services push producer, before it can be built and tested. See "Owner decisions required" at the end of this document. The skipped test in `contract.test.ts` stays skipped until those decisions are recorded.

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

Test: `node apps/backend/scripts/verify-field-services-sync.mjs`. This is a source-contract test, **not** a database-backed integration test. While the route is missing and the skip decision above is recorded as DEFERRED, it prints an explicit `SKIP` block with the owner decisions and exits 0. If the route is missing and that decision is not recorded, it exits 1.

## Owner decisions required (issue #165)

The route is not built until the owner records these:

1. **Success response shape.** The doc says per-field results are reported and existing fields are marked `SKIPPED_EXISTING`, but it does not define the body (for example per-field `status`, counts, or the list of written field keys).
2. **Error response shapes.** Status codes and messages for unknown or non-registry keys, duplicate keys, more than 56 fields, a missing `sourceRecordRef`, and an invalid body are not defined. The existing integration router uses `{ message }` bodies; confirm that style.
3. **Partial failure.** The doc says one transaction. Confirm that any rejected field rejects the whole request, and that `SKIPPED_EXISTING` is not an error.
4. **Restricted groups.** Confirm that the allowlist is the eleven groups listed above, excluding `pricing.*` and `assessment.*`, and that it should be enforced as a named constant (the verifier expects `FIELD_SERVICES_SYNC_KEYS`).
5. **Re-push of a draft.** The doc says existing drafts are never overwritten. Confirm that a second push with a different value for a DRAFT field is `SKIPPED_EXISTING` and not an update.
6. **Audit outcome names.** Confirm the outcome strings written to `academyIntegrationAudit` for accepted, skipped and rejected pushes.
7. **Replay protection and producer (cross-service).** The API has no replay protection for pushes (for example a timestamp or nonce window), and no Field Services webhook producer exists. Both need deployment-specific design and live testing with Field Services before the route can be considered production-ready.
8. **Verifier expectations.** `apps/backend/scripts/verify-field-services-sync.mjs` checks for `approvalRequired: true`, `FIELD_SERVICES_SYNC_KEYS` and `SKIPPED_EXISTING`. These were written before the design was settled. Confirm them or retire them when the route is implemented.

Once decisions 1 to 6 are recorded and decision 7 has an owner, the route can be implemented in `apps/backend/src/modules/curriculum/integration.routes.ts`. At that point the `contract.test.ts` assertion that the path returns 404 must be replaced with the new behaviour, and the skipped test enabled. Change the "Skip decision (#165): DEFERRED" line at the top of this document at the same time, so the verifier stops reporting a skip.
