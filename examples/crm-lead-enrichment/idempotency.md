# Contract 3: idempotency and effects

## Effects inventory

| node | system | reversible | customer_visible |
|---|---|---|---|
| Query Pipedrive | Pipedrive | yes | no |
| Query Clearbit API | Clearbit | yes | no |
| Update Salesforce record | Salesforce | no | yes |
| Notify Slack on failure | Slack | yes | no |

## Deduplication key and state

**Key:** Lead email address. The email is unique and immutable in Salesforce.

**State store:** Salesforce custom field `enrichment_attempted` (timestamp). Once an enrichment workflow runs for a lead email, this field is set to the execution timestamp. Any subsequent webhook for the same email within 24 hours checks this field and skips enrichment.

**Recovery:** If enrichment starts and crashes midway (e.g. Pipedrive responds but Salesforce update fails), the `enrichment_attempted` timestamp is NOT set. The next attempt (webhook replay or catch-up job) will retry and complete the enrichment. This allows the failed enrichment to be attempted again with fresh API responses.

## Safety cap

If more than 50 leads arrive in a single calendar day, the workflow emits an alert to the Sales Operations Slack channel and stops processing. The team must manually investigate the spike before processing can resume. This guard prevents runaway API quota consumption at Clearbit or unplanned load on Salesforce.

## Resume point

The resume point is the Pipedrive lookup. If the workflow fails after Pipedrive responds but before Salesforce update completes, the workflow can be replayed with Pipedrive data cached. If Pipedrive fails, the entire workflow is retried from the start on the next webhook or catch-up trigger.

## Silent failure guard

Expected item count per run: exactly 1 (one lead per webhook).

Expected duration floor: 4 seconds minimum. If a run completes in under 2 seconds, the guard must fire because something was skipped (no Pipedrive lookup happened, or Salesforce update was bypassed).
