ATTEMPT=20261014T215008Z.3e3c828ddb59
HEAD=3e3c828ddb5941ea6d91391087d3a1b1c2f084fa
TREE_CLEAN_BEFORE_GATES=yes
BUILD_EXIT=0
TEST_UNIT_EXIT=0
LINT_CHECK_EXIT=0
FORMAT_CHECK_EXIT=0
HEAD_AFTER_GATES=3e3c828ddb5941ea6d91391087d3a1b1c2f084fa
TREE_CLEAN_AFTER_GATES=yes
DATE=2026-10-14T21:53:11Z

Run conditions.
    node v24.21.0; TURBO_CACHE_DIR was tmp/181-evidence/turbo-cache.<attempt id>, created empty by this attempt before the first gate.
    Gates ran one after another in one background runner, each status written by printf of $? to its own status file of this attempt id, absent before the gate started.
    build started 2026-10-14T21:50:12Z, test:unit 2026-10-14T21:51:00Z, lint:check 2026-10-14T21:51:33Z, format:check 2026-10-14T21:52:15Z; all done 2026-10-14T21:52:29Z.
    The root .env is present, so the dev-seed integration tier ran against the shared local database (operator-accepted). The _openvaa-local container list was the same before and after the task; supabase_db_openvaa-local kept its creation time 2026-10-14 23:18:52 +0200, so the shared stack was not recreated during the run.

yarn build (turbo lines).
    Tasks:    14 successful, 14 total
    Cached:    0 cached, 14 total

yarn test:unit totals as vitest and turbo print them.
    @openvaa/matching:test:unit: Test Files 5 passed (5)
    @openvaa/matching:test:unit: Tests 43 passed (43)
    @openvaa/app-shared:test:unit: Test Files 10 passed (10)
    @openvaa/app-shared:test:unit: Tests 148 passed (148)
    @openvaa/core:test:unit: Test Files 3 passed (3)
    @openvaa/core:test:unit: Tests 8 passed (8)
    @openvaa/argument-condensation:test:unit: Test Files 6 passed (6)
    @openvaa/argument-condensation:test:unit: Tests 31 passed (31)
    @openvaa/llm:test:unit: Test Files 2 passed (2)
    @openvaa/llm:test:unit: Tests 49 passed (49)
    @openvaa/data:test:unit: Test Files 47 passed (47)
    @openvaa/data:test:unit: Tests 244 passed (244)
    @openvaa/supabase:test:unit: Test Files 18 passed (18)
    @openvaa/supabase:test:unit: Tests 462 passed (462)
    @openvaa/filters:test:unit: Test Files 1 passed (1)
    @openvaa/filters:test:unit: Tests 22 passed (22)
    @openvaa/question-info:test:unit: Test Files 2 passed (2)
    @openvaa/question-info:test:unit: Tests 22 passed (22)
    @openvaa/frontend:test:unit: Test Files 197 passed | 1 skipped (198)
    @openvaa/frontend:test:unit: Tests 3611 passed | 20 skipped (3631)
    @openvaa/dev-seed:test:unit: Test Files 71 passed (71)
    @openvaa/dev-seed:test:unit: Tests 1100 passed (1100)
    Tasks: 25 successful, 25 total
    Cached: 14 cached, 25 total
    Test Files 7 passed (7)

yarn lint:check, the two guard lines quoted.
    Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1973; vendored files excluded by name: 2 (apps/frontend/static/fonts/inter.css, apps/docs/src/lib/layouts/prism-vs.css); applied migrations excluded by prefix: 1 (apps/supabase/supabase/migrations/); rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break). 0 violation(s).
    Schema-migration parity guard (phase 156: REVIEW-DB-07) — census: 29 schema file(s) -> 7880 line(s); 00001_initial_schema.sql -> 7880 line(s); apps/supabase/supabase/migrations holds 1 .sql file(s); generated copy is current.
    Schema-migration parity guard — frozen-mode self-test: 16 fixture(s) checked, each produced its committed findings; 15 rule(s), each with its fixture.

yarn lint:check and yarn format:check turbo lines.
    lint:check Tasks:    12 successful, 12 total
    lint:check Cached:    0 cached, 12 total
    lint:check Tasks:    23 successful, 23 total
    lint:check Cached:    10 cached, 23 total
    format:check Tasks:    7 successful, 7 total
    format:check Cached:    7 cached, 7 total

yarn test:unit, the root vitest run (yarn test:unit:tests) that follows turbo.
    Test Files 7 passed (7)
    Tests 102 passed (102)

Every cached turbo task above is a hit in the private cache this attempt created empty: each was first executed in this attempt (the build gate ran 14 of 14 uncached).
