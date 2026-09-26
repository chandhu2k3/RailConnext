-- Dynamic, session-based CTA engagement metrics.
-- Uses only existing analytics_events data; does not update/delete event rows.
-- Each CTA is compared with the sessions that reached the relevant point where that CTA was available.

create or replace function public.get_railconnect_cta_metrics()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
with click_users as (
  select
    props->>'cta' as cta,
    count(distinct session_id) as users
  from public.analytics_events
  where event_name = 'cta_clicked'
    and props->>'cta' in ('plan_my_journey','search_connections','compare_journeys','backup_options')
  group by props->>'cta'
),
eligible as (
  -- Plan CTA is available on the home page.
  select 'plan_my_journey'::text as cta, count(distinct session_id) as eligible_sessions
  from public.analytics_events
  where event_name = 'page_view' and page = '/'

  union all

  -- Search CTA is available to sessions that reached the search page.
  select 'search_connections'::text, count(distinct session_id)
  from public.analytics_events
  where event_name = 'page_view' and page = '/search'

  union all

  -- Compare CTA is available after results are reached.
  select 'compare_journeys'::text, count(distinct session_id)
  from public.analytics_events
  where event_name = 'results_viewed'

  union all

  -- Backup CTA is available on the journey-details experience.
  select 'backup_options'::text, count(distinct session_id)
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
      'users', coalesce(u.users, 0),
      'eligible_sessions', coalesce(e.eligible_sessions, 0),
      'rate', case
        when coalesce(e.eligible_sessions, 0) > 0
        then round((coalesce(u.users, 0)::numeric / e.eligible_sessions::numeric) * 100, 2)
        else 0
      end
    )
  ),
  '{}'::jsonb
)
from ctas c
left join click_users u on u.cta = c.cta
left join eligible e on e.cta = c.cta;
$$;

revoke all on function public.get_railconnect_cta_metrics()
from public, anon, authenticated;

grant execute on function public.get_railconnect_cta_metrics()
to anon, authenticated;
