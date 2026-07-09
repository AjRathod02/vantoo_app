-- Supabase-compatible RBAC in platform_auth schema (auth schema is managed by Supabase)

CREATE SCHEMA IF NOT EXISTS platform_auth;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS platform_auth.roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_auth.permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  resource    TEXT NOT NULL,
  action      TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (resource, action)
);

CREATE TABLE IF NOT EXISTS platform_auth.role_permissions (
  role_id       UUID NOT NULL REFERENCES platform_auth.roles (id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES platform_auth.permissions (id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS platform_auth.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES platform_auth.roles (id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS user_roles_user_idx ON platform_auth.user_roles (user_id);

INSERT INTO platform_auth.roles (name, display_name, description, is_system) VALUES
  ('super_admin', 'Super Admin', 'Full platform access', TRUE),
  ('admin', 'Admin', 'Platform administration', TRUE),
  ('restaurant_owner', 'Restaurant Owner', 'Restaurant vendor account', TRUE),
  ('grocery_store', 'Grocery Store', 'Grocery store vendor account', TRUE),
  ('ecommerce_seller', 'E-commerce Seller', 'E-commerce seller account', TRUE),
  ('vendor', 'Vendor', 'Generic vendor account', TRUE),
  ('customer', 'Customer', 'End customer account', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO platform_auth.permissions (name, resource, action, description) VALUES
  ('products:read', 'products', 'read', 'View products'),
  ('products:create', 'products', 'create', 'Create products'),
  ('products:update', 'products', 'update', 'Update products'),
  ('orders:read', 'orders', 'read', 'View orders'),
  ('orders:update', 'orders', 'update', 'Update order status'),
  ('vendors:read', 'vendors', 'read', 'View vendors'),
  ('vendors:approve', 'vendors', 'approve', 'Approve vendor applications'),
  ('wallet:read', 'wallet', 'read', 'View wallet')
ON CONFLICT (name) DO NOTHING;

INSERT INTO platform_auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM platform_auth.roles r
JOIN platform_auth.permissions p ON p.name IN ('products:read', 'products:create', 'products:update', 'orders:read', 'orders:update', 'wallet:read')
WHERE r.name = 'vendor'
ON CONFLICT DO NOTHING;
