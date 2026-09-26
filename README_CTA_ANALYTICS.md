# RailConnect v15 — Eligible-session CTA analytics

This version changes only the CTA analytics calculation and explanatory copy.

## CTA engagement rates
Each CTA rate is calculated dynamically as:

unique sessions that used the CTA / unique eligible sessions × 100

Eligible sessions are based on the existing event stream:
- Plan My Journey: sessions with a home-page (`/`) page view.
- Search Connections: sessions with a search-page (`/search`) page view.
- Compare Journeys: sessions that reached `results_viewed`.
- Backup Options: sessions that reached `journey_opened`.

No historical impressions are fabricated, and no analytics event rows are updated or deleted.

## Supabase
Run `railconnect_cta_metrics_v15.sql` in the Supabase SQL Editor once. It replaces only the read-only CTA aggregation function.
