-- ZIP feature parity foundation for SANDIKALE Digital Showroom.
-- Additive only: does not alter legacy Member Club or Kasir data.
create table if not exists public.showroom_inventory (
 id uuid primary key default gen_random_uuid(),
 sku text not null unique,
 item_name text not null,
 category text not null default 'apparel',
 stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
 minimum_stock integer not null default 0 check (minimum_stock >= 0),
 unit text not null default 'pcs',
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.showroom_inventory_movements (
 id uuid primary key default gen_random_uuid(),
 inventory_id uuid not null references public.showroom_inventory(id) on delete restrict,
 movement_type text not null check (movement_type in ('in','out','adjustment','reservation','release')),
 quantity integer not null check (quantity > 0),
 reference_type text,
 reference_id uuid,
 notes text,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create table if not exists public.showroom_product_reviews (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.showroom_products(id) on delete cascade,
 order_id uuid references public.showroom_orders(id) on delete set null,
 customer_name text not null,
 rating smallint not null check (rating between 1 and 5),
 review_text text,
 is_published boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.showroom_support_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_token_hash text not null,
 sender_type text not null check (sender_type in ('customer','admin')),
 sender_name text,
 message text not null check (char_length(message) between 1 and 3000),
 attachment_path text,
 read_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists showroom_support_messages_conversation_idx on public.showroom_support_messages(conversation_token_hash,created_at);
create table if not exists public.showroom_bug_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_name text,
 reporter_contact text,
 category text not null default 'other',
 priority text not null default 'medium' check (priority in ('low','medium','high')),
 description text not null,
 page_url text,
 status text not null default 'open' check (status in ('open','investigating','resolved','closed')),
 admin_notes text,
 created_at timestamptz not null default now(),
 resolved_at timestamptz
);
create table if not exists public.showroom_payment_methods (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 method_type text not null default 'manual',
 account_name text,
 account_number text,
 instructions text,
 is_enabled boolean not null default false,
 display_order integer not null default 0,
 updated_at timestamptz not null default now()
);
create table if not exists public.showroom_shipping_methods (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 description text,
 base_fee numeric(12,2) not null default 0 check (base_fee >= 0),
 is_enabled boolean not null default false,
 display_order integer not null default 0,
 updated_at timestamptz not null default now()
);
alter table public.showroom_inventory enable row level security;
alter table public.showroom_inventory_movements enable row level security;
alter table public.showroom_product_reviews enable row level security;
alter table public.showroom_support_messages enable row level security;
alter table public.showroom_bug_reports enable row level security;
alter table public.showroom_payment_methods enable row level security;
alter table public.showroom_shipping_methods enable row level security;
-- No anon write policies: sensitive operations must go through authenticated admin
-- or the existing service-role Edge Function. Public can only read published reviews.
drop policy if exists showroom_reviews_public_read on public.showroom_product_reviews;
create policy showroom_reviews_public_read on public.showroom_product_reviews for select to anon, authenticated using (is_published = true);
drop policy if exists showroom_reviews_admin_all on public.showroom_product_reviews;
create policy showroom_reviews_admin_all on public.showroom_product_reviews for all to authenticated using (
 exists(select 1 from public.showroom_staff_profiles p where p.auth_user_id=auth.uid() and p.is_active=true)
) with check (
 exists(select 1 from public.showroom_staff_profiles p where p.auth_user_id=auth.uid() and p.is_active=true)
);
-- Admin-only operational tables; admin access is mediated by staff identity.
drop policy if exists showroom_inventory_staff_all on public.showroom_inventory;
create policy showroom_inventory_staff_all on public.showroom_inventory for all to authenticated using (
 exists(select 1 from public.showroom_staff_profiles p where p.auth_user_id=auth.uid() and p.is_active=true)
) with check (
 exists(select 1 from public.showroom_staff_profiles p where p.auth_user_id=auth.uid() and p.is_active=true)
);
drop policy if exists showroom_inventory_movements_staff_all on public.showroom_inventory_movements;
create policy showroom_inventory_movements_staff_all on public.showroom_inventory_movements for all to authenticated using (
 exists(select 1 from public.showroom_staff_profiles p where p.auth_user_id=auth.uid() and p.is_active=true)
) with check (
 exists(select 1 from public.showroom_staff_profiles p where p.auth_user_id=auth.uid() and p.is_active=true)
);
drop policy if exists showroom_payment_methods_staff_all on public.showroom_payment_methods;
create policy showroom_payment_methods_staff_all on public.showroom_payment_methods for all to authenticated using (
 exists(select 1 from public.showroom_staff_profiles p where p.auth_user_id=auth.uid() and p.is_active=true)
) with check (
 exists(select 1 from public.showroom_staff_profiles p where p.auth_user_id=auth.uid() and p.is_active=true)
);
drop policy if exists showroom_shipping_methods_staff_all on public.showroom_shipping_methods;
create policy showroom_shipping_methods_staff_all on public.showroom_shipping_methods for all to authenticated using (
 exists(select 1 from public.showroom_staff_profiles p where p.auth_user_id=auth.uid() and p.is_active=true)
) with check (
 exists(select 1 from public.showroom_staff_profiles p where p.auth_user_id=auth.uid() and p.is_active=true)
);
-- Chat and bug reports intentionally have no direct public table access.
revoke all on public.showroom_support_messages from anon, authenticated;
revoke all on public.showroom_bug_reports from anon, authenticated;
