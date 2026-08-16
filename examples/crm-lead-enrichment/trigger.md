# Contract 2: the trigger

## Trigger type

Webhook triggered on Salesforce Lead.created. The webhook fires once per lead when the record is first created.

## Replay behaviour

The same lead (identified by email) must not be enriched twice. If the webhook is delivered twice for the same email address within a 24-hour window, the second delivery is discarded and returns success without attempting enrichment. The dedup state is kept in a Salesforce custom field called `enrichment_attempted` (timestamp).

## Peak volume and timing

Peak occurs on Monday mornings: 30-40 leads arrive between 8am and 11am. Average is 8-10 leads per day. The team has never seen more than 50 leads arrive in a single calendar day.

## Catch-up strategy

If the webhook is lost, the nightly data reconciliation job (external to this automation) runs at 2am UTC and identifies any leads created without the `enrichment_attempted` timestamp, then triggers the enrichment workflow for those records via API call. This ensures no lead is left unenriched.

## Expected throughput

One enrichment takes 4-6 seconds on average (1 Pipedrive lookup, 1 Clearbit API call, 1 Salesforce update). At peak (40 leads in 3 hours), the workflow can handle 1 enrichment every 4 seconds without throttling concerns.
