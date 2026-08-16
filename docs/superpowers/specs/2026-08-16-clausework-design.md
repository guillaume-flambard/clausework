# Clausework: design

Date: 2026-08-16
Status: approved by Guillaume, section by section, on 2026-08-16
Author: brainstormed with Claude Code, decisions by Guillaume

## 1. Purpose

Clausework is an engineering method for n8n automations. Its spine is four contracts that
are allowed to **refuse**: the request, the trigger, idempotency and effects, and impact.

The problem it solves is not how to configure an n8n node. That ground is already covered
by the n8n MCP server and its skills. The problem is upstream and downstream: fuzzy
business intent that costs a week before anyone notices it was never buildable, and
automations that reach production without anyone knowing what happens on replay, what
breaks irreversibly, or whether the thing was ever worth building.

The method serves two audiences at once. The person who builds (an automation engineer
working with an AI agent), and the business teams who file requests (Sales, Customer
Success, Finance). Both touch the same artifacts.

## 2. Non-goals

- No node configuration guidance. That is delegated to the n8n MCP server and its skills.
- No dependency on BMAD. Clausework stands alone. Keelwork may wrap it later.
- No n8n hosting, deployment or infrastructure concern.
- No portfolio governance in the first delivery. Deliberately deferred, see section 11.
- No citizen developer program. Business teams file requests, they do not build.

## 3. Decisions taken during design

| Question | Decision | Why |
|---|---|---|
| Standalone or a Keelwork module | Standalone | A two person team attached to marketing will never install BMAD. Requiring it kills adoption. |
| Who uses the method | Builder plus business requesters | The bottleneck is translating business intent, not wiring nodes. |
| Material form | A portable repository, markdown first | It must be readable and applicable with no tooling installed. |
| Source of truth for a workflow | n8n for the workflow JSON, git for the method artifacts | Fighting the canvas is how every "n8n in git" effort dies. n8n already exposes version history and rollback. |
| Lifecycle covered | Closed loop, request through to a measured impact | Impact measurement is the differentiator and no one in the n8n ecosystem does it. |
| Organising spine | Contracts that refuse, not roles and not phases | A gate that blocks is what makes a method solid rather than decorative. |
| Safety cap (I4) | Blocking | It is the guardrail missing from most production n8n workflows. |
| Abandon condition (M5) | Blocking | An automation nobody can switch off becomes permanent debt. |
| When the impact contract is filled | At step 2, during the scoping conversation | It belongs to the requester, and that is the only moment the before number still exists. |
| Test set | All six cases mandatory, none removable | They are derived from the contracts, so they cost nothing to decide. |
| Portfolio governance | Designed on paper, not built | It needs a real portfolio and real users, otherwise it is designed blind. |

## 4. Architecture

Three layers. Only one of them is mandatory.

### Layer 1: the front door

An n8n workflow serving a request form. The business requester fills it in without any
installation. Output: a request contract written into the registry.

It is also the method demonstrating itself, since the front door of a method for building
automations is an automation.

### Layer 2: the core

Markdown, nothing else. The four contract templates and their refusal rules, the flow spec
template, the runbook template, and a single file gathering every blocking rule.

**This is the only mandatory layer.** It can be read and applied by hand, with no agent, no
MCP server and no n8n instance. Someone who takes only this still has a working method.
This constraint is what makes it adoptable by a two person team, and it is not negotiable
in implementation.

### Layer 3: execution

Pure delegation. The n8n MCP server and its skills handle building, node validation and
publishing. Clausework decides **when** you are allowed to call them, never **how** to
configure a node. Nothing from that layer is reimplemented here.

## 5. The registry and the anchor

One automation is one directory: `registry/<slug>/`. It holds the four contracts, the flow
spec, the runbook, and a record file carrying status, owner, workflow id, key dates and any
forced gates, with the decision log in its body.

Everything about one automation is legible in one place, by a human, two years later,
without opening n8n.

### The anchor

Every workflow carries an n8n tag `reg:<slug>`. Every registry record carries the workflow
id in its header. The link runs both ways.

This costs one line and unlocks three things: finding the record from the n8n canvas,
finding the workflow from git, and above all making **any workflow without a `reg:` tag
visibly out of process**. Drift detection, deferred to layer 3, becomes a one line query on
the day it is wanted.

## 6. The four contracts

Every contract has fields and refusal rules. A refusal never returns a wall: it returns the
precise question that is missing. That is the difference between a method people follow and
a method people route around.

### Contract 1: request

Filled by the business requester, through the form.

Fields: named business owner (one person, not a team); the trigger in one sentence, "when X
then Y"; who does this by hand today, how often, how long it takes; an observable
definition of success; **what must never happen**; systems touched; deadline and its real
reason.

