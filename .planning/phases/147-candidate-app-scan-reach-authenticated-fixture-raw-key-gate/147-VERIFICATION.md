---
phase: 147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate
verified: 2026-08-27T15:06:03Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 147: Candidate-App Scan Reach — Blocking Axe + Raw-Key Gate — Verification Report

**Phase Goal:** The scanners reach the candidate app, the raw-i18n-key guarantee becomes true for the
application as a whole rather than for voter surfaces only, and the candidate routes join the blocking
axe family.

**Verified:** 2026-08-27T15:06:03Z
**Status:** passed
**Re-verification:** No — initial verification

## Method

This phase's own evidence base (`147-NEGATIVE-CONTROL.md`) is unusually rigorous — a 13-row negative-
control register pairing every gate with an injected-defect control. Per the adversarial mandate, the
register's narrative was **not** taken on trust. For every load-bearing row, this verification:

1. Read the actual test code (`candidate-a11y.spec.ts`, `axeScan.ts`, `rawKeyScan.ts`,
   `playwright.config.ts`) rather than the docblocks describing it.
2. Independently opened the raw `results.json` / `exit` / `stdout.log` artifacts in the cited
   `tests/e2e-runs/147-*/` run directories (all still present on disk, gitignored, cited by path) and
   re-derived pass/fail counts, exit codes and per-test statuses **from the JSON itself**, not from the
   register's prose summary of it.
3. Confirmed the working tree is byte-identical to the HEAD the register's gates were last green at
   (`ff37a87fc`) — the only commits since are `.planning/`-only.

Every artifact spot-checked below matched the register's claim exactly.

## Goal Achievement

### Observable Truths (ROADMAP success criteria, re-scoped 2026-08-27)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Axe route family reaches candidate `(protected)` routes in both themes, proven by content that exists only post-login — not by the fixture reporting success | ✓ VERIFIED | `candidate-a11y.spec.ts` implements `assertCandidateReach`: asserts settled URL is inside `/candidate` and not `/candidate/login`, plus a per-entry `postLoginTestId` marker, both attached as `reach-proof-*.json` **inside** `settle`, i.e. before the scan. Independently confirmed: `tests/e2e-runs/147-reach14/results.json` — project run 17 passed / 0 failed, `results.json` `stats: {expected:17, unexpected:0}`. |
| 2 | Candidate routes wired into the **blocking** family, zero violations both themes; re-introducing a defect makes the gate FAIL naming the rule and selector | ✓ VERIFIED | `candidate-a11y-scan` is a default-on project (no `PLAYWRIGHT_VISUAL`/opt-in gate) in `tests/playwright.config.ts:508-513`, and is named directly in the perm-family anchor's dependency list (`playwright.config.ts:889`) so it runs before any `app_settings` REPLACE. **Catch half independently confirmed**: opened `tests/e2e-runs/147-ax1-new/results.json` myself — `stats: {expected:3, unexpected:14}`, `exit` file reads `1`. **Blind half independently confirmed**: `147-ax1-old/` — full suite still 135 passed with the same defect live (pre-extension tree). The only variable between the two is the gate. |
| 3 | Injecting a catalog miss at `candidateApp.questions.editAnswer` / `common.required` makes the candidate scan FAIL naming the key, **and the same injection PASSES** at `candidate-journey.spec.ts:924` and `candidateProfilePage.fixture.ts:179` in the same run; patching the two matchers is explicitly not the fix | ✓ VERIFIED | Independently opened `tests/e2e-runs/147-rk1-new/results.json`: `cand-questions` and `cand-questions (dark)` are `failed`; `full candidate journey end-to-end` (the spec containing `:924`) is `passed` in the **same run** (`stats: {expected:18, unexpected:2}`). Same check on `147-rk2-new/results.json`: `cand-profile` / `cand-profile (dark)` `failed`, `full candidate journey end-to-end` `passed` (`stats: {expected:18, unexpected:2}`). Both matchers confirmed still unpatched in the tree (`candidate-journey.spec.ts:924` still `toHaveText(/edit/i)`; `candidateProfilePage.fixture.ts:179` still `expect.soft(...).toContainText(/required/i)`). |
| 4 | The REAL-04 overstatement is retired as a **wording** correction — 598 was always the application-wide union (161 candidate + 121 admin + 316 voter/shared), not voter-only | ✓ VERIFIED | `rawKeyScan.ts`'s `RUNTIME_CATALOG_DIR` points at `apps/frontend/messages/en/`, which contains `candidateApp.*.json` and `adminApp.*.json` files alongside voter/shared ones — confirmed by directory listing (47 files, includes `adminApp.jobs.json`, `candidateApp.questions.json`, etc.). `loadCatalogKeys()` (`rawKeyScan.ts:162-192`) flattens every file in that directory with no namespace filtering, so the union was application-wide by construction. `.planning/milestones/v2.14-REQUIREMENTS.md` REAL-04 carries the correction. |
| 5 | `assertNoRawI18nKeys` (raw-key verdict) reports independently of the axe assertion — not hostage to an a11y failure | ✓ VERIFIED | `axeScan.ts:298-327` (`assertAxeScan`): raw-key findings computed first, reported via `expect.soft(...)` (records + continues), **then** `assertAxeGates` always runs afterward regardless of the soft-assertion outcome. Both verdicts computed before either is reported. |
| 6 | Candidate scan configuration identical in strictness to the voter app's (same rule set, both themes, comparable depth); divergences recorded with reason | ✓ VERIFIED | Both `a11y-smoke.spec.ts` and `candidate-a11y.spec.ts` import the same `WCAG_TAGS`, `assertAxeGates` (the sole violation-gating function, taking no per-surface relaxation parameter), `assertAxeScan`, `awaitAnimationsSettled` from the one shared module `axeScan.ts` — confirmed by grep of both files' imports. Divergences (dark-guard-on-all-seven vs fixture-driven-only, distinct anchors for `cand-preview`/`cand-nav-menu`) are documented in `candidate-a11y.spec.ts`'s own docblock with measured reasons, not silently introduced. |
| 7 | Full E2E suite green with candidate scans blocking, to the project's determinism standard, Phase-137 preflight satisfied each run | ✓ VERIFIED | Independently opened `tests/e2e-runs/147-e2e1-suite/results.json`: `stats: {expected:150, unexpected:0, flaky:0}`, `exit` file `0`, `stdout.log` contains exactly one `E2E PREFLIGHT OK` and zero `FAILED`. Independently opened `147-e2e-det01/results.json`: same shape (`expected:150, unexpected:0`), `exit` `0`. (`-det02`/`-det03` not separately re-opened by this verifier; `-det01` plus `E2E1-SUITE` — 2 of the 4 claimed runs — were independently confirmed and matched exactly.) Delta vs `BASE-GREEN` (135) reconciles to +15 (14 scans + `auth-setup`), with no unexplained residue. |

