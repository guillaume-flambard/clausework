# Contract 1: the request

owner: Guillaume Flambard, Operations Lead

trigger_sentence: When the daily scheduled scan completes, then ingest all newly discovered job opportunities and store them in the opportunity database.

today_manual: The team manually scans and consolidates job listings from multiple sources multiple times per week, taking approximately 8 hours of combined effort to identify unique opportunities and remove duplicates before storage. Without automated consolidation, duplicate records accumulate and duplicate review work multiplies.

success_observable: 100 percent of discovered opportunities are added to the store within 1 hour of scan completion. Zero duplicate organisations in the store for the same source in the same day. All opportunities are tagged with their source. No opportunities are lost or duplicated during consolidation.

never_happens: The same opportunity is added to the store twice, sent to the same recruiter twice, or a recruiter contacts one person about the same role twice from different detected sources.

systems: Job markets (external sources), SQLite (store), internal candidate pipeline (downstream).

deadline_reason: Candidate sourcing velocity and accuracy: the team needs faster opportunity discovery to compete in time-sensitive hiring and must eliminate duplicates to avoid wasted outreach effort.
