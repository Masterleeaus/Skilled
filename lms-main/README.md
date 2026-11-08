# Titan Academy

> **Titan Academy production safety (Pass 43):** This repository contains a separately staged, unverified production candidate. **Do not run** `docker compose up` or inherited bootstrap scripts on an existing DirectAdmin server. The original developer Compose configuration is saved as `docker-compose.local-dev.yml` and is not suitable for production. See [Academy production preflight](docs/ACADEMY-PASS43-DEPLOYMENT-PREFLIGHT.md).

Titan Academy is a training platform for field and home-service businesses. It combines a course and learner base with curriculum composition, knowledge checks, practical evidence and assessor review, organisation-scoped training, and business-specific lesson context with immutable presentation snapshots.

The codebase was started from an inherited full-stack LMS (see [Origin and licence](#origin-and-licence)). Inherited modules are kept where Titan Academy still uses them. Their behaviour is not re-verified for Titan Academy. Verification status for every open item is tracked in [`TITAN-ACADEMY-MASTER-IMPROVEMENT-REGISTER.md`](TITAN-ACADEMY-MASTER-IMPROVEMENT-REGISTER.md).

> **Status:** not production-verified. Dependency-enabled builds, PostgreSQL migration runs, live integration contracts and a full browser workflow against a live API have not been verified. See the register (ACA-001 to ACA-004, ACA-018).

![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [API Overview](#api-overview)
- [Testing and Quality Gates](#testing-and-quality-gates)
- [Documentation](#documentation)
- [Origin and licence](#origin-and-licence)

---

## Overview

Titan Academy delivers training that a business can configure without changing the canonical lesson content:

- **Canonical lessons and revisions.** Lesson content is versioned. Only published revisions reach learners. Curriculum drafts stay in review until a human approves them.
- **Tracks and course composition.** Published tracks are attached to courses. Each placement is marked required or optional.
- **Knowledge checks.** Learners answer questions, and the server grades them. Answer keys are never sent to learners.
- **Practical evidence.** Learners submit evidence. An assessor in the organisation approves or rejects it. Approval creates a verified competency that can expire. Acknowledging a lesson never creates a competency.
- **Organisation training.** Managers assign courses to members of their organisation.
- **Business-specific context.** Managers set field values. Only approved values appear in learner lessons. Each presentation is saved as an immutable snapshot with a content hash, and the hash is re-verified when the snapshot is read.
- **Integration.** Service credentials and external identities are provisioned per organisation. Integration routes are tenant-scoped and audited.
- **Completion reports.** Managers and assessors can read evidence-backed completion reports for a learner or an organisation (see [API Overview](#api-overview)).

---

## Features

### Academy additions
- Curriculum tracks, lesson revisions and placements, with publication gates
- Learner acknowledgements, separate from practical competency
- Server-graded knowledge checks (80% pass threshold)
- Practical evidence submission, assessor review and expiring competencies
- Organisation membership, roles (owner, manager, assessor, learner) and training assignments
- Business lesson fields with draft, approve and retire states
- Organisation-scoped lesson context snapshots with history paging and integrity checks
- Evidence-backed learner and organisation completion reports

### Inherited LMS base (retained where used)
- Course, module and lesson management, with video upload
- Enrolment and per-lesson progress tracking
- Quizzes with auto-grading for single-choice questions
- Assignments, live classes, attendance and certificates
- Payments with Stripe provider abstraction and coupons
- Discussion threads, reviews and an admin analytics and audit view
- JWT access tokens with revocable refresh tokens, role-based access control, rate limiting, soft delete, centralised error handling and structured logging

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Zustand, TanStack Query, React Hook Form + Zod |
| **Backend** | Node.js, Express 5, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16 (Prisma migrations under `apps/backend/prisma/migrations`) |
| **Cache / Queue** | Redis, BullMQ (email and certificate workers) |
| **Object storage** | MinIO (S3-compatible) |
| **Auth** | JWT (access and refresh), bcrypt, per-device session revocation |
| **Payments** | Stripe (test mode), provider-abstracted |
| **Testing** | Vitest, Supertest, Playwright (Chromium), axe-core |
| **Infrastructure** | Docker Compose (Postgres, Redis, MinIO, Mailhog), pnpm workspaces |

---

## Folder Structure

```
lms-main/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── modules/          # feature slices: auth, courses, quizzes, curriculum (Academy), ...
│   │   │   ├── middleware/       # authentication, RBAC, centralised error handler
│   │   │   ├── jobs/             # BullMQ processors (email, certificates)
│   │   │   ├── config/           # env validation, logger, Prisma, Redis, MinIO clients
│   │   │   └── tests/            # Vitest and Supertest suites (Academy suites use an in-memory Prisma double)
│   │   ├── prisma/               # schema, migrations, seed and curriculum import scripts
│   │   └── scripts/              # verification scripts
│   └── frontend/
│       ├── src/                  # App Router pages, typed API clients, stores, components
│       ├── scripts/              # source-level UI checks
│       └── tests/browser/        # Playwright browser suite for the lesson player (mocked API)
├── curriculum/                   # lesson drafts, normalisation index, assessment files, CI baseline
├── scripts/                      # curriculum audits, reconciliation and the curriculum CI gate
├── docs/runbooks/                # deployment, secrets and recovery runbooks
├── packages/shared/              # cross-app shared code (reserved)
└── docker-compose.local-dev.yml  # Historical LOCAL development services only
```

---

## Getting Started

### Prerequisites
- Node.js 20 or later
- pnpm 10 or later
- Docker (for Postgres, Redis, MinIO and Mailhog)

### Setup

```bash
git clone <repository-url> titan-academy
cd titan-academy

pnpm install

cp .env.example .env          # then set every secret; see docs/runbooks/secrets-handling.md

# start infrastructure
docker compose -f docker-compose.local-dev.yml up -d  # LOCAL DEVELOPMENT ONLY; NOT PRODUCTION

cd apps/backend
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

In a second terminal:

```bash
cd apps/frontend
echo 'NEXT_PUBLIC_API_URL="http://localhost:5000/api"' > .env.local
pnpm dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Mailhog (local email) | http://localhost:8025 |
| MinIO console | http://localhost:9001 (local development credentials only) |

Environment-specific guidance is in [`docs/runbooks/`](docs/runbooks/).

---

## Demo Accounts

These accounts are created by the local seed script (`pnpm prisma:seed`). They are for local development only. Do not seed them into a shared or production environment. All accounts share one password, which must never be reused.

| Role | Email | Password |
|---|---|---|
| Admin | admin@lms.local | Password123! |
| Teacher | teacher@lms.local | Password123! |
| Student | student@lms.local | Password123! |

The `@lms.local` domain is a seed identifier kept for compatibility with the existing seed data and tests.

---

## API Overview

Route modules live in `apps/backend/src/modules/*/*.routes.ts`. Every response uses the envelope `{ "success": true, "message": "...", "data": {} }`.

| Base path | Purpose |
|---|---|
| `/api/auth` | Register, login, refresh, logout, email verification, password reset |
| `/api/courses` | Course, module and lesson management, video upload |
| `/api/enrollments` | Enrolment, progress tracking, course roster |
| `/api/quizzes` | Quiz builder, attempts, auto-grading |
| `/api/assignments` | Assignments, submissions, grading |
| `/api/classes` | Live class scheduling and attendance |
| `/api/certificates` | Certificate issuance and public verification |
| `/api/payments` | Stripe checkout and coupons |
| `/api/discussions` | Course Q&A threads and replies |
| `/api/admin` | User management and platform analytics |
| `/api/audit-logs` | Platform audit trail |
| `/api/academy/curriculum` | Academy tracks, lessons, outlines, completions, knowledge checks, practical evidence, organisations, business fields, lesson context snapshots, and completion reports |
| `/api/titan/integration` | Service-to-service skill verification (credential-scoped) |

Completion reports (ACA-025):

| Route | Access |
|---|---|
| `GET /api/academy/curriculum/companies/:companyId/completion-reports/learners/:learnerId` | The learner, or an owner, manager or assessor of the same organisation |
| `GET /api/academy/curriculum/companies/:companyId/completion-reports` | Owners and managers of the organisation |

A lesson acknowledgement in these reports is a learning record. It is not a verified competency or a certificate.

---

## Testing and Quality Gates

The commands below are the ones used in the PASS42 quality pass. Exact results, including failures, are recorded in [`PASS42/QUALITY-ops.md`](PASS42/QUALITY-ops.md).

```bash
# Academy backend suites (no database required; uses an in-memory Prisma double)
pnpm test:academy:backend

# Full backend Vitest run (currently fails; see PASS42/QUALITY-ops.md for the causes)
cd apps/backend && pnpm test

# Lesson player browser suite (starts next dev on port 3100 with a mocked API)
cd apps/frontend && node tests/browser/academy-browser-suite.mjs --report ../../build/browser-report.json

# Curriculum structure and normalisation gate (fails on structural breaks and on regressions)
pnpm curriculum:ci
```

The Academy backend suites run against an in-memory Prisma double. They exercise the real services and routers, but they do not replace testing against PostgreSQL (register ACA-003). The browser suite verifies the lesson player UI against a mocked API. It does not verify the live API (register ACA-019).

The inherited `pass22` integration check (`apps/backend/tests/pass22-inactive-identity.test.cjs`) is a source-level script, not a Vitest suite, so Vitest reports it as failing. It is recorded in the quality evidence.

---

## Documentation

- [`TITAN-ACADEMY-MASTER-IMPROVEMENT-REGISTER.md`](TITAN-ACADEMY-MASTER-IMPROVEMENT-REGISTER.md): open items and acceptance criteria
- [`TITAN-ACADEMY-PASS1.md`](TITAN-ACADEMY-PASS1.md), [`TITAN-ACADEMY-PASS2.md`](TITAN-ACADEMY-PASS2.md): curriculum composition passes
- [`TITAN-ACADEMY-CURRICULUM-IMPORT.md`](TITAN-ACADEMY-CURRICULUM-IMPORT.md): curriculum import behaviour
- [`TITAN-ACADEMY-CLEANING-LESSONS.md`](TITAN-ACADEMY-CLEANING-LESSONS.md): cleaning vertical lesson notes
- [`docs/runbooks/`](docs/runbooks/): deployment, secrets handling and recovery
- [`docs/FIELD_SERVICES_CONTEXT_SYNC.md`](docs/FIELD_SERVICES_CONTEXT_SYNC.md): Field Services context synchronisation contract

---

## Origin and licence

Titan Academy began from an inherited MIT-licensed full-stack LMS. Its original author is Farrukh Ali Khan. The copyright notice is retained in [`LICENSE`](LICENSE), as the MIT licence requires.

Released under the [MIT License](LICENSE).
