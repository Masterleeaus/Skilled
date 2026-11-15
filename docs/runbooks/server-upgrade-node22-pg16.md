# Server upgrade runbook: Node 22 and PostgreSQL 16 (SkilledAt.Work)

Status: **checklist only. Nothing in this file has been run on any server.** Every command is a step for an operator to follow and record. Do not treat a step as done until its verification output is recorded outside the repository.

Scope: the Skilled (SkilledAt.Work) production host, an AlmaLinux 9 server running DirectAdmin and Apache 2.4 (recorded in `docs/ACADEMY-PASS43-DEPLOYMENT-PREFLIGHT.md`). The Titan Field and Titan Desk services share this host and must keep working.

Conventions:
- `<PLACEHOLDER>` is a value the operator supplies from the secret store or the server. Never paste a real value into this file, a commit, a ticket or chat.
- **UNCONFIRMED** marks anything the repository cannot confirm. Each one needs a check on the server, or an owner decision, before it is relied on.
- Run commands as the `admin` account unless a step says `root`. Use `sudo` only where a step says so.

---

## 0. Owner decisions and do-not-touch rules

Record each decision before starting.

| # | Rule | Source |
|---|---|---|
| D1 | The shared PostgreSQL 13 server on port 5432 is **not upgraded and not modified** by this runbook. Upgrading it needs a separate backup and a separate approved rollback. | `docs/ACADEMY-PASS43-DEPLOYMENT-PREFLIGHT.md` (step 3) |
| D2 | PostgreSQL 16 is provisioned as a **separate Academy-only cluster on 127.0.0.1:5433**, with its own data directory and service unit. | `curriculum/research/DEPLOY-RUNBOOK.md` section 1 |
| D3 | Field and Desk Node versions, vhosts, containers, databases and processes are not changed. | `curriculum/research/DEPLOY-RUNBOOK.md` section 0 |
| D4 | `docker-compose.local-dev.yml` never runs on this host. It publishes 5432 and uses development credentials. | same, section 0 |
| D5 | The LMS hostname is the apex `skilledat.work`. The API hostname is **UNCONFIRMED** (not named in the repository). | owner decision; `.env.production.example` |
| D6 | Node 22 is the target. The root and `apps/backend` `package.json` files state `"engines": { "node": ">=22" }`. pnpm is pinned to `10.0.0`. | `package.json` |

---

## 1. Facts from the repository

