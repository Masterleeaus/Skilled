# Pass 23 — Business lesson fields

Adds 56 allowed keys across 13 groups, business-scoped JSON values and immutable lesson context snapshots.

Canonical lessons are unchanged. Only APPROVED records may resolve into learner context. Use `{{business:equipment.primary_tool}}` in lesson text.

This pass supplies schema, migration, typed registry and pure resolver; **no CRUD endpoints or automatic Field Services sync are wired yet**. The UI must render resolved text as plain text. Sensitive operational details require tenant permission checks before being exposed.
