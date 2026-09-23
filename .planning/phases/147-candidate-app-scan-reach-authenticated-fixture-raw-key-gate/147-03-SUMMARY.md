---
phase: 147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate
plan: "03"
subsystem: testing
tags: [playwright, axe-core, wcag, accessibility, i18n, e2e, project-dependencies]

requires:
  - phase: 147-01
    provides: 'BASE-GREEN (135/0 full suite) and the AX1-OLD / RK1-OLD / RK2-OLD blind halves that measure what the candidate half was missing'
  - phase: 147-02
    provides: 'Decision (A) = wiring W3 and Decision (B) = both verdicts in one body, plus the phase-assignment instrument validated at 0 mismatches over 89 projects'
provides:
  - 'tests/tests/utils/axeScan.ts — the single scan core both a11y specs import (tag set, per-rule trio, global zero gate, animation settle, dark-theme guard, route types, shared scan body)'
  - 'tests/tests/specs/a11y/candidate-a11y.spec.ts — 7 candidate (protected) surfaces × 2 themes = 14 authenticated scans, each carrying its own reach proof'
  - 'the candidate-a11y-scan Playwright project (W3): auth-setup ungated, storageState-backed, on [data-setup-base, auth-setup], anchored by the perm chain head'
  - 'a non-short-circuiting raw-key gate: collectRawI18nKeyFindings + expect.soft in the shared body, so an i18n finding no longer suppresses the axe result on the same surface'
  - 'REACH-14 filled — 14/14 green, 0 violations, 0 raw-key findings, observed phase 3 of 80 matching the W3 prediction exactly'
  - 'the parity table CSCAN-01 criterion 6 asks for, written where the scans live'
affects: [147-04, a11y, e2e-suite, playwright-config, candidate-app]

actuals:
  tokens: 22930
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - 'One shared scan core imported by two specs — strictness parity as a property of the code rather than of two tables agreeing'
    - 'Reach proof composed onto every route entry at the runner, so a scan entry cannot be declared without one'
    - 'Two verdicts per scan, neither short-circuiting the other (expect.soft for the first, hard gates for the second)'

key-files:
  created:
    - tests/tests/specs/a11y/candidate-a11y.spec.ts
  modified:
    - tests/tests/utils/axeScan.ts
    - tests/tests/utils/rawKeyScan.ts
    - tests/tests/specs/a11y/a11y-smoke.spec.ts
    - tests/playwright.config.ts
    - .planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-NEGATIVE-CONTROL.md

key-decisions:
  - 'Decision (B) implemented WITHOUT changing assertNoRawI18nKeys''s detection: the finding computation was extracted as collectRawI18nKeyFindings and the throwing wrapper kept, so 147-04 re-runs 147-01''s injections against an unchanged instrument while the shared body still reports both verdicts'
  - 'The candidate-a11y-scan project and its perm-chain-head anchor entry are both gated on PLAYWRIGHT_NO_A11Y — § For 147-03 does not cover that interaction, and an unconditional anchor entry would make PLAYWRIGHT_NO_A11Y=1 fail at config load'
  - 'Dark twins take a born-dark browser context and run assertDarkThemeApplied on ALL seven, a deliberate strictness increase over the voter half'
  - 'The reach proof runs inside settle (before the scan), not after it, so a redirected scan fails by name instead of reporting a zero about a login page'
  - 'cand-preview uses candidate-preview-container as its post-login MARKER while anchoring on the entity-details article — a bad anchor is still a good identity proof'

patterns-established:
  - 'toScanEntry composition: entries declare `reach`, never `settle`, so the runner can force every proof onto every entry'
  - 'A per-entry postLoginTestId as a positive authentication proof, distinct from the absence of a redirect'

requirements-completed: [CSCAN-01, CSCAN-02, CSCAN-03]

