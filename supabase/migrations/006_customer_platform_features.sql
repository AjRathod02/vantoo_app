-- Vantoo customer platform features: support, reviews, sponsorships, blog, payments, DOB

-- ============================================================
-- PROFILES: date of birth
-- ============================================================

alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists dob_updated_at timestamptz,
  add column if not exists dob_change_count integer not null default 0;

-- ============================================================
-- SUPPORT: enhance tickets + replies + FAQs
-- ============================================================

alter table public.support_tickets
  add column if not exists ticket_kind text not null default 'complaint',
  add column if not exists resolution_due_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'support_tickets_ticket_kind_check'
  ) then
    alter table public.support_tickets
      add constraint support_tickets_ticket_kind_check
      check (ticket_kind in ('complaint', 'help'));
  end if;
end $$;

-- Expand ticket categories for customer complaints / help
alter table public.support_tickets drop constraint if exists support_tickets_category_check;
alter table public.support_tickets
  add constraint support_tickets_category_check check (
    category in (
      'payment', 'refund', 'delivery', 'product_quality',
      'vendor', 'rider', 'technical', 'account', 'other',
      'orders', 'general', 'returns', 'wallet', 'coupons', 'product'
    )
  );

create table if not exists public.support_ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_type text not null check (author_type in ('customer', 'admin', 'system')),
  author_id uuid,
  author_name text not null default '',
  body text not null,
  attachments jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists support_ticket_replies_ticket_idx
  on public.support_ticket_replies (ticket_id, created_at);

create table if not exists public.help_faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists help_faqs_category_idx on public.help_faqs (category, sort_order);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  phone text default '',
  subject text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.app_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  guest_id text,
  rating integer not null check (rating between 1 and 5),
  feedback text default '',
  created_at timestamptz not null default now()
);

-- ============================================================
-- PRODUCT REVIEWS + EXTENDED PRODUCT DETAILS
-- ============================================================

alter table public.products
  add column if not exists images jsonb not null default '[]',
  add column if not exists videos jsonb not null default '[]',
  add column if not exists ingredients text default '',
  add column if not exists nutrition_info jsonb not null default '{}',
  add column if not exists expiry_info text default '',
  add column if not exists storage_instructions text default '',
  add column if not exists country_of_origin text default '',
  add column if not exists manufacturer text default '',
  add column if not exists sku text default '',
  add column if not exists weight_size text default '';

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  order_id text,
  rating integer not null check (rating between 1 and 5),
  title text default '',
  body text not null default '',
  images jsonb not null default '[]',
  videos jsonb not null default '[]',
  verified_purchase boolean not null default false,
  helpful_count integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists product_reviews_product_idx
  on public.product_reviews (product_id, created_at desc);

create table if not exists public.product_review_votes (
  review_id uuid not null references public.product_reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  helpful boolean not null default true,
  primary key (review_id, user_id)
);

-- ============================================================
-- ORDER STATUS HISTORY (customer timeline)
-- ============================================================

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  status text not null,
  label text not null default '',
  note text default '',
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx
  on public.order_status_history (order_id, created_at);

-- ============================================================
-- RESTAURANT SPONSORSHIPS + FLASH OFFERS
-- ============================================================

create table if not exists public.sponsorship_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(12,2) not null,
  duration_days integer not null default 7,
  placement text not null default 'homepage',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_sponsorships (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null,
  restaurant_name text not null default '',
  package_id uuid references public.sponsorship_packages (id) on delete set null,
  vendor_id uuid,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'active', 'expired', 'rejected')),
  starts_at timestamptz,
  ends_at timestamptz,
  amount_paid numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restaurant_sponsorships_active_idx
  on public.restaurant_sponsorships (status, starts_at, ends_at);

create table if not exists public.restaurant_flash_offers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null,
  restaurant_name text not null default '',
  title text not null,
  subtitle text default '',
  offer_type text not null default 'percent_off'
    check (offer_type in (
      'percent_off', 'bogo', 'free_delivery', 'happy_hour',
      'lunch_combo', 'dinner_special', 'custom'
    )),
  badge_text text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists restaurant_flash_offers_active_idx
  on public.restaurant_flash_offers (restaurant_id, ends_at)
  where is_active = true;

-- ============================================================
-- BLOG & VIDEOS
-- ============================================================

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  cover_image text default '',
  video_url text default '',
  category text not null default 'updates',
  content_type text not null default 'article'
    check (content_type in ('article', 'video')),
  author_name text not null default 'Vantoo Team',
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists blog_posts_category_idx on public.blog_posts (category, published_at desc);

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  body text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SAVED PAYMENT METHODS (tokenized only)
-- ============================================================

create table if not exists public.saved_payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('upi', 'card')),
  label text not null default '',
  -- UPI
  upi_id text,
  -- Card (tokenized — never store PAN/CVV)
  razorpay_token_id text,
  card_last4 text,
  card_network text,
  card_expiry text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_payment_methods_user_idx
  on public.saved_payment_methods (user_id, created_at desc);

-- ============================================================
-- SEARCH HISTORY
-- ============================================================

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  guest_id text,
  query text not null,
  created_at timestamptz not null default now()
);

