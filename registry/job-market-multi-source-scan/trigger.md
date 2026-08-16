# Contract 2: the trigger

trigger_type: schedule (runs daily at 02:00 UTC)

system_of_record: 45 distinct job listing sources (public job boards, API feeds, and web scrapers)

volume_normal: approximately 200 new opportunities per day across all sources

volume_peak: 600 opportunities per day

peak_cause: During peak hiring seasons (Q1, Q3) and immediately after major conference announcements or industry events, opportunity volume spikes as companies post multiple open roles. End-of-month hiring pushes from agencies also cause concentration.

latency: Opportunities should be stored within 1 hour of scan completion.

replay_behaviour: deduplicate on opportunity_id and source_id within a 7-day window. If the exact same opportunity (identified by a combination of source and remote opportunity identifier) reappears from the same source within 7 days, it is discarded. After 7 days, if it reappears, it is treated as a refresh (e.g. the role is still open) and stored again if not already in the candidate pipeline.

catch_up_window: The schedule runs daily at 02:00 UTC. If a daily run fails, the next scheduled run catches up by querying all opportunities discovered in the last 48 hours. Webhook sources have no catch-up mechanism (no webhooks used; all sources are polling). Maximum catch-up window is 48 hours. An outage longer than 48 hours will result in gap of opportunities during that window.

order_matters: No. Opportunities from different sources can be processed in any order, as each source is independent.

cursor_field: LastDiscoveredDate (or equivalent field per source). Each source tracker maintains its own cursor; the scheduler queries each source starting from the last recorded cursor position to fetch only new items since the last successful scan.
