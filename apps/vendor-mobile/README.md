# Vantoo Vendor Mobile App

Separate vendor application — **not** shared with customer login.

## Features (planned)
- Store registration & KYC
- Product / menu / inventory management
- Order accept/reject/prepare/ready
- Analytics, earnings, wallet, settlements

## API
All requests go to `/api/vendor/*` on the backend:

```
POST /api/vendor/apply
GET  /api/vendor/me
GET  /api/vendor/orders
PATCH /api/vendor/orders
GET  /api/vendor/products
POST /api/vendor/products
GET  /api/vendor/stores
```

Set `EXPO_PUBLIC_API_URL=http://localhost:3000` in `.env`.

## Setup

```bash
cd apps/vendor-mobile
npm install
npx expo start
```

## Auth
Vendor login is independent of customer accounts. Platform auth-service JWT integration is planned (Phase 3).
