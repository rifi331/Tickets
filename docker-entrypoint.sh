#!/bin/sh
# Entrypoint: apply pending Prisma migrations, then start the Next.js server.
# Designed for production; safe to no-op if DATABASE_URL is not set.
set -e

if [ -z "${DATABASE_URL}" ]; then
  echo "[entrypoint] WARNING: DATABASE_URL is not set; skipping migrations."
else
  echo "[entrypoint] Applying Prisma migrations…"
  node_modules/.bin/prisma migrate deploy
fi

echo "[entrypoint] Starting Next.js on port ${PORT:-30002}…"
exec "$@"
