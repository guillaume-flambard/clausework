# Request contract cases

Test cases for R1 through R5, derived from the refusal rules in `method/contracts/request.md`.

### R1 passes

```
owner: Jennifer Walsh, Head of Sales Development
trigger_sentence: When a deal closes at $50k or above, then create an onboarding task in Jira.
today_manual: Jennifer spends 5 hours per week manually creating tasks for enterprise deals that close.
success_observable: 100% of enterprise deals over $50k have an onboarding task created in Jira within 1 hour of deal close.
never_happens: an onboarding task is created twice for the same deal.
systems: HubSpot (deals data), Jira (task creation).
deadline_reason: Q3 OKR to automate 80% of onboarding task creation by end of quarter.
```

Why it passes: owner is a named person, not a team.

### R1 refuses

```
owner: the sales team
trigger_sentence: When a deal closes, then notify the appropriate team member.
today_manual: Sales team handles deal notifications.
success_observable: all new deals get handled
never_happens: nothing
systems: HubSpot
deadline_reason: we need this soon
```

Response: Who is the named person responsible for this automation? We need one individual owner, not a team. Name them.

### R2 passes

```
owner: Michael Chen, Customer Success Manager
trigger_sentence: When a customer contract's annual renewal date arrives, then send a renewal reminder email to the primary contact within 1 hour.
today_manual: Michael manually reviews expiring contracts every Monday morning and sends emails to 30-40 customers a week.
success_observable: 100% of customers with contracts expiring in the next 30 days receive a renewal email within 60 minutes of the trigger time.
never_happens: a customer receives more than one renewal reminder for the same contract.
systems: Salesforce (contract data), Gmail (email delivery).
deadline_reason: reduce manual work during renewal season and improve email delivery timing.
```

Why it passes: clear when/then structure: when contract renewal arrives, then send reminder email.

### R2 refuses

```
owner: David Kumar, Operations Manager
trigger_sentence: We need to streamline how we manage our customer communication and make sure nothing falls through the cracks.
today_manual: Various team members send emails and updates to customers throughout the month.
success_observable: better customer communication
never_happens: nothing
systems: Gmail, Salesforce
deadline_reason: improving customer satisfaction
```

Response: The request describes a goal but not a trigger. What specific event or condition starts this automation, and what single action follows? (Format: "When X happens, then do Y.")

### R3 passes

```
owner: Sarah Martinez, Enterprise Sales Manager
trigger_sentence: When a new enterprise prospect is added to HubSpot with industry matching our target verticals, then add them to a Slack channel for the sales team.
today_manual: Sarah manually reviews new prospects every day and spends 30 minutes a day adding 10-15 of them to Slack channels by hand.
success_observable: 100% of new enterprise prospects matching target verticals are added to their designated Slack channel within 2 hours of being created in HubSpot.
never_happens: a prospect is added to the wrong Slack channel or added twice.
systems: HubSpot (prospect data), Slack (channel management).
deadline_reason: onboard new reps faster and reduce manual data entry errors.
```

Why it passes: clear volume figure: 10-15 prospects per day, 30 minutes daily.

### R3 refuses

```
owner: Robert Lee, Lead Gen Manager
trigger_sentence: When leads come in from our campaigns, then organize them in our CRM.
today_manual: the team processes leads pretty regularly from different sources
success_observable: leads are organized in the CRM
never_happens: nothing
systems: HubSpot, LinkedIn Ads, Marketo
deadline_reason: we're scaling our lead process
```

Response: How many leads arrive per week or per day, and how much time does the current manual work take? Even an estimate matters. Without a volume, we cannot size the automation or measure impact.

### R4 passes

```
owner: Amy Patel, Renewal Specialist
trigger_sentence: When a customer's annual support contract expiration date is exactly 60 days away, then send a renewal check-in email to the primary contact and the account manager.
today_manual: Amy manually identifies 20-30 expiring contracts every Friday, reads their contract dates, and sends personalized check-in emails for 2 hours.
success_observable: 100% of customers with contracts expiring in exactly 60 days receive their renewal check-in email within 90 minutes of the automation run, with zero duplicate emails sent to the same contact within a 7-day window.
never_happens: a customer receives a renewal email for a contract that has already renewed.
systems: Salesforce (contract data), Gmail (email), Sheet for tracking sent emails.
deadline_reason: reduce manual Friday work and improve email delivery consistency.
```

Why it passes: success is fully observable and measurable: 100%, within 90 minutes, zero duplicates in 7 days.

### R4 refuses

```
owner: Tom Henderson, Sales Operations
trigger_sentence: When a customer is ready to renew, send them a renewal message.
today_manual: Tom and the team send renewal emails to active customers throughout the year.
success_observable: saves our team time
never_happens: nothing
systems: Salesforce, Gmail
deadline_reason: we want to save time on this process
```

Response: "Saves time" is not observable. Describe what success actually looks like: How many emails, sent to whom, by what deadline? What is an error, and what is not?

### R5 passes

```
owner: Lisa Green, Finance Manager
trigger_sentence: When a new customer contract is signed in Salesforce, then create a billing record in QuickBooks and send a welcome email.
today_manual: Lisa spends 1 hour twice a week creating 5-8 billing records by hand in QuickBooks after contract signature.
success_observable: 100% of new contracts have a billing record created in QuickBooks within 4 hours of signature, matching the contract value exactly.
never_happens: a billing record is created twice for the same contract, or created with an incorrect contract value.
systems: Salesforce (contract data), QuickBooks (billing records), email (welcome sequence).
deadline_reason: prevent billing delays for Q3 cohort and reduce manual account setup time.
```

Why it passes: worst case is explicit: duplicate billing records or incorrect contract value.

### R5 refuses

```
owner: Mark Foster, Operations Manager
trigger_sentence: When a customer order is placed, then update all relevant systems.
today_manual: Mark manually processes orders and notifies various teams about new customers.
success_observable: orders are updated across systems
never_happens: 
systems: Shopify, Salesforce, Email
deadline_reason: speed up order processing
```

Response: What is the worst case that must never happen? For example: charging a customer twice, sending an order confirmation to the wrong email, creating duplicate records, or updating the wrong customer account? Name the specific failure mode.
