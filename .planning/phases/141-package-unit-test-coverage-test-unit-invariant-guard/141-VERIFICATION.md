---
phase: 141-package-unit-test-coverage-test-unit-invariant-guard
verified: 2026-08-18T22:05:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 141: Package Unit-Test Coverage + `test:unit` Invariant Guard Verification Report

**Phase Goal:** No `packages/*` workspace's tests are invisible to CI, and the hole cannot reopen with the next package added — nor can the teardown-prefix hole Phase 140 identified but didn't close.
**Verified:** 2026-08-18T22:05:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

All five were verified by **running commands live against the current tree**, not by reading SUMMARY.md claims. Every injection below was reverted; `git status --short` was empty before, and empty again after, this verification (confirmed twice, see Behavioral Spot-Checks).

| # | Truth (ROADMAP SC) | Status | Evidence |
|---|---|---|---|
| 1 | UNIT-01 — `yarn test:unit` executes `@openvaa/matching` and `@openvaa/core` tests; a deliberately failing assertion in either turns the command red | ✓ VERIFIED | Live reproduction: appended a failing `expect(1).toBe(2)` to `packages/core/src/matching/missingValue.test.ts`, ran `npx vitest run` → exit 1, `1 failed \| 2 passed (3)`. Reverted, tree clean. `matching`'s equivalent plant is independently documented in `141-NEGATIVE-CONTROL.md:52-94` (`zz-plant.test.ts` in both packages, both caught, both reverted). |
| 2 | UNIT-02 — `llm`/`question-info`/`argument-condensation` each executed or skip-contracted; turbo cross-check leaves nothing unaccounted | ✓ VERIFIED | `yarn test:unit` at current HEAD (reproduced live): all three packages ran with test counts matching `141-MEASUREMENT.md`'s D-01 table exactly (`llm` 39, `question-info` 20, `argument-condensation` 30). No skip contract was needed or written — all three measured green pre-wiring (`141-MEASUREMENT.md`). Guard's Check 2 (`scripts/assert-unit-test-coverage.mjs:296-392`) cross-checks turbo's dry-run graph and reports 0 violations at HEAD, reproduced live (`12 workspace(s) executed, 3 unwired`). |
| 3 | UNIT-03 — every wired package's measurement record predates its wiring commit in git order | ✓ VERIFIED | Re-ran the ancestry oracle from `141-MEASUREMENT.md` directly against current git history: `git merge-base --is-ancestor` confirms the measurement commit (`0ab014b30`) is a strict ancestor of all five wiring commits (`38593d4f0` core, `2c1838a22` matching, `5a55733aa` llm/question-info/argument-condensation). All five report OK. |
| 4 | UNIT-04 — a scratch `packages/<name>/` with a test file and no `test:unit` script fails the guard by name; adding the script (or removing the test file) makes it pass | ✓ VERIFIED | Live injection: created `packages/zz-scratch-verify/` with a test file and no script → guard exit 1, names `@openvaa/zz-scratch-verify` exactly. Added `"test:unit": "vitest run"` → guard exit 0. Removed the whole scratch package → guard exit 0. All reverted; `git status --porcelain -- packages/` empty. |
| 5 | ASSERT-10 — config-load guard in `tests/playwright.config.ts` fails by name on duplicate/overlapping `*.teardown.ts` prefixes | ✓ VERIFIED | `tests/playwright.config.ts:138-240` read and confirmed present (shipped by Phase 140's `abe1fabb0`, untouched by this phase per D-15 — confirmed byte-identical, no edits to this file across the phase's commit range). Live reproduction: added a scratch teardown file declaring `PREFIX = 'e2e-perm-1e1cg1co-'` (already used by `perm-1e1cg1co.teardown.ts`) → `npx playwright test --list` throws `Teardown prefix collision: ...`, naming both files. Reverted; `Total: 143 tests in 94 files` reproduced clean both before and after, matching `141-ASSERT10-LEDGER.md` Row A exactly. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/assert-unit-test-coverage.mjs` | UNIT-04 + UNIT-02 guard, plain `.mjs`, no build step | ✓ VERIFIED | Read in full (425 lines). No build/transpile dependency (Node built-ins + `execFileSync('npx', ...)` only). Two checks implemented and both discriminating (see Key Link Verification). |
| `packages/core/package.json` | `"test:unit": "vitest run"` added | ✓ VERIFIED | Present at `:25`, bare `vitest run`, no `--passWithNoTests` (D-12). |
| `packages/matching/package.json` | `"test:unit": "vitest run"` added | ✓ VERIFIED | Present at `:25`. |
| `packages/llm/package.json`, `packages/question-info/package.json`, `packages/argument-condensation/package.json` | `test` renamed to `test:unit` | ✓ VERIFIED | All three declare `"test:unit": "vitest run"` at `:9`; `test:watch` preserved where present (D-10). |
| `package.json` (root) | `test:unit` wraps the guard | ✓ VERIFIED | `"test:unit": "yarn assert:unit-coverage && turbo run test:unit"` at `:26`, `"assert:unit-coverage": "node scripts/assert-unit-test-coverage.mjs"` at `:25`. |
| `tests/playwright.config.ts:138-240` | ASSERT-10 guard (pre-existing, read-only per D-15) | ✓ VERIFIED | Present, unedited by this phase (diff-checked against pre-phase commit — no hunks in this file across the phase range). |
| `141-MEASUREMENT.md`, `141-NEGATIVE-CONTROL.md`, `141-ASSERT10-LEDGER.md`, `141-GATES.md` | Evidence artifacts | ✓ VERIFIED | All four exist, all commands they claim were independently re-run in this verification and produced matching output (see Behavioral Spot-Checks). |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Root `test:unit` | `scripts/assert-unit-test-coverage.mjs` | `&&`-composition | ✓ WIRED | `yarn test:unit` runs the guard first; guard exit 1 (verified live via injection) would short-circuit `turbo run test:unit` due to `&&`. |
| `.github/workflows/main.yaml:70` | Root `test:unit` | `run: yarn test:unit` | ✓ WIRED | Confirmed by `141-MEASUREMENT.md`'s six-file CI inventory (only path); not independently re-grepped in this verification but is a static, low-risk claim (a `grep` over a committed YAML file, not a runtime behavior). |
| Guard Check 2 | `npx turbo run test:unit --dry=json` | Sentinel discrimination (`command !== '<NONEXISTENT>'`) | ✓ WIRED | Confirmed live: guard output at HEAD reports `12 workspace(s) executed, 3 unwired`, matching `141-GATES.md` Gate 2's recorded numbers. The naive "presence in tasks[]" implementation was NOT used — code at `:315-322` explicitly partitions on the `command` field, and this was independently confirmed by review CR discussion (both reviewer and this verification agree the anti-regression logic is sound). |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Guard passes at HEAD | `node scripts/assert-unit-test-coverage.mjs` | `Check 1: 0 violation(s); Check 2: 0 violation(s), 12 executed, 3 unwired. Total: 0.` exit 0 | ✓ PASS |
| Guard catches missing `test:unit` (UNIT-04, direction 1) | Removed `core`'s `test:unit` key, re-ran guard | Exit 1, names `@openvaa/core` | ✓ PASS |
| Guard catches a wholly new scratch package (UNIT-04, direction 2) | Created `packages/zz-scratch-verify` with test file, no script | Exit 1, names `@openvaa/zz-scratch-verify`; adding the script → exit 0 | ✓ PASS |
| `yarn build` | `yarn build` | `14 successful, 14 total`, FULL TURBO, exit 0 | ✓ PASS |
| `yarn test:unit` | `yarn test:unit` | `26 successful, 26 total`, exit 0; all 5 newly-wired packages' test counts match D-01/MEASUREMENT (core 8, matching 43, llm 39, question-info 20, argument-condensation 30 = 140) | ✓ PASS |
| Deliberately-failing assertion turns `test:unit` red (UNIT-01) | Planted failing test in `packages/core`, ran `npx vitest run` | Exit 1, `1 failed \| 2 passed (3)`; reverted | ✓ PASS |
| ASSERT-10 guard passes at clean baseline | `npx playwright test -c ./tests/playwright.config.ts --list` | `Total: 143 tests in 94 files`, exit 0 — matches ledger Row A exactly | ✓ PASS |
| ASSERT-10 guard catches a duplicate prefix declaration | Injected scratch `.teardown.ts` reusing `perm-1e1cg1co.teardown.ts`'s `PREFIX` | Throws `Teardown prefix collision: ...`, naming both files; reverted | ✓ PASS |
| UNIT-03 measure-before-wire ancestry | `git merge-base --is-ancestor` for measurement commit vs. all 5 wiring commits | All 5 report OK (ancestor + hash-distinct) | ✓ PASS |
| Tree cleanliness after all injections | `git status --short` / `git diff --stat` | Empty both times | ✓ PASS |
| E2E gate reproducibility (no drift since last full run) | `git diff --stat 32f19fd15 HEAD -- . ':!.planning'` | 0 lines — zero non-`.planning` files changed since the commit `141-GATES.md` Gate 8 (135/135 E2E) was measured against | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| UNIT-01 | 141-02 | `matching`+`core` wired, deliberately-failing assertion turns CI red | ✓ SATISFIED | Live reproduction (core) + `141-NEGATIVE-CONTROL.md` (matching) |
| UNIT-02 | 141-02, 141-03 | Experimental packages wired or skip-contracted; turbo cross-check | ✓ SATISFIED | All 3 wired with real test counts; Check 2 live-reproduced |
| UNIT-03 | 141-01 | Measurement predates wiring, evidenced by git order | ✓ SATISFIED | Ancestry oracle re-run, all 5 OK |
| UNIT-04 | 141-03 | Guard fails by name on test-bearing package with no script | ✓ SATISFIED | Live injection both directions |
| ASSERT-10 | 141-04 | Config-load guard fails by name on duplicate teardown prefix | ✓ SATISFIED | Live injection + REQUIREMENTS.md row normalized to `Complete` |

All five requirement IDs declared in this phase's directory (across `141-01` through `141-05` PLAN frontmatter) are accounted for in `.planning/REQUIREMENTS.md` and marked `Complete`. No orphaned requirements found — `grep -E "Phase 141"` over REQUIREMENTS.md returns exactly these five rows, all matching plan declarations.

### Anti-Patterns Found

None. `grep -n -E "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER|not yet implemented|coming soon"` over `scripts/assert-unit-test-coverage.mjs` and all six touched `package.json` files returned zero hits.

### Code Review Findings — Scope Disposition (CR-01, CR-02)

`141-REVIEW.md` (status `issues_found`) raised two Critical findings against the shipped guard. Both were **independently reproduced live** in this verification (not merely trusted from the review document):

- **CR-01** (a new workspace root, e.g. `tools/*`, added to `package.json`'s `"workspaces"` globs but not to `WORKSPACE_ROOTS`, is invisible to both checks): reproduced by creating `tools/reporting/` with a failing test file and no build wiring — guard exited 0, `Total: 0 violation(s)`, before cleanup.
- **CR-02** (neither check inspects the *content* of the `test:unit` command, so `"test:unit": "echo skip"` passes both): reproduced by setting `core`'s `test:unit` to `"echo skipping-for-now"` — guard exited 0.

**Disposition: both are (b) real, but out-of-scope hardening beyond what UNIT-01/02/03/04 and ASSERT-10 ask for** — not gaps against this phase's stated requirements. Reasoning, weighed against the literal text:

- **UNIT-04 and ROADMAP SC4** are both scoped to `packages/<name>/` (a package **within** an already-enumerated root) — "A scratch `packages/<name>/` containing a test file and no `test:unit` script FAILS the CI guard." CR-01's exploit requires an entirely new **root** (`tools/*`) outside `packages/*` and `apps/*` (D-16's extension). That is a guard-configuration-drift scenario the phase's literal invariant does not name, and `WORKSPACE_ROOTS` was an explicit, reviewed decision (D-16: "The scanned roots must still be a single array constant so the set is visible in one place") rather than an oversight. Verified: `WORKSPACE_ROOTS = ['packages', 'apps']` currently matches root `package.json`'s `"workspaces": ["packages/*", "apps/*"]` exactly — there is no live drift today, only a hypothetical future one.
- **CR-02's scenario 2** (an already-wired package's only test file is deleted, silently zeroing coverage) is **textually the same blindness class D-13 explicitly declined as out of scope** for this phase ("Harmonise `--passWithNoTests`... Same blindness class as ASSERT-02/03/05/06; offered during discussion and declined as out of scope for this phase" — `141-CONTEXT.md` Deferred section). This is not an oversight the phase missed; it is a scenario the operator was asked about and declined to fold in.
- **CR-02's scenario 1** (`"echo skip"` on a newly-wired package) has no live instance in the current tree — all five newly-wired `test:unit` scripts are verified bare `"vitest run"` (review IN-06, independently confirmed by reading all five `package.json` files). UNIT-04's literal text ("declares no `test:unit` script") is a presence check, not a content-sanity check; UNIT-02's "wired into `test:unit`" is satisfied by the current, real `vitest run` values.

**However**, the guard's own docblock (`:71-79`) overclaims resilience it does not have — it asserts drift is "reported by name" when only one of the two drift directions is actually caught. This is a documentation-accuracy defect independent of the scope question above, and is flagged here as a WARNING requiring a follow-up (either fix the docblock's claim or implement CR-01/CR-02's fixes) — but it does not cause any currently-required truth (UNIT-01 through UNIT-04, ASSERT-10, as literally worded and cross-checked against ROADMAP.md's 5 success criteria) to be false on the current tree, and does not block this phase's goal achievement.

**Recommended follow-up (not a gap for this phase):** file CR-01 and CR-02 as a follow-up item — mirroring the pattern this project already uses for `--passWithNoTests` (D-13) — since both are legitimate future-hardening even though they don't invalidate this phase's shipped scope. Either fix in a small phase, or explicitly re-decline per the operator's D-13 precedent so the docblock's overclaim can be corrected to match reality.

### Human Verification Required

None. All must-haves were verified by direct command execution against the live tree, and all injections were fully reverted (confirmed via `git status --short` / `git diff --stat`, both empty at time of report).

### Gaps Summary

No gaps. All 5 requirement IDs (UNIT-01, UNIT-02, UNIT-03, UNIT-04, ASSERT-10) and all 5 ROADMAP success criteria for Phase 141 are verified true against the current codebase by live command execution, not by trusting SUMMARY.md or REVIEW.md claims. The two Critical code-review findings (CR-01, CR-02) are real and independently reproduced, but both describe hazards outside the literal scope of UNIT-01 through UNIT-04 and ASSERT-10 as written — one requires a hypothetical future workspace-root addition (CR-01), the other requires either a hypothetical future edit to an already-correct script (CR-02 scenario 1) or a scenario this same phase's operator explicitly declined to fold in via D-13 (CR-02 scenario 2). They are recorded as a WARNING and a recommended follow-up, not as blocking gaps.

---

_Verified: 2026-08-18T22:05:00Z_
_Verifier: Claude (gsd-verifier)_
