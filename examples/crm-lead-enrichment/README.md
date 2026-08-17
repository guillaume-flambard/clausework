# CRM Lead Enrichment

**This is an illustrative case**, not a real workflow. It is designed to show the method applied to a common sales scenario that readers will recognize, so that the contracts can be discussed in familiar language before reading another real case.

status: illustrative
owner: Jane Doe, Sales Development Manager
workflow_id: not_deployed
created: 2026-08-16

## Summary

This case walks through an automation that enriches new leads in one CRM by fetching additional data from a second CRM and external sources, then updates the original record with enriched fields. It is invented to demonstrate the method in a Sales context, showing how the four contracts apply to a familiar scenario: finding good prospect data and making sure it does not arrive twice.

## The scenario

A sales development team receives 40-50 new leads per week in Salesforce from various sources. For each lead, they manually search for additional information in Pipedrive to check whether the company is already known, then enrich the Salesforce record with industry, employee count, and last known contact date. This takes 1 hour per week. If the same prospect arrives from multiple sources, the team has created duplicate records and wasted effort. If enrichment fails partway through, some leads get enriched and others do not, leaving the record inconsistent.

## Why this case is here

This case demonstrates three uses of the method:

1. **Observable success is measurable, not a feeling.** The requester must describe what the automation produces in numbers: records per hour, fields populated, duplicates avoided. "Faster lead enrichment" does not pass R4; "100% of leads enriched within 5 minutes of arrival, zero duplicates, all eight fields populated" does.

2. **Worst case is never optional.** A sales automation that overwrites the wrong account is a disaster. R5 refuses vague answers like "nothing should go wrong"; it requires naming the exact worst case: "the automation enriches the wrong Salesforce record if dedup keys collide."

3. **Idempotency is not optional when the trigger is not atomic.** If the same lead arrives from multiple sources, the flow must have a named dedup key, a place where its state lives, and a recovery plan. Contract 3 breaks this into explicit questions so that later the automation does not silently create duplicates for months.

This case is not real. The job-market entry in the registry is real and demonstrates what happens when contract 3 is skipped.

## Decision log

```
[2026-08-16 12:00:00] [ILLUSTRATIVE] Case created to demonstrate R1-R5 (observable success), T1-T4 (dedup), and contract 3 (recovery) in a Sales context.
```
