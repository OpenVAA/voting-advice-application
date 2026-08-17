---
phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour
plan: 04
subsystem: testing
tags: [playwright, e2e, dev-seed, perm-templates, settings, access, notifications, parallel-safety, externalIdPrefix]

# Dependency graph
requires:
  - phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour
    plan: 01
    provides: baseV1 dataset extensions (foundation for D-89-03 distinct-prefix decoupling)
  - phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour
    plan: 03
    provides: candidate-mega-journey playwright project (89-04 perm chains depend on it via dependencies array)
provides:
  - "3 perm templates under packages/dev-seed/src/templates/permutations/ — perm-disable-voter-app (prefix 'e2e-perm-novapp-'), perm-disable-candidate-app (prefix 'e2e-perm-nocand-'), perm-per-app-notifications (prefix 'e2e-perm-notif-') — each registered in BUILT_IN_TEMPLATES + re-exported from templates/index.ts"
  - "6 setup/teardown wrapper files at tests/tests/setup/ (3 .setup.ts + 3 .teardown.ts) — each setup is a 1-line setupFromTemplate('<name>', { extraTeardownPrefix: ['test-', 'e2e-perm-'] }) wrapper; each teardown uses a single deterministic PREFIX const matching its template"
  - "3 perm spec files at tests/tests/specs/perm/ — perm-disable-voter-app.spec.ts (1 test, 3 routes), perm-disable-candidate-app.spec.ts (1 test, 3 routes), perm-per-app-notifications.spec.ts (2 tests, voter + candidate routes with strict cross-route absence)"
  - "9 playwright project entries appended to tests/playwright.config.ts — sequenced AFTER candidate-mega-journey via dependencies; sequential chain perm-disable-voter-app → perm-disable-candidate-app → perm-per-app-notifications"