- Node 22 is used by every CI job (`.github/workflows/skilled-ci-gates.yml` and others, "Set up Node 22 and pnpm 10").
- PostgreSQL 16 is used by CI (`.github/workflows/skilled-ci-gates.yml`, `image: postgres:16`) and the README states PostgreSQL 16.
- The production database target is checked by `scripts/check-academy-database-target.mjs`. It requires the role and database `titan_academy` on loopback. The port is not checked by `apps/backend/src/config/env.ts`.
- Redis and MinIO for Academy come from `docker-compose.academy-deps.yml`: `redis:7.4-alpine` on `127.0.0.1:${ACADEMY_REDIS_PORT:-16379}`, and `minio/minio:RELEASE.2025-04-22T22-12-26Z` on `127.0.0.1:${ACADEMY_MINIO_PORT:-19000}` and console `${ACADEMY_MINIO_CONSOLE_PORT:-19001}`. The MinIO image is not yet pinned by digest (tracked in issue #169).
- The API and worker are separate processes: `node apps/backend/dist/server.js` and `node apps/backend/dist/worker.js` (`docs/ACADEMY-PASS45-WORKER-OPERATIONS.md`).
- Frontend and backend preflight defaults are `ACADEMY_FRONTEND_PORT=3004` and `ACADEMY_BACKEND_PORT=5002` (`scripts/preflight-server.mjs`). Treat them as defaults; confirm the ports with `ss -lntp`.
- Historical server observations (PASS43, to recheck, not to trust): Node 20.20.2, pnpm 9.12.0, PostgreSQL client 13.23, Docker installed but the `admin` account has no daemon access.

---

## 2. Preflight (read-only)

1. Record the current state of the host. Nothing here changes anything.
   ```bash
   date -Is; hostname -f; cat /etc/almalinux-release
   node -v 2>/dev/null; pnpm -v 2>/dev/null; which node pnpm
   ss -lntp
   ```
2. Confirm which Node version Field and Desk use. Record it, and do not change it.
   ```bash
   # Find the Node binary used by each Field and Desk service: UNCONFIRMED paths, check each unit or process.
   systemctl list-units --type=service --all | grep -iE 'field|desk|academy|skilled' || true
   ```
3. Confirm the shared PostgreSQL 13 server is still on 5432 and unchanged.
   ```bash
   psql "host=127.0.0.1 port=5432 dbname=postgres user=<ADMIN_ROLE>" -Atqc "SHOW server_version;"
   ```
   Expected: a 13.x version. If it is not, stop and report.
4. Confirm that port 5433 is free before creating the cluster.
   ```bash
   ss -lntp | grep -E ':5433\b' && echo "PORT 5433 IN USE: STOP" || echo "5433 free"
   ```
5. Check the disk space for the new cluster, the backup, and the Node 22 install. Record `df -h` for `/var/lib/pgsql` (or the chosen `<ACADEMY_PG_DATA_DIR>` parent) and `/opt`.
6. Check the memory headroom. Record `free -m`. Field and Desk must keep their current headroom.
7. Check Docker status without changing group membership.
   ```bash
   docker info >/dev/null 2>&1 && echo "docker ok for current user" || echo "docker not accessible to admin (expected per PASS43)"
   ```
   Do not add `admin` to the `docker` group in this runbook. Membership of that group is root-equivalent and needs its own owner approval (see section 8).

---

## 3. Back up before any change

1. Take a logical backup of the Academy database if one already exists on any cluster (section 2 records this). If none exists, record that and skip to section 4. Record the backup identifier.
   ```bash
   pg_dump --format=custom --no-owner --file "<BACKUP_DIR>/academy-pre-upgrade-$(date +%Y%m%dT%H%M%S).dump" \
     "host=127.0.0.1 port=5433 dbname=titan_academy user=titan_academy"
   ```
   The password comes from `~/.pgpass` with mode `0600`, or from `PGPASSWORD` set from the secret store. Do not type it in the command.
2. Record the checksum and the migration names present at the time.
   ```bash
   sha256sum "<BACKUP_DIR>/academy-pre-upgrade-<TIMESTAMP>.dump"
   ```
3. Copy the current environment file and the current systemd unit files to the backup directory with mode `0600`. Do not commit them.
   ```bash
   cp -p /home/admin/apps/academy/.env "<BACKUP_DIR>/env-pre-upgrade.env" && chmod 600 "<BACKUP_DIR>/env-pre-upgrade.env"
   ```
   The `.env` path is the one `.env.production.example` suggests; **UNCONFIRMED** as the location actually in use.
4. Record the current running build artefact (the `dist` folder and the commit) so rollback can restart it. Do not delete it until section 9 is accepted.
5. Confirm the Academy backup restores. Restore into a scratch database, not into production (`docs/runbooks/recovery.md` section 3). This is required before the upgrade is considered safe.

---

## 4. PostgreSQL 16 on port 5433 (Academy only)

Do not run the default `postgresql-16.service` unit. Its default data directory and port 5432 would clash with the shared PostgreSQL 13 server. Use a separate data directory, port and unit name.

1. As `root`, add the PostgreSQL Global Development Group repository for EL-9 and install the server packages. The repository URL is the standard one for AlmaLinux 9; check the version before running.
   ```bash
   sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm
   sudo dnf -qy module disable postgresql
   sudo dnf install -y postgresql16-server postgresql16
   ```
   Do **not** run `postgresql-16-setup initdb` or `systemctl enable postgresql-16`. Those target the default data directory and port.
2. Confirm the binary version.
   ```bash
   /usr/pgsql-16/bin/postgres --version
   ```
   Expected: `postgres (PostgreSQL) 16.x`.
3. As `root`, create the Academy data directory owned by `postgres`. Do not reuse the 5432 directory.
   ```bash
   sudo install -d -m 0700 -o postgres -g postgres <ACADEMY_PG_DATA_DIR>
   ```
4. As the `postgres` user, initialise the cluster. Choose the locale and encoding deliberately (`<LOCALE>`, `<ENCODING>`).
   ```bash
   sudo -u postgres /usr/pgsql-16/bin/initdb -D <ACADEMY_PG_DATA_DIR> --encoding=<ENCODING> --locale=<LOCALE> --auth-local=peer --auth-host=scram-sha-256
   ```
5. Set the configuration in `<ACADEMY_PG_DATA_DIR>/postgresql.conf`. Do not touch the 5432 cluster's files.
   ```
   port = 5433
   listen_addresses = '127.0.0.1'
   password_encryption = scram-sha-256
   ```
6. Create a unit for this cluster only, as `root`, at `/etc/systemd/system/postgresql-16-academy.service`. The file is a template; confirm it against the installed unit file `/usr/lib/systemd/system/postgresql-16.service` before use.
   ```ini
   [Unit]
   Description=PostgreSQL 16 cluster for SkilledAt.Work (Academy only, port 5433)
   After=network.target

   [Service]
   Type=notify
   User=postgres
   Environment=PGDATA=<ACADEMY_PG_DATA_DIR>
   ExecStart=/usr/pgsql-16/bin/postgres -D ${PGDATA}
   ExecReload=/bin/kill -HUP $MAINPID
   KillMode=mixed
   KillSignal=SIGINT
   TimeoutSec=0

   [Install]
   WantedBy=multi-user.target
   ```
   Then run `sudo systemctl daemon-reload`, `sudo systemctl enable --now postgresql-16-academy`.
7. Verify the listener is loopback-only on 5433 and the 5432 listener is unchanged.
   ```bash
   ss -lntp | grep -E ':(5432|5433)\b'
   ```
   Expected: `127.0.0.1:5433` for postgres 16; 5432 is still the PostgreSQL 13 process.
8. Create the Academy role and database as the `postgres` OS user over the local socket. The names are required by the production check (`titan_academy`).
   ```bash
   sudo -u postgres psql -p 5433 -c "CREATE ROLE titan_academy LOGIN;"
   sudo -u postgres psql -p 5433 -c "\password titan_academy"
   sudo -u postgres psql -p 5433 -c "CREATE DATABASE titan_academy OWNER titan_academy;"
   ```
   Set the password interactively with `\password`. Do not put it on the command line or in a file in the repository.
9. Confirm the version and identity from the Academy role.
   ```bash
   psql "host=127.0.0.1 port=5433 dbname=titan_academy user=titan_academy" -Atqc "SHOW server_version; SELECT current_database(), current_user;"
   ```
   Expected: `16.x`, `titan_academy`, `titan_academy`.

### 4a. Only if an Academy database already exists on another version

**UNCONFIRMED:** PASS43 and the DEPLOY-RUNBOOK say the Academy cluster was not created in the repository record. If section 2 found a populated Academy database elsewhere, follow these steps. Otherwise skip to section 5.

1. Use the PostgreSQL 16 client to dump from the old server. A newer `pg_dump` can read an older server; the older one cannot read a newer dump.
   ```bash
   /usr/pgsql-16/bin/pg_dump --format=custom --no-owner --file "<BACKUP_DIR>/academy-from-<OLD_VERSION>.dump" "<OLD_CONNECTION_STRING_FROM_SECRET_STORE>"
   ```
2. Restore into the new cluster.
   ```bash
   /usr/pgsql-16/bin/pg_restore --no-owner --dbname "host=127.0.0.1 port=5433 dbname=titan_academy user=titan_academy" "<BACKUP_DIR>/academy-from-<OLD_VERSION>.dump"
   ```
3. Compare row counts for the Academy tables between old and new. Record the figures. Do not continue on a mismatch.
4. Do not drop or change the old database. It is the rollback copy.

---

## 5. Node 22 for the Academy service only

Node is installed to a separate path. The Field and Desk Node binaries are not changed.

1. Pick the Node 22 release to install (the repository evidence uses v22.23.4 in `PASS42/VERIFY-evidence.md`; use the current 22.x patch and record it). Download the Linux x64 tarball and the checksum file from nodejs.org, then verify.
   ```bash
   NODE_VERSION=<NODE_22_VERSION>
   cd "<DOWNLOAD_DIR>"
   curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz"
   curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt"
   grep " node-v${NODE_VERSION}-linux-x64.tar.xz$" SHASUMS256.txt | sha256sum -c -
   ```
   Stop if the check does not print `OK`.
2. Extract to a new directory under `/opt`, and do not replace any existing Node.
   ```bash
   sudo mkdir -p /opt/node-v${NODE_VERSION}
   sudo tar -xJf "node-v${NODE_VERSION}-linux-x64.tar.xz" -C /opt/node-v${NODE_VERSION} --strip-components=1
   /opt/node-v${NODE_VERSION}/bin/node -v
   ```
   Expected: `v22.x.y`.
3. Use this Node binary by absolute path in the Academy service units (section 7). Do not change `PATH` or the default `node` on the host.
4. Enable pnpm 10.0.0 for this project only, through Corepack. Do not replace a global pnpm used by other apps.
   ```bash
   /opt/node-v${NODE_VERSION}/bin/corepack enable --install-directory "<ACADEMY_BIN_DIR>"
   PATH="<ACADEMY_BIN_DIR>:$PATH" pnpm -v
   ```
   Expected: `10.0.0`.

---

## 6. Build the Academy release on Node 22

Run from a new staging directory, not from a live release directory.

1. Create a staging directory for the new release, and extract the repository source at the release commit into it. Record the commit ID.
2. Install from the lockfile without changes.
   ```bash
   cd "<STAGING_DIR>"
   PATH="<ACADEMY_BIN_DIR>:/opt/node-v${NODE_VERSION}/bin:$PATH" pnpm install --frozen-lockfile
   ```
3. Generate the Prisma client and build the backend.
   ```bash
   cd "<STAGING_DIR>/apps/backend"
   PATH="/opt/node-v${NODE_VERSION}/bin:$PATH" npx prisma generate
   PATH="/opt/node-v${NODE_VERSION}/bin:$PATH" npm run build
   ```
4. Build the frontend. Set the public origin at build time. `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_API_URL` are browser-visible; never put a secret in them.
   ```bash
   cd "<STAGING_DIR>/apps/frontend"
   NEXT_PUBLIC_SITE_URL="https://skilledat.work" NEXT_PUBLIC_API_URL="https://<API_HOST>/api" \
     PATH="/opt/node-v${NODE_VERSION}/bin:$PATH" npm run build
   ```
   `<API_HOST>` is **UNCONFIRMED** (owner decision D5).
5. Run the repository's read-only gates on the staging build before any switch. The curriculum publisher and the migration audit are not run in this section.
   ```bash
   cd "<STAGING_DIR>"
   PATH="/opt/node-v${NODE_VERSION}/bin:$PATH" node scripts/check-academy-database-target.mjs
   ```
   The database check reads `DATABASE_URL` only, and does not connect. Expected: a pass.

---

## 7. Switch the Academy services

The API and the worker each run under their own supervisor (`docs/ACADEMY-PASS45-WORKER-OPERATIONS.md`). Both must restart after the change, because both read the environment at start.

1. Update `DATABASE_URL` in the private environment file to the port 5433 cluster. The port is not checked by `env.ts`, so verify it yourself.
   ```
   DATABASE_URL="postgresql://titan_academy:<DB_PASSWORD_FROM_SECRET_STORE>@127.0.0.1:5433/titan_academy?schema=public"
   ```
   Keep mode `0600`. Do not print the value.
2. Confirm the other required variables are set. Check the names only.
   ```bash
   grep -oE '^[A-Z_]+=' /home/admin/apps/academy/.env | sort | tr -d '=' > /tmp/academy-env-names.txt; wc -l /tmp/academy-env-names.txt
   ```
   Compare against the table in `curriculum/research/DEPLOY-RUNBOOK.md` section 4. Required: `CLIENT_URL` set to `https://skilledat.work`, `NODE_ENV=production`, both JWT secrets at least 32 characters.
3. Apply migrations to the Academy database, after the backup in section 3 and with no curriculum publish or import running.
   ```bash
   cd "<STAGING_DIR>/apps/backend"
   DATABASE_URL="<from secret store>" PATH="/opt/node-v${NODE_VERSION}/bin:$PATH" npx prisma validate
   DATABASE_URL="<from secret store>" PATH="/opt/node-v${NODE_VERSION}/bin:$PATH" npx prisma migrate status
   DATABASE_URL="<from secret store>" PATH="/opt/node-v${NODE_VERSION}/bin:$PATH" npx prisma migrate deploy
   ```
   Never run `prisma migrate reset`, `db push --force-reset`, or the repo's `prisma:migrate` script (it runs `migrate dev`). Before applying `20261102210000_academy_certificate_idempotency`, the duplicate check in `scripts/check-certificate-duplicates.sql` must return no rows (`docs/ACADEMY-PASS45-WORKER-OPERATIONS.md`).
4. Stop the old API and worker, then start the new ones from the staging build, using the Node 22 binary by absolute path. Example unit templates (**UNCONFIRMED** against the server; save them outside the repository):
   ```ini
   # /etc/systemd/system/academy-api.service (template)
   [Service]
   User=admin
   WorkingDirectory=<RELEASE_DIR>/apps/backend
   EnvironmentFile=/home/admin/apps/academy/.env
   ExecStart=/opt/node-v<NODE_22_VERSION>/bin/node dist/server.js
   Restart=on-failure

   # /etc/systemd/system/academy-worker.service (template)
   [Service]
   User=admin
   WorkingDirectory=<RELEASE_DIR>/apps/backend
   EnvironmentFile=/home/admin/apps/academy/.env
   ExecStart=/opt/node-v<NODE_22_VERSION>/bin/node dist/worker.js
   Restart=on-failure
   ```
   Then `sudo systemctl daemon-reload && sudo systemctl restart academy-api academy-worker`.
5. Switch the release directory with a symlink, so rollback is one command. Keep the old release directory.
   ```bash
   ln -sfn "<RELEASE_DIR>" "<CURRENT_LINK>"
   ```
   Do not overwrite the directory the old service runs from.
6. Do not start the curriculum publish watcher as part of the switch. The publisher writes lesson revisions with the review gate switched off for each call (`curriculum/research/DEPLOY-RUNBOOK.md` section 6). That needs its own owner approval.

---

## 8. Apache vhost, certificate and DNS for skilledat.work

### 8a. DNS (owner action)

1. The apex `skilledat.work` must have an `A` record that points to this server. The server IP is recorded in `docs/ACADEMY-PASS43-DEPLOYMENT-PREFLIGHT.md`; re-verify it, do not trust that record.
   ```bash
   dig +short A skilledat.work
   ```
   Expected: the server's public IP.

### 8b. DirectAdmin domain and custom Apache configuration

1. In DirectAdmin, create or select the account and the domain `skilledat.work`. Do not change the Field or Desk domains or their vhosts.
2. Use DirectAdmin's custom HTTPD configuration for the `skilledat.work` domain only. The exact menu path and file location are **UNCONFIRMED** for this server; use the DirectAdmin interface, and do not edit the generated vhost files for the other domains.
3. Confirm the Apache modules needed by the proxy are loaded (`httpd -M | grep -E 'proxy|headers|rewrite|ssl'`). Apache is 2.4.68 per PASS43.
4. Add the proxy block below to the `skilledat.work` custom configuration. Replace the ports with the ones confirmed in section 2 (`<FRONTEND_PORT>`, `<BACKEND_PORT>`). The default values in `scripts/preflight-server.mjs` are 3004 and 5002.
   ```apache
   ProxyPreserveHost On
   RequestHeader set X-Forwarded-Proto "https"

   # API first, so /api does not fall through to the frontend.
   ProxyPass        /api/ http://127.0.0.1:<BACKEND_PORT>/api/
   ProxyPassReverse /api/ http://127.0.0.1:<BACKEND_PORT>/api/

   # Frontend (Next.js) for everything else.
   ProxyPass        / http://127.0.0.1:<FRONTEND_PORT>/
   ProxyPassReverse / http://127.0.0.1:<FRONTEND_PORT>/
   ```
   The backend binds to loopback (`HOST=127.0.0.1`) and trusts forwarded client IPs only from loopback proxies (`docs/PASS51-DEPLOYMENT-VERIFICATION.md`). Keep the backend on 127.0.0.1.
5. Test the configuration, then reload Apache through DirectAdmin's own reload. Do not restart other domains.
   ```bash
   sudo apachectl -t
   ```
   Expected: `Syntax OK`. Reload through DirectAdmin. **UNCONFIRMED** whether a manual `systemctl reload httpd` is appropriate on this host; prefer DirectAdmin's reload.

### 8c. Certificate

1. Provision a certificate for `skilledat.work` only, through DirectAdmin's SSL certificate page (Let's Encrypt, if the DirectAdmin plugin is enabled, or an uploaded certificate). **UNCONFIRMED** which method is used on this host. The certificate must match the hostname exactly; PASS43 found the old `academy.titanzero.io` host presenting an invalid hostname certificate.
2. Confirm the served certificate for the new name, without printing a private key.
   ```bash
   echo | openssl s_client -connect skilledat.work:443 -servername skilledat.work 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
   ```
   Expected: `subject` or `subjectAltName` includes `skilledat.work`, and `notAfter` is in the future.
