-- Session-based CTA engagement metrics.
-- Read-only: does not insert, update, delete, or alter analytics_events rows.
-- Uses existing tracked interaction events and total distinct sessions.

create or replace function public.get_railconnect_cta_metrics()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
with totals as (
  select count(distinct session_id) as total_sessions
  from public.analytics_events
),
cta_counts as (
  select
    c.cta,
    case c.cta
      when 'plan_my_journey' then count(distinct session_id) filter (where event_name = 'cta_clicked' and props->>'cta' = 'plan_my_journey')
      when 'search_connections' then count(distinct session_id) filter (where event_name = 'cta_clicked' and props->>'cta' = 'search_connections')
      when 'compare_journeys' then count(distinct session_id) filter (where event_name = 'journey_compared')
      when 'backup_options' then count(distinct session_id) filter (where event_name = 'backup_options_clicked')
      else 0
    end as users
  from (values
    ('plan_my_journey'),
    ('search_connections'),
    ('compare_journeys'),
    ('backup_options')
  ) as c(cta)
  cross join public.analytics_events e
  group by c.cta
)
select jsonb_object_agg(
  c.cta,
  jsonb_build_object(
    'users', c.users,
    'total_sessions', t.total_sessions,
    'rate', case when t.total_sessions > 0 then round((c.users::numeric / t.total_sessions::numeric) * 100, 2) else 0 end
  )
)
from cta_counts c
cross join totals t;
$$;

revoke all on function public.get_railconnect_cta_metrics()
from public, anon, authenticated;

grant execute on function public.get_railconnect_cta_metrics()
to anon, authenticated;
