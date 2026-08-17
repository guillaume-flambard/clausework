# Contract 4: impact

measure: percentage of duplicate rows in the opportunity store (measured as total rows with duplicate opportunity_id and source_id within 7-day window, divided by total rows)

before_value: 33

before_source: Query of the SQLite store on 2026-08-16: 3004 total rows, 2022 distinct organisations, 982 duplicates. Calculation: 982 / 3004 = 32.7 percent, rounded to 33 percent.

before_date: 2026-08-16

before_estimated: false

target_value: 5

read_back_method: Query the SQLite store after 30 days of deduplication implementation. Run: SELECT COUNT(*) as total_rows, COUNT(DISTINCT opportunity_id || ':' || source_id) as unique_opp_source, COUNT(*) - COUNT(DISTINCT opportunity_id || ':' || source_id) as duplicates FROM opportunities WHERE created_date >= date('now', '-30 days'). If duplicates / total_rows is less than or equal to 5 percent, the deduplication strategy is working. Also measure: number of organisations appearing in new state while already having acted-on rows (target: fewer than 5 per day). Query new rows and cross-reference: SELECT COUNT(*) FROM opportunities o1 WHERE o1.status = 'new' AND EXISTS (SELECT 1 FROM opportunities o2 WHERE o2.organisation_id = o1.organisation_id AND o2.status IN ('contacted', 'rejected', 'hired')).

read_back_date: 2026-09-15

read_back_owner: Operations team lead

abandon_condition: if duplicate rate remains above 10 percent after 30 days, the deduplication strategy has failed or is not properly enforced. Investigate root cause. If root cause is in contract 3 (dedup key or state store), rewrite contract 3 and re-test. If root cause is in data quality (malformed source ids or opportunity ids), quarantine affected sources and hold for 7 days to repair. If still above 10 percent after the repair hold, switch off the automated deduplication, revert to manual review, and escalate to management for architectural decision on data quality upstream.
