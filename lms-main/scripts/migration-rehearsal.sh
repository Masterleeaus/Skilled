#!/usr/bin/env bash
# Migration rehearsal for Titan Academy (ACA-003 recovery and rollback, ACA-027 same-prefix ordering).
#
# What it does, against disposable PostgreSQL databases named lms_I_<label>:
#   1. Builds scratch copies of apps/backend/prisma/migrations cut at a point (no repo file is edited).
#   2. Deploys to the pre-November-8 cut (20261103120000), seeds representative rows, takes a pg_dump -Fc backup.
#   3. Runs the ordered preflight SQL and the migrations in the order PREFLIGHT-ORDER.md describes:
#      preflight 1, rename migration, preflights 2-4, then the remaining migrations (prisma migrate deploy).
#   4. Restores the backup into a second database and re-applies the newer migrations (runbook section 3).
#   5. Rehearses the same chain from an empty database, from an init-only database with core data, and from a
#      copy where the same-prefix migrations 20261102000100_* are applied in the reverse order.
#   6. Runs negative checks: duplicate PENDING payments (migration 20261108130000), a post-rename re-run of
#      preflight 1, and VALIDATE of the NOT VALID course-tracks foreign key (rolled back).
#
# Usage:   scripts/migration-rehearsal.sh [work-dir]
# Needs:   psql, pg_dump, pg_restore, pnpm with apps/backend installed (prisma 6.19.3), a PostgreSQL server
#          where role "postgres" can connect locally and role "titan" (password from TITAN_DB_PASSWORD, default
#          "titan") can create databases it owns.
# Safety:  creates and drops only databases whose names start with lms_I_. Never touches other databases.
#          Does not start or stop PostgreSQL, Redis or MinIO.

set -euo pipefail
export LC_ALL=C

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LMS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND="$LMS_ROOT/apps/backend"
PRISMA_DIR="$BACKEND/prisma"
SCHEMA="$PRISMA_DIR/schema.prisma"
WORK="${1:-$(mktemp -d "${TMPDIR:-/tmp}/lms-rehearsal-XXXXXX")}"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
APP_PASS="${TITAN_DB_PASSWORD:-titan}"
DB_PREFIX="lms_I_"
CUT_PRE="20261103120000_licence_track_enrolment"
CUT_RENAME="20261108090000_academy_tenant_company_rename"
CUT_INIT="20260717195126_init"
SWAP_FROM="20261102000100_titan_academy_content_inventory"
SWAP_TO="20261102000100_0titan_academy_content_inventory"
TIMINGS="$WORK/timings.tsv"

mkdir -p "$WORK/logs" "$WORK/snap" "$WORK/schemas" "$WORK/backup"
: > "$TIMINGS"

log() { printf '\n== %s\n' "$*"; }
now_ms() { date +%s%3N; }

url() { # database-label -> connection URL (postgres = admin maintenance DB)
  if [[ "$1" == postgres ]]; then
    printf 'postgresql://postgres@%s:%s/postgres' "$PGHOST" "$PGPORT"
  else
    printf 'postgresql://titan:%s@%s:%s/%s%s' "$APP_PASS" "$PGHOST" "$PGPORT" "$DB_PREFIX" "$1"
  fi
}

admin() { psql "$(url postgres)" -X -q -v ON_ERROR_STOP=1 "$@"; }

timed() { # label command...  records wall time in ms and exit code in $TIMINGS
  local label="$1" t0 t1 rc=0
  shift
  t0=$(now_ms)
  "$@" || rc=$?
  t1=$(now_ms)
  printf '%s\t%s\t%s\n' "$label" "$((t1 - t0))" "$rc" >> "$TIMINGS"
  return "$rc"
}

reset_db() { # label
  admin -c "DROP DATABASE IF EXISTS \"${DB_PREFIX}$1\";" -c "CREATE DATABASE \"${DB_PREFIX}$1\" OWNER titan;"
}

