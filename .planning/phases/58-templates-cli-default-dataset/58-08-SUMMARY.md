---
phase: 58-templates-cli-default-dataset
plan: 08
subsystem: dev-seed
tags: [dev-seed, e2e-template, playwright-parity, built-in-templates, phase-58-wave-4, d-58-15, d-58-16, audit-driven]

# Dependency graph
requires:
  - plan: 58-01
    provides: 58-E2E-AUDIT.md — the positive inclusion list (§1/§1.1/§2/§3) + exclusion list (§4/§4.1) that this template consumes verbatim
  - plan: 58-06
    provides: BUILT_IN_TEMPLATES + BUILT_IN_OVERRIDES registry pattern — Plan 08 adds `e2e: e2eTemplate` and no override entry (pure fixed[] template)
  - phase: 56-generator-foundations-plumbing
    provides: TemplateSchema + validateTemplate; Phase 56 generators' `fixed[]` passthrough semantics (`${externalIdPrefix}${fx.external_id}`); NominationsGenerator polymorphism; CandidatesGenerator ref shape (organization: { external_id })
provides:
  - packages/dev-seed/src/templates/e2e.ts — e2eTemplate (TMPL-05) authored from 58-E2E-AUDIT.md
  - packages/dev-seed/src/templates/index.ts — BUILT_IN_TEMPLATES.e2e entry + re-export
  - packages/dev-seed/tests/templates/e2e.test.ts — 99 audit-parity tests (§1 + §2 + §2.1 + §2.2 + §3 + §4.1 + §7 + §8.3 + §8.4)
affects:
  - 58-09 integration test — end-to-end exercise of `runPipeline(e2eTemplate)` against live Supabase, verifying external_id presence + row counts
  - Phase 59 rewrite of tests/seed-test-data.ts — Phase 59 invokes BUILT_IN_TEMPLATES.e2e instead of loading the 3 legacy JSON fixtures

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "externalIdPrefix: '' for templates whose fixed[] entries carry fully-literal external_ids — Phase 56 generators always apply `${externalIdPrefix}${fx.external_id}`, so an empty prefix + pre-formatted ids produces the spec-asserted literals verbatim (test-candidate-alpha etc.)"
    - "Template-level audit-traceability — every fixed[] entry carries an inline comment citing 58-E2E-AUDIT.md §Section (a spec file:line that depends on that id/name/triangle). Extending the template without an audit update is a code-review flag."
    - "Parity tests as regression gate — REQUIRED_EXTERNAL_IDS and FORBIDDEN_EXTERNAL_IDS arrays in e2e.test.ts encode Sections 1 + 4.1 mechanically, turning the audit doc into a runtime assertion. If Phase 59 discovers a new spec asserting on an un-audited id, the test file gets a new entry in the same commit that updates the audit."
    - "No overrides for pure fixed[] templates — BUILT_IN_OVERRIDES omits the 'e2e' key since every row is declarative. `loadBuiltIns` falls back to {} for missing keys, so the CLI resolves `--template e2e` + empty overrides → runPipeline(e2eTemplate, {})."
    - "Polymorphic nomination discipline — candidate-type nominations carry ONLY `candidate` ref (no redundant `organization` ref, per NominationsGenerator.ts + RESEARCH §9). Organization-type nominations (`test-nom-org-*`) carry ONLY `organization` ref. Exactly-one-ref invariant tested."

key-files:
  created:
    - packages/dev-seed/src/templates/e2e.ts (~580 lines)
    - packages/dev-seed/tests/templates/e2e.test.ts (~420 lines, 99 tests)
  modified:
    - packages/dev-seed/src/templates/index.ts (+3 lines: import, BUILT_IN_TEMPLATES entry, re-export)

