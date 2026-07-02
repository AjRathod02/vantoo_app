# Vantoo

Vantoo is a full-stack super-app website for food delivery, groceries, medicine and online shopping, built with Next.js. It implements the complete Vantoo UI design as a responsive, installable web app backed by a mock API and data layer.

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for styling and the design system
- **Zustand** (with `localStorage` persistence) for cart, wishlist and auth state
- **Zod** for API request validation
- **Embla Carousel** for the home hero
- **Lucide** icons
- **PWA** support via `@ducanh2912/next-pwa` (installable, offline fallback)

## Features

- Home page with hero carousel, service grid, categories, offers and top restaurants
- Four service hubs: Food, Grocery, Medicine and E-commerce
- E-commerce store with a server-backed filter sidebar (category, price, brand, rating, sort)
- Product detail pages with related products
- Unified search across all services
- Cart with quantity controls, promo codes and live totals
- Multi-step checkout (address, payment, review) that creates a real order via the API
- Orders list with Ongoing / Delivered / Cancelled tabs
- Live order tracking with an animated status timeline and a stylised delivery map
- Mock phone-number login with a protected-route middleware
- Profile and wallet pages
- Wishlist, toast notifications, loading skeletons and empty states
- Responsive layout with a mobile bottom navigation bar
- Installable as a PWA with an offline fallback page

## Getting Started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other scripts

```bash
npm run build   # production build (also generates the service worker)
npm run start   # serve the production build
npm run lint    # run ESLint
```

> The PWA service worker is disabled in development and only active in production builds.

## Deploy on Vercel

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import the repo.
3. Keep the defaults (Framework: **Next.js**, Build: `npm run build`).
4. Under **Environment Variables**, add every key from [`.env.example`](.env.example) using your Firebase project values.
5. Click **Deploy**.

Vercel will assign a URL like `https://your-project.vercel.app`. Pushes to the default branch redeploy automatically.

> **Note:** `.env` is not committed. You must set the Firebase variables in the Vercel dashboard for Analytics to work in production.

## Demo Notes

This project is a UI/front-end demo with a mock backend:

- **Data** lives in [`lib/data`](lib/data) and is served through API routes under [`app/api`](app/api).
- **Orders** are kept in an in-memory store ([`lib/server/orderStore.ts`](lib/server/orderStore.ts)) for the lifetime of the server process. Order status advances automatically on a compressed demo timeline (Confirmed to Delivered in ~80 seconds).
- **Login** accepts any phone number and sets a session cookie; social login is mocked.
- **Promo codes**: try `SAVE10` (10% off) or `VANTOO20` (20% off).
- **Payments** and the **map** are mocked (no Razorpay/Stripe or Google Maps).

## Project Structure

```
app/                 # App Router pages, layouts and API routes
  api/               # Mock REST endpoints (products, orders, auth, ...)
components/          # UI primitives, layout and feature components
  ui/                # Buttons, inputs, badges, etc.
  layout/            # Navbar, SubNav, Footer, MobileNav
lib/                 # Types, utils, mock data, Zustand stores
  data/              # Seed data
  stores/            # cart, wishlist, auth, toast
  server/            # Server-side order store
public/              # Manifest, icons, PWA assets
```

## Possible Extensions

- Replace the JSON seed data with PostgreSQL + Prisma
- Real payment gateway (Razorpay / Stripe)
- Google Maps / Mapbox with WebSocket live tracking
- SMS OTP authentication
- Vendor / admin dashboard
