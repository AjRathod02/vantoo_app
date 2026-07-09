# Vantoo Customer Mobile App

Android + iOS app sharing the same backend as customer web.

## API
Uses `/api/customer/*` namespace (same as customer web PWA):

```
GET  /api/customer/products
GET  /api/customer/orders
POST /api/customer/orders
GET  /api/customer/offers
```

Set `EXPO_PUBLIC_API_URL=http://localhost:3000`.

## Setup

```bash
cd apps/customer-mobile
npm install
npx expo start
```

## Status
Scaffold — feature parity with customer web is planned for Phase 2.
