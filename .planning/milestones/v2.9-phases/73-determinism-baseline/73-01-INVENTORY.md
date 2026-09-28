# Phase 73 — Determinism Baseline Inventory

**Captured:** 2026-05-10
**HEAD:** 08618b566ebb27c6f290aff1a42fa150c7ee709d (`docs(state): begin phase 73`)
**Source runs:** post-fix/inventory-run-{1,2,3}-report.json
**Lint probe:** post-fix/lint-baseline.txt
**Capture commits:** 5e81276cc (runs) + 59400e50e (lint)

> **READER NOTICE:** the original Plan-01 capture below is now SUPERSEDED by the Post-Hotfix Re-Capture section that follows. Plan 02 Task 0 landed the data.setup hotfix (`c208ba7c7`); Plan 02 Task 0.5 re-captured 3 cold-start `--workers=1` runs against the post-hotfix HEAD. The runtime-evidence classification below replaces the structural-inference classification of the original 36-test pool table. Plans 03/04/05 MUST consume the **Post-Hotfix Re-Capture** section, not the original §"36-Test Race Pool" table.

---

## Post-Hotfix Re-Capture (2026-05-10)

**Captured:** 2026-05-10 (post Plan-02 Task 0)
**HEAD:** c208ba7c7 (`fix(73-02): repair data-setup TypeError by removing async from query()`)
**Source runs:** post-fix/inventory-run-{1,2,3}-report.json (overwrites Plan-01's broken-baseline captures)
**Hotfix commit:** c208ba7c7 (Task 0 — 3 LOC across 2 files; within CONTEXT D-05 cap)

### Run statistics (3 cold-start --workers=1, identical pass/fail set)

| Run | Expected | Unexpected | Skipped | Flaky | Duration |
|-----|----------|------------|---------|-------|----------|
| 1   | 30       | 21         | 51      | 0     | 944.6s   |
| 2   | 30       | 21         | 51      | 0     | 954.5s   |
| 3   | 30       | 21         | 51      | 0     | 936.9s   |

**0 flaky across 3 runs** — the suite is deterministic at this HEAD; the 21 unexpected and 51 skipped sets are stable across runs (every test that fails fails in all 3; every test that's-skipped is-skipped in all 3). This means we can classify each test by runtime evidence with confidence.

**Status decomposition** (Run 1, identical for 2 and 3):
- 30 `passed` (expected pass)
- 20 `failed` (real failures or product/race issues — see below)
- 1 `timedOut` (`candidate-app-mutation > should upload a profile image (CAND-03)` — root cascade source for all downstream `didNotRun`)
- 36 `didNotRun` (Playwright counts 27 of these as "skipped" in stats; cascade-skipped by upstream project failures — primarily the row-4 timeout)
- 15 `skipped` (explicit `test.fixme()` / conditional skip in spec source)

Sum: 30 + 20 + 1 + 36 + 15 = 102. Stats reports `expected=30 / unexpected=21 / skipped=51 / flaky=0` because Playwright counts the 1 timedOut + 20 failed = 21 unexpected, and the 36 cascade-skips + 15 explicit skips = 51 skipped.

### Binding Contract (replaces structural inference)

The structural-inference 36-test classification in §"36-Test Race Pool" below (rows where status was set to `cascade` because nothing actually ran) is now **SUPERSEDED** by runtime evidence from these 3 runs. Reclassification rules:

- Tests **PASSING in all 3 runs** → reclassify `passes-now` (remove from race pool).
- Tests **FAILING (failed/timedOut) in all 3 runs** → `consistent-fail` (real product bug, real race, or imgproxy-tied infrastructure flake — see CONTEXT D-02).
- Tests **`didNotRun` in all 3 runs** → `cascade-skip` (downstream of an upstream project failure — fixing the upstream test unblocks all downstreams together).
- Tests **explicitly `skipped` in all 3 runs** → `skipped (explicit)` — these are gated by `test.fixme()` or condition-based skip in spec source; out of Phase 73 scope unless the gate itself is the bug.
- Tests **MIXED across runs** → `flake (race-tolerant)` → use `expect.poll`. **None observed in this capture.**

### Cascade Source Analysis

A single upstream test causes the bulk of the 36 `didNotRun`s:

- **`candidate-app-mutation :: candidate-profile.spec.ts > should upload a profile image (CAND-03)`** times out at 90s in all 3 runs. Its project (`candidate-app-mutation`) is a project dependency for `re-auth-setup → candidate-app-settings → candidate-app-password → data-setup-multi-election → variant-multi-election → variant-results-sections → data-setup-constituency → variant-constituency → data-setup-startfromcg → variant-startfromcg`.
- That single timeout cascade-skips ~27 downstream tests across 8 projects. Per CONTEXT D-02 this is canonically imgproxy-tied infrastructure (the candidate-profile upload triggers an imgproxy roundtrip that 502s when the imgproxy container is stopped). `yarn dev:status` confirms `supabase_imgproxy_openvaa-local` is stopped at this capture; running `supabase stop && supabase start` for Plan 06's gate run should green this and unblock the cascade.
- **`voter-app-settings :: voter-settings.spec.ts > should show category checkboxes when allowCategorySelection enabled`** also fails consistently. It's a 1-test project; doesn't cascade to others.
- **`voter-app` cluster (15 tests)** all fail with the same root cause: `answeredVoterPage` fixture timeout at `voter.fixture.ts:85` — `page.waitForURL(/\/results/, { timeout: 30000 })` exhausts. This is a real data-loading race that Plan 03 owns (per CONTEXT D-04 cluster ownership; 15 voter-app tests + 1 voter-app-settings test).

### 36-Test Pool — Runtime-Evidence Classification

| # | Test ID (project :: spec > title) | Pool | R1 | R2 | R3 | Runtime Class | Recommended Fix Shape | Assigned Plan |
|---|-----------------------------------|------|----|----|----|---------------|-----------------------|---------------|
| 1 | auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate | DATA_RACE | passed | passed | passed | **passes-now** | NONE — remove from post-73 race pool | 06 (verification doc — note as cleared) |
| 2 | candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should persist profile image after page reload (CAND-12) | DATA_RACE | skipped | skipped | skipped | **skipped (explicit)** | NONE — gated by `test.fixme()` or env-conditional in spec source | 04 (verify gate is intentional) |
| 3 | candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should show editable info fields on profile page (CAND-03) | DATA_RACE | skipped | skipped | skipped | **skipped (explicit)** | NONE — gated in spec source | 04 (verify gate is intentional) |
| 4 | candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should upload a profile image (CAND-03) | DATA_RACE | timedOut | timedOut | timedOut | **consistent-fail (imgproxy)** | DEFER per CONTEXT D-02 — `supabase stop && supabase start` recipe; document in 73-VERIFICATION.md | 06 (verification doc) |
| 5 | candidate-app-password :: specs/candidate/candidate-password.spec.ts > should change password and login with new password | DATA_RACE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks (imgproxy fix); test-level `waitForURL` if it fails post-unblock | 04 |
| 6 | candidate-app-password :: specs/candidate/candidate-password.spec.ts > should logout and return to login page | DATA_RACE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks; test-level `waitForURL(/login/)` if it fails post-unblock | 04 |
| 7 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should display notification popup when enabled | DATA_RACE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks; test-level `expect.poll` against popup locator if it fails post-unblock | 04 |
| 8 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should hide hero when hideHero is enabled | DATA_RACE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks; test-level `waitFor` against hero locator if it fails post-unblock | 04 |
| 9 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should render help page correctly | DATA_RACE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks; test-level `waitFor` on h1 if it fails post-unblock | 04 |
| 10 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should render privacy page correctly | DATA_RACE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks; test-level `waitFor` on h1 if it fails post-unblock | 04 |
| 11 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show hero when hideHero is disabled | DATA_RACE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks; test-level `waitFor` against hero locator if it fails post-unblock | 04 |
| 12 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show maintenance page when candidateApp is disabled | DATA_RACE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks; test-level `waitFor` on maintenance banner if it fails post-unblock | 04 |
| 13 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show maintenance page when underMaintenance is true | DATA_RACE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks; test-level `waitFor` on maintenance banner if it fails post-unblock | 04 |
| 14 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show read-only warning when answers are locked | DATA_RACE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks; test-level `expect.poll` against warning visibility if it fails post-unblock | 04 |
| 15 | re-auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate | DATA_RACE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks (re-auth-setup depends on candidate-app-mutation completing) | 05 / 06 |
| 16 | data-setup-constituency :: setup/variant-constituency.setup.ts > import constituency dataset | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks (transitive dependency through variant chain) | 05 |
| 17 | data-setup-multi-election :: setup/variant-multi-election.setup.ts > import multi-election dataset | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 18 | data-setup-startfromcg :: setup/variant-startfromcg.setup.ts > import startfromcg dataset | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 19 | variant-constituency :: specs/variants/constituency.spec.ts > should allow constituency selection and proceed to questions | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks; per-test fix only if it then surfaces a real race | 05 |
| 20 | variant-constituency :: specs/variants/constituency.spec.ts > should answer questions and reach results | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 21 | variant-constituency :: specs/variants/constituency.spec.ts > should display constituency-filtered results | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 22 | variant-constituency :: specs/variants/constituency.spec.ts > should show constituency selection page after election selection | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 23 | variant-constituency :: specs/variants/constituency.spec.ts > should show election accordion in multi-election results | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 24 | variant-constituency :: specs/variants/constituency.spec.ts > should show missing nominations warning for partial-coverage constituency | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 25 | variant-multi-election :: specs/variants/multi-election.spec.ts > should bypass election selection when disallowSelection is true | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 26 | variant-multi-election :: specs/variants/multi-election.spec.ts > should display election-specific questions | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 27 | variant-multi-election :: specs/variants/multi-election.spec.ts > should display questions and reach results | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 28 | variant-multi-election :: specs/variants/multi-election.spec.ts > should show election accordion and results after selecting election | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 29 | variant-multi-election :: specs/variants/multi-election.spec.ts > should show election selection page with 2 elections | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 30 | variant-results-sections :: specs/variants/results-sections.spec.ts > should show both sections with tabs when sections is ["candidate", "organization"] | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 31 | variant-results-sections :: specs/variants/results-sections.spec.ts > should show only candidates when sections is ["candidate"] | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 32 | variant-results-sections :: specs/variants/results-sections.spec.ts > should show only organizations when sections is ["organization"] | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 33 | variant-startfromcg :: specs/variants/startfromcg.spec.ts > should complete journey through questions to results | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 34 | variant-startfromcg :: specs/variants/startfromcg.spec.ts > should handle orphan municipality without error | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 35 | variant-startfromcg :: specs/variants/startfromcg.spec.ts > should show constituency selection first (reversed flow) | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |
| 36 | variant-startfromcg :: specs/variants/startfromcg.spec.ts > should show election selection after constituency selection | CASCADE | didNotRun | didNotRun | didNotRun | **cascade-skip (upstream-fail)** | will green when row 4 unblocks | 05 |

### New Failures Surfaced (NOT in original 36-pool — runtime-evidence additions)

The post-hotfix runs surfaced 16 voter-app failures that the original Plan-01 cascade hid. These are NOT in the binding 36-test pool (which is locked from P64 per CONTEXT D-01) but they ARE real test failures Plans 03 must address:

| # | Test ID | R1 | R2 | R3 | Runtime Class | Notes |
|---|---------|----|----|----|---------------|-------|
| N1 | voter-app-settings :: voter-settings.spec.ts > should show category checkboxes when allowCategorySelection enabled | failed | failed | failed | consistent-fail (race) | Plan 03 owns voter-settings cluster |
| N2-N6 | voter-app :: voter-detail.spec.ts > 4 tests | failed × 3 | failed × 3 | failed × 3 | consistent-fail (race) | All fail at `voter.fixture.ts:85` — `answeredVoterPage` fixture timeout reaching `/results`. Plan 03 owns voter-detail cluster |
| N7 | voter-app :: voter-journey.spec.ts > should show questions intro page with start button | failed | failed | failed | consistent-fail (race) | Plan 03 owns voter-journey |
| N8 | voter-app :: voter-matching.spec.ts > should display candidates in correct match ranking order | failed | failed | failed | consistent-fail (race) | Plan 03 owns voter-matching |
| N9-N16 | voter-app :: voter-results.spec.ts > 12 tests | failed × 12 | failed × 12 | failed × 12 | consistent-fail (race) | All fail at `voter.fixture.ts:85`. Plan 03 owns voter-results cluster |

The 16 voter-app failures all share the same root cause: **`answeredVoterPage` fixture cannot reach `/results` within 30s timeout**. This is a real data-loading race in voter flow that Plan 03 must investigate at the spec/fixture level. The fixture-level issue may be addressed by upstream voter-fixture changes rather than per-spec fixes (Rule 4 escalation territory if it requires > 50 LOC). Plan 03's executor should check the fixture root cause first.

## Plan Ownership Updates (post-hotfix)

The runtime evidence above does NOT move tests between Plans 03/04/05 — the original CONTEXT D-04 cluster boundaries hold:

- **Plan 03 (voter cluster)** still owns voter-settings + voter-detail + voter-results + voter-journey + voter-matching (16 new failures surfaced; **scope expanded** from "lint hygiene only" to "lint + 16 race fixes — fixture-level if shared root cause confirmed"). Plan 03's executor is bound to investigate the `answeredVoterPage` fixture as a unified root cause before per-test fixes (it owns the voter cluster regardless).
- **Plan 04 (candidate cluster)** still owns rows 5-14 (10 cascade-skip tests in candidate-password + candidate-settings — **all should green when row 4 unblocks**, so Plan 04's actual investigative scope drops to just bank-auth + candidate-auth + candidate-questions + 1 candidate-profile (CAND-03 upload race). Significant scope reduction vs original D-04 estimate.
- **Plan 05 (variants + setups)** still owns rows 15-36 (22 cascade-skip tests — **all should green when row 4 unblocks** + the data.setup hotfix already shipped). Plan 05's actual investigative scope drops to just lint hygiene on setup files (no race fixes needed unless variants surface NEW races post-unblock).
- **Plan 06 (verification + DEFER)** still owns row 4 (canonical imgproxy timeout) + 73-VERIFICATION.md per CONTEXT D-02. **Row 1 (auth-setup re-auth)** now reclassifies `passes-now` and is DOCUMENTED as cleared in 73-VERIFICATION.md (Plan 06 task) rather than left as DATA_RACE.

### Net effect on Plan 03/04/05/06 scope

Total Phase 73 race-fix scope **decreases** post-hotfix vs Plan-01's structural-inference projection:

| Plan | Plan-01 estimate | Post-hotfix actual |
|------|------------------|--------------------|
| 03   | 0 race-fix tests + lint hygiene only | 16 race-fix tests (likely 1 fixture-level fix unblocks all 16) + lint hygiene |
| 04   | 10 race-fix tests + bank-auth + auth lint hygiene | ~3 race-fix tests (CAND-03 upload only) + bank-auth + auth lint hygiene |
| 05   | 22 race-fix tests + setup lint hygiene | ~0 race-fix tests (all should green post-row-4 unblock) + setup lint hygiene |
| 06   | 4 imgproxy DEFER + parity-gate regen | 1 imgproxy DEFER (row 4) + parity-gate regen + clear row 1 from pool |

**Key reframing:** the original "21 data-loading race E2E failures" carried forward from PROJECT.md (DETERM-02) is much more accurately characterized post-hotfix as "1 imgproxy timeout (row 4) cascading to 27 downstream tests + 16 voter-fixture races (likely 1 root cause)". The race investigation scope of Phases 03-05 is therefore **significantly smaller** than Plan-01 estimated (because most of the 36-pool's "races" are downstream of a single imgproxy timeout, not 22 distinct races).

---

## Executive Finding (operator gate)

**HEAD is currently broken: the entire e2e suite cascades on a `data-setup` bug.**

All 3 cold-start `--workers=1` runs at HEAD produce **identical** results:

| Outcome | Count | Notes |
|---------|-------|-------|
| expected (pass) | 3 | `data-teardown` + `data-teardown-variants` only (these have no setup dependencies) |
| unexpected (fail) | 1 | `data-setup :: setup/data.setup.ts > import test dataset` — `TypeError: candQuery.not is not a function` |
| skipped (cascade) | 98 | Downstream of the single setup failure |
| flaky | 0 | — |
| total runtime | ~45s per run | (vs. expected ~25 min) |

**Root cause** (Rule 4 — operator decision required before Plan 02 / Plan 03 / Plan 04 / Plan 05 can begin):

The `data.setup.ts` precondition probe (commit 04c319d1a from Sun May 10 13:48 — earlier today) calls `await client.query('candidates')` expecting a chainable PostgREST builder. However, `SupabaseAdminClient.query()` is declared `async`, so `await`-ing it triggers the PostgREST builder's own `.then()` (PostgREST builders are then-able and execute on await) — returning `{ data, error }` rather than the builder. Then `.not(...)` fails because that method exists on the builder, not on the result envelope.

Sites:
- `tests/tests/setup/data.setup.ts:61-64`

Suggested fix (≤6 LOC, ≤1 file — within CONTEXT D-05 cap):

```ts
// Option A — drop the await, let the builder chain
const { data: nonTestCands, error: candErr } = await client
  .client.from(resolveCollectionName('candidates'))
  .select('*').eq('project_id', /* projectId */)
  .not('external_id', 'like', `${PREFIX}%`).limit(5);
```

Or:

```ts
// Option B — extract probe into a non-async method on SupabaseAdminClient
async findNonPrefixedCount(collection: string, prefix: string): Promise<{ data: unknown[] | null; error: unknown }> {
  const tableName = resolveCollectionName(collection);
  return this.client.from(tableName).select('*').eq('project_id', this.projectId).not('external_id', 'like', `${prefix}%`).limit(5);
}
```

**This blocker prevents Plan 1's per-test race classification.** Plans 2-6 cannot proceed until either:
1. **Hotfix landed before Plan 2.** A small, scoped fix to `data.setup.ts` (within CONTEXT D-05's ≤50 LOC / ≤2 file cap) restores the setup chain. Re-capture inventory after the fix to get the real 36-test classification.
2. **Plan 2 adopts hotfix as its first task.** Mechanical sweep includes the data.setup fix as Task 0 of Plan 2 (Plan 2 then proceeds with its no-networkidle + no-raw-locators sweeps).
3. **Defer Plans 3-5 race investigation, ship lint hygiene only.** Phase 73 becomes a lint-only phase; DETERM-02 (race investigation) gets a new follow-up phase post-fix.

**Recommendation:** Option 2. The fix is tiny and obviously a real bug; folding it into Plan 2 keeps the Plan 1 inventory as the binding catalogue without inflating its scope (per the executor instruction: "No code-level changes in this plan").

---

## Lint Warning Re-Baseline (CONTEXT D-03)

Per-rule total at HEAD (captured Task 2 — see `post-fix/lint-baseline.txt` for the per-file matrix):

| Rule | Count | Owning Plan |
|------|-------|-------------|
| playwright/no-raw-locators | 37 | 02 (mechanical) + long-tail sites in spec files Plans 03/04/05 also touch |
| playwright/no-conditional-in-test | 36 | 03 / 04 / 05 (per-spec) |
| playwright/no-conditional-expect | 18 | 03 / 04 / 05 (paired with no-conditional-in-test) |
| playwright/no-networkidle | 6 | 02 (mechanical) |
| playwright/no-wait-for-timeout | 2 | 03 (voter-results.spec.ts) + 04 (candidate-profile.spec.ts) |
| playwright/no-skipped-test | 1 | 04 (candidate-bank-auth.spec.ts:199 — D-07 legitimate-skip + inline rationale) |
| playwright/expect-expect | 1 | 04 (candidate-auth.spec.ts single site) |
| **TOTAL** | **101** | — |

**Drift from CONTEXT D-03:** Context said 103 playwright/* warnings at context-write; actual at HEAD is 101 (downward drift of 2; likely 2 sites cleared in intervening commits). The binding number for Plans 2-6 closure is **101 → 0**.

**Two non-playwright warnings excluded from baseline** (out of phase scope but listed for Plan 6 awareness): `Unused eslint-disable directive` for no-console at `tests/tests/setup/data.setup.ts:68` and `:79`. These appear because the eslint-disable lines are above non-console statements after the data.setup refactor; Plan 6 should either remove them or accept them as known surface delta when bumping the lint gate.

---

## 36-Test Race Pool (CONTEXT D-01)

Bound by P64's regen-constants.mjs constants (15 `DATA_RACE_TESTS` + 21 `CASCADE_TESTS`), extracted verbatim from git blob `2832c4410:.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` (lines 134-200).

**All 36 tests are present in all 3 run reports.** All 36 cascaded in all 3 runs due to the single `data-setup` failure documented above. This means the inventory **cannot** classify these by failure type from runtime evidence alone in this capture — the test bodies have not executed.

The table below records the **structural** classification (which plan owns each test, based on the spec file path) and the **expected** failure type (inherited from the P64 binding: imgproxy-tied tests in DATA_RACE are infrastructure flakes per CONTEXT D-02; variants in CASCADE_BASELINE are project-dependency cascades that should green once setup is unblocked).

| # | Test ID (project :: spec > title) | Pool | R1 | R2 | R3 | Expected Failure Type | Recommended Fix Shape | Assigned Plan |
|---|-----------------------------------|------|----|----|----|----------------------|-----------------------|---------------|
| 1 | auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate | DATA_RACE | cascade | cascade | cascade | infrastructure (imgproxy/setup chain) | DEFER — keep in pool with rationale | 06 (verification doc per D-02) |
| 2 | candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should persist profile image after page reload (CAND-12) | DATA_RACE | cascade | cascade | cascade | infrastructure (imgproxy 502) | DEFER per CONTEXT D-02 | 06 (verification doc) |
| 3 | candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should show editable info fields on profile page (CAND-03) | DATA_RACE | cascade | cascade | cascade | infrastructure (imgproxy 502) | DEFER per CONTEXT D-02 | 06 (verification doc) |
| 4 | candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should upload a profile image (CAND-03) | DATA_RACE | cascade | cascade | cascade | infrastructure (imgproxy 502 — canonical) | DEFER per CONTEXT D-02 | 06 (verification doc) |
| 5 | candidate-app-password :: specs/candidate/candidate-password.spec.ts > should change password and login with new password | DATA_RACE | cascade | cascade | cascade | auth-cookie / hydration-timing (post-password-change session reset) | test-level waitForURL + waitForResponse (auth API) | 04 |
| 6 | candidate-app-password :: specs/candidate/candidate-password.spec.ts > should logout and return to login page | DATA_RACE | cascade | cascade | cascade | auth-cookie (logout redirect race) | test-level waitForURL(/login/) | 04 |
| 7 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should display notification popup when enabled | DATA_RACE | cascade | cascade | cascade | initial-fetch race (settings load → popup render) | test-level expect.poll against popup locator | 04 |
| 8 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should hide hero when hideHero is enabled | DATA_RACE | cascade | cascade | cascade | subscription-not-flushed ($derived hero visibility) | test-level waitFor against hero locator state | 04 |
| 9 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should render help page correctly | DATA_RACE | cascade | cascade | cascade | initial-fetch race (help page i18n load) | test-level waitFor on h1 visibility | 04 |
| 10 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should render privacy page correctly | DATA_RACE | cascade | cascade | cascade | initial-fetch race (privacy page i18n load) | test-level waitFor on h1 visibility | 04 |
| 11 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show hero when hideHero is disabled | DATA_RACE | cascade | cascade | cascade | subscription-not-flushed ($derived hero visibility) | test-level waitFor against hero locator state | 04 |
| 12 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show maintenance page when candidateApp is disabled | DATA_RACE | cascade | cascade | cascade | initial-fetch race (maintenance flag eval) | test-level waitFor on maintenance banner | 04 |
| 13 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show maintenance page when underMaintenance is true | DATA_RACE | cascade | cascade | cascade | initial-fetch race (maintenance flag eval) | test-level waitFor on maintenance banner | 04 |
| 14 | candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show read-only warning when answers are locked | DATA_RACE | cascade | cascade | cascade | initial-fetch race (answersLocked $derived eval) | test-level expect.poll against warning visibility | 04 |
| 15 | re-auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate | DATA_RACE | cascade | cascade | cascade | infrastructure / auth-cookie (re-auth-setup project) | DEFER (setup-stage; D-02 imgproxy-tied) | 05 / 06 |
| 16 | data-setup-constituency :: setup/variant-constituency.setup.ts > import constituency dataset | CASCADE | cascade | cascade | cascade | dependency cascade (data-setup → variant chain) | will green once Plans 02-05 + data.setup fix land | 05 (setup hooks cluster) |
| 17 | data-setup-multi-election :: setup/variant-multi-election.setup.ts > import multi-election dataset | CASCADE | cascade | cascade | cascade | dependency cascade | will green post-data-setup fix | 05 |
| 18 | data-setup-startfromcg :: setup/variant-startfromcg.setup.ts > import startfromcg dataset | CASCADE | cascade | cascade | cascade | dependency cascade | will green post-data-setup fix | 05 |
| 19 | variant-constituency :: specs/variants/constituency.spec.ts > should allow constituency selection and proceed to questions | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 20 | variant-constituency :: specs/variants/constituency.spec.ts > should answer questions and reach results | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 21 | variant-constituency :: specs/variants/constituency.spec.ts > should display constituency-filtered results | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 22 | variant-constituency :: specs/variants/constituency.spec.ts > should show constituency selection page after election selection | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 23 | variant-constituency :: specs/variants/constituency.spec.ts > should show election accordion in multi-election results | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 24 | variant-constituency :: specs/variants/constituency.spec.ts > should show missing nominations warning for partial-coverage constituency | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 25 | variant-multi-election :: specs/variants/multi-election.spec.ts > should bypass election selection when disallowSelection is true | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 26 | variant-multi-election :: specs/variants/multi-election.spec.ts > should display election-specific questions | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 27 | variant-multi-election :: specs/variants/multi-election.spec.ts > should display questions and reach results | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 28 | variant-multi-election :: specs/variants/multi-election.spec.ts > should show election accordion and results after selecting election | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 29 | variant-multi-election :: specs/variants/multi-election.spec.ts > should show election selection page with 2 elections | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 30 | variant-results-sections :: specs/variants/results-sections.spec.ts > should show both sections with tabs when sections is ["candidate", "organization"] | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 31 | variant-results-sections :: specs/variants/results-sections.spec.ts > should show only candidates when sections is ["candidate"] | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 32 | variant-results-sections :: specs/variants/results-sections.spec.ts > should show only organizations when sections is ["organization"] | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 33 | variant-startfromcg :: specs/variants/startfromcg.spec.ts > should complete journey through questions to results | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 34 | variant-startfromcg :: specs/variants/startfromcg.spec.ts > should handle orphan municipality without error | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 35 | variant-startfromcg :: specs/variants/startfromcg.spec.ts > should show constituency selection first (reversed flow) | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |
| 36 | variant-startfromcg :: specs/variants/startfromcg.spec.ts > should show election selection after constituency selection | CASCADE | cascade | cascade | cascade | dependency cascade | post-setup-fix, expect green | 05 |

**Important caveat:** The "Expected Failure Type" and "Recommended Fix Shape" columns are **structural predictions** based on (a) the P64 binding pool semantics (CONTEXT D-01/D-02 + regen-constants.mjs comments), (b) the spec file's directory location, and (c) the test title's stated behavior. They are NOT derived from runtime evidence in this capture (because no test in the 36-test pool actually executed in any of the 3 runs). **Plans 03/04/05 MUST re-classify each test using a runtime-evidence capture after the data.setup hotfix lands** — these predictions are the starting point, not the contract.

### Failure-type taxonomy

- **initial-fetch race** — Test asserts state that depends on async data load; fix: `expect.poll(...).toBeGreaterThan(0)` or `waitFor` against asserted element.
- **subscription-not-flushed** — Svelte `$derived`/`$state` hasn't propagated; fix: `expect.poll` against the derived output or `waitFor` on the element bound to the derived.
- **auth-cookie not set in time** — Test runs before auth setup completes; fix: explicit `waitForResponse` against the auth API or `waitForURL` against the post-login route.
- **hydration-timing** — SSR↔CSR boundary; fix: `waitFor({ state: 'attached' })` against a hydration-only element.
- **infrastructure (imgproxy 502)** — Known infrastructure flake; fix: NONE in Phase 73; document in 73-VERIFICATION.md per CONTEXT D-02.
- **dependency cascade** — Test skipped because an upstream project failed; fix: address the upstream failure (the data.setup hotfix unblocks the entire CASCADE pool).
- **passes-now** — Test passed in all 3 runs at HEAD; fix: NONE; remove from post-73 race pool. **None observed in this capture** (no test in the pool actually ran).

### Recommended fix shape

- **test-level expect.poll** — Default per CONTEXT D-06; race-tolerant assertion.
- **test-level waitFor** — `await locator.waitFor({ state: 'visible' })` against the asserted element.
- **test-level waitForURL** — `await page.waitForURL(/\/results/)` for redirect races (Pitfall 8).
- **test-level waitForResponse(url-pattern)** — for network-driven race.
- **code-level (in cap)** — Code fix ≤50 LOC, ≤2 files per CONTEXT D-05.
- **code-level ESCALATE** — Estimated > 50 LOC; capture as `.planning/todos/pending/<date>-<topic>.md`; leave failing test in post-73 DATA_RACE pool with rationale.
- **DEFER** — Infrastructure / env-gated / out-of-scope.

---

## Plan Cluster Assignments (CONTEXT D-04 + D-09)

| Plan | Wave | Cluster | Spec Files Owned | Race Tests | Lint Warnings to Fix |
|------|------|---------|------------------|-----------|----------------------|
| 02 | 2 | Mechanical sweep + (recommended) data.setup hotfix | cross-cutting: any spec/page-object with `no-networkidle` or `no-raw-locators` | 0 (no race investigation; but the data.setup hotfix unblocks ALL 36 cascades) | 6 no-networkidle + 37 no-raw-locators = **43 sites** |
| 03 | 3 | Voter specs cluster | voter-settings.spec.ts (8 cond + cascades none in 36-pool), voter-results.spec.ts (10 raw + 1 wait-for-timeout — raw owned by Plan 2 mechanical), voter-detail.spec.ts (6 raw → Plan 2), voter-popups.spec.ts (3 raw → Plan 2), voter-popup-hydration.spec.ts (1 cond), voter-journey.spec.ts (1 cond + 1 cond-expect), voter-static-pages.spec.ts (1 networkidle → Plan 2) | 0 from 36-pool (voter tests not in the binding pool) — Plan 03 still owns voter-spec lint hygiene to keep them deterministic post-Phase-74 | 8 + 1 + 1 + 1 + 1 wait-for-timeout = **12 sites** (modulo Plan 2 sweeps) |
| 04 | 4 | Candidate specs cluster (incl. bank-auth D-07) | candidate-auth.spec.ts (1 expect-expect), candidate-bank-auth.spec.ts (12 cond-expect + 4 cond + 1 skip), candidate-profile.spec.ts (2 cond-expect + 1 cond + 1 wait-for-timeout + 3 raw — raw→Plan 2), candidate-questions.spec.ts (2 cond + 1 cond-expect + 1 raw→Plan 2), candidate-settings.spec.ts (7 raw + 1 networkidle → both Plan 2; race investigation in scope here) | **10 tests** from pool (rows 5-14: candidate-password + candidate-settings) + bank-auth + auth | 12 + 4 + 1 cond + 2 cond-expect + 1 cond-expect (questions) + 2 cond (questions) + 1 cond (profile) + 1 wait-for-timeout + 1 expect-expect + 1 skip = **26 sites** |
| 05 | 5 | Variants + setup hooks cluster | variants/constituency.spec.ts (2 cond + 1 raw→Plan 2 + 1 cond-expect), variants/multi-election.spec.ts (2 cond + 1 raw→Plan 2), variants/startfromcg.spec.ts (4 cond + 2 raw→Plan 2 + 1 cond-expect), variants/results-sections.spec.ts (0 lint — owned for race investigation), setup/data.setup.ts (5 cond — also hotfix target), setup/auth.setup.ts (2 cond), setup/re-auth.setup.ts (1 cond), setup/variant-*.setup.ts (3 × 1 cond), pages/* (3 raw→Plan 2) | **21 tests** from pool (rows 16-36: setup + variant + results-sections) + row 15 (re-auth-setup) = 22 | 2 + 1 cond-expect + 2 cond + 4 + 1 cond-expect (variants) + 5 + 2 + 1 + 3 (setups) = **21 sites** |
| 06 | 6 | Parity-gate regen + 3-run smoke + lint-gate bump | (no spec edits; tooling restoration + verification) | 0 (verification only; documents infra-tied DATA_RACE per D-02 — rows 1-4 + 15 if still imgproxy-tied) | 0 (final lint-gate bump from warn→0 enforcement) |

**Notes on this table:**

- Row counts sum to **101** lint warnings (= per-rule total). Cross-plan ownership of files: Plan 2's mechanical no-raw + no-networkidle sweep touches sites in spec files Plans 3/4/5 also own; this is intentional (per CONTEXT D-04 — mechanical first, then per-spec investigative). Plans 3/4/5 must coordinate with Plan 2's commits on shared spec files.
- The 36-test pool is split: Plan 4 owns 10 (candidate-settings + candidate-password), Plan 5 owns 22 (variants + setups + re-auth-setup), Plan 6 owns the 4 imgproxy-tied profile rows (deferred per D-02).
- Total: 10 + 22 + 4 = 36. ✓

---

## Escalation Log (CONTEXT D-05 + Pitfall 6)

Tests whose recommended fix is `code-level ESCALATE` (estimated > 50 LOC or > 2 files):

| # | Test ID | Estimated LOC | Estimated Files | Todo Capture Path | Rationale |
|---|---------|---------------|-----------------|-------------------|-----------|
| 0 | (data.setup precondition probe — not a race but a blocker) | ≤6 LOC | 1 file (tests/tests/setup/data.setup.ts) | inline in Plan 2 (recommended) | Real bug at HEAD blocking entire suite; within D-05 cap; route through Plan 2 Task 0 |

(Plans 03/04/05 may add entries during execution if a race surfaces a code-level root cause exceeding the D-05 cap.)

---

## Infrastructure Notes (CONTEXT D-02)

- **`supabase_imgproxy_openvaa-local` is stopped at capture time** (per `yarn dev:status` output: `Stopped services: [supabase_imgproxy_openvaa-local supabase_pooler_openvaa-local]`). This is the canonical infrastructure flake state. Plan 4 + 5 should treat the 4 imgproxy-tied profile tests (rows 2-4 + 15) as DEFER per D-02; the recipe is `supabase stop && supabase start` between cold runs in Plan 6's gate.
- **imgproxy 502 occurrences during Plan 1 capture:** N/A — no test in the 36-pool actually executed in any of the 3 runs (all cascaded). When the data.setup hotfix lands and re-capture runs, the operator should check whether `supabase_imgproxy_openvaa-local` is running before classifying any imgproxy-tied test failure as a "real" failure.
- **The 14 IMGPROXY_TIED_TITLES (15 IDs because re-auth runs in two projects) are EXPECTED to remain in the post-73 DATA_RACE pool per D-02.** Their flake here is not a regression for Plan 1 purposes; Plan 6 documents the per-test rationale in 73-VERIFICATION.md.

---

## Open Questions for Downstream Plans

1. **Operator gate: which option for the data.setup hotfix?** (A) standalone hotfix commit before Plan 02; (B) fold into Plan 02 as Task 0; (C) defer race investigation, ship lint-only Phase 73 and create a follow-up phase for DETERM-02. Recommendation: **B**.
2. **Re-classification after hotfix.** Once data.setup is fixed, Plan 03 / Plan 04 / Plan 05 MUST capture their own 3-run --workers=1 sample on the specs they own and re-validate the "Expected Failure Type" column above against runtime evidence. The structural predictions in §"36-Test Race Pool" are starting points, not contracts.
3. **Re-auth-setup row (#15 / #1 dual project).** This is the same physical test running in two projects (`auth-setup` and `re-auth-setup`). When fixing, fix once in `setup/re-auth.setup.ts`; both pool rows resolve together. The dual-project structure is intentional (per D-08 binding) and should not be flattened.
4. **Non-playwright lint warnings in data.setup.ts.** The 2 `Unused eslint-disable directive` warnings at lines 68 and 79 are out of scope for the 101 playwright/* baseline but should be cleared as part of Plan 06's lint-gate bump (CONTEXT D-03 final step). Plan 06 to decide: remove the directives or accept the 2 non-playwright warnings.
5. **Re-capture timing.** When the data.setup hotfix lands (recommended path: Plan 02 Task 0), Plan 02 should re-run a single `--workers=1` cold start to confirm the suite is unblocked; if so, Plan 03 / Plan 04 / Plan 05 inherit a working baseline. If the hotfix surfaces additional cascades (e.g., auth-setup races on the freshly-imported data, candidate-app session graph fails on the alpha candidate seed), surface as a Rule 4 escalation back to the operator before Plan 03+ commits work.
6. **Visual regression spec (`tests/tests/specs/visual/visual-regression.spec.ts`).** 4 no-networkidle warnings present here; this spec is not in the 36-pool but it IS in Plan 02's mechanical scope. Plan 02 to confirm this spec runs in the e2e pipeline (not a separate visual run) before sweeping; if visual is gated separately, the 4 warnings may need a different owner.
