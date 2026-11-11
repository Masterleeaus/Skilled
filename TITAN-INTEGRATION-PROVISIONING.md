# Titan Academy integration identity provisioning — Pass 16

Use this **trusted offline operator CLI** on the backend host, never from a browser or publicly exposed route. A database connection and generated Prisma client are required.

Run from `apps/backend` after migrations and `prisma generate`:

```bash
printf '%s' '{"action":"link-identity","service":"field-services","externalUserRef":"worker-123","userId":"ACADEMY_USER_ID","companyRef":"ORG_EXTERNAL_REF"}' | npm run integration:provision
```

The company reference key is `companyRef` (static, unverified, checked 8 Nov 2026 against `apps/backend/prisma/provision-titan-integration.ts`). To revoke, use `{"action":"unlink-identity","service":"field-services","externalUserRef":"worker-123","userId":"ACADEMY_USER_ID","companyRef":"ORG_EXTERNAL_REF"}`. The schema requires `companyRef` for unlink as well, and it rejects unknown keys.

The CLI checks organisation existence and current membership, rejects identity takeover, makes repeated same-user links idempotent, and writes audit events in the same transaction. A trusted operator must independently verify the external identity really belongs to the Academy user before linking it. **This is not automatic identity federation.** Service secrets remain environment-managed, not database-managed. Tenant allowlists must still be configured. Database/runtime execution was not verified during this pass.
