# Deployment Guide

> How to deploy the GCC Startup Platform.

---

## Architecture

Production runs as 4 Docker services:

```
┌─────────────┐     ┌─────────────┐
│   postgres   │     │    redis     │
│  PostgreSQL  │     │    Cache     │
│    16-alpine │     │    7-alpine  │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
       ┌─────────┴─────────┐
       │                   │
┌──────┴──────┐     ┌──────┴──────┐
│     app     │     │   worker    │
│  Next.js    │     │  Job queue  │
│  :3000      │     │  processor  │
└─────────────┘     └─────────────┘
```

---

## Prerequisites

- Dokploy server (already in use)
- PostgreSQL 16 (can reuse existing or create new)
- Cloudflare R2 bucket (for file storage)
- Amazon SES verified sender (for email)
- Meta WhatsApp Business API credentials (for messaging)

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/gccplatform
POSTGRES_DB=gccplatform
POSTGRES_USER=gccplatform
POSTGRES_PASSWORD=your-secure-password

# Auth
JWT_SECRET=your-jwt-secret-min-32-chars
SESSION_COOKIE_NAME=gcc_session
SESSION_MAX_AGE=604800  # 7 days in seconds

# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_URL=https://media.gccstartup.com

# Amazon SES
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@gccstartup.com
SES_FROM_NAME=GCC Startup

# Meta WhatsApp Cloud API
META_WHATSAPP_ACCESS_TOKEN=your-access-token
META_WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
META_WHATSAPP_WEBHOOK_SECRET=your-webhook-secret
META_WHATSAPP_VERIFY_TOKEN=your-verify-token
META_WHATSAPP_GRAPH_VERSION=v20.0

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PostHog (analytics)
POSTHOG_KEY=your-posthog-key
POSTHOG_HOST=https://app.posthog.com

# App
NEXT_PUBLIC_APP_URL=https://gccstartup.com
```

---

## Docker Compose (Production)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-gccplatform}
      POSTGRES_USER: ${POSTGRES_USER:-gccplatform}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-gccplatform_prod}
    volumes:
      - pg-data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-gccplatform}']
      interval: 5s
      timeout: 5s
      retries: 10
    deploy:
      resources:
        limits:
          cpus: '${POSTGRES_CPU_LIMIT:-0.75}'
          memory: ${POSTGRES_MEM_LIMIT:-512m}

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 5s
      retries: 10
    deploy:
      resources:
        limits:
          cpus: '${REDIS_CPU_LIMIT:-0.25}'
          memory: ${REDIS_MEM_LIMIT:-128m}

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-gccplatform}:${POSTGRES_PASSWORD:-gccplatform_prod}@postgres:5432/${POSTGRES_DB:-gccplatform}
      JWT_SECRET: ${JWT_SECRET}
      SESSION_COOKIE_NAME: ${SESSION_COOKIE_NAME:-gcc_session}
      SESSION_MAX_AGE: ${SESSION_MAX_AGE:-604800}
      R2_ACCOUNT_ID: ${R2_ACCOUNT_ID:-}
      R2_ACCESS_KEY_ID: ${R2_ACCESS_KEY_ID:-}
      R2_SECRET_ACCESS_KEY: ${R2_SECRET_ACCESS_KEY:-}
      R2_BUCKET: ${R2_BUCKET:-}
      R2_PUBLIC_URL: ${R2_PUBLIC_URL:-}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:-}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:-}
      AWS_REGION: ${AWS_REGION:-us-east-1}
      SES_FROM_EMAIL: ${SES_FROM_EMAIL:-noreply@gccstartup.com}
      SES_FROM_NAME: ${SES_FROM_NAME:-GCC Startup}
      META_WHATSAPP_ACCESS_TOKEN: ${META_WHATSAPP_ACCESS_TOKEN:-}
      META_WHATSAPP_PHONE_NUMBER_ID: ${META_WHATSAPP_PHONE_NUMBER_ID:-}
      META_WHATSAPP_WEBHOOK_SECRET: ${META_WHATSAPP_WEBHOOK_SECRET:-}
      META_WHATSAPP_VERIFY_TOKEN: ${META_WHATSAPP_VERIFY_TOKEN:-}
      META_WHATSAPP_GRAPH_VERSION: ${META_WHATSAPP_GRAPH_VERSION:-v20.0}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:-}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:-}
      POSTHOG_KEY: ${POSTHOG_KEY:-}
      POSTHOG_HOST: ${POSTHOG_HOST:-}
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
    expose:
      - '3000'
    healthcheck:
      test: ['CMD-SHELL', 'wget -q -T 5 -O /dev/null http://127.0.0.1:3000/api/health || exit 1']
      interval: 15s
      timeout: 10s
      retries: 5
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '${WEB_CPU_LIMIT:-1.0}'
          memory: ${WEB_MEM_LIMIT:-1024m}

  worker:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    command: ['node', 'worker.js']
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-gccplatform}:${POSTGRES_PASSWORD:-gccplatform_prod}@postgres:5432/${POSTGRES_DB:-gccplatform}
      JWT_SECRET: ${JWT_SECRET}
      R2_ACCOUNT_ID: ${R2_ACCOUNT_ID:-}
      R2_ACCESS_KEY_ID: ${R2_ACCESS_KEY_ID:-}
      R2_SECRET_ACCESS_KEY: ${R2_SECRET_ACCESS_KEY:-}
      R2_BUCKET: ${R2_BUCKET:-}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:-}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:-}
      AWS_REGION: ${AWS_REGION:-us-east-1}
      SES_FROM_EMAIL: ${SES_FROM_EMAIL:-noreply@gccstartup.com}
      SES_FROM_NAME: ${SES_FROM_NAME:-GCC Startup}
      META_WHATSAPP_ACCESS_TOKEN: ${META_WHATSAPP_ACCESS_TOKEN:-}
      META_WHATSAPP_PHONE_NUMBER_ID: ${META_WHATSAPP_PHONE_NUMBER_ID:-}
      META_WHATSAPP_WEBHOOK_SECRET: ${META_WHATSAPP_WEBHOOK_SECRET:-}
      META_WHATSAPP_VERIFY_TOKEN: ${META_WHATSAPP_VERIFY_TOKEN:-}
      META_WHATSAPP_GRAPH_VERSION: ${META_WHATSAPP_GRAPH_VERSION:-v20.0}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:-}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:-}
    deploy:
      resources:
        limits:
          cpus: '${WORKER_CPU_LIMIT:-0.5}'
          memory: ${WORKER_MEM_LIMIT:-512m}

volumes:
  pg-data:
  redis-data:
```