create index if not exists search_history_user_idx
  on public.search_history (user_id, created_at desc);

-- ============================================================
-- RLS
-- ============================================================

alter table public.support_ticket_replies enable row level security;
alter table public.help_faqs enable row level security;
alter table public.contact_messages enable row level security;
alter table public.app_ratings enable row level security;
alter table public.product_reviews enable row level security;
alter table public.product_review_votes enable row level security;
alter table public.order_status_history enable row level security;
alter table public.sponsorship_packages enable row level security;
alter table public.restaurant_sponsorships enable row level security;
alter table public.restaurant_flash_offers enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_comments enable row level security;
alter table public.saved_payment_methods enable row level security;
alter table public.search_history enable row level security;

drop policy if exists "Public read published faqs" on public.help_faqs;
create policy "Public read published faqs"
  on public.help_faqs for select to anon, authenticated
  using (is_published = true);

drop policy if exists "Public read published reviews" on public.product_reviews;
create policy "Public read published reviews"
  on public.product_reviews for select to anon, authenticated
  using (is_published = true);

drop policy if exists "Users manage own reviews" on public.product_reviews;
create policy "Users manage own reviews"
  on public.product_reviews for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Public read blog posts" on public.blog_posts;
create policy "Public read blog posts"
  on public.blog_posts for select to anon, authenticated
  using (is_published = true);

drop policy if exists "Public read blog comments" on public.blog_comments;
create policy "Public read blog comments"
  on public.blog_comments for select to anon, authenticated
  using (is_published = true);

drop policy if exists "Public read active flash offers" on public.restaurant_flash_offers;
create policy "Public read active flash offers"
  on public.restaurant_flash_offers for select to anon, authenticated
  using (is_active = true and ends_at > now());

drop policy if exists "Public read sponsorship packages" on public.sponsorship_packages;
create policy "Public read sponsorship packages"
  on public.sponsorship_packages for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Public read active sponsorships" on public.restaurant_sponsorships;
create policy "Public read active sponsorships"
  on public.restaurant_sponsorships for select to anon, authenticated
  using (status = 'active' and starts_at <= now() and ends_at >= now());

drop policy if exists "Users manage own saved payments" on public.saved_payment_methods;
create policy "Users manage own saved payments"
  on public.saved_payment_methods for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users read own tickets" on public.support_tickets;
create policy "Users read own tickets"
  on public.support_tickets for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own search history" on public.search_history;
create policy "Users manage own search history"
  on public.search_history for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select on public.help_faqs to anon, authenticated;
grant select on public.product_reviews to anon, authenticated;
grant select, insert, update, delete on public.product_reviews to authenticated;
grant select on public.blog_posts to anon, authenticated;
grant select on public.blog_comments to anon, authenticated;
grant select on public.restaurant_flash_offers to anon, authenticated;
grant select on public.sponsorship_packages to anon, authenticated;
grant select on public.restaurant_sponsorships to anon, authenticated;
grant select, insert, update, delete on public.saved_payment_methods to authenticated;
grant select on public.support_tickets to authenticated;
grant select, insert, delete on public.search_history to authenticated;

-- ============================================================
-- SEEDS
-- ============================================================

insert into public.sponsorship_packages (name, description, price, duration_days, placement)
select * from (values
  ('Homepage Spotlight', 'Featured in Sponsored Restaurants on homepage', 4999::numeric, 7, 'homepage'),
  ('Premium Week', 'Top carousel + sponsored badge for 14 days', 8999::numeric, 14, 'homepage'),
  ('Monthly Dominator', 'Premium placement for 30 days', 24999::numeric, 30, 'homepage')
) as v(name, description, price, duration_days, placement)
where not exists (select 1 from public.sponsorship_packages limit 1);

insert into public.help_faqs (category, question, answer, sort_order)
select * from (values
  ('orders', 'How do I track my order?', 'Open My Orders, select your order, and tap Track Order for live status and map tracking.', 1),
  ('orders', 'Can I cancel my order?', 'Yes, you can cancel before the order is out for delivery from the order details page. Cancellation charges may apply per our policy.', 2),
  ('payments', 'Which payment methods are accepted?', 'UPI, cards, netbanking, COD, and wallet balance (where available).', 1),
  ('payments', 'My payment failed but money was deducted. What now?', 'Failed payments are usually auto-refunded in 3–7 business days. Raise a complaint under Payments with your Payment ID.', 2),
  ('refunds', 'How long do refunds take?', 'Approved refunds typically credit within 5–7 business days depending on your bank.', 1),
  ('delivery', 'What if my rider is delayed?', 'Check live tracking for ETA. If significantly delayed, raise a Delivery complaint from Help Center.', 1),
  ('account', 'How do I update my profile?', 'Go to Profile to edit your name, phone, and date of birth (limited changes).', 1),
  ('wallet', 'How do referral earnings work?', 'Invite friends from Refer & Earn. When they place an eligible first order and it is delivered, commission credits to your referral wallet.', 1),
  ('coupons', 'Why is my coupon not applying?', 'Coupons have minimum order values and expiry. Remove conflicting offers and retry.', 1),
  ('returns', 'How do I return a damaged product?', 'Open the order, choose Return/Refund, upload photos, and submit. Our team reviews within 24–48 hours.', 1),
  ('technical', 'The app is not loading. What should I do?', 'Clear cache, update the app/browser, and retry. If it persists, create a Technical Support ticket.', 1),
  ('product', 'Where can I find ingredients and nutrition info?', 'Open the product details page — ingredients, nutrition, storage, and manufacturer details are listed below the description.', 1)
) as v(category, question, answer, sort_order)
where not exists (select 1 from public.help_faqs limit 1);

