# Impact contract cases

Test cases for M1 through M5, derived from the refusal rules in `method/contracts/impact.md`.

### M1 passes

```
measure: hours per week spent on manual lead matching
before_value: 18
before_source: Sarah's timesheet, tracked daily for 2 weeks in July
before_date: 2026-08-10
before_estimated: false
target_value: 2
read_back_method: query Sarah's timesheet for the week of automation launch, export hours logged against "lead matching"
read_back_date: 2026-09-15
read_back_owner: Sarah Martinez, Lead Operations Manager
abandon_condition: if weekly manual time remains above 8 hours after 30 days, switch off and return to manual matching
```

Why it passes: the measure is quantifiable (hours per week) and grounded in a real metric that can be counted and compared.

### M1 refuses

```
measure: improve team efficiency in lead processing
before_value: team currently handles leads inconsistently
before_source: general observation
before_date: sometime in July
target_value: team feels more efficient
read_back_method: ask the team if they feel better about lead work
abandon_condition: if team is unhappy
```

Response: The measure is not quantifiable. Express this as a number that can be counted: hours per week, items per day, errors per week, cost per transaction, or percentage complete by deadline. "Efficiency" and "feels better" cannot be measured.

### M2 passes

```
measure: number of duplicate customer records per week
before_value: 45 (estimated by reviewing a sample of 10 days of data and projecting to a full week)
before_source: Sample count from 2026-07-28 to 2026-08-07, projected to weekly rate
before_date: 2026-08-08
before_estimated: true
target_value: 0
read_back_method: query the deduplication log table (created during automation build) for the following week, count rows marked "duplicate_prevented"; report includes before_estimated: true to note this was measured from projection, not full weekly observation
read_back_date: 2026-09-15
read_back_owner: Database team
abandon_condition: if automation prevents fewer than 40 duplicates per week, we revert to manual matching and reassess
```

Why it passes: the before value is estimated (using projection from a sample), but before_estimated is explicitly marked as true. This flag surfaces in the read_back_method so the downstream reader knows the 45 figure is an estimate, not a direct measurement. The consequence is visible: any future comparison will note that the baseline was estimated.

### M2 refuses

```
measure: duplicate customer records per week
before_value: 50
before_source: we think we get about this many
before_date: 2026-07-31
before_estimated: (blank)
target_value: 10 or fewer
read_back_method: check the duplicate log after the automation launches
read_back_date: 2026-09-15
read_back_owner: Database team
abandon_condition: if duplicates are not reduced significantly
```

Response: You provided an estimated before value (50, based on "we think") but before_estimated is not set to true. When you read back 30 days from now, you will not know whether 50 was a direct count or an estimate. Mark before_estimated: true so the read back is clear about measurement precision. This prevents confusion later: an estimated before value discovered to have been estimated during the read back undermines the comparison.

### M3 passes

```
measure: hours per week on manual invoice entry
before_value: 12
before_source: Maya's timesheet, weeks of 2026-07-22 and 2026-07-29, average
before_date: 2026-08-05
before_estimated: false
target_value: 1
read_back_method: run this SQL query on the accounting database (connection: prod-postgres-1, schema accounting, user: impact_reader): SELECT week_of_date, SUM(hours) FROM timesheet WHERE employee_id = 'maya_torres' AND activity_code = 'MANUAL_INVOICE_ENTRY' GROUP BY week_of_date ORDER BY week_of_date DESC LIMIT 1. Export result to CSV and compare to 12 hours. Include in report the reconciliation of any timesheet entries marked "disputed" or "uncertain".
read_back_date: 2026-09-15
read_back_owner: Maya Torres, Accounting Manager
abandon_condition: if weekly hours remain above 3, or if the query reveals missing data for more than 2 days in the sample week, we review the automation's accuracy and decide whether to adjust or switch off
```

Why it passes: the read_back method is concrete enough that a different person could run it 30 days later. It names the database connection, the schema, the query, the employee filter, and the export format. No guesswork is required.

### M3 refuses

```
measure: time spent manually uploading documents to compliance storage
before_value: 6 hours per week
before_source: David's estimate
before_date: 2026-08-01
before_estimated: true
target_value: 0.5 hours per week
read_back_method: we will check the storage logs and see if uploads happened
read_back_date: 2026-09-15
read_back_owner: David Kim, Compliance Officer
abandon_condition: if the process is not automated by end of quarter
```

Response: No read back method described. "We will check the logs and see if uploads happened" is too vague. Describe the exact method: Which storage system? Which log? What dashboard or report shows the time per week? How will you query or export this data? Write it as concrete as a recipe so that in 30 days, David or another person can run it without guessing.

### M4 passes

```
measure: cost per transaction in manual order routing
before_value: 2.15
before_source: Finance exported monthly cost reports, divided by transaction count from June and July, averaged
before_date: 2026-08-10
before_estimated: false
target_value: 0.25
read_back_method: Finance will extract June transaction cost from the accounting system (cost center ORDER_ROUTING_MANUAL) and divide by transaction count from the order log, using the same method as the before calculation
read_back_date: 2026-09-15
read_back_owner: Finance team, cost accounting
abandon_condition: if cost per transaction is not below 0.50 after 30 days of automation
```

Why it passes: read_back_date is explicitly set. The owner and reader know when the measurement will happen and what to expect.

### M4 refuses

```
measure: cost per transaction in manual order routing
before_value: 2.15
before_source: Finance cost reports
before_date: 2026-08-10
before_estimated: false
target_value: 0.25
read_back_method: Finance will extract transaction cost from the accounting system and divide by transaction count
read_back_date: (blank)
read_back_owner: Finance team
abandon_condition: if cost is not reduced
```

Response: When will you read this back? Set a specific date (default: 30 days after the automation launches, which would be 2026-09-15). Without a date, the read back is forgotten, and nobody ever compares the before and after numbers.

### M5 passes

```
measure: number of email delivery errors per week from our customer notification system
before_value: 312
before_source: email delivery log, 2026-08-01 to 2026-08-08
before_date: 2026-08-08
before_estimated: false
target_value: fewer than 5 per week
read_back_method: query the email delivery log table (errors table, status='FAILED') for the automation's first week of operation, count rows, compare to 312
read_back_date: 2026-09-15
read_back_owner: Customer Communications Manager
abandon_condition: if errors are not reduced below 50 per week, switch off the automation on 2026-09-20 and revert to the previous email system. If errors remain between 50 and 150 per week, hold and investigate for 7 days; if root cause cannot be determined and fixed, switch off by 2026-09-27.
```

Why it passes: the abandon condition is clear and specific. It describes what success looks like (below 50), what happens if the automation fails (switch off on this date), and what happens in the gray zone (hold and investigate with a decision deadline). The owner knows exactly when and why the automation could be stopped.

### M5 refuses

```
measure: customer support ticket resolution time
before_value: 4.2 days average
before_source: support platform analytics
before_date: 2026-08-01
before_estimated: false
target_value: 2 days average
read_back_method: query support analytics dashboard for resolution time after automation launch
read_back_date: 2026-09-15
read_back_owner: Support Manager
abandon_condition: (blank)
```

Response: What condition would cause you to switch this automation off? An automation nobody can switch off becomes permanent debt. For example, "if resolution time does not improve below 3 days", "if system error rate exceeds 5%", "if support team rejects the change after 2 weeks". Name the specific threshold or event that would trigger a decision to stop the automation.
