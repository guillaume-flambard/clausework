# Clausework decisions log

## 2026-08-16: Refusal rules cap at 19

**Decision:** The blocking rules file `method/gates.md` has a hard ceiling of 19 rules.

**Why:** Methods grow unbounded without a constraint. Adding a refusal rule requires removing one or writing why in this log. This forces conscious prioritisation and keeps the method teachable. The cap ensures that core rules remain core, and that every rule has been questioned.

**Rationale:** Derived from section 8 of the design document: "A method that grows is the fate of every framework." The cap prevents drift from the method's original purpose while permitting deliberate evolution.

**Scope:** Applies to all refusal rules across the four contracts: R1-R5 (request), T1-T4 (trigger), I1-I5 (idempotency), M1-M5 (impact). The harness (`scripts/check.sh`) enforces this limit.
