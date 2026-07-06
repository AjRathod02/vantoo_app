-- Vantoo Platform — Enterprise Auth & RBAC Schema
-- Migration: 002_enterprise_auth_rbac.sql
-- Schema: auth

CREATE SCHEMA IF NOT EXISTS auth;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE auth.user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification', 'banned');
CREATE TYPE auth.otp_channel AS ENUM ('sms', 'email', 'whatsapp');
CREATE TYPE auth.otp_purpose AS ENUM ('login', 'register', 'password_reset', 'phone_verify', 'email_verify');
CREATE TYPE auth.identity_provider AS ENUM ('email', 'phone', 'google', 'apple');
CREATE TYPE auth.device_platform AS ENUM ('web', 'ios', 'android', 'unknown');

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE auth.users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE,
  phone           TEXT UNIQUE,
  password_hash   TEXT,
  first_name      TEXT NOT NULL DEFAULT '',
  last_name       TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT,
  status          auth.user_status NOT NULL DEFAULT 'pending_verification',
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT users_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX users_email_idx ON auth.users (email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX users_phone_idx ON auth.users (phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX users_status_idx ON auth.users (status) WHERE deleted_at IS NULL;

-- ============================================================
-- OAUTH / SOCIAL IDENTITIES
-- ============================================================

CREATE TABLE auth.auth_identities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  provider        auth.identity_provider NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_email  TEXT,
  provider_data   JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX auth_identities_user_idx ON auth.auth_identities (user_id);

-- ============================================================
-- ROLES & PERMISSIONS (RBAC)
-- ============================================================

CREATE TABLE auth.roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auth.permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  resource    TEXT NOT NULL,
  action      TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (resource, action)
);

CREATE TABLE auth.role_permissions (
  role_id       UUID NOT NULL REFERENCES auth.roles (id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES auth.permissions (id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE auth.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES auth.roles (id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  UNIQUE (user_id, role_id)
);

CREATE INDEX user_roles_user_idx ON auth.user_roles (user_id);

-- ============================================================
-- DEVICES (must exist before sessions)
-- ============================================================

CREATE TABLE auth.user_devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  device_name     TEXT NOT NULL DEFAULT 'Unknown Device',
  platform        auth.device_platform NOT NULL DEFAULT 'unknown',
  fingerprint     TEXT NOT NULL,
  push_token      TEXT,
  biometric_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_trusted      BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fingerprint)
);

CREATE INDEX user_devices_user_idx ON auth.user_devices (user_id);

-- ============================================================
-- SESSIONS & REFRESH TOKENS
-- ============================================================

CREATE TABLE auth.user_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  device_id       UUID REFERENCES auth.user_devices (id) ON DELETE SET NULL,
  session_token   TEXT NOT NULL UNIQUE,
  ip_address      INET,
  user_agent      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX user_sessions_user_idx ON auth.user_sessions (user_id) WHERE is_active = TRUE;
CREATE INDEX user_sessions_expires_idx ON auth.user_sessions (expires_at) WHERE is_active = TRUE;

CREATE TABLE auth.refresh_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES auth.user_sessions (id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ
);

CREATE INDEX refresh_tokens_user_idx ON auth.refresh_tokens (user_id) WHERE is_revoked = FALSE;
CREATE INDEX refresh_tokens_session_idx ON auth.refresh_tokens (session_id);

-- ============================================================
-- OTP VERIFICATIONS
-- ============================================================

CREATE TABLE auth.otp_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier      TEXT NOT NULL,
  channel         auth.otp_channel NOT NULL,
  purpose         auth.otp_purpose NOT NULL,
  otp_hash        TEXT NOT NULL,
  attempts        INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 3,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at      TIMESTAMPTZ NOT NULL,
  verified_at     TIMESTAMPTZ,
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX otp_verifications_identifier_idx ON auth.otp_verifications (identifier, purpose)
  WHERE is_verified = FALSE;

-- ============================================================
-- PASSWORD HISTORY
-- ============================================================

CREATE TABLE auth.password_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  password_hash   TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX password_history_user_idx ON auth.password_history (user_id, created_at DESC);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE auth.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  resource        TEXT,
  resource_id     TEXT,
  ip_address      INET,
  user_agent      TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  success         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_user_idx ON auth.audit_logs (user_id, created_at DESC);
CREATE INDEX audit_logs_action_idx ON auth.audit_logs (action, created_at DESC);
CREATE INDEX audit_logs_created_idx ON auth.audit_logs (created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION auth.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auth.set_updated_at();

CREATE TRIGGER auth_identities_updated_at
  BEFORE UPDATE ON auth.auth_identities
  FOR EACH ROW EXECUTE FUNCTION auth.set_updated_at();

CREATE TRIGGER user_devices_updated_at
  BEFORE UPDATE ON auth.user_devices
  FOR EACH ROW EXECUTE FUNCTION auth.set_updated_at();

-- ============================================================
-- SEED SYSTEM ROLES
-- ============================================================

INSERT INTO auth.roles (name, display_name, description, is_system) VALUES
  ('super_admin',       'Super Admin',       'Full platform access',                    TRUE),
  ('admin',             'Admin',             'Platform administration',                 TRUE),
  ('finance_team',      'Finance Team',      'Financial operations and settlements',    TRUE),
  ('area_manager',      'Area Manager',      'Regional operations management',          TRUE),
  ('support_executive', 'Support Executive', 'Customer support operations',             TRUE),
  ('restaurant_owner',  'Restaurant Owner',  'Restaurant vendor account',               TRUE),
  ('grocery_store',     'Grocery Store',     'Grocery store vendor account',            TRUE),
  ('ecommerce_seller',  'E-commerce Seller', 'E-commerce seller account',               TRUE),
  ('vendor',            'Vendor',            'Generic vendor account',                  TRUE),
  ('delivery_rider',    'Delivery Rider',    'Delivery partner account',                TRUE),
  ('customer',          'Customer',          'End customer account',                    TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED PERMISSIONS
-- ============================================================

INSERT INTO auth.permissions (name, resource, action, description) VALUES
  ('products:read',    'products',    'read',    'View products'),
  ('products:create',  'products',    'create',  'Create products'),
  ('products:update',  'products',    'update',  'Update products'),
  ('products:delete',  'products',    'delete',  'Delete products'),
  ('orders:read',      'orders',      'read',    'View orders'),
  ('orders:create',    'orders',      'create',  'Create orders'),
  ('orders:update',    'orders',      'update',  'Update order status'),
  ('orders:cancel',    'orders',      'cancel',  'Cancel orders'),
  ('vendors:read',     'vendors',     'read',    'View vendors'),
  ('vendors:approve',  'vendors',     'approve', 'Approve vendor applications'),
  ('vendors:manage',   'vendors',     'manage',  'Manage vendor accounts'),
  ('users:read',       'users',       'read',    'View users'),
  ('users:manage',     'users',         'manage',  'Manage user accounts'),
  ('users:ban',        'users',       'ban',     'Ban/suspend users'),
  ('payments:read',    'payments',    'read',    'View payments'),
  ('payments:refund',  'payments',    'refund',  'Process refunds'),
  ('payments:settle',  'payments',    'settle',  'Process settlements'),
  ('riders:read',      'riders',      'read',    'View riders'),
  ('riders:manage',    'riders',      'manage',  'Manage riders'),
  ('admin:dashboard',  'admin',       'dashboard','Access admin dashboard'),
  ('admin:reports',    'admin',       'reports', 'Access reports'),
  ('admin:config',     'admin',       'config',  'System configuration'),
  ('wallet:read',      'wallet',      'read',    'View wallet'),
  ('wallet:manage',    'wallet',      'manage',  'Manage wallets'),
  ('referral:read',    'referral',    'read',    'View referral data'),
  ('referral:manage',  'referral',    'manage',  'Manage referral programs')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to super_admin
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
CROSS JOIN auth.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Assign customer permissions
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.name IN ('products:read', 'orders:read', 'orders:create', 'orders:cancel', 'wallet:read', 'referral:read')
WHERE r.name = 'customer'
ON CONFLICT DO NOTHING;

-- Assign admin permissions
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.resource IN ('products', 'orders', 'vendors', 'users', 'payments', 'riders', 'admin', 'wallet', 'referral')
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Assign vendor permissions
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.name IN ('products:read', 'products:create', 'products:update', 'orders:read', 'orders:update', 'wallet:read')
WHERE r.name = 'vendor'
ON CONFLICT DO NOTHING;

-- Assign rider permissions
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.name IN ('orders:read', 'orders:update', 'wallet:read')
WHERE r.name = 'delivery_rider'
ON CONFLICT DO NOTHING;
