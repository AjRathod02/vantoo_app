# Vantoo Platform — End-to-End QA Report

**Date:** 2026-07-12  
**Environment:** Local Next.js 14 (`localhost:3000`), Supabase configured, Razorpay configured  
**Tester:** Automated API/page smoke + authenticated flow + security audit + code fixes  
**Verdict:** **Not production-ready** — critical payment/tracking bugs were found and fixed in this session; remaining blockers below must be cleared before go-live.

---

## Executive summary

Customer browse → signup/login → COD order → track → cancel works against the running app. Multiple **critical** payment and tracking vulnerabilities were present and have been patched. Vendor/rider full flows require platform microservices (`PLATFORM_ENABLED=true` with services up). There is no Playwright/Cypress suite; coverage here is API/page smoke + targeted security retests.

---

## Test counts

| Metric | Count |
|--------|------:|
| Automated smoke cases (pages + APIs + auth guards) | 87 |
| Smoke passed (initial) | 86 |
| Smoke failed (initial) | 1* |
| Security regression checks after fixes | 9/9 pass |
| Authenticated customer API flows | 12+ pass |
| Platform Vitest unit tests | 11+ pass |
| **Bugs found (this session)** | **18** |
| **Bugs fixed (this session)** | **16** |
| **Remaining open issues** | **see below** |

\* `/api/auth/me` returns `200 { user: null }` when logged out — intentional SPA pattern, not a failure.

### Estimated feature checklist coverage

| Area | Cases planned | Executed | Pass | Fail / Blocked | N/A / Missing |
|------|--------------:|---------:|-----:|---------------:|--------------:|
| Customer auth (email) | 8 | 6 | 6 | 0 | Google OAuth manual |
| Customer shopping / catalog | 20 | 14 | 14 | 0 | Videos/wishlist sync |
| Checkout + COD | 10 | 8 | 8 | 0 | Map picker UI manual |
| Razorpay live UI success/fail | 8 | 3 (API) | 3 | 0 | Live Checkout.js manual |
| Orders / tracking / cancel | 10 | 7 | 7 | 0 | Invoice PDF (txt only) |
| Admin modules | 40 | 25 (routes/API) | 24 | 1† | Full UI CRUD manual |
| Vendor portal | 12 | 4 | 4 | 0 | Needs platform services |
| Rider portal | 12 | 4 | 4 | 0 | Needs platform services |
| Security / edge cases | 20 | 18 | 18 | 0 | XSS browser matrix |
| Performance sample | 6 | 6 | 6 | 0 | Load test not run |

† Admin authenticated UI was previously used successfully in this environment (dashboard/customers 200 in server logs); full RBAC matrix not exhaustively re-run without admin credentials in this automated pass.

---

## Bugs found and fixed

### Critical (fixed)

| ID | Issue | Fix |
|----|-------|-----|
| C1 | Online orders accepted `paymentStatus: "paid"` without gateway proof | Server verifies Razorpay capture + amount before creating paid orders |
| C2 | Client could set Razorpay charge amount (underpayment) | `/api/payments/razorpay/create-order` prices from catalog items only |
| C3 | Order totals used client item prices | `priceOrderItems()` resolves products server-side |
| C4 | Same Razorpay payment could create multiple orders | Payment-id reuse check + migration unique index |
| C5 | Order tracking SSE unauthenticated (PII leak) | Session + ownership required |
| C6 | Any user could POST rider GPS on any order | `/api/rider/location` requires approved rider/admin; `/api/tracking/rider-location` admin-only |

### High (fixed)

| ID | Issue | Fix |
|----|-------|-----|
| H1 | Customer could spoof rider location on own order | Removed customer write path |
| H2 | Tracking GET allowed when `userId` missing | Auth + admin-only fallback |
| H3 | PostgREST `.or()` injection via search `q` | Sanitize filter chars |
| H4 | Coupon `ilike` wildcard broadening | Exact `.eq("code")` |
| H5 | Admin refunds status-only / weak validation | Validate order/amount; call Razorpay refund API on complete |
| H6 | Fake verified-purchase reviews | Verify order ownership + line item |
| H7 | Location role spoofing (`rider`/`vendor`) | Derive role from session, not client claim |
| H8 | HMAC compare not constant-time | `timingSafeEqual` |
| H9 | Admin orders always 403 | Return 401 when unauthenticated |
| H10 | Razorpay gateway auth mapped to 401 (looked like session expiry) | Use 502 for gateway auth failure |
| H11 | Product detail API seed-only vs SSR `getProduct` | Wire `/api/products/[id]` to `getProduct`/`listProducts` |
| H12 | `/api/rider/me` 500 when rider service down | Catch + graceful null payload (match vendor) |
| H13 | Missing webhook endpoint | Added `/api/payments/razorpay/webhook` + CSRF allowlist |
| H14 | Cart tax vs server pricing mismatch risk | Shared `DELIVERY_FEE`/`TAX_RATE` constants |