insert into public.blog_posts (slug, title, excerpt, content, cover_image, category, content_type, author_name)
select * from (values
  (
    'welcome-to-vantoo',
    'Welcome to Vantoo — Your Everyday Super App',
    'Food, groceries, medicine, and shopping in one place.',
    E'Vantoo brings local commerce together with fast delivery, secure payments, and live tracking.\n\nWhether you need dinner tonight or weekly groceries, we are building a platform that is transparent for customers and fair for partners.',
    'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=1200&q=80',
    'updates',
    'article',
    'Vantoo Team'
  ),
  (
    'how-live-tracking-works',
    'How Live Order Tracking Works',
    'Follow your rider in real time from kitchen to doorstep.',
    E'Every order moves through clear stages — confirmed, preparing, packed, assigned, picked up, out for delivery, and delivered. Open Track Order anytime to see timestamps and map updates.',
    'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80',
    'delivery',
    'article',
    'Vantoo Ops'
  ),
  (
    'grocery-tips-fresh-produce',
    '5 Tips for Fresher Groceries',
    'Simple habits that keep your produce fresher longer.',
    E'1. Store leafy greens with a paper towel.\n2. Keep bananas separate from other fruit.\n3. Refrigerate dairy immediately.\n4. Use FIFO — first in, first out.\n5. Check expiry dates on the product page before ordering.',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
    'tips',
    'article',
    'Vantoo Kitchen'
  ),
  (
    'safety-guidelines-delivery',
    'Delivery Safety Guidelines',
    'How we keep customers, riders, and vendors safe.',
    E'Contactless delivery is available on request. Riders follow traffic rules and package handling standards. Report safety concerns instantly from Help Center.',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80',
    'safety',
    'article',
    'Vantoo Trust'
  ),
  (
    'refer-earn-explained',
    'Refer & Earn Explained',
    'Invite friends and earn on their first eligible order.',
    E'Share your referral code from Refer & Earn. When a new friend places their first delivered order of ₹350+, you earn commission in your referral wallet.',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
    'features',
    'article',
    'Vantoo Growth'
  ),
  (
    'vantoo-promo-video',
    'Inside a Day at Vantoo',
    'A short look at how orders move across the city.',
    E'Watch how restaurants, dark stores, and riders coordinate to deliver on time.',
    'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=1200&q=80',
    'promotional',
    'video',
    'Vantoo Studio'
  )
) as v(slug, title, excerpt, content, cover_image, category, content_type, author_name)
where not exists (select 1 from public.blog_posts limit 1);

-- Seed active sponsorships for demo restaurants
insert into public.restaurant_sponsorships (restaurant_id, restaurant_name, status, starts_at, ends_at, amount_paid)
select * from (values
  ('r-1', 'Pizza Palace', 'active', now() - interval '1 day', now() + interval '6 days', 4999::numeric),
  ('r-3', 'Biryani House', 'active', now() - interval '1 day', now() + interval '13 days', 8999::numeric),
  ('r-10', 'Sushi Zen', 'active', now() - interval '2 days', now() + interval '5 days', 4999::numeric)
) as v(restaurant_id, restaurant_name, status, starts_at, ends_at, amount_paid)
where not exists (select 1 from public.restaurant_sponsorships limit 1);

insert into public.restaurant_flash_offers (restaurant_id, restaurant_name, title, subtitle, offer_type, badge_text, starts_at, ends_at)
select * from (values
  ('r-1', 'Pizza Palace', '20% OFF Today', 'On all pizzas above ₹299', 'percent_off', '20% OFF Today', now(), now() + interval '8 hours'),
  ('r-2', 'Burger Hub', 'Buy 1 Get 1 Free', 'Selected burgers only', 'bogo', 'BOGO', now(), now() + interval '12 hours'),
  ('r-5', 'Green Bowl', 'Free Delivery', 'No delivery fee on bowls', 'free_delivery', 'Free Delivery', now(), now() + interval '6 hours'),
  ('r-6', 'Spice Route', 'Happy Hour', '15% off 4–7 PM', 'happy_hour', 'Happy Hour', now(), now() + interval '3 hours'),
  ('r-11', 'Dosa Corner', 'Lunch Combo', 'Dosa + chutney meal deal', 'lunch_combo', 'Lunch Combo', now(), now() + interval '5 hours')
) as v(restaurant_id, restaurant_name, title, subtitle, offer_type, badge_text, starts_at, ends_at)
where not exists (select 1 from public.restaurant_flash_offers limit 1);