coverage:
  - id: D1
    description: 'The blocking axe family reaches all seven candidate (protected) surfaces in both themes — 14 scans, 0 violations'
    requirement: CSCAN-01
    verification:
      - kind: e2e
        ref: 'tests/tests/specs/a11y/candidate-a11y.spec.ts#axe accessibility scan — cand-* (14 tests, candidate-a11y-scan project)'
        status: pass
      - kind: e2e
        ref: 'run-suite.sh --run-dir tests/e2e-runs/147-reach14 --project candidate-a11y-scan --db-reset (17 passed, exit 0)'
        status: pass
    human_judgment: false
  - id: D2
    description: 'Every scan proves from its OWN output that it scanned an authenticated document — settled URL inside /candidate and not /candidate/login, plus a per-entry post-login marker'
    requirement: CSCAN-01
    verification:
      - kind: e2e
        ref: 'reach-proof-*.json attachments in tests/e2e-runs/147-reach14/results.json (14/14 present, tabulated in 147-NEGATIVE-CONTROL.md § REACH-14)'
        status: pass
    human_judgment: false
  - id: D3
    description: 'The raw-i18n-key gate reaches the candidate half and no longer short-circuits the axe result (Decision (B))'
    requirement: CSCAN-02
    verification:
      - kind: e2e
        ref: 'raw-i18n-keys-*.json attachments, 14/14 with 0 findings; both verdicts reported per surface via expect.soft + assertAxeGates'
        status: pass
    human_judgment: true
    rationale: 'That the gate CATCHES rather than merely runs is 147-04''s RK1-NEW / RK2-NEW pairing against 147-01''s injections; this plan proves reach and non-suppression, not catch.'
  - id: D4
    description: 'Strictness is identical by construction — one scan core, no gate declared in either spec — and every divergence is recorded with its reason where the scans live'
    requirement: CSCAN-03
    verification:
      - kind: other
        ref: 'grep -rl over tests/tests: WCAG_TAGS / assertAxeGates / awaitAnimationsSettled / assertDarkThemeApplied / assertAxeScan each resolve to exactly tests/tests/utils/axeScan.ts; grep -n toHaveLength candidate-a11y.spec.ts returns nothing'
        status: pass
      - kind: other
        ref: "node -e \"…\" docblock check — candidate spec carries Identical-by-construction / Divergences / Known-gaps sections; config cites 147-ORDERING.md; voter spec names its sibling"
        status: pass
    human_judgment: false
  - id: D5
    description: 'The wiring is exactly W3, and the observed execution phase matches 147-02''s prediction'
    verification:
      - kind: e2e
        ref: 'tests/e2e-runs/147-reach14-suite/results.json via observedFromRun() + computePhases() — 0 mismatches over 91 scheduled projects, scan phase 3 of 80'
        status: pass
    human_judgment: false
  - id: D6
    description: 'The full default suite is green under the new wiring (CLAUDE.md cardinal rule)'
    verification:
      - kind: e2e
        ref: 'run-suite.sh --run-dir tests/e2e-runs/147-reach14-suite --db-reset — 150 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run, exit 0, 10.7 min, preflight OK=1 FAILED=0'
        status: pass
    human_judgment: false
  - id: D7
    description: 'The extraction changed nothing the voter suite reports'
    verification:
      - kind: other
        ref: 'ordered comparison of the a11y project''s enumerated --list titles against tests/e2e-runs/147/a11y-titles-before.json — 18/18 identical, re-checked after all three tasks'
        status: pass
    human_judgment: false

duration: 84 min
completed: 2026-08-27
status: complete
---

# Phase 147 Plan 03: Candidate scan reach, the shared core, and the W3 wiring — Summary

**Fourteen authenticated axe + raw-key scans over the candidate `(protected)` routes in both themes, running from one scan core the voter spec also imports, each proving from its own output that it read an authenticated document — 150/0 full suite, 0 violations, and an observed execution phase that matches `147-02`'s prediction on all eight quantities.**

## Performance

- **Duration:** 84 min (Task 1 from `11:04Z`; Tasks 2–3 resumed at `12:00Z`, closed `12:28Z`)
- **Started:** 2026-08-27T11:04:03Z (first Task-1 evidence run)
- **Completed:** 2026-08-27T12:28:18Z
- **Tasks:** 3
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- **The candidate half is no longer blind.** Seven `(protected)` surfaces × two themes = 14 scans, matching the voter family's 14 exactly, under a new `candidate-a11y-scan` project carrying the stored candidate session. `147-01`'s `AX1-OLD` proved a real WCAG 2.1 AA violation could sit live on every one of these surfaces with the whole suite green; that hole is now covered.
- **One scan core, not two copies.** `tests/tests/utils/axeScan.ts` is the sole home of `WCAG_TAGS`, `assertAxeGates`, `awaitAnimationsSettled`, `assertDarkThemeApplied`, the route-entry types and `assertAxeScan` — verified by `grep -rl`, each returning exactly that one file. Criterion 6's "identical in strictness" is a property of the code.
- **Every scan proves its own reach.** `reach-proof-<label>.json` per scan: the settled URL (asserted inside `/candidate`, asserted *not* `/candidate/login`), a per-entry post-login marker, its text, the h1 and the live `prefers-color-scheme`. Attached *before* being asserted, and run inside `settle` so a lost session fails by name rather than producing a confident zero about a login form.
- **The raw-key gate no longer suppresses the axe result.** Decision (B) landed: the shared body computes both verdicts and reports both.
- **`REACH-14` filled with two preflight-confirmed runs** — project 17/17 exit 0, full default suite **150 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**, exit 0, 10.7 min against `BASE-GREEN`'s 10.8.
- **`147-02`'s instrument held against a run it had not seen** — 0 mismatches over 91 scheduled projects; scan phase **3 of 80**, `auth-setup` phase 2, `candidate-journey` the only co-scheduled project, opt-in closures 2/1/1.
- **Five in-code records corrected and the parity table written** where a future reader of the scans will find it.

