ATTEMPT=20261020T185902Z.58cf7a564d5c
HEAD=58cf7a564d5ccc970b0b5261eb35eb2cac127e13
TREE_CLEAN_BEFORE_GATES=yes
BUILD_EXIT=0
TEST_UNIT_EXIT=0
LINT_CHECK_EXIT=0
FORMAT_CHECK_EXIT=0
HEAD_AFTER_GATES=58cf7a564d5ccc970b0b5261eb35eb2cac127e13
TREE_CLEAN_AFTER_GATES=yes
DATE=2026-10-20T19:00:58Z

Run conditions.
    node v24.21.0; TURBO_CACHE_DIR was tmp/181-evidence/turbo-cache.<attempt id>, created empty by this attempt before the first gate.
    Gates ran one after another in one background runner, each status written by printf of $? to its own status file of this attempt id, absent before the gate started.
    build started 2026-10-20T18:59:09Z, test:unit 2026-10-20T18:59:27Z, lint:check 2026-10-20T19:00:04Z, format:check 2026-10-20T19:00:42Z; all done 2026-10-20T19:00:58Z.
    The shared stack openvaa-local was running (yarn db:start, no reset, before this attempt); the dev-seed integration tier ran against it. The _openvaa-local container list with creation times was the same before and after the gates (13 containers).
    Tree samples: git status --porcelain --untracked-files=no printed nothing before the first gate and after the last; git rev-parse HEAD was the same both times.

yarn build (turbo lines).
    Tasks:    14 successful, 14 total
    Cached:    0 cached, 14 total

yarn test:unit totals as vitest and turbo print them.
    @openvaa/core:test:unit: Test Files 3 passed (3)
    @openvaa/core:test:unit: Tests 8 passed (8)
    @openvaa/filters:test:unit: Test Files 1 passed (1)
    @openvaa/filters:test:unit: Tests 22 passed (22)
    @openvaa/supabase:test:unit: Test Files 18 passed (18)
    @openvaa/supabase:test:unit: Tests 678 passed (678)
    @openvaa/app-shared:test:unit: Test Files 10 passed (10)
    @openvaa/app-shared:test:unit: Tests 149 passed (149)
    @openvaa/llm:test:unit: Test Files 2 passed (2)
    @openvaa/llm:test:unit: Tests 49 passed (49)
    @openvaa/matching:test:unit: Test Files 5 passed (5)
    @openvaa/matching:test:unit: Tests 43 passed (43)
    @openvaa/question-info:test:unit: Test Files 2 passed (2)
    @openvaa/question-info:test:unit: Tests 22 passed (22)
    @openvaa/argument-condensation:test:unit: Test Files 6 passed (6)
    @openvaa/argument-condensation:test:unit: Tests 31 passed (31)
    @openvaa/data:test:unit: Test Files 48 passed (48)
    @openvaa/data:test:unit: Tests 318 passed (318)
    @openvaa/frontend:test:unit: Test Files 259 passed | 1 skipped (260)
    @openvaa/frontend:test:unit: Tests 5948 passed | 31 skipped (5979)
    @openvaa/dev-seed:test:unit: Test Files 77 passed (77)
    @openvaa/dev-seed:test:unit: Tests 1207 passed (1207)
    Tasks: 25 successful, 25 total
    Cached: 14 cached, 25 total
    Test Files 10 passed (10)
    Tests 189 passed (189)
    The dev-seed integration tier ran: tests/integration/default-template.integration.test.ts (3 tests) passed.

yarn lint:check, the schema-migration parity guard lines quoted (2026-10-20T19:00:58Z).
    Schema-migration parity guard — census: 1 migration(s) in the manifest; baseline 00001_initial_schema.sql -> 9556 line(s); 16 fixture(s) checked; the frozen migrations match the manifest.
    Schema-migration parity guard — frozen-mode self-test: 16 fixture(s) checked, each produced its committed findings; 15 rule(s), each with its fixture.

yarn lint:check and yarn format:check turbo lines.
    lint:check Tasks:    12 successful, 12 total
    lint:check Cached:    0 cached, 12 total
    lint:check Tasks:    23 successful, 23 total
    lint:check Cached:    10 cached, 23 total
    format:check Tasks:    7 successful, 7 total
    format:check Cached:    7 cached, 7 total