---

## Deployment Steps

1. Push code to Git repository
2. Dokploy pulls and builds the Docker image
3. Docker Compose starts all 4 services
4. Worker processes background jobs (email, WhatsApp, automation)
5. App serves the web interface

---

## Database Migrations

Migrations run automatically on deploy via `docker-entrypoint.sh`:

```bash
#!/bin/sh
npx drizzle-kit migrate
exec node server.js
```

---

## Resource Limits

| Service | CPU | Memory |
|---|---|---|
| postgres | 0.75 | 512m |
| redis | 0.25 | 128m |
| app | 1.0 | 1024m |
| worker | 0.5 | 512m |

Override via environment variables: `POSTGRES_CPU_LIMIT`, `WEB_MEM_LIMIT`, etc.

---

## Backup Strategy

- PostgreSQL: Daily pg_dump to R2 (reuse existing backup service)
- R2: Cloudflare handles replication
- Redis: Optional persistence (for queue state)

---

## Monitoring

- Health check: `GET /api/health`
- System status: `/admin/system` (shows DB, R2, email, WhatsApp status)
- Logs: JSON structured logs via Pino
- Analytics: PostHog for product analytics

---

## Scaling

When the monolith needs to split:

1. Extract CRM to its own Next.js app (`:3001`)
2. Extract CMS to its own Next.js app (`:3002`)
3. Keep shared DB and shared packages
4. Use event bus (Redis pub/sub) for cross-module communication
5. Platform API stays in one app (it's just a thin REST layer)

---

## First deploy (required steps)

The platform ships with an empty database. Before the first login works you must
run migrations and the seed **once** against the production database:

```bash
# 1. Migrations (also run automatically on every container boot)
DATABASE_URL=postgresql://… npx tsx scripts/migrate.ts

# 2. Seed: roles, the first super_admin, the default pipeline, one API key
DATABASE_URL=postgresql://… \
SEED_ADMIN_EMAIL=you@gccstartup.com \
SEED_ADMIN_PASSWORD='a-strong-password' \
pnpm db:seed
```

The seed prints the API key **once** — store it in your password manager. It is
stored only as a SHA-256 hash and cannot be recovered.

## Required environment variables

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Set by compose from `POSTGRES_*` |
| `JWT_SECRET` | **Must be set** to ≥32 random chars. Sessions fail without it |
| `POSTGRES_PASSWORD` | Change the default before deploying |
| `NEXT_PUBLIC_APP_URL` | Public origin, used in emails and webhooks |

Everything else (R2, SES, Meta WhatsApp, Stripe, PostHog) is optional — the
platform no-ops when a variable is unset rather than crashing.

## Services

| Service | Command | Notes |
|---|---|---|
| `app` | `docker-entrypoint.sh` → `node apps/web/server.js` | Runs migrations first, then serves on :3000 |
| `worker` | `node worker.mjs` | Bundled by esbuild; processes the outbox, campaigns, flows, webhooks |

## Logging in

There is a login page at `/login`. It sets an HttpOnly `gcc_session` cookie;
the middleware redirects unauthenticated visitors there. `POST /api/auth/login`
returns the user, `GET /api/auth/me` validates the session, `POST
/api/auth/logout` revokes it.
