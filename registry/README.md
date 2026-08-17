# Registry

One automation is one directory. Each directory holds seven files: the four contracts, the flow spec, the runbook, and a record file carrying status, owner, workflow id, key dates, and the decision log.

Every workflow created through Clausework carries an n8n tag `reg:<slug>`. Every registry record carries the workflow id in its header, linking both ways. Any workflow without a `reg:` tag is by definition out of process.

## Two rules that keep an entry from going stale

**1. Every entry header carries a review date.** Volumes double and effect inventories do not follow on their own. On the review date, the owner opens the entry and confirms the contracts still hold. If something has changed, the contracts are updated and the review date advances.

**2. Adding a side effecting node reopens contract 3.** The effect inventory is what the release gate and two of the six test cases read from, so an inventory that lags is a gate that has stopped working. When a new side effect is added to the workflow, the idempotency contract must be re-examined and the effects table updated before the workflow runs again in production.

## Entries

- `job-market-multi-source-scan` - A multi-source scanning pipeline that aggregates job opportunities from 45 distinct sources into a single store, deduplicated by nothing. Measured to carry 982 duplicate rows representing a third of the table, with 80 rows in a new state while the same organisation already has acted-on rows. This is the failure case that contract 3 exists to prevent.
