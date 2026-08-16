# Contract 2: the trigger

Filled by the builder, in conversation with the requester. This contract defines how the automation starts, how often, what happens when events are duplicated or lost, and whether order matters to downstream work.

## Fields

**trigger_type:** The mechanism by which the automation receives events. Examples: webhook, schedule, polling, app event trigger (e.g. Slack slash command), manual trigger. This field names the entry point, not the configuration of the node.

**system_of_record:** The system that holds the authoritative data for this event. Example: "HubSpot deals" or "Shopify orders" or "Stripe payment events". This is the system that will be queried or subscribed to.

**volume_normal:** The routine daily or hourly event count. Include units: "40 deals per day" or "5 webhook calls per hour". This is the load the automation handles most of the time.

**volume_peak:** The highest single-day or single-hour event count ever seen, or ever expected. Must be accompanied by peak_cause. Peaks break automation designs that work at average load. Without it there is no load testing and no capacity planning.

**peak_cause:** The business reason the peak occurs. Examples: "end-of-month push by sales team", "holiday season surge", "campaign launch", "conference registration closes". A named cause is predictable; without it, you cannot plan or test for it.

**latency:** The acceptable time between the event occurring in the source system and the downstream effect completing. Examples: "within 2 hours", "as soon as possible (under 10 seconds)", "within 1 business day". This drives retry strategy and catch-up windows.

**replay_behaviour:** What happens when the exact same event arrives twice. Specify: the dedupe key (which field or combination of fields makes the event unique), the dedup window (how long to remember seeing it), and what happens on retry after that window expires. Example: "deduplicate on order ID within 5 minutes; after 5 minutes, a retry is treated as a fresh order and processed again." This answer determines the entire design of contract 3 (idempotency).

**catch_up_window:** The strategy for recovering events lost during an outage. For webhooks: name the polling backup trigger and its frequency. For polling: name the window (e.g. "48 hours back"). For schedules: state that there is no catch-up (schedules are point-in-time). Webhook without catch-up means those events are permanently lost. Polling without a named cursor means duplicates or gaps are guaranteed.

**order_matters:** Whether events must be processed in a specific sequence. If yes, state the order (e.g. "by CreatedDate ascending", "by event timestamp"). If no, state that. Order affects which node the cursor lives on and whether parallel processing is safe.

**cursor_field:** (Conditional, required for polling triggers only.) The field or timestamp the polling trigger uses to track progress between runs, so each execution knows where it stopped and avoids duplicates or gaps. Example: "CreatedDate" or "UpdatedTimestamp" or "LastModified". Omit this field entirely for webhook, schedule, and app event triggers. Rule T4 refuses a polling trigger that leaves this empty: without a named cursor, the polling job cannot know where it stopped on the last run, guaranteeing either reprocessing of old events (duplicates) or skipping events created during the run (gaps).

When replay_behaviour or volume_peak are left thin, contract 3 will be under-specified and test coverage for the two mandatory cases (Replay, Peak) will suffer. State those two field names explicitly when filling them: the precision you put in now determines what tests can prove later.

## Refusal rules

| Rule | Refuses when |
|---|---|
| T1 | No peak volume. Peaks break things, averages never do. |
| T2 | Replay behaviour unanswered. It determines all of contract 3. |
| T3 | A webhook with no catch up strategy. A lost webhook is lost forever. |
| T4 | Polling with no named cursor field. Duplicates or gaps are guaranteed. |

When a field violates a rule, the response returns the requester the precise question missing, never a rejection wall.

## Filled example

```
trigger_type: schedule (runs daily at 9am UTC)
system_of_record: Salesforce opportunities
volume_normal: 60 opportunities closed per day
volume_peak: 250 opportunities closed per day
peak_cause: end-of-quarter push; consistently occurs in the last 3 days of each quarter (Mar 31, Jun 30, Sep 30, Dec 31)
latency: new closed-won opportunity task created in Jira within 1 hour
replay_behaviour: deduplicate on opportunity ID within 24-hour window. After 24 hours, if the opportunity reappears in Salesforce (e.g. a closed opportunity reopens), it is processed again as a status change.
catch_up_window: schedule runs daily at 9am, querying all opportunities closed in the last 48 hours (in case yesterday's run failed). After-hours outages are caught on next scheduled run (maximum 24-hour delay).
order_matters: yes, opportunities must be processed by their CloseDate in ascending order to maintain correct sequencing in Jira
```

This example shows a builder and requester talking: they know the volume, the real peak and why it happens, the dedup strategy and its boundary (the 24-hour window), and that a reopen is a signal not a duplicate. No ambiguity is left for the next conversation.

## Load-bearing fields for testing

**volume_peak** generates the Peak test case in task 6. If left vague or unspecified, the automation cannot be load-tested.

**replay_behaviour** generates the Replay test case in task 6. If left unanswered, contract 3 cannot be written and the automation has no defence against duplicate effects (e.g. duplicate emails or double charges).

Fill these fields with precision. Thin answers here cost test coverage later.
