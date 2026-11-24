alter table public.showroom_orders
  add column if not exists deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  add column if not exists production_status text not null default 'new'
    check (production_status in ('new','design_confirmation','waiting_production','in_production','printing','finishing','quality_control','completed','ready_for_pickup','handed_over','cancelled')),
  add column if not exists target_completion_date date;
create index if not exists showroom_orders_production_status_created_idx
  on public.showroom_orders(production_status, created_at desc);
create index if not exists showroom_order_designs_item_created_idx
  on public.showroom_order_designs(order_item_id, created_at desc);