| Rule | Refuses when |
|---|---|
| R1 | No named person as owner. A team is not an owner. |
| R2 | The need does not fit "when, then". It is a wish, not an automation. |
| R3 | No current volume figure, even approximate. Without it there is no sizing and no impact measurement. |
| R4 | Success is not observable. "Save time" does not pass. |
| R5 | The "what must never happen" field is empty. Every flow touching a customer has a worst case. |

The form stops at these five questions. Everything else belongs to scoping, in
conversation. A heavier form sends the requester back to Slack.

### Contract 2: trigger

Filled by the builder, with the requester.

Fields: trigger type; the system of record for the data; normal volume **and peak volume,
with its cause**; acceptable latency; behaviour when the same event arrives twice; catch up
after an outage and over what window; whether event order matters.

| Rule | Refuses when |
|---|---|
| T1 | No peak volume. Peaks break things, averages never do. |
| T2 | Replay behaviour unanswered. It determines all of contract 3. |
| T3 | A webhook with no catch up strategy. A lost webhook is lost forever. |
| T4 | Polling with no named cursor field. Duplicates or gaps are guaranteed. |

### Contract 3: idempotency and effects

The core. **The only contract that blocks production release.** The others block the next
step.

Fields: deduplication key, meaning the exact field, in which system, and **where the dedup
state is stored**; an effect inventory with one line per side effecting node, marked
reversible yes or no and customer visible yes or no; effect ordering; resume point if it
breaks midway; recovery strategy; **safety cap**, the maximum number of effects per window,
beyond which the circuit opens.

| Rule | Refuses when |
|---|---|
| I1 | No dedup key, or a key named without saying where its state lives. |
| I2 | A customer visible effect missing from the inventory. |
| I3 | An irreversible effect ordered before a reversible one. It gets reordered. |
| I4 | No safety cap on a flow that sends mail or writes to a CRM. This is what prevents 4000 emails at 3am. |
| I5 | Side effecting nodes with no error branch. The how is delegated to the `n8n-error-handling` skill. |

### Contract 4: impact

Filled **before** building, read back after. Measuring afterwards never works because the
before value has already disappeared.

Fields: one quantified measure; the before value, its source, its date; the target value;
**the exact read back method** (the query, the dashboard, the export); the read back date,
default 30 days; who reads it back; the **abandon condition**.

| Rule | Refuses when |
|---|---|
| M1 | The measure is not quantifiable. |
| M2 | The before value is estimated rather than measured. Tolerated, but marked "estimated" and visible in the read back. |
| M3 | No read back method described. Otherwise nobody ever reads it back, which is what happens everywhere. |
| M4 | No read back date. |
| M5 | No abandon condition. An automation nobody can switch off becomes permanent debt. |

### The relief valve

**Forcing a gate is allowed.** It writes one line into the automation's log: who forced it,
why, and when it gets reviewed. A method that cannot be bypassed gets bypassed from the
outside, and then the trace is lost. Here the bypass stays inside the system.

## 7. End to end flow

| # | Step | Who | Produces | Gate |
|---|---|---|---|---|
| 1 | Request | Requester alone | `request.md` | **R** |
| 2 | Scoping | Builder and requester, one conversation | `trigger.md`, `impact.md` | **T**, **M** |
| 3 | Design | Builder and agent | `idempotency.md`, `flow-spec.md` | **I** |
| 4 | Build | Agent and n8n MCP | workflow created, never published | none |
| 5 | Validation | Agent | validation report | none |
| 6 | Release | Builder | workflow published, `runbook.md` | **final gate** |
| 7 | Operation | Owner and builder | log entries | none |
| 8 | Impact read back | Owner | quantified verdict | none |

**Step 1.** The R rules are applied inside the form, live. A missing field sends the
requester back the right question instead of rejecting them. Once through, the form creates
`registry/<slug>/` and notifies the builder. Fallback with no tooling: copy the template by
hand.

**Step 2.** A thirty minute conversation, not a document written alone. The builder leaves
with the trigger and impact contracts filled.

**Step 3.** The flow spec cuts the work into **testable steps**, each with its expected
input and expected output. That cut is what makes step 5 possible, and it is the equivalent
of sharding into stories in BMAD.

**Step 4.** The agent builds in n8n through the MCP server. The workflow stays unpublished.
All technical guidance comes from the MCP skills.

**Step 5.** Three passes: structural validation of the workflow, execution against pinned
data for each flow spec step, and **execution of the replay cases declared in contract 2**.
That last pass is the one nobody runs and the one that breaks in production.

**Step 6.** The final gate opens only if contract 3 is complete, validation is green, and
the runbook exists. The runbook invents nothing: every line of it is derived from the
contracts, which already carry the effects, the recovery and the cap. In layer 1 that
derivation is done by hand from the template. From layer 2 onward it is generated. The
content is the same either way, only the effort changes.

