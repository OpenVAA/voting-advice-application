---
phase: 59-e2e-fixture-migration
plan: 04
subsystem: tests/
tags: [e2e, fixture-migration, core-swap, dev-seed]
requirements: [E2E-01]
dependency_graph:
  requires:
    - "@openvaa/dev-seed (BUILT_IN_TEMPLATES.e2e + runPipeline + runTeardown + Writer + fanOutLocales)"
    - "tests/tests/utils/e2eFixtureRefs.ts (Plan 02)"
    - "tests/tests/utils/testCredentials.ts (Plan 02)"
    - "tests/tests/utils/supabaseAdminClient.ts (D-24 subclass, Phase 56 Plan 10)"
    - "tests/tests/setup/templates/variant-{constituency,multi-election,startfromcg}.ts (Plan 03)"
  provides:
    - "tests/seed-test-data.ts (D-59-05 thin wrapper)"
    - "tests/tests/setup/data.setup.ts (pipeline + writer + auth)"
    - "tests/tests/setup/data.teardown.ts (runTeardown delegation)"
    - "tests/tests/setup/variant-*.setup.ts (3 files — filesystem template loaders)"
    - "tests/tests/setup/variant-data.teardown.ts (runTeardown delegation)"
  affects:
    - "Plan 05 — runs post-swap Playwright E2E against the new seed path; the parity gate (D-59-04) compares the resulting report against the Plan 01 baseline"
    - "Plan 06 — once Plan 05 proves parity, deletes the 3 JSON fixtures + 3 overlay JSONs + tests/tests/utils/mergeDatasets.ts (no importers remain)"
tech_stack:
  added: []
  patterns:
    - "Playwright setup/teardown using @openvaa/dev-seed programmatic API (BUILT_IN_TEMPLATES.e2e + runPipeline + Writer + runTeardown)"
    - "Pre-clear via runTeardown(PREFIX, client) before seeding — idempotent re-runs"
    - "Static default-import of filesystem variant templates from ./templates/variant-*.ts"
key_files:
  created: []
  modified:
    - tests/seed-test-data.ts
    - tests/tests/setup/data.setup.ts
    - tests/tests/setup/data.teardown.ts
    - tests/tests/setup/variant-constituency.setup.ts
    - tests/tests/setup/variant-multi-election.setup.ts
    - tests/tests/setup/variant-startfromcg.setup.ts
    - tests/tests/setup/variant-data.teardown.ts
decisions:
  - "Per-task atomic commits (4 × feat(59-04)) instead of plan's Task-5 bundled commit — continues Plan 59-02 / 59-03 precedent and matches executor task_commit_protocol. Task 5's gates (yarn build + grep) were executed as verification, not as a separate commit."
  - "Legacy updateAppSettings(...) calls preserved in all 4 setup files (data.setup.ts + 3 variant setups). The Phase 58 e2e template ships NO app_settings.fixed[] block, so the writer's Pass-5 merge_jsonb_column step is a no-op. Dropping the legacy calls would regress popup suppression, category-intro defaults, and hideIfMissingAnswers — failing the Plan 05 parity gate by design. Rule 2 auto-fix (Missing critical functionality). Follow-up: extend e2e template with an app_settings fixture block; then delete the four blocks of legacy settings calls."
  - "forceRegister signature is Promise<void> (throws on any failure path). Replaced the plan's draft `expect(result).toBeTruthy()` post-condition with `expect(true).toBe(true)` — reaching the assertion line means all four internal steps succeeded (createUser + candidate lookup + insert user_role + link auth user); errors are thrown, not returned."
  - "Static default-import of variant templates (pattern (a) from PATTERNS.md §variant-*.setup.ts) rather than dynamic resolveTemplate. Variant templates export `default` + named; `import variantConstituencyTemplate from './templates/variant-constituency'` resolves at Playwright-runner load time with zero path-string brittleness."
  - "PREFIX 'test-' is the single literal at every call site (5 runTeardown + 0 Writer override — Writer.write receives the template's externalIdPrefix directly, which is '' for e2e and satisfies Pitfall 5 only because the emitted rows already carry 'test-' verbatim from fixed[].external_id). Reconciliation matches 59-CONTEXT.md D-59-06 option 3: accept the 2-char minimum means teardown prefix is 'test-'."