3. Confirm the renewal is scheduled in DirectAdmin. Record the next renewal date.
4. Do not change certificates on Field or Desk domains.

---

## 9. Docker (Redis and MinIO only)

PostgreSQL does not run in Docker for Academy. Only Redis and MinIO are in Docker, from `docker-compose.academy-deps.yml`.

1. Check that the Docker daemon is reachable for the account that runs the compose file. PASS43 recorded that `admin` could not reach it. Use the owner-approved method. Do not add `admin` to the `docker` group without an owner decision.
2. Validate the compose file and the private env file without starting anything. `config` only renders the file.
   ```bash
   cd "<RELEASE_DIR>"
   docker compose -f docker-compose.academy-deps.yml --env-file "<PRIVATE_COMPOSE_ENV_FILE>" config >/dev/null && echo "compose config valid"
   ```
   Never run `docker compose up` without `-f`. Do not run the inherited local-dev compose file.
3. Confirm the ports `16379`, `19000` and `19001`, or the values chosen in the private env file, are free and loopback-bound.
   ```bash
   ss -lntp | grep -E ':(16379|19000|19001)\b' || echo "ports free"
   ```
4. Pin the MinIO image by digest, which is the open part of issue #169, and only after the image is validated. Record the digest. This step is not in this upgrade's scope; flag it if it is not done.
5. Start the dependencies only after the owner's approval.
   ```bash
   docker compose -f docker-compose.academy-deps.yml --env-file "<PRIVATE_COMPOSE_ENV_FILE>" up -d
   docker compose -f docker-compose.academy-deps.yml ps
   ```