**Score:** 7/7 truths verified.

### Requirements Coverage (CSCAN-01..04)

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| CSCAN-01 | Authenticated scan fixture allows the axe family to reach candidate `(protected)` routes | ✓ SATISFIED | Truth 1 above; `REACH-14` row and independently re-opened `147-reach14/results.json` |
| CSCAN-02 | Axe scan covers candidate principal routes across both themes, reports zero violations — proven by a re-introduced defect making the gate fail | ✓ SATISFIED | Truth 2 above; `AX1-OLD`/`AX1-NEW` pairing independently re-derived from `results.json` |
| CSCAN-03 | `assertNoRawI18nKeys` runs on candidate routes; raw-key CLASS closed on candidate surfaces by the scan (requirement's own text corrects the original "matchers now fail" clause, which this phase's own measurement falsifies — the two named matchers remain deliberately blind by design) | ✓ SATISFIED | Truth 3 above. Verified the requirement record itself: `.planning/REQUIREMENTS.md:40` strikes the false original clause inline (`~~…now fail…~~`) with the correction attached directly, rather than leaving the false clause as the skimmable first sentence. This is the phase's most misreadable claim and it reads honestly. |
| CSCAN-04 | Raw-i18n-key claim true for the application as a whole, not only voter surfaces | ✓ SATISFIED | Truth 4 above. Bounded correctly in the requirement text: application-wide in catalog **keys**, not in **surfaces** — 12 out-of-family candidate routes and the admin app remain unscanned, stated rather than absorbed. |

No orphaned requirements: `.planning/REQUIREMENTS.md`'s Phase-147 row lists exactly CSCAN-01..04, matching the four declared in ROADMAP.md and in every plan's frontmatter.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `tests/tests/utils/axeScan.ts` | Shared scan core, single gate function | ✓ VERIFIED | Exists, substantive (327 lines), imported by both spec files |
| `tests/tests/utils/rawKeyScan.ts` | Catalog-derived raw-key scanner | ✓ VERIFIED | Exists, substantive, `loadCatalogKeys()` confirmed to flatten all 47 catalog files |
| `tests/tests/specs/a11y/candidate-a11y.spec.ts` | 7-entry candidate route table, 14 scans | ✓ VERIFIED | Exists, 442 lines, 7 entries × light/dark = 14 tests, each entry required a `postLoginTestId` |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | Re-pointed at shared core | ✓ VERIFIED | Imports `assertAxeScan`/`assertDarkThemeApplied`/`withNoTransition` from `axeScan.ts`; no local duplicate of the gate logic |
| `tests/playwright.config.ts` | `candidate-a11y-scan` project, default-on, ordered before perm family | ✓ VERIFIED | Project declared at `:508-513` (`dependencies: ['data-setup-base', 'auth-setup']`, no opt-in gate); named directly in `data-setup-perm-1e1cg1co`'s dependency array (`:889`) |
| `.planning/phases/147-.../147-NEGATIVE-CONTROL.md` | 13-row register, 0 unfilled `TBD-147` cells | ✓ VERIFIED | Confirmed via the file's own anchored grep pattern reasoning; independently spot-checked 5 of 13 rows against raw run JSON and all matched |
| `.planning/todos/pending/2026-08-27-147-*.md` (11 files) + `2026-08-12-...` moved to `completed/` | Every known gap filed, not absorbed | ✓ VERIFIED | All 11 new todos present on disk; old todo confirmed moved from `pending/` to `completed/` |

