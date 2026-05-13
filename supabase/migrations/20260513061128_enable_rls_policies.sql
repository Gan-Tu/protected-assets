alter function public.set_current_timestamp_updated_at()
set search_path = public;

revoke execute on function public.set_current_timestamp_updated_at() from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_current_timestamp_updated_at() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
grant execute on function public.set_current_timestamp_updated_at() to service_role;
grant execute on function public.handle_new_user() to service_role;

revoke all on table
  public.profiles,
  public.asset_groups,
  public.assets,
  public.asset_files,
  public.asset_links,
  public.access_requests
from anon;

revoke all on table
  public.profiles,
  public.asset_groups,
  public.assets,
  public.asset_files,
  public.asset_links,
  public.access_requests
from authenticated;

grant usage on schema public to authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.asset_groups,
  public.assets,
  public.asset_files,
  public.asset_links,
  public.access_requests
to authenticated;

alter table public.profiles enable row level security;
alter table public.asset_groups enable row level security;
alter table public.assets enable row level security;
alter table public.asset_files enable row level security;
alter table public.asset_links enable row level security;
alter table public.access_requests enable row level security;

drop policy if exists profiles_owner_access on public.profiles;
create policy profiles_owner_access
on public.profiles
for all
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists asset_groups_owner_access on public.asset_groups;
create policy asset_groups_owner_access
on public.asset_groups
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists assets_owner_access on public.assets;
create policy assets_owner_access
on public.assets
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists asset_files_owner_access on public.asset_files;
create policy asset_files_owner_access
on public.asset_files
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists asset_links_owner_access on public.asset_links;
create policy asset_links_owner_access
on public.asset_links
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists access_requests_owner_access on public.access_requests;
create policy access_requests_owner_access
on public.access_requests
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
