-- Vantoo Platform — Orders & Payments Schema
-- Migration: 004_enterprise_orders_payments.sql
-- Schema: orders, payments

CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS payments;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE orders.order_status AS ENUM (
  'pending', 'confirmed', 'preparing', 'packed',
  'assigned', 'picked', 'in_transit', 'delivered',
  'cancelled', 'returned', 'refunded', 'exchanged'
);

CREATE TYPE orders.delivery_type AS ENUM ('standard', 'express', 'scheduled', 'pickup');
CREATE TYPE orders.cancel_reason AS ENUM ('customer', 'vendor', 'rider', 'system', 'fraud', 'other');

CREATE TYPE payments.payment_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payments.payment_method AS ENUM ('upi', 'card', 'netbanking', 'wallet', 'cod', 'gift_card', 'split');
CREATE TYPE payments.refund_status AS ENUM ('none', 'requested', 'processing', 'completed', 'failed');

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders.orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        TEXT UNIQUE,
  user_id             UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  store_id            UUID REFERENCES vendor.stores (id) ON DELETE SET NULL,
  vendor_id           UUID REFERENCES vendor.vendors (id) ON DELETE SET NULL,
  service_type        catalog.service_type NOT NULL,
  status              orders.order_status NOT NULL DEFAULT 'pending',
  delivery_type       orders.delivery_type NOT NULL DEFAULT 'standard',
  scheduled_at        TIMESTAMPTZ,
  subtotal            NUMERIC(12,2) NOT NULL,
  delivery_fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
  packaging_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  wallet_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(12,2) NOT NULL,
  commission_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status      payments.payment_status NOT NULL DEFAULT 'pending',
  payment_method      payments.payment_method,
  coupon_code         TEXT,
  delivery_address    JSONB NOT NULL,
  delivery_instructions TEXT NOT NULL DEFAULT '',
  estimated_delivery  TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancel_reason       orders.cancel_reason,
  cancel_note         TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX orders_user_idx ON orders.orders (user_id, created_at DESC);
CREATE INDEX orders_store_idx ON orders.orders (store_id, status);
CREATE INDEX orders_vendor_idx ON orders.orders (vendor_id, status);
CREATE INDEX orders_status_idx ON orders.orders (status, created_at DESC);
CREATE INDEX orders_number_idx ON orders.orders (order_number);

CREATE TABLE orders.order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders.orders (id) ON DELETE CASCADE,
  product_id      UUID REFERENCES catalog.products (id) ON DELETE SET NULL,
  variant_id      UUID REFERENCES catalog.product_variants (id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  variant_name    TEXT NOT NULL DEFAULT '',
  sku             TEXT NOT NULL DEFAULT '',
  image_url       TEXT,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(12,2) NOT NULL,
  tax_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price     NUMERIC(12,2) NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX order_items_order_idx ON orders.order_items (order_id);

-- Immutable order state transition log
CREATE TABLE orders.order_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders.orders (id) ON DELETE CASCADE,
  from_status     orders.order_status,
  to_status       orders.order_status NOT NULL,
  changed_by      UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  changed_by_role TEXT,
  note            TEXT NOT NULL DEFAULT '',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX order_status_history_order_idx ON orders.order_status_history (order_id, created_at);

CREATE TABLE orders.order_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders.orders (id) ON DELETE CASCADE,
  rider_id        UUID NOT NULL,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,
  picked_at       TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  metadata        JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX order_assignments_order_idx ON orders.order_assignments (order_id) WHERE is_active = TRUE;
CREATE INDEX order_assignments_rider_idx ON orders.order_assignments (rider_id) WHERE is_active = TRUE;

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders.orders (id) ON DELETE RESTRICT,
  user_id             UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  amount              NUMERIC(12,2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'INR',
  method              payments.payment_method NOT NULL,
  status              payments.payment_status NOT NULL DEFAULT 'pending',
  gateway             TEXT NOT NULL DEFAULT 'razorpay',
  gateway_order_id    TEXT,
  gateway_payment_id  TEXT,
  gateway_signature   TEXT,
  idempotency_key     TEXT UNIQUE,
  failure_reason      TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX payments_order_idx ON payments.payments (order_id);
CREATE INDEX payments_user_idx ON payments.payments (user_id, created_at DESC);
CREATE INDEX payments_gateway_idx ON payments.payments (gateway_order_id) WHERE gateway_order_id IS NOT NULL;

CREATE TABLE payments.payment_splits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id      UUID NOT NULL REFERENCES payments.payments (id) ON DELETE CASCADE,
  method          payments.payment_method NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  wallet_id       UUID,
  gateway_payment_id TEXT,
  status          payments.payment_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments.refunds (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id          UUID NOT NULL REFERENCES payments.payments (id) ON DELETE RESTRICT,
  order_id            UUID NOT NULL REFERENCES orders.orders (id) ON DELETE RESTRICT,
  amount              NUMERIC(12,2) NOT NULL,
  reason              TEXT NOT NULL DEFAULT '',
  status              payments.refund_status NOT NULL DEFAULT 'requested',
  gateway_refund_id   TEXT,
  requested_by        UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  processed_at        TIMESTAMPTZ,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX refunds_order_idx ON payments.refunds (order_id);
CREATE INDEX refunds_payment_idx ON payments.refunds (payment_id);

CREATE TABLE payments.payment_webhooks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway         TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  signature       TEXT,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_processed    BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at    TIMESTAMPTZ,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX payment_webhooks_unprocessed_idx ON payments.payment_webhooks (created_at)
  WHERE is_processed = FALSE;

-- Order number sequence
CREATE SEQUENCE orders.order_number_seq START 100000;

CREATE OR REPLACE FUNCTION orders.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.order_number := 'VT' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(NEXTVAL('orders.order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_set_number
  BEFORE INSERT ON orders.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION orders.generate_order_number();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders.orders
  FOR EACH ROW EXECUTE FUNCTION auth.set_updated_at();

-- Auto-log status transitions
CREATE OR REPLACE FUNCTION orders.log_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO orders.order_status_history (order_id, from_status, to_status, note)
    VALUES (NEW.id, OLD.status, NEW.status, 'Automatic status transition');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_status_change
  AFTER UPDATE OF status ON orders.orders
  FOR EACH ROW EXECUTE FUNCTION orders.log_status_change();
