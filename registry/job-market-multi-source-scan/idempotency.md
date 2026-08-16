# Contract 3: idempotency and effects

## Failure: no dedup key defined, no state store, no idempotency contract written

This automation has NO dedup key and NO dedup state store. Nothing reconciles the same opportunity across its 45 sources. The same organisation's job listing arrives repeatedly as though never seen.

Measured impact (2026-08-16):
- 3004 rows for 2022 distinct organisations
- 982 duplicate rows, 33 percent of the table
- 432 organisations appearing more than once
- one organisation resurfaced from 7 distinct sources
- another from 6 distinct sources
- one appeared 36 times
- 80 rows sit in a new state while the same organisation already carries a row that was acted on

---

## What contract 3 should specify

dedup_key: opportunity_id + source_id (the combination of the opportunity's remote identifier and the source it was discovered from)

dedup_state_store: SQLite table `opportunity_seen` with columns: source_id, opportunity_id, last_seen_date, created_date. Query before insert: SELECT COUNT(*) FROM opportunity_seen WHERE source_id = ? AND opportunity_id = ? AND last_seen_date > date('now', '-7 days'). If row exists and last_seen_date is within 7 days, skip insert; otherwise update last_seen_date and insert if new.

effects:

| node | system | reversible | customer_visible |
|---|---|---|---|
| store to SQLite | SQLite | yes | no |
| tag with source | SQLite | yes | no |
| notify pipeline | downstream systems | yes | no |

effect_order: 1. tag with source, 2. store to SQLite, 3. notify pipeline of new item

resume_point: if storage fails, resume from notification; if notification fails, the record is stored but downstream miss the alert until the next reconciliation run

recovery_strategy: if SQLite write fails, quarantine the row and alert the operations team. Do not retry automatically. If notification fails after storage, retry with exponential backoff, max 3 retries. If still failing, log and continue; the item is stored and a manual sync can be run later.

safety_cap: 1000 new rows per hour. If the scan produces more than 1000 unique rows per hour, pause further processing and alert the operations team; do not resume until the backlog is reviewed.

---

## Why this matters

Without a dedup key and state store, the contract 3 effect inventory cannot be written, recovery strategy cannot be planned, and the pipeline lacks defence against its primary failure mode: duplicate work and wasted downstream effort.
