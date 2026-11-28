RECORDED=2026-11-21
RECORDED_BY=the plan executor of 189-20, which ran every gate below from this checkout; each exit line was read from that gate's own status file, written by the command on the line after the gate (logs in the session scratchpad, gates/<gate>.log and gates/<gate>.status)
ENV_FILE=present
    checked with test -f .env only; no variable name or value was read
STACK_BEFORE_GATES=the shared stack was up (13 supabase_*_openvaa-local containers), but its edge runtime mounted the -reviewfix checkout's apps/supabase/supabase/functions. No E2E run, no vitest and no Playwright process was live, so under the standing authorisation it was restarted from this checkout (yarn db:stop exit 0, yarn db:start exit 0); afterwards the edge runtime mounted /Users/.../voting-advice-application-infra/apps/supabase/supabase/functions
DISK=72 GiB free on /; no prune was needed

GATES_HEAD=03469505a462670aa4c1ca1c5e95b5324da3be17
    HEAD when the first gate started and when the last ended; the only commit of this plan before it is 03469505a (the recorded searches, .planning/ only), so the tree outside .planning/ is f222fc457's
TREE_CLEAN=yes
    git status --porcelain before the first gate and after the last listed only the two orchestrator-owned planning files the dispatch leaves uncommitted (` M .planning/workstreams/deployment/config.json`, `?? .planning/workstreams/deployment/.verification-ledger.json`); the navigation regeneration's intermediate diff (see NAV_IDEMPOTENT) was gone again before the last check

DB_RESET_EXIT=0
    yarn db:reset: 24 migrations applied (00001 to 00024, against 24 files in apps/supabase/supabase/migrations; supabase_migrations.schema_migrations 24 rows), "Seeding data from supabase/seed.sql...", "Finished supabase db reset on branch main."
LINT_EXIT=0
    yarn lint:check: turbo lint "Tasks: 12 successful, 12 total", typecheck "Tasks: 24 successful, 24 total", then every assert:* guard, the last "No-preregister guard — 3132 tracked file(s) under apps/, packages/ and tests/ scanned; 0 finding(s)."
FORMAT_EXIT=0
    yarn format:check: root Prettier "All matched files use Prettier code style!", then the docs workspace's format:check, the same line
UNIT_EXIT=0
    yarn test:unit with the stack running: turbo "Tasks: 26 successful, 26 total" (frontend 325 files passed, 1 skipped, 8457 tests passed, 33 skipped; dev-seed 84 files, 1308 tests; supabase 27 files, 1192 tests; data 48 files, 318 tests; docs 8 files, 41 tests; app-shared 151; matching 43; llm 49; argument-condensation 32; question-info 23; filters 22; core 8), then test:unit:tests "Test Files 15 passed (15), Tests 358 passed (358)" and test:unit:infra "Test Files 17 passed (17), Tests 452 passed (452)"
BUILD_EXIT=0
    yarn build: "Tasks: 14 successful, 14 total" (14 cached, full turbo)
DOCS_CHECK_EXIT=0
    yarn workspace @openvaa/docs check: "COMPLETED 719 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS"
DOCS_BUILD_EXIT=0
    yarn workspace @openvaa/docs build: "✓ built in 4.78s", "Wrote site to \"build\"", "✔ done"
DOCS_LINKS_EXIT=0
    yarn workspace @openvaa/docs validate:links --check: "Total findings: 0"
NAV_IDEMPOTENT=yes
    yarn workspace @openvaa/docs generate:navigation exit 0, "✓ No structural changes, titles updated where applicable". The plan's next command, node_modules/.bin/prettier --write apps/docs/src/lib/navigation.config.ts run from the root, exits 0 but formats nothing: the root .prettierignore lists `docs`, so the generator's tab-indented, double-quoted output stayed and git diff --quiet exited 1 (250 lines changed, whitespace and quotes only). Run from apps/docs as generate:docs formats it (yarn format there, here ../../node_modules/.bin/prettier --write src/lib/navigation.config.ts, which applies apps/docs/prettier.config.mjs, as plan 189-04 recorded), Prettier exit 0 and git diff --quiet -- apps/docs/src/lib/navigation.config.ts exit 0: the rerun changes nothing
TF_FMT_EXIT=0
    terraform fmt -check -recursive infra (Terraform v1.16.5): no output
DOCKER_PRODUCTION_BUILD_EXIT=0
    docker build --progress=plain --file apps/frontend/Dockerfile --target production --tag openvaa-frontend:ci . from the root: "naming to docker.io/library/openvaa-frontend:ci", image sha256:69887c42baeda861462a581b00cb3c5a811611456233212af4b5cda842592e20

UNIT_DELTAS=+29 tests across the phase: dev-seed -13 (189-01, the Render template tests, 58 -> 45), docs +4 (189-04, 37 -> 41), infra +16 (189-08, 436 -> 452), frontend +12 (189-09, src/lib/server/startup 39 -> 51) and +10 (189-10, src/lib/analytics 391 -> 401); 189-02 and every other plan 0
    the measured counts agree where a plan gave its total: docs 41 and infra 452 above
