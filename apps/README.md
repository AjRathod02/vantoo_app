# Vantoo Commerce Platform

Four independent client applications share one centralized backend.

## Applications

| App | Location | Port | Status |
|-----|----------|------|--------|
| **Customer Web** (PWA) | Repository root (`app/`) | 3000 | Active |
| **Customer Mobile** | `apps/customer-mobile/` | — | Scaffold |
| **Vendor Mobile** | `apps/vendor-mobile/` | — | Scaffold |
| **Rider Mobile** | `apps/rider-mobile/` | — | Scaffold |
| **Admin Web** | `apps/admin-web/` | 3001 | Active |

### Customer Web + Mobile
- Shopping, grocery, food, medicine, e-commerce
- Orders, wallet, profile, wishlist, referrals (planned)
- Same `/api/customer/*` APIs for web and mobile sync

### Vendor Mobile (separate login)
- Store registration, KYC, products, inventory, orders
- Uses `/api/vendor/*` only — no customer or admin data access

### Rider Mobile (separate login)
- Registration, KYC, online/offline, deliveries, earnings
- Uses `/api/rider/*` only

### Admin Web (separate login)
- Dashboard, users, vendors, riders, orders, products, reports
- Uses `/api/admin/*` only
- Runs independently on port 3001

## Backend (`platform/`)

Single modular backend — **not** separate backends per app.

```
platform/
├── packages/shared/          # Types, validation, RBAC
├── services/
│   ├── auth/                 # :4001 — OTP, JWT, sessions, RBAC
│   ├── catalog/              # :4002 — products, categories, inventory
│   ├── order/                # :4003 — order lifecycle
│   ├── vendor/               # :4004 — vendor onboarding, stores
│   ├── rider/                # :4005 — rider onboarding, deliveries
│   ├── notification/         # :4009 — push, SMS, email
│   └── tracking/             # :4010 — live GPS tracking
├── database/migrations/
└── docker/
```

### Planned services (Phase 6+)
payments, wallet, referral, chat, analytics, recommendation-ai, reports

## API Structure

| Namespace | Consumers | Examples |
|-----------|-----------|----------|
| `/api/auth/*` | All apps | login, signup, me |
| `/api/customer/*` | Customer web + mobile | products, orders, payments |
| `/api/vendor/*` | Vendor mobile | me, apply, products, orders |
| `/api/rider/*` | Rider mobile | me, apply, deliveries, earnings |
| `/api/admin/*` | Admin web | vendors, riders, orders, products |

Customer routes are rewritten from `/api/customer/*` → existing handlers in `next.config.mjs`.

## Development

```bash
# Customer web (port 3000)
npm run dev

# Admin web (port 3001)
npm run dev:admin

# All backend services
npm run platform:dev:all
# or Docker: npm run platform:docker:up

# Build everything
npm run build:all
```

## Authentication

| Role | Login | Token | APIs |
|------|-------|-------|------|
| Customer | `/login` | Supabase session (→ platform JWT planned) | `/api/customer/*` |
| Vendor | Vendor mobile | Platform JWT (planned) | `/api/vendor/*` |
| Rider | Rider mobile | Platform JWT (planned) | `/api/rider/*` |
| Admin | Admin web | Supabase session + `profiles.role=admin` | `/api/admin/*` |

Each role has isolated access. Vendor/rider/admin cannot access customer-only data without authorization.

## Migration Path

1. **Now**: Customer web at repo root; admin at `apps/admin-web`; mobile scaffolds ready
2. **Next**: Wire platform auth-service for vendor/rider mobile JWT
3. **Then**: Extract customer web to `apps/customer-web` if needed
4. **Future**: API gateway in front of microservices