**Step 7.** Errors route to a shared error workflow. Every incident writes a log line.

**Step 8.** On the planned date. Three possible verdicts: keep, adjust, or switch off per
the abandon condition. The verdict is written, quantified and dated.

### Where data lives

The **git registry** carries everything a human must be able to read in two years: the four
contracts, the flow spec, the runbook, the log. The **n8n instance** carries the workflow,
its version history and its executions. The anchor links them.

## 8. Failure

### Level 1: the failure standard imposed on automations

Three failure classes, declared in every runbook, treated differently:

**Transient** (rate limit, timeout, upstream 5xx). Retry with growing backoff, capped, then
escalate. The only case where retrying makes sense.

**Data** (unexpected payload, missing field). Quarantine, alert the owner, **never retry**.
Retrying does not repair broken data, it burns quota and hides the problem.

**Partial effect** (the automation did half the job). The worst case, and the one contract 3
anticipates. Resume point, intervention per the runbook, **never an automatic replay**.

A rule that follows from the contracts rather than from opinion: **automatic replay is
forbidden on any flow carrying an irreversible effect**. Contract 3 already listed those
effects, so there is nothing to debate during the incident.

**Silent failure.** A flow processing zero items is not a success, it is a signal. Corrected
on 2026-08-16 against `~/Vault/03-Technologies/n8n Zero-Item Silent Failure.md`, observed on
self-hosted n8n 2.29.10 on 2026-07-16, which contradicts the first draft of this section on
two points.

An **error workflow never fires on it**, because zero items is not an error: the downstream
chain is skipped and the execution is written as `success`. Alerting cannot be the answer.
And the observable signal is not the item count, it is **execution duration collapsing by
orders of magnitude**: on the documented case, 4m30s working against 63ms broken, both
green, for five days.

So the runbook declares an expected item count **and an expected duration floor**, and the
method requires an explicit guard node that throws after any node which can legitimately
emit nothing (file reads, filters, IF branches, HTTP calls with empty result sets, database
queries with no rows). Turning silence into a real error is what makes the alerting chain
work at all.

**The contract 3 cap is a circuit breaker, not an alert.** Past the cap, it cuts. An alert
at 3am wakes nobody, a circuit breaker saves 4000 emails.

### Level 2: how the method itself fails

The part frameworks never write down, and where they die.

**Bypass.** Someone builds straight in the canvas. Handled by the relief valve (forcing
leaves a trace) and by the anchor: any workflow without a `reg:` tag is visibly out of
process. It is not prevented, it is made conspicuous.

**Stale contract.** Volumes double, the effect inventory does not follow. Handled by a
review date in the record, and by a rule: adding a side effecting node reopens contract 3.

**The read back that never happens.** The most common failure mode by a wide margin.
Handled by a scheduled task that chases the owner on the planned date, not by good
intentions. With no read back by day 60, the record flips to an "unmeasured" state visible
in the registry. The chase is layer 2 tooling: in layer 1 the read back date is a calendar
entry the builder sets, which is weaker and known to be weaker.

**A form that is too heavy.** The requester gives up and goes back to Slack. Handled by
holding the front door at five questions, R1 through R5.

**A method that grows.** The fate of every framework. Handled by an explicit constraint: the
blocking rules file is **capped**. Adding a refusal rule requires removing one, or writing
why in the repository log.

## 9. Testing

### Testing an automation

n8n has no unit tests. The method answers by **deriving the test cases from the contracts**
rather than asking the builder to be imaginative.

| Case | Derived from | Must produce |
|---|---|---|
| Nominal | flow spec | the expected result, step by step |
| **Replay** | contract 2 | the same event twice, **no effect the second time** |
| **Peak** | contract 2 | the declared peak volume, no degradation, no loss |
| Broken data | contract 3 | quarantine and alert, no crash |
| **Zero items** | runbook | an alert, never a silent success |
| **Cap** | contract 3 | cap exceeded, the circuit opens |

This is the real payoff of the contracts: **if the contracts are filled, the test plan
already exists.** Nobody has to decide what to test, or remember to.

Technically this rests on the pinned data and test execution the MCP server exposes
(`prepare_test_pin_data`, `test_workflow`). Each flow spec step carries its expected input
and output, so each step runs on its own.

### Neutralising effects during tests

Irreversible effects must be switchable. The contract 3 inventory already names them. Two
accepted mechanisms: a dry run flag, or sandbox credentials.

Firm rule: **never test a customer effecting flow against production without that switch.**
It is the only rule in the method with no relief valve.

### Business acceptance

