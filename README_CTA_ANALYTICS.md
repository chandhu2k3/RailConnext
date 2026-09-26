# RailConnect CTA Analytics — v13

## What changed
- Marketing Signals now uses CTA-level CTR for four tracked actions:
  - Plan My Journey
  - Search Connections
  - Compare Journeys
  - Backup Options
- Each CTR is calculated as total CTA clicks / total CTA impressions × 100.
- Search Completion Rate and Results Reached Rate remain dynamic from the existing analytics RPC.
- Feature Engagement bars now scale relative to the highest current feature count, so smaller counts visually produce shorter bars.
- Existing analytics data is not modified, deleted, or migrated.

## Important: run the additive SQL once
The frontend calls a new read-only aggregation function: `public.get_railconnect_cta_metrics()`.

Run `railconnect_cta_metrics.sql` once in the Supabase SQL Editor. The function only reads `analytics_events`; it does not update or delete any rows.

New CTA exposure/click events will be collected after this frontend is deployed. Historical CTA impressions are not fabricated.

## CTA event names
- `cta_exposed` with `props.cta = plan_my_journey`
- `cta_exposed` with `props.cta = search_connections`
- `cta_exposed` with `props.cta = compare_journeys`
- `cta_exposed` with `props.cta = backup_options`
- Existing/new `cta_clicked` events use the same CTA values.
