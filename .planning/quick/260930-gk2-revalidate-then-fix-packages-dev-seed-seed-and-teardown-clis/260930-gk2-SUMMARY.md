---
phase: quick-260930-gk2
plan: 01
quick_id: 260930-gk2
status: complete
subsystem: dev-seed
tags: [security, dev-seed, supabase, service-role, cli]
requires: []
provides:
  - "Locality guard (isLocalSupabaseUrl / assertLocalSupabaseUrl / ALLOW_REMOTE_SUPABASE_ENV) enforced in the dev-seed SupabaseAdminClient constructor"
  - "--allow-remote on db:seed and db:seed:teardown; WriterOptions.allowRemote; DEV_SEED_ALLOW_REMOTE=1 env opt-out"
affects:
  - "Every E2E setup/teardown/spec client (inherits the guard via the unchanged tests/ subclass)"
tech-stack:
  added: []
  patterns:
    - "Exact-match host allowlist on the WHATWG-normalised hostname (no substring/suffix matching)"
    - "Run-time wiring drift gate that fails closed when a source yields no value"
key-files:
  created:
    - packages/dev-seed/src/localSupabaseUrl.ts
    - packages/dev-seed/tests/localSupabaseUrl.test.ts
    - packages/dev-seed/tests/cli/localityGuard.test.ts
  modified:
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/src/writer.ts
    - packages/dev-seed/src/cli/seed.ts
    - packages/dev-seed/src/cli/teardown.ts
    - packages/dev-seed/src/cli/help.ts
    - packages/dev-seed/src/cli/teardown-help.ts
    - packages/dev-seed/README.md
decisions:
  - "Guard lives in the SupabaseAdminClient constructor (not the CLIs), on the URL actually handed to createClient, so the Writer and the tests/ harness subclass inherit it"
  - "Allowlist: localhost, 127.0.0.0/8, [::1], host.docker.internal, kong, supabase_kong_<project>; opt-outs are --allow-remote (CLIs) and DEV_SEED_ALLOW_REMOTE=1|true (read at call time)"
metrics:
  completed: 2026-09-30
actuals:
  tokens: 10600
  tasks: 3
  commits: 2
commits: 2
plan_head_before: 37975cf644ecccf800ac02c928b8f46ceb86bc28
plan_head_after: 77e429e9cbdb64db25480786cddb9bf4829524d6
---

# Quick 260930-gk2: Locality guard for the dev-seed service-role client Summary

The dev-seed `SupabaseAdminClient` constructor now refuses any non-local Supabase host. It uses an exact WHATWG-hostname allowlist and runs before `createClient`. Both CLIs and the Writer pass `--allow-remote` through, and `DEV_SEED_ALLOW_REMOTE=1` opts out for library and harness callers. A run-time drift gate proves that every local, E2E and CI wiring URL still passes.

## Outcome: HOLDS → fixed

## Task 1: Revalidation at base (no code change)

- **BASE_SHA:** `37975cf644ecccf800ac02c928b8f46ceb86bc28`
- **Static:** the guard-vocabulary grep over the five construction-path files exited **1** (no hits). The README gap statement count was **1**. The base constructor passed `url ?? SUPABASE_URL` straight to `createClient`. The Writer checked only that the variables were present, and the teardown CLI built the client bare (`new SupabaseAdminClient()`).
- **Dynamic:** `dev-seed client constructed for a non-local host` exited 0, and `tests/ harness client constructed for a non-local host` (with `SUPABASE_URL=https://guard-probe.invalid`) exited 0.
- **Construction sites** (grep, excluding node_modules):
  - `new SupabaseAdminClient(`: 88 occurrences across packages/dev-seed/src (writer), src/cli (teardown), dev-seed tests (3 files + cli + integration), tests/ (global-setup), tests/tests/setup (admin 2, candidate 4, perm 31, shared 3), tests/tests/specs (admin 1, candidate 2, perm 9, storage 1) and tests/tests/utils (1).
  - `new Writer(`: src/cli/seed.ts, tests/seed-test-data.ts, tests/tests/setup/shared/setupFromTemplate.ts, default-template.integration.test.ts, plus the mocked writer.test.ts cases.
  - Subclasses: `tests/tests/utils/supabaseAdminClient.ts` (`extends DevSeedAdminClient`) and `ProbeClient` in ensureProject.test.ts.
  - All of them reach the base constructor. No `apps/` or `scripts/` code imports dev-seed.
- **Wiring URLs** (run-time derivation, exit 0):
  `{"envExample":["http://127.0.0.1:54321","http://127.0.0.1:54321"],"e2eRun":["http://127.0.0.1:54321"],"compose":["http://host.docker.internal:54321"],"configApi":["http://127.0.0.1:54321"],"clientDefaults":["http://localhost:54321","http://localhost:54321"],"visualForward":["http://host.docker.internal:54321"],"seedSql":["http://kong:8000"]}`
- **Existing guard:** none to reuse. `tests/tests/support/preflight.ts` asserts the served checkout and project id only. The single "loopback" hit is `mockOidcIssuer.ts`'s fixed bind host, which is not a Supabase locality check.
- **Decision branch:** **HOLDS**.

## Task 2: Tracer (teardown path), commit `7fec3172d`

