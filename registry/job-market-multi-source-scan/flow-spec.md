# Flow spec: job-market-multi-source-scan

## Step 1: Fetch from all sources

Input: Schedule trigger at 02:00 UTC. Read the source cursor table from SQLite to determine where each source left off in its last successful scan.

Output: 45 parallel fetch requests, one per source, each returning new opportunities discovered since the last cursor position.

Side effects: none (reads only; no state changes)

---

## Step 2: Parse and normalize

Input: Raw opportunity records from 45 heterogeneous sources (job boards, APIs, scraped feeds) with inconsistent schemas.

Output: Standardised opportunity objects with required fields: opportunity_id, source_id, title, company, url, created_at, discovered_at, source_data (original raw record preserved).

Side effects: none

---

## Step 3: Deduplicate against opportunity_seen

Input: Normalised opportunity records from step 2.

Output: A filtered set containing only opportunities whose (opportunity_id, source_id) tuple has not been seen in the last 7 days.

Side effects: none (dedup is a query-only check against the SQLite opportunity_seen table)

---

## Step 4: Tag and enrich

Input: Opportunities that passed dedup check.

Output: Opportunities augmented with: source_name, source_category, import_batch_id, import_timestamp.

Side effects: none

---

## Step 5: Insert into opportunities store

Input: Tagged opportunities from step 4.

Output: Row count of newly inserted opportunities, with their assigned database IDs.

Side effects: Writes to SQLite opportunities table. Updates SQLite opportunity_seen table to record the (opportunity_id, source_id) pair with last_seen_date = now(). Increments the import_batch counter.

---

## Step 6: Notify downstream pipeline

Input: Count and metadata of newly inserted rows from step 5.

Output: Confirmation that downstream pipeline has received the batch notification.

Side effects: Sends notification to downstream candidate pipeline system (or webhook if configured) with: batch_id, row_count, source list, import_timestamp.

---

## Step 7: Update source cursors

Input: Completion status from all sources in step 1.

Output: Updated cursor positions saved to SQLite source_cursor table.

Side effects: Writes to SQLite source_cursor table, recording the new cursor position for each source (timestamp or ID, depending on source API).
