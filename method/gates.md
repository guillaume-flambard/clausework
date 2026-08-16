# Gates

The nineteen blocking rules that guard the method. Every automation must pass all of them before proceeding to the next step, as defined in the end-to-end flow in `method/overview.md`.

| Rule | Refuses | Question |
|---|---|---|
| R1 | No named person as owner. A team is not an owner. | Who is the named person responsible for this automation? We need one individual owner, not a team. |
| R2 | The need does not fit "when, then". It is a wish, not an automation. | What specific event or condition starts this automation, and what single action follows? (Format: "When X happens, then do Y.") |
| R3 | No current volume figure, even approximate. Without it there is no sizing and no impact measurement. | How many items arrive per week or per day, and how much time does the current manual work take? Even an estimate matters. |
| R4 | Success is not observable. "Save time" does not pass. | Describe what success actually looks like. How many records, sent to whom, by what deadline? What is an error, and what is not? |
| R5 | The "what must never happen" field is empty. Every flow touching a customer has a worst case. | What is the worst case that must never happen? For example, charging a customer twice, sending to the wrong email, creating duplicates, or updating the wrong account? |
| T1 | No peak volume. Peaks break things, averages never do. | What is the peak volume and when does it occur? You have an average, now tell us the highest single day or hour ever seen, and what causes it. |
| T2 | Replay behaviour unanswered. It determines all of contract 3. | What happens when the exact same event arrives twice? Should the automation process it, discard it, or use a dedupe key? |
| T3 | A webhook with no catch up strategy. A lost webhook is lost forever. | If a webhook is lost, how do we catch up? Webhooks are delivered once, then dropped. What is your catch-up method? |
| T4 | Polling with no named cursor field. Duplicates or gaps are guaranteed. | Which field should the polling trigger use to track progress? Without a named cursor field, the polling job cannot know where it stopped. |
| I1 | No dedup key, or a key named without saying where its state lives. | The dedup key is named, but where does its state live? That memory must persist across workflow executions: a Data Table, SQL table, or cache. |
| I2 | A customer visible effect missing from the inventory. | The workflow sends effects that reach customers, but they are not all in the effects inventory. Every effect visible to customers must be listed. |
| I3 | An irreversible effect ordered before a reversible one. It gets reordered. | Reorder the effects. Irreversible effects must go last. If something fails midway, reversible work can still be retried or undone. |
| I4 | No safety cap on a flow that sends mail or writes to a CRM. This is what prevents 4000 emails at 3am. | This flow sends mail or writes to a CRM, but there is no safety cap. Without one, the workflow can send unlimited emails if a spike occurs. Specify a cap. |
| I5 | Side effecting nodes with no error branch. The how is delegated to the `n8n-error-handling` skill. | These side effecting nodes lack error branches. If the external system fails, the error is not captured or routed to recovery. |
| M1 | The measure is not quantifiable. | Express this as a number that can be counted: hours per week, items per day, errors per week, cost per transaction, or percentage complete. |
| M2 | The before value is estimated rather than measured. Tolerated, but marked "estimated" and visible in the read back. | You provided an estimated before value but before_estimated is not marked as true. This flag must surface in the read back. |
| M3 | No read back method described. Otherwise nobody ever reads it back, which is what happens everywhere. | No read back method. Describe the exact method: which system, which log, which query? Write it as concrete as a recipe. |
| M4 | No read back date. | When will you read this back? Set a specific date. Without one, the read back is forgotten. |
| M5 | No abandon condition. An automation nobody can switch off becomes permanent debt. | What condition would cause you to switch this automation off? Name the specific threshold or event. |

## The relief valve

Forcing a gate is allowed. When any of the nineteen rules is waived, a single line must be written into the automation's decision log:

```
forced: <rule>, <reason>, review date <YYYY-MM-DD>
```

Example:
```
forced: I4, pilot automation with internal test data only, review date 2026-09-01
```

A method that cannot be bypassed gets bypassed from the outside, and then the trace is lost. Here the bypass stays inside the system. The decision log is kept in the automation's registry entry, in the record file.

## The cap

Nineteen rules. Adding a twentieth requires removing one, or an entry in `docs/decisions.md` stating the reason and the replaced rule. This constraint prevents the method growing until it becomes unusable.

## The one rule with no relief valve

**Never test a customer effecting flow against production without switching its irreversible effects off.**

This is the only rule in the method with no relief valve. When an automation sends mail, charges a customer, or writes to a production CRM, all irreversible effects must be switched off during testing. Two accepted mechanisms:

1. A dry run flag that skips the irreversible step, returning a simulated success.
2. Sandbox credentials that route effects to a test system instead of production.

The contract 3 effect inventory already lists every irreversible effect by name. If an effect is marked irreversible and customer visible, it must be disabled during all testing phases. An automation that passes all six technical test cases while sending real emails or charges to production is not ready.
