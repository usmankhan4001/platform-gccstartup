# GCC Startup V5 — The Complete Plan

> This is the single source of truth for everything we decided about V5.
> Written for both the owner (non-technical) and any AI/dev agent.

---

## 1. The Problem We're Solving

The business owns **4 separate codebases** that don't talk to each other:

| Codebase | What it does | Stack | Problem |
|---|---|---|---|
| `gccstartup-cms` | Website + CMS + CRM + Email + WhatsApp + Support | Next.js + **Directus** + Postgres | Directus is the pain: schema deletes live data, 403s on every new collection, `as any` everywhere |
| `WayApp` | WhatsApp marketing platform | Next.js + Prisma + Postgres | Separate DB, separate login, separate everything |
| `Customer Portal` | Client-facing portal with documents, tools, payments | Next.js + Drizzle + Postgres | Separate DB, connects to nothing |
| `corehub` | Open-source platform schema (never shipped) | Drizzle + Postgres | Great schema design, no app |

**The core problem:** A lead captured on the website has zero connection to WhatsApp conversations, CRM pipeline, email campaigns, or the client portal. Four databases, four auth systems, four deployments — for ONE business.

---

## 2. What V5 Is

**V5 is a brand-new, unified platform** built from scratch in a separate repo (`platform-gccstartup`). It replaces Directus with direct database access (Drizzle ORM) and merges the best of all 4 codebases into one.

```
┌─────────────────────────────────────────────────────────────┐
│                      GCC STARTUP V5                          │
│                                                              │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│   │   CRM   │   │   CMS   │   │  ADMIN  │   │   API   │    │
│   │ (staff) │   │ (staff) │   │ (owner) │   │ (3rd    │    │
│   │         │   │         │   │         │   │  party) │    │
│   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘    │
│        │             │             │             │         │
│   ┌────┴──────────────┴─────────────┴────────────┴─────┐   │
│   │        ONE DATABASE (Drizzle + PostgreSQL)          │   │
│   │        ONE AUTH (JWT) · ONE LOGIN · ONE DEPLOY      │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   Customer Portal (separate repo) connects via the API       │
└─────────────────────────────────────────────────────────────┘
```

