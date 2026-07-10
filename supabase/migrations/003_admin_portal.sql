-- Vantoo Admin Portal — dedicated auth, RBAC, audit, support
-- Run after 001_initial_schema.sql and 002_user_locations.sql

-- ============================================================
-- ADMIN USERS (separate from customer/vendor/rider profiles)
-- ============================================================

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null default '',
  phone text default '',
  role text not null default 'admin' check (
    role in (
      'super_admin',
      'admin',
      'support_manager',
      'operations_manager',
      'finance_manager',
      'inventory_manager',
      'marketing_manager',
      'analyst'
    )
  ),
  status text not null default 'active' check (
    status in ('active', 'inactive', 'suspended', 'blocked')
  ),
  two_factor_enabled boolean not null default false,
  two_factor_secret text,
  failed_login_attempts integer not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  last_login_ip inet,
  password_changed_at timestamptz not null default now(),
  created_by uuid references public.admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_users_email_idx on public.admin_users (email);
create index if not exists admin_users_role_idx on public.admin_users (role);
create index if not exists admin_users_status_idx on public.admin_users (status);

-- ============================================================
-- ADMIN SESSIONS & REFRESH TOKENS
-- ============================================================

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_users (id) on delete cascade,
  refresh_token_hash text not null unique,
  device_name text not null default 'Unknown',
  browser text default '',
  platform text default 'web',
  ip_address inet,
  user_agent text,
  is_active boolean not null default true,
  last_active_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_sessions_admin_idx on public.admin_sessions (admin_id) where is_active = true;

-- ============================================================
-- LOGIN HISTORY
-- ============================================================

create table if not exists public.admin_login_history (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_users (id) on delete cascade,
  session_id uuid references public.admin_sessions (id) on delete set null,
  ip_address inet,
  device_name text default '',
  browser text default '',
  platform text default 'web',
  user_agent text,
  login_at timestamptz not null default now(),
  logout_at timestamptz,
  success boolean not null default true,
  failure_reason text
);

create index if not exists admin_login_history_admin_idx on public.admin_login_history (admin_id, login_at desc);

-- ============================================================
-- RBAC PERMISSIONS
-- ============================================================

create table if not exists public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  resource text not null,
  action text not null check (action in ('create', 'read', 'update', 'delete')),
  description text not null default '',
  created_at timestamptz not null default now(),
  unique (resource, action)
);

create table if not exists public.admin_role_permissions (
  role text not null,
  permission_id uuid not null references public.admin_permissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role, permission_id)
);

-- ============================================================
-- OTP TOKENS (password reset, 2FA)
-- ============================================================

