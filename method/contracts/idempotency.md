# Contract 3: idempotency and effects

Filled by the builder, in conversation with the requester. This contract defines what happens when an event is processed twice, what side effects are generated, whether they can be undone, and what limits prevent runaway effects at scale.

**This is the only contract that blocks production release. The others block the next step.**

This contract exists to answer a question that stops automations in production: if we replay the workflow because something went wrong midway, what happens the second time? Every row of data in this contract is an answer to that question, and the decision is made in the calm, not during the incident.

## Fields

**dedup_key:** The exact field (or combination of fields) that uniquely identifies an event, and in which system of record it lives. Example: "order_id" or "invoice_number plus date". This is what you will query to check "have we seen this before?"

**dedup_state_store:** Where the deduplication state is persisted. Concrete: a Data Table by name, a SQL query on a specific connection, a Redis cache with a named key, or an external API that tracks state. "We will remember it" is not a valid answer. Specify where.

**effects:** An inventory table with one row per side effecting node (a node that changes state in another system). See "Effect inventory table" below. Every node that sends mail, writes to a database, makes an API call that changes data, posts to Slack, or triggers any downstream change is a side effect and must be listed here.

**effect_order:** The sequence in which effects happen. Critical rule: irreversible effects (payment charges, hard deletes, actions with no undo) go last. Everything else first. If something fails midway, reversible effects can still be retried or undone. Irreversible effects cannot.

**resume_point:** If the workflow fails midway, where does recovery start? Examples: "resume from pending email confirmations", "retry the charge only if CRM write succeeded", "start from the beginning if any effect failed". Without a clear resume point, recovery is guesswork.

**recovery_strategy:** Explicit: who does what when something fails. Examples: "if payment fails, human reviews the order and restarts charge", "if email send times out, retry once with backoff", "if data transform is invalid, quarantine and alert". This is not guesswork at incident time; it is written now.

**safety_cap:** The maximum number of effects per time window (usually per hour) at which the circuit stays open. When exceeded, the flow stops generating new effects. This is a hard limit, not a warning. Required for any flow that sends mail, posts to Slack, writes to a CRM, or charges payment. The cap is a circuit breaker, not an alert. An alert at 3am wakes nobody; a circuit breaker stops the disaster.

### Effect inventory table

The effects table is load-bearing for testing and release. It drives two of the six mandatory test cases (Broken data, Cap) and the release gate reads it to verify all customer-visible effects are accounted for.

| node | system | reversible | customer_visible |
|---|---|---|---|
| (name of the side-effecting node) | (the system it touches: Gmail, Salesforce, etc.) | yes or no | yes or no |

- **node:** The exact name of the node in the workflow.
- **system:** The external system it touches (Gmail, Slack, Salesforce, Stripe, etc.).
- **reversible:** Can this effect be undone? Sending an email (yes, if you unsend within seconds). Charging a payment (no, never). Posting to Slack (yes, delete the message). Deleting a database row (no, not without a backup).
- **customer_visible:** Does the customer see or experience this effect? Sending them an email (yes). Writing their name to your internal CRM (no). Charging their card (yes). Writing a log entry (no).

## Refusal rules

| Rule | Refuses when |
|---|---|
| I1 | No dedup key, or a key named without saying where its state lives. |
| I2 | A customer visible effect missing from the inventory. |
| I3 | An irreversible effect ordered before a reversible one. It gets reordered. |
| I4 | No safety cap on a flow that sends mail or writes to a CRM. This is what prevents 4000 emails at 3am. |
| I5 | Side effecting nodes with no error branch. The how is delegated to the `n8n-error-handling` skill. |

When a field violates a rule, the response returns the precise question missing, never a rejection wall.

## Fundamental constraint

**Automatic replay is forbidden on any flow carrying an irreversible effect.** This is not an opinion debated at incident time. Contract 3 already listed the irreversible effects, so the decision was made in the calm. Any automation touching an irreversible effect (charging a customer, deleting data, submitting a legal signature) has a resume_point and a recovery_strategy that requires human intervention before the irreversible step runs again. If your recovery strategy says "automatically retry the charge", it will be rejected at the release gate and sent back for redesign.

## Filled example

```
dedup_key: order_id
dedup_state_store: Data Table named order_replay_log
effects: (see effects table below)
effect_order: 1. send order confirmation (reversible), 2. deduct inventory (reversible), 3. charge payment (irreversible), 4. create fulfillment task (reversible)
resume_point: resume from "create fulfillment task" if payment charge succeeds; resume from deduction if charge fails
recovery_strategy: if charge fails, human review order and decides: skip charge or retry from charge step. Do not auto-retry charge. If deduction fails, retry once; if inventory is inconsistent, quarantine order and alert operations team.
safety_cap: 100 charges per hour
```

Effects table:

| node | system | reversible | customer_visible |
|---|---|---|---|
| send order confirmation | Gmail | yes | yes |
| deduct from inventory | Shopify | yes | no |
| charge payment | Stripe | no | yes |
| create fulfillment task | Jira | yes | no |

This example shows the builder and requester together: they know what gets deduped (order_id), where the log lives (a Data Table), every effect that happens and in what order, and crucially, what happens if something fails midway. The charge happens last because it cannot be undone. Everything before it can be. No ambiguity is left for the incident.

## Why safety_cap and effects table matter beyond this contract

**safety_cap** is read by the release gate. No workflow carrying mail, Slack posts, or payment charges reaches production without one.

**effects table** is read by two test cases (Broken data, Cap) and by the release gate. If you claim an effect is reversible but cannot prove it (no undo action in the workflow, no external API to revert it), the release gate catches it and sends you back.
