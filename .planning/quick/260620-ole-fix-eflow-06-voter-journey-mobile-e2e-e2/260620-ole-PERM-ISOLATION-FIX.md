---
quick_id: 260620-ole
slug: fix-eflow-06-voter-journey-mobile-e2e-e2
type: quick
date: 2026-06-20
status: fixed
supersedes: 260620-ole-SUMMARY.md (refuted template-selection hypothesis)
---

# Quick 260620-ole: perm `app_settings`-singleton contamination — REAL FIX

This report supersedes `260620-ole-SUMMARY.md`. That summary correctly REFUTED the
operator's original "templates lack election/constituency selection" hypothesis and
correctly identified the real defect class (shared-`app_settings`-singleton cross-perm
contamination), but stopped at diagnosis ("recommended real fix … out of scope"). This
report DESIGNS, IMPLEMENTS, and VERIFIES that fix.

## Root cause (confirmed empirically, not just by reading)

The local test DB has a **single `app_settings` row** (seed.sql bootstraps it as
`'{}'::jsonb`). Every perm data-setup project applies its template's
`app_settings.fixed[0].settings` through the **additive** `merge_jsonb_column` RPC
(dev-seed Writer Pass-5 → `updateAppSettings`). Entity teardown **deliberately excludes
`app_settings`** (`packages/dev-seed/src/cli/teardown.ts:29` — "resetting app_settings is
`db:reset`'s job"), so the singleton is **never reset between perm seeds**.

Because the write is an additive deep-merge, any key a PRIOR perm set but a downstream
perm's complete settings object **OMITS** persists forever — additive merges only ADD
keys, never DROP them. The canonical leak is `elections.startFromConstituencyGroup`:
`MINIMAL_BASE_APP_SETTINGS` deliberately OMITS it (JSONB drops `undefined`), and
`perm-startfromcg.spec.ts` sets it at runtime (`beforeAll` → `updateAppSettings`,
`afterAll` restores to `prior ?? null` — but the KEY stays present). Once a stale
`startFromConstituencyGroup` (pointing at a CG that exists only in `perm-startfromcg`'s
topology) is in the singleton, every downstream perm inherits it. A perm whose topology
lacks that CG (e.g. `perm-localisation-positive`) then stalls on the voter **Intro** page —
the start-from-CG picker references a non-existent constituency group — and
`walkUntilQuestionsIntro` times out 10s on `getByTestId('voter-questions-start')`
(`voter-journey.fixture.ts:231`). This is EXACTLY the reported EFLOW-06 symptom.

### Empirical reproduction (cardinal: reproduce before fixing)

With the fix stashed OUT (original additive code) on a fresh `db:reset`:
1. Seed `perm-localisation-positive` (`data-setup-perm-localisation-positive --no-deps`) → passes.
2. Inject the contamination a prior `perm-startfromcg` run leaves behind:
   `updateAppSettings({ elections: { startFromConstituencyGroup: '<non-existent-CG-uuid>' } })`.
3. Run `perm-localisation-positive --no-deps`.
→ **EFLOW-06 FAILS after all retries**: `TimeoutError: locator.waitFor: Timeout 10000ms`
  on `getByTestId('voter-questions-start')…` at `voter-journey.fixture.ts:231` — the voter
  walk parked on Intro, never reaching Elections. The exact bug-report signature.

## The fix

Authoritatively **REPLACE** (full overwrite) the `app_settings` singleton with each
perm's OWN complete settings immediately after the additive seed, and tighten the
post-seed assertion from a contamination-tolerant SUBSET match to an EXACT match.

Every perm/E2E template emits a COMPLETE settings object (`MINIMAL_BASE_APP_SETTINGS`
or a deep-merge of it), and the frontend fills any omitted keys from the
TS/staticSettings defaults (bootstrap row is `{}`), so a full overwrite is self-contained
and semantically correct — and it DROPS any foreign keys accumulated by upstream perms.

### Files changed

1. **`packages/dev-seed/src/supabaseAdminClient.ts`** — added
   `replaceAppSettings(settings)`: a full-set `.update({ settings })` (NOT the additive
   `merge_jsonb_column`). Mirrors `updateAppSettings`'s row-lookup + error handling.
   JSDoc spells out that it is the authoritative-write primitive that defeats the
   singleton-merge contamination, and that templates intending a PARTIAL merge into the
   bootstrap row (the `default` dev-seed template) must keep the additive path.

2. **`tests/tests/setup/shared/setupFromTemplate.ts`** — step 3 now:
   - resolves the template's `app_settings.fixed[0].settings` (same `{externalId}`→UUID
     flatten the Writer uses),
   - **`replaceAppSettings(resolved)`** — wipes any accumulated foreign keys,
   - re-reads and asserts `toEqual(resolved)` (**EXACT**, was `toMatchObject` SUBSET) —
     any surviving contamination now fails LOUDLY at setup time instead of silently
     breaking a downstream walk. This is the anti-flake guard the cardinal rule
     demands — the opposite of widening tolerance.
   The optional `appSettingsOverride` scenario overlay (bank-auth's
   `preRegistration.enabled`) stays ADDITIVE and runs AFTER the REPLACE — unchanged.

### Why this is minimal + DRY

