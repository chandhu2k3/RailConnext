-- RailConnect CTA engagement metrics v16
-- Read-only aggregation over existing analytics_events data.
-- No historical impressions are invented and no event rows are changed.
-- Each action is compared only with sessions that reached the relevant point.

create or replace function public.get_railconnect_cta_metrics()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
with used as (
  select 'plan_my_journey'::text as cta,
         count(distinct session_id) filter (
           where event_name = 'cta_clicked' and props->>'cta' = 'plan_my_journey'
         ) as sessions_used
  from public.analytics_events
  union all
  select 'search_connections'::text,
         count(distinct session_id) filter (
           where event_name = 'cta_clicked' and props->>'cta' = 'search_connections'
         )
  from public.analytics_events
  union all
  select 'compare_journeys'::text,
         count(distinct session_id) filter (
           where event_name = 'journey_compared'
         )
  from public.analytics_events
  union all
  select 'backup_options'::text,
         count(distinct session_id) filter (
           where event_name = 'backup_options_clicked'
         )
  from public.analytics_events
),
eligible as (
  select 'plan_my_journey'::text as cta,
         count(distinct session_id) as eligible_sessions
  from public.analytics_events
  where event_name = 'page_view' and page = '/'
  union all
  select 'search_connections'::text,
         count(distinct session_id)
  from public.analytics_events
  where event_name = 'page_view' and page = '/search'
  union all
  select 'compare_journeys'::text,
         count(distinct session_id)
  from public.analytics_events
  where event_name = 'results_viewed'
  union all
  select 'backup_options'::text,
         count(distinct session_id)
  from public.analytics_events
  where event_name = 'journey_opened'
),
ctas(cta) as (
  values
    ('plan_my_journey'),
    ('search_connections'),
    ('compare_journeys'),
    ('backup_options')
)
select coalesce(
  jsonb_object_agg(
    c.cta,
    jsonb_build_object(
      'users', coalesce(u.sessions_used, 0),
      'eligible_sessions', coalesce(e.eligible_sessions, 0),
      'rate', case
        when coalesce(e.eligible_sessions, 0) > 0
        then round((coalesce(u.sessions_used, 0)::numeric / e.eligible_sessions::numeric) * 100, 2)
        else 0
      end
    )
  ),
  '{}'::jsonb
)
from ctas c
left join used u on u.cta = c.cta
left join eligible e on e.cta = c.cta;
$$;

revoke all on function public.get_railconnect_cta_metrics()
from public, anon, authenticated;

grant execute on function public.get_railconnect_cta_metrics()
to anon, authenticated;
