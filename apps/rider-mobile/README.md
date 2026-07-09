# Vantoo Rider Mobile App

Separate rider application — **not** shared with customer or vendor login.

## Features (planned)
- Rider registration & KYC
- Online/offline toggle
- Accept/reject deliveries
- Live GPS navigation
- Delivery OTP & proof
- Earnings, wallet, incentives

## API
All requests go to `/api/rider/*`:

```
POST /api/rider/apply
GET  /api/rider/me
PATCH /api/rider/availability
GET  /api/rider/deliveries
GET  /api/rider/earnings
PATCH /api/rider/location
```

Set `EXPO_PUBLIC_API_URL=http://localhost:3000` in `.env`.

## Setup

```bash
cd apps/rider-mobile
npm install
npx expo start
```