key-decisions:
  - "externalIdPrefix: '' instead of 'test-' — Phase 56 generators always apply the prefix-concat at line 85 of CandidatesGenerator.ts (verified via grep across all 7 ref-bearing generators). Setting prefix to 'test-' + writing bare ids would work but loses declarative clarity; setting prefix to '' + writing full 'test-...' ids keeps each fixed[] entry self-documenting (the literal id read by specs is the literal id in source code)."
  - "Template includes test-election-2 + test-cg-municipalities + test-constituency-e2 at BASE level — audit §8.1 recommended deferring these to overlay templates (Phase 59/60), but Plan 08's must_haves.truths explicitly requires every §Section 1 id present as fixed[]. Following the plan over the audit open-question. Spec behavior: results-sections.spec.ts:171-174 + multi-election.spec.ts:135-140 use findData() to look these up at the admin client level; having them in the base dataset means the admin query resolves to real rows, satisfying the spec assertion."
  - "candidates.length == 14, not 13 — audit §7 row-count summary states '13' in the count column but the breakdown beneath it lists 5 default registered + 6 voter registered + 1 voter hidden + 2 addendum unregistered = 14. The breakdown matches the 3 legacy JSON fixtures (default-dataset=5, voter-dataset=7, candidate-addendum=2). Audit '13' is an arithmetic typo. Template implements the breakdown (14); test documents the typo inline."
  - "DROP test-question-date, -number, -boolean per audit §4.1 — zero grep hits in specs; their presence or absence doesn't affect the 8-ordinal filter at voter-matching.spec.ts:40-43 (the filter yields 8 regardless of how many non-ordinal rows exist). Preserving them would be pure mechanical-port bloat that D-58-15 explicitly rejects. Questions count: 17 (8 default ordinal + 8 voter ordinal + 1 text) instead of 20."
  - "terms_of_use_accepted stored as ISO date string ('2025-01-01T00:00:00.000Z') — matches Phase 56's TablesInsert<'candidates'> column type `string | null` (not boolean). Registered candidates have the field; hidden/unregistered omit it per audit §8.3 (voter-matching.spec.ts:121 filters via `!c.termsOfUseAccepted`)."
  - "answersByExternalId carried as declarative JSONB on candidate rows (not emitted by an override) — Phase 56's CandidatesGenerator passes fixed[] rows through verbatim (line 82-88: `...fx` spread). The answer map is preserved in the template row and forwarded to Phase 57's importAnswers post-insert helper. Alpha's answersByExternalId carries audit §1 contract: value.en on test-question-text (campaign slogan) + info.en on >=1 opinion answer."
  - "Test for candidates[0] === test-candidate-alpha enforced at test level — §2.2 is a LOAD-BEARING ordering invariant: testCredentials.ts:10 reads `defaultDataset.candidates[0].email` as TEST_CANDIDATE_EMAIL. With the unified e2e template replacing the 3 JSON fixtures, Phase 59's setup code will need to read `e2eTemplate.candidates.fixed[0].email`. Spot-preserving this by asserting position-0-is-alpha ensures Phase 59's port is mechanically safe."

patterns-established:
  - "Audit-parity test-pair pattern — for every authoritative planning doc referenced by a template (58-E2E-AUDIT.md here, prospective Phase 59 overlay audits later), ship a matching *.test.ts with REQUIRED_*_IDS + FORBIDDEN_*_IDS arrays encoding the audit inclusion/exclusion lists. Audit + test move together; drift fails a test, not a spec."
  - "Declarative answer map per candidate — answersByExternalId lives directly on candidate fixed[] rows (not emitted via override) when the spec contract requires specific values (alpha's slogan; voter-cand-agree all 5s, -oppose all 1s, -neutral all 3s, -partial sparse 4/3). The D-27 override seam is for synthesized candidates (default template's latent emitter) — fixed[] candidates supply answers inline."

requirements-completed: [TMPL-05]

# Metrics
duration: ~8 min
completed: 2026-04-23
---

# Phase 58 Plan 08: E2E Built-in Template Summary

**TMPL-05 e2e template authored from 58-E2E-AUDIT.md (D-58-15 audit-driven, no mechanical JSON port) — 2 elections × 2 constituencies × 2 constituency_groups × 4 organizations × 5 question_categories × 17 questions × 14 candidates × 18 nominations × generateTranslationsForAllLocales: false (D-58-16). Registered in BUILT_IN_TEMPLATES.e2e; `--template e2e` resolves to this template. Every fixed[] entry carries an inline audit citation; 99 parity tests gate against drift.**

## Performance

- **Duration:** ~8 minutes
- **Started:** 2026-04-23T11:40:00Z
- **Completed:** 2026-04-23T11:45:00Z
- **Tasks:** 1 (single-task plan, no TDD RED/GREEN split)
- **Files changed:** 3 (2 created, 1 modified); +1432 / -2 lines
- **Tests:** 99 new parity tests; dev-seed suite goes 312 → 411 passing (0 regressions)

