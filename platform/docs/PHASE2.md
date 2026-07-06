# Phase 2 — Customer Application

## Overview

Phase 2 delivers the **Catalog**, **Order**, and **Notification** microservices and wires the existing Next.js customer app to use them via a BFF (Backend-for-Frontend) pattern.

## Services Delivered

| Service | Port | Schema | Responsibility |
|---------|------|--------|----------------|
| **catalog-service** | 4002 | `catalog`, `vendor` | Products, categories, inventory, addresses |
| **order-service** | 4003 | `orders`, `payments` | Order lifecycle, stock deduction, payments record |
| **notification-service** | 4009 | `notifications` | OTP, order alerts, in-app notifications |

## Architecture

```
Customer Web (Next.js :3000)
        │
        │  BFF: /api/products, /api/orders, /api/notifications
        │
        ├── PLATFORM_ENABLED=false → Supabase + seed fallback (legacy)
        │
        └── PLATFORM_ENABLED=true  → Platform microservices
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
 Catalog     Order    Notification
  :4002      :4003       :4009
    │           │           │
    └───────────┴───────────┘
                │
         PostgreSQL + Redis
```

## API Endpoints

### Catalog Service (`/v1/catalog/*`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/catalog/products` | Public | List/search products (FTS, filters, sort) |
| GET | `/v1/catalog/products/:id` | Public | Product by UUID, legacy ID, or slug |
| GET | `/v1/catalog/categories` | Public | Category tree |
| GET | `/v1/catalog/addresses` | Internal | User addresses |
| POST | `/v1/catalog/addresses` | Internal | Create address |
| PATCH | `/v1/catalog/addresses/:id` | Internal | Update address |
| DELETE | `/v1/catalog/addresses/:id` | Internal | Delete address |

### Order Service (`/v1/orders/*`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/orders` | Internal + X-User-Id | Create order (validates stock, records payment) |
| GET | `/v1/orders` | Internal + X-User-Id | List user orders |
| GET | `/v1/orders/:id` | Internal + X-User-Id | Order detail + status history |
| POST | `/v1/orders/:id/cancel` | Internal + X-User-Id | Cancel + restock |
| PATCH | `/v1/orders/:id/status` | Internal | Admin status transition |

### Notification Service (`/v1/notifications/*`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/notifications/send` | Internal | Send notification (template or raw) |
| GET | `/v1/notifications` | Internal + X-User-Id | List user notifications |
| PATCH | `/v1/notifications/:id/read` | Internal + X-User-Id | Mark as read |

## Order State Machine

```
pending → confirmed → preparing → packed → assigned → picked → in_transit → delivered
                  ↘ cancelled (restocks inventory)
delivered → returned → refunded / exchanged
```

Every transition is logged in `orders.order_status_history` (immutable).

## Customer App Changes

| File | Change |
|------|--------|
| `lib/platform/client.ts` | Service HTTP client with internal auth |
| `lib/platform/catalog.ts` | Catalog service adapter |
| `lib/platform/orders.ts` | Order service adapter |
| `lib/server/products.ts` | Platform-first with Supabase/seed fallback |
| `lib/server/orders.ts` | Platform-first with legacy simulation fallback |
| `lib/types.ts` | Enterprise order statuses, platformId fields |
| `lib/orderStatus.ts` | 12-state status metadata + tracking steps |
| `app/product/[id]/page.tsx` | Dynamic fetch from catalog API |
| `app/api/orders/route.ts` | Uses `createOrder()` with idempotency |
| `app/api/notifications/route.ts` | New — in-app notifications |

## Enabling Platform Mode

```bash
# 1. Start infrastructure
npm run platform:docker:up

# 2. Run migrations + seed catalog
DATABASE_URL=postgresql://vantoo:vantoo_dev_password@localhost:5432/vantoo_platform npm run platform:migrate
DATABASE_URL=postgresql://vantoo:vantoo_dev_password@localhost:5432/vantoo_platform npm run seed:catalog --prefix platform

# 3. Start services (separate terminals or docker)
cd platform && npm run dev:catalog
cd platform && npm run dev:order
cd platform && npm run dev:notification

# 4. Enable in customer app .env.local
PLATFORM_ENABLED=true
CATALOG_SERVICE_URL=http://localhost:4002
ORDER_SERVICE_URL=http://localhost:4003
NOTIFICATION_SERVICE_URL=http://localhost:4009
INTERNAL_SERVICE_KEY=dev_internal_key_change_in_production

# 5. Start customer app
npm run dev
```

## Database

New migration: `006_notifications.sql`
- `notifications` schema with templates, notifications, delivery_log
- `catalog.products.legacy_id` for backward-compatible product IDs (`p-f1`, etc.)

Seed script: `platform/database/seeds/seed-catalog.mjs`
- Creates default vendor + store
- Imports from `public.products` or `catalog-products.json`

## Security

- BFF → Services: `X-Internal-Key` header (shared secret)
- User context: `X-User-Id` header (set by BFF after Supabase session validation)
- Public catalog reads require no auth
- Order/address/notification writes require internal auth + user ID

## What's Next (Phase 3)

- Vendor portal application
- Vendor onboarding, KYC, store management
- Vendor-scoped product CRUD
- Real-time vendor dashboard updates
