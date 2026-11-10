-- SANDIKALE MEMBER CLUB V1.0 foundation.
-- Additive only: legacy POS tables are intentionally untouched.
create table if not exists public.mc_members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  member_number text not null unique,
  full_name text not null,
  phone_e164 text not null unique,
  status text not null default 'active' check (status in ('active','suspended','closed')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.mc_staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','cashier','marketing')),
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.mc_stamp_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stamps_per_transaction integer not null default 1 check (stamps_per_transaction > 0),
  minimum_amount numeric(12,2) not null default 0 check (minimum_amount >= 0),
  is_active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.mc_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.mc_members(id),
  source_system text not null default 'sandikale-pos',
  source_transaction_id text not null,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  eligible boolean not null default false,
  status text not null default 'pending' check (status in ('pending','validated','voided')),
  validated_by uuid references auth.users(id),
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source_system, source_transaction_id)
);
create table if not exists public.mc_stamp_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.mc_members(id),
  transaction_id uuid references public.mc_transactions(id),
  rule_id uuid references public.mc_stamp_rules(id),
  entry_type text not null check (entry_type in ('earned','adjustment','reversal')),
  stamp_delta integer not null check (stamp_delta <> 0),
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint mc_stamp_ledger_adjustment_reason check (
    entry_type = 'earned' or (reason is not null and length(trim(reason)) > 0)
  )
);
create unique index if not exists mc_stamp_ledger_one_earn_per_transaction
  on public.mc_stamp_ledger(transaction_id)
  where entry_type = 'earned' and transaction_id is not null;
create table if not exists public.mc_rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  stamp_cost integer not null check (stamp_cost > 0),
  reward_type text not null default 'voucher',
  is_active boolean not null default true,
  stock_limit integer check (stock_limit is null or stock_limit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.mc_reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.mc_members(id),
  reward_id uuid not null references public.mc_rewards(id),
  redemption_code_hash text not null unique,
  status text not null default 'issued' check (status in ('issued','redeemed','expired','cancelled')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id)
);
create table if not exists public.mc_communication_consents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.mc_members(id),
  channel text not null check (channel in ('whatsapp','email','sms')),
  purpose text not null check (purpose in ('transactional','marketing')),
  is_granted boolean not null default false,
  recorded_at timestamptz not null default now(),
  source text not null default 'member_portal'
);
create table if not exists public.mc_audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists mc_transactions_member_created_idx on public.mc_transactions(member_id, created_at desc);
create index if not exists mc_stamp_ledger_member_created_idx on public.mc_stamp_ledger(member_id, created_at desc);
create index if not exists mc_redemptions_member_issued_idx on public.mc_reward_redemptions(member_id, issued_at desc);
create index if not exists mc_consents_member_channel_idx on public.mc_communication_consents(member_id, channel, purpose);
alter table public.mc_members enable row level security;
alter table public.mc_staff_profiles enable row level security;
alter table public.mc_stamp_rules enable row level security;
alter table public.mc_transactions enable row level security;
alter table public.mc_stamp_ledger enable row level security;
alter table public.mc_rewards enable row level security;
alter table public.mc_reward_redemptions enable row level security;
alter table public.mc_communication_consents enable row level security;
alter table public.mc_audit_logs enable row level security;
grant select on public.mc_members to authenticated;
grant select on public.mc_transactions to authenticated;
grant select on public.mc_stamp_ledger to authenticated;
grant select on public.mc_rewards to authenticated;
grant select on public.mc_reward_redemptions to authenticated;
grant select on public.mc_communication_consents to authenticated;
grant select on public.mc_staff_profiles to authenticated;
grant select on public.mc_stamp_rules to authenticated;
create policy "member reads own membership" on public.mc_members for select to authenticated
  using ((select auth.uid()) = auth_user_id);
create policy "member reads own transactions" on public.mc_transactions for select to authenticated
  using (exists (select 1 from public.mc_members m where m.id = member_id and m.auth_user_id = (select auth.uid())));
create policy "member reads own stamp ledger" on public.mc_stamp_ledger for select to authenticated
  using (exists (select 1 from public.mc_members m where m.id = member_id and m.auth_user_id = (select auth.uid())));
create policy "members read active rewards" on public.mc_rewards for select to authenticated
  using (is_active = true);
create policy "member reads own redemptions" on public.mc_reward_redemptions for select to authenticated
  using (exists (select 1 from public.mc_members m where m.id = member_id and m.auth_user_id = (select auth.uid())));
create policy "member reads own communication consents" on public.mc_communication_consents for select to authenticated
  using (exists (select 1 from public.mc_members m where m.id = member_id and m.auth_user_id = (select auth.uid())));
create policy "staff reads own staff profile" on public.mc_staff_profiles for select to authenticated
  using (user_id = (select auth.uid()));
-- No client write policies: trusted server workflows own all loyalty mutations.
