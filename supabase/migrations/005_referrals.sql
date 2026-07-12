-- Vantoo Refer & Earn — customer referrals + referral wallet

-- ============================================================
-- SETTINGS (singleton)
-- ============================================================

create table if not exists public.referral_settings (
  id text primary key default 'default',
  is_enabled boolean not null default true,
  min_order_amount numeric(12,2) not null default 350,
  commission_percent numeric(6,2) not null default 5,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

insert into public.referral_settings (id)
values ('default')
on conflict (id) do nothing;

-- ============================================================
-- REFERRAL CODES
-- ============================================================

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  code text not null unique,
  is_active boolean not null default true,
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists referral_codes_code_idx
  on public.referral_codes (code)
  where is_active = true;

-- ============================================================
-- REFERRALS (one row per referred user)
-- ============================================================

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete restrict,
  referred_id uuid not null references public.profiles (id) on delete restrict,
  referral_code_id uuid references public.referral_codes (id) on delete set null,
  status text not null default 'signed_up'
    check (status in ('signed_up', 'ordered', 'completed', 'rejected', 'ineligible')),
  first_order_id text,
  first_order_amount numeric(12,2),
  commission_amount numeric(12,2),
  reward_credited_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (referred_id)
);

create index if not exists referrals_referrer_idx
  on public.referrals (referrer_id, created_at desc);
create index if not exists referrals_status_idx
  on public.referrals (status);

-- ============================================================
-- REFERRAL REWARDS (transaction history / commissions)
-- ============================================================

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals (id) on delete cascade,
  referrer_id uuid not null references public.profiles (id) on delete restrict,
  referred_id uuid not null references public.profiles (id) on delete restrict,
  order_id text not null,
  order_amount numeric(12,2) not null,
  commission_percent numeric(6,2) not null,
  commission_amount numeric(12,2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'rejected')),
  credited_at timestamptz,
  rejection_reason text,
  wallet_transaction_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id),
  unique (referral_id)
);

create index if not exists referral_rewards_referrer_idx
  on public.referral_rewards (referrer_id, created_at desc);
create index if not exists referral_rewards_status_idx
  on public.referral_rewards (status);

-- ============================================================
-- REFERRAL WALLET
-- ============================================================

create table if not exists public.referral_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  lifetime_earned numeric(14,2) not null default 0 check (lifetime_earned >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.referral_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.referral_wallets (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  type text not null check (type in ('credit', 'debit')),
  amount numeric(14,2) not null check (amount > 0),
  balance_after numeric(14,2) not null,
  title text not null,
  reference_type text not null default 'referral_reward',
  reference_id text,
  status text not null default 'completed'
    check (status in ('pending', 'completed', 'failed', 'reversed')),
  created_at timestamptz not null default now()
);

create index if not exists referral_wallet_tx_user_idx
  on public.referral_wallet_transactions (user_id, created_at desc);

-- ============================================================
-- USER NOTIFICATIONS (in-app when platform notifications off)
-- ============================================================

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'referral',
  read boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_idx
  on public.user_notifications (user_id, created_at desc);

-- ============================================================
-- RLS
-- ============================================================

alter table public.referral_settings enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.referral_wallets enable row level security;
alter table public.referral_wallet_transactions enable row level security;
alter table public.user_notifications enable row level security;

-- Customers read their own data; writes go through service role / server APIs
drop policy if exists "Users read own referral code" on public.referral_codes;
create policy "Users read own referral code"
  on public.referral_codes for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users read own referrals as referrer" on public.referrals;
create policy "Users read own referrals as referrer"
  on public.referrals for select
  to authenticated
  using ((select auth.uid()) = referrer_id or (select auth.uid()) = referred_id);

drop policy if exists "Users read own referral rewards" on public.referral_rewards;
create policy "Users read own referral rewards"
  on public.referral_rewards for select
  to authenticated
  using ((select auth.uid()) = referrer_id);

drop policy if exists "Users read own referral wallet" on public.referral_wallets;
create policy "Users read own referral wallet"
  on public.referral_wallets for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users read own referral wallet tx" on public.referral_wallet_transactions;
create policy "Users read own referral wallet tx"
  on public.referral_wallet_transactions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users read own notifications" on public.user_notifications;
create policy "Users read own notifications"
  on public.user_notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users update own notifications" on public.user_notifications;
create policy "Users update own notifications"
  on public.user_notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Anyone can read referral settings" on public.referral_settings;
create policy "Anyone can read referral settings"
  on public.referral_settings for select
  to authenticated, anon
  using (true);

-- Grant Data API access
grant select on public.referral_settings to anon, authenticated;
grant select on public.referral_codes to authenticated;
grant select on public.referrals to authenticated;
grant select on public.referral_rewards to authenticated;
grant select on public.referral_wallets to authenticated;
grant select on public.referral_wallet_transactions to authenticated;
grant select, update on public.user_notifications to authenticated;

-- ============================================================
-- Admin permissions for referrals module
-- ============================================================

insert into public.admin_permissions (resource, action, description)
select v.resource, v.action, v.description
from (values
  ('referrals', 'create', 'Create referral records'),
  ('referrals', 'read', 'View referral program and transactions'),
  ('referrals', 'update', 'Update referral settings and approve/reject rewards'),
  ('referrals', 'delete', 'Delete referral records')
) as v(resource, action, description)
where not exists (
  select 1 from public.admin_permissions p
  where p.resource = v.resource and p.action = v.action
);

insert into public.admin_role_permissions (role, permission_id)
select 'super_admin', id from public.admin_permissions
where resource = 'referrals'
on conflict do nothing;

insert into public.admin_role_permissions (role, permission_id)
select 'admin', id from public.admin_permissions
where resource = 'referrals'
on conflict do nothing;

insert into public.admin_role_permissions (role, permission_id)
select 'finance_manager', id from public.admin_permissions
where resource = 'referrals'
on conflict do nothing;

insert into public.admin_role_permissions (role, permission_id)
select 'marketing_manager', id from public.admin_permissions
where resource = 'referrals' and action in ('read', 'update')
on conflict do nothing;

insert into public.admin_role_permissions (role, permission_id)
select 'analyst', id from public.admin_permissions
where resource = 'referrals' and action = 'read'
on conflict do nothing;