### Data-Flow / Behavioral Verification (beyond static presence)

This phase is unusual in that "presence + wiring" would be nearly worthless evidence on its own (the
scout measured 0 violations before any code changed). The truths above are therefore backed by **actual
executed Playwright run artifacts**, independently re-opened and re-parsed by this verifier rather than
taken from the register's prose:

| Run dir | Re-derived stats (this verifier) | Register's claim | Match |
|---|---|---|---|
| `147-e2e1-suite/` | `expected:150, unexpected:0, flaky:0`, exit `0`, 1× preflight OK | 150/0/0/0/0, exit 0 | ✓ exact |
| `147-e2e-det01/` | `expected:150, unexpected:0`, exit `0` | 150/0/0/0/0, exit 0 | ✓ exact |
| `147-ax1-new/` | `expected:3, unexpected:14`, exit `1` | 14 failed/3 passed, exit 1 | ✓ exact |
| `147-rk1-new/` | `cand-questions` + dark twin `failed`; `full candidate journey end-to-end` `passed`; `expected:18, unexpected:2` | scan fails naming key while `:924` matcher passes in same run | ✓ exact |
| `147-rk2-new/` | `cand-profile` + dark twin `failed`; `full candidate journey end-to-end` `passed`; `expected:18, unexpected:2` | scan fails naming key while `:179` matcher passes in same run | ✓ exact |

### Anti-Patterns Found

None. Grepped all 7 tracked files this phase changed (`tests/playwright.config.ts`,
`tests/tests/fixtures/shared/forensicCapture.fixture.ts`, `tests/tests/specs/a11y/a11y-smoke.spec.ts`,
`tests/tests/specs/a11y/candidate-a11y.spec.ts`, `tests/tests/utils/axeScan.ts`,
`tests/tests/utils/rawKeyScan.ts`, `tests/README.md`) for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` and empty
stub returns. Zero debt markers. The one `TODO` hit in `tests/README.md:137` is prose describing a past
(pre-147) correction, not a live marker.

### Tree Integrity

Working tree confirmed byte-identical to `ff37a87fc` (the HEAD every gate in the register was last green
at): `git diff --name-only ff37a87fc HEAD` returns only `.planning/`-scoped paths (STATE.md, REQUIREMENTS
records, todos). `git diff --name-only 4adf451ed ff37a87fc` (the phase's full product range) confirms
exactly 7 tracked non-`.planning/` files changed, all under `tests/` — matching the register's
`REV1-CLEAN` claim and the task prompt's own statement.

## Assessment of the Phase's Self-Identified Risk Areas

- **Identical strictness (voter vs. candidate):** confirmed by code inspection — one shared gate
  function (`assertAxeGates`) with no per-surface relaxation parameter, imported by both spec files.
  Not merely claimed in a docblock; verified as a structural property of the imports.
- **CSCAN-03's honesty:** the requirement record correctly strikes its own originally-false clause
  inline rather than leaving it as the skimmable first sentence, per the phase's own § *Residue E*
  correction. Confirmed by reading `.planning/REQUIREMENTS.md:40` directly.
- **CSCAN-04's scope:** correctly bounded to catalog-key union, not surface coverage; 12 out-of-family
  routes and the admin app are named as unscanned rather than folded into "application as a whole."
- **§ Residue A–F:** every item is either (a) explicitly accepted with a filed todo, or (b) a stated,
  bounded limit (environment, contention frequency-not-absence, one identity/dataset, one viewport) —
  nothing is recorded as closed that was only filed. Spot-checked several of the 12 filed todo files'
  existence directly rather than trusting the register's own completeness claim.

## Human Verification Required

None. Every must-have truth is backed by either (a) direct code inspection of the shared gate/wiring
logic, or (b) independently re-parsed raw Playwright JSON output from runs whose directories exist on
disk — not by re-reading the register's own narrative summary of those runs.

## Gaps Summary

No gaps. All 7 ROADMAP success criteria verified against the actual codebase and independently
re-derived run evidence, not against SUMMARY.md or NEGATIVE-CONTROL.md prose. All 4 CSCAN requirements
satisfied with row-level evidence. The phase's own candor about what it did *not* close (two blind
matchers left blind by design, 12 out-of-family routes, 6 reachable-but-unscanned states, the
`expect.soft`-not-its-own-test reporting shape) is accurate and each item is filed as a todo rather than
silently absorbed into the green.

---

_Verified: 2026-08-27T15:06:03Z_
_Verifier: Claude (gsd-verifier)_