6. Redis version stays `7.4-alpine` in this runbook. A change to Redis is a separate decision.

---

## 10. Verification

Record each output. A failed check is a rollback trigger (section 11).

1. Versions:
   ```bash
   /opt/node-v<NODE_22_VERSION>/bin/node -v          # expected v22.x.y
   <ACADEMY_BIN_DIR>/pnpm -v                          # expected 10.0.0
   /usr/pgsql-16/bin/postgres --version               # expected 16.x
   psql "host=127.0.0.1 port=5433 dbname=titan_academy user=titan_academy" -Atqc "SHOW server_version;"   # expected 16.x
   ```
2. Ports and listeners:
   ```bash
   ss -lntp | grep -E ':(5432|5433|<FRONTEND_PORT>|<BACKEND_PORT>|16379|19000)\b'
   ```
   Expected: 5432 still PostgreSQL 13 and unchanged. 5433 on 127.0.0.1 only. Backend on 127.0.0.1 only.
3. Database target and migration status:
   ```bash
   cd "<RELEASE_DIR>" && PATH="/opt/node-v<NODE_22_VERSION>/bin:$PATH" node scripts/check-academy-database-target.mjs
   cd "<RELEASE_DIR>/apps/backend" && DATABASE_URL="<from secret store>" PATH="/opt/node-v<NODE_22_VERSION>/bin:$PATH" npx prisma migrate status
   ```
   Expected: the target check passes, and the migration status reports no pending migrations.
