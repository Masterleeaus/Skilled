#!/usr/bin/env bash
set -e

ROOT="lms"
echo "==> [1/2] Scaffolding structure at ./$ROOT (no installs)"

mkdir -p "$ROOT"
cd "$ROOT"

# ---------------- root package.json ----------------
cat > package.json << 'EOF'
{
  "name": "lms",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "dev": "pnpm --parallel --filter ./apps/* dev",
    "build": "pnpm --filter ./apps/* build",
    "lint": "pnpm --filter ./apps/* lint"
  },
  "engines": { "node": ">=20" }
}
EOF

cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

# ---------------- gitignore ----------------
cat > .gitignore << 'EOF'
node_modules
dist
.next
build
coverage
.turbo
*.log
.vscode
.idea
minio-data
postgres-data
redis-data
.env.*
!.env.example
EOF

# ---------------- editorconfig / prettier / license ----------------
cat > .editorconfig << 'EOF'
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
EOF

cat > .prettierrc << 'EOF'
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
EOF

cat > .eslintrc.json << 'EOF'
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "env": { "node": true, "es2022": true },
  "rules": {}
}
EOF

cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026 Ali

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
EOF

cat > README.md << 'EOF'
# LMS

Portfolio-grade Learning Management System — Next.js 15, Express, Prisma, PostgreSQL, Redis, MinIO.

Setup instructions coming in Phase 4 (see project plan).
EOF

cat > .env.example << 'EOF'
# --- Postgres ---
DATABASE_URL="postgresql://lms:lms@localhost:5432/lms?schema=public"

# --- Redis ---
REDIS_URL="redis://localhost:6379"

# --- JWT ---
JWT_ACCESS_SECRET="change_me_access"
JWT_REFRESH_SECRET="change_me_refresh"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="30d"

# --- MinIO (S3-compatible) ---
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="lms-storage"
MINIO_USE_SSL=false

# --- Mail (Mailhog) ---
SMTP_HOST="localhost"
SMTP_PORT=1025
SMTP_FROM="no-reply@lms.local"

# --- Stripe (test mode, fill later) ---
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# --- App ---
PORT=5000
NODE_ENV=development
CLIENT_URL="http://localhost:3000"
EOF

# ---------------- docker-compose ----------------
cat > docker-compose.yml << 'EOF'
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: lms
      POSTGRES_PASSWORD: lms
      POSTGRES_DB: lms
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lms"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio-data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 5s
      retries: 10

  minio-init:
    image: minio/mc:latest
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 minioadmin minioadmin &&
      mc mb -p local/lms-storage || true &&
      mc anonymous set download local/lms-storage
      "

  mailhog:
    image: mailhog/mailhog:latest
    restart: unless-stopped
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres-data:
  minio-data:
  redis-data:
EOF

# ---------------- backend structure ----------------
mkdir -p apps/backend/src/{routes,controllers,services,repositories,validators,types,middleware,jobs,sockets,config,utils}
mkdir -p apps/backend/prisma
mkdir -p apps/backend/tests

for m in auth courses quizzes assignments attendance classes certificates payments admin audit discussions; do
  mkdir -p "apps/backend/src/modules/$m"
done

for f in env logger redis prisma minio; do
  echo "export {};" > "apps/backend/src/config/$f.ts"
done

touch apps/backend/prisma/schema.prisma
echo "// seed script — populated in Phase 1" > apps/backend/prisma/seed.ts

cat > apps/backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true,
    "baseUrl": "src",
    "paths": { "@/*": ["*"] }
  },
  "include": ["src", "prisma"]
}
EOF

cat > apps/backend/package.json << 'EOF'
{
  "name": "@lms/backend",
  "version": "1.0.0",
  "private": true,
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx prisma/seed.ts",
    "lint": "eslint src --ext .ts"
  }
}
EOF

# ---------------- frontend structure ----------------
mkdir -p apps/frontend/src/app/{"(public)","(auth)",student,teacher,admin}
mkdir -p apps/frontend/src/{components,hooks,store,lib}

cat > apps/frontend/package.json << 'EOF'
{
  "name": "@lms/frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
EOF

# ---------------- shared package ----------------
mkdir -p packages/shared/src
cat > packages/shared/package.json << 'EOF'
{
  "name": "@lms/shared",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
EOF
echo "export {};" > packages/shared/src/index.ts

mkdir -p architecture

echo "==> Structure ready. Next: run ./2-setup.sh to install deps."
find . -maxdepth 4 -type d | sort
