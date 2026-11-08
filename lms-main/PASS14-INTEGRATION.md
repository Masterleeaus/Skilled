# Pass 14 — Explicit tenant scoping for service credentials

The Pass 13 integration credential previously allowed querying any provisioned organisation. Pass 14 requires `TITAN_SERVICE_ORGANISATION_SCOPES`, a JSON mapping of caller names to an explicit allowlist of organisation external references.

```env
TITAN_SERVICE_ORGANISATION_SCOPES={"field-services":["organisation-ref-1"],"ai-workforce":["organisation-ref-1"]}
```

Each caller also requires its existing independent 32+-character bearer secret. Empty, missing or malformed scope configuration fails closed. A valid credential can only request organisations explicitly granted to that caller. This is an interim deployment control, not a substitute for database-backed credential lifecycle management or external user identity mapping. Organisation references must be provisioned by a trusted administrator, not by untrusted service callers.

## Next
Replace static scopes with hashed per-tenant API credentials and audit logs; introduce external learner mapping, then compile and run API/PostgreSQL tests. Do not expose this integration publicly until runtime and security verification.
