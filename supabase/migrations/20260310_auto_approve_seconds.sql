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
