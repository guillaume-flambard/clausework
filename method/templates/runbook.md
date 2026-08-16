# Runbook template

The runbook is derived entirely from the contracts, inventing nothing. Every line comes from the four contracts that precede it. The runbook is filled by hand in layer 1; from layer 2 onward it is generated.

## Example structure

```markdown
# Runbook: <automation name>

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
| (copy from contract 3) | (copy from contract 3) | (copy from contract 3) | (copy from contract 3) |

## Resume point

From contract 3: (copy resume_point field)

## Recovery strategy

From contract 3: (copy recovery_strategy field)

## Safety cap

From contract 3: (copy safety_cap field)

**The safety cap is a circuit breaker, not an alert.** Past the cap, it cuts. An alert at 3am wakes nobody; a circuit breaker stops the disaster.

## Silent failure guard

A node returning zero items is not an error in n8n. The chain downstream is
skipped and the execution is written as `success`. An error workflow never
fires on it.

Expected item count: <n per run>
Expected duration floor: <seconds>

Duration is the real health signal. On a documented case, a working run took
4m30s and the broken run took 63ms, both green, for five days.

Guard node, required after any node that can legitimately emit nothing
(file reads, filters, IF branches, HTTP calls with empty results, database
queries with no rows):

    if ($input.all().length === 0) {
      throw new Error('<flow name>: <source> produced zero items');
    }

Turning silence into a real error is what makes the alerting chain work at all.

## Escalation path

(Name the person or team who receives page-outs at 3am. Example: "oncall-engineers@company.slack.com", or "Sarah Martinez, Primary On-Call". If the on-call engineer differs from the business owner in contract 1, note both names here; otherwise use the owner name from contract 1.)

## Log format

Every error or forced gate is logged to the record file under Decision Log. Format:

```
[YYYY-MM-DD HH:MM:SS] [STATUS] <message>
```

Example:
```
[2026-08-20 14:35:22] [ERROR] Transient failure on step 3: Stripe API timeout after 3 retries, escalated to oncall-engineers@company.slack.com
```
```

## How to fill it

1. Copy the three failure classes section as-is.
2. Copy the effect inventory table from contract 3.
3. Copy the resume_point, recovery_strategy, and safety_cap fields from contract 3.
4. Fill in the silent failure guard section with the expected item count per run and the expected duration floor (in seconds) from your test cases.
5. Name the escalation path: who gets paged when something breaks.
6. The log format is standard; copy it as-is.

## What does NOT go here

The runbook carries failure handling and the operational log, not node configuration. Node configuration guidance is delegated to the n8n MCP server and its skills.

## Testing the runbook

Every line of the runbook must be testable by running the six test cases from `method/testing.md`. If a line of the runbook (e.g. "the circuit opens at 50 effects per hour") cannot be exercised by one of the six cases, it is speculative and does not belong in the shipped runbook.