metrics:
  duration_seconds: 245
  duration_human: "4m 5s"
  tasks_completed: 5
  task_5_note: "Plan's Task 5 (bundle commit) superseded by per-task atomic commits on Tasks 1-4. Task 5's verification gates (yarn build exit 0, repo-wide JSON grep = 0 code matches, mergeDatasets only in its own file + Plan 03 docstrings) were executed and passed."
  files_created: 0
  files_modified: 7
  commits:
    - 7b2c9083d  # Task 1: seed-test-data.ts rewrite
    - 7143f08ff  # Task 2: data.setup.ts swap
    - 58d86fa7f  # Task 3: data.teardown.ts swap
    - 9c9e6363f  # Task 4: 3 variant setups + variant teardown swap
  completed_date: 2026-04-23
---

# Phase 59 Plan 04: Core Swap — tests/ onto @openvaa/dev-seed Summary

The core swap commit of the D-59-08 sequence. Every Playwright setup / teardown file + the standalone manual-dev `seed-test-data.ts` now calls `@openvaa/dev-seed`'s programmatic API (BUILT_IN_TEMPLATES + runPipeline + Writer + runTeardown). Zero JSON fixture imports remain in any setup / teardown / seed-entry file; the only surviving references are docstring mentions in `tests/tests/utils/mergeDatasets.ts` (Plan 06 deletes that file) and docstrings in the Plan-03 variant templates.

## Line-count compression

| File | Before | After | Δ |
|------|-------:|------:|---:|
| `tests/seed-test-data.ts` | 88 | 37 | −51 (−58%) |
| `tests/tests/setup/data.setup.ts` | 88 | 84 | −4 (−5%) |
| `tests/tests/setup/data.teardown.ts` | 32 | 28 | −4 (−13%) |
| `tests/tests/setup/variant-constituency.setup.ts` | 56 | 57 | +1 |
| `tests/tests/setup/variant-multi-election.setup.ts` | 61 | 63 | +2 |
| `tests/tests/setup/variant-startfromcg.setup.ts` | 62 | 60 | −2 |
| `tests/tests/setup/variant-data.teardown.ts` | 34 | 23 | −11 (−32%) |
| **Total** | **421** | **352** | **−69 (−16%)** |

`data.setup.ts` shrank only slightly because the preserved 20-line `updateAppSettings` call compensates for the eliminated bulkDelete + per-fixture bulkImport chain. Same reason for the variant setups (the legacy app-settings block is ~14 lines). Once the e2e template carries an app_settings block (follow-up), the four setup files drop another ~60 lines combined.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical functionality] Preserved legacy `updateAppSettings` calls in all 4 setup files**
- **Found during:** Task 2 reading of `packages/dev-seed/src/templates/e2e.ts`
- **Issue:** `grep -n app_settings packages/dev-seed/src/templates/e2e.ts` returned `NO_APP_SETTINGS_IN_E2E`. The e2e template has NO `app_settings.fixed[]` block. Dropping the legacy `updateAppSettings(...)` call would leave the database at schema-default settings (category intros visible, questionsIntro showing category selection, notifications popup visible, hideIfMissingAnswers = true). Every voter spec that drives the happy path through `Home → Intro → Questions → Results` without handling a category-selection page or a popup dialog would cascade-fail. Parity gate (Plan 05) would fail by design.
- **Fix:** Kept the 4 legacy `updateAppSettings(...)` blocks in place (data.setup.ts + 3 variant setups) with inline comments referencing this decision. Each variant preserves its own variant-specific extras (multi-election preserves `results.showFeedbackPopup: 0 + showSurveyPopup: 0`).
- **Files modified:** `data.setup.ts`, `variant-constituency.setup.ts`, `variant-multi-election.setup.ts`, `variant-startfromcg.setup.ts`
- **Commits:** `7143f08ff`, `9c9e6363f`
- **Follow-up:** extend `packages/dev-seed/src/templates/e2e.ts` with an `app_settings.fixed[]` block carrying the exact shape used in the 4 setup files; then the setup files drop the 4 legacy blocks (~60 lines total). Tracked for Phase 59 Plan 05 or a follow-up phase — NOT blocking Plan 05's parity gate because the current code path produces identical settings to the pre-swap state.

**2. [Rule 1 — Bug] forceRegister return type mismatch vs plan draft**
- **Found during:** Task 2 reading of `tests/tests/utils/supabaseAdminClient.ts:284-321`
- **Issue:** Plan text suggests `const result = await client.forceRegister(...); expect(result, ...).toBeTruthy()`. Actual signature: `forceRegister(...): Promise<void>` — the function throws on every internal failure path (createUser, candidate lookup, user_roles insert, auth_user_id update), does NOT return a value. `expect(undefined).toBeTruthy()` would fail.
- **Fix:** Removed the result assignment; added `expect(true).toBe(true)` as the post-condition marker. Reaching the line proves all 4 internal steps succeeded (errors are thrown, not returned).
- **Files modified:** `data.setup.ts`
- **Commit:** `7143f08ff`

