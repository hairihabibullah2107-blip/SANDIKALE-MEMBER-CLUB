create or replace function private.showroom_log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_staff_id uuid;
begin
  if new.status is distinct from old.status then
    select id into v_staff_id
    from public.showroom_staff_profiles
    where auth_user_id = (select auth.uid()) and is_active = true
    limit 1;
    insert into public.showroom_order_status_history(order_id,previous_status,new_status,changed_by,notes)
    values(new.id,old.status,new.status,v_staff_id,'Status diperbarui melalui dashboard showroom.');
  end if;
  return new;
end;
$$;
revoke all on function private.showroom_log_order_status_change() from public, anon, authenticated;
drop trigger if exists showroom_order_status_history_trigger on public.showroom_orders;
create trigger showroom_order_status_history_trigger
after update of status on public.showroom_orders
for each row execute function private.showroom_log_order_status_change();
