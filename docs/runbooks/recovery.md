# Skilled recovery runbook

Owner: to be assigned. Status: **documented, not rehearsed**. Backup and restore have not been tested against a real PostgreSQL instance, and no recovery time or recovery point objective has been agreed. Those targets are placeholders until the business owner sets them and a restore rehearsal confirms them (register ACA-003 and ACA-022).

## 1. What must be recoverable

| Asset | Where it lives | Why it matters |
|---|---|---|
| Learner and organisation records | PostgreSQL | Enrolments, assignments, memberships |
| Lesson revisions and curriculum records | PostgreSQL (`academy_content_lessons`, `academy_lesson_revisions`, placements) | Published content and its version history |
| Evidence of learning | PostgreSQL (`academy_learner_completions`, `academy_knowledge_attempts`, `academy_practical_evidence`, `academy_verified_competencies`) | Completion and competency evidence for managers and assessors |
| Presentation history | PostgreSQL (`academy_lesson_context_snapshots`) | Immutable record of what a learner was shown. Each snapshot carries a content hash. |
| Integration audit | PostgreSQL (`academy_integration_audit`, `AuditLog`) | Record of access attempts and administrative changes |
| Service credentials | PostgreSQL (`academy_service_credentials`, hashes only) | Revocation state for machine access |
| Uploaded files (videos, certificates, assignment files) | MinIO bucket | Learner-facing and evidence files |
| Redis | Redis | Queues and cache. Treat as rebuildable, but check for jobs that were in flight. |

Learner-facing evidence and presentation history are the most important. They are the records an auditor or assessor will ask for.

## 2. Backups

Take backups from the environment's own database. Do not take them from a laptop copy.

Minimum practice to agree and then rehearse:

1. A logical PostgreSQL dump (`pg_dump` in custom format) of the Skilled database, taken on a schedule and before every migration.
2. Retention for each dump, stored in a location separate from the database host and encrypted at rest.
3. A MinIO bucket backup or replication policy for the configured bucket.
4. A record of each backup: identifier, time, size, the migration names present at that time, and the checksum of the dump file.

The schedule and retention periods are decisions for the business owner. They are not set by this runbook.

## 3. Restore into staging first

Never restore directly over production.

1. Create an empty staging database.
2. Restore the chosen dump with `pg_restore` into that database. Record the command, the dump identifier and the result.
3. Apply the migrations that are newer than the dump, if any, using `prisma migrate deploy`.
4. Confirm the application starts against the restored database and the health endpoint succeeds (`GET /api/health`).
5. Run the integrity checks in section 4.
6. Only after the checks pass, decide whether production needs restoring, and follow the approval path in section 5.

## 4. Integrity checks after restore

Compare against the figures recorded in the backup record. Expected to match exactly for the dump point:

- Row counts for the Academy tables listed in section 1.
- For a sample of presentation snapshots, read the snapshot detail through the API as the owning learner. A successful read means the stored hash still matches the recomputed hash. An integrity failure response means the row or its fields changed after it was written.
- For a sample of completion reports, check the learner report agrees with the completion and competency rows.

A mismatch in any of these checks stops the recovery. Keep the restored copy for investigation, and do not write to production from it.

## 5. Production recovery decision

Restoring production replaces data written after the backup point. That data cannot be recovered afterwards unless it was also captured elsewhere.

Before restoring production:

1. Record the incident, the chosen backup, and the time window of data that will be lost or must be re-entered.
2. Get approval from the business owner and the person responsible for learner records.
3. Stop the backend so that no writes occur during the restore.
4. Restore, run the checks in section 4 on production, then start the backend.
5. Tell affected managers which learner records were written after the backup point, so that they can be re-entered from source evidence.

## 6. Specific scenarios

### Deploy broke the schema
Stop the new backend. Restore the previous build artefact. If a migration applied partially, restore the pre-migration backup into staging, reproduce the failure there, and only then decide how to repair production. Do not edit production tables by hand.

### Snapshot or completion data looks wrong
Do not edit the rows. Snapshots are immutable by design, and a hash mismatch is evidence that something changed. Preserve the database state, record the affected snapshot and revision identifiers, and open an incident.

### Integration credential suspected compromised
Follow `secrets-handling.md` section 5. Recovery of data is not needed unless the audit shows writes from the credential.

### Object storage bucket lost
Restore the bucket from its replica or backup into a new bucket. Update `MINIO_BUCKET` only if the bucket name changes. Check that assignment and evidence file links resolve.

### Redis lost
Restart Redis and the backend. Check queue health and re-enqueue any learner-facing job that was in flight, such as certificate issuance, by hand from the database state. Confirm each learner's completion state from the database, not from the queue.

## 7. After recovery

- Record the timeline, the backup used, the data-loss window and the checks performed.
- Update the register with the rehearsal evidence. A recovery that has not been rehearsed remains open.
- Review the RPO and RTO targets against what actually happened.
