# Idempotency contract cases

Test cases for I1 through I5, derived from the refusal rules in `method/contracts/idempotency.md`.

### I1 passes

```
dedup_key: order_id
dedup_state_store: Data Table named order_dedup_log
effects: (see effects table below)
effect_order: send confirmation email, then write to revenue ledger
resume_point: last successful revenue write; resume from pending email confirmations
recovery_strategy: reconcile pending confirmations against order log; human review required before retry
safety_cap: 500 effects per hour
```

Effects table:

| node | system | reversible | customer_visible |
|---|---|---|---|
| send confirmation email | Gmail | yes (can unsend within 30s) | yes |
| write to revenue ledger | QuickBooks | no | no |

Why it passes: dedup key is named (order_id), and its state lives in a Data Table, which persists across executions and can be queried.

### I1 refuses

```
dedup_key: customer_email
dedup_state_store: (blank)
effects: send welcome email, post to CRM
effect_order: post to CRM first, then send email
resume_point: (blank)
recovery_strategy: human review
safety_cap: 100 per hour
```

Response: The dedup key (customer_email) is named, but where does its state live? If you choose to remember "we already sent a welcome to this email", that memory must live somewhere that persists across workflow executions: a Data Table, a SQL table, or a cache with a clear expiration. Without it, the next time this workflow runs, it has no way to know whether the email was already sent.

### I2 passes

```
dedup_key: quote_id within 24-hour window
dedup_state_store: Data Table named quote_dedup
effects: (see effects table below)
effect_order: send quote email, then add to CRM
resume_point: point after email is sent
recovery_strategy: verify email delivery log, then proceed to CRM update
safety_cap: 200 per hour
```

Effects table:

| node | system | reversible | customer_visible |
|---|---|---|---|
| send quote email | Gmail | yes | yes |
| add to Salesforce deals | Salesforce | yes | yes |

Why it passes: both customer-visible effects (sending an email and adding to CRM) are listed in the inventory. Nothing unexpected reaches the customer.

### I2 refuses

```
dedup_key: contact_id within 48-hour window
dedup_state_store: Data Table contact_requests
effects: (see effects table below)
effect_order: post to CRM, send notification to Slack, create follow-up task
resume_point: after CRM write
recovery_strategy: check CRM log
safety_cap: 150 per hour
```

Effects table:

| node | system | reversible | customer_visible |
|---|---|---|---|
| post to Salesforce | Salesforce | yes | no |
| create follow-up task | Jira | yes | no |

Response: The workflow sends a notification to Slack about this contact. Slack receives a message that appears in a customer-facing channel. That is a customer-visible effect, but it is not in the effects inventory. Every effect that reaches a customer (or appears in a system they monitor) must be listed here, so we know what happens on replay.

### I3 passes

```
dedup_key: order_id within 30-minute window
dedup_state_store: Data Table order_dedup
effects: (see effects table below)
effect_order: 1. send order confirmation (reversible), 2. deduct inventory (reversible), 3. charge payment (irreversible)
resume_point: after deduction or before charge
recovery_strategy: check charge log; if charged, mark as complete; if not charged, rerun from charge step
safety_cap: 1000 per hour
```

Effects table:

| node | system | reversible | customer_visible |
|---|---|---|---|
| send order confirmation | Gmail | yes | yes |
| deduct from inventory | Shopify | yes | no |
| charge payment | Stripe | no | yes |

Why it passes: the irreversible effect (charge payment) comes last. Everything that can be undone happens first. If the charge fails midway, the previous steps (email, inventory) can still be rolled back or retried without risk.

### I3 refuses

```
dedup_key: invoice_id within 24-hour window
dedup_state_store: Data Table invoice_dedup
effects: (see effects table below)
effect_order: 1. charge payment (irreversible), 2. send invoice email (reversible), 3. log to accounting system (reversible)
resume_point: before charge
recovery_strategy: check charge log before proceeding
safety_cap: 500 per hour
```

