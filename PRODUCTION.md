# Vantoo Production Setup

## 1. Supabase

1. Open [Supabase SQL Editor](https://supabase.com/dashboard) for your project.
2. Run the migration: `supabase/migrations/001_initial_schema.sql`
3. Enable **Email** auth in Authentication → Providers.
4. Copy **service_role** key to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
5. Seed products (after service role is set):
   ```
   curl -X POST http://localhost:3000/api/seed
   ```

### Admin account

Sign up with email `admin@vantoo.com` — the trigger assigns the `admin` role automatically.

### Auth troubleshooting (400 errors)

If login/signup fails:

1. **Run the SQL migration** — without it, signup can fail when the `profiles` trigger runs.
2. **Enable Email provider** — Supabase → Authentication → Providers → Email (enabled).
3. **Disable email confirmation for dev** — Authentication → Providers → Email → turn off **Confirm email**.
4. **Add service role key** (recommended) — enables instant signup without email confirmation:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
5. Optional: use legacy anon JWT key if publishable key fails:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

## 2. Razorpay

Add your **full** test keys to `.env.local` (keys from dashboard are longer than screenshot crops):

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
```

## 3. Run

```bash
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin (admin account required)
- Sign up: http://localhost:3000/signup

## Features

- Supabase email/password auth
- Razorpay checkout (UPI, card, netbanking)
- Cash on Delivery
- Live order tracking with map + Supabase Realtime
- Order cancel + refund workflow
- Admin dashboard for products & orders
- Refund, cancellation, terms & privacy policies
