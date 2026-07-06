-- Vantoo Platform — Notification Schema
-- Migration: 006_notifications.sql

CREATE SCHEMA IF NOT EXISTS notifications;

CREATE TYPE notifications.channel AS ENUM ('push', 'sms', 'email', 'in_app', 'whatsapp');
CREATE TYPE notifications.notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');

CREATE TABLE notifications.notification_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  channel     notifications.channel NOT NULL,
  subject     TEXT NOT NULL DEFAULT '',
  body        TEXT NOT NULL,
  variables   TEXT[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  channel         notifications.channel NOT NULL,
  template_name   TEXT,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB NOT NULL DEFAULT '{}',
  status          notifications.notification_status NOT NULL DEFAULT 'pending',
  reference_type  TEXT,
  reference_id    TEXT,
  read_at         TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON notifications.notifications (user_id, created_at DESC);
CREATE INDEX notifications_status_idx ON notifications.notifications (status) WHERE status = 'pending';

CREATE TABLE notifications.delivery_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id   UUID NOT NULL REFERENCES notifications.notifications (id) ON DELETE CASCADE,
  channel           notifications.channel NOT NULL,
  provider          TEXT NOT NULL DEFAULT 'internal',
  provider_message_id TEXT,
  status            notifications.notification_status NOT NULL,
  error             TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default templates
INSERT INTO notifications.notification_templates (name, channel, subject, body, variables) VALUES
  ('otp_sms', 'sms', '', 'Your Vantoo OTP is {{otp}}. Valid for {{minutes}} minutes. Do not share.', ARRAY['otp', 'minutes']),
  ('order_confirmed', 'push', 'Order Confirmed', 'Your order {{orderNumber}} has been confirmed!', ARRAY['orderNumber']),
  ('order_preparing', 'push', 'Order Being Prepared', 'Your order {{orderNumber}} is being prepared.', ARRAY['orderNumber']),
  ('order_out_for_delivery', 'push', 'Out for Delivery', 'Your order {{orderNumber}} is on the way!', ARRAY['orderNumber']),
  ('order_delivered', 'push', 'Delivered', 'Your order {{orderNumber}} has been delivered. Enjoy!', ARRAY['orderNumber']),
  ('order_cancelled', 'push', 'Order Cancelled', 'Your order {{orderNumber}} has been cancelled.', ARRAY['orderNumber'])
ON CONFLICT (name) DO NOTHING;

-- Legacy product ID mapping for catalog migration
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS legacy_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS products_legacy_id_idx ON catalog.products (legacy_id) WHERE legacy_id IS NOT NULL;
