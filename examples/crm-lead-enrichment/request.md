# Contract 1: the request

owner: Jane Doe, Sales Development Manager

trigger_sentence: When a new lead arrives in Salesforce from any source, then fetch enrichment data from Pipedrive and external sources, and update the Salesforce record with industry, employee count, and last known contact date.

today_manual: Jane and her team spend 1 hour per week manually searching Pipedrive for company information and updating Salesforce records by hand. They receive 40-50 new leads per week from email captures, web forms, and LinkedIn. The manual work is error-prone: the team has created duplicate records for the same company arriving from multiple sources, and sometimes fails to complete enrichment, leaving records partial.

success_observable: 100% of new leads are enriched with industry, employee count, and contact date within 5 minutes of arrival in Salesforce. Zero duplicate enrichment attempts for the same company in the same day. All eight enrichment fields are populated or marked as "not found" in the Salesforce record before the lead is visible to the sales team.

never_happens: a Salesforce record for the wrong company is enriched, or the same lead is enriched twice resulting in incomplete or conflicting data in the record.

systems: Salesforce (lead data), Pipedrive (enrichment data), Clearbit API (external enrichment), Slack (notifications for failures).

deadline_reason: Q3 Sales Growth OKR: reduce manual lead processing to zero and improve data quality before the sales team scales to 15 people.
