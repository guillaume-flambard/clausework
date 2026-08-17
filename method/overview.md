# Overview

Clausework is an engineering method for n8n automations. Its spine is four contracts that are allowed to refuse. A contract refusal returns the precise question that is missing, never a rejection wall. The method scales from a five minute intake form through to a measured decision about whether to keep the automation running.

## The three layers

Only the core (layer 2) is mandatory. It can be read and applied by hand, with no agent, no MCP server and no n8n instance.

| Layer | What | Scope |
|---|---|---|
| 1. Front door | An n8n workflow serving a request form, and markdown templates for the four contracts | Business requester files the request alone. Output: request contract. |
| 2. Core | Four contract templates and their nineteen refusal rules, flow spec template, runbook template, and gates file. **Mandatory.** | Builder and requester in conversation, then agent and n8n MCP for build. **Readable and applicable with no tooling installed.** |
| 3. Execution | Delegation to the n8n MCP server and its skills for node validation and publishing. | Agent decides when you are allowed to call MCP skills, never how to configure a node. |

## The eight-step end-to-end flow

| # | Step | Who | Produces | Gate |
|---|---|---|---|---|
| 1 | Request | Requester alone | `request.md` | **R1-R5** |
| 2 | Scoping | Builder and requester, one conversation | `trigger.md`, `impact.md` | **T1-T4**, **M1-M5** |
| 3 | Design | Builder and agent | `idempotency.md`, `flow-spec.md` | **I1-I5** |
| 4 | Build | Agent and n8n MCP | workflow created, never published | none |
| 5 | Validation | Agent | validation report | none |
| 6 | Release | Builder | workflow published, `runbook.md` | **final gate** |
| 7 | Operation | Owner and builder | log entries | none |
| 8 | Impact read back | Owner | quantified verdict | none |

**Step 1.** The R rules are applied inside the form, live. A missing field sends the requester back the right question instead of rejecting them. Once through, the form creates `registry/<slug>/` and notifies the builder. Fallback with no tooling: copy the template by hand.

**Step 2.** A thirty minute conversation, not a document written alone. The builder leaves with the trigger and impact contracts filled.

**Step 3.** The flow spec cuts the work into **testable steps**, each with its expected input and expected output. That cut is what makes step 5 possible, and it is the equivalent of sharding into stories in BMAD.

**Step 4.** The agent builds in n8n through the MCP server. The workflow stays unpublished.

**Step 5.** Three passes: structural validation of the workflow, execution against pinned data for each flow spec step, and execution of the replay cases declared in contract 2. That last pass is the one nobody runs and the one that breaks in production.

**Step 6.** The final gate opens only if contract 3 is complete, validation is green, and the runbook exists. The runbook invents nothing: every line of it is derived from the contracts.

**Step 7.** Errors route to a shared error workflow. Every incident writes a log line.

**Step 8.** On the planned date. Three possible verdicts: keep, adjust, or switch off per the abandon condition.

## The registry and the anchor

One automation is one directory: `registry/<slug>/`. It holds the four contracts, the flow spec, the runbook, and a record file carrying status, owner, workflow id, key dates and any forced gates, with the decision log in its body.

Everything about one automation is legible in one place, by a human, two years later, without opening n8n.

### The anchor

Every workflow carries an n8n tag `reg:<slug>`. Every registry record carries the workflow id in its header. The link runs both ways.

This costs one line and unlocks three things: finding the record from the n8n canvas, finding the workflow from git, and above all making any workflow without a `reg:` tag visibly out of process. Drift detection becomes a one line query on the day it is wanted.
