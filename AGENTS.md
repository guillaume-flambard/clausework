# Clausework agent contract

## Before you start

1. Read `method/overview.md` and `method/gates.md`. These are the binding documents. Everything else is context.
2. Before touching a registry entry, understand which contract you are filling and what it refuses.

## Rules

1. **Never invent a contract answer on behalf of a requester.** If the request field is missing or unclear, ask the requester directly. A contract filled by an agent who guesses is worse than empty.
2. **Node configuration questions are out of scope.** Direct those to the n8n MCP skills and the n8n documentation.
3. **Before every commit, run `bash scripts/check.sh`.** The test harness enforces structural invariants. A commit that fails the check is not ready.

## Getting help

The four contracts are in `method/contracts/`. Each contract has refusal rules and templates. The consolidated rules live in `method/gates.md`. Examples of each rule passing and refusing are in `method/cases/`.