## app_settings gap (surfaced per plan Task 2 directive)

**Gap:** `packages/dev-seed/src/templates/e2e.ts` has no `app_settings.fixed[]` block, so the Writer's Pass-5 `merge_jsonb_column` step is a silent no-op when fed the e2e template. The legacy Playwright specs depend on specific settings overrides (see §Deviations Rule 2).

**Not a blocker for Plan 05:** the legacy `updateAppSettings(...)` calls are preserved verbatim, so Plan 05's post-swap run produces identical app_settings state to the baseline. Plan 05 parity gate will not see a settings-related delta.

**Recommended follow-up (not in scope for Plan 04):**
```ts
// Add to packages/dev-seed/src/templates/e2e.ts under the template object:
app_settings: {
  count: 0,
  fixed: [
    {
      external_id: 'test-e2e-settings',  // any literal; writer uses `settings` column only
      settings: {
        questions: { /* ... */ },
        results: { /* ... */ },
        entities: { /* ... */ },
        notifications: { voterApp: { show: false } },
        analytics: { trackEvents: false }
      }
    }
  ]
}
```
After that lands, delete the 4 `updateAppSettings(...)` blocks in `data.setup.ts` + 3 variant setups.

## Plan's Task 5 bundle commit → replaced by per-task commits

Per the Plan 59-02 / Plan 59-03 precedent encoded in STATE.md, GSD executor's `task_commit_protocol` trumps the plan's bundled commit. Tasks 1-4 produced 4 atomic `feat(59-04): ...` commits. Task 5's gates were executed as verification:

| Gate | Expected | Actual | Pass |
|------|----------|--------|------|
| Repo-wide code grep: 6 fixture JSON filenames in `.ts`/`.js` (excluding .planning / .svelte-kit / node_modules) | 0 | 0 in imports; 2 docstring-only hits in `tests/tests/utils/mergeDatasets.ts` (scheduled for Plan 06 deletion) | ✅ |
| `mergeDatasets` importers | 0 | 0 — 4 hits total: 3 docstring mentions in Plan-03 variant templates + 1 self-definition in `mergeDatasets.ts:27` | ✅ |
| `yarn build` exit code | 0 | 0 | ✅ |
| `yarn playwright test --list` | enumerates all specs with zero import errors | `Total: 89 tests in 25 files` (matches Plan 01 baseline total 89) | ✅ |
| D-59-09 JSON grep in 7 target files | 0 | 0 | ✅ |

## Commit sequence (Phase 59 ledger)

```
7b2c9083d  feat(59-04): rewrite seed-test-data.ts as D-59-05 thin wrapper
7143f08ff  feat(59-04): swap data.setup.ts onto @openvaa/dev-seed pipeline
58d86fa7f  feat(59-04): swap data.teardown.ts onto runTeardown('test-', client)
9c9e6363f  feat(59-04): swap 3 variant setups + variant teardown onto dev-seed API
```

This is commit 2 of the D-59-08 4-commit sequence:
1. Plan 01: baseline (done — `f09daea34`)
2. **Plan 04: CORE SWAP (done — this plan, 4 atomic commits)**
3. Plan 05: post-swap verify + parity gate (next)
4. Plan 06: delete legacy fixtures + mergeDatasets.ts (pending Plan 05 green)

## Verification

All 5 tasks complete. Grep gates + build gate + playwright list gate pass. Typecheck by proxy (yarn build includes tsc via each workspace's build script; frontend SvelteKit build succeeded; `tests/` itself has no tsconfig but is referenced by `.svelte-kit/tsconfig.json` indirectly — the fact that playwright test --list succeeds confirms all imports resolve).

Plan 05 can now run the post-swap Playwright baseline and compare against `.planning/phases/59-e2e-fixture-migration/baseline/playwright-report.json` using the parity script at `scripts/diff-playwright-reports.ts`.

## Self-Check: PASSED

- Files modified exist at their paths: ✅ all 7 verified via `wc -l` (final line counts in compression table above).
- Commits exist: ✅
  - `git log --oneline | grep 7b2c9083d` → found
  - `git log --oneline | grep 7143f08ff` → found
  - `git log --oneline | grep 58d86fa7f` → found
  - `git log --oneline | grep 9c9e6363f` → found
- D-59-09 grep gate: ✅ zero fixture JSON references in target files.
- `yarn build`: ✅ exit 0 (captured in verification table).
- `yarn playwright test --list`: ✅ 89 tests enumerated with zero import errors.
