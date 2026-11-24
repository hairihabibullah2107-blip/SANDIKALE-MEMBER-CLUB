alter table public.showroom_customers add column if not exists address text;
alter table public.showroom_products
  add column if not exists long_sleeve_price numeric(12,2) check (long_sleeve_price is null or long_sleeve_price >= 0),
  add column if not exists size_surcharges jsonb not null default '{}'::jsonb,
  add column if not exists finishing_options jsonb not null default '[]'::jsonb;
alter table public.showroom_orders
  add column if not exists design_notes text,
  add column if not exists production_notes text,
  add column if not exists finishing_instructions text,
  add column if not exists version integer not null default 1,
  add column if not exists updated_by uuid references public.showroom_staff_profiles(id);
alter table public.showroom_order_items
  add column if not exists price_breakdown jsonb not null default '{}'::jsonb;
alter table public.showroom_spk_documents
  add column if not exists order_version integer not null default 1,
  add column if not exists snapshot jsonb not null default '{}'::jsonb,
  add column if not exists content_sha256 text,
  add column if not exists supersedes_document_id uuid references public.showroom_spk_documents(id);
create table if not exists public.showroom_order_revisions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.showroom_orders(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  change_summary text,
  changed_by uuid references public.showroom_staff_profiles(id),
  created_at timestamptz not null default now(),
  unique(order_id, version)
);
alter table public.showroom_order_revisions enable row level security;
create policy showroom_order_revisions_staff_read on public.showroom_order_revisions
 for select to authenticated
 using (private.showroom_has_any_role(array['owner','admin','staff','production']));
create policy showroom_order_revisions_admin_insert on public.showroom_order_revisions
 for insert to authenticated
 with check (private.showroom_has_any_role(array['owner','admin','staff']));
grant select, insert on public.showroom_order_revisions to authenticated;
grant select, update on public.showroom_customers to authenticated;
grant select, update on public.showroom_orders to authenticated;
grant select, update on public.showroom_order_items to authenticated;
grant select, insert, update on public.showroom_spk_documents to authenticated;
