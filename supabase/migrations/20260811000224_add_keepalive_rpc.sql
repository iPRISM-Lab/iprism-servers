create or replace function public.keepalive()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
    select statement_timestamp();
$$;

comment on function public.keepalive() is
    'Returns the current statement time for lightweight project activity checks.';

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
