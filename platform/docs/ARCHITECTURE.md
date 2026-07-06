# Vantoo Platform — System Architecture

## Overview

Vantoo is a unified multi-vendor commerce ecosystem supporting grocery delivery, food delivery, e-commerce, pharmacy, local shops, and hyperlocal delivery. The platform is designed to serve millions of users with horizontal scalability, fault isolation, and enterprise-grade security.

## Architecture Style

**Phase 1–5:** Modular monolith with service boundaries (strangler fig pattern)  
**Phase 6+:** Extract hot paths into independent microservices behind an API gateway

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│ Customer Web │ Customer App │  Vendor App  │  Rider App   │  Admin Portal\n###│
│  (Next.js)   │ (React Native│ (React Native│ (React Native│   (Next.js)     │
│              │   Phase 2)   │   Phase 3)   │   Phase 4)   │   Phase 5)      │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴────────┬────────┘
       │              │              │              │                │
       └──────────────┴──────────────┴──────────────┴────────────────┘
                                      │
                              ┌───────▼───────┐
                              │  API Gateway  │  Rate limiting, auth, routing
                              │  (Phase 6)    │
                              └───────┬───────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       │                              │                              │
┌──────▼──────┐  ┌──────────▼──────────┐  ┌──────────▼──────────┐  ...
│ Auth Service│  │  Catalog Service    │  │  Order Service      │
│  (Phase 1)  │  │  (Phase 2)          │  │  (Phase 2)          │
└──────┬──────┘  └──────────┬──────────┘  └──────────┬──────────┘
       │                    │                        │
       └────────────────────┼────────────────────────┘
                            │
       ┌────────────────────┼────────────────────────────────────┐
       │                    │                                    │
┌──────▼──────┐  ┌──────────▼──────────┐  ┌──────────▼──────────┐
│ PostgreSQL  │  │       Redis         │  │   Object Storage    │
│  (Primary)  │  │  Sessions, OTP,     │  │   (S3 / GCS)        │
│             │  │  Rate limits, Cache │  │                     │
└─────────────┘  └─────────────────────┘  └─────────────────────┘
```

## Service Boundaries

| Service | Responsibility | Phase | Port |
|---------|---------------|-------|------|
| **auth-service** | Authentication, authorization, RBAC, sessions, devices | 1 | 4001 |
| **catalog-service** | Products, categories, brands, inventory, search | 2 | 4002 |
| **order-service** | Order lifecycle, state machine, fulfillment | 2 | 4003 |
| **vendor-service** | Vendor onboarding, KYC, store management | 3 | 4004 |
| **rider-service** | Rider assignment, GPS, delivery proof | 4 | 4005 |
| **payment-service** | Payments, refunds, settlements, reconciliation | 6 | 4006 |
| **wallet-service** | Multi-wallet ledger, transfers, withdrawals | 6 | 4007 |
| **referral-service** | MLM engine, commissions, campaigns | 7 | 4008 |
| **notification-service** | Push, SMS, email, in-app | 2 | 4009 |
| **tracking-service** | Real-time rider/order tracking | 4 | 4010 |
| **analytics-service** | Events, reporting, dashboards | 9 | 4011 |
| **ai-service** | Recommendations, search, fraud, forecasting | 8 | 4012 |
| **customer-web** | Customer-facing Next.js application | 2 | 3000 |
| **admin-web** | Platform administration | 5 | 3001 |

## Data Flow — Authentication (Phase 1)

```
Client                    Auth Service              PostgreSQL        Redis
  │                            │                        │               │
  │── POST /auth/otp/send ────►│                        │               │
  │                            │── store OTP ──────────────────────────►│
  │                            │── log attempt ────────►│               │
  │◄── 200 { expiresIn } ──────│                        │               │
  │                            │                        │               │
  │── POST /auth/otp/verify ──►│                        │               │
  │                            │── verify OTP ─────────────────────────►│
  │                            │── upsert user ────────►│               │
  │                            │── create session ─────►│               │
  │                            │── issue tokens ───────►│               │
  │◄── { accessToken, refreshToken, user } ─────────────│               │
  │                            │                        │               │
  │── GET /auth/me ───────────►│                        │               │
  │   Authorization: Bearer    │── validate JWT ───────►│               │
  │◄── { user, roles, perms } ─│                        │               │
