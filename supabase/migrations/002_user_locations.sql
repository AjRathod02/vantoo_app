-- Latest known location per user + short history for active deliveries

create table if not exists public.user_locations (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role text not null check (role in ('customer', 'rider', 'vendor', 'admin')),
  latitude numeric not null,
  longitude numeric not null,
  accuracy numeric,
  speed numeric,
  heading numeric,
  altitude numeric,
  online boolean not null default true,
  order_id text,
  city text,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_location_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  latitude numeric not null,
  longitude numeric not null,
  accuracy numeric,
  speed numeric,
  heading numeric,
  order_id text,
  recorded_at timestamptz not null default now()
);

create index if not exists user_locations_role_idx on public.user_locations (role);
create index if not exists user_locations_updated_idx on public.user_locations (updated_at desc);
create index if not exists user_location_history_user_idx on public.user_location_history (user_id, recorded_at desc);

alter table public.user_locations enable row level security;
alter table public.user_location_history enable row level security;

create policy "Users can upsert own location"
  on public.user_locations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert own history"
  on public.user_location_history for insert
  with check (auth.uid() = user_id);

create policy "Users can read own history"
  on public.user_location_history for select
  using (auth.uid() = user_id);