create table if not exists public.admin_otp_tokens (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_users (id) on delete cascade,
  token_hash text not null,
  purpose text not null check (purpose in ('password_reset', 'two_factor', 'email_verify')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_otp_admin_purpose_idx on public.admin_otp_tokens (admin_id, purpose) where used_at is null;

-- ============================================================
-- AUDIT & ACTIVITY LOGS
-- ============================================================

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_users (id) on delete set null,
  admin_email text,
  action text not null,
  resource text not null,
  resource_id text,
  details jsonb not null default '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_resource_idx on public.admin_audit_logs (resource, resource_id);

-- ============================================================
-- SUPPORT TICKETS / COMPLAINTS
-- ============================================================

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  user_id uuid references public.profiles (id) on delete set null,
  user_type text not null check (user_type in ('customer', 'vendor', 'rider')),
  user_name text not null default '',
  user_email text default '',
  user_phone text default '',
  category text not null check (
    category in (
      'payment', 'refund', 'delivery', 'product_quality',
      'vendor', 'rider', 'technical', 'account', 'other'
    )
  ),
  priority text not null default 'medium' check (
    priority in ('low', 'medium', 'high', 'critical')
  ),
  subject text not null,
  description text not null default '',
  status text not null default 'open' check (
    status in ('open', 'assigned', 'in_progress', 'resolved', 'closed', 'escalated')
  ),
  assigned_to uuid references public.admin_users (id) on delete set null,
  order_id text,
  attachments jsonb not null default '[]',
  internal_notes jsonb not null default '[]',
  resolution text default '',
  satisfaction_rating integer check (satisfaction_rating between 1 and 5),
  sla_deadline timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_status_idx on public.support_tickets (status);
create index if not exists support_tickets_priority_idx on public.support_tickets (priority);

-- ============================================================
-- CANCELLATION POLICIES
-- ============================================================

create table if not exists public.cancellation_policies (
  id uuid primary key default gen_random_uuid(),
  user_type text not null check (user_type in ('customer', 'vendor', 'rider')),
  free_cancellation_minutes integer not null default 5,
  cancellation_charge_percent numeric not null default 0,
  refund_percent numeric not null default 100,
  penalty_amount numeric not null default 0,
  is_active boolean not null default true,
  updated_by uuid references public.admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_type)
);

-- ============================================================
-- NOTIFICATION LOG
-- ============================================================

create table if not exists public.admin_notification_logs (
  id uuid primary key default gen_random_uuid(),
  sent_by uuid references public.admin_users (id) on delete set null,
  channel text not null check (channel in ('push', 'email', 'sms')),
  target_type text not null check (
    target_type in ('all', 'customers', 'vendors', 'riders', 'city', 'users')
  ),
  target_filter jsonb not null default '{}',
  title text not null,
  body text not null default '',
  recipient_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SEED PERMISSIONS
-- ============================================================

insert into public.admin_permissions (resource, action, description) values
  ('dashboard', 'read', 'View admin dashboard'),
  ('customers', 'create', 'Create customers'),
  ('customers', 'read', 'View customers'),
  ('customers', 'update', 'Edit customers'),
  ('customers', 'delete', 'Delete customers'),
  ('vendors', 'create', 'Create vendors'),
  ('vendors', 'read', 'View vendors'),
  ('vendors', 'update', 'Edit vendors'),
  ('vendors', 'delete', 'Delete vendors'),
  ('riders', 'create', 'Create riders'),
  ('riders', 'read', 'View riders'),
  ('riders', 'update', 'Edit riders'),
  ('riders', 'delete', 'Delete riders'),
  ('products', 'create', 'Create products'),
  ('products', 'read', 'View products'),
  ('products', 'update', 'Edit products'),
  ('products', 'delete', 'Delete products'),
  ('orders', 'create', 'Create orders'),
  ('orders', 'read', 'View orders'),
  ('orders', 'update', 'Edit orders'),
  ('orders', 'delete', 'Delete orders'),
  ('refunds', 'create', 'Create refunds'),
  ('refunds', 'read', 'View refunds'),
  ('refunds', 'update', 'Process refunds'),
  ('refunds', 'delete', 'Delete refunds'),
  ('payments', 'read', 'View payments'),
  ('payments', 'update', 'Manage payments'),
  ('complaints', 'create', 'Create tickets'),
  ('complaints', 'read', 'View tickets'),
  ('complaints', 'update', 'Manage tickets'),
  ('complaints', 'delete', 'Delete tickets'),
  ('notifications', 'create', 'Send notifications'),
  ('notifications', 'read', 'View notifications'),
  ('reports', 'read', 'View reports'),
  ('reports', 'create', 'Generate reports'),
  ('tracking', 'read', 'View live tracking'),
  ('tracking', 'update', 'Manage tracking'),
  ('settings', 'read', 'View settings'),
  ('settings', 'update', 'Manage settings'),
  ('admin_users', 'create', 'Create admin users'),
  ('admin_users', 'read', 'View admin users'),
  ('admin_users', 'update', 'Edit admin users'),
  ('admin_users', 'delete', 'Delete admin users'),
  ('audit_logs', 'read', 'View audit logs')
on conflict (resource, action) do nothing;

-- Super admin: all permissions
insert into public.admin_role_permissions (role, permission_id)
select 'super_admin', id from public.admin_permissions
on conflict do nothing;

-- Admin: all except admin_users delete
insert into public.admin_role_permissions (role, permission_id)
select 'admin', id from public.admin_permissions
where not (resource = 'admin_users' and action = 'delete')
on conflict do nothing;

-- Support manager
insert into public.admin_role_permissions (role, permission_id)
select 'support_manager', id from public.admin_permissions
where resource in ('dashboard', 'complaints', 'refunds', 'orders', 'customers', 'reports')
on conflict do nothing;

-- Operations manager
insert into public.admin_role_permissions (role, permission_id)
select 'operations_manager', id from public.admin_permissions
where resource in ('dashboard', 'vendors', 'riders', 'orders', 'products', 'tracking', 'reports')
on conflict do nothing;

-- Finance manager
insert into public.admin_role_permissions (role, permission_id)
select 'finance_manager', id from public.admin_permissions
where resource in ('dashboard', 'payments', 'refunds', 'orders', 'reports')
on conflict do nothing;

-- Inventory manager
insert into public.admin_role_permissions (role, permission_id)
select 'inventory_manager', id from public.admin_permissions
where resource in ('dashboard', 'products', 'reports')
on conflict do nothing;

-- Marketing manager
insert into public.admin_role_permissions (role, permission_id)
select 'marketing_manager', id from public.admin_permissions
where resource in ('dashboard', 'products', 'notifications', 'reports')
on conflict do nothing;

-- Analyst: read-only
insert into public.admin_role_permissions (role, permission_id)
select 'analyst', id from public.admin_permissions
where action = 'read'
on conflict do nothing;

-- Default cancellation policies
insert into public.cancellation_policies (user_type, free_cancellation_minutes, cancellation_charge_percent, refund_percent)
values
  ('customer', 5, 10, 90),
  ('vendor', 0, 0, 0),
  ('rider', 0, 0, 0)
on conflict (user_type) do nothing;

-- RLS: admin tables accessible only via service role (Next.js admin API)
alter table public.admin_users enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.admin_login_history enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.admin_otp_tokens enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.support_tickets enable row level security;
alter table public.cancellation_policies enable row level security;
alter table public.admin_notification_logs enable row level security;