## Task Commits

1. **Task 1: Extract the scan core into one module the voter spec re-imports** — `59dbb971a` (refactor) — *executed before this session; not redone*
2. **Task 2: The seven candidate surfaces, both themes, and the wiring that lets them run (REACH-14)** — `34ce9d0d6` (feat)
3. **Task 3: Correct the in-code records this plan made false, and write the parity table** — `a882f24b5` (docs)

## Files Created/Modified

- `tests/tests/specs/a11y/candidate-a11y.spec.ts` **(created)** — the seven-entry candidate route table, the reach proof, the `toScanEntry` composition, and the parity table.
- `tests/tests/utils/axeScan.ts` — the shared body now computes both verdicts and reports both; surface-count and "unauthenticated" records corrected.
- `tests/tests/utils/rawKeyScan.ts` — detection extracted as `collectRawI18nKeyFindings`; the throwing `assertNoRawI18nKeys` retained; "where it runs" corrected from 14 surfaces to 28.
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — re-scoped as the voter half of a two-file family; the unauthenticated-run comment made file-scoped.
- `tests/playwright.config.ts` — W3: `auth-setup` ungated, `candidate-a11y-scan` added, explicit `testMatch` on `a11y-smoke`, perm chain head anchored on the scan; dormancy claim replaced with a `147-ORDERING.md` § *Decision (A)* citation.
- `.planning/phases/147-…/147-NEGATIVE-CONTROL.md` — `REACH-14` row + its detail section.

## Decisions Made

### 1. Decision (B) implemented without touching the scanner's detection

`147-ORDERING.md` § *For 147-03* item 6 says to change `assertNoRawI18nKeys` so it **returns** its findings instead of throwing. The plan's own prohibitions say **MUST NOT change `assertNoRawI18nKeys`'s body or its key-set derivation**, because `147-04` re-runs `147-01`'s injections against it unchanged.

Taking either literally breaks the other. The prohibition's *stated reason* is entirely about detection — key-set derivation, deleted-key detectability, `147-04`'s re-run — so the reading that satisfies both is: **change the reporting, not the detection.**

- `collectRawI18nKeyFindings(page, label)` is the detection, extracted verbatim (same `loadCatalogKeys`, same sub-run walk, same sighting collection, same message text).
- `assertNoRawI18nKeys` keeps its throwing `expect` and its exact observable behaviour; it now delegates.
- The shared body calls the collector and reports with `expect.soft`, so `assertAxeGates` always runs afterwards.

A byte-literal reading of "MUST NOT change its body" would have forced a duplicated finding loop — two copies that can drift, which is the precise thing this plan exists to eliminate. An injected raw key still turns the run red (a soft failure still fails the test), so `147-04`'s `RK*-NEW` pairing is unaffected.

### 2. The `PLAYWRIGHT_NO_A11Y` interaction — a gap in § *For 147-03*, recorded not absorbed

Item 4 adds `'candidate-a11y-scan'` to `data-setup-perm-1e1cg1co.dependencies`; item 2 declares the project. The list is silent on `PLAYWRIGHT_NO_A11Y`, and the two silent readings are both wrong:

- declare the project unconditionally → `PLAYWRIGHT_NO_A11Y=1` silently runs 14 a11y scans, breaking a documented opt-out;
- gate the project but not the anchor entry → Playwright rejects a dependency on an undeclared project, so `PLAYWRIGHT_NO_A11Y=1` **fails at config load**.

