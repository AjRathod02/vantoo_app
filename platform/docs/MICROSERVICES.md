# Vantoo Platform — Microservice Boundaries

## Design Principles

Each service owns its data, exposes a versioned HTTP API, and communicates asynchronously via domain events where possible. Services never share database tables directly.

## Service Catalog

### 1. Auth Service (`platform/services/auth`) — **Phase 1**

**Domain:** Identity, authentication, authorization, session management.

**Owned Tables (schema: `auth`):**
- `users`, `auth_identities`, `roles`, `permissions`, `role_permissions`, `user_roles`
- `refresh_tokens`, `user_sessions`, `user_devices`, `otp_verifications`, `audit_logs`

**APIs:**
- `POST /v1/auth/register` — Email/password registration
- `POST /v1/auth/login` — Email/password login
- `POST /v1/auth/otp/send` — Send OTP to phone/email
- `POST /v1/auth/otp/verify` — Verify OTP and authenticate
- `POST /v1/auth/oauth/google` — Google OAuth
- `POST /v1/auth/oauth/apple` — Apple Sign-In
- `POST /v1/auth/refresh` — Refresh access token
- `POST /v1/auth/logout` — Revoke session
- `POST /v1/auth/logout-all` — Revoke all sessions
- `GET  /v1/auth/me` — Current user profile + roles + permissions
- `GET  /v1/auth/sessions` — List active sessions
- `DELETE /v1/auth/sessions/:id` — Revoke specific session
- `GET  /v1/auth/devices` — List registered devices
- `DELETE /v1/auth/devices/:id` — Remove device
- `POST /v1/auth/password/reset-request` — Request password reset OTP
- `POST /v1/auth/password/reset` — Reset password with OTP

**Events Published:**
- `user.registered`, `user.logged_in`, `user.logged_out`, `session.revoked`

---

### 2. Catalog Service — **Phase 2**

**Domain:** Product catalog, categories, brands, inventory, search indexing.

**Owned Tables (schema: `catalog`):**
- `categories`, `brands`, `products`, `product_variants`, `product_attributes`
- `product_images`, `product_specifications`, `inventory`, `price_history`

**Key Integrations:** Auth (vendor permissions), AI (recommendations), Notification (stock alerts)

---

### 3. Order Service — **Phase 2**

**Domain:** Order lifecycle, cart checkout, fulfillment orchestration.

**Owned Tables (schema: `orders`):**
- `orders`, `order_items`, `order_status_history`, `order_assignments`

**State Machine:**
```
pending → confirmed → preparing → packed → assigned → picked → in_transit → delivered
                  ↘ cancelled
delivered → returned → refunded / exchanged
```

Every transition creates an immutable row in `order_status_history`.

---

### 4. Vendor Service — **Phase 3**

**Domain:** Vendor onboarding, KYC, store management, staff, settlements view.

**Owned Tables (schema: `vendor`):**
- `vendors`, `vendor_documents`, `stores`, `store_timings`, `store_holidays`
- `delivery_zones`, `vendor_staff`, `vendor_commission_rates`

---

### 5. Rider Service — **Phase 4**

**Domain:** Rider onboarding, availability, order assignment, GPS tracking, earnings.

**Owned Tables (schema: `rider`):**
- `riders`, `rider_documents`, `rider_availability`, `rider_locations`
- `delivery_tasks`, `delivery_proofs`, `rider_earnings`

---

### 6. Payment Service — **Phase 6**

**Domain:** Payment processing, refunds, vendor payouts, reconciliation.

**Owned Tables (schema: `payments`):**
- `payments`, `payment_methods`, `refunds`, `settlements`, `payouts`, `payment_webhooks`

---

### 7. Wallet Service — **Phase 6**

**Domain:** Multi-wallet ledger system with double-entry accounting.

**Owned Tables (schema: `wallet`):**
- `wallets`, `wallet_transactions`, `wallet_ledger_entries`, `withdrawal_requests`

**Wallet Types:** customer, vendor, rider, referral, refund, reward, cashback

---

### 8. Referral Service — **Phase 7**

**Domain:** Configurable multi-level referral/MLM engine.

**Owned Tables (schema: `referral`):**
- `referral_programs`, `referral_levels`, `referral_codes`, `referral_tree`
- `referral_commissions`, `referral_campaigns`

Admin-configurable: levels (1–unlimited), percentage/fixed, eligibility, caps, expiry.

---

### 9. Notification Service — **Phase 2**

**Domain:** Push, SMS, email, in-app notifications.

**Channels:** FCM (push), Twilio/MSG91 (SMS), SendGrid/SES (email)

---

### 10. Tracking Service — **Phase 4**

**Domain:** Real-time order and rider GPS tracking.

**Transport:** WebSocket + Redis Pub/Sub → SSE fallback

---

### 11. Analytics Service — **Phase 9**

**Domain:** Event ingestion, aggregation, reporting dashboards.

**Events:** Page views, searches, cart actions, orders, payments (via event bus)

---

### 12. AI Service — **Phase 8**

**Domain:** Recommendations, search ranking, fraud detection, demand forecasting.

**Models:** Collaborative filtering, embedding search, anomaly detection

---

## Inter-Service Communication

| Pattern | Use Case | Phase |
|---------|----------|-------|
| Synchronous HTTP | Auth validation, real-time lookups | 1 |
| Redis Pub/Sub | Order status updates, stock changes | 2 |
| Redis Streams | Reliable event delivery | 4 |
| Kafka / Pub/Sub | Analytics, audit, cross-service events | 6 |

## API Versioning

All service APIs are prefixed with `/v1/`. Breaking changes require a new version. Deprecation window: 6 months minimum.

## Authentication Between Services

- **External clients:** JWT access token from auth-service
- **Service-to-service:** mTLS + service account tokens (Phase 6)
- **Internal network:** Private VPC, no public exposure

## Database Schema Isolation

```sql
CREATE SCHEMA auth;
CREATE SCHEMA catalog;
CREATE SCHEMA orders;
CREATE SCHEMA vendor;
CREATE SCHEMA rider;
CREATE SCHEMA payments;
CREATE SCHEMA wallet;
CREATE SCHEMA referral;
CREATE SCHEMA analytics;
```

Each service connects with a role limited to its schema. Cross-schema reads go through service APIs only.