4. Public smoke test. This is read-only, with no credentials. It checks the frontend HTML, `/api/health` (PostgreSQL, Redis and object storage), and `/api/courses`.
   ```bash
   node "<RELEASE_DIR>/scripts/academy-runtime-smoke.mjs" https://skilledat.work
   ```
   Expected: exit code 0.
5. Health endpoint on the backend, on loopback:
   ```bash
   curl -fsS http://127.0.0.1:<BACKEND_PORT>/api/health
   ```
6. Certificate and redirect (section 8c). Confirm the new certificate is served.
7. Learner flow in a browser: sign in as a test learner, open a published course, and confirm the page loads over HTTPS without a certificate warning. Use test accounts only.
8. Indexing check: `curl -fsS https://skilledat.work/robots.txt` should show `Disallow: /` once the noindex change is in the deployed build.
9. Field and Desk health. Run their own checks, which are **UNCONFIRMED** in this repository. Record the result before and after. Do not continue if either service is worse after the switch.

---

## 11. Rollback

Roll back when any of these occur within 30 minutes of the switch (see also `docs/runbooks/deployment.md` section 6):
- the health check, the smoke test, or the API returns errors after the switch;
- learners see draft or unapproved content;
- a migration fails midway;
- Field or Desk health degrades.

Actions, in order:

