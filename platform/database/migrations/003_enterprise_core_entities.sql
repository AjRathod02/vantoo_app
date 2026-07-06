-- Vantoo Platform — Core Entity Schema
-- Migration: 003_enterprise_core_entities.sql
-- Schema: catalog, vendor

CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS vendor;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE catalog.service_type AS ENUM ('food', 'grocery', 'medicine', 'ecommerce', 'local_shop');
CREATE TYPE catalog.product_status AS ENUM ('draft', 'active', 'inactive', 'out_of_stock', 'discontinued');
CREATE TYPE vendor.vendor_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'suspended', 'inactive');
CREATE TYPE vendor.store_type AS ENUM ('restaurant', 'grocery', 'pharmacy', 'ecommerce', 'local_shop');
CREATE TYPE vendor.document_type AS ENUM ('pan', 'gst', 'fssai', 'drug_license', 'bank_proof', 'identity', 'address_proof', 'other');
CREATE TYPE vendor.document_status AS ENUM ('pending', 'verified', 'rejected', 'expired');

-- ============================================================
-- VENDORS
-- ============================================================

CREATE TABLE vendor.vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  business_name   TEXT NOT NULL,
  legal_name      TEXT NOT NULL DEFAULT '',
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT NOT NULL DEFAULT '',
  logo_url        TEXT,
  status          vendor.vendor_status NOT NULL DEFAULT 'pending',
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  contact_email   TEXT NOT NULL,
  contact_phone   TEXT NOT NULL,
  gst_number      TEXT,
  pan_number      TEXT,
  bank_account    JSONB NOT NULL DEFAULT '{}',
  metadata        JSONB NOT NULL DEFAULT '{}',
  approved_at     TIMESTAMPTZ,
  approved_by     UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX vendors_user_idx ON vendor.vendors (user_id);
CREATE INDEX vendors_status_idx ON vendor.vendors (status) WHERE deleted_at IS NULL;
CREATE INDEX vendors_slug_idx ON vendor.vendors (slug);

CREATE TABLE vendor.vendor_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID NOT NULL REFERENCES vendor.vendors (id) ON DELETE CASCADE,
  document_type   vendor.document_type NOT NULL,
  document_number TEXT,
  file_url        TEXT NOT NULL,
  status          vendor.document_status NOT NULL DEFAULT 'pending',
  verified_at     TIMESTAMPTZ,
  verified_by     UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  rejection_reason TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX vendor_documents_vendor_idx ON vendor.vendor_documents (vendor_id);

-- ============================================================
-- STORES
-- ============================================================

CREATE TABLE vendor.stores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID NOT NULL REFERENCES vendor.vendors (id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  store_type      vendor.store_type NOT NULL,
  service_types   catalog.service_type[] NOT NULL DEFAULT '{}',
  description     TEXT NOT NULL DEFAULT '',
  image_url       TEXT,
  address_line1   TEXT NOT NULL,
  address_line2   TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL,
  state           TEXT NOT NULL DEFAULT '',
  pincode         TEXT NOT NULL,
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  delivery_radius_km NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  avg_delivery_mins INTEGER NOT NULL DEFAULT 30,
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count    INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE (vendor_id, slug)
);

CREATE INDEX stores_vendor_idx ON vendor.stores (vendor_id);
CREATE INDEX stores_location_idx ON vendor.stores (latitude, longitude) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX stores_type_idx ON vendor.stores (store_type) WHERE is_active = TRUE;

CREATE TABLE vendor.store_timings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES vendor.stores (id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time   TIME NOT NULL,
  close_time  TIME NOT NULL,
  is_closed   BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (store_id, day_of_week)
);

CREATE TABLE vendor.store_holidays (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES vendor.stores (id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  reason      TEXT NOT NULL DEFAULT '',
  UNIQUE (store_id, holiday_date)
);

CREATE TABLE vendor.vendor_staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   UUID NOT NULL REFERENCES vendor.vendors (id) ON DELETE CASCADE,
  store_id    UUID REFERENCES vendor.stores (id) ON DELETE SET NULL,
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'staff',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vendor_id, user_id)
);

-- ============================================================
-- CATEGORIES (HIERARCHICAL)
-- ============================================================

