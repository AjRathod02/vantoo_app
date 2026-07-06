# Phase 4 — Rider Application

## Overview

Phase 4 delivers the **Rider Service** (port 4005), **Tracking Service** (port 4010), a **Rider Portal** (`/rider`), and **Admin rider approval**. Riders can apply, upload KYC, go online, accept deliveries, update order status, and earn delivery fees.

## Architecture

```
Rider Portal (/rider)           Customer Track Page
        │                              │
        │  BFF: /api/rider/*           │  /api/orders/[id]/tracking
        └──────────────┬───────────────┘
                       ▼
              Rider Service :4005
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  rider.*         orders.orders   orders.order_assignments
  (onboarding)    (status)        (assignment)
                       │
                       ▼
              Tracking Service :4010
                   (Redis + SSE)
```

## Rider Service APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/riders/me` | Rider profile + stats + availability |
| POST | `/v1/riders/apply` | Submit rider application |
| PATCH | `/v1/riders/me` | Update profile |
| GET/POST | `/v1/riders/documents` | KYC documents |
| PUT | `/v1/riders/availability` | Go online/offline/busy |
| POST | `/v1/riders/location` | GPS location update |
| GET | `/v1/riders/deliveries/available` | Packed orders ready for pickup |
| GET | `/v1/riders/deliveries` | Rider's delivery tasks |
| POST | `/v1/riders/deliveries/accept` | Accept a delivery |
| PATCH | `/v1/riders/deliveries/:orderId/status` | Update order status |
| GET | `/v1/riders/earnings` | Earnings history |
| GET | `/v1/admin/riders` | List riders (admin) |
| POST | `/v1/admin/riders/:id/approve` | Approve rider |
| POST | `/v1/admin/riders/:id/reject` | Reject rider |

## Tracking Service APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/tracking/orders/:orderId` | Current rider location |
| PUT | `/v1/tracking/orders/:orderId` | Update location (internal) |
| GET | `/v1/tracking/orders/:orderId/stream` | SSE live tracking stream |

## Order State Handoff

| Phase | Owns states |
|-------|-------------|
| Vendor (Phase 3) | `confirmed → preparing → packed` |
| Rider (Phase 4) | `packed → assigned → picked → in_transit → delivered` |

## Rider Lifecycle

```
Apply (pending) → Upload KYC (under_review) → Admin Approve (approved) → Go Online → Accept Deliveries
                    ↘ Admin Reject (rejected)
```

## Rider Portal Pages

| Route | Purpose |
|-------|---------|
| `/rider/onboarding` | Application + KYC |
| `/rider` | Dashboard + online toggle |
| `/rider/deliveries` | Accept & manage deliveries |
| `/rider/earnings` | Earnings history |
| `/rider/settings` | Profile info |

## Database

- `008_rider_schema.sql` — `rider` schema (riders, documents, availability, locations, tasks, proofs, earnings)
- `009_rider_permissions.sql` — RBAC permissions + notification templates
- FK: `orders.order_assignments.rider_id → rider.riders`

## Enabling Rider Portal

```bash
npm run platform:docker:up
npm run platform:migrate
cd platform && npm run dev:rider && npm run dev:tracking

# .env.local
PLATFORM_ENABLED=true
RIDER_SERVICE_URL=http://localhost:4005
TRACKING_SERVICE_URL=http://localhost:4010
INTERNAL_SERVICE_KEY=dev_internal_key_change_in_production
```

## Phase 4 Checklist

- [x] Shared rider types + validation
- [x] Rider schema migration
- [x] rider-service microservice
- [x] tracking-service (Redis + SSE)
- [x] Order assignment + status updates
- [x] GPS location tracking
- [x] Rider earnings (stub until wallet Phase 6)
- [x] Admin approval workflow
- [x] Rider portal UI
- [x] Customer live tracking integration
- [x] Docker + CI updates

## Next: Phase 5 — Admin & Operations

- Advanced admin dashboards
- Manual rider assignment
- Zone-based dispatch
- React Native rider app

## Deferred

- Real file upload for KYC (URL-based for now)
- Automatic dispatch / zone matching
- React Native mobile app
- Wallet payout integration (Phase 6)
