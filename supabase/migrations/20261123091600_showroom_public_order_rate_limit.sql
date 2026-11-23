create table if not exists public.showroom_api_rate_limits (
  ip_hash text not null,
  window_start timestamptz not null,
  hits integer not null default 0 check (hits >= 0),
  primary key (ip_hash, window_start)
);
alter table public.showroom_api_rate_limits enable row level security;
revoke all on public.showroom_api_rate_limits from public, anon, authenticated;
grant all on public.showroom_api_rate_limits to service_role;
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
