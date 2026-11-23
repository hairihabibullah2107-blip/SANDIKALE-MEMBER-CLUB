create or replace function public.showroom_take_rate_limit(p_ip_hash text, p_max_hits integer default 3)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  delete from public.showroom_api_rate_limits
  where window_start < now() - interval '1 day';
  v_window := to_timestamp(floor(extract(epoch from now()) / 600) * 600);
  insert into public.showroom_api_rate_limits(ip_hash,window_start,hits)
  values(p_ip_hash,v_window,1)
  on conflict(ip_hash,window_start)
  do update set hits = public.showroom_api_rate_limits.hits + 1
  returning hits into v_hits;
  return v_hits <= greatest(1,least(p_max_hits,20));
end;
$$;
revoke all on function public.showroom_take_rate_limit(text,integer) from public, anon, authenticated;
grant execute on function public.showroom_take_rate_limit(text,integer) to service_role;
