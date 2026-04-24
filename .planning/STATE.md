---
gsd_state_version: 1.0
milestone: v2.5
milestone_name: milestone
status: executing
stopped_at: "Plan 59-05 complete — PARITY GATE: FAIL; Plan 06 BLOCKED per D-59-12 fix-forward"
last_updated: "2026-04-24T05:42:57.983Z"
last_activity: 2026-04-24 -- Phase 59 Plan 05 (post-swap parity) complete — PARITY GATE: FAIL (22 regressions, D-59-12 fix-forward activated); Plan 06 BLOCKED
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 34
  completed_plans: 32
  percent: 94
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-22)

**Core value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Current focus:** Phase --phase — 59

## Current Position

Phase: 59 (e2e-fixture-migration) — PAUSED (PARITY FAIL, D-59-12 fix-forward in progress)
Plan: 5/7 complete (59-05 POST-SWAP PARITY — FAIL, 22 regressions documented in post-swap/diff.md)
Status: Phase 59 paused per D-59-12 — Plan 06 (fixture deletion) BLOCKED until parity flips to PASS. Fix-forward partial: Fix #2 (CAND-12 comment field on test-question-1..8 via custom_data.allowOpen, commit 341e4ab0d) + Fix #3 (baseline summary snake_case rename, commit b15429c54) LANDED and expected to collapse 19 of 22 regressions. Fix #1 (externalIdPrefix: 'test-' + cross-file convention refactor) BLOCKED — documented in .planning/phases/59-e2e-fixture-migration/fix-forward.md as Rule-4 architectural decision (touches 8+ files across dev-seed package tests + tests/ variant templates + e2eFixtureRefs + 2+ spec files; static analysis also contradicts the triage hypothesis about synthetic rows). Residual expected regressions post-re-run: 2 teardowns (rowsDeleted=0 assertion) awaiting Fix #1 path decision.
Last activity: 2026-04-24 -- Phase 59 Fix-Forward partial (Fix #2 + Fix #3 committed; Fix #1 blocked per fix-forward.md)

## Performance Metrics

**Cumulative:**

- Milestones shipped: 9 (v1.0, v1.1, v1.2, v1.3, v1.4, v2.0, v2.1, v2.3, v2.4) + 1 paused (v2.2)
- Total plans completed: 172 + 6 tasks
- Timeline: 28 days (2026-03-01 to 2026-03-28)

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key context for v2.5:

- `@openvaa/dev-tools` workspace already exists (added post-v2.4); the seeder extends it rather than starting a new package.
- Scope boundary: non-system public tables only (accounts, projects, elections, constituency_groups, constituencies, constituency_group_constituencies, election_constituency_groups, organizations, candidates, factions, alliances, question_categories, questions, nominations, app_settings, feedback). Skips admin_jobs, user_roles, storage_config, private.feedback_rate_limits.
- `apps/supabase/supabase/seed.sql` bootstrap (default account + project) stays as-is — the generator layers on top.
- Template model is unified (no binary curated/synthetic split); smart defaults fill unspecified fields; hand-authored rows mix with synthetic rows per collection.
- Localization: flat `generateTranslationsForAllLocales: boolean` setting; honors `staticSettings.supportedLocales` (en/fi/sv/da).
- Primary CLI: `yarn workspace @openvaa/dev-tools seed --template <name-or-path>`; root shortcut `yarn dev:reset-with-data`; teardown `seed:teardown` uses `external_id` prefix for targeted deletion.
- `tests/seed-test-data.ts` rewritten to invoke the new generator; legacy JSON fixtures (`default-dataset.json`, `voter-dataset.json`, `candidate-addendum.json`) retired once E2E verified green.
- Matching realism: synthetic candidate positions clustered along party ideological axes (not uniform random) so matching results are visually coherent during dev testing.
- `@faker-js/faker` already in the Yarn catalog; `SupabaseAdminClient` helper already exists in `tests/tests/utils/`; leverage both rather than rebuild.
- Research skipped: milestone is codebase-internal (schema + data model fully knowable from the repo).
- Phase numbering continues from v2.4 (last phase: 55); v2.5 spans Phases 56-59.
- Phase shape: 56 = foundations/plumbing, 57 = latent-factor answer model (algorithmic slice), 58 = templates/CLI/default dataset (user-facing surface), 59 = E2E fixture migration (parity checkpoint before JSON-fixture deletion).
- Plan 56-01: @openvaa/dev-seed scaffolded as tsx-only private workspace (D-28). Follows apps/frontend precedent for supabase-types import (no TS project reference). Uses vitest --passWithNoTests for empty-src baseline.
- 56-02: SupabaseAdminClient base split into @openvaa/dev-seed per D-24; client/projectId made protected for tests/ subclass reuse
- Plan 56-03: Faker seeded per-instance via .seed() on fresh Faker() instance (not module-level); plan's  is not a valid @faker-js/faker v10 API.
- Plan 56-03: defaultRandomValidEmit uses function declaration (not const-arrow) to satisfy func-style:declaration eslint rule; seam contract preserved via explicit AnswerEmitter-typed assertion.
- Plan 56-03: Template schema stays declarative (no .default()); defaults live in per-generator defaults(ctx) per D-08 so Phase 57/58 .extend() does not fight per-field defaults.
- Plan 56-03: Shared types barrel (types.ts) re-exports only — Ctx/AnswerEmitter/Template stay in their canonical modules to avoid circular-import hazards while still giving consumers one import path.
- Plan 56-04: Foundation generators use canonical D-04/D-08/D-26 pattern — class with ctor capturing ctx, defaults(ctx) per-call, generate(fragment) returning TablesInsert rows; sentinel enrichment (_constituencyGroups, _constituencies) is explicitly DEFERRED to Plan 07's post-topo pass so generators stay sentinel-free for clean unit tests.
- Plan 56-04: AccountsGenerator + ProjectsGenerator are explicit pass-through per D-11 (return [] + ctx.logger warn on non-empty fragment). The pattern — class with ctor/defaults/generate — is preserved so Plan 07's pipeline class map can uniformly instantiate without a special branch for bootstrap-only tables.
- Plan 56-04: ESLint no-unused-vars does not honor ^_ prefix by default; used eslint-disable-next-line comments on each defaults(ctx) method (matches packages/core/src/controller/controller.ts:72 codebase convention). The ctx param stays on the signature to preserve the D-08 contract for Phase 57/58 generators that read ctx.
- Plan 56-05: QuestionsGenerator uses JSONB `name` column (migration line 608, not `text` as plan example showed); QuestionRow relaxes both `category_id` AND `type` from TablesInsert because Fragment<T>.fixed[] is Partial<T>
- Plan 56-05: CandidatesGenerator ships the D-27 seam (`ctx.answerEmitter ?? defaultRandomValidEmit`) with candidateForEmit narrowing so Phase 57's latent emitter drops in without touching this file
- Plan 56-05: AppSettingsGenerator clamps count to <=1 and flags for Plan 07 writer to route through updateAppSettings (merge_jsonb_column) rather than bulk_import — avoids UNIQUE(project_id) conflict with seed.sql bootstrap row
- Plan 56-05: FeedbackGenerator is minimal stub per Claude's Discretion; fixed[] discards Fragment.external_id (feedback table has no external_id column)
- Plan 56-06: NominationRow uses Omit<TablesInsert<'nominations'>, 'election_id'|'constituency_id'> — same ref-sentinel relaxation pattern as QuestionsGenerator's category_id (Plan 05)
- Plan 56-06: Dropped legacy tests/ 'emit both candidate+organization, strip one' workaround per RESEARCH §9 — dev-seed emits only authoritative ref since party-candidate relationship is already in candidates.organization_id
- Plan 56-06: GEN-08 assertRefsPopulated collects ALL missing ref categories into one throw (not short-circuit) for better multi-entity misconfiguration UX
- Plan 56-06: Phase 56 generator path produces candidate-type nominations ONLY (wired to refs.elections[0] × refs.constituencies[0]); polymorphism variants via fixed[] pass-through; Phase 58 extends via nominations override hook
- 56-08: D-22 boundary enforced via import shape (no createClient/rpc); makeCtx shared factory with overrides-last pattern avoids per-scenario factories; CandidatesGenerator D-27 seam tested both default and injected emitter paths (Phase 57 drop-in contract)
- Plan 56-09: Template schema projectId validator uses UUID-shape regex not zod v4 .uuid() — strict RFC 4122 v1-v8 rejects documented TEST_PROJECT_ID default
- Plan 56-09: Writer tests use vi.mock (greenfield in this monorepo) to isolate SupabaseAdminClient — mock factory tracks instances via __getLastInstance for per-test inspection
- Plan 56-09: ISS-05 GEN-08 end-to-end nomination integration test placed in pipeline.test.ts — only runtime proof Phase 56 Success Criterion 5 wires correctly (default {} template emits 0 nominations)
- Plan 56-10: tests/ admin client is a subclass of @openvaa/dev-seed base (D-24 complete); dev-seed package.json needed main/types/exports pointing at src/index.ts so Node ESM resolver finds entry from other workspaces (playwright/tsx)
- Plan 59-01: Pre-swap Playwright baseline captured at SHA f09daea3498fef8fa62c430a6cd5a19535af8e5c — ACTUAL split is 41 pass / 10 data-race / 25 cascade / 13 test.skip (89 total), not CONTEXT.md's 15/19/55. Total count matches (v2.4 tally folded test.skip into cascade); distribution improved since v2.4 stabilization work. Plan 05's parity gate MUST use actual test names from baseline/summary.md, not CONTEXT.md counts.
- Plan 59-01: Dropped `list` reporter from D-59-03's `--reporter=json,list` — both write stdout and corrupt the JSON. Only `--reporter=json` is load-bearing for the parity contract.
- Plan 59-01: Added DOTENV_CONFIG_QUIET=true env var to suppress dotenv@17.3.1's `[dotenv] injecting env` banner that polluted stdout. Not in D-59-03 literally, permitted under §Claude's Discretion.
- Plan 59-01: `yarn playwright install chromium` was a one-time Rule 3 prerequisite fix — browsers weren't installed on this machine. Not a code change; future machines may need the same.
- Plan 59-02: tests/ has no tsconfig.json — frontend's generated .svelte-kit/tsconfig.json `include`s ../tests/**/*.ts for type-checking. Plan-text `cd tests && yarn tsc` assumption wrong; `yarn build` + `yarn playwright test --list` + eslint + tsx smoke-tests were substitute gates.
- Plan 59-02: snake_case migration extended beyond .externalId (plan-explicit) to .firstName/.lastName/.termsOfUseAccepted — the TemplateCandidate type matches TablesInsert<'candidates'> snake_case, so all accesses migrate in lockstep. Leaving camelCase would have caused TS errors after the JSON typing disappears.
- Plan 59-02: e2eFixtureRefs.ts asserts E2E_CANDIDATES[0].external_id === 'test-candidate-alpha' at import time — template drift surfaces loudly on first test load, not silently via wrong TEST_CANDIDATE_EMAIL (T-59-02-01 mitigation).
- Plan 59-02: TemplateCandidate declared locally rather than importing TablesInsert<'candidates'> — template carries email / answersByExternalId / organization-sentinel handoff fields that are NOT on the candidates table.
- Plan 59-02: Per-task atomic commits (3 × feat(59-02) commits for Tasks 1/2/3) instead of the plan's Task-4 bundle commit — matches the GSD executor task_commit_protocol.
- Plan 59-02: voter-results.spec.ts totalPartyCount sourced from E2E_ORGANIZATIONS.length directly — the e2e template ships 4 orgs combined (58-E2E-AUDIT.md §1.1), so the prior 2+2 sum collapses to a single read.
- Plan 59-02: 2 grep hits remain in tests/tests/utils/mergeDatasets.ts — both docstring comments, not imports; file scheduled for deletion in Plan 06. import-only grep returns 0. Out of scope to touch.
- Plan 59-03: Three variant templates (constituency / multi-election / startfromcg) extend BUILT_IN_TEMPLATES.e2e via template composition — no mechanical JSON port, field-by-field snake_case migration with shape-drift documented inline
- Plan 59-03: Diff script uses inline Playwright JSON type definitions (approach b, not @playwright/test import) — script lives under .planning/ outside tests/ workspace; ~35 lines of interfaces, zero any, no new deps
- Plan 59-03: Overlay _constituencies / _constituencyGroups / _elections per-row sentinels cannot be expressed template-side because pipeline.ts:229-255 post-topo pass overwrites them with full-fanout (T-56-37); variant specs that need narrower scoping query by external_id
- Plan 59-03: Per-task atomic commits (3 × feat(59-03)) continue Plan 59-02 precedent — plan's Task 4 bundle commit superseded by executor task_commit_protocol
- Plan 59-03: diff script flattenReport reads top-level t.status as fallback when results[] is empty — Playwright emits cascaded did-not-run tests with results:[] + tests[].status='skipped' (Rule 1 bug fix, caught in smoke test before Task 3 commit)
- Plan 59-04: Core swap committed in 4 atomic feat(59-04) commits (per-task protocol, Plan 59-02/03 precedent) rather than the plan's Task-5 bundled commit. Task 5 gates (yarn build exit 0, grep=0 in code, playwright test --list=89) all pass as verification.
- Plan 59-04: Preserved legacy updateAppSettings(...) calls in all 4 setup files (data.setup.ts + 3 variant setups) — the Phase 58 e2e template has NO app_settings.fixed[] block, so Writer Pass-5 merge_jsonb_column is a no-op. Dropping the calls would regress popup/intro/hideIfMissingAnswers defaults and fail the Plan 05 parity gate by design. Rule 2 auto-fix (missing critical functionality). Follow-up: extend e2e template with app_settings block; then delete the 4 legacy blocks (~60 lines).
- Plan 59-04: forceRegister signature is Promise<void> (throws on any failure path). Plan draft's `expect(result).toBeTruthy()` replaced with `expect(true).toBe(true)` post-condition marker.
- Plan 59-04: Prefix 'test-' satisfies runTeardown 2-char guard AND matches e2e template emit (externalIdPrefix '' + fixed[] literal 'test-*' ids per D-58-15). Reconciliation is D-59-06 option 3 — no e2e template change needed.
- Plan 59-05: PARITY GATE: FAIL — 22 surface regressions, 3 real root causes. (1) runTeardown('test-') deletes zero rows in both data.teardown.ts + variant-data.teardown.ts (2 direct fails) — hypothesized cause: e2e template's externalIdPrefix:'' leaves synthetic rows unstamped so teardown's LIKE 'test-%' filter excludes them; fix-forward Option A is to set externalIdPrefix:'test-' on the e2e template, overriding Plan 59-04's Option-3 reconciliation (which assumed fixed[] literals were enough — they are for hand-authored rows but not synthetic count:N rows). (2) candidate-questions CAND-12 persist-comment times out at getByTestId('candidate-questions-comment'); 7 other candidate-questions tests pass so basic rendering works — navigation path lands on wrong question; cascades into 18 downstream candidate-app-mutation + re-auth-setup + candidate-app-password + candidate-app-settings tests via Playwright project deps. (3) Cosmetic: baseline summary.md uses camelCase 'termsOfUseAccepted' for voter-matching source-skip, post-swap uses snake_case 'terms_of_use_accepted' (Plan 59-02 rename artifact); diff script flags as "new test" but both are test.skip — no runtime regression.
- Plan 59-05: Data-race pool SHRANK post-swap — 9 of 10 baseline flakes now pass (voter-detail × 4, voter-results × 3, voter-matching ranking order, voter-journey intro start). Under D-59-04 this is acceptable flake-pool shift; parity FAIL is unrelated to concurrency variance (regressions are deterministic assertion failures + teardown zero-rows + timeout on single non-flake test). Confirms Plan 59-04 core swap improved E2E reliability for voter-side data loading.
- Plan 59-05: Post-swap runtime 178.3s vs baseline 178.0s (+0.17%) — seed-path latency effectively unchanged. NF-01 <10s seed budget still comfortably met; extra wall time is in test bodies (the 30s timeout on CAND-12), not seeding.
- Plan 59-05: Declared FAIL verdict + committed diff.md + left swap commit 9c9e6363f landed per D-59-12 fix-forward. Did NOT create Phase 59.1 follow-up plan — orchestrator owns that decision. Did NOT retry Playwright run — regressions are deterministic, not flake variance.

### Blockers/Concerns

- Local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue.
- 19 pre-existing data-loading race E2E failures + 55 cascade failures carry over from v2.4; E2E fixture migration must not make this worse, and passing tests must remain passing after switch-over. (Updated 2026-04-23 by Plan 59-01 baseline: ACTUAL pre-swap count on SHA f09daea34 is 10 data-race + 25 cascade; total 89 tests matches v2.4 tally, distribution improved. Parity gate uses actual test names, not counts.)
- NF-01 <10s seed budget pressures the generator toward bulk RPCs vs per-row inserts — Phase 56 picks the approach.
- E2E-03 zero-regression bar requires an explicit baseline-vs-post-swap Playwright comparison in Phase 59 before fixtures are deleted.
- supabaseAdminClient home (stays in tests/ vs moves to dev-tools) is a Phase 59 implementation-time call.
- **Phase 59 PARITY GATE FAILED 2026-04-24** — Plan 06 (legacy fixture deletion) is BLOCKED until 3 root-cause fixes land and Plan 59-05 Task 2+3 re-run prints PARITY GATE: PASS. See .planning/phases/59-e2e-fixture-migration/post-swap/diff.md for the fix-forward work list.

## Session Continuity

Last session: 2026-04-24T05:42:57.979Z
Stopped at: Plan 59-05 complete — PARITY GATE: FAIL; Plan 06 BLOCKED per D-59-12 fix-forward
Resume file: .planning/phases/59-e2e-fixture-migration/post-swap/diff.md (fix-forward work list)
Next action: Orchestrator decision required — Plan 06 BLOCKED. Triage options: (a) inline Plan 59-05.1 fixup, (b) Phase 59.1 fixup plan, (c) user-initiated fix cycle. Three fixes needed: externalIdPrefix:'test-' on e2e template, CAND-12 question-nav, baseline ID cosmetic. After fixes land, re-run Plan 59-05 Tasks 2+3 (overwrite post-swap/playwright-report.json + diff.md) until PARITY GATE: PASS.

**Planned Phase:** 59 (e2e-fixture-migration) — 7 plans, 5 complete — 2026-04-24T05:41:11Z (PAUSED per D-59-12)
