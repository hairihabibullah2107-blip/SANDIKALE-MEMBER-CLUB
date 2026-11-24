-- Digital Showroom DTF rate configuration, garment colors and mockup library
alter table public.showroom_products add column if not exists available_colors jsonb not null default '[]'::jsonb;
create table if not exists public.showroom_dtf_prices (
 id uuid primary key default gen_random_uuid(),
 size_code text not null unique,
 label text not null,
 width_cm numeric(6,2) not null check(width_cm>0),
 height_cm numeric(6,2) not null check(height_cm>0),
 price integer not null default 0 check(price>=0),
 is_active boolean not null default true,
 sort_order integer not null default 0,
 updated_at timestamptz not null default now()
);
alter table public.showroom_dtf_prices enable row level security;
drop policy if exists showroom_dtf_prices_public_read on public.showroom_dtf_prices;
create policy showroom_dtf_prices_public_read on public.showroom_dtf_prices for select using(is_active=true);
drop policy if exists showroom_dtf_prices_admin_manage on public.showroom_dtf_prices;
create policy showroom_dtf_prices_admin_manage on public.showroom_dtf_prices for all using(private.showroom_has_any_role(array['owner','admin']::text[])) with check(private.showroom_has_any_role(array['owner','admin']::text[]));
insert into public.showroom_dtf_prices(size_code,label,width_cm,height_cm,price,sort_order)
values ('A6','A6 · 10 × 15 cm',10,15,0,1),('A5','A5 · 15 × 21 cm',15,21,0,2),('A4','A4 · 21 × 29.7 cm',21,29.7,0,3),('A3','A3 · 29.7 × 42 cm',29.7,42,0,4)
on conflict(size_code) do nothing;
create table if not exists public.showroom_garment_mockups (
 id uuid primary key default gen_random_uuid(),
 garment_type text not null check(garment_type in ('short','long')),
 color_name text not null,
 color_hex text not null default '#ffffff',
 front_storage_path text not null,
 back_storage_path text not null,
 is_active boolean not null default true,
 updated_at timestamptz not null default now(),
 unique(garment_type,color_name)
);
alter table public.showroom_garment_mockups enable row level security;
drop policy if exists showroom_garment_mockups_public_read on public.showroom_garment_mockups;
create policy showroom_garment_mockups_public_read on public.showroom_garment_mockups for select using(is_active=true);
drop policy if exists showroom_garment_mockups_admin_manage on public.showroom_garment_mockups;
create policy showroom_garment_mockups_admin_manage on public.showroom_garment_mockups for all using(private.showroom_has_any_role(array['owner','admin']::text[])) with check(private.showroom_has_any_role(array['owner','admin']::text[]));
grant select on public.showroom_dtf_prices,public.showroom_garment_mockups to anon,authenticated;
grant select,insert,update,delete on public.showroom_dtf_prices,public.showroom_garment_mockups to authenticated;
