-- Customer OTP, coupons, and product categories (E2E report gaps)

create table if not exists public.customer_otp_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  email text,
  phone text,
  token_hash text not null,
  purpose text not null check (purpose in ('password_reset', 'email_verify', 'phone_verify')),
  channel text not null default 'email' check (channel in ('email', 'sms')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists customer_otp_tokens_email_idx
  on public.customer_otp_tokens (email, purpose) where used_at is null;
create index if not exists customer_otp_tokens_phone_idx
  on public.customer_otp_tokens (phone, purpose) where used_at is null;

alter table public.customer_otp_tokens enable row level security;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null default '',
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  min_order_amount numeric(10, 2) not null default 0,
  max_discount numeric(10, 2),
  max_uses integer,
  used_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  service text check (service is null or service in ('food', 'grocery', 'medicine', 'ecommerce')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coupons_code_active_idx on public.coupons (code) where is_active = true;

alter table public.coupons enable row level security;

drop policy if exists "Public read active coupons" on public.coupons;
create policy "Public read active coupons"
  on public.coupons for select to anon, authenticated
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at > now())
  );

grant select on public.coupons to anon, authenticated;

create table if not exists public.product_categories (
  id text primary key,
  name text not null,
  service text not null check (service in ('food', 'grocery', 'medicine', 'ecommerce')),
  icon text not null default 'Tag',
  image text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_categories_service_idx
  on public.product_categories (service, sort_order) where is_active = true;

alter table public.product_categories enable row level security;

drop policy if exists "Public read active categories" on public.product_categories;
create policy "Public read active categories"
  on public.product_categories for select to anon, authenticated
  using (is_active = true);

grant select on public.product_categories to anon, authenticated;

-- Seed default coupons (idempotent)
insert into public.coupons (code, description, discount_type, discount_value, min_order_amount, max_discount)
select * from (values
  ('SAVE10', '10% off your order', 'percent', 10::numeric, 0::numeric, null::numeric),
  ('VANTOO20', '20% off your order', 'percent', 20::numeric, 199::numeric, 200::numeric)
) as v(code, description, discount_type, discount_value, min_order_amount, max_discount)
where not exists (select 1 from public.coupons where code = v.code);

-- Seed categories from legacy static catalog
insert into public.product_categories (id, name, service, icon, image, sort_order)
select * from (values
  ('c-pizza', 'Pizza', 'food', 'Pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', 1),
  ('c-burger', 'Burgers', 'food', 'Beef', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', 2),
  ('c-biryani', 'Biryani', 'food', 'UtensilsCrossed', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', 3),
  ('c-dessert', 'Desserts', 'food', 'IceCream', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80', 4),
  ('c-drinks', 'Beverages', 'food', 'CupSoda', 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80', 5),
  ('c-fruits', 'Fruits', 'grocery', 'Apple', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80', 1),
  ('c-vegetables', 'Vegetables', 'grocery', 'Carrot', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80', 2),
  ('c-dairy', 'Dairy', 'grocery', 'Milk', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80', 3),
  ('c-snacks', 'Snacks', 'grocery', 'Cookie', 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80', 4),
  ('c-painrelief', 'Pain Relief', 'medicine', 'Pill', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', 1),
  ('c-vitamins', 'Vitamins', 'medicine', 'Tablets', 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&q=80', 2),
  ('c-firstaid', 'First Aid', 'medicine', 'BriefcaseMedical', 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&q=80', 3),
  ('c-fashion', 'Fashion', 'ecommerce', 'Shirt', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80', 1),
  ('c-footwear', 'Footwear', 'ecommerce', 'Footprints', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', 2),
  ('c-electronics', 'Electronics', 'ecommerce', 'Smartphone', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80', 3),
  ('c-home', 'Home', 'ecommerce', 'Lamp', 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80', 4)
) as v(id, name, service, icon, image, sort_order)
on conflict (id) do nothing;
