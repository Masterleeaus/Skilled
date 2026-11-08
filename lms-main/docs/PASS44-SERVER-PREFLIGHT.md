# Titan Academy — isolated server preflight (read-only)

Run on the actual DirectAdmin server **as admin** after copying the cumulative source to a private staging directory. No root needed for the checks:

```bash
cd /home/admin/apps/academy-staging/lms-main
ACADEMY_FRONTEND_PORT=3004 ACADEMY_BACKEND_PORT=5002 node scripts/preflight-server.mjs
```

This checks TCP listeners (not ownership), DirectAdmin/Field/Desk paths, PostgreSQL readiness, DNS and certificate validity. It neither installs packages nor changes services. Node 20+ is required. Before installation, check Docker's published port bindings separately with root authorization; an available TCP port is not proof that all resources are conflict-free. If `academy.titanzero.io` is not yet issued a matching certificate, complete DirectAdmin HTTPS setup first. Do not alter Field or Desk virtual hosts.

**Next checks on the server:** identify the root-managed service bound to port 3002; verify port 3004/5002 are free; audit `pnpm-lock.yaml` with pinned pnpm 10.0.0; create Academy-only PostgreSQL credentials after confirming actual server version. PostgreSQL migrations run only on the dedicated `titan_academy` database and require explicit approval.