The plan says to record the gap rather than decide it. It is recorded here and in the config comment, and resolved by applying the file's *own existing* opt-out convention to both the project and the anchor entry — no new mechanism. Under the default run (no env) the graph is byte-for-byte the W3 the instrument modelled, which the observed phase table confirms.

### 3. Both proofs run after `reach`, not after `goto`

`assertDarkThemeApplied` reads the persistent header chrome with `querySelector`; immediately after `goto` that chrome is not in the document yet, so an early call compares against `null`. And for `cand-question` / `cand-nav-menu` the scan target is not the URL that was opened. Composing both proofs into the tail of `settle` fixes both, and keeps them *before* the scan, which is the property T-147-09 asks for.

## Config change vs. § *For 147-03*, item for item

| # | § *For 147-03* says | what landed |
|---|---|---|
| 1 | Remove the `PLAYWRIGHT_VISUAL` gate on `auth-setup`; declare it unconditionally | done — `auth-setup` is a plain project entry; observed running in the default suite, phase 2, 5.0 s |
| 2 | Add `candidate-a11y-scan` — `storageState: STORAGE_STATE`, `dependencies: ['data-setup-base','auth-setup']`, explicit `testMatch` | done, verbatim; **plus** the `PLAYWRIGHT_NO_A11Y` opt-out (see Decision 2) |
| 3 | Add an explicit `testMatch` to `a11y-smoke` so it does not collect the new spec | done — `/a11y-smoke\.spec\.ts/`; `--list` confirms `a11y-smoke` still enumerates its own 16 tests and none of the candidate ones |
| 4 | Add `'candidate-a11y-scan'` to `data-setup-perm-1e1cg1co.dependencies` | done; conditional on the same opt-out (see Decision 2) |
| 5 | Create the candidate scan spec — 7 surfaces × 2 themes, reusing the existing authenticated fixture | done — `candidate-a11y.spec.ts`, 14 enumerated, 7 dark |
| 6 | `assertNoRawI18nKeys` returns findings; the shared body reports both verdicts | done via extraction (see Decision 1) — the shared body reports both, neither short-circuiting |
| 7 | Confirm the drawer surfaces are reached via the fixture, not a click | done — `cand-nav-menu.reach` calls `createNavMenu(page).openMobileNav()`; no `nav-menu-toggle` click anywhere in the spec |

## The five in-code records corrected

| file | old claim | new claim |
|---|---|---|
| `tests/tests/utils/rawKeyScan.ts` (§ *Where it runs*) | "Wired into `assertAxeScan` in `a11y-smoke.spec.ts` … 7 routes x 2 themes" | wired into `assertAxeScan` in `utils/axeScan.ts`, the core both specs import — **14 routes × 2 themes = 28 surfaces**, named per half, with the pre-147 state and the `RK*-OLD` measurement recorded |
| `tests/tests/utils/rawKeyScan.ts` (failure message docblock) | "WHICH of the **14** scanned surfaces broke" | "WHICH of the **28** scanned surfaces broke" — 14 voter + 14 candidate |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` (file docblock) | "0-violation state across 7 voter-app surfaces", no sibling named | scoped as the **voter half** of a two-file family; names `candidate-a11y.spec.ts`; says the gates live in `utils/axeScan.ts`. The shared-behaviour passage moved **into** the core (`assertAxeGates` now carries the 28-surface count and states it is the only gate for either half) rather than being duplicated |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts:98` | "Run unauthenticated — all routes are voter-app (public)" | "all routes **IN THIS FILE**", with an explicit note that the sibling runs authenticated and the property is neither project- nor family-wide |
| `tests/playwright.config.ts` (docblock + project comment) | "`auth-setup` is retained ONLY to back the visual opt-in project; it is dormant in the default run" | it runs in the default run, phase 2, measured 5.0 s, because `candidate-a11y-scan` consumes its session — plus why **this** wiring and not the two the file already warns about, citing `147-ORDERING.md` § *Decision (A)* as the single source |

**Plus a fifth, same class, not in scout § F:** `RawAxeRoute`'s docblock said such an entry is navigated "from a clean unauthenticated page". Browser state comes from the *project*, not the discriminant. Corrected.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's own Task-2 verify script over-counts by one**

