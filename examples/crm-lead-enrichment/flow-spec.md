# Flow spec: crm-lead-enrichment

## Step 1: Receive and validate webhook

Input: Salesforce webhook trigger on Lead.created event, carrying lead_id, email, company_name, and other base fields.

Output: Validated webhook data with email extracted and normalised to lowercase.

Side effects: none

---

## Step 2: Check dedup state

Input: Lead email address from step 1.

Output: Boolean (true if enrichment_attempted field is set and current, false if empty or older than 24 hours).

Side effects: none (query only)

---

## Step 3: Route on dedup

Input: Boolean from step 2.

Output: Route to either "Skip (already enriched)" or "Proceed to enrichment".

Side effects: none

---

## Step 4: Fetch from Pipedrive

Input: Lead email and company name from step 1.

Output: Pipedrive company record if found, containing industry, employee_count, last_contact_date, or empty record if not found.

Side effects: none (read only)

---

## Step 5: Fetch from Clearbit

Input: Company name from step 1, or company URL from Pipedrive if available.

Output: Clearbit enrichment record containing industry, employee_count, and additional metadata.

Side effects: none (API call, no state change)

---

## Step 6: Merge enrichment data

Input: Pipedrive result from step 4 and Clearbit result from step 5.

Output: Merged object containing all available enrichment fields: industry, employee_count, last_known_contact, website_url, technology_stack (from Clearbit).

Side effects: none

---

## Step 7: Update Salesforce record

Input: Lead ID from step 1 and merged enrichment object from step 6.

Output: Confirmation of Salesforce update with record ID and timestamp.

Side effects: Writes enrichment fields to the Salesforce Lead record. Sets the enrichment_attempted field to the current timestamp. Irreversible: once set, this field blocks future enrichment for 24 hours.

---

## Step 8: Notify on success

Input: Record ID and enrichment data from step 7.

Output: Log entry summarizing the enrichment.

Side effects: Slack notification sent to #sales-automation channel (not visible to the lead; internal only).
