# Clausework decisions log

## 2026-08-16: Refusal rules cap at 19

**Decision:** The blocking rules file `method/gates.md` has a hard ceiling of 19 rules.

**Why:** Methods grow unbounded without a constraint. Adding a refusal rule requires removing one or writing why in this log. This forces conscious prioritisation and keeps the method teachable. The cap ensures that core rules remain core, and that every rule has been questioned.

**Rationale:** Derived from section 8 of the design document: "A method that grows is the fate of every framework." The cap prevents drift from the method's original purpose while permitting deliberate evolution.

**Scope:** Applies to all refusal rules across the four contracts: R1-R5 (request), T1-T4 (trigger), I1-I5 (idempotency), M1-M5 (impact). The harness (`scripts/check.sh`) enforces this limit.

## 2026-08-16: Layer 1 completion and deferred findings

**Task 9 deferred findings resolved:**

1. **Runbook escalation path points to contract 1 owner.** The escalation section in `method/templates/runbook.md` asks for an on-call owner, but no contract has a dedicated field for it. Resolution: Point the escalation at the `owner` field already collected by contract 1 (the request), and document that a different name can be written into the runbook if the on-call differs from the business owner.

2. **Relief valve rule stated in both gates.md and testing.md.** The rule "never test against production without switching effects off" appears in both files with close but non-identical wording. Resolution: Add a sentence in `method/testing.md` naming `method/gates.md` as the canonical statement. Both statements are kept for readability.

3. **Decision log status `[DOCUMENTED]` not in template.** The registry entry `job-market-multi-source-scan/README.md` uses `[DOCUMENTED]` as a decision log status, which does not appear in `method/templates/runbook.md`. Resolution: Decision log status markers are left as custom per organization. The runbook is a template (flexible), not binding. Implementers can define their own status markers (e.g., `[DOCUMENTED]`, `[ILLUSTRATIVE]`, `[ERROR]`, `[PROPOSED]`) as needed. The template shows the format, not an exhaustive list of valid markers.

**Layer 1 standalone constraint verified:** All files in `method/` are readable and applicable with no n8n instance, no MCP server, and no agent installed. The layer 2 core is portable and self-contained. Layer 3 delegation to agents and MCP is explicitly scoped to the BUILD phase, not the METHOD phase.

**Gate test and illustrative case created:** The intake form now has an executable test (`intake/test-gates.mjs`) that verifies all five request rules without requiring n8n. An illustrative case (`examples/crm-lead-enrichment/`) demonstrates the method applied to a Sales scenario, showing how the four contracts apply to a familiar CRM integration use case. Both additions are non-breaking and fully integrated.