The owner validates on three real cases **they choose themselves**. Short, but it catches
the automation that is technically correct and functionally wrong. An automation passing
all six technical cases and failing here is not ready.

### Testing the method itself

Every refusal rule carries two examples: one that must pass, one that must be refused. One
case file per contract, in markdown, reviewed by hand or by an agent. A rule without its
two examples does not enter the blocking rules file.

The traversed example in `examples/` acts as a regression test: if a template changes, the
example must stay coherent end to end. That is what stops the method drifting from its own
documentation.

### Not tested, deliberately

No node unit tests, that is the MCP server's job. No coverage metric: the number of cases is
set by the contracts, not by a percentage to reach.

## 10. Repository layout

```
clausework/
├── README.md                  # what it is, who for, in two minutes
├── AGENTS.md                  # agent contract, model agnostic
├── CLAUDE.md                  # thin @AGENTS.md include
├── method/
│   ├── overview.md
│   ├── gates.md               # every blocking rule, one place, capped
│   ├── contracts/
│   │   ├── request.md
│   │   ├── trigger.md
│   │   ├── idempotency.md
│   │   └── impact.md
│   └── templates/
│       ├── flow-spec.md
│       └── runbook.md
├── intake/
│   ├── workflow.json          # the request form, an n8n workflow
│   ├── locales/fr.md          # French labels for francophone teams
│   └── README.md
├── registry/
│   └── <slug>/                # one directory per automation
├── examples/
│   └── <traversed-case>/      # one complete case, request through read back
├── docs/                      # context pack
└── .claude/
    ├── skills/                # Claude Code overlay, optional
    └── agents/
```

Structure and method in English, required for open source. Form labels are localised,
because the people filing requests write in French.

## 11. Delivery layers

### Layer 1: the readable core

Deliverable before 2026-08-20. Already the complete method, with no tooling.

README and AGENTS.md, the four contracts with templates and refusal rules, the blocking
rules file, the flow spec and runbook templates, the intake form as an n8n workflow
applying R1 through R5, and **one real case traversed end to end** in the registry.

The traversed case must be one the author actually lived, and it is stronger still if it
failed. The chosen case is a **multi source job market scanning pipeline** the author runs
daily: 45 distinct sources feeding one store, deduplicated by nothing.

Measured on 2026-08-16: 3004 rows for 2022 distinct organisations, so 982 duplicate rows, a
third of the table. 432 organisations appear more than once, one of them from seven separate
sources. Eighty rows sit in a `new` state while the same organisation already carries a row
that was acted on. That is the deduplication key contract 3 exists to demand, absent, and
counted.

This earns its place over a success story. Every refusal rule can point at what its own
absence cost here, with a number attached. Contract 3 gets a real effect inventory, and
contract 4 gets a measured before value rather than an estimate.

**The entry publishes mechanics, not identities.** Volumetrics, duplicate rates and failure
counts are real and go in. Organisation names, item statuses, dates and any personal
identifier do not, and no row level data is committed. The teaching value lives in the
failure mode, never in which organisations appeared.

A second sketched case, lead enrichment between CRMs, marked explicitly as illustrative,
gives a Sales and CS audience something in their own language.

### Layer 2: tooling

Two to three weeks after. Claude Code skills and agents, runbook generation from the
contracts, automatic derivation of the six case test table, a reference shared error
workflow, and the scheduled chase for the impact read back.

### Layer 3: governance

Drift detection through the `reg:` tag, a registry catalogue, portfolio review and
decommissioning.

**Deliberately not built.** It needs a real portfolio and real users, otherwise it is
designed blind. Stating that is stronger than shipping a speculative and shaky layer 3.

## 12. Open items

Resolved on 2026-08-16, before the implementation plan was written.

**Silent failure. Resolved, and it corrected section 8.** Source:
`~/Vault/03-Technologies/n8n Zero-Item Silent Failure.md`, n8n 2.29.10, 2026-07-16. An error
workflow never fires on a zero item skip, and the real signal is duration rather than item
count. Section 8 now reflects that.

**The form node and live validation. Resolved: possible.** `n8n-nodes-base.formTrigger` v2.6
starts the form, `n8n-nodes-base.form` v2.5 with `operation: page` adds each step, and
official best practice routes back to the faulty step with an error message using IF or
Switch. Two obligations follow: set "Append n8n Attribution" to false, and persist the raw
response in a real storage node (Data Table preferred), because Set and Merge do not
persist.

**Writing into the registry. Resolved.** `n8n-nodes-base.github` with
`resource: file, operation: create` writes the file directly.

Still open.

**n8n Source Control and Environments documentation: not read.** It does not block layer 1,
which does not use git as the source of truth for workflow JSON. It must be read before
layer 3 is designed for real, and until then no behaviour should be assumed from it.
