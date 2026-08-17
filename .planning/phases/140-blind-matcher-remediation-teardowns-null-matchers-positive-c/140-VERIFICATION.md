---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-controls
verified: 2026-08-15T19:15:00Z
status: gaps_found
score: 5/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "The F3 matcher does not introduce a new nondeterministic-failure hazard for the duplicated `e2e-perm-notloc-` prefix (plan `140-06`'s `verification: backstop` truth: 'whichever executes second legitimately observes before === 0')"
    status: failed
    reason: >
      Independently confirmed, not merely inherited from 140-REVIEW.md's CR-01: `tests/playwright.config.ts`
      declares `data-setup-bank-auth-journey` (:319) with NO `dependencies` entry ordering it relative to the
      perm chain, `fullyParallel: true` (:171) and local `workers: process.env.CI ? 1 : 6` (:177) allow
      concurrent scheduling, and both `tests/tests/setup/candidate/bank-auth-journey.teardown.ts:26` and
      `tests/tests/setup/perm/perm-not-located-2e2cg.teardown.ts:11` declare the identical
      `const PREFIX = 'e2e-perm-notloc-'`, both now routed through the new equality-based
      `runTeardownAsserted`. The plan's backstop reasoning ("whichever executes second legitimately
      observes before === 0") assumes sequential execution; concurrent scheduling under
      `PLAYWRIGHT_BANK_AUTH=1` is architecturally possible and was never ruled out. Under a genuine race,
      one teardown's `bulk_delete` can win while the other observes `rowsDeleted < rowsBefore` or
      `rowsAfter > 0`, both new hard failures that the pre-change `toBeGreaterThanOrEqual(0)` tolerated
      silently. `140-NEGATIVE-CONTROL.md` § 22 itself flags this backstop truth as "REASONED, not
      observed" and instructs a verifier unable to confirm it to abstain to `human_needed` — this
      verifier found concrete counter-evidence in the shipped config, which is stronger than "unable to
      confirm," so it is recorded as a gap rather than an abstention.
    artifacts:
      - path: "tests/tests/setup/shared/assertTeardown.ts"
        issue: "The before/after equality assertion (`rowsDeleted === rowsBefore`, `rowsAfter === 0`) is not concurrency-safe when two teardown projects share one prefix."
      - path: "tests/playwright.config.ts"
        issue: "`data-setup-bank-auth-journey` (:319) carries no `dependencies` ordering it relative to `data-teardown-perm-not-located-2e2cg`, and `fullyParallel: true` / `workers: 6` (local) permit concurrent scheduling of the two teardown projects that share `PREFIX = 'e2e-perm-notloc-'`."
    missing:
      - "Give the bank-auth journey its own external-ID namespace (e.g. `e2e-bankauth-notloc-`) so no two teardown projects can ever own one prefix, and stop it pre-clearing the `test-`/`e2e-perm-` namespaces it does not own — OR order the two projects explicitly (`dependencies: ['perm-not-located-2e2cg']` on `data-setup-bank-auth-journey`)."
      - "A config-load prefix-uniqueness guard mirroring the existing ORPHAN-PROBE / SOFT-ASSERTION-BUDGET guards in `tests/playwright.config.ts`, so a future duplicate prefix cannot be reintroduced silently."
human_verification: []
---

# Phase 140: Blind-Matcher Remediation — Teardowns, Null Matchers, Positive Controls Verification Report

