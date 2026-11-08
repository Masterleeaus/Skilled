#!/usr/bin/env bash
set -e

if [ ! -f "package.json" ] || [ ! -d "apps/backend" ]; then
  echo "Run this from inside the lms/ folder created by 1-init.sh"
  exit 1
fi

echo "==> [2/2] Installing dependencies"

command -v pnpm >/dev/null 2>&1 || corepack enable && corepack prepare pnpm@latest --activate

# ---------------- backend deps ----------------
cd apps/backend

pnpm add express cors helmet morgan winston \
  bcrypt jsonwebtoken zod \
  @prisma/client ioredis bullmq \
  multer nodemailer socket.io \
  stripe pdf-lib minio

pnpm add -D typescript tsx @types/node @types/express @types/cors \
  @types/morgan @types/bcrypt @types/jsonwebtoken @types/multer \
  prisma eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  vitest

cd ../..

# ---------------- frontend deps ----------------
cd apps/frontend

pnpm add next@15 react react-dom \
  zustand @tanstack/react-query \
  react-hook-form zod @hookform/resolvers \
  recharts socket.io-client \
  axios

pnpm add -D typescript @types/react @types/react-dom @types/node \
  tailwindcss postcss autoprefixer eslint eslint-config-next

cd ../..

# ---------------- shared deps ----------------
cd packages/shared
pnpm add zod
pnpm add -D typescript
cd ../..

echo "==> All dependencies installed."
echo "Next: docker compose up -d, then cd apps/backend && pnpm prisma:generate"
