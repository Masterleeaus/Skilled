# Pass 17: database-backed service credentials

Apply Prisma migrations and generate client before use. Credentials are SHA-256 hashed, scoped to exactly one external organisation reference and one calling service, and expire automatically. Create through `npm run integration:credentials` with JSON stdin, e.g. `{"action":"create","service":"field-services","organisationRef":"trusted-ref","label":"staging","days":30}`. Revoke with `{"action":"revoke","id":"credential-id"}`. Rotate by creating a new credential, switching the client, then revoking the old ID. Store the printed token in a secrets manager. The prior environment-variable API keys are no longer accepted.

No live database, runtime, or service integration has been tested. Ensure HTTPS, network restrictions, rate limiting and operational audit controls before production.
