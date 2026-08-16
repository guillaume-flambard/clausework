# Contract 1: the request

Filled by the business requester, through the intake form, before any conversation. This contract defines the automation's scope, who is responsible, and what success looks like.

## Fields

**owner:** The single named person accountable for this automation. Not a team, not a department name. One person's name and title.

**trigger_sentence:** The automation expressed in one sentence: "When X happens, then do Y." This captures the business event and the immediate response. It is not a wish or a goal; it is a condition and an action.

**today_manual:** How this work is done by hand today. Include volume (number of records, frequency), time spent, and who does it. Example: "Sarah spends 2 hours every Tuesday importing 15-20 new prospects."

**success_observable:** How you will know the automation worked. Must be measurable and specific. Examples: "100% of records processed within 4 hours", "zero duplicate emails sent", "all items matched to the correct account". "Saves time" does not pass this field.

**never_happens:** The worst case. Every flow touching customer data has one. Examples: "a customer receives two renewal emails", "a payment is charged twice", "the wrong account is updated". Cannot be empty.

**systems:** The systems touched by this automation, listed by name. Example: "HubSpot (lead data), Slack (notifications), Email (delivery)". This is a checklist for the scoping conversation to verify integrations exist and credentials are available.

**deadline_reason:** Why this deadline matters. The reason, not just the date. Example: "Q3 OKR to automate manual lead processing" or "customer churn mitigation for renewal season". This prevents automations built by schedule rather than by need.

## Refusal rules

| Rule | Refuses when |
|---|---|
| R1 | No named person as owner. A team is not an owner. |
| R2 | The need does not fit "when, then". It is a wish, not an automation. |
| R3 | No current volume figure, even approximate. Without it there is no sizing and no impact measurement. |
| R4 | Success is not observable. "Save time" does not pass. |
| R5 | The "what must never happen" field is empty. Every flow touching a customer has a worst case. |

When a field violates a rule, the form returns the requester to that field with the precise question missing, never a rejection wall.

## Filled example

```
owner: Jennifer Walsh, Head of Sales Development
trigger_sentence: When a deal in HubSpot closes at $50k or more, then create a launch task in Jira and send a welcome email to the primary contact.
today_manual: Jennifer spends 5 hours per week manually creating tasks and sending emails for enterprise deals. Approximately 40-50 deals close at this level per week.
success_observable: 100% of enterprise deals over $50k have a launch task created in Jira and a welcome email sent to the primary contact within 1 hour of deal close, with zero duplicate emails sent within a 24-hour window.
never_happens: a launch task is created twice for the same deal, or a customer receives duplicate welcome emails.
systems: HubSpot (deal data), Jira (task management), Gmail (email delivery).
deadline_reason: Q3 OKR to automate 80% of enterprise deal onboarding by September 30, reducing manual overhead before peak renewal season.
```

## Scope boundary

**The intake form stops here.** These five questions (R1 through R5) are all a business requester fills in alone. Everything else belongs to a scoping conversation between the builder and the requester:

- Trigger details (what if the event arrives twice? what happens after an outage?).
- How the work is orchestrated (what order, how many retries, what happens if something breaks).
- Which exact fields are matched or transformed (the flow spec).
- How to know if the automation did not fail silently.
- What the worst case costs, and whether it is worth preventing.

Keep the form light. A heavier form sends the requester back to Slack.
