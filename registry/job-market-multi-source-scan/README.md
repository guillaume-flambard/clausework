# Job market multi-source scan

status: reviewed
owner: Guillaume Flambard, Operations Lead
workflow_id: pending
review_date: 2026-09-16
created: 2026-08-16

## Summary

This entry documents a real multi-source scanning pipeline that failed in exactly the way contract 3 exists to prevent. It is the teaching case that demonstrates what the absence of an idempotency contract costs.

The automation is part of a hybrid pipeline: the scanning half is not n8n-based and consists of a scheduled SQLite-backed Python scanner that runs daily and pulls from 45 distinct sources into a single job opportunity store. The second half of the pipeline, a mailbox watcher that classifies incoming replies and logs them to a data table, runs on n8n. Both halves operate under the same four contracts defined below. This hybrid setup serves as the reference example showing that Clausework's four contracts and gates are engine-agnostic: the harness and intake form are n8n-specific, but the contracts themselves apply to any automation, regardless of where it runs.

The scanner component has not yet been migrated to n8n. `workflow_id: pending` indicates the contracts exist and are complete, but this component runs elsewhere. The decision to include it in the registry anyway reflects an intention to eventually migrate the scanner onto n8n and wire it into the same release and operational gates as all other automations, OR to decommission it after measured evidence is complete.

## Why this case is here

The case failed because contract 3 was never written. There was no deduplication key, no dedup state store, and no awareness that the same organisation would arrive repeatedly from different sources.

Measured on 2026-08-16:
- 3004 rows representing 2022 distinct organisations
- 982 duplicate rows, 33 percent of the table
- 432 organisations appearing more than once
- one organisation resurfaced from 7 distinct sources, another from 6, one appeared 36 times
- 80 rows in a new state while the same organisation already carries a row that was acted on

Each contract below states what the pipeline actually had, and where it fell short.

## Decision log

```
[2026-08-16 09:00:00] [DOCUMENTED] Baseline measured: 3004 rows, 2022 distinct organisations, 982 duplicates (33 percent). No deduplication across 45 sources. 80 new rows while originating organisation already has acted-on row. Contract 3 failure mode quantified. Entry created as teaching case.
```
