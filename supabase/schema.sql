create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'asset_kind') then
    create type public.asset_kind as enum ('link', 'files');
  end if;
  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type public.request_status as enum ('pending', 'approved', 'denied', 'auto_approved');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  phone text,
  notification_email boolean not null default true,
  notification_sms boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.asset_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid references public.asset_groups (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  kind public.asset_kind not null,
  link_url text,
  auto_approve_enabled boolean not null default false,
  auto_approve_delay_seconds integer not null default 0,
  auto_approve_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.assets
add column if not exists auto_approve_delay_seconds integer;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assets'
      and column_name = 'auto_approve_delay_minutes'
  ) then
    update public.assets
    set auto_approve_delay_seconds = coalesce(auto_approve_delay_minutes, 0) * 60
    where coalesce(auto_approve_delay_seconds, 0) = 0;
  end if;
end $$;

update public.assets
set auto_approve_delay_seconds = 0
where auto_approve_delay_seconds is null;

alter table public.assets
alter column auto_approve_delay_seconds set default 0;

alter table public.assets
alter column auto_approve_delay_seconds set not null;

alter table public.assets
add column if not exists auto_approve_note text;

create table if not exists public.asset_files (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size bigint,
  content_type text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.asset_links (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.asset_links (asset_id, owner_id, url, sort_order)
select a.id, a.owner_id, a.link_url, 0
from public.assets a
where a.link_url is not null
  and not exists (
    select 1
    from public.asset_links l
    where l.asset_id = a.id
      and l.sort_order = 0
  );

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  requester_email text not null,
  reason text not null,
  status public.request_status not null default 'pending',
  qstash_message_id text,
  decision_note text,
  approved_at timestamptz,
  denied_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.access_requests
add column if not exists qstash_message_id text;

create index if not exists asset_groups_owner_idx on public.asset_groups (owner_id);
create index if not exists assets_owner_idx on public.assets (owner_id);
create index if not exists assets_group_idx on public.assets (group_id);
create index if not exists access_requests_owner_idx on public.access_requests (owner_id, status);
create index if not exists access_requests_asset_idx on public.access_requests (asset_id, created_at desc);
create index if not exists asset_files_asset_idx on public.asset_files (asset_id, sort_order);
create index if not exists asset_links_asset_idx on public.asset_links (asset_id, sort_order);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_assets_updated_at on public.assets;
create trigger set_assets_updated_at
before update on public.assets
for each row execute procedure public.set_current_timestamp_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('asset-documents', 'asset-documents', false)
on conflict (id) do nothing;