CREATE TABLE catalog.categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID REFERENCES catalog.categories (id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT NOT NULL DEFAULT '',
  image_url       TEXT,
  service_type    catalog.service_type,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX categories_parent_idx ON catalog.categories (parent_id);
CREATE INDEX categories_service_idx ON catalog.categories (service_type) WHERE is_active = TRUE;

-- ============================================================
-- BRANDS
-- ============================================================

CREATE TABLE catalog.brands (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  logo_url        TEXT,
  description     TEXT NOT NULL DEFAULT '',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE catalog.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID NOT NULL REFERENCES vendor.vendors (id) ON DELETE RESTRICT,
  store_id        UUID REFERENCES vendor.stores (id) ON DELETE SET NULL,
  category_id     UUID REFERENCES catalog.categories (id) ON DELETE SET NULL,
  brand_id        UUID REFERENCES catalog.brands (id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  service_type    catalog.service_type NOT NULL,
  status          catalog.product_status NOT NULL DEFAULT 'draft',
  base_price      NUMERIC(12,2) NOT NULL,
  compare_at_price NUMERIC(12,2),
  cost_price      NUMERIC(12,2),
  tax_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
  hsn_code        TEXT,
  gst_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
  weight_grams    INTEGER,
  length_cm       NUMERIC(8,2),
  width_cm        NUMERIC(8,2),
  height_cm       NUMERIC(8,2),
  is_veg          BOOLEAN,
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count    INTEGER NOT NULL DEFAULT 0,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE (vendor_id, slug)
);

CREATE INDEX products_vendor_idx ON catalog.products (vendor_id) WHERE deleted_at IS NULL;
CREATE INDEX products_store_idx ON catalog.products (store_id) WHERE deleted_at IS NULL;
CREATE INDEX products_category_idx ON catalog.products (category_id) WHERE deleted_at IS NULL;
CREATE INDEX products_service_idx ON catalog.products (service_type, status) WHERE deleted_at IS NULL;
CREATE INDEX products_search_idx ON catalog.products USING gin (to_tsvector('english', name || ' ' || description));

CREATE TABLE catalog.product_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES catalog.products (id) ON DELETE CASCADE,
  sku             TEXT NOT NULL,
  barcode         TEXT,
  name            TEXT NOT NULL DEFAULT '',
  price           NUMERIC(12,2) NOT NULL,
  compare_at_price NUMERIC(12,2),
  weight_grams    INTEGER,
  attributes      JSONB NOT NULL DEFAULT '{}',
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, sku)
);

CREATE INDEX product_variants_product_idx ON catalog.product_variants (product_id);
CREATE INDEX product_variants_sku_idx ON catalog.product_variants (sku);
CREATE INDEX product_variants_barcode_idx ON catalog.product_variants (barcode) WHERE barcode IS NOT NULL;

CREATE TABLE catalog.product_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES catalog.products (id) ON DELETE CASCADE,
  variant_id      UUID REFERENCES catalog.product_variants (id) ON DELETE SET NULL,
  url             TEXT NOT NULL,
  alt_text        TEXT NOT NULL DEFAULT '',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE catalog.product_specifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES catalog.products (id) ON DELETE CASCADE,
  group_name      TEXT NOT NULL DEFAULT 'General',
  spec_key        TEXT NOT NULL,
  spec_value      TEXT NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE catalog.nutritional_info (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES catalog.products (id) ON DELETE CASCADE UNIQUE,
  serving_size    TEXT,
  calories        NUMERIC(8,2),
  protein_g       NUMERIC(8,2),
  carbs_g         NUMERIC(8,2),
  fat_g           NUMERIC(8,2),
  fiber_g         NUMERIC(8,2),
  sodium_mg       NUMERIC(8,2),
  details         JSONB NOT NULL DEFAULT '{}'
);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE catalog.inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id      UUID NOT NULL REFERENCES catalog.product_variants (id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES vendor.stores (id) ON DELETE CASCADE,
  quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved        INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  expiry_date     DATE,
  batch_number    TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (variant_id, store_id, batch_number)
);

CREATE INDEX inventory_variant_idx ON catalog.inventory (variant_id);
CREATE INDEX inventory_store_idx ON catalog.inventory (store_id);
CREATE INDEX inventory_low_stock_idx ON catalog.inventory (store_id)
  WHERE quantity - reserved <= low_stock_threshold;

CREATE TABLE catalog.price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id      UUID NOT NULL REFERENCES catalog.product_variants (id) ON DELETE CASCADE,
  old_price       NUMERIC(12,2) NOT NULL,
  new_price       NUMERIC(12,2) NOT NULL,
  changed_by      UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  reason          TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CUSTOMER ADDRESSES (platform-native)
-- ============================================================

CREATE TABLE catalog.customer_addresses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  label           TEXT NOT NULL DEFAULT 'Home',
  recipient_name  TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  line1           TEXT NOT NULL,
  line2           TEXT NOT NULL DEFAULT '',
  landmark        TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL,
  state           TEXT NOT NULL DEFAULT '',
  pincode         TEXT NOT NULL,
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX customer_addresses_user_idx ON catalog.customer_addresses (user_id);

-- Updated_at triggers
CREATE TRIGGER vendors_updated_at BEFORE UPDATE ON vendor.vendors
  FOR EACH ROW EXECUTE FUNCTION auth.set_updated_at();
CREATE TRIGGER stores_updated_at BEFORE UPDATE ON vendor.stores
  FOR EACH ROW EXECUTE FUNCTION auth.set_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON catalog.products
  FOR EACH ROW EXECUTE FUNCTION auth.set_updated_at();