- **RED observed:** `localSupabaseUrl.test.ts` failed with `Cannot find module '../src/localSupabaseUrl'`. In `localityGuard.test.ts`, 5 of 7 failed: the refusal cases printed `Cannot reach Supabase…` instead of the marker, `--allow-remote` hit a `parse_args` unknown-option error, and TEARDOWN_USAGE lacked both terms. The env opt-out and local pass-through cases already passed, which is correct because there was no guard yet.
- **GREEN:**
  - Added `src/localSupabaseUrl.ts`.
  - The constructor gained an optional 4th parameter `options: LocalityGuardOptions = {}`. It resolves the URL once and calls `assertLocalSupabaseUrl` before `createClient`. `projectId ?? TEST_PROJECT_ID` is verbatim.
  - The teardown CLI parses `--allow-remote`.
  - The teardown help documents the flag and the env var.
- **Verify:** the six-file set passed 127/127, with the live tiers ensureProject and projectScopedContaminationIsolation RAN. The dev-seed typecheck exited 0, and so did `yarn typecheck:tests`. The teardown CLI refused `https://guard-probe.invalid` with exit 1 and the marker, and without the key.
- **Tracer feedback gate:** after the lint fixes, the verify ran again end to end and passed, so expansion continued.

## Task 3: Seed path + docs, commit `77e429e9c`

- **RED observed:** in the new seed cases, `--allow-remote` failed with a parse_args unknown option, and both seed USAGE assertions failed. The seed refusal cases already passed, because the Writer inherits the constructor guard.
- **GREEN:**
  - `WriterOptions.allowRemote` is forwarded as the constructor's 4th argument.
  - `seed.ts` parses `--allow-remote`.
  - `help.ts` documents the flag and the env var.
  - README changes:
    - Security Notes rewritten: allowlist, both opt-outs, and never setting the opt-out in `.env`. It states that the guard checks the URL the client is actually constructed with.
    - Locality guard added as the first bullet of the guards list.
    - `DEV_SEED_ALLOW_REMOTE` added under Environment.
    - Troubleshooting entry added for the refusal.
    - "no locality check" removed.
- **Proof the invocations still pass:**
  1. The full dev-seed unit suite passed: **64 files / 881 tests, exit 0**. The live tiers **RAN** against the local Supabase: ensureProject (15), projectScopedContaminationIsolation (6) and default-template integration (3, about 12 s).
  2. The E2E-harness probes: `harness default client constructed` with SUPABASE_URL unset, and the refusal for `https://guard-probe.invalid` (non-zero exit, marker present).
  3. The drift gate is green: every wiring source yields at least one URL, and all pass `isLocalSupabaseUrl`.
  4. The remaining gates all exited 0:
     - dev-seed typecheck
     - dev-seed lint (0 errors; the 15 warnings are in untouched generators)
     - `yarn typecheck:tests`
     - `yarn assert:comment-hygiene` (0 violations)
     - Prettier `--check` on all 10 files
     - eslint on the two new test files
  5. The planning-reference scan passed (exit 0), with `BASE_SHA` exported in the same call. The tests/ subclass is byte-identical to BASE_SHA.
  6. The seed CLI refused `https://guard-probe.invalid` with exit 1 and the marker.
- **Full E2E suite: NOT RUN.** It stays PENDING as a batch-level post-merge gate, because every E2E setup/teardown client now constructs through the guard.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Typed the hoisted `createClient` mock**
- **Found during:** Task 2 typecheck
- **Issue:** `vi.fn(() => ({}))` inferred a zero-arity tuple, so `mock.calls[0]?.[0]` failed with TS2493.
- **Fix:** declared the mock as `vi.fn((..._args: Array<unknown>) => ({}))`.
- **Commit:** 7fec3172d

**2. [Rule 1 - Lint] Converted arrow-function helpers in the new tests to function declarations**
- **Found during:** Task 2
- **Issue:** the repo's `func-style` rule failed on the two new test files. The package lint script covers only `src/`, so running eslint directly on the test files caught it.
- **Commit:** 7fec3172d

**3. [Rule 2 - Docs completeness] Added `--allow-remote` rows to the README Flag Reference tables**
- **Found during:** Task 3
- **Issue:** the plan said to "keep the rest of the file unchanged". Leaving the flag tables without the new flag would have made them stale.
- **Fix:** one row in each table. No other README section outside the planned ones was changed.
- **Commit:** 77e429e9c

## Follow-up Observations (not fixed here)

- The teardown CLI's repo-root `.env` load does not reach its client, because ESM evaluates the admin-client module and captures its defaults before the CLI body runs. Only an exported SUPABASE_URL or key retargets `seed:teardown`. The teardown `--help` text still says `.env` variables "take effect without export". That is accurate for seed and inaccurate for teardown's URL and key.
- `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` builds its own service-role `createClient` outside dev-seed, so this guard does not cover it.

## Known Stubs

None.

## Threat Flags

None. The change narrows an existing surface and adds no new endpoint, auth path or trust boundary.

## Self-Check: PASSED

- FOUND: packages/dev-seed/src/localSupabaseUrl.ts
- FOUND: packages/dev-seed/tests/localSupabaseUrl.test.ts
- FOUND: packages/dev-seed/tests/cli/localityGuard.test.ts
- FOUND: commit 7fec3172d
- FOUND: commit 77e429e9c