**Phase Goal:** The assertions the sweep classed as mechanical-but-unfailable can fail, and the absence-only assertions have something proving they can still see presence.
**Verified:** 2026-08-15T19:15:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **F3** — a teardown run where the delete matches nothing FAILS the `*.teardown.ts` assertion by name; the pre-change `toBeGreaterThanOrEqual(0)` form PASSES the same scenario; the 27th file is covered by construction | ✓ VERIFIED | `140-NEGATIVE-CONTROL.md` §§ 17-19: three structurally distinct sites (`perm-1e1cg1co` 14 rows, `base` 142 rows, `bank-auth-journey` data lane 38 rows) each show RUN 1 PASS(blind)/RUN 2 FAIL(caught) at `assertTeardown.ts:73:5`, all six runs verbatim-logged. Static coverage independently re-derived: `grep -rl 'runTeardownAsserted' tests/tests/setup --include='*.teardown.ts' \| wc -l` → 27; `grep -rn 'await runTeardown(' …` → 0; the 28th file (`candidate-journey.teardown.ts`) performs no delete and correctly carries no assertion. |
| 2 | **F19** — removing `request`/`client_assertion` from each of the three fixtures fails the assertion itself, naming the missing parameter (not a downstream `TypeError`); passes under the old `toBeDefined()`; two-run control at all three sites | ✓ VERIFIED | Code confirmed at `authorize-endpoint.test.ts:145`, `token-endpoint.test.ts:168`, `idura.test.ts:149` — all now `toEqual(expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/))`. `140-NEGATIVE-CONTROL.md` §§ 4-5 (site 1) + §§ 5.7-5.9 (sites 2-3) show verbatim vitest output: RUN 1 fails three lines downstream (`TypeError: Cannot read properties of null (reading 'split')`) with the assertion itself green; RUN 2 fails at the assertion line naming the parameter. Re-ran the three files myself at current HEAD: 32/32 pass. |
| 3 | **F9** — `perm-hide-category-tags` / `perm-hide-election-tags` FAIL when the tag stops rendering anywhere; positive control is seeded data, not a comment | ✓ VERIFIED | Templates confirmed: `perm-hide-category-tags.ts:40` sets `elections: 2` (the load-bearing precondition per `electionTags.ts:13`'s two-election floor); `perm-hide-election-tags.ts:37-38` sets `elections: { showElectionTags: false }, questions: { showCategoryTags: true }`. Both specs carry a `toBeGreaterThan(0)` presence assertion (`perm-hide-category-tags.spec.ts:39-43`, `perm-hide-election-tags.spec.ts:39-43`) beside the byte-identical absence assertion. `140-NEGATIVE-CONTROL.md` §§ 15-16: both specs observed green pre-injection (86/86), both green (vacuously) under the render-path deletion before the presence assertions existed, and both red at their own presence-assertion line after — proven **severally** (each individually, per `140-NEGATIVE-CONTROL.md` § 16.4's documented Playwright serial-chain limit that a downstream project is skipped once its upstream dependency fails), which is a defensible reading of "the pair go red." |
| 4 | **F10** — `voter-journey.spec.ts`'s stated `expect.soft` budget matches its real count (136), OR a counted guard enforces the budget and fails when one more is added | ✓ VERIFIED | `tests/playwright.config.ts:59-107`: `SOFT_ASSERTION_BUDGETS['specs/voter/voter-journey.spec.ts'] = 136`; guard counts by global regex occurrence, asserts equality (fails on addition AND removal). Independently confirmed `grep -c 'expect\.soft(' voter-journey.spec.ts` → 136 at current HEAD. `npx playwright test --list --project=voter-journey` (run by this verifier) succeeds cleanly with the guard in place. `140-NEGATIVE-CONTROL.md` §§ 9-12 documents the two-run control: unguarded config silently accepts an added assertion; guarded config throws at config-load time (including under `--list`), reverted, re-confirmed. |
| 5 | Unit and E2E suites return to green after the edits, with the Phase-137 preflight satisfied on every run used as evidence | ✓ VERIFIED | `140-NEGATIVE-CONTROL.md` § 20.1: `yarn build` 14/14, `yarn test:unit` 21/21 (773 + 444 tests), `yarn lint:check` 11/11, `e2e-run.sh` (no `--project`) 135 passed / 0 unexpected / 0 flaky / 0 skipped, preflight 1 success / 0 failures. Git history independently confirms the ordering claim: `15d2e6687` (`test(140-06): adjudicate the F3 matcher…`) is the last commit touching source (`assertTeardown.ts`); every commit after it (`9872b5593`, `e61663f03`, `feaa57ee7`, `da89a2bb9`) touches only `.planning/` files. The phase-gate full-suite run is recorded inside `e61663f03`, which post-dates the last source change and precedes no further source edits. |
| 6 | *(Added must-have — plan `140-06` `verification: backstop` truth)* The duplicated `e2e-perm-notloc-` prefix does not create a nondeterministic-failure hazard under the new equality assertion | ✗ FAILED | See Gaps below. `140-VALIDATION.md`/`140-NEGATIVE-CONTROL.md` § 22 itself marks this truth "REASONED, not observed" and instructs an unconfirming verifier to abstain to `human_needed`; this verifier instead found concrete counter-evidence in `tests/playwright.config.ts` (no ordering dependency + `fullyParallel: true`) that the race the truth dismisses is architecturally reachable, which is recorded as a gap rather than an abstention. |

**Score:** 5/6 must-haves verified (0 present-behavior-unverified)

### Weighing the phase's own flagged concerns (per verification notes)

1. **140-VALIDATION.md § 22 abstention instruction** — honoured for both `verification: backstop`
   truths. The first (concurrent `extraTeardownPrefix` pre-clear tolerance) could not be confirmed
   or contradicted from available evidence and is left unresolved-but-not-blocking (the measurement's
   § 8.4 already records it as "unobserved and unreachable under the measured ordering, not as
   impossible" — a reasonable, honestly-scoped position). The second (duplicated `e2e-perm-notloc-`
   prefix) was investigated further because `140-REVIEW.md`'s CR-01 supplied a concrete reproduction
   path; independently re-deriving that path from `tests/playwright.config.ts` and the two
   `.teardown.ts` files' `PREFIX` declarations confirmed it rather than merely leaving it unconfirmed
   — hence a **gap**, not a `human_needed` item.

2. **140-REVIEW.md's WR-03 and CR-01** — assessed independently, not taken on trust:
   - **WR-03** ("26/26 held" is 25 tautological `0 === 0` observations plus one real one): confirmed
     against `140-MEASUREMENT.md` § 4's table — 25 of 26 rows are `before=0, rowsDeleted=0, after=0`;
     only `e2e-perm-analytics-` (row 1) is non-trivial. This is accurate as a critique of the
     **measurement's** rhetorical framing, but it does **not** undermine ROADMAP criterion 1's literal
     achievement — the actual two-run control (`140-NEGATIVE-CONTROL.md` §§ 17-19) used a *different*,
     project-scoped injection methodology that produced genuine `before > 0` scenarios (14, 142, 38
     rows) at three real sites and observed real FAIL/PASS pairs there. Criterion 1 is satisfied; the
     measurement document's "26/26" framing is a documentation-quality overstatement (also
     self-flagged in part by the phase itself in `140-MEASUREMENT.md` § 7), not a functional gap.
     Recorded as a warning, not a blocker.
   - **CR-01** (duplicate-prefix race): confirmed technically (see truth 6 above and the gap entry).
     Elevated to a gap in this report because the technical premise — no ordering dependency, parallel
     scheduling enabled — was independently verified in the shipped config, not merely asserted by the
     reviewer.