# make_schema <label> <last-folder | ALL | NONE> [swap]
# Writes a scratch prisma directory with the migration folders sorted up to and including <last>.
# Prints the path of the scratch schema.prisma. The repo's migrations are only read.
make_schema() {
  local label="$1" last="$2" swap="${3:-}" dir="$WORK/schemas/$1" f name target
  rm -rf "$dir"
  mkdir -p "$dir/migrations"
  cp "$SCHEMA" "$dir/schema.prisma"
  cp "$PRISMA_DIR/migrations/migration_lock.toml" "$dir/migrations/migration_lock.toml"
  if [[ "$last" != NONE ]]; then
    for f in "$PRISMA_DIR"/migrations/*/; do
      name="$(basename "$f")"
      if [[ "$last" != ALL && "$name" > "$last" ]]; then continue; fi
      target="$name"
      if [[ "$swap" == swap && "$name" == "$SWAP_FROM" ]]; then target="$SWAP_TO"; fi
      cp -r "$f" "$dir/migrations/$target"
    done
  fi
  echo "$dir/schema.prisma"
}

deploy() { # database-label schema-path log-name
  local db="$1" schema="$2" log="$WORK/logs/$3"
  log_cmd "prisma migrate deploy --schema $schema (database ${DB_PREFIX}$db)"
  if ! ( cd "$BACKEND" && DATABASE_URL="$(url "$db")" pnpm exec prisma migrate deploy --schema "$schema" ) >"$log" 2>&1; then
    tail -n 40 "$log" >&2
    return 1
  fi
  tail -n 4 "$log"
}

compare() { # label-a label-b file-a file-b  (reports; never stops the run)
  if diff -q "$3" "$4" >/dev/null; then
    echo "IDENTICAL: $1 vs $2"
  else
    echo "DIFFERENT: $1 vs $2"
    diff "$3" "$4" || true
  fi
}

log_cmd() { printf '$ %s\n' "$*"; }

sql_file() { # database-label file-path log-name  (ON_ERROR_STOP; output to log and stdout)
  local db="$1" file="$2" log="$WORK/logs/$3"
  log_cmd "psql ${DB_PREFIX}$db -v ON_ERROR_STOP=1 -f $file"
  if ! psql "$(url "$db")" -X -v ON_ERROR_STOP=1 -f "$file" >"$log" 2>&1; then
    cat "$log" >&2
    return 1
  fi
  cat "$log"
}

sql_capture() { # database-label file-path log-name -> returns psql exit code, does not stop the script
  local db="$1" file="$2" log="$WORK/logs/$3" rc=0
  log_cmd "psql ${DB_PREFIX}$db -v ON_ERROR_STOP=1 -f $file"
  psql "$(url "$db")" -X -v ON_ERROR_STOP=1 -f "$file" >"$log" 2>&1 || rc=$?
  cat "$log"
  echo "exit code: $rc"
  return 0
}

history_of() { # database-label
  psql "$(url "$1")" -X -At -F $'\t' -c \
    "select migration_name, (rolled_back_at is null) as not_rolled_back, (finished_at is not null) as finished, started_at from _prisma_migrations order by started_at, migration_name"
}

# Row count and content digest for each table that exists. Renamed tables appear under both names;
# only the one present in the database is reported.
TABLES="users courses categories enrollments payments coupons quizzes questions options quiz_attempts answers assignments certificates
academy_organisations academy_companies academy_organisation_members academy_company_members
academy_content_lessons academy_lesson_revisions academy_curriculum_tracks academy_lesson_placements academy_course_tracks
academy_learner_completions academy_knowledge_attempts academy_knowledge_answer_keys academy_lesson_reviews
academy_practical_evidence academy_verified_competencies academy_training_assignments academy_external_identities
academy_integration_audit academy_service_credentials academy_business_lesson_fields academy_lesson_context_snapshots
academy_course_lesson_selections academy_template_responses academy_curriculum_pathways academy_pathway_courses academy_pathway_enrolments"

snapshot() { # database-label name
  local db="$1" out="$WORK/snap/$2.tsv" existing sql="" t
  existing="$(psql "$(url "$db")" -X -At -c "select tablename from pg_tables where schemaname = current_schema()")"
  for t in $TABLES; do
    if grep -qx "$t" <<<"$existing"; then
      sql+="select '$t' as tbl, count(*) as n, md5(coalesce(string_agg(x::text, E'\n' order by x::text), '')) as digest from \"$t\" x union all "
    fi
  done
  sql="${sql% union all }"
  psql "$(url "$db")" -X -At -F $'\t' -c "$sql" > "$out"
  log_cmd "row count + content digest for ${DB_PREFIX}$db -> $out"
  cat "$out"
}

schema_dump() { # database-label name
  # pg_dump 16 writes a random \restrict token per run; it is removed so that dumps can be compared.
  pg_dump --schema-only --no-owner --no-privileges "$(url "$1")" | grep -v -E '^\\(un)?restrict ' > "$WORK/snap/$2.schema.sql"
  log_cmd "pg_dump --schema-only ${DB_PREFIX}$1 (restrict tokens removed) > $WORK/snap/$2.schema.sql"
}

history_show() { # label
  log_cmd "select migration_name, ... from _prisma_migrations (${DB_PREFIX}$1)"
  history_of "$1" | tee "$WORK/snap/$1.history.tsv"
}

status_show() { # label  (migrate status against the real migrations folder)
  log_cmd "prisma migrate status --schema $SCHEMA (database ${DB_PREFIX}$1)"
  ( cd "$BACKEND" && DATABASE_URL="$(url "$1")" pnpm exec prisma migrate status --schema "$SCHEMA" ) 2>&1 | tail -n 3
}

drift_show() { # label
  local out="$WORK/snap/$1.drift.sql"
  log_cmd "prisma migrate diff --from-url ${DB_PREFIX}$1 --to-schema-datamodel $SCHEMA --script"
  ( cd "$BACKEND" && pnpm exec prisma migrate diff --from-url "$(url "$1")" --to-schema-datamodel "$SCHEMA" --script ) > "$out" 2>"$WORK/logs/$1-drift.err" || true
  echo "drift statements (non-empty lines starting with ALTER/CREATE/DROP): $(grep -cE '^(ALTER|CREATE|DROP)' "$out" || true)"
  cat "$out"
}

# ------------------------------------------------------------------------------------------------
# Representative data
# ------------------------------------------------------------------------------------------------

write_core_seed() {
cat > "$WORK/seed-core.sql" <<'SQL'
BEGIN;
INSERT INTO users (id, email, "passwordHash", "fullName", role, "isActive", "isEmailVerified", "createdAt", "updatedAt")
VALUES ('usr_admin', 'admin@titan.test', 'hash', 'Platform Admin', 'ADMIN'::"Role", true, true, now() - interval '400 days', now());
INSERT INTO users (id, email, "passwordHash", "fullName", role, "isActive", "isEmailVerified", "createdAt", "updatedAt")
SELECT 'usr_t' || g, 'teacher' || g || '@titan.test', 'hash', 'Teacher ' || g, 'TEACHER'::"Role", true, true, now() - interval '300 days', now()
FROM generate_series(1, 3) g;
INSERT INTO users (id, email, "passwordHash", "fullName", role, "isActive", "isEmailVerified", "createdAt", "updatedAt")
SELECT 'usr_s' || lpad(g::text, 3, '0'), 'learner' || lpad(g::text, 3, '0') || '@titan.test', 'hash', 'Learner ' || g,
       'STUDENT'::"Role", true, true, now() - interval '200 days', now()
FROM generate_series(1, 40) g;
INSERT INTO categories (id, name, slug, "createdAt")
SELECT 'cat_' || g, 'Category ' || g, 'category-' || g, now() FROM generate_series(1, 3) g;
INSERT INTO courses (id, title, slug, description, "categoryId", "teacherId", price, level, "isPublished", "createdAt", "updatedAt")
SELECT 'crs_' || g, 'Course ' || g, 'course-' || g, 'Course description ' || g, 'cat_' || ((g - 1) % 3 + 1),
       'usr_t' || ((g - 1) % 3 + 1), 50 * g, 'BEGINNER'::"CourseLevel", true, now() - interval '150 days', now()
FROM generate_series(1, 6) g;
INSERT INTO enrollments (id, "studentId", "courseId", "progressPercentage", status, "enrolledAt")
SELECT 'enr_' || s.g || '_' || c.g, 'usr_s' || lpad(s.g::text, 3, '0'), 'crs_' || c.g, (s.g * 7 % 100)::float,
       'ACTIVE'::"EnrollmentStatus", now() - interval '90 days'
FROM generate_series(1, 40) s(g) CROSS JOIN generate_series(1, 6) c(g)
WHERE c.g = 1 OR (s.g + c.g) % 3 = 0;
INSERT INTO payments (id, "studentId", "courseId", amount, provider, "transactionId", status, "paidAt", "createdAt")
SELECT 'pay_' || e.id, e."studentId", e."courseId", 50, 'stripe', 'txn_' || e.id, 'SUCCEEDED'::"PaymentStatus",
       now() - interval '80 days', now() - interval '80 days'
FROM enrollments e;
INSERT INTO payments (id, "studentId", "courseId", amount, provider, "transactionId", status, "createdAt") VALUES
  ('pay_pending_1', 'usr_s001', 'crs_2', 100, 'stripe', 'txn_pending_1', 'PENDING'::"PaymentStatus", now() - interval '1 day'),
  ('pay_pending_2', 'usr_s002', 'crs_3', 100, 'stripe', 'txn_pending_2', 'PENDING'::"PaymentStatus", now() - interval '2 days'),
  ('pay_failed_1', 'usr_s005', 'crs_1', 50, 'stripe', 'txn_failed_1', 'FAILED'::"PaymentStatus", now() - interval '3 days');
INSERT INTO coupons (id, code, "discountPercent", "expiresAt", "usageLimit", "courseId", "createdAt") VALUES
  ('cpn_1', 'WELCOME10', 10, NULL, NULL, NULL, now()),
  ('cpn_2', 'SPRING20', 20, now() + interval '60 days', 100, 'crs_2', now()),
  ('cpn_3', 'STAFF50', 50, NULL, 20, NULL, now());
INSERT INTO quizzes (id, "courseId", "moduleId", title, "totalMarks", "passingMarks", "timeLimitMinutes", "isPublished", "createdAt")
SELECT 'quz_' || g, 'crs_' || g, NULL, 'Quiz ' || g, 10, 6, 30, true, now() FROM generate_series(1, 3) g;
INSERT INTO questions (id, "quizId", text, type, marks, "orderIndex")
SELECT 'q_' || q.g || '_' || n.g, 'quz_' || q.g, 'Question ' || n.g, 'SINGLE_CHOICE'::"QuestionType", 5, n.g
FROM generate_series(1, 3) q(g) CROSS JOIN generate_series(1, 2) n(g);
INSERT INTO options (id, "questionId", text, "isCorrect")
SELECT 'o_' || q.id || '_' || o.g, q.id, 'Option ' || o.g, o.g = 1 FROM questions q CROSS JOIN generate_series(1, 3) o(g);
INSERT INTO quiz_attempts (id, "studentId", "quizId", "startedAt", "submittedAt", "marksObtained", status)
SELECT 'qa_' || lpad(s.g::text, 3, '0'), 'usr_s' || lpad(s.g::text, 3, '0'), 'quz_1', now() - interval '30 days',
       now() - interval '30 days' + interval '20 minutes', 8, 'SUBMITTED'::"QuizAttemptStatus"
FROM generate_series(1, 20) s(g);
INSERT INTO quiz_attempts (id, "studentId", "quizId", "startedAt", status)
SELECT 'qa_open_' || lpad(s.g::text, 3, '0'), 'usr_s' || lpad(s.g::text, 3, '0'), 'quz_1', now() - interval '1 hour', 'IN_PROGRESS'::"QuizAttemptStatus"
FROM generate_series(21, 25) s(g);
INSERT INTO answers (id, "attemptId", "questionId", "selectedOptionId", "marksObtained")
SELECT 'ans_' || qa.id || '_' || q.id, qa.id, q.id, 'o_' || q.id || '_1', 4
FROM quiz_attempts qa JOIN questions q ON q."quizId" = qa."quizId"
WHERE qa.status = 'SUBMITTED'::"QuizAttemptStatus";
INSERT INTO certificates (id, "studentId", "courseId", "certificateNumber", "pdfUrl", "issuedAt")
SELECT 'cert_' || s.g, 'usr_s' || lpad(s.g::text, 3, '0'), 'crs_1', 'TA-' || lpad(s.g::text, 6, '0'),
       'https://files.example.invalid/cert/' || s.g || '.pdf', now() - interval '10 days'
FROM generate_series(1, 5) s(g);
INSERT INTO assignments (id, "courseId", title, instructions, "dueDate", "totalMarks", "createdById") VALUES
  ('asg_1', 'crs_1', 'Week 1 task', 'Complete the checklist', now() + interval '14 days', 20, 'usr_t1'),
  ('asg_2', 'crs_2', 'Week 2 task', 'Upload the site photo', now() + interval '21 days', 20, 'usr_t2');
COMMIT;
SQL
}

write_academy_seed() {
cat > "$WORK/seed-academy.sql" <<'SQL'
BEGIN;
INSERT INTO academy_organisations (id, name, "externalRef", "createdAt") VALUES
  ('org_acme', 'Acme Facilities', 'ext-acme', now() - interval '120 days'),
  ('org_bravo', 'Bravo Cleaning Ltd', 'ext-bravo', now() - interval '100 days'),
  ('org_charlie', 'Charlie Estates (no external ref)', NULL, now() - interval '60 days');
INSERT INTO academy_organisation_members (id, "organisationId", "userId", role, "createdAt") VALUES
  ('mem_acme_t1', 'org_acme', 'usr_t1', 'MANAGER', now()),
  ('mem_bravo_t2', 'org_bravo', 'usr_t2', 'MANAGER', now()),
  ('mem_charlie_t3', 'org_charlie', 'usr_t3', 'MANAGER', now());
INSERT INTO academy_organisation_members (id, "organisationId", "userId", role, "createdAt")
SELECT 'mem_s' || lpad(s::text, 3, '0'),
       CASE WHEN s <= 20 THEN 'org_acme' WHEN s <= 30 THEN 'org_bravo' ELSE 'org_charlie' END,
       'usr_s' || lpad(s::text, 3, '0'), 'LEARNER', now()
FROM generate_series(1, 40) s;
INSERT INTO academy_content_lessons (id, "sourceId", layer, "serviceGroup", unit, title, objective, assessment, "contentStatus", "sourceVersion", "sourceHash", "updatedAt")
SELECT 'lsn_' || g, 'TA-L-' || lpad(g::text, 3, '0'), 'CORE', 'cleaning', 'Unit ' || ((g - 1) / 3 + 1), 'Lesson ' || g,
       'Objective ' || g, 'Knowledge check', 'PUBLISHED', 'v1', md5('source' || g), now()
FROM generate_series(1, 6) g;
INSERT INTO academy_lesson_revisions (id, "lessonId", version, body, "contentHash", status, "publishedAt")
SELECT 'rev_' || g || '_1', 'lsn_' || g, 1,
       jsonb_build_object('title', 'Lesson ' || g, 'blocks', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Body ' || g))),
       md5('revision' || g), 'PUBLISHED', now()
FROM generate_series(1, 6) g;
INSERT INTO academy_curriculum_tracks (id, slug, title, scope, "serviceGroup", status, "updatedAt") VALUES
  ('trk_core', 'track-core', 'Core cleaning', 'SHARED', 'cleaning', 'PUBLISHED', now()),
  ('trk_adv', 'track-advanced', 'Advanced cleaning', 'SHARED', 'cleaning', 'PUBLISHED', now());
INSERT INTO academy_lesson_placements (id, "trackId", "lessonId", "revisionId", position, required)
SELECT 'plc_core_' || g, 'trk_core', 'lsn_' || g, 'rev_' || g || '_1', g, true FROM generate_series(1, 3) g;
INSERT INTO academy_lesson_placements (id, "trackId", "lessonId", "revisionId", position, required)
SELECT 'plc_adv_' || g, 'trk_adv', 'lsn_' || (g + 3), 'rev_' || (g + 3) || '_1', g, true FROM generate_series(1, 3) g;
-- Orphan on purpose: courseId 'crs_retired_2019' does not exist in courses. No FK exists yet at this cut.
INSERT INTO academy_course_tracks (id, "courseId", "trackId", position, required) VALUES
  ('ctk_1', 'crs_1', 'trk_core', 1, true),
  ('ctk_2', 'crs_2', 'trk_core', 2, true),
  ('ctk_orphan', 'crs_retired_2019', 'trk_adv', 1, true);
INSERT INTO academy_learner_completions (id, "learnerId", "lessonId", "revisionId", "completedAt")
SELECT 'cmp_' || s.g || '_' || l.g, 'usr_s' || lpad(s.g::text, 3, '0'), 'lsn_' || l.g, 'rev_' || l.g || '_1', now() - interval '5 days'
FROM generate_series(1, 20) s(g) CROSS JOIN generate_series(1, 2) l(g);
INSERT INTO academy_knowledge_attempts (id, "learnerId", "lessonId", "revisionId", answers, score, total, passed, "createdAt")
SELECT 'kat_' || s.g, 'usr_s' || lpad(s.g::text, 3, '0'), 'lsn_1', 'rev_1_1', '[0,2,1]'::jsonb, 2, 3, true, now()
FROM generate_series(1, 10) s(g);
INSERT INTO academy_knowledge_answer_keys (id, "revisionId", "checkId", "correctIndex", rationale, "loadedAt")
SELECT 'key_' || l.g || '_' || c.g, 'rev_' || l.g || '_1', 'chk-' || c.g, 1, NULL, now()
FROM generate_series(1, 6) l(g) CROSS JOIN generate_series(1, 2) c(g);
INSERT INTO academy_lesson_reviews (id, "revisionId", "contentHash", "reviewerId", decision, notes, "decidedAt")
VALUES ('rvw_1', 'rev_1_1', md5('revision1'), 'usr_t1', 'APPROVED', 'Checked against source', now());
-- Practical evidence before the organisation column exists in the renamed form. Row 6 is legacy and unassigned.
INSERT INTO academy_practical_evidence (id, "learnerId", "lessonId", "revisionId", description, "evidenceUrls", status,
                                        "assessorId", "assessorFeedback", "reviewedAt", "createdAt", "organisationId")
SELECT 'pev_' || s.g, 'usr_s' || lpad(s.g::text, 3, '0'), 'lsn_1', 'rev_1_1', 'Photo of completed task ' || s.g,
       jsonb_build_array('https://files.example.invalid/ev/' || s.g || '.jpg'),
       CASE WHEN s.g <= 3 THEN 'APPROVED' ELSE 'PENDING' END,
       CASE WHEN s.g <= 3 THEN 'usr_t1' ELSE NULL END,
       CASE WHEN s.g <= 3 THEN 'Verified on site' ELSE NULL END,
       CASE WHEN s.g <= 3 THEN now() ELSE NULL END,
       now(),
       CASE WHEN s.g < 6 THEN 'org_acme' ELSE NULL END
FROM generate_series(1, 6) s(g);
INSERT INTO academy_verified_competencies (id, "organisationId", "learnerId", "lessonId", "revisionId", "evidenceId", "assessorId", "verifiedAt", "expiresAt")
SELECT 'vc_' || s.g, 'org_acme', 'usr_s' || lpad(s.g::text, 3, '0'), 'lsn_1', 'rev_1_1', 'pev_' || s.g, 'usr_t1', now(), now() + interval '365 days'
FROM generate_series(1, 3) s(g);
INSERT INTO academy_training_assignments (id, "organisationId", "learnerId", "assignedById", "courseId", status, "dueAt", "createdAt")
SELECT 'ta_' || s.g || '_' || c.g,
       CASE WHEN s.g <= 20 THEN 'org_acme' WHEN s.g <= 30 THEN 'org_bravo' ELSE 'org_charlie' END,
       'usr_s' || lpad(s.g::text, 3, '0'),
       CASE WHEN s.g <= 20 THEN 'usr_t1' WHEN s.g <= 30 THEN 'usr_t2' ELSE 'usr_t3' END,
       'crs_' || c.g, 'ASSIGNED', now() + interval '30 days', now()
FROM generate_series(1, 40) s(g) CROSS JOIN generate_series(1, 2) c(g)
WHERE c.g = 1 OR s.g <= 20;
INSERT INTO academy_external_identities (id, service, "externalUserRef", "userId", "createdAt", "organisationId") VALUES
  ('xid_1', 'titan-field', 'field-user-001', 'usr_s001', now(), 'org_acme'),
  ('xid_2', 'titan-field', 'field-user-002', 'usr_s002', now(), 'org_acme'),
  ('xid_3', 'titan-desk', 'desk-user-021', 'usr_s021', now(), 'org_bravo'),
  ('xid_legacy', 'titan-field', 'field-user-legacy-9', 'usr_s031', now(), NULL);
INSERT INTO academy_integration_audit (id, service, "organisationRef", "externalUserRef", outcome, "createdAt")
SELECT 'aud_' || g, 'titan-field', CASE WHEN g % 2 = 0 THEN 'org_acme' ELSE NULL END, 'field-user-001',
       CASE WHEN g % 5 = 0 THEN 'DENIED' ELSE 'ALLOWED' END, now() - (g || ' hours')::interval
FROM generate_series(1, 12) g;
INSERT INTO academy_service_credentials (id, service, "organisationRef", "tokenHash", label, "createdAt", "expiresAt", "revokedAt") VALUES
  ('cred_1', 'titan-field', 'org_acme', md5('token-1'), 'Field production', now(), NULL, NULL),
  ('cred_2', 'titan-desk', 'org_bravo', md5('token-2'), 'Desk (revoked)', now(), NULL, now());
INSERT INTO academy_business_lesson_fields (id, "organisationId", "fieldKey", value, status, "sourceSystem", "sourceRecordRef",
                                            "approvedById", "approvedAt", revision, "createdAt", "updatedAt")
SELECT 'blf_' || o.v || '_' || f.g, o.v, 'field-' || f.g, jsonb_build_object('text', 'Value ' || f.g),
       CASE WHEN f.g = 1 THEN 'APPROVED' ELSE 'DRAFT' END, 'field', 'rec-' || f.g,
       CASE WHEN f.g = 1 THEN 'usr_t1' ELSE NULL END, CASE WHEN f.g = 1 THEN now() ELSE NULL END, 1, now(), now()
FROM unnest(ARRAY['org_acme', 'org_bravo']) AS o(v) CROSS JOIN generate_series(1, 3) f(g);
INSERT INTO academy_lesson_context_snapshots (id, "organisationId", "learnerId", "lessonRevisionId", "resolvedFields", "contentHash", "createdAt")
SELECT 'snap_' || s.g, 'org_acme', 'usr_s' || lpad(s.g::text, 3, '0'), 'rev_1_1',
       jsonb_build_object('field-1', 'Value 1'), md5('snapshot' || s.g), now() - (s.g || ' hours')::interval
FROM generate_series(1, 10) s(g);
INSERT INTO academy_course_lesson_selections (id, "courseId", "sourceId", "savedById", "savedAt", "organisationId") VALUES
  ('cls_def_1', 'crs_1', 'TA-L-001', 'usr_admin', now(), NULL),
  ('cls_def_2', 'crs_1', 'TA-L-002', 'usr_admin', now(), NULL),
  ('cls_org_1', 'crs_1', 'TA-L-003', 'usr_t1', now(), 'org_acme'),
  ('cls_org_2', 'crs_1', 'TA-L-001', 'usr_t1', now(), 'org_acme');
INSERT INTO academy_template_responses (id, "organisationId", "learnerId", "lessonId", "revisionId", "templateId", "fieldValues", status, "submittedAt", "createdAt", "updatedAt")
SELECT 'tr_' || s.g, 'org_acme', 'usr_s' || lpad(s.g::text, 3, '0'), 'lsn_2', 'rev_2_1', 'tpl-site-visit',
       jsonb_build_object('site', 'Site ' || s.g), CASE WHEN s.g <= 2 THEN 'SUBMITTED' ELSE 'IN_PROGRESS' END,
       CASE WHEN s.g <= 2 THEN now() ELSE NULL END, now(), now()
FROM generate_series(1, 4) s(g);
INSERT INTO academy_curriculum_pathways (id, code, title, description, status, "updatedAt")
VALUES ('pth_1', 'PATH-CLEAN-1', 'Cleaning foundation', 'Core pathway', 'PUBLISHED', now());
INSERT INTO academy_pathway_courses (id, "pathwayId", "courseSlug", required, position) VALUES
  ('pc_1', 'pth_1', 'course-1', true, 1),
  ('pc_2', 'pth_1', 'course-2', true, 2);
INSERT INTO academy_pathway_enrolments (id, "pathwayId", "learnerId", "organisationId", status, "enrolledAt")
SELECT 'pe_' || s.g, 'pth_1', 'usr_s' || lpad(s.g::text, 3, '0'), CASE WHEN s.g <= 5 THEN 'org_acme' ELSE NULL END, 'ACTIVE', now()
FROM generate_series(1, 8) s(g);
COMMIT;
SQL
}

# Negative-test data: a second PENDING payment for the same learner and course (violates the partial unique index).
write_dup_pending() {
cat > "$WORK/seed-dup-pending.sql" <<'SQL'
INSERT INTO payments (id, "studentId", "courseId", amount, provider, "transactionId", status, "createdAt")
VALUES ('pay_pending_dup', 'usr_s001', 'crs_2', 100, 'stripe', 'txn_pending_dup', 'PENDING'::"PaymentStatus", now());
SQL
}

write_truncation_probe() {
cat > "$WORK/truncation-probe.sql" <<'SQL'
-- Identifiers at or above 60 bytes (PostgreSQL truncates names at 63 bytes; Prisma expects the untruncated name).
SELECT 'index' AS kind, relname AS name, length(relname) AS len FROM pg_class WHERE relkind = 'i' AND length(relname) >= 60
UNION ALL
SELECT 'constraint', conname, length(conname) FROM pg_constraint WHERE length(conname) >= 60
ORDER BY 3 DESC, 2;
SQL
}

write_negative_checks() {
cat > "$WORK/neg-validate-course-tracks.sql" <<'SQL'
-- Would the disabled VALIDATE migration (20261108100400) pass? Run in a transaction and roll back either way.
BEGIN;
ALTER TABLE "academy_course_tracks" VALIDATE CONSTRAINT "academy_course_tracks_courseId_fkey";
ROLLBACK;
SQL
cat > "$WORK/neg-payments-columns.sql" <<'SQL'
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name IN ('couponId', 'checkoutUrl');
SQL
cat > "$WORK/index-names-probe.sql" <<'SQL'
SELECT c.relname AS index_name, length(c.relname) AS name_length
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'i' AND n.nspname = current_schema() AND c.relname LIKE 'academy_training_assignments_%';
SQL
}

# ------------------------------------------------------------------------------------------------
# Staged path: the order PREFLIGHT-ORDER.md gives, split into separate deploys so each preflight runs at its
# place in the sequence. A single `migrate deploy` cannot pause between migrations.
# ------------------------------------------------------------------------------------------------

stage_nov8() { # label  (runs from an already-applied state at CUT_PRE, or at any state before the rename)
  local db="$1" s
  log "[$db] stage A: preflight 1 (company rename target names must be absent)"
  sql_file "$db" "$PRISMA_DIR/preflight-20261108090000-company-rename.sql" "$db-A-preflight1.log" >/dev/null
  echo "preflight 1 passed (exit 0)"
  log "[$db] stage B: deploy through the rename migration"
  s="$(make_schema "$db-rename" "$CUT_RENAME")"
  timed "$db deploy rename" deploy "$db" "$s" "$db-B-deploy-rename.log"
  snapshot "$db" "$db-after-rename"
  log "[$db] stage C: preflights 2, 3, 4 (post-rename state)"
  sql_file "$db" "$PRISMA_DIR/preflight-20261108100000-external-identity-scope.sql" "$db-C-preflight2.log"
  sql_file "$db" "$PRISMA_DIR/preflight-20261108100100-course-tracks-fk.sql" "$db-C-preflight3.log"
  sql_file "$db" "$PRISMA_DIR/preflight-20261108100200-training-assignment-index-name.sql" "$db-C-preflight4.log"
  log "[$db] stage D: deploy the remaining migrations from the repo folder (prisma migrate deploy, real schema)"
  timed "$db deploy remaining" deploy "$db" "$SCHEMA" "$db-D-deploy-remaining.log"
}

run_empty() {
  log "PATH E: empty database"
  reset_db empty
  timed "empty deploy all (single run)" deploy empty "$SCHEMA" "empty-deploy-all.log"
  history_show empty
  status_show empty
  snapshot empty empty-final
  schema_dump empty empty-final
}

run_empty_staged() {
  log "PATH E2: empty database through the staged order (preflights interleaved)"
  reset_db empty2
  local s
  s="$(make_schema empty2-pre "$CUT_PRE")"
  timed "empty2 deploy pre-Nov-8" deploy empty2 "$s" "empty2-A-deploy-pre.log"
  stage_nov8 empty2
  history_show empty2
  status_show empty2
  snapshot empty2 empty2-final
  schema_dump empty2 empty2-final
}

run_swap() {
  log "PATH S: same-prefix migrations applied in reverse order (content inventory before external identity audit)"
  reset_db swap
  local s
  s="$(make_schema swap-all ALL swap)"
  grep -F "$SWAP_TO" <<<"$(ls "$WORK/schemas/swap-all/migrations")" >/dev/null
  timed "swap deploy all (reversed same-prefix order)" deploy swap "$s" "swap-deploy-all.log"
  history_show swap
  snapshot swap swap-final
  schema_dump swap swap-final
}

run_init_state() {
  log "PATH C: init-only database with core learner data (no academy data yet)"
  reset_db init
  local s
  s="$(make_schema init-cut "$CUT_INIT")"
  timed "init deploy init" deploy init "$s" "init-A-deploy-init.log"
  sql_file init "$WORK/seed-core.sql" "init-B-seed-core.log" >/dev/null
  snapshot init init-before-academy
  s="$(make_schema init-pre "$CUT_PRE")"
  timed "init deploy pre-Nov-8 academy changes" deploy init "$s" "init-C-deploy-pre.log"
  snapshot init init-pre
  stage_nov8 init
  history_show init
  status_show init
  snapshot init init-final
  schema_dump init init-final
}

run_pre_state() {
  log "PATH B: representative pre-November-8 database (data before the academy rename), then the rollout"
  reset_db pre
  local s
  s="$(make_schema pre-cut "$CUT_PRE")"
  timed "pre deploy through 20261103120000" deploy pre "$s" "pre-A-deploy-pre.log"
  history_show pre
  sql_file pre "$WORK/seed-core.sql" "pre-B-seed-core.log" >/dev/null
  sql_file pre "$WORK/seed-academy.sql" "pre-B-seed-academy.log" >/dev/null
  snapshot pre pre-before-nov8
  index_probe pre pre-before-nov8
  log "[pre] backup before migrations (runbook section 2): pg_dump -Fc"
  log_cmd "pg_dump -Fc --no-owner --no-privileges ${DB_PREFIX}pre > $WORK/backup/pre_nov8.dump"
  timed "pre pg_dump -Fc" pg_dump -Fc --no-owner --no-privileges -f "$WORK/backup/pre_nov8.dump" "$(url pre)"
  ( cd "$WORK/backup" && sha256sum pre_nov8.dump && ls -l pre_nov8.dump && pg_restore --list pre_nov8.dump | grep -c 'TABLE DATA' ) \
    | tee "$WORK/backup/pre_nov8.manifest.txt"
  stage_nov8 pre
  log "[pre] migration history and final checks"
  history_show pre
  status_show pre
  snapshot pre pre-final
  schema_dump pre pre-final
  drift_show pre
  log "[pre] re-run of the full deploy on the migrated database (expect no pending migrations)"
  deploy pre "$SCHEMA" "pre-D2-redeploy.log"
  log "[pre] negative check: preflight 1 after the rename must refuse (target names now exist)"
  sql_capture pre "$PRISMA_DIR/preflight-20261108090000-company-rename.sql" "pre-neg-preflight1-after.log"
  log "[pre] negative check: VALIDATE of the NOT VALID course-tracks FK (expect failure: orphan row seeded)"
  sql_capture pre "$WORK/neg-validate-course-tracks.sql" "pre-neg-validate.log"
  log "[pre] orphan check: preflight 3 query, expected one row"
  sql_capture pre "$PRISMA_DIR/preflight-20261108100100-course-tracks-fk.sql" "pre-neg-preflight3.log"
  log "[pre] truncated identifiers at final state"
  sql_capture pre "$WORK/truncation-probe.sql" "pre-truncation.log"
}

index_probe() { # label snapshot-name
  log_cmd "index name probe (${DB_PREFIX}$1)"
  psql "$(url "$1")" -X -At -F $'\t' -f "$WORK/index-names-probe.sql" | tee "$WORK/snap/$2.index-names.tsv"
}

run_restore() {
  log "PATH R: restore the pre-November-8 backup into a new database, then re-apply the newer migrations"
  reset_db restore
  timed "restore pg_restore" pg_restore --no-owner --no-privileges --exit-on-error -d "$(url restore)" "$WORK/backup/pre_nov8.dump"
  snapshot restore restore-after-restore
  log "[restore] compare restored counts and digests with the pre-migration snapshot (expect identical)"
  compare "pre-before-nov8" "restore-after-restore" "$WORK/snap/pre-before-nov8.tsv" "$WORK/snap/restore-after-restore.tsv"
  stage_nov8 restore
  history_show restore
  snapshot restore restore-final
  schema_dump restore restore-final
  log "[restore] compare final restored state with the forward path"
  compare "pre-final" "restore-final" "$WORK/snap/pre-final.tsv" "$WORK/snap/restore-final.tsv"
  compare "pre-final schema" "restore-final schema" "$WORK/snap/pre-final.schema.sql" "$WORK/snap/restore-final.schema.sql"
}

run_negative_pending() {
  log "NEGATIVE N: duplicate PENDING payment before 20261108130000 (expect the partial unique index to fail)"
  reset_db neg
  timed "neg restore backup" pg_restore --no-owner --no-privileges --exit-on-error -d "$(url neg)" "$WORK/backup/pre_nov8.dump"
  write_dup_pending
  sql_file neg "$WORK/seed-dup-pending.sql" "neg-A-dup-pending.log" >/dev/null
  log "[neg] documented preflight query (migration header) must now return one row"
  psql "$(url neg)" -X -c "SELECT \"studentId\", \"courseId\", count(*) FROM \"payments\" WHERE \"status\" = 'PENDING' GROUP BY 1, 2 HAVING count(*) > 1;"
  local rc=0
  log_cmd "prisma migrate deploy (real schema) against ${DB_PREFIX}neg"
  ( cd "$BACKEND" && DATABASE_URL="$(url neg)" pnpm exec prisma migrate deploy --schema "$SCHEMA" ) >"$WORK/logs/neg-deploy.log" 2>&1 || rc=$?
  tail -n 12 "$WORK/logs/neg-deploy.log"
  echo "deploy exit code: $rc"
  log "[neg] history: the failed migration row must be unfinished, and no coupon columns may exist (atomic per migration)"
  history_of neg | tail -n 4
  sql_capture neg "$WORK/neg-payments-columns.sql" "neg-payments-columns.log"

  log "[neg] recovery: delete the duplicate row, mark the failed migration rolled back, redeploy"
  log_cmd "DELETE FROM payments WHERE id = 'pay_pending_dup'  (${DB_PREFIX}neg)"
  psql "$(url neg)" -X -v ON_ERROR_STOP=1 -c "DELETE FROM payments WHERE id = 'pay_pending_dup';"
  log_cmd "prisma migrate resolve --rolled-back 20261108130000_payment_coupon_redemptions (${DB_PREFIX}neg)"
  ( cd "$BACKEND" && DATABASE_URL="$(url neg)" pnpm exec prisma migrate resolve --rolled-back 20261108130000_payment_coupon_redemptions --schema "$SCHEMA" ) 2>&1 | tail -n 3
  deploy neg "$SCHEMA" "neg-C-redeploy.log"
  status_show neg
  snapshot neg neg-final
  compare "pre-final" "neg-final (after recovery)" "$WORK/snap/pre-final.tsv" "$WORK/snap/neg-final.tsv"
}

main() {
  log "Environment"
  echo "work dir: $WORK"
  echo "repo: $LMS_ROOT ($(git -C "$LMS_ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown))"
  admin -At -c "select version();"
  echo "psql: $(psql --version)"
  echo "pg_dump: $(pg_dump --version)"
  echo "prisma: $(cd "$BACKEND" && pnpm exec prisma --version | grep '^prisma ' )"
  echo "migration folders: $(ls "$PRISMA_DIR/migrations" | grep -c '^2')"
  write_core_seed
  write_academy_seed
  write_truncation_probe
  write_negative_checks

  run_empty
  run_empty_staged
  run_swap
  run_init_state
  run_pre_state
  run_restore
  run_negative_pending

  log "Final schema comparison across every path (expect identical)"
  local ref="$WORK/snap/pre-final.schema.sql"
  compare "pre (B, representative)" "empty (E)" "$ref" "$WORK/snap/empty-final.schema.sql"
  compare "pre (B, representative)" "empty staged (E2)" "$ref" "$WORK/snap/empty2-final.schema.sql"
  compare "pre (B, representative)" "init + core data (C)" "$ref" "$WORK/snap/init-final.schema.sql"
  compare "pre (B, representative)" "reversed same-prefix (S)" "$ref" "$WORK/snap/swap-final.schema.sql"

  log "Summary of timings (label, ms, exit code)"
  cat "$TIMINGS"
  log "Done. Logs: $WORK/logs  Snapshots: $WORK/snap  Backup: $WORK/backup"
}

main "$@"
