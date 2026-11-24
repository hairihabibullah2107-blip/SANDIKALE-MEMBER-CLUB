create or replace function public.showroom_create_production_job_after_order()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_job_id uuid;
begin
  insert into public.showroom_production_jobs(order_id,current_stage,estimated_completion,notes)
  values (new.id,'order_confirmed',new.estimated_completion,'Job produksi dibuat otomatis saat pesanan diterima.')
  on conflict (order_id) do nothing
  returning id into v_job_id;

  if v_job_id is not null then
    insert into public.showroom_production_updates(production_job_id,stage,description)
    values (v_job_id,'order_confirmed','Pesanan baru diterima melalui Digital Showroom.');
  end if;
  return new;
end;
$$;
drop trigger if exists showroom_orders_create_production_job on public.showroom_orders;
create trigger showroom_orders_create_production_job
after insert on public.showroom_orders
for each row execute function public.showroom_create_production_job_after_order();
revoke all on function public.showroom_create_production_job_after_order() from public, anon, authenticated;
