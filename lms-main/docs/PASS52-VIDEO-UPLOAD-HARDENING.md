# Titan Academy Pass 52 — Private video upload hardening

**Status:** Offline service tests completed. Full build, MinIO and real multipart HTTP tests pending.

## Confirmed baseline weakness

The prior video upload route accepted a 500 MB multipart request into Multer's memory storage **before** checking lesson ownership. With 5.5 GiB physical RAM on the inspected DirectAdmin server, simultaneous uploads could cause significant memory pressure, and an unauthorized teacher could consume object storage before the subsequent ownership check rejected the lesson update.

## Pass 52 changes

- Course ownership is verified after authentication but **before** the multipart middleware runs.
- Multer uses disk-backed temporary files, under a `0700` directory owned by the app user rather than heap buffering up to 500 MB per request.
- Uploaded video content is transferred to MinIO using a file stream rather than a full in-memory Buffer.
- Temporary files are removed on successful or failed MinIO transfers.
- The ownership-checked lesson update remains in place to protect against permissions changing during transfer.
- A failed lesson database update triggers best-effort removal of the newly uploaded MinIO object.
- A new executable service test streams a real temporary file against a mocked MinIO interface, validates cleanup in success/failure cases, and asserts authorization order.

## Operations and remaining checks

- The OS temporary directory must have enough disk space for concurrent uploads; configure upload limits and monitor usage.
- The application account must have permission to create its private `titan-academy-uploads-<uid>` directory. After process crashes, remove only verified orphan files owned by Academy, never clean shared `/tmp` indiscriminately.
- Real multipart requests, oversized uploads, client disconnect handling, Apache upload timeouts, antivirus/content sniffing, and MinIO failure recovery still need integration tests.
- Signed MinIO download URLs currently reference the internal object-storage endpoint. A production-safe external media delivery route or independently protected hostname/proxy configuration is still needed before claiming browser video playback works.
- This pass did not run migrations, install packages, or touch live Field/Desk services.

## Build blocker

The tool environment reports `EAI_AGAIN` resolving `registry.npmjs.org` and lacks a working pnpm executable. The dependency-installed backend and Next.js production builds **were not executed**. Run them in an isolated Academy directory on the DirectAdmin server after dependency and database preflight; never invoke the inherited development Compose stack.
