---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-controls
plan: 05
subsystem: e2e-test-harness
tags: [assertions, teardown, measurement, codemod, dev-seed]
status: complete
requires:
  - "140-04 (F9 positive controls & catch half)"
  - "packages/dev-seed runTeardown + SupabaseAdminClient base class"
provides:
  - "tests/tests/setup/shared/assertTeardown.ts — runTeardownAsserted, single owner of the F3 assertion"
  - "SupabaseAdminClient.countRowsByPrefix — exact HEAD count probe over the ten teardown tables"
  - "ALLOWED_TEARDOWN_TABLES exported from @openvaa/dev-seed"
  - "140-MEASUREMENT.md — the 26-row measured table plan 06 adjudicates against"
affects:
  - "all 27 *.teardown.ts assertion sites"
  - "plan 06 (matcher adjudication consumes 140-MEASUREMENT.md)"
tech-stack:
  added: []
  patterns:
    - "one shared helper owns a cross-cutting assertion; call sites carry no matcher"
    - "helper accepts a caller-supplied client and owns no test wrapper"
    - "transient INJECTED-marker instrumentation + three-check hygiene post-gate"
key-files:
  created:
    - tests/tests/setup/shared/assertTeardown.ts
    - .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-MEASUREMENT.md
  modified:
    - packages/dev-seed/src/cli/teardown.ts
    - packages/dev-seed/src/index.ts
    - tests/tests/utils/supabaseAdminClient.ts
    - "27 tests/tests/setup/**/*.teardown.ts files"
decisions:
  - "Kept the pre-change matcher in the helper verbatim (D-02), making the 27-site codemod behaviour-preserving by construction"
  - "Did not delete pre-existing prose to satisfy two literal grep criteria; substituted stronger structural checks and recorded the corrections"
  - "Reverted eslint --fix collateral in two out-of-scope files rather than letting them ride along"
metrics:
  duration: ~55 min
  completed: 2026-08-15
actuals:
  tokens: 13000
  tasks: 3
  commits: 3
---

# Phase 140 Plan 05: Shared Teardown Assertion Helper + F3 Measurement Summary

Collapsed 27 inline delete-count assertions into one shared `runTeardownAsserted` helper
carrying the pre-change matcher unchanged, added an exact-count row probe, and took the
instrumented full-suite measurement (26 observations, one named gap) that plan 06's matcher
choice consumes.

## What Was Built

**Task 1 — probe + helper** (`d05015dce`)

- `ALLOWED_TEARDOWN_TABLES` exported from `packages/dev-seed/src/cli/teardown.ts` and
  re-exported from the barrel, so the `tests/` probe iterates the same ten tables
  `bulk_delete` clears instead of keeping a second hand-maintained copy.
- `SupabaseAdminClient.countRowsByPrefix(prefix)` — a per-table HEAD count query
  (`{ count: 'exact', head: true }`) scoped by `project_id` and `external_id LIKE '<prefix>%'`,
  summing the returned `count`. Never reads the length of a row array, so a prefix matching
  more rows than one PostgREST page is still counted correctly. Read-only; returns integers
  only, no row content. The class doc block's "Added by this subclass" list was updated in the
  same edit so it did not become a fresh instance of the F10 drift class.
- `tests/tests/setup/shared/assertTeardown.ts` exporting
  `runTeardownAsserted(prefix, client): Promise<void>`. It accepts a caller-supplied client
  (never constructs one), owns no test wrapper, and forwards the prefix verbatim — no default,
  no normalisation, no fallback, no swallowing try/catch — so `runTeardown`'s two-character
  mass-delete guard keeps its full reach.

**Task 2 — the 27-site codemod** (`9c2a1535a`)

