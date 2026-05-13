revoke all on table
  public.profiles,
  public.asset_groups,
  public.assets,
  public.asset_files,
  public.asset_links,
  public.access_requests
from anon, authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.asset_groups,
  public.assets,
  public.asset_files,
  public.asset_links,
  public.access_requests
to authenticated;

revoke execute on function public.set_current_timestamp_updated_at()
from public, anon, authenticated;

revoke execute on function public.handle_new_user()
from public, anon, authenticated;

grant execute on function public.set_current_timestamp_updated_at() to service_role;
grant execute on function public.handle_new_user() to service_role;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
    grant execute on function public.rls_auto_enable() to service_role;
  end if;
end $$;