**Key decision:** The Customer Portal stays a separate app (it's a different audience — clients vs. staff) but **connects through the Platform API** instead of being siloed.

---

## 3. The 4 Module Split

We made this **explicit** so there's never confusion about what lives where:

### 🟦 CRM (`/crm`) — The Brain
*Owner: sales, operations, support staff*

Everything about relationships and outreach:
- **Contacts** — one record per person (unified lead + client + subscriber)
- **Pipeline / Deals** — Kanban board with stages
- **Unified Inbox** — WhatsApp + web chat + support tickets in ONE place
- **Email** — templates, campaigns, A/B testing, suppression
- **WhatsApp** — 2-way inbox, broadcast campaigns, AI copilot
- **Automation** — visual flow builder ("when X happens, do Y")
- **Tasks & Activities** — assign, track, follow up
- **Analytics** — pipeline value, conversion, agent performance

### 🟩 CMS (`/cms`) — The Voice
*Owner: marketing, content team*

Everything about the website and content:
- **Pages, Blog, Services, Countries, Pricing, Comparisons, Guides** — all Puck-editable
- **Puck Visual Editor** — 55+ drag-and-drop blocks
- **Media Library** — images & files in R2
- **SEO** — sitemap, robots.txt, JSON-LD, per-page meta
- **Lead-Gen Tools** — 10 interactive calculators/quizzes that capture leads
- **Redirects, Site Settings**

### 🟨 Admin (`/admin`) — The Control Panel
*Owner: system owner, super-admins*

- **User management** — who can log in, what roles
- **System Health** — is the DB up? email? WhatsApp?
- **API Keys** — issue keys to external systems
- **Webhooks** — subscribe external services to events
- **Audit Log** — who did what
- **Integrations** — Stripe, SES, WhatsApp status

### 🟪 Platform API (`/api/v2`) — The Nervous System
*Owner: developers, 3rd-party systems*

- **REST API** — 32+ endpoints exposing contacts, deals, campaigns, documents, analytics
- **API Key auth** — `gcc_` prefixed keys with scoped permissions
- **Webhooks** — 24 events external systems can subscribe to
- **OpenAPI docs** — machine-readable documentation at `/api/v2/docs`

---

## 4. Tech Stack (Locked In)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Same as existing codebases, huge ecosystem |
| Language | TypeScript (strict) | Type safety |
| ORM | **Drizzle** (not Prisma, not Directus) | Type-safe, fast, matches corehub, NO schema-delete trap |
| Database | PostgreSQL 16 | Reliable, proven |
| Auth | JWT + scrypt self-hosted | Simple, no session store |
| Email | Amazon SES via provider adapter | $0.10 per 1000 emails vs Sender.net $49+/mo |
| WhatsApp | Meta Cloud API | Official, 2-way |
| Storage | Cloudflare R2 | Same as now, no egress fees |
| Queue | Outbox pattern (DB table) | Durable, zero extra infra |
| Events | In-process bus (→ Redis later) | Modules decoupled |
| Real-time | SSE | Simple, proxy-friendly |
| UI | Tailwind v4 + CSS tokens | Design consistency |
| Tests | Vitest | Fast |
| Deploy | Docker + Dokploy | Already using it |

---

## 5. What Got Cloned From Where

| Source | What we took | Status |
|---|---|---|
| **gccstartup-cms** | 40 Puck blocks, 15 lead-magnet blocks, 13 email blocks, full SEO system, UI components (25+), CRM components (PipelineBoard, LeadDrawer, etc.), email engine (10 files / ~3000 lines) | ✅ Cloned |
| **WayApp** | WhatsApp client (936 lines — the most complete), ChatWindow inbox (1852 lines), campaign wizard, template builder, visual flow builder, analytics charts, 7 worker modules | ✅ Cloned |
| **Customer Portal** | 10 lead-gen tools + 4 API routes | ✅ Cloned |
| **corehub** | Database schema design patterns (contacts, CRM, email, messaging) | ✅ Adapted |

---

## 6. What We Got Rid Of

| Thing | Why |
|---|---|
| **Directus** | The schema-snapshot trap that destroyed live data; 403 permission hell; `as any` everywhere; extra HTTP hop; 3-service deploy |
| **Sender.net** | Expensive; replaced by Amazon SES (still keeps provider interface so we can swap) |
| **n8n/WAHA** | Replaced with direct Meta Cloud API |
| **4 databases** | Now 1 shared database |
| **4 auth systems** | Now 1 JWT auth |

---

## 7. The Build Progress (All 5 Phases)

| Phase | What | Status |
|---|---|---|
| **1. Foundation** | Monorepo, database schema (20+ tables), auth (JWT+scrypt+RBAC), shared utils (SES, WhatsApp, R2, outbox queue, event bus) | ✅ Built |
| **2. CMS Clone** | Puck editor, 55+ blocks, SEO, 10 lead-gen tools, design system, UI components | ✅ Built |
| **3. CRM** | Contacts, deals/pipeline, unified inbox, email engine, WhatsApp engine, campaigns, flows, automation, analytics, worker | ✅ Built |
| **4. API + Admin** | Platform REST API (32 endpoints), webhook system (24 events), admin panel (10 pages), notifications | ✅ Built |
| **5. Polish + Deploy** | Vitest tests (17 passing), Dockerfile, 4-service compose, docs | ✅ Deployed & Live |

---

## 8. Current Deployment Status

**Live URL:** `https://platform.gccstartup.com`
**Repo:** `github.com/usmankhan4001/platform-gccstartup` on branch `v5.0`
**Dokploy:** Service `gcc-platform-v5` in the "GCC Startup Website & CMS" project

**What's done & live:**
- ✅ Production build deployed and running on Dokploy
- ✅ 4 Docker services healthy: `app` (Next.js 15), `worker` (Background queue), `postgres` (PostgreSQL 16), `redis` (Cache)
- ✅ Database auto-migrated via Drizzle ORM and seeded with initial admin user (`admin@gccstartup.com`) & default sales pipeline
- ✅ Domain routing active on `https://platform.gccstartup.com` via Traefik
- ✅ Full CRM UI restored and wired to real database:
  - **Contacts Directory (`/crm/contacts`)**: High-density table, live search, lifecycle stage filtering, "+ Add Contact" modal
  - **Kanban Deals Pipeline (`/crm/deals`)**: Interactive stages, drag-and-drop, deal scoring, financial metrics
  - **Slide-out Lead Drawer (`LeadDrawer`)**: Complete timeline, notes, tasks, and WhatsApp thread panel
  - **Unified Inbox (`/crm/inbox`)**: 3-column WhatsApp Cloud API chat interface with templates, voice notes, and media lightbox
  - **Campaigns (`/crm/campaigns`, `/crm/campaigns/new`)**: Campaign dispatcher, variable mapper, delivery & read rate tracking
  - **WhatsApp Templates (`/crm/templates`)**: Template manager with live phone preview & Meta approval sync
  - **Email Operations (`/crm/email`)**: Amazon SES health, reputation metrics, automated sequence monitor
  - **Analytics (`/crm/analytics`)**: Conversion funnel & volume trends charts
  - **Public Homepage (`/`)**: High-converting GCC Startup landing page with 6 interactive lead-gen tools showcase

---

## 9. What Happens After V5 Deploys

### Immediate (test phase)
1. Visit the deployed URL → landing page, tools, sitemap, admin
2. Create admin user, log into CRM + CMS + Admin
3. Test API key + a couple of `/api/v2` endpoints
4. Test webhook delivery

### Data migration (next milestone)
1. Script: Directus collections → Drizzle tables
2. Script: WayApp contacts → unified contacts
3. Script: Customer Portal users → unified users
4. Validate counts + rollback plan

### Feature growth (the roadmap we discussed)
- Client dashboard with **compliance calendar** (locks in clients)
- **Document intelligence** (auto-extract passport data, validate expiry)
- **Unified inbox** live chat widget on the website
- **Partner & referral ecosystem**
- **Revenue intelligence** dashboard
- White-label SaaS (sell the platform to other formation agents)

---

## 10. Golden Rules (Invariants)

1. **No Tailwind utility overrides** — design tokens are the source of truth
2. **Never drop a table/column without a migration** — additive only
3. **Nothing crashes without logging** — degrade gracefully
4. **Every external integration is optional** — unset env = no-op
5. **Secrets in .env only** — never in code or commits
6. **Explicit consent for marketing** — `emailConsent !== 'granted'` never sends
7. **Events are the integration point** — modules talk via events
8. **Portal is separate** — connects via the Platform API
9. **API keys start with `gcc_`** — easy to identify
10. **Webhooks are HMAC-SHA256 signed** — recipients can verify

---

*This document lives at the repo root as `V5-PLAN.md`. Keep it updated as decisions change.*