Each site's `runTeardown(...)` + `expect(...)` pair collapsed to a single
`await runTeardownAsserted(PREFIX, client);`. `@openvaa/dev-seed` and `expect` imports removed
from all 27 files. `base.teardown.ts` keeps `unregisterCandidate` above the delete;
`bank-auth-journey.teardown.ts` keeps the delete as step 1 of 3. The 28th teardown file
(`candidate-journey.teardown.ts`, no assertion) was confirmed by grep and left untouched.

**Task 3 — the measurement** (`76132e6e4`)

One instrumented, preflight-confirmed full-suite run:
`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/140-f3-measure` → **exit 0, 135 passed,
0 unexpected, 0 flaky, 0 skipped**, preflight successes 1 / failures 0. The instrumentation was
reverted in-task and the three-check hygiene post-gate is clean.

## Key Measurement Findings

- **26 of 27 sites executed and emitted one record each.** The 27th,
  `bank-auth-journey.teardown.ts`, is `PLAYWRIGHT_BANK_AUTH`-gated and is recorded as an
  explicitly named gap with its cause — not a silent 26. Confirmed positively by enumerating
  `projectName` values from `results.json`, not assumed.
- **25 of 26 observations are `before=0, rowsDeleted=0, after=0`.** The sole non-zero is
  `e2e-perm-analytics-` at `13 / 13 / 0`.
- **The run timeline proves both hazard mechanisms and that they compose.** Every setup in the
  suite runs before any teardown does; teardowns then run in reverse order in the last ~22s of
  an 11-minute run. Each perm setup pre-clears BOTH the `test-` and `e2e-perm-` families — the
  `test-` entry is broader than research assumed and wipes the base dataset too. So the last
  setup to run wipes all 25 prior perm datasets plus the base dataset before seeding its own 13
  rows, and only that site has anything left to delete.
- **A uniform positivity floor would have failed 25 of 26 executed sites** in this run — worse
  than the ~26-of-27 research predicted. D-02 (measure before choosing) was load-bearing, not
  ceremonial.
- `rowsDeleted === before` and `after === 0` each hold at 26 of 26 observations. Recorded as
  observations; **no matcher was chosen here** — that is plan 06's adjudication.

`140-MEASUREMENT.md` §7 states what the measurement does NOT discharge (single run, single
machine, bank-auth site unmeasured, no negative control, storage not instrumented, work outside
the bracketed region unobserved).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `eslint --fix` collateral in two out-of-scope files**

- **Found during:** Task 2
- **Issue:** Running `eslint --fix tests` to sort the new imports also auto-fixed two
  pre-existing warnings in `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts`
  (`prefer-to-have-length`) and `tests/tests/support/mockOidcIssuerEntry.ts` (unused
  eslint-disable directive) — both outside this plan's scope, and one of them an assertion edit.
- **Fix:** Reverted both with a per-file `git checkout --`; only the 27 teardown files were
  staged. Both warnings remain, unchanged, as they were before this plan.
- **Files modified:** none (reverted)
- **Commit:** n/a — the revert is the absence of those files from `9c2a1535a`

### Criterion Corrections (verified, not papered over)

Two acceptance criteria were written as literal grep counts that measure prose as well as code.
Per the phase's standing lesson, no prose was deleted to satisfy a grep; a stronger check was
substituted and the correction recorded.

**1. `grep -rl 'runTeardown(' tests/tests/setup --include='*.teardown.ts' | wc -l` — predicted 0, measured 5.**
The five hits are pre-existing explanatory comments in `perm-question-video`, `perm-hide-hero`,
`perm-answers-locked`, `perm-disable-allow-open` and `perm-localisation-positive`
(e.g. "`runTeardown(PREFIX)` deletes the seeded candidate row but NOT the auth user"). All five
remain TRUE after the codemod — the delete is still performed by `runTeardown`, now via the
helper. **Stronger check used instead:**
`grep -rl "from '@openvaa/dev-seed'" tests/tests/setup --include='*.teardown.ts' | wc -l` = **0**.
Since the import is the only way to reach the library function, zero imports proves zero
bypasses — a strictly stronger guarantee than the intended call-site grep.

