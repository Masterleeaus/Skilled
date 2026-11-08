# Pass 20 — Migration chain preflight

Run `python3 apps/backend/scripts/audit-migrations.py` from the repository root before deploying migrations.

This checks SQL migration order, duplicate table creation, missing referenced tables, empty files and destructive table drops. It is **not** a substitute for `prisma validate`, `prisma migrate deploy`, a clean PostgreSQL database, or a rollback rehearsal.

**Known issue:** Two historical migrations share the timestamp `20261102000100` but have distinct directory names. Prisma uses full directory names; do not rename an already-applied migration, because that changes migration history. Keep them unchanged and verify their ordering and checksums against each target database before deployment.

Recommended staging commands once dependencies and a PostgreSQL database are available:

```sh
python3 apps/backend/scripts/audit-migrations.py
cd apps/backend
npx prisma validate
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
npm run build
```

Do not run `migrate reset` on a production database. Back up the database before deployment. No production deployment or PostgreSQL test was performed during this pass.
