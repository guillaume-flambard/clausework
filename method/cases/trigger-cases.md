# Trigger contract cases

Test cases for T1 through T4, derived from the refusal rules in `method/contracts/trigger.md`.

### T1 passes

```
trigger_type: schedule (daily 9am)
system_of_record: HubSpot deals
volume_normal: 40 deals per day
volume_peak: 200 deals per day
peak_cause: end-of-month push by sales team, consistently last 3 days of calendar month
latency: acceptable within 2 hours
replay_behaviour: deduplication by deal ID within 24-hour window
catch_up_window: 48 hours after outage
order_matters: yes, deals must be processed chronologically by close date
```

Why it passes: peak volume is stated with a named cause that is predictable. End-of-month is a real pattern, not abstract. The builder can plan for the load spike and know when it repeats.

### T1 refuses

```
trigger_type: webhook from Zapier
system_of_record: form submissions on website
volume_normal: approximately 50-60 submissions daily
volume_peak: (blank)
latency: as soon as possible
replay_behaviour: deduplicate on email address
catch_up_window: 24 hours
order_matters: no
```

Response: What is the peak volume and when does it occur? You have an average of 50 to 60 per day. What is the highest single day or hour you have seen, and what causes it (campaign launch, seasonal event, conference)? We need the peak to plan capacity and test the workflow at load.

### T2 passes

```
trigger_type: webhook from Shopify
system_of_record: Shopify orders
volume_normal: 10 orders per hour
volume_peak: 150 orders per hour
peak_cause: flash sale or holiday seasonal event, unpredictable timing but occurs 3-4 times per year
latency: order confirmation sent within 30 seconds
replay_behaviour: if the same order webhook arrives twice within 5 minutes, the second is dropped using order ID deduplication. If the same order is retried after 5 minutes, it is treated as an intentional resend and processed again.
catch_up_window: 72 hours (Shopify webhook retry window is 72 hours)
order_matters: yes, order items must be processed sequentially by line item ID
```

Why it passes: replay behavior is fully specified: the dedupe key (order ID), the window (5 minutes), and what happens on retry after that window. This answer determines the entire design of contract 3.

### T2 refuses

```
trigger_type: webhook from Stripe
system_of_record: Stripe payment events
volume_normal: 200 payment events per day
volume_peak: 800 payment events per day
peak_cause: month-end batch billing
latency: within 10 seconds
replay_behaviour: (blank)
catch_up_window: 24 hours
order_matters: no
```

Response: What happens when the exact same event arrives twice (for example, a payment webhook retried by Stripe)? Should the automation process it, discard it, or use a dedupe key? This answer controls how we design idempotency in contract 3, so we must have it before proceeding.

### T3 passes

```
trigger_type: webhook from GitHub
system_of_record: GitHub pull request events
volume_normal: 20 PR events per day
volume_peak: 80 PR events per day
peak_cause: sprint cutoff day when multiple teams merge PRs before deadline
latency: comment posted to PR within 2 minutes
replay_behaviour: deduplicate by PR number plus comment ID, 1-hour window
catch_up_window: GitHub sends webhooks for 72 hours before giving up; our catch-up process listens to the GitHub API polling trigger (runs every 15 minutes) for any PR closed in the last 7 days that has no corresponding comment. If a webhook was lost, the polling trigger finds it on next run.
order_matters: no
```

Why it passes: webhook catch-up strategy is concrete. If a webhook is lost, the polling trigger acts as a safety net. This is buildable and testable.

### T3 refuses

```
trigger_type: webhook from Slack
system_of_record: Slack message events
volume_normal: 30 messages per day
volume_peak: 150 messages per day
peak_cause: during company all-hands meeting
latency: reaction added to message within 30 seconds
replay_behaviour: deduplicate by message TS (timestamp) within 5 minutes
catch_up_window: (blank)
order_matters: yes
```

Response: If a webhook is lost (Slack failed to deliver it, or our endpoint was down), how do we catch up? Webhooks are delivered once, then dropped. Slack does not retry indefinitely, and there is no way to query "give me all messages since I last saw one". Without a catch-up strategy (a polling trigger, a message history API call, or a manual review), any lost webhook is lost permanently. You need a catch-up method or acceptance that message processing is not guaranteed.

### T4 passes

```
trigger_type: polling
system_of_record: Salesforce accounts
volume_normal: 100 new accounts per day
volume_peak: 400 new accounts per day
peak_cause: after quarterly webinar, 1 week spike in lead conversion
latency: new account processed within 1 hour
replay_behaviour: deduplicate on account ID within 24-hour sliding window
catch_up_window: 48 hours (poll every 30 minutes; back-read to 48 hours ago)
order_matters: yes, accounts must be processed by their CreatedDate in ascending order
cursor_field: CreatedDate (timestamp of account creation in Salesforce)
```

Why it passes: polling uses a named cursor field (CreatedDate). The polling trigger can state "get all accounts created since my last successful read of CreatedDate = 2026-08-15T14:30:00Z". Each run advances the cursor. Duplicates and gaps are prevented by sorting on the cursor and never jumping backward.

### T4 refuses

```
trigger_type: polling
system_of_record: HubSpot leads
volume_normal: 50 leads per day
volume_peak: 300 leads per day
peak_cause: end of month push from marketing
latency: lead processed within 2 hours
replay_behaviour: deduplicate on email address
catch_up_window: 48 hours
order_matters: no
cursor_field: (blank)
```

Response: Which field should the polling trigger use to track progress (for example, date created, date updated, or a sequence number)? Without a named cursor field, the polling job cannot know where it stopped on the last run. It will either reprocess old leads (duplicates) or skip leads created while it was running (gaps). Both outcomes are guaranteed. Name the field that marks each record's position in sequence.
