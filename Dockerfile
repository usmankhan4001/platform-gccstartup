# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --no-frozen-lockfile

# Stage 2: Build — inherits the deps stage directly so pnpm's symlinked
# node_modules tree stays intact (copying it between stages breaks the links).
FROM deps AS builder
WORKDIR /app
COPY . .
RUN pnpm --filter @gccstartup/web build

# Bundle the background worker (the compose `worker` service runs `node worker.js`)
RUN npx esbuild apps/web/src/worker/index.ts --bundle --platform=node --format=esm --target=node20 --outfile=worker.mjs --log-level=warning

# Bundle the migration runner
RUN npx esbuild scripts/migrate.ts --bundle --platform=node --format=esm --target=node20 --outfile=migrate.mjs --log-level=warning

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy migration files
COPY --from=builder /app/packages/db ./packages/db

# Worker bundle (self-contained: all deps inlined, no runtime path aliases)
COPY --from=builder /app/worker.mjs ./worker.mjs

# Self-contained migration runner (drizzle-kit is not installed in this stage)
COPY --from=builder /app/migrate.mjs ./migrate.mjs

# Entrypoint runs Drizzle migrations before handing off to the command
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "apps/web/server.js"]
