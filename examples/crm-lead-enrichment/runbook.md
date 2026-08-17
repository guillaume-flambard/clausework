# Runbook: CRM Lead Enrichment

## Failure classes

Three failure classes are treated differently:

### Transient (rate limit, timeout, upstream 5xx)

Retry with growing backoff, capped, then escalate. This is the only case where retrying makes sense.

**Action.** Configure the retry node with exponential backoff, cap at 3 retries or 5 minutes of elapsed time, whichever comes first. On final failure, escalate to the on-call engineer per the escalation path below.

### Data (unexpected payload, missing field)

Quarantine, alert the owner, never retry. Retrying does not repair broken data, it burns quota and hides the problem.

**Action.** Route to a quarantine node (Data Table, S3 folder, or shared error workflow) and alert the owner. Do not attempt automatic replay.

### Partial effect (the automation did half the job)

The worst case, and the one contract 3 anticipated. Resume point, intervention per the recovery strategy, never an automatic replay.

**Action.** Check the resume point from contract 3. If contract 3 names a recovery strategy, follow it. If recovery is manual, stop the workflow and alert the owner with the state at the failure point. Do not automatically replay any automation carrying an irreversible effect.

**Automatic replay is forbidden on any flow carrying an irreversible effect.** Contract 3 already listed the irreversible effects, so this decision was made in the calm, not during the incident.

## Effect inventory

Copied from contract 3, effects table:

| node | system | reversible | customer_visible |
|---|---|---|---|
| Query Pipedrive | Pipedrive | yes | no |
| Query Clearbit API | Clearbit | yes | no |
| Update Salesforce record | Salesforce | no | yes |
| Notify Slack on failure | Slack | yes | no |

## Resume point

From contract 3: The resume point is the Pipedrive lookup. If the workflow fails after Pipedrive responds but before Salesforce update completes, the workflow can be replayed with Pipedrive data cached.

## Recovery strategy

From contract 3: If Pipedrive fails, the entire workflow is retried from the start on the next webhook or catch-up trigger.

## Safety cap

From contract 3: If more than 50 leads arrive in a single calendar day, the workflow emits an alert to the Sales Operations Slack channel and stops processing.

**The safety cap is a circuit breaker, not an alert.** Past the cap, it cuts. An alert at 3am wakes nobody; a circuit breaker stops the disaster.

## Silent failure guard

A node returning zero items is not an error in n8n. The chain downstream is skipped and the execution is written as `success`. An error workflow never fires on it.

Expected item count: exactly 1 per run (one lead per webhook).

Expected duration floor: 4 seconds.

Duration is the real health signal. On a documented case, a working run took 6 seconds and a broken run took 2 seconds (it skipped Pipedrive), both green, for which reason the guard fires if duration is under 2 seconds.

Guard node, required after the Pipedrive lookup:

    if ($input.all().length === 0) {
      throw new Error('crm-lead-enrichment: Pipedrive lookup returned zero items');
    }

Turning silence into a real error is what makes the alerting chain work at all.

## Escalation path

Jane Doe, Sales Development Manager (jane@company.slack.com), or on-call engineering team in #sales-automation-oncall.

## Log format

Every error or forced gate is logged to the record file under Decision Log. Format:

```
[YYYY-MM-DD HH:MM:SS] [STATUS] <message>
```

Example:
```
[2026-08-20 14:35:22] [ERROR] Transient failure on step 7: Salesforce API timeout after 3 retries, escalated to jane@company.slack.com
```
