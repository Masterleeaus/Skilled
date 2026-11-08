# Pass 15 - External identity and audit

The read-only skills endpoint now accepts an external user reference, resolved through `AcademyExternalIdentity` scoped to the authenticated service. A service cannot provide an internal Academy user ID to query another account. Missing mappings fail closed. Every scope denial and resolved request records an audit event; credential failures remain outside database audit and must be captured by gateway logs.

Provision identity mappings through a trusted administrator process, never via the read-only service endpoint. Maintain separate service secrets and explicit organisation allowlists. Audit writes fail closed: if persistence fails, no skills are returned. The current static environment-based credentials are unchanged; database-managed credentials and rotation remain outstanding. No live integrations tested.