1. Stop the new API and worker.
   ```bash
   sudo systemctl stop academy-api academy-worker
   ```
2. Point the release symlink back to the previous release directory. Restore the previous unit files if the Node binary path in them changed.
   ```bash
   ln -sfn "<PREVIOUS_RELEASE_DIR>" "<CURRENT_LINK>"
   ```
3. Restore the previous environment file, if `DATABASE_URL` was changed.
   ```bash
   install -m 0600 "<BACKUP_DIR>/env-pre-upgrade.env" /home/admin/apps/academy/.env
   ```
4. If a migration applied partially, do not edit tables by hand. Restore the pre-migration backup into staging first, reproduce the failure there, and only then decide how to repair production (`docs/runbooks/recovery.md` section 5).
5. Start the previous API and worker with the previous Node binary, then re-run the verification in section 10.
6. Leave the PostgreSQL 16 cluster in place. Stop it only if the owner decides, with `sudo systemctl stop postgresql-16-academy`. Never stop or change the 5432 cluster as part of rollback.
7. Record the rollback, its timing and the trigger in the incident log.

---

## 12. Owner actions needed

1. Approve the shared PostgreSQL 13 on 5432 staying unchanged (D1), or give a separate approval for its upgrade with its own backup and rollback.
2. Name the API hostname (D5).
3. Confirm the DirectAdmin SSL method and the custom HTTPD location (sections 8b and 8c).
4. Approve any Docker group change for the deploy account (section 9). This is root-equivalent and is not part of this runbook.
5. Approve the MinIO digest pin (issue #169) before production rollout.
6. Decide whether the curriculum publisher runs in production at all. It writes revisions with the review gate off (section 7, step 6).
7. Confirm the Field and Desk Node versions (section 2, step 2) and their health checks (section 10, step 9).

---

## 13. Record

For this upgrade, keep outside the repository and link from the deployment register item:
- commit ID of the release;
- Node 22 patch version and the checksum result;
- PostgreSQL 16 minor version and the 5433 listener check;
- backup identifier, checksum and migration names;
- migrations applied;
- verification outputs from section 10;
- the rollback decision, if any;
- the operator.
