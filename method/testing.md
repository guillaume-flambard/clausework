# Testing

If the four contracts are filled, the test plan already exists. Nobody has to decide what to test, or remember to. Each of the six mandatory test cases is derived directly from the contracts, so they cost nothing to decide. They are not optional, and none can be removed.

## The six test cases

| Case | Derived from | Must produce |
|---|---|---|
| nominal | flow spec | the expected result, step by step, on the expected input |
| replay | contract 2 | the same event twice, no effect the second time |
| peak | contract 2 | the declared peak volume, no degradation, no loss |
| broken data | contract 3 | quarantine and alert, no crash |
| zero items | runbook | an alert, never a silent success |
| cap | contract 3 | cap exceeded, the circuit opens, no further effects |

Each case is executed against pinned test data. The flow spec carries the expected input and output for each step, so each step can be tested independently.

## Neutralising effects during testing

**Never test a customer effecting flow against production without switching its irreversible effects off.**

This is the only rule in the method with no relief valve. See `method/gates.md` for the canonical statement of this rule and its justification.

Irreversible effects must be switchable. The contract 3 effect inventory already names them. Two accepted mechanisms:

1. A dry run flag that skips the irreversible step, returning a simulated success.
2. Sandbox credentials that route effects to a test system instead of production.

If an effect is marked irreversible and customer visible in contract 3, it must be disabled during all testing phases. An automation that passes all six technical cases while sending real emails or charges to production is not ready.

## Business acceptance

The owner validates on three real cases they choose themselves. Short, but it catches the automation that is technically correct and functionally wrong. An automation passing all six technical test cases and failing here is not ready.

The owner's sign-off is the release gate. The builder cannot override it.

## Test plan derivation

In layer 1, this table is filled by hand from the contracts. Deriving it automatically is layer 2, and stating so here stops a reader expecting a generator that does not exist yet.