3. **Ordering of the phase-gate full-suite run relative to the last source-touching commit** — confirmed
   directly from `git log`: `15d2e6687` is the last commit touching `tests/tests/setup/shared/assertTeardown.ts`
   (or any other phase source file); every subsequent commit through `da89a2bb9` (the code review itself)
   touches only `.planning/*.md`. The 135-passed / 0-unexpected / 0-flaky / 0-skipped / preflight-1-success
   full-suite run is recorded in `e61663f03`, which lands after the last source commit and before any
   further source edits — the ordering claim holds.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` | Repaired F19 matcher | ✓ VERIFIED | `:145` uses anchored 3-segment regex; four remaining `toBeDefined()` calls confirmed to be on object properties, correctly out of scope |
| `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts` | Repaired F19 matcher | ✓ VERIFIED | `:168` uses anchored regex; `!` non-null assertion on `capturedFetchBody` dropped per plan |
| `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts` | Repaired F19 matcher | ✓ VERIFIED | `:149` uses anchored regex |
| `tests/playwright.config.ts` | F10 counted budget guard | ✓ VERIFIED | `SOFT_ASSERTION_BUDGETS` + equality-checked guard at `:59-107`, sits beside the pre-existing ORPHAN-PROBE guard |
| `tests/tests/specs/voter/voter-journey.spec.ts` | Header pointing at the guard, not restating the number | ✓ VERIFIED | Header at `:1-32` names `SOFT_ASSERTION_BUDGETS` as authority, does not restate 136 |
| `packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts` | Seeded complementary-tag precondition | ✓ VERIFIED | `elections: 2` |
| `packages/dev-seed/src/templates/e2e/perm/perm-hide-election-tags.ts` | Seeded complementary-tag precondition | ✓ VERIFIED | `questions: { showCategoryTags: true }` overlay |
| `tests/tests/specs/perm/perm-hide-category-tags.spec.ts` | Presence assertion added | ✓ VERIFIED | `:39-43`, house `toBeGreaterThan(0)` form |
| `tests/tests/specs/perm/perm-hide-election-tags.spec.ts` | Presence assertion added | ✓ VERIFIED | `:39-43`, house `toBeGreaterThan(0)` form |
| `tests/tests/setup/shared/assertTeardown.ts` | Single-owner F3 matcher (new file) | ⚠️ ORPHANED-CLAIM (see gap) | Function correctly implemented and routed from 27/28 teardown files; docblock overstates its coverage (CR-02: claims to catch a table dropped from `ALLOWED_TEARDOWN_TABLES`, which is structurally impossible since the probe shares that same constant — confirmed by reading `supabaseAdminClient.ts:245-267`); the shipped equality assertion is not concurrency-safe for the duplicated prefix (see gap) |
| `tests/tests/utils/supabaseAdminClient.ts` | `countRowsByPrefix` probe | ✓ VERIFIED | Exact `head: true` count query, iterates `ALLOWED_TEARDOWN_TABLES` |
| `packages/dev-seed/src/index.ts` | `ALLOWED_TEARDOWN_TABLES` exported | ✓ VERIFIED | Confirmed via `140-REVIEW.md`'s file list and `supabaseAdminClient.ts` import |
| 27 `*.teardown.ts` call sites | Routed through shared helper | ✓ VERIFIED | `grep -rl 'runTeardownAsserted' … \| wc -l` → 27 (re-derived independently) |
| `.planning/…/140-NEGATIVE-CONTROL.md` | Phase evidence document, all four two-run controls | ✓ VERIFIED | 23 numbered sections, verbatim logs for every RUN, explicit "what this does NOT discharge" sections at multiple levels |
| `.planning/…/140-MEASUREMENT.md` | F3 measurement + adjudication | ✓ VERIFIED | 26/27 sites measured (27th named as a gap and separately reached via data lane), branch-A adjudication recorded against real cost data |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `authorize-endpoint.test.ts` / `token-endpoint.test.ts` / `idura.test.ts` | `idura.ts` (production source) | shared injection target, transient only | ✓ WIRED | Confirmed reverted — no `INJECTED (140)` marker remains anywhere in the tree |
| `voter-journey.spec.ts` header | `SOFT_ASSERTION_BUDGETS` in `playwright.config.ts` | header names the symbol, not the number | ✓ WIRED | Confirmed at `:17-21` |
| `perm-hide-category-tags` spec project | `perm-hide-election-tags` spec project | `tests/playwright.config.ts:1021` dependency, one `--project` run executes both | ✓ WIRED (per `140-NEGATIVE-CONTROL.md`, not independently re-run by this verifier) | Documented in the plan and consistent with the config's declared `dependencies` |
| 27 teardown files | `assertTeardown.ts`'s `runTeardownAsserted` | direct call, single owner | ✓ WIRED | Re-derived: 27 call sites, 0 direct `runTeardown(` invocations from `.teardown.ts` files |
| `assertTeardown.ts` | `supabaseAdminClient.ts`'s `countRowsByPrefix` | before/after bracketing | ✓ WIRED | Confirmed at `assertTeardown.ts:61-63` |
| `data-setup-bank-auth-journey` project | `data-teardown-perm-not-located-2e2cg` project | prefix-sharing, **no explicit ordering** | ✗ NOT WIRED (this is the defect) | Confirmed at `tests/playwright.config.ts:288-346`: no `dependencies` entry orders these two projects relative to each other, and `fullyParallel: true` / local `workers: 6` permit concurrent scheduling |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| ASSERT-02 | `140-05`, `140-06` | F3 — 27 teardown row-count assertions assert the expected count; a no-op delete fails | ✓ SATISFIED (with a flagged robustness gap) | Core demonstration solid (truth 1); concurrency hazard in the shared helper (truth 6) is a real, independently-confirmed regression |
| ASSERT-03 | `140-01` | F19 — `toBeDefined()` on `URLSearchParams.get()`/`FormData.get()` repaired | ✓ SATISFIED | Truth 2, code + control confirmed |
| ASSERT-05 | `140-03`, `140-04` | F9 — positive control for `perm-hide-*-tags` absence assertions | ✓ SATISFIED | Truth 3, code + control confirmed |
| ASSERT-06 | `140-02` | F10 — `voter-journey.spec.ts`'s declared soft-assertion budget matches reality or is enforced | ✓ SATISFIED | Truth 4, code + control confirmed |

No orphaned requirements: REQUIREMENTS.md's phase-140 rollup lists exactly ASSERT-02, ASSERT-03,
ASSERT-05, ASSERT-06, all four of which appear in a plan's `requirements:` frontmatter (`140-01`,
`140-02`, `140-03`+`140-04`, `140-05`+`140-06` respectively).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/tests/setup/shared/assertTeardown.ts` | `:33-39` | Docblock claims a catch (`a table dropped from ALLOWED_TEARDOWN_TABLES`) that is structurally impossible given the probe shares the delete's own table list (CR-02, independently confirmed) | ⚠️ Warning | Overstates the guard's honesty — the exact defect class this phase exists to remove, now reintroduced one level up in a comment |
| `tests/tests/setup/shared/assertTeardown.ts` | `:7-8` | "Every `*.teardown.ts` project routes through this function" — false; 28 files exist, 1 (`candidate-journey.teardown.ts`) correctly does not | ℹ️ Info | Minor overstatement; the file itself is correctly excluded (it performs no delete) |
| `tests/playwright.config.ts` | `:98` | Soft-assertion count regex matches comments/strings, not just statement position (WR-04) | ⚠️ Warning | The guard's own remediation message risks self-tripping if a future author writes the literal token in a header |
| `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts`, `idura.test.ts` | `:124`, `:126,136` | Residual `toBeDefined()` on JSON-boundary values saved only by an adjacent line (WR-08) | ℹ️ Info | Not a live defect today; correctly scoped out of F19's remit (object properties, not `.get()` returns) |

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers found in any of the 12 phase-modified files checked.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| F19 unit tests currently pass | `npx vitest run` on the 3 repaired files | 3 files / 32 tests, all pass | ✓ PASS |
| F10 guard does not throw at current HEAD | `npx playwright test --list --project=voter-journey` | Listed 4 tests cleanly, no throw | ✓ PASS |
| No debt markers in phase-touched files | `grep -n -E "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER"` across 12 files | No matches | ✓ PASS |
| Git-history ordering claim (criterion 5) | `git log --oneline` + `git show --stat` on `15d2e6687`, `9872b5593`, `e61663f03`, `feaa57ee7`, `da89a2bb9` | Last source commit `15d2e6687`; all four subsequent commits touch only `.planning/*.md` | ✓ PASS |
| CR-01 concurrency premise | Read `tests/playwright.config.ts:280-346` and the two `.teardown.ts` files' `PREFIX` declarations | No `dependencies` ordering `data-setup-bank-auth-journey`; identical `PREFIX` in both files; `fullyParallel: true` / `workers: 6` | ✗ FAIL (confirms the defect) |

Full E2E suite and full unit suite were **not** re-run by this verifier (would exceed the 10-second
spot-check budget and duplicate the already-well-evidenced `140-NEGATIVE-CONTROL.md` §20 gate run);
their green state is accepted on the strength of that document's verbatim logs plus the independently
confirmed git-history ordering.

### Gaps Summary

Four of five ROADMAP success criteria, and all four ASSERT-* requirements, are solidly achieved with
strong, independently-re-derived evidence — the F19, F9, and F10 remediations are clean, and the F3
matcher's core demonstration (fail-by-name at real defects, silent-pass under the old form, 27-site
construction coverage) holds up under independent scrutiny, including against `140-REVIEW.md`'s WR-03
critique (which is accurate about the measurement document's rhetoric but does not undermine the
control itself).

