# RailConnect v16 — Eligible-session CTA analytics

The dashboard uses only existing analytics_events data. It does not create historical impressions or modify/delete stored events.

## CTA engagement rates
Each rate is calculated dynamically as:

**unique sessions that used the action / unique eligible sessions × 100**

Existing event mappings:
- Plan My Journey: `cta_clicked` with `props.cta = plan_my_journey`; eligible sessions = home page (`page_view`, `/`).
- Search Connections: `cta_clicked` with `props.cta = search_connections`; eligible sessions = search page (`page_view`, `/search`).
- Compare Journeys: `journey_compared`; eligible sessions = sessions reaching `results_viewed`.
- Backup Options: `backup_options_clicked`; eligible sessions = sessions with `journey_opened`.

This means existing data such as 14 comparison sessions and 22 results sessions will be calculated as 14/22 = 63.64% when those records are present in Supabase.

## Important deployment step
Run `railconnect_cta_metrics_v16.sql` in the Supabase SQL Editor once. The frontend expects the returned `eligible_sessions` field. If the older CTA function is still installed, the UI can show `0 / 0 eligible sessions` even though the underlying analytics events exist.
