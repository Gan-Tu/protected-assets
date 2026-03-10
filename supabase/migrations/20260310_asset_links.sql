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

create index if not exists asset_links_asset_idx on public.asset_links (asset_id, sort_order);