The one gap is real and independently confirmed, not inherited from the review: the new equality-based
F3 assertion (`rowsDeleted === rowsBefore`, `rowsAfter === 0`) is not concurrency-safe for the
duplicated `e2e-perm-notloc-` prefix, because `data-setup-bank-auth-journey` carries no ordering
dependency relative to `data-teardown-perm-not-located-2e2cg` and Playwright's local config permits
concurrent scheduling. This is a **new** hazard — the pre-change `toBeGreaterThanOrEqual(0)` tolerated
any race silently — that the phase's own plan 06 anticipated only as an unconfirmed "reasoned, not
observed" backstop truth, correctly flagged for abstention in `140-NEGATIVE-CONTROL.md` § 22. This
verifier went further than abstaining because the technical premise is directly checkable in the
shipped config and checks out as a real hazard. It is already tracked as an open item in
`.planning/WINDOWS.md` (row 6, phase 140), but is not scheduled to be closed by any of Phases 141-150,
so it does not qualify as a deferred item under Step 9b — it remains an open gap.

Given the project's cardinal E2E rule ("Failing E2E tests are a CARDINAL FAILURE… no such thing as an
acceptable flaky test"), and that this hazard is presently latent (the default gate suite does not run
`bank-auth-journey`, so it did not manifest in the 135/0/0/0 gate run), a closure plan should either
namespace the bank-auth journey's teardown prefix away from the perm chain's, or add an explicit
ordering dependency plus a config-load prefix-uniqueness guard — before the `PLAYWRIGHT_BANK_AUTH=1`
lane (referenced in the bank-auth determinism-gate work) is next exercised.

---

_Verified: 2026-08-15T19:15:00Z_
_Verifier: Claude (gsd-verifier)_
