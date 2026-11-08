# Pass 18 — Titan service credential operations

The offline operator CLI now supports `create`, `revoke`, `rotate`, and `list`.

Run in `apps/backend` with a configured PostgreSQL connection and generated Prisma client:

```sh
printf '%s' '{"action":"list","service":"field-services","companyRef":"example-tenant"}' | npm run integration:credentials
printf '%s' '{"action":"rotate","id":"credential-id","days":90}' | npm run integration:credentials
```

Rotation atomically revokes the old credential and inserts its replacement, retaining the caller and tenant scope. A rotation token is printed only once; store it securely. Rotation causes immediate cutover: update the consuming service promptly. The list command omits token hashes and secrets.

**Not verified against a database:** No installed PostgreSQL server, Prisma CLI or node_modules were available in this execution environment. Deploy only after `pnpm install`, `prisma validate`, TypeScript compilation, and PostgreSQL integration tests.
