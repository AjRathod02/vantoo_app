-- Fix infinite recursion in profiles RLS policies.
-- Policies that subquery public.profiles from within profiles RLS re-enter the same
-- policy set and trigger Postgres error 42P17.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins manage all orders" on public.orders;
create policy "Admins manage all orders"
  on public.orders for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Tighten existing user policies to authenticated role (no behavior change for signed-in users).
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
