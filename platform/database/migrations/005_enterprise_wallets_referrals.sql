-- Vantoo Platform — Wallets & Referral Schema
-- Migration: 005_enterprise_wallets_referrals.sql
-- Schema: wallet, referral

CREATE SCHEMA IF NOT EXISTS wallet;
CREATE SCHEMA IF NOT EXISTS referral;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE wallet.wallet_type AS ENUM (
  'customer', 'vendor', 'rider', 'referral', 'refund', 'reward', 'cashback'
);

CREATE TYPE wallet.wallet_status AS ENUM ('active', 'frozen', 'closed');
CREATE TYPE wallet.transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE wallet.transaction_status AS ENUM ('pending', 'completed', 'failed', 'reversed');
CREATE TYPE wallet.withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'rejected', 'failed');

CREATE TYPE referral.commission_type AS ENUM ('percentage', 'fixed');
CREATE TYPE referral.commission_status AS ENUM ('pending', 'approved', 'paid', 'expired', 'cancelled');

-- ============================================================
-- WALLETS (Double-Entry Ledger)
-- ============================================================

CREATE TABLE wallet.wallets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  wallet_type     wallet.wallet_type NOT NULL,
  balance         NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  frozen_amount   NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (frozen_amount >= 0),
  currency        TEXT NOT NULL DEFAULT 'INR',
  status          wallet.wallet_status NOT NULL DEFAULT 'active',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, wallet_type)
);

CREATE INDEX wallets_user_idx ON wallet.wallets (user_id);

CREATE TABLE wallet.wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       UUID NOT NULL REFERENCES wallet.wallets (id) ON DELETE RESTRICT,
  type            wallet.transaction_type NOT NULL,
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  balance_after   NUMERIC(14,2) NOT NULL,
  status          wallet.transaction_status NOT NULL DEFAULT 'pending',
  reference_type  TEXT NOT NULL,
  reference_id    TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  idempotency_key TEXT UNIQUE,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX wallet_transactions_wallet_idx ON wallet.wallet_transactions (wallet_id, created_at DESC);
CREATE INDEX wallet_transactions_reference_idx ON wallet.wallet_transactions (reference_type, reference_id);

-- Immutable ledger entries for audit
CREATE TABLE wallet.wallet_ledger_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID NOT NULL REFERENCES wallet.wallet_transactions (id) ON DELETE RESTRICT,
  wallet_id       UUID NOT NULL REFERENCES wallet.wallets (id) ON DELETE RESTRICT,
  entry_type      wallet.transaction_type NOT NULL,
  amount          NUMERIC(14,2) NOT NULL,
  running_balance NUMERIC(14,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX wallet_ledger_wallet_idx ON wallet.wallet_ledger_entries (wallet_id, created_at DESC);

CREATE TABLE wallet.withdrawal_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       UUID NOT NULL REFERENCES wallet.wallets (id) ON DELETE RESTRICT,
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  status          wallet.withdrawal_status NOT NULL DEFAULT 'pending',
  bank_details    JSONB NOT NULL,
  processed_at    TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX withdrawal_requests_user_idx ON wallet.withdrawal_requests (user_id, created_at DESC);

-- ============================================================
-- REFERRAL ENGINE (Fully Configurable)
-- ============================================================

CREATE TABLE referral.referral_programs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  max_levels      INTEGER NOT NULL DEFAULT 1 CHECK (max_levels >= 1),
  min_order_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_commission_per_order NUMERIC(12,2),
  commission_expiry_days INTEGER,
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE referral.referral_levels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES referral.referral_programs (id) ON DELETE CASCADE,
  level           INTEGER NOT NULL CHECK (level >= 1),
  commission_type referral.commission_type NOT NULL,
  commission_value NUMERIC(12,2) NOT NULL,
  min_order_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_commission  NUMERIC(12,2),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (program_id, level)
);

CREATE TABLE referral.referral_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  program_id      UUID NOT NULL REFERENCES referral.referral_programs (id) ON DELETE RESTRICT,
  code            TEXT NOT NULL UNIQUE,
  invite_link     TEXT NOT NULL,
  usage_count     INTEGER NOT NULL DEFAULT 0,
  max_uses        INTEGER,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX referral_codes_user_idx ON referral.referral_codes (user_id);
CREATE INDEX referral_codes_code_idx ON referral.referral_codes (code) WHERE is_active = TRUE;

CREATE TABLE referral.referral_tree (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES referral.referral_programs (id) ON DELETE RESTRICT,
  referrer_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  referred_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  level           INTEGER NOT NULL DEFAULT 1,
  referral_code_id UUID REFERENCES referral.referral_codes (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, referred_id)
);

CREATE INDEX referral_tree_referrer_idx ON referral.referral_tree (referrer_id, program_id);
CREATE INDEX referral_tree_referred_idx ON referral.referral_tree (referred_id);

CREATE TABLE referral.referral_commissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES referral.referral_programs (id) ON DELETE RESTRICT,
  referrer_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  referred_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  order_id        UUID REFERENCES orders.orders (id) ON DELETE SET NULL,
  level           INTEGER NOT NULL,
  commission_type referral.commission_type NOT NULL,
  commission_value NUMERIC(12,2) NOT NULL,
  order_amount    NUMERIC(12,2) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  status          referral.commission_status NOT NULL DEFAULT 'pending',
  wallet_transaction_id UUID REFERENCES wallet.wallet_transactions (id) ON DELETE SET NULL,
  expires_at      TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX referral_commissions_referrer_idx ON referral.referral_commissions (referrer_id, status);
CREATE INDEX referral_commissions_order_idx ON referral.referral_commissions (order_id);

CREATE TABLE referral.referral_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES referral.referral_programs (id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  bonus_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonus_type      referral.commission_type NOT NULL DEFAULT 'fixed',
  target_audience JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration tracking table
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  id          SERIAL PRIMARY KEY,
  filename    TEXT NOT NULL UNIQUE,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