### Remaining / deferred

| Priority | Issue | Notes |
|----------|-------|-------|
| **Blocker** | `PLATFORM_ENABLED=true` but microservices often down | Causes `ECONNREFUSED` noise and slow fallbacks; set `false` for Supabase-only prod **or** run full platform stack |
| **Blocker** | Apply DB migration `009_unique_razorpay_payment_id.sql` | Required for hard unique payment IDs |
| **Blocker** | Set `RAZORPAY_WEBHOOK_SECRET` in production | Webhook rejects unsigned events in prod |
| High | Platform tracking Socket.IO / service GET still weak if exposed | Harden when platform tracking is enabled |
| High | Wishlist client-only (Zustand) | Not server-synced |
| Medium | Restaurants API still static seed | Demo data |
| Medium | Admin vendor/rider edit forms “coming soon” | Partial UI |
| Medium | Invoice download is `.txt`, not PDF | Feature gap |
| Medium | No root Playwright E2E suite | Add before release |
| Low | Google OAuth / live Razorpay Checkout.js / multi-browser | Manual QA still required |
| Low | Mobile apps under `apps/*-mobile` | Scaffolds only |

---

## API health summary

| Category | Status |
|----------|--------|
| Public catalog (`/api/products`, categories, search, offers, blog) | Healthy |
| Auth validation (bad login/signup) | Healthy (400/401) |
| Protected APIs without session | Healthy (401) |
| Admin APIs without session | Healthy (401) |
| Payments create/verify (auth + validation) | Healthy after fixes |
| Razorpay webhook route | Present (`POST` 200 on ping in dev) |
| Orders COD create / cancel / track | Healthy |
| Paid-order spoof | **Blocked** (400) |
| Amount-only Razorpay create | **Blocked** (400) |
| Vendor/rider when platform down | Degraded gracefully (null + warning) |
| Broken endpoints found | Rider `/me` 500 — **fixed** |

Smoke artifact: `scripts/e2e-smoke.mjs` → `scripts/e2e-smoke-results.json`

---

## Database health summary

| Check | Result |
|-------|--------|
| Supabase configured | Yes (`/api/setup/status`) |
| Admin client | Yes |
| `profiles` table | Yes |
| `DATABASE_URL` set | Yes |
| Orders insert/update/cancel | Verified via COD + cancel |
| Relationships / RLS | Present in migrations; not fully penetration-tested |
| Unique Razorpay payment id | Migration added — **must be applied** |
| Duplicate payment prevention | Enforced in app code; DB unique index pending migrate |

---

## Performance metrics (dev, cold/warm mixed)

| Surface | Sample latency |
|---------|----------------|
| Homepage `/` | ~1.1–5.9s (compile-dependent) |
| `/food` | ~1.2–8.5s first compile; ~1.2s warm |
| Product `/product/p-f3` | ~4.0s |
| Cart `/cart` | ~0.9–2.1s |
| Login `/login` | ~0.2s |
| Admin login | ~0.2s |
| `GET /api/products` | ~3.2s first / faster warm |
| `GET /api/search/suggest?q=pizza` | ~0.1s warm |
| Authenticated COD order POST | ~2–3s |
| Avg smoke request | ~1.7s |

**Notes:** Dev-mode compilation inflates first-hit times. Production `next build` + CDN expected much lower. Platform fallbacks when services are down add latency — disable platform or run services.

---

## Security observations

**Fixed this session:** payment forgery, underpayment, tracking PII SSE, GPS spoofing, filter injection, refund validation, review verification spoof, location role spoof, timing-safe HMAC, production `INTERNAL_SERVICE_KEY` fail-closed.

**Still verify before prod:**
- Disable or lock `/api/setup/*` after bootstrap
- Confirm admin JWT secrets are non-default
- Confirm Supabase RLS policies for orders/products/profiles
- Rate limiting on auth endpoints (middleware/security headers present; dedicated limiter not fully validated)
- CSRF Origin checks on mutating APIs (webhook allowlisted)
- Browser XSS matrix (search returns escaped JSON; UI encoding assumed)

