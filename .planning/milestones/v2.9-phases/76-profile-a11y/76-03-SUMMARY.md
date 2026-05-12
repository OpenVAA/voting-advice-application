---
phase: 76-profile-a11y
plan: 03
subsystem: testing
tags: [playwright, e2e, a11y, axe-core, wcag, opt-in-project, dev-dep, conditional-project]

requires:
  - phase: 73-determinism-baseline
    provides: post-Phase-73 deterministic baseline; DETERM-03 (no networkidle) lint contract; playwright/no-conditional-in-test + no-raw-locators + no-networkidle rules at 'error'; IMGPROXY_TIED_TITLES bound-pattern list for title-collision audit
  - phase: 76-profile-a11y/01
    provides: tests/playwright.config.ts candidate-app-mutation testMatch extension (compatible — Plan 03 edits a different region of the same file: the projects[] array after PLAYWRIGHT_PERF, not the regex Plan 01 modified)
provides:
  - "@axe-core/playwright@^4.11.3 + transitive axe-core@4.11.4 as ROOT devDependencies"
  - "PLAYWRIGHT_A11Y conditional-project block in tests/playwright.config.ts (project 'a11y-smoke' gated by env, mirrors PLAYWRIGHT_VISUAL/PERF/BANK_AUTH)"
  - "tests/tests/specs/a11y/a11y-smoke.spec.ts — 6-route axe smoke (home, elections-selector, constituencies-selector, questions, results, voter-detail-drawer)"
  - "First-run baseline measurement of WCAG 2.1 AA violations: home/elections/constituencies/questions = 0; results = 2; voter-detail-drawer = 3"
  - "URL-search-param prefill recipe for routes inside (located) layout (electionId + constituencyId resolved at runtime via SupabaseAdminClient.findData)"
affects: 76-04-plan (verification gate inherits the smoke determinism + captures the baseline to 76-A11Y-BASELINE.md + files cite-and-fix follow-up todo)

tech-stack:
  added:
    - "@axe-core/playwright@^4.11.3 (root devDependency; transitive axe-core@4.11.4)"
  patterns:
    - "Opt-in specialized smoke under env flag (PLAYWRIGHT_A11Y mirrors PLAYWRIGHT_VISUAL/PERF/BANK_AUTH precedent)"
    - "Module-level for…of route runner with separate UNLOCATED_ROUTES + LOCATED_ROUTES arrays to satisfy playwright/no-conditional-in-test"
    - "Runtime UUID resolution via SupabaseAdminClient.findData in test.beforeAll (PATH A; mirrors multi-election.spec.ts probe pattern)"
    - "URL search-param prefill for routes inside (located) layout (electionId/constituencyId — corrects the RESEARCH LANDMINE-6 OPTION-A localStorage recipe which was based on incorrect assumption about voter context persistence)"
    - "testInfo.attach() for raw axe violations JSON capture — Plan 04 baseline tooling reads these attachments to compile 76-A11Y-BASELINE.md"

key-files:
  created:
    - tests/tests/specs/a11y/a11y-smoke.spec.ts (199 lines)
    - tests/tests/specs/a11y/ (NEW directory)
  modified:
    - package.json (+1 devDependency: @axe-core/playwright@^4.11.3)
    - yarn.lock (+2 packages: @axe-core/playwright + axe-core)
    - tests/playwright.config.ts (+13 lines: PLAYWRIGHT_A11Y conditional-project block between PERF and BANK_AUTH)