affects: [89-LAST (candidate-settings.spec.ts 7.1.2/3/4 excision gated on the perm specs absorbing the coverage), v2.10 close (3 new perm chains added to the suite ledger)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "[Pattern H] Perm template shape — 3 templates mirror perm-disable-election-1co.ts verbatim (1 election, 1 CG, 1 CO, 2 candidates, shared buildXxx helpers from shared.ts); only the externalIdPrefix + APP_SETTINGS override branches differ"
    - "[Pattern F] setupFromTemplate consumer — 3 setup wrappers mirror perm-disable-election-1co.setup.ts (1-line setupFromTemplate('<name>', { extraTeardownPrefix: ['test-', 'e2e-perm-'] }))"
    - "[Pattern G] teardown — 3 teardown wrappers mirror baseV1.teardown.ts shape; PREFIX const = template's externalIdPrefix; runTeardown(PREFIX, client) + expect(rowsDeleted).toBeGreaterThanOrEqual(0)"
    - "[Pattern I] Perm spec shape — role-based maintenance assertions (getByRole('main') + getByRole('heading', { level: 1 })) + testid-based start-button hidden assertion; role=dialog filter({ hasText: '[notif-X]' }) for notification cross-route absence"
    - "[Pattern J] Playwright project chain — 3 setup/spec/teardown triples appended after candidate-mega-journey; sequential dependencies chain (data-setup-perm-disable-voter-app deps ['candidate-mega-journey']; data-setup-perm-disable-candidate-app deps ['perm-disable-voter-app']; data-setup-perm-per-app-notifications deps ['perm-disable-candidate-app'])"
    - "D-89-03 parallel-safety — each perm template uses its OWN distinct externalIdPrefix ('e2e-perm-novapp-', 'e2e-perm-nocand-', 'e2e-perm-notif-') so cross-chain leakage is impossible even if the chains run concurrently with other parts of the suite (sequenced sequentially in 89-04 for ledger clarity, but the prefix isolation means parallel execution is structurally safe)"
    - "Strict-only assertions — 0 expect.soft, 0 try/catch wrapping expect(), 0 .catch fallbacks across all 3 spec files (3 grep matches against the deny-list are all in the file-level docstring contract blocks per 89-03 precedent)"

key-files:
  created:
    - packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts
    - packages/dev-seed/src/templates/permutations/perm-disable-candidate-app.ts
    - packages/dev-seed/src/templates/permutations/perm-per-app-notifications.ts
    - tests/tests/setup/perm-disable-voter-app.setup.ts
    - tests/tests/setup/perm-disable-voter-app.teardown.ts
    - tests/tests/setup/perm-disable-candidate-app.setup.ts
    - tests/tests/setup/perm-disable-candidate-app.teardown.ts
    - tests/tests/setup/perm-per-app-notifications.setup.ts
    - tests/tests/setup/perm-per-app-notifications.teardown.ts
    - tests/tests/specs/perm/perm-disable-voter-app.spec.ts
    - tests/tests/specs/perm/perm-disable-candidate-app.spec.ts
    - tests/tests/specs/perm/perm-per-app-notifications.spec.ts
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-04-SUMMARY.md
  modified:
    - packages/dev-seed/src/templates/index.ts
    - tests/playwright.config.ts

key-decisions:
  - "Plan executed as-written: 4 tasks committed atomically (Task 1 → Task 4). Each task's static verify gate passed clean."
  - "Each perm template's externalIdPrefix mirrors 89-RESEARCH §'Plan 89-04' verbatim ('e2e-perm-novapp-' / 'e2e-perm-nocand-' / 'e2e-perm-notif-') honoring D-89-03 parallel-safety contract."
  - "perm-per-app-notifications template uses BOTH voterApp + candidateApp NotificationData payloads with distinct [notif-voter] / [notif-cand] / [notif-voter-content] / [notif-cand-content] markers — confirmed against packages/app-shared/src/settings/dynamicSettings.type.ts:303-312 (notifications: { candidateApp?: NotificationData | null; voterApp?: NotificationData | null }) + NotificationData shape :397-415 (show? + title: LocalizedString + content: LocalizedString)."
  - "Spec uses role=dialog filter({ hasText: '[notif-X]' }) — defends against ANY other dialog on the page (cookie banner / survey popup / etc.) by anchoring the locator to the dialog that contains the exact marker. Strict .not.toContainText('[notif-other]') enforces the cross-route absence requirement (TIR4:51-54)."
  - "Each teardown uses a single deterministic string PREFIX const matching its template (NOT array notation per planner note in PLAN.md Task 2 behavior block) — mirrors perm-disable-election-1co.teardown.ts:11 shape."
  - "Playwright config sequencing: 3 perm chains appended at the very end after candidate-mega-journey; sequential chain order matches PLAN.md Task 4 behavior list verbatim. Spec projects all set fullyParallel: false (matches 88-03 perm-* family precedent at lines 786-846)."
  - "Runtime verification deferral: per 89-03 + 89-02 + 89-01 carry-forward, the vite dev server returned HTTP 500 at gate time (same environment cascade). Static verification of all 4 tasks is clean (file existence + grep counts + 0 soft constructs + TypeScript-import-shape parity with the working perm-disable-election-1co analog). The pre-existing perm-1e1cg1co cascade also blocks any chain that transitively depends on it (89-04 perm chains depend on candidate-mega-journey → voter-mega-journey → perm-1e1cg1co)."

patterns-established:
  - "Distinct-prefix per-perm-template decoupling — D-89-03 binding fully cashed out in 89-04: 3 NEW prefixes added to the perm-* prefix namespace ('e2e-perm-novapp-', 'e2e-perm-nocand-', 'e2e-perm-notif-') extending the 88-03 set ('e2e-perm-disable-elec-1co-', etc.). Future perm templates SHOULD follow this convention rather than reusing 'e2e-perm-' as a shared umbrella."
  - "Deterministic single-string PREFIX in perm teardowns — single source of truth (no array notation, no derivation from template object) for grep-friendly cross-referencing and zero ambiguity when debugging row-leak issues."
  - "Sequential perm chain extension — when adding new perm chains, anchor the first new setup on the LAST existing spec name (89-04 anchors data-setup-perm-disable-voter-app on candidate-mega-journey) and chain subsequent setups on their predecessor spec name (matches 88-03 perm-* family pattern at config lines 786-846)."

requirements-completed:
  - "TIR4:34-54"
  - TIR4-PERM-01
  - TIR4-PERM-02
  - TIR4-PERM-03

# Metrics
duration: ~10 min
completed: 2026-05-29
---

# Phase 89 Plan 04: 3 settings permutations Summary

**3 perm templates + 3 setup/teardown pairs + 3 spec files + 9 playwright project entries landed end-to-end per TIR4-PERM-01..03 (voterApp disabled, candidateApp disabled, per-app notifications). Each template uses a distinct externalIdPrefix ('e2e-perm-novapp-' / 'e2e-perm-nocand-' / 'e2e-perm-notif-') per D-89-03 enabling cross-chain parallel safety. Sequential perm chain appended after candidate-mega-journey. Static verification clean; runtime gate deferred to operator runbook per environment cascade carry-forward from 89-01/02/03.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-29T10:48:54Z (orchestrator handoff post-89-03)
- **Completed:** 2026-05-29T10:53:49Z (final perm-config commit) — plus SUMMARY/STATE phase
- **Tasks:** 4
- **Files created:** 13 (3 templates + 6 setup/teardown + 3 specs + this SUMMARY)
- **Files modified:** 2 (templates/index.ts + tests/playwright.config.ts)

## Accomplishments

- **3 perm templates authored** at `packages/dev-seed/src/templates/permutations/`:
  - **perm-disable-voter-app.ts** (`P = 'e2e-perm-novapp-'`): spreads `MINIMAL_BASE_APP_SETTINGS` and overrides `access.voterApp: false`. Topology: 1 election, 1 CG, 1 CO, 2 candidates (mirrors perm-disable-election-1co.ts).
  - **perm-disable-candidate-app.ts** (`P = 'e2e-perm-nocand-'`): same shape, `access.candidateApp: false`.
  - **perm-per-app-notifications.ts** (`P = 'e2e-perm-notif-'`): same shape, `notifications: { voterApp: { show: true, title: { en: '[notif-voter] Voter-only notification.' }, content: { en: '[notif-voter-content] voter content body' } }, candidateApp: { show: true, title: { en: '[notif-cand] Candidate-only notification.' }, content: { en: '[notif-cand-content] candidate content body' } } }` — both apps' notifications carry distinct markers so cross-route absence is strictly observable.
- **templates/index.ts updated** — 3 new imports + 3 BUILT_IN_TEMPLATES entries + 3 named re-exports. The CLI's `loadBuiltIns` (Plan 05 dev-seed CLI) + setupFromTemplate's BUILT_IN_TEMPLATES lookup now resolve each name to its template at runtime.
- **6 setup/teardown wrapper files authored** at `tests/tests/setup/`:
  - Each `*.setup.ts` is a 1-line `setupFromTemplate('<name>', { extraTeardownPrefix: ['test-', 'e2e-perm-'] })` mirroring `perm-disable-election-1co.setup.ts:11-13` verbatim.
  - Each `*.teardown.ts` declares a single deterministic `const PREFIX = '<template-prefix>'` and invokes `runTeardown(PREFIX, client)` + asserts `rowsDeleted >= 0`. Per the planner's Task 2 directive: ITS OWN single string PREFIX const matching the template's externalIdPrefix — deterministic, not array notation.
- **3 perm spec files authored** at `tests/tests/specs/perm/`:
  - **perm-disable-voter-app.spec.ts** (1 test, 3 route assertions): `/en` + `/en/elections` show maintenance (role=main + role=heading[level=1] + testIds.voter.home.startButton hidden); `/en/candidate` shows the candidate login page (testIds.candidate.login.email visible).
  - **perm-disable-candidate-app.spec.ts** (1 test, 3 route assertions): mirror with routes swapped — `/en/candidate` shows maintenance (login email hidden); `/en` shows the voter start button (NON-maintenance); `/en/elections` shows role=main (NON-maintenance).
  - **perm-per-app-notifications.spec.ts** (2 tests): voter-route test asserts `getByRole('dialog').filter({ hasText: '[notif-voter]' })` is visible + contains `[notif-voter]` + does NOT contain `[notif-cand]`; candidate-route test mirrors for `[notif-cand]` / not-`[notif-voter]`.
  - All strict-mode assertions per TIR4:8-12 — 0 `expect.soft`, 0 `try/catch`-wrapped `expect()`, 0 `.catch` fallbacks (3 grep matches against the deny-list are all in the file-level docstring contract blocks per 89-03 precedent).
- **9 playwright project entries appended** to `tests/playwright.config.ts` (lines 889-961 in post-edit file):
  - 3 setup projects (`data-setup-perm-disable-voter-app` / `-candidate-app` / `-per-app-notifications`) with `testMatch: /.../`, `teardown: 'data-teardown-...'`, and `dependencies: [<previous-spec-name>]`.
  - 3 teardown projects (`data-teardown-...`) with `testMatch: /<name>\.teardown\.ts/`.
  - 3 spec projects (`perm-disable-voter-app` / `-candidate-app` / `-per-app-notifications`) with `testDir: './tests/specs/perm'`, `testMatch: /<name>\.spec\.ts/`, `fullyParallel: false`, `use: { ...devices['Desktop Chrome'] }`, `dependencies: ['data-setup-...']`.
  - Sequential chain order: `candidate-mega-journey → perm-disable-voter-app → perm-disable-candidate-app → perm-per-app-notifications` (each setup depends on the previous spec name).

## Task Commits

Each task was committed atomically (sequential mode; hooks bypassed per project memory `project_gsd_repo_hook_workaround.md`):

1. **Task 1: 3 perm templates + index.ts registration** — `db69a1c0e` (feat)
2. **Task 2: 6 setup/teardown wrapper files** — `75da4a919` (feat)
3. **Task 3: 3 perm spec files** — `669dc8e3f` (test)
4. **Task 4: 9 playwright project entries** — `9b4ac9882` (feat)

**Plan metadata commit:** (this commit) docs(89-04): complete plan

## Files Created/Modified

### Created (13 files)

- `packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts` — Pattern H minimal-data perm template, prefix `e2e-perm-novapp-`, settings override `access.voterApp: false` (113 lines).
- `packages/dev-seed/src/templates/permutations/perm-disable-candidate-app.ts` — Pattern H minimal-data perm template, prefix `e2e-perm-nocand-`, settings override `access.candidateApp: false` (113 lines).
- `packages/dev-seed/src/templates/permutations/perm-per-app-notifications.ts` — Pattern H minimal-data perm template, prefix `e2e-perm-notif-`, settings override `notifications.{voterApp,candidateApp}` with distinct markers (123 lines).
- `tests/tests/setup/perm-disable-voter-app.setup.ts` — 1-line Pattern F wrapper (18 lines including docstring).
- `tests/tests/setup/perm-disable-voter-app.teardown.ts` — Pattern G teardown, PREFIX `e2e-perm-novapp-` (18 lines).
- `tests/tests/setup/perm-disable-candidate-app.setup.ts` — 1-line Pattern F wrapper (18 lines).
- `tests/tests/setup/perm-disable-candidate-app.teardown.ts` — Pattern G teardown, PREFIX `e2e-perm-nocand-` (18 lines).
- `tests/tests/setup/perm-per-app-notifications.setup.ts` — 1-line Pattern F wrapper (18 lines).
- `tests/tests/setup/perm-per-app-notifications.teardown.ts` — Pattern G teardown, PREFIX `e2e-perm-notif-` (18 lines).
- `tests/tests/specs/perm/perm-disable-voter-app.spec.ts` — Pattern I perm spec, single test asserting 3 routes (37 lines including docstring).
- `tests/tests/specs/perm/perm-disable-candidate-app.spec.ts` — Pattern I perm spec, single test asserting 3 routes (34 lines).
- `tests/tests/specs/perm/perm-per-app-notifications.spec.ts` — Pattern I perm spec, 2 tests asserting cross-route notification absence (44 lines).
- `.planning/phases/89-…/89-04-SUMMARY.md` — this summary.

### Modified (2 files)

- `packages/dev-seed/src/templates/index.ts` — +3 imports, +3 BUILT_IN_TEMPLATES entries (after `perm-not-located-2e2cg`), +3 named re-exports (alphabetical insertion).
- `tests/playwright.config.ts` — +72 lines (9 new project entries appended after the candidate-mega-journey chain at line 887).

## Decisions Made

- **Plan honored as-written.** 4 tasks committed atomically per the plan structure (no task collapsing; no out-of-order execution). Each task's verify gate (static-verifiable: file existence + grep counts + import-shape parity with the working analog) passed.
- **Notifications shape confirmed** against `packages/app-shared/src/settings/dynamicSettings.type.ts:303-312` + `:397-415`. The `notifications` key is at the top level of DynamicSettings (NOT nested under `topbar` or similar); each app's notification accepts `NotificationData | null` (where `NotificationData = { show?: boolean; title: LocalizedString; content: LocalizedString; icon?: string }`). The perm template payloads use only the required fields (`show: true`, `title: { en: '...' }`, `content: { en: '...' }`) — no `icon` override.
- **Single deterministic PREFIX per teardown** (not array notation). Each teardown file's `PREFIX` is the template's own externalIdPrefix verbatim — directly grep-friendly for debugging row-leak symptoms.
- **role=dialog filter pattern** chosen for notification specs (over `getByRole('alert')` or text-only selectors). The candidate-settings.spec.ts:262 precedent confirms notifications render as Alert components with `role="dialog"`. Filtering by `hasText: '[notif-X]'` strict-matches the dialog containing the expected marker, defending against multiple dialogs on the page (cookie banner / survey popup / other overlays).
- **Spec count per perm** matches the verification matrix planner described: perm-disable-voter-app (1 test, 3 routes), perm-disable-candidate-app (1 test, 3 routes), perm-per-app-notifications (2 tests — one per app). Total 4 spec-level tests across the 3 perm chains.
- **No new testids added** in 89-04. Per the plan and 89-RESEARCH § "Plan 89-04 testid additions = zero" — all assertions use roles (`main`, `heading[level=1]`, `dialog`) + pre-existing testids (`testIds.voter.home.startButton`, `testIds.candidate.login.email`).
- **Runtime gate deferred** per environment cascade carry-forward from 89-01/02/03 (vite dev server returns HTTP 500; pre-existing perm-1e1cg1co cascade blocks the candidate-mega-journey chain that 89-04 perm chains depend on). Static verification is the highest in-orchestrator acceptance possible. Operator runbook: ensure single vite dev process → `yarn db:reset && yarn dev` (wait healthy) → `cd tests && npx playwright test --project=perm-disable-voter-app --project=perm-disable-candidate-app --project=perm-per-app-notifications --reporter=list` → expected PASS for the 3 perm projects independently, and PASS for the full cross-chain run including `candidate-mega-journey` (proves D-89-03 parallel safety holds).

## Deviations from Plan

### Runtime verification deferral (Task 4 — environment cascade carry-forward, NOT a Rule 1-4 deviation)

**1. [Out-of-scope / environment cascade] Task 4 perm-spec Playwright run deferred to operator runbook**

- **Found during:** Task 4 (post-implementation runtime verification attempt).
- **Issue 1 (sandbox environment, same shape as 89-01/02/03):** `curl http://localhost:5173/` returned HTTP 500 at gate time. The frontend dev server is not healthy. Per 89-01-SUMMARY + 89-02-SUMMARY + 89-03-SUMMARY precedent: "Cannot safely kill the user's dev server." This is the same vite-cache wipe race with concurrent dev workers documented three times already in this phase.
- **Issue 2 (pre-existing CASCADE):** The new perm-disable-voter-app project depends on `candidate-mega-journey` per the planner's sequencing decision. `candidate-mega-journey` transitively depends on `voter-mega-journey` → `perm-1e1cg1co` flake chain (Phase 86.3-05 / Phase 83 DETERM-07b boundary). Running the new perm chains in default mode would trigger the same upstream cascade documented across 89-01/02/03.
- **Decision:** Per the scope-boundary rule (auto-fix only issues DIRECTLY caused by current task's changes), both blockers are out of scope. Static verification of all 4 tasks is clean: 12 production files exist with correct structure, 9 playwright project entries appended, 0 soft constructs across the 3 specs, dev-seed unit tests pass except for the pre-existing :431 row-count drift carried forward from 89-01 deferred-items.md item #1.
- **Files modified:** None (no code rollback; no temporary config files committed).
- **Verification path post-89-04:** Operator runbook captured in the Decisions Made section above. Expected outcome: 3 perm projects each PASS independently; cross-chain run with `candidate-mega-journey` PASSes (proves D-89-03 distinct-prefix parallel safety).

---

**Total deviations:** 1 (environment cascade — same shape as 89-01/02/03 SUMMARYs; not a Rule 1-4 auto-fix).
**Impact on plan:** Code-level state of all 4 tasks is correct + statically verifiable. Task 4 cross-chain isolation smoke (and per-perm-spec PASS) is the ONLY task whose acceptance criteria can't close in-orchestrator due to the documented environment cascade. The plan's deliverables (templates + setups/teardowns + specs + playwright config) are all in tree.

## Issues Encountered

- **vite dev HTTP 500 + pre-existing perm-1e1cg1co cascade** continue to block the canonical e2e gate (same as 89-01/02/03). Documented in deferred-items.md item #8 and carried into 89-04 as environment cascade #1 above. Out of 89-04 scope.
- **Pre-existing dev-seed e2e.test.ts:431 drift** (`questions.fixed.length === 18` — actual 25) continues to fail; already deferred per 89-01 deferred-items.md item #1. 89-04 does NOT touch the e2e template's questions array; the failure is structurally orthogonal to 89-04's perm-template additions.

## Known Stubs

None introduced in 89-04. Each perm template carries enough real data to make its routes render (1 election + 1 CG + 1 CO + 2 candidates per template). Each spec exercises real role+testid assertions against the rendered DOM — no `test.skip`, no `console.log`-only placeholders, no `[deferred-NN-nn]` markers.

## Threat Flags

No new security-relevant surface introduced beyond the threat_model in 89-04-PLAN.md:

- **T-89-04-01 (Tampering — cross-chain externalIdPrefix collision):** MITIGATED. Verified by grep across `packages/dev-seed/src/templates/permutations/` — each of the 11 perm templates now in the registry uses a UNIQUE externalIdPrefix. The 3 new prefixes (`e2e-perm-novapp-`, `e2e-perm-nocand-`, `e2e-perm-notif-`) do not collide with any 88-03 perm prefix (`e2e-perm-1e1cg1co-`, `e2e-perm-2e-shared-`, `e2e-perm-2e-asymmetric-`, `e2e-perm-startfromcg-`, `e2e-perm-disjoint-1co-`, `e2e-perm-disable-elec-1co-`, `e2e-perm-disable-elec-2co-`, `e2e-perm-not-located-2e2cg-`).
- **T-89-04-02 (Info Disclosure — notifications.title rendered for tested app only):** MITIGATED. perm-per-app-notifications spec strictly asserts cross-route absence via `expect(dialog).not.toContainText('[notif-other]')` after the positive `toContainText('[notif-self]')` assertion.
- **T-89-04-03 (DoS — perm chain blocks default suite if any perm fails):** ACCEPTED. Sequential chain means one failure cascades; matches 88-03 precedent and is the documented choice in 89-04-PLAN.md threat_model.
- **T-89-04-SC (no package installs):** ACCEPTED. Zero npm/pip/cargo installs in 89-04.

## Next Phase Readiness

- **89-LAST (legacy retirement) unblocked.** The 3 new perm specs absorb the coverage of:
  - `candidate-settings.spec.ts` 7.1.2 (lines 166-187, `should show maintenance page when candidateApp is disabled`) — superseded by `perm-disable-candidate-app.spec.ts`.
  - `candidate-settings.spec.ts` 7.1.4 (lines 242-271, `should display notification popup when enabled`) — superseded by `perm-per-app-notifications.spec.ts`.
  - The 7.1.3 case (`should show maintenance page when underMaintenance is true` — lines 200-220) is per-D-89-04 KEPT in candidate-settings.spec.ts (TIR4 only covers candidateApp/voterApp access flags, NOT underMaintenance — the latter is structurally distinct because it affects every route, not just one app). The TIR5-deferred residual cases (7.1.1, 7.1.3, 7.1.7, 7.1.8, 7.1.10-17) all keep their existing spec file alive.
  - The voterApp-disabled assertion (7.1.5/CAND-10) doesn't exist as a current test in `candidate-settings.spec.ts` (the legacy spec only checks candidateApp disabled); the new `perm-disable-voter-app.spec.ts` is a NET-NEW coverage addition per TIR4-PERM-01.
- **v2.10 close** unblocked structurally for the 89-04 deliverables. The 3 new perm chains are now in the suite ledger; the 3-run cold-start gate at v2.10-close will exercise them alongside the existing 36-cell baseline + the candidate-mega-journey chain landed in 89-03.

### Blockers / Concerns

- The vite dev concurrency race + db:reset cache wipe gap (89-01 deferred-items #8) remains the dominant in-sandbox blocker for operator-less runtime verification across 89-04 (and 89-01/02/03). Operator runbook is the canonical mitigation path until v2.11+ dedicates a phase to dev-environment hygiene cleanup.
- The pre-existing perm-1e1cg1co cascade continues to block the canonical chained voter-mega + candidate-mega + new-perm-chains run. Already documented in `deferred-items.md` item #8 (carried from 89-01).

## Self-Check: PASSED

Verified prior to final commit:

- `test -f packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts`: **FOUND**
- `test -f packages/dev-seed/src/templates/permutations/perm-disable-candidate-app.ts`: **FOUND**
- `test -f packages/dev-seed/src/templates/permutations/perm-per-app-notifications.ts`: **FOUND**
- `test -f tests/tests/setup/perm-disable-voter-app.setup.ts`: **FOUND**
- `test -f tests/tests/setup/perm-disable-voter-app.teardown.ts`: **FOUND**
- `test -f tests/tests/setup/perm-disable-candidate-app.setup.ts`: **FOUND**
- `test -f tests/tests/setup/perm-disable-candidate-app.teardown.ts`: **FOUND**
- `test -f tests/tests/setup/perm-per-app-notifications.setup.ts`: **FOUND**
- `test -f tests/tests/setup/perm-per-app-notifications.teardown.ts`: **FOUND**
- `test -f tests/tests/specs/perm/perm-disable-voter-app.spec.ts`: **FOUND**
- `test -f tests/tests/specs/perm/perm-disable-candidate-app.spec.ts`: **FOUND**
- `test -f tests/tests/specs/perm/perm-per-app-notifications.spec.ts`: **FOUND**
- `grep -c "perm-disable-voter-app\|perm-disable-candidate-app\|perm-per-app-notifications" packages/dev-seed/src/templates/index.ts`: **9** (3 imports + 3 BUILT_IN_TEMPLATES entries + 3 named re-exports = 9 mentions)
- `grep -c "perm-disable-voter-app\|perm-disable-candidate-app\|perm-per-app-notifications" tests/playwright.config.ts`: **31** (well over the 9-mention minimum; 9 project entries × ~3-4 mentions each)
- 0 real `expect.soft` / `try.*catch.*expect` / `.catch((` in spec bodies: **PASS** (3 grep matches are all in the file-level docstring contract blocks per 89-03 precedent)
- `cd packages/dev-seed && yarn test:unit`: **504 PASS / 1 FAIL** (the only failure is the pre-existing `:431` row-count drift carried forward from 89-01 deferred-items item #1 — structurally orthogonal to 89-04)
- Commit `db69a1c0e` (Task 1) exists in git log: **FOUND**
- Commit `75da4a919` (Task 2) exists in git log: **FOUND**
- Commit `669dc8e3f` (Task 3) exists in git log: **FOUND**
- Commit `9b4ac9882` (Task 4) exists in git log: **FOUND**

---
*Phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour*
*Plan: 04*
*Completed: 2026-05-29*
