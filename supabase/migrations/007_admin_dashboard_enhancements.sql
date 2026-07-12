-- Admin dashboard enhancements: customer status, product attributes, reviews moderation, report audit

-- ============================================================
-- PROFILES: account management fields
-- ============================================================

alter table public.profiles
  add column if not exists avatar_url text default '',
  add column if not exists gender text default '',
  add column if not exists account_status text not null default 'active',
  add column if not exists email_verified boolean not null default false,
  add column if not exists phone_verified boolean not null default false,
  add column if not exists last_login_at timestamptz,
  add column if not exists referral_code text default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_account_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_account_status_check
      check (account_status in ('active', 'suspended', 'blocked', 'deleted'));
  end if;
end $$;

create index if not exists profiles_account_status_idx
  on public.profiles (account_status);

create index if not exists profiles_referral_code_idx
  on public.profiles (referral_code)
  where referral_code is not null and referral_code <> '';

-- ============================================================
-- ADDRESSES: state field
-- ============================================================

alter table public.addresses
  add column if not exists state text default '';

-- ============================================================
-- PRODUCTS: category-specific attributes + media
-- ============================================================

alter table public.products
  add column if not exists attributes jsonb not null default '{}',
  add column if not exists thumbnail_index integer not null default 0;

-- Ensure images/videos columns exist (from 006)
alter table public.products
  add column if not exists images jsonb not null default '[]',
  add column if not exists videos jsonb not null default '[]';

-- ============================================================
-- PRODUCT REVIEWS: moderation status
-- ============================================================

alter table public.product_reviews
  add column if not exists moderation_status text not null default 'published',
  add column if not exists review_type text not null default 'product',
  add column if not exists target_id text default '',
  add column if not exists reviewer_name text default '',
  add column if not exists hidden_at timestamptz,
  add column if not exists deleted_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_reviews_moderation_status_check'
  ) then
    alter table public.product_reviews
      add constraint product_reviews_moderation_status_check
      check (moderation_status in ('published', 'hidden', 'deleted', 'pending'));
  end if;
end $$;

create index if not exists product_reviews_moderation_idx
  on public.product_reviews (moderation_status, created_at desc);

-- ============================================================
-- REPORT GENERATION AUDIT
-- ============================================================

create table if not exists public.admin_report_exports (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  admin_email text not null default '',
  report_type text not null,
  format text not null check (format in ('csv', 'xlsx', 'pdf')),
  date_from timestamptz,
  date_to timestamptz,
  filters jsonb not null default '{}',
  row_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists admin_report_exports_created_idx
  on public.admin_report_exports (created_at desc);

-- ============================================================
-- SCHEDULED REPORTS
-- ============================================================

create table if not exists public.admin_scheduled_reports (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  report_type text not null,
  format text not null default 'csv' check (format in ('csv', 'xlsx', 'pdf')),
  cadence text not null default 'weekly' check (cadence in ('daily', 'weekly', 'monthly')),
  email_to text not null default '',
  date_range_days integer not null default 7,
  is_active boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);

-- Reviews permissions
insert into public.admin_permissions (resource, action, description) values
  ('reviews', 'read', 'View reviews'),
  ('reviews', 'update', 'Moderate reviews'),
  ('reviews', 'delete', 'Delete reviews')
on conflict (resource, action) do nothing;

insert into public.admin_role_permissions (role, permission_id)
select 'super_admin', id from public.admin_permissions where resource = 'reviews'
on conflict do nothing;

insert into public.admin_role_permissions (role, permission_id)
select 'admin', id from public.admin_permissions where resource = 'reviews'
on conflict do nothing;

insert into public.admin_role_permissions (role, permission_id)
select 'support_manager', id from public.admin_permissions where resource = 'reviews'
on conflict do nothing;

insert into public.admin_role_permissions (role, permission_id)
select 'marketing_manager', id from public.admin_permissions where resource = 'reviews'
on conflict do nothing;

insert into public.admin_role_permissions (role, permission_id)
select 'analyst', id from public.admin_permissions where resource = 'reviews' and action = 'read'
on conflict do nothing;