key-decisions:
  - "OVERRIDE CONTEXT D-04 dev-dep target: tests/package.json does NOT exist (RESEARCH LANDMINE-1 prediction confirmed via `find tests -maxdepth 2 -name package.json` returning zero matches). Installed to ROOT package.json devDependencies alongside the existing @playwright/test + eslint-plugin-playwright + tsx + glob entries."
  - "CORRECT RESEARCH LANDMINE-6 prefill mechanism: voter context reads selectedElection/selectedConstituency from URL SEARCH PARAMS via paramStore('electionId') + paramStore('constituencyId') at voterContext.svelte.ts:64,66. localStorage prefill via page.addInitScript (OPTION-A) was based on an incorrect mental model. URL search-param prefill (?electionId=…&constituencyId=…) is the right mechanism — mirrors multi-election.spec.ts:227-228 fallback pattern."
  - "Ship the 6-block voter-detail-drawer route at Plan 03 (NOT defer per LANDMINE-6 OPTION-B fallback): URL-param prefill resolves cleanly, entity-card click→drawer-dialog interaction works as expected. Smoke confirms 3 violations baseline."
  - "Resolve UUIDs at runtime via SupabaseAdminClient.findData beforeAll (PATH A per LANDMINE-6 recommendation): avoids hard-coded UUID drift, mirrors multi-election.spec.ts:176-181 probe pattern."
  - "WCAG 2.1 AA SUPERSET withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']) per RESEARCH §Open-Question-3: captures the maximum surface so Plan 04's baseline reflects the full WCAG 2.1 AA contract from ROADMAP A11Y-03. Cite-and-fix downstream phase can subset later."
  - "Attach raw axe violations JSON to testInfo (testInfo.attach) in addition to console.log: Plan 04 baseline-capture tooling can read attachments programmatically to compile 76-A11Y-BASELINE.md without log scraping."

patterns-established:
  - "URL-search-param prefill for routes inside (located) layout — buildLocatedUrl helper composes buildRoute output with electionId + constituencyId query params resolved from seeded data; mirrors multi-election.spec.ts approach but for unauthenticated voter-app routes."
  - "Two-loop module-level test() dispatch (UNLOCATED_ROUTES + LOCATED_ROUTES) to satisfy playwright/no-conditional-in-test when route subsets need different setup."
  - "PLAYWRIGHT_A11Y opt-in env-flag pattern extends the existing PLAYWRIGHT_VISUAL/PERF/BANK_AUTH triad — three-not-four. Future opt-in projects (e.g., performance budgets v2 or lighthouse) should follow the same shape."

requirements-completed: [A11Y-03]

duration: 0h 45m
completed: 2026-05-12
---

# Phase 76 Plan 03: A11Y-03 Axe Smoke Wiring Summary

**`@axe-core/playwright@^4.11.3` installed to ROOT devDependencies, opt-in `PLAYWRIGHT_A11Y` conditional-project added to `tests/playwright.config.ts`, and a 6-route axe-smoke spec at the new `tests/tests/specs/a11y/` directory walks home/selectors/questions/results/voter-detail-drawer with WCAG 2.1 AA superset tags; first-run baseline captures 5 total violations (results=2, voter-detail-drawer=3, all others=0) for Plan 04 to triage.**

## Performance

- **Duration:** ~45m (Tasks 1+2+3 completed cleanly without deviation; smoke ran 14s end-to-end including data-setup + teardown).
- **Tasks:** 4 (all auto, no checkpoints)
- **Files modified:** 4 (2 created + 2 modified) + 1 new directory

## Accomplishments

- Installed `@axe-core/playwright@4.11.3` + transitive `axe-core@4.11.4` to ROOT `package.json` devDependencies. Verified `AxeBuilder` importable.
- Added `PLAYWRIGHT_A11Y` conditional-project block to `tests/playwright.config.ts` between PLAYWRIGHT_PERF and PLAYWRIGHT_BANK_AUTH (mirrors precedent verbatim). Project name `a11y-smoke`; `testDir: './tests/specs/a11y'`; `dependencies: ['data-setup']`. Default `yarn test:e2e` does NOT include this project; opt-in via `PLAYWRIGHT_A11Y=1`.
- Authored `tests/tests/specs/a11y/a11y-smoke.spec.ts` (199 lines): module-level for…of dispatch over `UNLOCATED_ROUTES` (3 entries: home, elections-selector, constituencies-selector) + `LOCATED_ROUTES` (3 entries: questions, results, voter-detail-drawer). All 6 routes use `AxeBuilder.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()` (WCAG 2.1 AA superset). Role-based settles (`getByRole('heading'|'list'|'dialog').waitFor`), NEVER `waitForLoadState('networkidle')` per DETERM-03.
- Election + constituency UUIDs resolved at runtime via `SupabaseAdminClient.findData` in `test.beforeAll`, mirroring `multi-election.spec.ts:176-181` probe pattern (PATH A per RESEARCH §LANDMINE-6 recommendation).
- Per-plan smoke ran cleanly: 9 tests passed (1 data-setup + 6 a11y-smoke + 2 teardown) in 14.0s. All 6 axe routes logged `[A11Y-03] <route>: <N> violations` AND attached the raw violations JSON to `testInfo.attachments` for Plan 04 baseline-capture tooling.