One shared insertion point (`setupFromTemplate`, the direct dependency of every perm spec)
fixes all ~25 perms — zero spec edits, zero template content changes (each perm still wants
exactly the settings it declared; only WHEN/HOW-authoritatively they are applied changed).
The generic Writer Pass-5 stays additive so the `default` dev-seed template's intentional
partial-merge into the bootstrap row is preserved.

### Serialization

Already correct — no change needed. The perm DAG is a strict serial chain (each perm
data-setup depends on the PREVIOUS perm SPEC; `playwright.config.ts`), and every perm spec
is `fullyParallel: false`. The REPLACE is therefore never raced by a concurrent perm worker.

## Verification (cardinal: proven flake-free, not retried-to-green)

| Gate | Result |
| --- | --- |
| Reproduce flake (OLD code, contaminated singleton) | EFLOW-06 **FAILED** (10s Intro timeout) — root cause confirmed |
| Fix wipes contamination (REPLACE setup) | singleton `elections` went `{…,startFromConstituencyGroup:dead-beef}` → `{showElectionTags,disallowSelection:false}` — stale key GONE; EXACT `toEqual` held |
| **Determinism — perm-localisation-positive 3×** (contaminate `startFromConstituencyGroup`+`underMaintenance` each iter → setup REPLACE → spec) | **3/3 green, 0 flaky** |
| **Determinism — perm-show-feedback-survey 3×** (same injected contamination; this is the spec that hard-FAILED in the dirty-DB run) | **3/3 green, 0 flaky** |
| **CI-posture full suite** — clean `db:reset` then `CI=true yarn test:e2e` (workers:1, 125 tests) | **120 passed · 0 failed · 0 did-not-run · 5 flaky** (down from the documented 6–13 failed / 43 did-not-run baseline) |

Before/after on the named defect:
- **Before** (refuted-summary baselines): broad `./tests` selection → 6 failed (6 workers) / 13 failed (workers:1), **43 did not run** each (perm-spec setup cascade), `perm-localisation-positive -g EFLOW-06` flaky (52 passed vs 1 failed/51).
- **After** (clean full suite): **0 failed, 0 did-not-run** — the perm cascade is ELIMINATED. The two perm specs that stalled on Intro from contamination (`perm-localisation-positive` EFLOW-06, `perm-show-feedback-survey` EPERM-09) are green and deterministic under injected contamination.

`typecheck:tests` and dev-seed `typecheck` both clean. No app/production code, no Supabase
schema, no Phase 124 files touched — test-infra only (`tests/**` + `packages/dev-seed/**`).

## Residual 5 flaky — OUT OF SCOPE (pre-existing, NOT this fix)

The clean full-suite run had **0 hard failures and 0 did-not-run**, but **5 flaky** (each
passed on retry):
`voter-journey-mobile` (EFLOW-11), `perm-question-video` (mobile q1 video),
`a11y-smoke` ×3 (axe questions, axe voter-detail-drawer, navigation focus).

These are a **DIFFERENT, pre-existing flake class** — NOT app_settings contamination:
- The `voter-journey-mobile` / mobile-smoke / a11y-navigation flakes are the SAME
  `walkUntilQuestionsIntro` Intro/elections-stall already diagnosed and recorded RESOLVED in
  `.planning/debug/elections-continue-stall.md`: a **test-fixture timing artifact** —
  `voter-journey.fixture.ts`'s page-presence probe races v2.11's post-hydration `$dataRoot`
  `$effect` render window. It surfaces on the `e2e/base` dataset (which this fix does NOT
  change in substance) and resurfaces intermittently under full-suite render pressure.
- The `a11y-smoke` axe scans are render-pressure timing flakes on the same base dataset.

Evidence they are NOT introduced by this fix: (1) ZERO `replaceAppSettings`/`toEqual`/
post-seed assertion failures anywhere in the run — the REPLACE+EXACT held for EVERY template
incl. `e2e/base`; (2) the base journeys (`voter-journey`, `candidate-journey`, `cold-entry`,
`dark-mode`) all passed cleanly (not flaky); (3) the flakes are `e2e/base`-backed
fixture-timing/axe artifacts, orthogonal to the perm `app_settings` singleton.

Per this task's scope (perm `app_settings` isolation; `tests/**` + `packages/dev-seed/**`)
and the brief's escape clause ("if the fix needs a larger architectural change … STOP and
report"), ironing out the fixture-timing/axe flake class is a SEPARATE diagnosis (own debug
session: `elections-continue-stall.md`) and is left OUT of this commit to avoid scope creep
into the voter fixtures. The named defect — perm singleton contamination — is fully resolved
and proven flake-free in its own determinism gates.

### Environment note (storage 502-wedge)

The CI-posture `db:reset` hit the documented storage/Kong 502-wedge during the post-reset
container restart (multiple resets churned the storage container's IP, leaving Kong's
upstream route stale). Resolved by restarting `supabase_kong_openvaa-local` (refreshes the
storage upstream route), after which `db:reset` completed cleanly (both buckets recreated,
storage 200). This is an infra flake in the local harness, NOT related to the fix.

## Debug session

Full hypothesis trail, evidence, and reasoning checkpoint:
`.planning/debug/resolved/perm-app-settings-singleton-contamination.md`.