- **Found during:** Task 2
- **Issue:** its filter `/candidate-a11y|cand-/` over test *titles* reports **15**, not 14 — `cand-` also matches an unrelated perm test, `"hideIfMissingAnswers.candidate=true: cand-1 visible, cand-2 hidden on /results"`. The assertion would fail on a correct implementation.
- **Fix:** filtered by `projectName === 'candidate-a11y-scan'`, which is what "fourteen candidate scan tests" means. Same assertion, a filter that measures it. (Same class as Task 1's recorded dotenv-banner parser note; that parser bug also had to be worked around again here — the banner contains a literal `{ override: true }`, so slicing from the first `{` is not enough; slicing from the first line that is exactly `{` works.)
- **Files modified:** none — the script is inline in the plan, not in the tree.
- **Verification:** corrected check prints `OK 14 candidate scans enumerated in the default run, 7 of them dark`.
- **Committed in:** `34ce9d0d6` (recorded in the commit message)

**2. [Rule 2 - Missing Critical] `PLAYWRIGHT_NO_A11Y` would have failed at config load**

- **Found during:** Task 2
- **Issue:** § *For 147-03* item 4 as written (unconditional anchor entry) makes `PLAYWRIGHT_NO_A11Y=1` throw at config-load time, because the project it names is not declared under that env.
- **Fix:** both the project and the anchor entry follow the file's existing opt-out convention. Recorded as a gap in the list rather than decided quietly (Decision 2).
- **Files modified:** `tests/playwright.config.ts`
- **Verification:** default run unchanged from the W3 model (observed phase table, 0 mismatches).
- **Committed in:** `34ce9d0d6`

**3. [Rule 3 - Blocking] Task 2 had to touch two files outside its declared `<files>`**

- **Found during:** Task 2
- **Issue:** Task 2's `<files>` lists only the candidate spec, the config and the negative-control doc, but its `<action>` requires applying Decision (B)'s reporting mechanism — which § *For 147-03* item 6 locates in `rawKeyScan.ts` and `assertAxeScan`.
- **Fix:** both edited under Task 2; both are in the plan's own `files_modified` frontmatter, so this is an under-specified task file list rather than scope creep.
- **Files modified:** `tests/tests/utils/rawKeyScan.ts`, `tests/tests/utils/axeScan.ts`
- **Verification:** `yarn lint:check`, `format:check`, `typecheck:tests` all exit 0; the 18 ordered voter titles unchanged.
- **Committed in:** `34ce9d0d6`

---

**Total deviations:** 3 auto-fixed (1 bug in a plan-supplied script, 1 missing-critical config guard, 1 blocking file-list gap)
**Impact on plan:** none on scope or outcome. All three are corrections to the plan's own instructions rather than to the tree, and each is recorded where a later plan will look for it.

## Issues Encountered

**`a11y-smoke`'s summed per-test time read +36.3 s against `BASE-GREEN` (130.2 s → 166.5 s) and is recorded as UNATTRIBUTED rather than explained away.** The evidence against attributing it to this change: the same project, on the same tree, measured **194.9 s** and **301.4 s** in Task 1's two isolated a11y runs — both *before* Task 2 touched the shared body. 166.5 s sits below both. The figure varies by a factor of ~2.3 across runs regardless of the change, so a single-run comparison cannot carry a causal claim in either direction. The number that matters under the cardinal rule is the suite wall clock: **10.8 → 10.7 min**.

**Phase 3 grew +4.9 s (27.3 → 32.2 s)** rather than the predicted flat zero: the scan's 10.3 s window does not fit entirely inside `candidate-journey`'s 24.2 s. The prediction holds in direction — the new work hides under an existing critical path — with a small residue, and the suite total is unchanged.

Neither was hidden in the register; both are in `147-NEGATIVE-CONTROL.md` § `REACH-14`.

## Known Stubs

None. Every route entry declares a real data-driven anchor, every scan runs, and every assertion is live. The known **gaps** — reachable-but-not-scanned states, the eleven out-of-family candidate routes, and the four limits of the zero — are recorded as unknowns in the candidate spec's docblock, not as stubs and not as zeros.

## Threat Flags

None. The plan's `<threat_model>` mitigations are all discharged in code: T-147-09 by `assertCandidateReach` (URL + marker, asserted before the scan), T-147-11 by the single parameterless `assertAxeGates` plus `grep -n toHaveLength candidate-a11y.spec.ts` returning nothing, T-147-12 by the required `contentTestId` with the preview anchoring on the success-branch article and the questions entry expanding every category. T-147-SC: no package install occurred; `git diff --exit-code -- package.json yarn.lock` exits 0.

## Verification

| check | result |
|---|---|
| default invocation enumerates 14 candidate scan tests, 7 dark | **OK** (by project name; see Deviation 1) |
| `axeScan.ts` is the sole home of the tag set, both gates, the settle and the dark guard | **OK** — `grep -rl` returns exactly that file for all five symbols |
| both specs import from the core | **OK** |
| voter a11y `--list` titles identical, ordered, before vs after | **OK** — 18/18, re-checked after all three tasks |
| candidate spec declares no gate of its own | **OK** — `grep -n toHaveLength` returns nothing |
| `REACH-14` filled | **OK** — `TBD-147` count 42 → **36** (exactly this plan's 6 cells), row count still 13 |
| a11y projects green with Task-2 counts after Task 3 | **OK** — `a11y-smoke` 16/0, `candidate-a11y-scan` 14/0, preflight OK=1 FAILED=0 |
| Task 3 changed no executable line | **OK** — `git diff -U0` over `tests/`, comment and blank lines filtered, is **empty** |
| `yarn lint:check` | exit **0** (2 pre-existing warnings, both in untouched files) |
| `yarn format:check` | exit **0** |
| `yarn build` | exit **0** |
| `yarn test:unit` | exit **0** — 1812 tests passed |
| full default E2E suite | **150 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**, exit 0, 10.7 min |
| `git diff --exit-code -- package.json yarn.lock` | exit **0** |

## Self-Check: PASSED

- `tests/tests/specs/a11y/candidate-a11y.spec.ts` — FOUND
- `tests/tests/utils/axeScan.ts` — FOUND
- `tests/tests/utils/rawKeyScan.ts` — FOUND
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — FOUND
- `tests/playwright.config.ts` — FOUND
- `.planning/phases/147-…/147-NEGATIVE-CONTROL.md` — FOUND, `REACH-14` filled
- commit `59dbb971a` — FOUND
- commit `34ce9d0d6` — FOUND
- commit `a882f24b5` — FOUND

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Ready for `147-04`. What it inherits:

- **The gate it must prove catches.** `AX1-NEW` / `RK1-NEW` / `RK2-NEW` re-run `147-01`'s three injections against the same instruments. Both injection sites stay deliberately blind as the plan required: `candidate-journey.spec.ts:924` and `candidateProfilePage.fixture.ts:179` are untouched.
- **An unchanged raw-key detector.** `collectRawI18nKeyFindings` carries the identical key-set derivation and sub-run walk; `assertNoRawI18nKeys` still throws. `147-04`'s injections meet the instrument they were designed against. **Note for `147-04`:** the gate now reports via `expect.soft` inside the shared body, so an injected raw key fails the test *at its end* rather than aborting it — the run still goes red, but the same test also reports its axe verdict. Read the failure list, not just the first error.
- **A confirmed baseline for `E2E1-SUITE`:** 150 passed / 0 failed at `a882f24b5`, and `DET-RUNS` should expect the candidate project at ~10 s wall / ~39 s summed.
- **CSCAN-01/02/03 stay `Pending` in `REQUIREMENTS.md`, deliberately.** All three are also declared by
  `147-04-PLAN.md` and `147-05-PLAN.md`, which have no summaries yet, so the shared-ID gate (#2388) reports
  `0/3 ready`. This plan's `requirements-completed` records what it *contributed*; the checkboxes flip when
  the last declaring plan finishes. (An initial direct `requirements mark-complete` here flipped them early
  and was reverted — CSCAN-03's own wording, "proven by injection", is `147-04`'s to discharge.)
- **`147-05` still owns the planning-side records** — `.planning/REQUIREMENTS.md:40-41`, `v2.14-REQUIREMENTS.md:126`, the pending todo, and `ROADMAP.md:788-797` all still carry the stale line numbers and key spelling; this plan corrected only the in-code half.

**One open judgement, stated rather than buried:** Decision (B) satisfies criterion 5's *purpose* (an independent, non-subsumed raw-key verdict) but not the scout's literal restatement, *"reported as its own **test**"*. Reporter output still shows one test per surface with both findings inside it. That was `147-02`'s recorded choice, priced at ≤ +138 s for the alternative; it is re-surfaced here because it is the one place in this phase where the evidence does not by itself force the answer.

---

_Phase: 147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate_
_Completed: 2026-08-27_