**2. `grep -c 'unregisterCandidate' tests/tests/setup/shared/base.teardown.ts` — predicted 1, measured 2.**
The second hit is the pre-existing "Auth unregister step" paragraph in the file's doc block.
**Stronger check used instead:** the code call site is at line 33 and the
`await runTeardownAsserted(...)` call at line 34 — the load-bearing pre-delete ordering
survived, which is what the criterion was about.

**3. Table column order in `140-MEASUREMENT.md`.** The task's automated verify greps `^\| *prefix`,
so the observation-index column was moved from first to last (`obs #`) rather than dropping it.
No data changed.

### Plan Assumption Corrected

**A fourth call-site shape exists that the plan did not enumerate.** The plan describes three
shapes (25 bare + `base.teardown.ts` + `bank-auth-journey.teardown.ts`). In fact five perm sites
— `perm-question-video`, `perm-hide-hero`, `perm-answers-locked`, `perm-disable-allow-open`,
`perm-localisation-positive` — also perform their own `unregisterCandidate` before the delete,
and `perm-question-video` additionally unlinks a storage-state file after it. The codemod
replaced only the two-line assertion pair in place, so every one of those orderings survived
unchanged. Verified: all 27 files matched the same import lines and the same assertion pair
byte-for-byte before the edit, so the uniform codemod was safe.

### Carryover Confirmed

`packages/dev-seed` is genuinely not a built package — `yarn build` emits
`WARNING no output files found for task @openvaa/dev-seed#build`. `yarn build` was run as the
plan directs (it exits 0 and the frontend genuinely builds), but no dist-freshness check was
manufactured. The new export is visible to `tests/` because the package's `exports` points at
`./src/index.ts`.

## Authentication Gates

None.

## Verification

| Check | Result |
|---|---|
| `yarn build` | exit 0 |
| `yarn lint:check` (includes `typecheck:tests`) | exit 0 |
| `grep -rl 'runTeardownAsserted' ... \| wc -l` | 27 |
| `grep -rl "from '@openvaa/dev-seed'" ... \| wc -l` | 0 (no bypass possible) |
| `grep -rl 'expect' ... \| wc -l` | 0 (matcher lives in exactly one place) |
| `grep -rl 'rowsDeleted' ... \| wc -l` | 0 |
| `git diff --stat candidate-journey.teardown.ts` | empty (28th file untouched) |
| No LIKE metacharacter in any of the 27 prefixes | 0 hits |
| `e2e-run.sh --run-dir tests/e2e-runs/140-f3-measure` | exit 0, 135 passed, preflight 1 OK / 0 fail |
| `git status --porcelain -- apps tests packages` | empty |
| `grep -rn 'INJECTED (140)' apps packages tests` | no match |
| `140-MEASUREMENT.md` matcher decision | none (`grep -c 'toBe(before)\|chosen matcher\|we will use'` = 0) |

## Known Stubs

None.

## Threat Flags

None. `countRowsByPrefix` is read-only and returns integers only; `ALLOWED_TEARDOWN_TABLES` is a
frozen `as const` string tuple granting no capability (`bulk_delete`'s allow-list is enforced
server-side).

## Notes for Plan 06

- The matcher adjudication MUST consume `140-MEASUREMENT.md` §4 and §5, and should address §7's
  named limits — in particular that `bank-auth-journey.teardown.ts` is unmeasured, and that
  which site is non-zero is a property of chain ORDER rather than of the site.
- The helper is the single edit point: changing `assertTeardown.ts:44-47` changes all 27 sites.
- `countRowsByPrefix` is already landed and typed; a before/after invariant needs no new probe.

## Self-Check: PASSED

All claimed artifacts exist on disk (`assertTeardown.ts`, `140-MEASUREMENT.md`,
`140-05-SUMMARY.md`) and all four claimed commits are present in git
(`d05015dce`, `9c2a1535a`, `76132e6e4`, `3159c9fc3`).
