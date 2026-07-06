# Phase 3 — Vendor Application

## Overview

Phase 3 delivers the **Vendor Service** (port 4004), a full **Vendor Portal** (`/vendor`), and **Admin vendor approval** workflow. Vendors can apply, upload KYC, manage products/orders, and operate stores once approved.

## Architecture

```
Vendor Portal (/vendor)          Admin Portal (/admin/vendors)
        │                                  │
        │  BFF: /api/vendor/*              │  BFF: /api/admin/vendors
        └──────────────┬───────────────────┘
                       ▼
              Vendor Service :4004
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  vendor.*      catalog.products   orders.orders
  (onboarding)  (vendor CRUD)     (vendor orders)
```

## Vendor Service APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/vendors/me` | Vendor profile + dashboard stats |
| POST | `/v1/vendors/apply` | Submit vendor application |
| PATCH | `/v1/vendors/me` | Update business profile |
| GET/POST | `/v1/vendors/documents` | KYC document list/upload |
| GET/POST/PATCH | `/v1/vendors/stores` | Store management |
| PUT/GET | `/v1/vendors/stores/:id/timings` | Store hours |
| GET/POST/PATCH/DELETE | `/v1/vendors/products` | Vendor-scoped catalog CRUD |
| POST | `/v1/vendors/products/:id/publish` | Activate product |
| GET | `/v1/vendors/orders` | Vendor order inbox |
| PATCH | `/v1/vendors/orders/:id/status` | Update order (preparing, packed) |
| GET | `/v1/admin/vendors` | List applications (admin) |
| POST | `/v1/admin/vendors/:id/approve` | Approve vendor |
| POST | `/v1/admin/vendors/:id/reject` | Reject with reason |
| POST | `/v1/admin/vendors/:id/suspend` | Suspend vendor |

## Vendor Lifecycle

```
Apply (pending) → Upload KYC (under_review) → Admin Approve (approved) → Active selling
                    ↘ Admin Reject (rejected)
Approved → Admin Suspend (suspended)
```

On apply:
- Creates `vendor.vendors` + initial `vendor.stores` (inactive)
- Assigns RBAC roles (`vendor` + subtype: `restaurant_owner`, etc.)
- Sends notification via notification-service

On approve:
- Sets vendor status `approved`, activates stores
- Sends approval notification

## Vendor Portal Pages

| Route | Purpose |
|-------|---------|
| `/vendor/onboarding` | Application form + KYC upload |
| `/vendor` | Dashboard with KPIs |
| `/vendor/orders` | Order inbox + status updates |
| `/vendor/products` | Product catalog management |
| `/vendor/stores` | Store details |
| `/vendor/settings` | Business info |

## Admin Extensions

- `/admin/vendors` — Review pending applications, approve/reject

## Database

Migration `007_vendor_permissions.sql`:
- Store/document permissions for vendor roles
- Permissions seeded for all vendor subtypes
- Notification templates for vendor workflow

## Enabling Vendor Portal

Requires `PLATFORM_ENABLED=true` and vendor-service running:

```bash
npm run platform:docker:up
npm run platform:migrate
npm run platform:seed
cd platform && npm run dev:vendor

# .env.local
PLATFORM_ENABLED=true
VENDOR_SERVICE_URL=http://localhost:4004
INTERNAL_SERVICE_KEY=dev_internal_key_change_in_production
```

## Security

- All vendor APIs require `X-Internal-Key` + `X-User-Id`
- Vendor can only access own data (scoped by `user_id` → `vendor_id`)
- Product/order operations require `approved` status
- Admin operations validated via BFF `requireAdmin()`

## Phase 3 Checklist

- [x] Shared vendor types + validation
- [x] Vendor service microservice
- [x] Vendor onboarding + KYC
- [x] Store management
- [x] Vendor-scoped product CRUD
- [x] Vendor order management
- [x] Admin approval workflow
- [x] Vendor portal UI
- [x] BFF API routes
- [x] Docker + CI updates
- [x] RBAC permission seeds

## Next: Phase 4 — Rider Application

- Rider onboarding, GPS tracking, order assignment
- Rider mobile app
- Real-time delivery tracking
