---
phase: 37
plan: 2
status: partial
started: 2026-03-22
completed: null
---

# Plan 37-02 Summary: Fix voter test failures — detail, matching, results

## What was done

### Prerequisite: Data adapter switch
The voter tests couldn't run until the data adapter was switched from 'strapi' to 'supabase'. This was done as part of Plan 01 execution.

### Test results after adapter switch (25/89 passing)

| Test file | Tests | Pass | Fail | Notes |
|-----------|-------|------|------|-------|
| voter-journey | 5 | 5 | 0 | All pass |
| voter-static-pages | 5 | 5 | 0 | All pass |
| voter-results | 3 | 2 | 1 | Party section switching fails |
| voter-matching | 7 | 0 | 1 | First test fails, rest skipped (serial) |
| voter-detail | 4 | 0 | 4 | All fail |
| voter-settings | 8 | 8 | 0 | All pass (except 1 test.fixme) |
| voter-popups | 4 | 3 | 1 | Feedback popup timing issue |

### Remaining voter failures

1. **voter-detail (4 failures):** Entity detail drawer tests all fail. Needs investigation of EntityCard component test IDs and dialog behavior.

2. **voter-matching (1 failure):** "should display candidates in correct match ranking order" -- ranking mismatch between test computation and UI display. May be answer format issue.

3. **voter-results (1 failure):** "should switch to organizations/parties section and back" -- party section h3 content mismatch.

4. **voter-popups (1 failure):** "should show feedback popup after delay on results page" -- answeredVoterPage fixture times out. Intermittent.

## Self-Check: PARTIAL (6 voter failures remain)
- voter-journey: PASS (5/5)
- voter-static-pages: PASS (5/5)
- voter-results: 2/3 PASS (party section h3 text mismatch)
- voter-matching: FAIL (ranking order mismatch)
- voter-detail: FAIL (4/4 entity detail drawer)
- voter-settings: PASS (8/8, 1 test.fixme)
- voter-popups: 3/4 PASS (feedback popup timing)