Effects table:

| node | system | reversible | customer_visible |
|---|---|---|---|
| charge payment | Stripe | no | yes |
| send invoice email | Gmail | yes | yes |
| log to accounting | QuickBooks | yes | no |

Response: Reorder the effects. An irreversible effect (charge payment) is ordered before reversible ones (send email, log to accounting). If the payment charge fails midway, the email and logging have already happened, and you cannot undo them to match the payment state. Reorder so all reversible effects come first, and irreversible effects go last. This way, if something fails, the reversible work can be undone.

### I4 passes

```
dedup_key: event_id within 5-minute window
dedup_state_store: Data Table event_dedup
effects: (see effects table below)
effect_order: send notification, update CRM
resume_point: after update
recovery_strategy: check CRM log; if notification sent but update failed, retry update only
safety_cap: 50 emails per hour
```

Effects table:

| node | system | reversible | customer_visible |
|---|---|---|---|
| send customer notification | Gmail | yes | yes |
| update Salesforce record | Salesforce | yes | yes |

Why it passes: the workflow sends mail. A safety_cap is specified: 50 emails per hour. If the workflow receives a spike and tries to send more than 50 emails in one hour, the circuit opens. No email is sent after the cap is reached. A circuit breaker, not an alert.

### I4 refuses

```
dedup_key: customer_id within 48-hour window
dedup_state_store: Data Table customer_dedup
effects: (see effects table below)
effect_order: send marketing email, write to lead database
resume_point: (blank)
recovery_strategy: replay the entire workflow if anything fails
safety_cap: (blank)
```

Effects table:

| node | system | reversible | customer_visible |
|---|---|---|---|
| send marketing email | Gmail | yes | yes |
| write to lead database | Salesforce | yes | no |

Response: This flow sends mail, but there is no safety_cap. Without a cap, the workflow can send unlimited emails in a window. If the trigger source sends 5000 events at once (a bug, a data sync, a broken upstream system), this workflow will attempt to send 5000 emails. That is the failure mode the cap prevents. Specify a safety_cap: the maximum number of emails per hour. Beyond that number, the circuit opens and stops sending. A circuit breaker stops the disaster; an alert at three in the morning wakes nobody.

### I5 passes

```
dedup_key: ticket_id within 24-hour window
dedup_state_store: Data Table ticket_dedup
effects: (see effects table below)
effect_order: post comment to Slack, add label to GitHub issue
resume_point: after Slack post
recovery_strategy: check Slack history; if post found, skip to next step; else post and retry
safety_cap: 200 per hour
```

Effects table:

| node | system | reversible | customer_visible |
|---|---|---|---|
| post comment to Slack | Slack | yes | yes |
| add label to GitHub | GitHub | yes | yes |

Error branches configured: yes, both Slack and GitHub nodes have error branches routing to a shared error workflow.

Why it passes: all side effecting nodes (Slack post, GitHub label add) have error branches. If Slack is down or GitHub returns a 500, the error is caught and routed to recovery, never silently skipped.

### I5 refuses

```
dedup_key: notification_id within 1-hour window
dedup_state_store: Redis cache (30-minute TTL)
effects: (see effects table below)
effect_order: send Slack message, write to Datadog
resume_point: after Slack
recovery_strategy: check Slack API logs
safety_cap: 100 per hour
```

Effects table:

| node | system | reversible | customer_visible |
|---|---|---|---|
| send Slack message | Slack | yes | yes |
| write metric to Datadog | Datadog | yes | no |

Response: The Slack message node and the Datadog node are side effecting, but neither has an error branch. If Slack returns a rate limit (429) or Datadog is unreachable, the node fails and the workflow stops. The error is not captured, not routed to recovery, and not visible in a shared error log. This is handled by the `n8n-error-handling` skill, which documents error branch patterns for each node type. Add error branches to both nodes before deploying.