---

## Real-time synchronization status

| Channel | Status |
|---------|--------|
| In-process SSE order tracking | Works when authenticated as owner |
| Simulated rider motion (non-platform) | Present |
| Platform Socket.IO tracking | Requires tracking service on `:4010` |
| Admin live locations | Depends on `/api/location` + admin auth |
| Instant complaint/review push | Partial (poll/API); not full websocket fanout |

---

## Feature readiness by surface

### Customer website — **mostly ready (after fixes)**
Auth email, catalog, cart, COD checkout, orders, cancel, tracking (auth), referrals, wallet read, support tickets, reviews (with verified purchase check), help pages — validated at API/page level.

### Payments — **hardened, needs live Checkout QA**
Server pricing + capture verify + webhook route + refund API call. Still need: live Razorpay success/fail UI, webhook secret, migration apply, confirm no cart bounce after pay (success-nav already present).

### Admin panel — **functional with gaps**
Routes guarded; APIs protected. Refunds improved. Full export PDF/Excel matrix and every CRUD form not exhaustively UI-tested in this pass.

### Vendor / Rider — **not production-ready**
UI + BFF exist; require healthy platform services. With services down, APIs degrade to null (now without 500).

### Mobile apps — **not ready**
Scaffolds only.

---

## Responsive / browser testing

| Target | Status |
|--------|--------|
| Mobile / tablet / desktop CSS | Existing Tailwind layouts; spot-check only — no device lab |
| Chrome | Primary test browser (dev) |
| Firefox / Edge / Safari / Android / iOS | **Not executed** this session |

---

## Recommendations for production deployment

1. **Apply** `supabase/migrations/009_unique_razorpay_payment_id.sql`.
2. Set **`RAZORPAY_WEBHOOK_SECRET`**; configure Razorpay dashboard → `/api/payments/razorpay/webhook`.
3. Either set **`PLATFORM_ENABLED=false`** for Supabase-only mode, or run the full Docker/platform stack with health checks.
4. Rotate **`INTERNAL_SERVICE_KEY`**, **`JWT_SECRET`**, **`ADMIN_JWT_SECRET`** away from defaults.
5. Lock down **`/api/setup/*`** in production after bootstrap.
6. Manual QA: Google OAuth, full Razorpay Checkout success/failure/retry, admin refund complete with real payment, vendor/rider approval journey.
7. Add Playwright smoke covering signup → COD → track → admin order view.
8. Production build + load test homepage/checkout/API p95.
9. Do **not** declare production-ready until blockers above are green and live payment/webhook retested.

---

## Files changed (fixes)

- `app/api/products/[id]/route.ts`
- `app/api/orders/route.ts`
- `app/api/orders/[id]/tracking/route.ts`
- `app/api/orders/[id]/tracking/stream/route.ts`
- `app/api/payments/razorpay/create-order/route.ts`
- `app/api/payments/razorpay/verify/route.ts`
- `app/api/payments/razorpay/webhook/route.ts` *(new)*
- `app/api/tracking/rider-location/route.ts`
- `app/api/rider/location/route.ts`
- `app/api/rider/me/route.ts`
- `app/api/admin/orders/route.ts`
- `app/api/admin/refunds/route.ts`
- `app/api/products/[id]/reviews/route.ts`
- `app/api/coupons/validate/route.ts`
- `app/api/location/route.ts`
- `lib/razorpay.ts`
- `lib/server/orders.ts`
- `lib/server/products.ts`
- `lib/platform/client.ts`
- `lib/platform/riders.ts`
- `lib/checkout/payment-flow.ts`
- `lib/stores/cart.ts`
- `lib/security/csrf.ts`
- `lib/payments/server-pricing.ts` *(new)*
- `lib/payments/verify-payment.ts` *(new)*
- `lib/commerce/constants.ts` *(new)*
- `supabase/migrations/009_unique_razorpay_payment_id.sql` *(new)*
- `scripts/e2e-smoke.mjs` *(new)*
- `.env.example`

---

## Final verdict

| Gate | Status |
|------|--------|
| Critical payment forgery / underpayment | **Fixed & retested** |
| Tracking auth gaps | **Fixed & retested** |
| Customer COD happy path | **Pass** |
| Vendor/Rider production | **Fail** (platform dependency) |
| Live Razorpay + webhook secret + migration | **Pending ops** |
| Full UI/browser matrix | **Incomplete** |

**Production-ready: NO** — until platform mode is correctly configured, migration + webhook secret are applied, and live payment UI is signed off.
