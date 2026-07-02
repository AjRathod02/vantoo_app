-- Vantoo production schema — run in Supabase SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text default '',
  email text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  line1 text not null,
  line2 text default '',
  city text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  description text not null default '',
  service text not null check (service in ('food', 'grocery', 'medicine', 'ecommerce')),
  category text not null default '',
  brand text not null default '',
  price numeric not null,
  original_price numeric,
  rating numeric not null default 4,
  reviews integer not null default 0,
  image text not null default '',
  vendor_id text,
  unit text,
  in_stock boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid references public.profiles (id) on delete set null,
  items jsonb not null,
  subtotal numeric not null,
  delivery_fee numeric not null default 0,
  tax numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null,
  status text not null default 'confirmed' check (
    status in ('confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled')
  ),
  payment_method text not null,
  payment_status text not null default 'pending' check (
    payment_status in ('pending', 'paid', 'failed', 'refunded')
  ),
  razorpay_order_id text,
  razorpay_payment_id text,
  refund_status text check (refund_status in ('none', 'requested', 'processing', 'completed')),
  refund_amount numeric,
  address jsonb not null,
  service text not null,
  rider_name text,
  rider_phone text,
  rider_lat numeric,
  rider_lng numeric,
  placed_at timestamptz not null default now(),
  cancelled_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists products_service_idx on public.products (service);

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    case
      when new.email ilike '%@admin.%' or new.email = 'admin@vantoo.com' then 'admin'
      else 'customer'
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Addresses
create policy "Users manage own addresses"
  on public.addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Products: public read, admin write
create policy "Anyone can read products"
  on public.products for select
  using (true);

create policy "Admins manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Orders
create policy "Users read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users update own orders (cancel)"
  on public.orders for update
  using (auth.uid() = user_id);

create policy "Admins manage all orders"
  on public.orders for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

alter publication supabase_realtime add table public.orders;