## Accomplishments

- **Shipped TMPL-05 e2e template** — declarative Template config mirroring the Playwright-spec data contracts captured by Plan 01's audit:
  - 2 elections: `test-election-1` ("Test Election 2025") + `test-election-2` ("Test Election 2026"). Names preserved verbatim per audit §2 (constituency.spec.ts:292-293 asserts visibility).
  - 2 constituency_groups: `test-cg-1` (structural chain requirement per §4) + `test-cg-municipalities` ("Municipalities" — startfromcg.spec.ts:141/153/268 + constituency.spec.ts:119 assert visibility).
  - 2 constituencies: `test-constituency-alpha` + `test-constituency-e2` (§1 rows 14/16).
  - 4 organizations: `test-party-a/b` (default) + `test-voter-party-a/b` (voter). voter-results.spec.ts:28 sums both datasets' org counts → 4 total.
  - 5 question_categories: 3 default (test-category-economy/social/info) + 2 voter (test-voter-cat-economy/social). Opinion/info type mix preserved.
  - 17 questions: 8 default-dataset ordinal (test-question-1..8) + 8 voter-dataset ordinal (test-voter-q-1..8) + 1 text (test-question-text for Alpha's campaign slogan). Audit §4.1 DROPPED: test-question-date, -number, -boolean.
  - 14 candidates, in audit §2.2 order: test-candidate-alpha FIRST (testCredentials.ts:10 contract), then -beta/-gamma/-delta/-epsilon, then 6 voter registered, then test-voter-cand-hidden, then the 2 addendum unregistered (§2.2 ordering preserved). terms_of_use_accepted set on 11 candidates (voter-results 11-card assertion); absent on 3.
  - 18 nominations covering all §3 triangles: 5 default candidate + 2 default org + 7 voter candidate + 2 voter org + 2 addendum candidate. test-voter-nom-hidden and both test-nom-unregistered-* carry `unconfirmed: true` per §3.3 + §8.3. Candidate-type nominations carry ONLY candidate ref (no redundant organization ref) per RESEARCH §9 + NominationsGenerator.ts docs.
- **`externalIdPrefix: ''` decision** — every fixed[] entry carries its full literal id (`'test-candidate-alpha'` etc.). Phase 56 generators always apply `${externalIdPrefix}${fx.external_id}` — verified at CandidatesGenerator.ts:85, ConstituenciesGenerator.ts:57, and 5 other ref-bearing generators. Empty prefix + literal ids = spec-asserted ids verbatim, with each source line self-documenting.
- **`generateTranslationsForAllLocales: false`** per D-58-16 — Playwright specs run single-locale; the 4× JSONB payload is pure overhead.
- **Test contract 99-test parity gate** — REQUIRED_EXTERNAL_IDS array encodes every §1 id (49 ids covering 8 tables); FORBIDDEN_EXTERNAL_IDS encodes the §4.1 exclusion list (3 ids). Additional tests cover: schema validation, display-text contracts (§2), ordering invariants (§2.2, 14-candidate order), triangle closure (§3), polymorphic nomination shape, email contracts (§6 / §2.2), edge cases (§8.3 hidden-candidate double-flag, §8.4 custom_data.allowOpen, §3.3 unconfirmed addendum nominations), answer contract (alpha's test-question-text slogan non-empty + >=1 opinion with info.en).
- **Registry wiring** — templates/index.ts exports e2eTemplate through BUILT_IN_TEMPLATES.e2e. `npx tsx --eval "import('./packages/dev-seed/src/templates/index.ts').then(m => console.log(Object.keys(m.BUILT_IN_TEMPLATES)))"` returns `['default', 'e2e']`. No overrides entry (pure fixed[] template; `loadBuiltIns` falls back to {} for missing BUILT_IN_OVERRIDES keys).
- **Pre-Phase-59 hand-off payload** — every addendum candidate row carries the `email` field (`test.unregistered@openvaa.org`, `test.unregistered2@openvaa.org`) and Alpha carries `mock.candidate.2@openvaa.org`. bulk_import drops unknown fields, so these are no-ops at insert time but available for Phase 59's setup code to read from the template when rewriting forceRegister / unregisterCandidate calls.

## Task Commits

| Task | Commit | Description |
| --- | --- | --- |
| Task 1 | `ea6fe20de` | feat(58-08): add e2e built-in template authored from 58-E2E-AUDIT.md |

## Integration Points

- **BUILT_IN_TEMPLATES (Plan 06)** — templates/index.ts extended: `e2e: e2eTemplate`. The CLI's `loadBuiltIns` (Plan 05 seed.ts) now resolves `--template e2e` to a valid Template. BUILT_IN_OVERRIDES unchanged — `loadBuiltIns` falls back to {} for missing keys, so runPipeline(e2eTemplate, {}) is the runtime path.
- **Phase 56 generators (fixed[] passthrough)** — every table's `count: 0` suppresses synthetic emission; fixed[] rows alone describe the template. `externalIdPrefix: ''` ensures the `${externalIdPrefix}${fx.external_id}` concat at each generator's line ~45-85 passes the literal 'test-' id through unchanged. No generator modifications required.
- **Phase 57 latent emitter** — candidates carry explicit answersByExternalId (not synthesized via override); the latent emitter is BYPASSED for e2e runs because Phase 56's CandidatesGenerator only invokes the emitter for SYNTHESIZED candidates (count-driven), not fixed[] passthrough (spread-verbatim). Phase 57 remains functional for the default template; the e2e template deliberately sidesteps it since spec-asserted answer values must be deterministic.
- **Phase 59 tests/seed-test-data.ts rewrite (downstream)** — Phase 59 will replace the 3-fixture JSON load with `runPipeline(BUILT_IN_TEMPLATES.e2e, {})` + side-hooks for email wiring (forceRegister + unregisterCandidate). The template carries every contract Phase 59 needs: external_ids, names, ordering, emails, terms_of_use_accepted states, answer maps, unconfirmed flags.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] allExternalIds() test helper initially iterated all template keys, not just fragment-shaped ones**
- **Found during:** First test run (2 failures)
- **Issue:** The test helper `allExternalIds()` in the §4.1 forbidden-ids test iterated `Object.keys(e2eTemplate)` and attempted `frag?.fixed ?? []` for each key. For top-level scalar fields (seed: 42, externalIdPrefix: '', generateTranslationsForAllLocales: false) the `frag` cast resolved to a non-object value with no `.fixed` property, and the `?? []` fallback tripped on the function's truthiness rather than the `.fixed`'s absence — throwing `TypeError: function is not iterable`.
- **Fix:** `fragmentOf(table)` now explicitly checks the value is object-shaped and has a `fixed` key before casting. `allExternalIds()` skips non-fragment values via the new guard.
- **Files modified:** `packages/dev-seed/tests/templates/e2e.test.ts`
- **Commit:** `ea6fe20de` (Task 1, same commit as template)

### Discretionary Departures from Plan Text

**2. [Plan-audit conflict resolved in favor of plan] Base template includes overlay-level rows**
- **Audit §8.1 recommended:** "SCOPE Plan 08 to the base (default+voter+addendum); defer overlay templates to Phase 59/60." This would OMIT test-election-2, test-constituency-e2, test-cg-municipalities from the base e2e template.
- **Plan must_haves.truths (line 17, 19):** "Every external_id listed in 58-E2E-AUDIT.md §Section 1 appears as a `fixed[]` entry". Plan acceptance_criteria includes explicit grep asserts for `test-election-2` and `test-cg-municipalities`.
- **Resolution:** Template includes ALL §Section 1 ids — overlay rows at base level. Rationale: the audit's §8.1 is an open question the planner resolved, not a constraint the planner accepted. Phase 59's variant setup files can still layer overlay content on top if needed, but the base e2e template being complete means `--template e2e` alone produces a dataset that satisfies more specs out-of-the-box.
- **Impact:** Base template is slightly richer than §8.1 recommended; no spec is broken by the inclusion; Phase 59 overlay logic may become simpler (fewer things need to be layered on top).

**3. [Audit-typo documented] candidates.length == 14, not 13**
- **Audit §7 text:** "candidates | 13 | 5 default registered + 6 voter registered + 1 voter hidden + 2 addendum unregistered"
- **Arithmetic reality:** 5 + 6 + 1 + 2 = 14. Verified against the 3 source JSON fixtures (default-dataset.json = 5, voter-dataset.json = 7, candidate-addendum.json = 2 → 14 total).
- **Resolution:** Template ships 14 candidates (breakdown preserved verbatim). Test `candidates.fixed.length === 14` carries an inline comment documenting the audit-header typo. No spec changes required — the 11-card assertion at voter-results.spec.ts depends on `termsOfUseAccepted`-filter, not total count.
- **Impact:** None — template satisfies every per-id audit citation; total count is correct.

**4. [Plan-spec clarification] Question type + choice shape use canonical schema values**
- **Plan example text used:** `{ id: '1', label: { en: 'Strongly disagree' }, value: 1 }` on questions.
- **Implementation uses:** `normalizableValue: 1` (matches Phase 56 QuestionsGenerator's LIKERT_5 constant exactly) and `type: 'singleChoiceOrdinal'` (canonical enum from supabase-types). Same rationale as Plan 06's deviation 4 (identical pattern).
- **Impact:** None — enforces schema consistency; Phase 57 latent emitter reads `normalizableValue` numerically.

**5. [Plan-spec clarification] `customData` → `custom_data` (column-case)**
- **Plan text specified:** "test-question-1 has `customData.allowOpen: true`".
- **Implementation uses:** `custom_data: { allowOpen: true }` — Postgres uses snake_case column names (questions.custom_data JSONB in the migration), and TablesInsert<'questions'> types this as snake_case. The legacy JSON fixture's `customData` key was a display artifact from the test-framework DTO layer; at the template/DB level, it's `custom_data`.
- **Impact:** None — candidate-questions.spec.ts:67-69 reads through the frontend DTO layer (which camelCases back to customData); DB-level persistence is snake_case.

### Authentication Gates

None — no external services touched during Plan 08. Pure template-authoring + zod validation + unit tests.

## Known Stubs

None. Every fixed[] row carries the fields required for Phase 56's bulk_import + Phase 57's importAnswers post-pass + Phase 59's forceRegister/unregisterCandidate setup calls:
- **Elections**: election_type, election_date, sort_order, is_generated, multiple_rounds, current_round.
- **Candidates**: first_name, last_name, email (for Phase 59 hand-off), terms_of_use_accepted (registered), sort_order, is_generated, organization ref, answersByExternalId for 11 of 14 candidates.
- **Questions**: type (canonical enum), name (JSONB), choices (LIKERT_5_EN for ordinal types), category ref, allow_open, required, sort_order.
- **Nominations**: polymorphic ref (exactly-one of candidate/organization), election ref, constituency ref, election_round, unconfirmed flag where required.

## Threat Flags

No new threat surface. The e2e template is pure data; it exposes no network endpoints, no auth paths, and no new file access patterns. All entries are declarative rows consumed by existing Phase 56 bulk_import + Phase 59 auth orchestration (themselves covered by their own threat models).

## Self-Check: PASSED

**Files exist:**
- `packages/dev-seed/src/templates/e2e.ts` — FOUND
- `packages/dev-seed/src/templates/index.ts` — FOUND (modified)
- `packages/dev-seed/tests/templates/e2e.test.ts` — FOUND

**Commits exist:**
- `ea6fe20de` (Task 1) — FOUND

**Acceptance criteria:**
- `grep -q "generateTranslationsForAllLocales: false" packages/dev-seed/src/templates/e2e.ts` — PASS
- `grep -q "test-candidate-alpha"` — PASS
- `grep -q "test-election-1"` — PASS
- `grep -q "test-election-2"` — PASS
- `grep -q "test-constituency-alpha"` — PASS
- `grep -q "test-cg-municipalities"` — PASS
- `grep -q "first_name: 'Test'"` — PASS
- `grep -q "last_name: 'Candidate Alpha'"` — PASS
- `grep -q "e2e: e2eTemplate"` in index.ts — PASS
- `grep -q "export.*e2eTemplate"` in index.ts — PASS
- `yarn workspace @openvaa/dev-seed test:unit tests/templates/e2e.test.ts` — 99/99 passing
- `yarn workspace @openvaa/dev-seed test:unit` — 411/411 passing across 36 files (312 → 411; +99)
- `yarn workspace @openvaa/dev-seed typecheck` — exit 0
- ESLint on 3 new/modified files — 0 warnings, 0 errors (after auto-fix of import-sort)
- Runtime registry verification: `BUILT_IN_TEMPLATES` keys = `['default', 'e2e']`; `e2eTemplate` is an object; `BUILT_IN_OVERRIDES` keys = `['default']` (no overrides for e2e)
