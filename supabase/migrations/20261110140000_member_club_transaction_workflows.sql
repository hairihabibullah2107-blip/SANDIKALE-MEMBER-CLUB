-- SANDIKALE MEMBER CLUB: trusted cashier transaction and stamp workflows.
-- Additive only. Legacy POS tables and the lowercase sandikale project are untouched.

create or replace function public.mc_create_transaction(
  p_member_number text,
  p_source_transaction_id text,
  p_total_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_member_id uuid;
  v_transaction_id uuid;
  v_existing public.mc_transactions%rowtype;
  v_eligible boolean;
begin
  if v_actor is null or not exists (
    select 1 from public.mc_staff_profiles s
    where s.user_id = v_actor
      and s.is_active = true
      and s.role in ('owner', 'admin', 'cashier')
  ) then
    raise exception 'Akses ditolak: akun kasir aktif diperlukan.' using errcode = '42501';
  end if;

  if nullif(trim(p_member_number), '') is null
     or nullif(trim(p_source_transaction_id), '') is null
     or p_total_amount is null
     or p_total_amount <= 0 then
    raise exception 'Nomor member, ID transaksi, dan total transaksi wajib valid.' using errcode = '22023';
  end if;

  select m.id into v_member_id
  from public.mc_members m
  where m.member_number = trim(p_member_number)
    and m.status = 'active';

  if v_member_id is null then
    raise exception 'Member aktif tidak ditemukan.' using errcode = 'P0002';
  end if;

  select t.* into v_existing
  from public.mc_transactions t
  where t.source_system = 'member-club-cashier'
    and t.source_transaction_id = trim(p_source_transaction_id);

  if found then
    if v_existing.member_id <> v_member_id
       or v_existing.total_amount <> p_total_amount then
      raise exception 'ID transaksi sudah digunakan dengan data berbeda.' using errcode = '23505';
    end if;
    return v_existing.id;
  end if;

  select exists (
    select 1 from public.mc_stamp_rules r
    where r.is_active = true
      and p_total_amount >= r.minimum_amount
      and (r.starts_at is null or r.starts_at <= now())
      and (r.ends_at is null or r.ends_at > now())
  ) into v_eligible;

  insert into public.mc_transactions (
    member_id, source_system, source_transaction_id,
    total_amount, eligible, status, validated_by
  ) values (
    v_member_id, 'member-club-cashier', trim(p_source_transaction_id),
    p_total_amount, v_eligible, 'pending', null
  )
  returning id into v_transaction_id;

  insert into public.mc_audit_logs (
    actor_user_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor, 'transaction_created', 'transaction', v_transaction_id::text,
    jsonb_build_object('member_number', trim(p_member_number), 'amount', p_total_amount)
  );

  return v_transaction_id;
end;
$$;

create or replace function public.mc_validate_transaction(p_transaction_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_tx public.mc_transactions%rowtype;
  v_rule public.mc_stamp_rules%rowtype;
  v_stamp_count integer := 0;
begin
  if v_actor is null or not exists (
    select 1 from public.mc_staff_profiles s
    where s.user_id = v_actor
      and s.is_active = true
      and s.role in ('owner', 'admin', 'cashier')
  ) then
    raise exception 'Akses ditolak: akun kasir aktif diperlukan.' using errcode = '42501';
  end if;

  select t.* into v_tx
  from public.mc_transactions t
  where t.id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaksi tidak ditemukan.' using errcode = 'P0002';
  end if;

  if v_tx.status = 'voided' then
    raise exception 'Transaksi yang dibatalkan tidak dapat divalidasi.' using errcode = '22023';
  end if;

  if v_tx.status = 'validated' then
    select coalesce(sum(l.stamp_delta), 0)::integer into v_stamp_count
    from public.mc_stamp_ledger l
    where l.transaction_id = v_tx.id and l.entry_type = 'earned';

    return jsonb_build_object(
      'transaction_id', v_tx.id,
      'status', 'validated',
      'stamps_added', v_stamp_count,
      'already_processed', true
    );
  end if;

  if v_tx.eligible then
    select r.* into v_rule
    from public.mc_stamp_rules r
    where r.is_active = true
      and v_tx.total_amount >= r.minimum_amount
      and (r.starts_at is null or r.starts_at <= now())
      and (r.ends_at is null or r.ends_at > now())
    order by r.created_at desc
    limit 1;

    if not found then
      raise exception 'Aturan stamp aktif tidak ditemukan. Transaksi belum divalidasi.' using errcode = 'P0002';
    end if;

    v_stamp_count := v_rule.stamps_per_transaction;

    insert into public.mc_stamp_ledger (
      member_id, transaction_id, rule_id, entry_type,
      stamp_delta, created_by
    ) values (
      v_tx.member_id, v_tx.id, v_rule.id, 'earned',
      v_stamp_count, v_actor
    );
  end if;

  update public.mc_transactions
  set status = 'validated',
      validated_by = v_actor,
      validated_at = now()
  where id = v_tx.id;

  insert into public.mc_audit_logs (
    actor_user_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor, 'transaction_validated', 'transaction', v_tx.id::text,
    jsonb_build_object('stamps_added', v_stamp_count, 'eligible', v_tx.eligible)
  );

  return jsonb_build_object(
    'transaction_id', v_tx.id,
    'status', 'validated',
    'stamps_added', v_stamp_count,
    'already_processed', false
  );
end;
$$;

revoke all on function public.mc_create_transaction(text, text, numeric) from public;
revoke all on function public.mc_create_transaction(text, text, numeric) from anon;
grant execute on function public.mc_create_transaction(text, text, numeric) to authenticated;

revoke all on function public.mc_validate_transaction(uuid) from public;
revoke all on function public.mc_validate_transaction(uuid) from anon;
grant execute on function public.mc_validate_transaction(uuid) to authenticated;
