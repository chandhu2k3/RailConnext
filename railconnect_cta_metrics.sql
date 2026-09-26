-- Safe additive analytics function.
-- Does not update, delete, or rewrite any analytics_events rows.
-- Run once in Supabase SQL Editor after deploying the frontend.

create or replace function public.get_railconnect_cta_metrics()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
with ctas(cta) as (
  values
    ('plan_my_journey'),
    ('search_connections'),
    ('compare_journeys'),
    ('backup_options')
),
agg as (
  select
    props->>'cta' as cta,
    count(*) filter (where event_name = 'cta_exposed') as impressions,
    count(*) filter (where event_name = 'cta_clicked') as clicks
  from public.analytics_events
  where event_name in ('cta_exposed', 'cta_clicked')
    and props->>'cta' in (
      'plan_my_journey',
      'search_connections',
      'compare_journeys',
      'backup_options'
    )
  group by props->>'cta'
)
select coalesce(
  jsonb_object_agg(
    c.cta,
    jsonb_build_object(
      'impressions', coalesce(a.impressions, 0),
      'clicks', coalesce(a.clicks, 0),
      'ctr', case
        when coalesce(a.impressions, 0) > 0
        then round((a.clicks::numeric / a.impressions::numeric) * 100, 2)
        else 0
      end
    )
  ),
  '{}'::jsonb
)
from ctas c
left join agg a on a.cta = c.cta;
$$;

revoke all on function public.get_railconnect_cta_metrics()
from public, anon, authenticated;

grant execute on function public.get_railconnect_cta_metrics()
to anon, authenticated;
