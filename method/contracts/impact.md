# Contract 4: impact

Filled by the requester and builder together, before any build work starts. This contract defines what the automation is supposed to accomplish, how it will be measured, and the conditions under which it gets switched off.

## The critical timing: filled before, read after

This contract is filled during step 2 (scoping conversation), not afterwards. This matters because it belongs to the requester, not the builder. The requester is the only person who knows what the before value is, and the only one entitled to decide whether the result was worth keeping. By the time the automation runs, the before state has already disappeared. You cannot reconstruct 2 hours per week of manual work if nobody wrote down what it took today. Measuring afterwards never works because the baseline evaporates.

## Fields

**measure:** The quantifiable outcome the automation is supposed to deliver. Examples: "hours per week spent on manual data entry", "number of duplicate customer records per week", "cost per transaction in manual fulfillment", "email delivery errors per week". Must be a number, not a feeling.

**before_value:** The measured (or estimated) baseline before the automation runs. A number. Example: 18 (hours), 45 (duplicates per week), 2.15 (cost), 312 (errors). Even an estimate is valid and useful, but must be marked.

**before_source:** Where the before value came from. Example: "Sarah's timesheet, tracked daily for 2 weeks", "sample of 10 days of transaction data, projected to weekly rate", "manual count of duplicate records in the database". Concrete enough that another person can understand whether this number is reliable.

**before_date:** The date the before value was measured or estimated. Example: 2026-08-10. This date matters because volumes and costs change. A before value from March is different from one from August.

**before_estimated:** Boolean: true if the before value is an estimate (based on sampling, projection, or educated guess), false if it is a direct measurement. This flag is not a refusal. Estimates are tolerated. The flag protects downstream readers from mistaking an estimate for a measurement. It must surface in the read back method so nobody later forgets this was estimated.

**target_value:** What success looks like, expressed in the same measure. Example: "2 hours per week", "0 duplicates per week", "0.25 cost per transaction", "fewer than 5 errors per week". If the target is vague or aspirational, contract 1 (request) would have caught it.

**read_back_method:** The exact procedure to measure the outcome 30 days later. Concrete enough that a different person could run it without asking questions. Examples: "query the job deduplication log table using this SQL query", "export hours from Maya's timesheet for the week of automation launch", "run this dashboard report on the accounting system and compare to the before value". Not "we will check if it worked". Specific: which database, which query, which report, which system, which export format.

**read_back_date:** When the read back happens, typically 30 days after the automation launches. Example: 2026-09-15. Defaults to 30 days after release if not specified. This date is a calendar item for the owner: on this date, they know they will spend time measuring.

**read_back_owner:** The person accountable for running the read back and reporting the result. One named person. Example: "Sarah Martinez, Lead Operations Manager". This person will receive a calendar reminder on the read_back_date. It is often the same person as the automation owner from contract 1.

**abandon_condition:** The threshold or event that would cause the automation to be switched off. Example: "if weekly manual time remains above 8 hours after 30 days, switch off and return to manual matching", or "if error rate exceeds 5%, hold and investigate; if root cause cannot be fixed within 7 days, switch off by [date]". This is not optional. An automation nobody can switch off becomes permanent debt, with no exit and no question asked.

## Refusal rules

| Rule | Refuses when |
|---|---|
| M1 | The measure is not quantifiable. |
| M2 | The before value is estimated rather than measured. Tolerated, but marked "estimated" and visible in the read back. |
| M3 | No read back method described. Otherwise nobody ever reads it back, which is what happens everywhere. |
| M4 | No read back date. |
| M5 | No abandon condition. An automation nobody can switch off becomes permanent debt. |

When a field violates a rule, the response returns the requester the precise question missing, never a rejection wall.

## Filled example

```
measure: time per week spent manually matching job candidates to open positions
before_value: 18
before_source: Sarah tracked her time on this task for weeks of 2026-07-22 and 2026-07-29, daily entries in her timesheet. Averaged the two weeks.
before_date: 2026-08-05
before_estimated: false
target_value: 2
read_back_method: query Sarah's timesheet for the week beginning 2026-09-08 (first full week after automation launch), export hours logged against task code CANDIDATE_MATCHING, sum hours for that week, compare to 18. If timesheet data is incomplete for any day, note the missing dates in the report.
read_back_date: 2026-09-15
read_back_owner: Sarah Martinez, Lead Operations Manager
abandon_condition: if Sarah spends more than 8 hours per week on candidate matching after 30 days, we will switch off the automation and return to the previous manual process. If time is between 2 and 8 hours, we will investigate which part of the workflow is causing friction and hold for 7 days to fix. If still not below 4 hours per week after the fix, switch off by 2026-09-27.
```

This example shows requester and builder together: they know what is being measured (hours), what the baseline is (18, direct measurement), when it will be read (Sept 15), how it will be read (from timesheet, specific query), and crucially, what happens if the result does not meet expectations. The abandon condition gives the requester agency: they can switch it off if the benefit is not there.

## Why this contract matters in practice

**Impact is the differentiator.** Automation can be built by many tools and many people. What separates a working automation from decoration is knowing whether it delivered value, and having a plan to stop it if it did not. This contract is where that judgment gets made. Without it, automations drift into production and stay there for years doing invisible harm because nobody can point to a specific person saying "this stopped being worth it" and nobody can point to a date saying "on this date we stopped believing the numbers".

Filled at step 2 means the requester is still in the room when the question is asked. They have context. They know what the manual baseline really is, and they can name the real cost of continuing without the automation. It also means there is no blame later: if the automation does not deliver, the requester chose the target and the abandon condition, not the builder.

## Key consequences

**Safety cap and testing depend on target_value.** If you automate processing 10k items per week when the baseline was 100 items, the volume increase itself becomes a cost. The safety cap from contract 3 prevents runaway effects, but only if the target value was realistic.

**Read back method blocks a common failure.** The most common reason impact contracts fail is that the read back never happens. The method must be specific enough to run on schedule, every time. A method that requires "checking the dashboard" will be skipped. A method that requires "run this query, compare to this number" will be run.

**Abandon condition prevents permanent debt.** The requester decides what is good enough and what is not. If the requester says "we are happy with 50% reduction", that is their call. But they must name the threshold before the automation launches, when they still have clarity about value.