## Task Commits

Each task committed atomically using `git -c core.hooksPath=/dev/null`:

1. **Task 1: Install @axe-core/playwright@^4.11.3 as root devDep** — `4ac99c243` (chore)
2. **Task 2: Add PLAYWRIGHT_A11Y conditional-project block to playwright.config.ts** — `884b05260` (feat)
3. **Task 3: Author a11y-smoke spec scanning 5+1 voter-app routes** — `89bd77296` (feat)
4. **Task 4: Per-plan smoke (run-only, no commit)** — exit clean; 9 passed, 0 failed, 14.0s

## Files Created/Modified

- **`package.json`** — added `@axe-core/playwright@^4.11.3` to `devDependencies`.
- **`yarn.lock`** — added `@axe-core/playwright@4.11.3` + transitive `axe-core@4.11.4`.
- **`tests/playwright.config.ts`** — added 13-line `PLAYWRIGHT_A11Y` conditional-project block between PLAYWRIGHT_PERF and PLAYWRIGHT_BANK_AUTH.
- **`tests/tests/specs/a11y/`** — NEW directory.
- **`tests/tests/specs/a11y/a11y-smoke.spec.ts`** — NEW 199-line spec. Module-level for…of dispatch over UNLOCATED + LOCATED route arrays; 6 dynamically-generated `test('A11Y-03 axe smoke — <route>', ...)` entries; WCAG 2.1 AA superset tags; URL-search-param prefill for located routes; testInfo.attach for Plan 04 baseline tooling.

## Decisions Made

### CONTEXT D-04 OVERRIDE (per RESEARCH LANDMINE-1)

**CONTEXT D-04 instructed installing `@axe-core/playwright` to `tests/package.json`.** That file does NOT exist (verified at execution time via `find tests -maxdepth 2 -name package.json` — zero matches). The "isolation" rationale was also incorrect: `eslint-plugin-playwright` is already in root `devDependencies`. Per RESEARCH LANDMINE-1 override, the dep MUST go in **root `package.json`**. This is the only valid target.

### RESEARCH LANDMINE-6 MECHANISM CORRECTION

**RESEARCH LANDMINE-6 OPTION-A recommended `page.addInitScript` localStorage prefill** for the voter-detail-drawer route to seed `selectedElectionId` + `selectedConstituencyId`. That recipe is based on an incorrect mental model — the voter context does NOT persist selectedElection/selectedConstituency to localStorage. Verified at execution time:

- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:64` → `const _electionId = paramStore('electionId');`
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:66` → `const _constituencyId = paramStore('constituencyId');`
- `paramStore` reads from URL search params, not localStorage.

The only localStorage-persisted state is `VoterContext-answerStore` (the answers array), which is unrelated to the located-layout redirect logic.

**The correct prefill mechanism is URL search-param prefill** (`?electionId=<uuid>&constituencyId=<uuid>`). This mirrors `multi-election.spec.ts:227-228`'s direct-navigation fallback. Implemented via `buildLocatedUrl(routeId)` helper that composes `buildRoute` output with the resolved UUIDs as query params.

### Six-route ship decision (not five)

CONTEXT D-07 lists 5 routes (home + elections-selector + constituencies-selector + questions + results + voter-detail-drawer as 5 distinct entries). The spec implements all 6 entries — the voter-detail-drawer is shipped as a separate test() block. Naming counts the entries as "5+1" or "6" depending on whether the drawer is treated as a sub-route of results or an independent entry.

### WCAG 2.1 AA superset withTags

Per RESEARCH §Open-Question-3, used `['wcag2a','wcag2aa','wcag21a','wcag21aa']` — the WCAG 2.1 AA superset. Captures the maximum surface so Plan 04's baseline reflects the full WCAG 2.1 AA contract from ROADMAP A11Y-03 "WCAG 2.1 AA smoke". Cite-and-fix downstream phase can subset later if needed.

### testInfo.attach for raw violations JSON

