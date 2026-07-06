# Vantoo Platform — Database Design

## Overview

The platform uses PostgreSQL 16 with schema-per-service isolation. All migrations are versioned and tracked in `public.schema_migrations`.

## Schema Map

| Schema | Service | Tables |
|--------|---------|--------|
| `auth` | Auth Service | users, roles, permissions, sessions, devices, OTP, audit |
| `catalog` | Catalog Service | categories, brands, products, variants, inventory |
| `vendor` | Vendor Service | vendors, stores, documents, staff, timings |
| `orders` | Order Service | orders, order_items, status_history, assignments |
| `payments` | Payment Service | payments, refunds, splits, webhooks |
| `wallet` | Wallet Service | wallets, transactions, ledger, withdrawals |
| `referral` | Referral Service | programs, levels, codes, tree, commissions |
| `public` | Shared | schema_migrations, legacy Supabase tables |

## Entity Relationship (Core)

```
auth.users ──┬── vendor.vendors ── vendor.stores ── catalog.products
             │                                      └── catalog.inventory
             ├── catalog.customer_addresses
             ├── orders.orders ── orders.order_items
             │                 └── orders.order_status_history
             ├── payments.payments ── payments.refunds
             ├── wallet.wallets ── wallet.wallet_transactions
             └── referral.referral_codes ── referral.referral_tree
```

## Migration Files

| File | Description |
|------|-------------|
| `002_enterprise_auth_rbac.sql` | Users, RBAC, sessions, devices, OTP, audit |
| `003_enterprise_core_entities.sql` | Vendors, stores, catalog, inventory, addresses |
| `004_enterprise_orders_payments.sql` | Orders, state machine, payments, refunds |
| `005_enterprise_wallets_referrals.sql` | Wallets, ledger, referral engine |

Legacy: `supabase/migrations/001_initial_schema.sql` (existing customer app)

## Key Design Decisions

### Order State Machine

Every status change is immutable in `orders.order_status_history`. A trigger on `orders.orders` automatically logs transitions.

```
pending → confirmed → preparing → packed → assigned → picked → in_transit → delivered
                  ↘ cancelled
delivered → returned → refunded / exchanged
```

### Wallet Double-Entry

Each wallet operation creates:
1. A `wallet_transactions` record (business transaction)
2. A `wallet_ledger_entries` record (immutable audit trail with running balance)

Balances are never updated without a corresponding ledger entry.

### Referral Configurability

Admin configures via `referral_programs` + `referral_levels`:
- 1 to unlimited levels
- Percentage or fixed commission per level
- Min order amount, max commission caps
- Campaign-specific bonuses via `referral_campaigns`

No referral logic is hardcoded — the service reads configuration at runtime.

### Multi-Tenant Vendor Isolation

- Every product belongs to a `vendor_id`
- Stores belong to vendors
- Inventory is scoped to `store_id`
- Commission rates are per-vendor

### Search

Phase 1: PostgreSQL full-text search (`to_tsvector`) on products.
Phase 8: Elasticsearch migration path documented in architecture.

## Indexes Strategy

- Foreign keys indexed for join performance
- Partial indexes on active/non-deleted records
- Composite indexes for common query patterns (user_id + created_at DESC)
- GIN index for full-text search on products

## Running Migrations

```bash
# Local (Docker PostgreSQL)
npm run platform:migrate

# Production (Supabase)
DATABASE_URL=postgresql://... npm run platform:migrate
```

Migrations are idempotent where possible (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING` for seeds).