```

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API Runtime | Node.js 20 + Fastify | High throughput, schema validation, plugin ecosystem |
| Customer/Admin UI | Next.js 14 App Router | SSR, API routes as BFF during migration |
| Mobile (future) | React Native + Expo | Shared TypeScript types, OTA updates |
| Primary Database | PostgreSQL 16 | ACID, JSONB, PostGIS-ready, proven at scale |
| Cache / Sessions | Redis 7 | Sub-ms latency for OTP, rate limits, pub/sub |
| Message Queue | Redis Streams → Kafka (Phase 6) | Event-driven order/payment flows |
| Search | PostgreSQL FTS → Elasticsearch (Phase 8) | Incremental complexity |
| Object Storage | S3-compatible (Supabase Storage / GCS) | Product images, KYC docs |
| Payments | Razorpay | UPI, cards, netbanking, wallets, COD |
| Observability | Structured JSON logs → Datadog/Grafana (Phase 11) | Correlation IDs from day one |

## Folder Structure

```
Vantoo/
├── app/                          # Existing customer Next.js app (BFF during migration)
├── components/                   # Customer UI components
├── lib/                          # Customer app utilities
├── platform/                     # Enterprise platform (monorepo root)
│   ├── docs/                     # Architecture, API, security documentation
│   ├── database/
│   │   ├── migrations/           # Versioned SQL migrations
│   │   └── seeds/                # Reference data seeders
│   ├── packages/
│   │   └── shared/               # Shared types, validation, constants
│   ├── services/
│   │   └── auth/                 # Auth microservice (Phase 1)
│   └── docker/                   # Local development infrastructure
├── supabase/migrations/          # Legacy Supabase schema (preserved)
└── scripts/                      # Migration runners, tooling
```

## Scalability Principles

1. **Stateless services** — All session state in Redis/PostgreSQL; services scale horizontally.
2. **Database per service (logical)** — Separate schemas (`auth`, `catalog`, `orders`) in one cluster initially; split clusters at scale.
3. **Event sourcing for orders** — Every state transition persisted in `order_status_history`.
4. **Idempotent APIs** — Idempotency keys on payments and order creation.
5. **CQRS for analytics** — Write to PostgreSQL; read replicas and event projections for reporting.
6. **CDN for static assets** — Product images, app bundles served from edge.

## Migration Path (Existing → Enterprise)

The existing Next.js monolith uses Supabase Auth. Phase 1 introduces a standalone auth service. Migration strategy:

1. **Dual-write period** — New mobile apps use auth-service; web app continues Supabase.
2. **Account linking** — `auth_identities` table maps Supabase UUID → platform user.
3. **Cutover** — Customer web migrates to auth-service JWT; Supabase Auth deprecated.
4. **Data migration** — Existing `profiles` → `auth.users` with role mapping.

## Deployment Topology (Production)

```
                    ┌─────────────┐
                    │  Cloudflare │  CDN + WAF + DDoS
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │   Load Balancer (ALB)   │
              └────────────┬────────────┘
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
    │ Auth x3 │      │ API x N   │     │ Admin x2  │
    └────┬────┘      └─────┬─────┘     └───────────┘
         │                 │
    ┌────▼─────────────────▼────┐
    │  RDS PostgreSQL (Multi-AZ) │
    │  ElastiCache Redis Cluster │
    └────────────────────────────┘
```

## Phase 1 Deliverables

- [x] Architecture documentation (this document)
- [x] Database schema design (5 migration files)
- [x] Monorepo folder structure
- [x] Microservice boundaries defined
- [x] OpenAPI specification for auth APIs
- [x] Auth service implementation (OTP, email, JWT, RBAC, sessions, devices)
- [x] Docker Compose for local development
- [x] Migration runner
- [x] Security documentation
- [x] CIao tests for auth service