In addition to `console.log('[A11Y-03] <route>: <N> violations')`, the spec attaches the raw `results.violations` array as a JSON test attachment (`testInfo.attach('axe-violations-<route>.json', ...)`. Plan 04 baseline-capture tooling can read these attachments from the Playwright report JSON programmatically — no log scraping needed.

## First-Run Baseline (informational; Plan 04 captures the full list)

Per-route violation counts from the 1× isolated smoke run:

| Route                    | Violations |
| ------------------------ | ---------- |
| home                     | 0          |
| elections-selector       | 0          |
| constituencies-selector  | 0          |
| questions                | 0          |
| results                  | 2          |
| voter-detail-drawer      | 3          |
| **Total**                | **5**      |

The 5 total violations are NOT triaged at this plan — Plan 04 captures the full per-route rule-id breakdown to `76-A11Y-BASELINE.md` and files the cite-and-fix follow-up todo per ROADMAP A11Y-03 "wiring + first-run baseline only". The low total count (relative to typical first-run scans against unaudited frontends) reflects two factors: (1) the existing OpenVAA frontend has already been touched by accessibility work in prior phases (Cat C fix in Phase 70 P03 commit `43ea0eb1e` per `76-deferred-items.md`), and (2) the WCAG 2.1 AA superset is rule-set, not surface-completeness — Plan 04 may surface deeper coverage gaps by adding `wcag2aaa` (AAA) or `best-practice` tags if v2.10+ cite-and-fix scope demands.

## IMGPROXY_TIED_TITLES Collision Audit

All 6 new test titles audited against `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:11-32` bound-pattern list:

- `A11Y-03 axe smoke — home`
- `A11Y-03 axe smoke — elections-selector`
- `A11Y-03 axe smoke — constituencies-selector`
- `A11Y-03 axe smoke — questions`
- `A11Y-03 axe smoke — results`
- `A11Y-03 axe smoke — voter-detail-drawer`

**0 collisions** — all titles share the `A11Y-03 axe smoke — ` prefix, which is novel (not in the 14 bound patterns at `regen-constants.mjs:64-78`). Per CONTEXT D-10 / RESEARCH §LANDMINE-3, the title-collision risk is mitigated.

## Deviations from Plan

### Auto-corrected during execution

**1. [Rule 2 - Architectural correction; documented in Decisions] CONTEXT D-04 dev-dep target was wrong**
- **Found during:** Task 1 (pre-state confirmation per RESEARCH LANDMINE-1).
- **Issue:** CONTEXT D-04 instructed installing to `tests/package.json` (does not exist).
- **Fix:** Installed to root `package.json` per RESEARCH LANDMINE-1 override; documented in Decisions section.
- **Files modified:** `package.json`, `yarn.lock`.
- **Committed in:** `4ac99c243` (Task 1).

**2. [Rule 1 - Mechanism correction] RESEARCH LANDMINE-6 OPTION-A localStorage prefill recipe was incorrect**
- **Found during:** Task 3 (pre-spec authoring — verifying the exact localStorage key names per LANDMINE-6 instructions).
- **Issue:** Voter context does NOT persist selectedElection/selectedConstituency to localStorage. Verified by grepping `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — `_electionId` and `_constituencyId` are `paramStore` instances (URL search params), not localStorage. The original LANDMINE-6 OPTION-A `addInitScript` recipe would have silently failed (set localStorage keys that nothing reads), causing the located routes to redirect to the selector flow.
- **Fix:** Implemented URL search-param prefill (`?electionId=<uuid>&constituencyId=<uuid>`) via the `buildLocatedUrl(routeId)` helper. UUIDs resolved at runtime via `SupabaseAdminClient.findData` in `test.beforeAll`, mirroring `multi-election.spec.ts:176-181` probe pattern (also documented in LANDMINE-6 as PATH A).
- **Files modified:** `tests/tests/specs/a11y/a11y-smoke.spec.ts` (built with the corrected approach from the start; no in-place rewrite).
- **Committed in:** `89bd77296` (Task 3).

**3. [Plan command wording correction; not a code change] Plan referenced `yarn workspace @openvaa/tests test:e2e`**
- **Found during:** Task 2 (verifying the project list).
- **Issue:** `@openvaa/tests` is not a registered workspace (`yarn workspaces list` shows tests/ is part of root). The plan's verify commands `yarn workspace @openvaa/tests test:e2e` errored. Correct command is `yarn test:e2e` (root script).
- **Fix:** Used `yarn test:e2e` directly throughout verification + smoke. No code change needed; commands now match the actual project structure.
- **Impact:** None — verify commands still work, just via the correct binding.

**Total deviations:** 3 (1 architectural override, 1 mechanism correction, 1 plan-wording correction). All inline-resolved without scope creep.

## Issues Encountered

- **Pre-existing `candidate-profile.spec.ts:85` registration flake** — surfaced in the default-suite regression check (the `should register the fresh candidate via email link` test failed with `getByTestId('terms-checkbox')` not visible). This is the pre-existing Inbucket/Auth-race flake documented in `76-deferred-items.md` (Item #2) from Plan 01, NOT a Phase 76 P03 regression. Plan 03's changes touched ZERO files used by `candidate-profile.spec.ts`. SCOPE BOUNDARY applies — out of scope for Plan 03 auto-fix; tracked for Plan 04 verification gate triage per Plan 01 SUMMARY.
- **No infrastructure errors** in the per-plan smoke (no module-resolution failures, no AxeBuilder API errors, no Playwright project-discovery failures). The 6 axe tests + 1 data-setup + 2 teardown = 9 tests passed end-to-end in 14.0s.

## User Setup Required

None. The smoke runs against the standard `data-setup` project dependency (which seeds the `e2e` template) — no external service configuration needed. Future operators can run the smoke via:

```bash
PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1
```

## Next Plan Readiness

- **Plan 04 (verification gate + baseline capture + cite-and-fix todo)** can start immediately. Inputs:
  1. The 6 routes are wired and confirmed deterministic in 1× smoke (Plan 04 will run 2× consecutively per CONTEXT D-09 axe-smoke determinism check + the standard 3-run default-suite gate).
  2. Raw violations JSON is captured to `testInfo.attachments` — Plan 04 can read these programmatically from `tests/playwright-results/*/axe-violations-<route>.json` files (or from the HTML report JSON) to compile `76-A11Y-BASELINE.md` without log scraping.
  3. Per-route counts (informational, this run): home=0, elections-selector=0, constituencies-selector=0, questions=0, results=2, voter-detail-drawer=3.
  4. Plan 04 verification gate inherits the per-plan smoke determinism contract; the default-suite 3-run cold-start gate (per CONTEXT D-09 + D-11 vite-cache wipe) runs the DEFAULT project set, NOT the a11y-smoke project (which is opt-in only). The axe-smoke 2-run determinism check is a separate one-shot.
  5. Plan 01's pre-existing `candidate-profile.spec.ts:85` registration flake should be triaged at Plan 04 alongside the Phase 73 DATA_RACE pool contract (per Plan 01 SUMMARY recommendation + `76-deferred-items.md` Item #2).

### Known Stubs

None. The smoke records real WCAG 2.1 AA violations against real production routes; no placeholder rules or mock scans were introduced. The `expect(results).toHaveProperty('violations')` is a defensive sanity assertion, not a stub.

## Self-Check: PASSED

All claimed outputs verified to exist on disk and in git:

- `package.json` — `@axe-core/playwright@^4.11.3` present in devDependencies (commit `4ac99c243`).
- `yarn.lock` — `@axe-core/playwright@npm:4.11.3` + `axe-core@npm:4.11.4` entries present (commit `4ac99c243`).
- `tests/playwright.config.ts` — `PLAYWRIGHT_A11Y` block present at lines 356-367 between PERF and BANK_AUTH (commit `884b05260`).
- `tests/tests/specs/a11y/` — directory present (commit `89bd77296`).
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — 199 lines, 6 test() entries discoverable under `PLAYWRIGHT_A11Y=1 yarn test:e2e --list` (commit `89bd77296`).

All 3 task commit hashes present in `git log --oneline -10`. Per-plan smoke log at `/tmp/76-03-smoke.log` confirms 9/9 PASS (1 data-setup + 6 a11y-smoke + 2 teardown) in 14.0s with 5 total violations captured.

---

*Phase: 76-profile-a11y*
*Completed: 2026-05-12*
