-- Vantoo Platform — Rider Schema
-- Migration: 008_rider_schema.sql
-- Schema: rider

CREATE SCHEMA IF NOT EXISTS rider;

CREATE TYPE rider.rider_status AS ENUM (
  'pending', 'under_review', 'approved', 'rejected', 'suspended', 'inactive'
);

CREATE TYPE rider.vehicle_type AS ENUM (
  'bicycle', 'motorcycle', 'scooter', 'car', 'van', 'walk'
);

CREATE TYPE rider.document_type AS ENUM (
  'driving_license', 'aadhaar', 'pan', 'vehicle_rc', 'insurance', 'identity', 'address_proof', 'other'
);

CREATE TYPE rider.document_status AS ENUM (
  'pending', 'verified', 'rejected', 'expired'
);

CREATE TYPE rider.availability_status AS ENUM ('online', 'offline', 'busy');

CREATE TYPE rider.task_status AS ENUM (
  'assigned', 'accepted', 'picked', 'in_transit', 'delivered', 'cancelled'
);

CREATE TABLE rider.riders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  full_name       TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  phone           TEXT NOT NULL,
  email           TEXT NOT NULL,
  status          rider.rider_status NOT NULL DEFAULT 'pending',
  vehicle_type    rider.vehicle_type NOT NULL DEFAULT 'motorcycle',
  vehicle_number  TEXT,
  city            TEXT NOT NULL DEFAULT '',
  state           TEXT NOT NULL DEFAULT '',
  pincode         TEXT NOT NULL DEFAULT '',
  bank_account    JSONB NOT NULL DEFAULT '{}',
  metadata        JSONB NOT NULL DEFAULT '{}',
  approved_at     TIMESTAMPTZ,
  approved_by     UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX riders_user_idx ON rider.riders (user_id);
CREATE INDEX riders_status_idx ON rider.riders (status) WHERE deleted_at IS NULL;
CREATE INDEX riders_city_idx ON rider.riders (city) WHERE deleted_at IS NULL AND status = 'approved';

CREATE TABLE rider.rider_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id        UUID NOT NULL REFERENCES rider.riders (id) ON DELETE CASCADE,
  document_type   rider.document_type NOT NULL,
  document_number TEXT,
  file_url        TEXT NOT NULL,
  status          rider.document_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  verified_at     TIMESTAMPTZ,
  verified_by     UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX rider_documents_rider_idx ON rider.rider_documents (rider_id);

CREATE TABLE rider.rider_availability (
  rider_id        UUID PRIMARY KEY REFERENCES rider.riders (id) ON DELETE CASCADE,
  status          rider.availability_status NOT NULL DEFAULT 'offline',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rider.rider_locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id        UUID NOT NULL REFERENCES rider.riders (id) ON DELETE CASCADE,
  latitude        NUMERIC(10,7) NOT NULL,
  longitude       NUMERIC(10,7) NOT NULL,
  heading         NUMERIC(5,2),
  speed           NUMERIC(6,2),
  accuracy        NUMERIC(6,2),
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX rider_locations_rider_idx ON rider.rider_locations (rider_id, recorded_at DESC);

CREATE TABLE rider.delivery_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders.orders (id) ON DELETE CASCADE,
  rider_id        UUID NOT NULL REFERENCES rider.riders (id) ON DELETE RESTRICT,
  status          rider.task_status NOT NULL DEFAULT 'assigned',
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,
  picked_at       TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  pickup_address  JSONB NOT NULL DEFAULT '{}',
  delivery_address JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX delivery_tasks_rider_idx ON rider.delivery_tasks (rider_id, is_active) WHERE is_active = TRUE;
CREATE INDEX delivery_tasks_order_idx ON rider.delivery_tasks (order_id) WHERE is_active = TRUE;

CREATE TABLE rider.delivery_proofs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL REFERENCES rider.delivery_tasks (id) ON DELETE CASCADE,
  proof_type      TEXT NOT NULL DEFAULT 'photo',
  file_url        TEXT NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rider.rider_earnings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id        UUID NOT NULL REFERENCES rider.riders (id) ON DELETE RESTRICT,
  order_id        UUID REFERENCES orders.orders (id) ON DELETE SET NULL,
  amount          NUMERIC(12,2) NOT NULL,
  earning_type    TEXT NOT NULL DEFAULT 'delivery_fee',
  status          TEXT NOT NULL DEFAULT 'pending',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX rider_earnings_rider_idx ON rider.rider_earnings (rider_id, created_at DESC);

-- Link order_assignments to rider profiles
ALTER TABLE orders.order_assignments
  ADD CONSTRAINT order_assignments_rider_fk
  FOREIGN KEY (rider_id) REFERENCES rider.riders (id) ON DELETE RESTRICT;
