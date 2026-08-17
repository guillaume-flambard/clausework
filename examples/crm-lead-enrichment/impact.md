# Contract 4: impact and measurement

## Measurement plan

**Before value (current state):** The sales team spends 1 hour per week (52 hours per year) on manual enrichment. Measurement method: Jane tracks hours in her timesheet, visible in the team's Harvest time tracking system.

**After value (target):** All enrichment is automated, zero manual hours. Enrichment is complete within 5 minutes, allowing the sales team to work on leads immediately upon assignment.

**Measure:** Every Friday, run a Salesforce report filtering Lead.created_date for the past week, and count records where enrichment_attempted is NOT null. Compare to 40-50 expected leads. Calculate hours saved: (number of leads * 1 minute per lead) versus the former 60 minutes per week.

**Expected result:** First week data. If 50 leads arrive and all are enriched automatically, the team saves 50 minutes of manual work that week (the time it would have taken to enrich each one by hand). Scaled annually, this is approximately 40 hours saved per year.

## Read back date

Friday, 2026-09-20 (four weeks after deployment). At that point, the team will have experienced two peak Mondays and can confidently state whether the automation is keeping up and whether enrichment quality is better than manual work.

## Read back method

1. Salesforce report: count Lead records with enrichment_attempted timestamp in the date range 2026-08-23 to 2026-09-20.
2. Harvest timesheet: verify that Jane has NOT logged enrichment time in her timesheet for that same period.
3. Qualitative feedback: ask Jane and her team: "Are you able to work on leads immediately without waiting for enrichment data?"

This is concrete and requires no new systems.

## Abandon condition

If after four weeks either of these is true, the automation is switched off pending investigation:

1. Fewer than 30 leads were enriched in the week (suggests the webhook is not firing or enrichment is failing silently).
2. The enrichment_attempted field is missing data for more than 10% of leads arriving (suggests partial failures or false successes).
3. The sales team reports that they still manually verify enrichment data 30% of the time (suggests enrichment quality is still too low to trust).

If any condition is met, the automation is paused and a post-mortem is scheduled with the builder to identify whether to fix the automation or sunset it.
