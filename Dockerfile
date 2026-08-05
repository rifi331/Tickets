# syntax=docker/dockerfile:1.7

# ----------------------------------------------------------------------------
# Stage 1: deps - install all (dev) dependencies to build
# ----------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# OpenSSL is required by the Prisma engine on Alpine.
RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ----------------------------------------------------------------------------
# Stage 2: builder - compile the Next.js app
# ----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# These are required at build time by Next/Prisma. They do NOT need to point
# at the real database; Prisma only validates the URL shape during generate.
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"

RUN npx prisma generate
RUN npm run build

# Prune to production dependencies for a smaller runtime image.
RUN npm ci --omit=dev && npm cache clean --force

# ----------------------------------------------------------------------------
# Stage 3: runner - minimal production image
# ----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl wget

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=30002
ENV HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy the standalone Next.js output and static assets.
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# Entrypoint runs migrations, then starts Next.
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 30002

# Simple healthcheck against the (protected) root; expect a redirect/200/401.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/login" || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node_modules/.bin/next", "start", "-p", "30002", "-H", "0.0.0.0"]
