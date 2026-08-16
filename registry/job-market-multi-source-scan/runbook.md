# Runbook: job-market-multi-source-scan

## Failure classes

Three failure classes are treated differently:

### Transient (rate limit, timeout, upstream 5xx)

Retry with growing backoff, capped, then escalate. This is the only case where retrying makes sense.

Action: Configure the retry logic with exponential backoff, cap at 3 retries or 5 minutes of elapsed time, whichever comes first. On final failure, escalate to the on-call engineer per the escalation path below.

### Data (unexpected payload, missing field, malformed record)

Quarantine, alert the owner, never retry. Retrying does not repair broken data, it burns quota and hides the problem.

Action: Route to a quarantine table (SQLite quarantine_records) and alert the operations team. Do not attempt automatic replay. Log the malformed record schema and source for investigation.

### Partial effect (the automation did half the job)

The worst case, and the one contract 3 anticipated. Resume point, intervention per the recovery strategy, never an automatic replay.

Action: Check the resume point below. If the dedup check passed but SQLite write failed, the opportunity record is not in the store and no duplicate was created; recovery is a retry of the insert. If the notification step failed after storage, the record is in the store but downstream missed the alert; recovery is a retry of the notification. Alert the operations team with the exact step that failed and the state at failure.

---

## Effect inventory

From contract 3:

| node | system | reversible | customer_visible |
|---|---|---|---|
| store to SQLite | SQLite | yes | no |
| tag with source | SQLite | yes | no |
| notify pipeline | downstream systems | yes | no |

---

## Resume point

From contract 3: resume from pending notifications if storage succeeds; resume from deduction if storage fails.

Specifically:
- If step 5 (SQLite insert) fails: pause, alert, and wait for human review. Do not automatically insert the same record twice.
- If step 6 (notify downstream) fails: the record is already stored; retry notification with backoff.
- If step 7 (update cursors) fails: the records are stored; retry cursor update on the next scheduled run.

---

## Recovery strategy

From contract 3: if SQLite write fails, quarantine the row and alert the operations team. Do not retry automatically. If notification fails after storage, retry with exponential backoff, max 3 retries. If still failing, log and continue.

Detailed:
- SQLite insert failure: quarantine the batch to quarantine_records table. Alert operations team. Await manual inspection before retry. Do not retry automatically.
- SQLite cursor update failure: the opportunity was stored; the cursor update can be retried on the next run. If cursor falls significantly behind (more than 48 hours), alert operations.
- Notification failure: retry up to 3 times with exponential backoff (1s, 2s, 4s). If still failing, log to error log and continue. The opportunity is stored; the missing alert is a gap, not a corruption. Downstream can reconcile on their next poll or receive it in the next batch.

---

## Safety cap

From contract 3: 1000 new rows per hour. If the scan produces more than 1000 unique rows per hour, pause further processing and alert the operations team; do not resume until the backlog is reviewed.

The safety cap is a circuit breaker, not an alert. Past the cap, it cuts. An alert at 3am wakes nobody; a circuit breaker stops the disaster.

Implementation: After step 5, check the row count. If row count exceeds 1000 in the current run, or if the rate exceeds 1000 rows per hour across the last hour, stop all further imports for this batch. Write the batch to a held_batches table with status = 'pending_review'. Alert the operations team immediately with batch_id, row_count, and affected sources. Resume only after manual clearance from operations.

---

## Silent failure guard

A source returning zero items is not an error. The chain downstream is skipped and the execution is written as success. An error workflow never fires on it.

Expected item count: 100-600 per run (depending on season; normal 200, peak 600, minimum 100)

Expected duration floor: 120 seconds (2 minutes for 45 parallel fetches plus parsing and dedup)

Guard node, required after step 1 (fetch from all sources):

    if ($input.all().length === 0) {
      throw new Error('job-market-multi-source-scan: all sources returned zero items');
    }

Duration is the real health signal. A broken source returning zero items is not caught by count alone. If the run completes in 5 seconds when normal is 2+ minutes, something is wrong (e.g. all sources timing out). Measure elapsed time and alert if it falls below 60 seconds.

---

## Escalation path

operations-team@company.internal, primary: Operations team lead

---

## Log format

Every error or forced gate is logged to the opportunity_scan_log table. Format:

```
[YYYY-MM-DD HH:MM:SS] [STATUS] <message>
```

Example:
```
[2026-08-20 14:35:22] [ERROR] Transient failure on step 5 (SQLite insert): disk full; quarantined batch 45829 to quarantine_records; alerted operations-team@company.internal
```

Retention: 90 days. Older logs are archived to cold storage monthly.
