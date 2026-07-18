# Requirements: OpenVAA — v2.14 E2E Coverage Expansion + Svelte 5 Idiom Polish + svelte-check Zero

**Defined:** 2026-06-14
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## Scope notes (grounding for this milestone)

Derived from a 4-agent prep audit (feature/settings inventory · E2E coverage gaps · type/svelte-check health · 52-todo backlog triage), 2026-06-13/14. Operator scope decisions:

- **E2E "as comprehensive as possible"**, Voter + Candidate apps. **Admin App is excluded** from feature/E2E coverage.
- **Close coverage-unblocking product gaps** (multi-text input, multi-choice categorical variant) + the two pure blockers (default seed, `/nominations` route). **Voter-side open-comment and voter-side required-info are NOT applicable to the voter app — out of scope entirely** (reverses the v2.9 SETTINGS-02/03 routing).
- **svelte-check → literal 0** (frontend baseline is 151; concentrated in `supabaseDataProvider.ts` = 79). Admin-related type errors (~14) ARE cleared even though Admin features are out of E2E scope.
- **Fold the ~6 deferred "v2.11+ hardening" flake/race todos in — but triage for staleness first** (suite is 95/95 green post-v2.13; some may already be resolved).
- **Svelte 5 = full idiom polish** (`onMount`→`$effect`, reactive `let`→`$state`) plus lock-in (app-wide store ESLint guard, visual verification, 2 context bugs). Hard Svelte-4 syntax is already 100% gone.

**Coverage-verification caveat:** several EPERM/EFLOW items are marked by the operator as "already covered" / "should be covered / re-audit" (see per-requirement **NOTE**s). The first E2E phase is an AUDIT that confirms or refutes each, so already-covered requirements close cheaply and net-new work targets only the true gaps. Each EPERM/EFLOW/EQTYP requirement is satisfied by the end-state "suite covers + asserts X and passes 3×", whether by confirming existing coverage, extending an existing spec, or adding a new one.

## E2E Implementation Methodology (operator-mandated ordering)

**The E2E workstream (EPERM, EFLOW, EQTYP) MUST follow this order — plan-and-approve before building:**

1. **Audit current E2E tests** — map every EPERM/EFLOW/EQTYP requirement to its actual current coverage (covered / partial / missing), resolving the per-requirement NOTEs.
2. **Plan which specs to add vs edit** — explicit list of new spec files and existing specs to extend (prefer extending an existing perm over adding a new one, per the NOTEs).
3. **Plan seed-data changes** — what `e2e/base` / perm-template changes (if any) each spec needs.
4. **Plan each new spec & edit at the semantic-step level** — e.g. "use `e2e/base` data → go to results with all questions answered polar-max → open candidate X details > opinions → expect foo". Behaviour, not selectors.
5. **Plan new/edited fixtures & helpers** — every preparatory task and view manipulation belongs in a fixture/helper.
6. **APPROVAL GATE** — the plans in steps 1–5 are approved before any test code is written.
7. **Build fixtures-first** — build and test the fixtures/helpers BEFORE the specs that consume them.

**Spec authoring principle:** specs use fixtures for all preparatory tasks and view manipulation, so that reading a spec, the `expect`s deal with **behaviour, not technicalities**.

This ordering shapes the roadmap: the E2E phases lead with an **Audit + Coverage-Plan phase** (deliverable = approved spec/seed/semantic-step/fixture plan), then **fixtures-first build phases**, then **spec build phases**. Product unblockers (UNBLK) that gate a question-type spec land before the spec that needs them.

## v1 Requirements

Requirements for this milestone. Each maps to exactly one roadmap phase.

### E2E — Settings-Permutation Coverage (EPERM)

New settings-driven branches not yet covered by the existing 19 perm specs.

- [x] **EPERM-01**: E2E covers the question-flow path matrix — combinations of `questions.questionsIntro.show` × `questions.categoryIntros.show` × `questions.categoryIntros.allowSkip` — verifying correct routing and answer-count tracking per path. **NOTE**: Already covered.
- [x] **EPERM-02**: E2E covers election/constituency sequencing variants — `elections.disallowSelection` (all-selected bypass) and `elections.startFromConstituencyGroup` (constituency-first), single- vs multi-election — verifying initial routing. **NOTE**: Re-audit, should be covered.
- [x] **EPERM-03**: E2E covers results-display permutations — `results.sections[]` (candidate/org/alliance presence) × `results.cardContents[type][]` (submatches/children/answer snippets) — verifying tabs and card content. **NOTE**: Already covered.
- [x] **EPERM-04**: E2E covers `entityDetails.contents[type][]` tab control per entity type (candidate / organization / alliance) — verifying tab presence/absence and layout stability.
- [x] **EPERM-05**: E2E covers missing-data markers — `entityDetails.showMissingElectionSymbol[type]` and `entityDetails.showMissingAnswers[type]` per entity type.
- [x] **EPERM-06**: E2E covers candidate-app question media toggles — `candidateApp.questions.hideVideo` and `hideHero` combinations. **NOTE**: HideHero covered, video not tested at all. => We need a dedicated Video test.
- [x] **EPERM-07**: E2E covers `questions.interactiveInfo.enabled` — interactive info popup modal vs static expander. **NOTE**: This test should test the interactive info functionality in full.
- [x] **EPERM-08**: E2E covers `matching.minimumAnswers` gating results availability (located voter with too few answers). **NOTE**: Already covered.
- [x] **EPERM-09**: E2E covers survey/feedback popup coordination — `survey.showIn[]` + `results.showSurveyPopup` + `results.showFeedbackPopup` + `header.showFeedback` — verifying placement, timing, no double-pop, and dismiss persistence. **NOTE**: Should be partly covered, extend the current perm, don't introduce a new one.
- [x] **EPERM-10**: E2E covers `matching.organizationMatching` (none / answersOnly / impute) disclosure text on the About page.
- [x] **EPERM-11**: E2E covers `access.underMaintenance` and `access.voterApp` / `access.candidateApp` gating (maintenance page / redirects). **NOTE**: Should be already covered.

### E2E — Flow Coverage (EFLOW)

- [x] **EFLOW-01**: E2E exercises voter-results entity filters — applying a filter updates the results list; reset and persistence behave correctly (the `entityFilters` fixture is wired into a journey). **NOTE**: Already partly covered by voter journey, but let's extend the filter coverage to: multiple filters' intersection; select all/none in categorical filter behaviour; text search; text search intersection with filters.
- [ ] **EFLOW-02**: E2E asserts alliance-card rendering and the alliance member-orgs drawer in voter results. **NOTE**: Alliances currently not rendered but should be easy to implement => move to gap filling.
- [x] **EFLOW-03**: E2E asserts voter-answer-vs-entity answer comparison for all four cases (agree / disagree / voter-missing / entity-missing) in entity details. **NOTE**: Should be already covered.
- [x] **EFLOW-04**: E2E asserts per-category match breakdown (subMatches) rendering on results. **NOTE**: Partly covered, but let's extend the test to test that correct values (only voter-answered categories, correct scores) are displayed for one candidate (as part of voter flow).
- [x] **EFLOW-05**: E2E covers skip / delete / back navigation in the question flow and the resulting answer-count + results-CTA impact. **NOTE**: Should be already covered.
- [x] **EFLOW-06**: E2E covers mid-session locale switching (e.g. fi → en → fi) with UI translation and answer/selection state preserved.
- [x] **EFLOW-07**: E2E covers the dark-mode toggle — theme applied and persisted across reload.
- [x] **EFLOW-08**: E2E covers user-preferences round-trip (every persisted preference field) and tracking-event emission under consent / suppression without consent. **NOTE**: We also need a test for checking correct payloads are emitted by the tracking service by both `track` and `startEvent` methods.
- [x] **EFLOW-09**: E2E asserts navigation-menu contents for both voter and candidate apps across the relevant settings permutations. **NOTE**: And also candidate nav when logged in/out.
- [x] **EFLOW-10**: E2E covers the full bank-auth (Signicat/Idura OIDC) round-trip from initiate to authenticated session, deterministically.
- [x] **EFLOW-11**: E2E runs an interactive voter journey at a mobile viewport (not just a visual baseline).

### E2E — Question-Type Variants (EQTYP)

- [x] **EQTYP-01**: E2E covers multi-choice categorical opinion questions — voter answering, candidate answering, and matching (depends on UNBLK-02). **NOTE**: Voter answering covered, but check ig categorial and boolen opinion questions are covered for candidates.
- [x] **EQTYP-02**: E2E covers number-scale opinion questions — answering and matching boundary behavior. **NOTE**: Blocked on UNBLK-05 (number opinion input does not exist yet).
- [x] **EQTYP-03**: E2E covers text and MultipleText questions — voter/candidate rendering and answer round-trip (depends on UNBLK-01).

### Coverage-Unblocking Product Work (UNBLK)

- [x] **UNBLK-01**: The frontend `QuestionInput` renders and persists answers for `MultipleTextQuestion` (multiple-text input component).
- [x] **UNBLK-02**: The frontend supports a multi-choice categorical opinion variant — input component + matching dispatch + dev-seed authoring support.
- [ ] **UNBLK-03**: The default seed template (`yarn db:seed:default`) produces a valid dataset — parties present, candidates tab populated, consistent naming.
- [x] **UNBLK-04**: The `/nominations` route fetches question data so all-nominations entities render correctly (unblocks the nominations journey step).
- [x] **UNBLK-05**: The frontend supports a number-scale opinion question — input component + matching dispatch + dev-seed authoring support (unblocks EQTYP-02).
- [x] **UNBLK-06**: Alliance entities render in voter results (card + member-orgs drawer) — small implementation flagged by the audit as "currently not rendered; easy to implement" (unblocks EFLOW-02).

### E2E — Reliability Hardening (HARDN)

- [ ] **HARDN-01**: The ~6 deferred "v2.11+ hardening" flake/race todos (party-drawer boundary, qspec cold-start race, popup-hydration deeplink, voter-feedback-persistence locator collision, not-located-redirect chain, candidate-settings notifications mount-lifecycle) are each triaged against the current suite and either fixed (passing 3×) or closed-as-stale with documented rationale.
- [ ] **HARDN-02**: The full E2E suite — including every net-new v2.14 spec — passes to the 3× determinism standard (fresh server, clean DB, no flakes) at milestone close.

### Svelte 5 — Idiom Polish (RUNES)

- [x] **RUNES-01**: `onMount` / `onDestroy` are migrated to `$effect` where semantically equivalent (~24 files), behavior-neutral and verified. **NOTE**: See https://svelte.dev/docs/svelte/lifecycle-hooks for recommendations.
- [x] **RUNES-02**: Reactive `let` declarations (locals mutated for reactive effect) are migrated to `$state`, per-site verified (non-reactive locals left as `let`).
- [x] **RUNES-03**: The `svelte/store` ESLint guard is extended to the entire `apps/frontend/src/**` tree (lock-in against regressions). **Met-via-Phase-115-SWEEP-03**: the guard glob was already widened to `apps/frontend/src/**/*.{ts,svelte}` in Phase 115 SWEEP-03 (see the in-file comment at `apps/frontend/eslint.config.mjs` lines 77-84); `yarn workspace @openvaa/frontend lint` reports zero `no-restricted-imports`/`svelte/store` violations across `src/**`. Phase 124 adds the permanent regression self-test `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` (positive + negative control) proving the guard FIRES, not merely lints clean by accident.
- [x] **RUNES-04**: A post-runes visual verification pass confirms no regressions in app-header styling, banner images, and post-login candidate navigation. **Verified-by-`124-VISUAL-VERIFICATION.md`** (Phase 124): all three migration-risk surfaces pass present-and-correct (header light voter+candidate × en/fi + dark code-verified; banner/hero en/fi; post-login `CandidateNav` reactive — badge + step-gating populate post-mount, no Phase-61 destructure-trap). D-08 gate satisfied (lint clean for `svelte/store`, guard self-test passing, 3/3 surfaces, full E2E 125/0/0 cardinal-clean).
- [x] **RUNES-05**: The two known context bugs are fixed — `candidateContext.questionBlocks` `getApplicableQuestions` missing `entityType`; `userData.save()` silently skipping `termsOfUseAccepted: null`.

### svelte-check / TypeScript → Zero (TYPE)

- [x] **TYPE-01**: The `qs` module ambient-declaration errors (8 × TS7016) are resolved (`@types/qs` or a `declare module` shim).
- [x] **TYPE-02**: The admin-jobs `+server.ts` `cookies`/fetch-event type-drift cluster (6 errors) is resolved.
- [x] **TYPE-03**: The `_spikes-017-019` leftover spike scaffolding (4 errors) is deleted.
- [x] **TYPE-04**: `supabaseDataProvider.ts` is typed against the generated Supabase types — its 79 errors (untyped `Json`/row shapes, possibly-null) are cleared without changing runtime behavior.
- [x] **TYPE-05**: `supabaseDataWriter.ts` and the rest of the Supabase adapter layer typecheck clean.
- [x] **TYPE-06**: The context-layer type errors are resolved — `adminContext.svelte.ts` (8), `candidateContext.svelte.ts` (6), `authContext.svelte.ts` (4).
- [x] **TYPE-07**: The long-tail of scattered 1-per-file route/util/component type mismatches (~25) is resolved.
- [x] **TYPE-08**: The `.test.ts` / `.spike` type errors (~19) are resolved (fix or remove dead scaffolding).
- [x] **TYPE-09**: The `apps/docs` a11y svelte-check warning is resolved (monorepo svelte-check = 0 warnings).
- [ ] **TYPE-10**: `apps/frontend` svelte-check passes with **0 errors / 0 warnings**, and the CI gate is flipped from "≤ 151 baseline" to "0 absolute".

## v2 Requirements

Deferred, tracked, not in this roadmap.

### Tooling / Typing

- **SEEDTYPE-01**: Strict per-collection row typing for dev-seed `Template` (throw on unknown props at type-check time) — an additive enhancement; dev-seed already has 0 type errors.

### Architecture

- **AUTHADP-01**: Migrate Supabase-specific auth code (login/logout/verifyOtp) from frontend routes into the Supabase adapters.
- **TENANT-01**: Per-instance `PUBLIC_PROJECT_ID` scoping in the frontend data provider (multi-tenant separation).
- **CAND-STORE-01**: Investigate migrating the candidate answer store to a more robust architecture.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Admin App feature/E2E coverage | Operator-excluded from this milestone's feature/E2E scope (Admin type errors ARE still cleared for TYPE-10). |
| Voter-side open-comment input (`customData.allowOpen`) | Not applicable to the voter app (operator decision) — removed from scope; reverses v2.9 SETTINGS-02. |
| Voter-side required-info enforcement (`customData.required`) | Not applicable to the voter app (operator decision) — removed from scope; reverses v2.9 SETTINGS-03. |
| FilterGroup OR-mode UI | Conditional on a pending product decision (no AND/OR toggle in the filter dialog). |
| Generalize candidate app → party app | Large product refactor; separate milestone. |
| i18n/Paraglide infra (baseLocale-vs-runtime divergence, per-tenant tree-shake) | i18n Stage-B infra; not a test/cleanup concern. |
| Luxembourg + Danish VAA fork reconciliation | Deltas unscoped; separate milestone. |
| `adapter-package-loading`, `configurable-mock-data`, `rename-admin-writer`, SQL linting | Dev-tooling/backend hygiene unrelated to the three themes. |
| `onMount`→`$effect` where NOT semantically equivalent | Only behavior-neutral migrations in scope; genuine lifecycle semantics retained. |

## Traceability

Each requirement maps to exactly one roadmap phase (see `.planning/ROADMAP.md` v2.14 section, Phases 118-132). New-feature work (UNBLK question inputs + alliance render + nominations fetch) and its dependent E2E are clustered at the end (Phases 129-130) per the operator directive; only UNBLK-03 (a default-seed tooling fix, not a new feature) stays in the front fixtures phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EPERM-01 | Phase 120 | Complete |
| EPERM-02 | Phase 120 | Complete |
| EPERM-03 | Phase 120 | Complete |
| EPERM-04 | Phase 120 | Complete |
| EPERM-05 | Phase 120 | Complete |
| EPERM-06 | Phase 120 | Complete |
| EPERM-07 | Phase 120 | Complete |
| EPERM-08 | Phase 120 | Complete |
| EPERM-09 | Phase 120 | Complete |
| EPERM-10 | Phase 120 | Complete |
| EPERM-11 | Phase 120 | Complete |
| EFLOW-01 | Phase 121 | Complete |
| EFLOW-03 | Phase 121 | Complete |
| EFLOW-04 | Phase 121 | Complete |
| EFLOW-05 | Phase 121 | Complete |
| EFLOW-06 | Phase 121 | Complete |
| EFLOW-07 | Phase 121 | Complete |
| EFLOW-08 | Phase 121 | Complete |
| EFLOW-09 | Phase 121 | Complete |
| EFLOW-11 | Phase 121 | Complete |
| EFLOW-10 | Phase 122 | Complete |
| RUNES-01 | Phase 123 | Complete |
| RUNES-02 | Phase 123 | Complete |
| RUNES-05 | Phase 123 | Complete |
| RUNES-03 | Phase 124 | Complete |
| RUNES-04 | Phase 124 | Complete |
| TYPE-01 | Phase 125 | Complete |
| TYPE-02 | Phase 125 | Complete |
| TYPE-03 | Phase 125 | Complete |
| TYPE-04 | Phase 126 | Complete |
| TYPE-05 | Phase 127 | Complete |
| TYPE-06 | Phase 127 | Complete |
| TYPE-07 | Phase 128 | Complete |
| TYPE-08 | Phase 128 | Complete |
| TYPE-09 | Phase 128 | Complete |
| UNBLK-03 | Phase 119 | Pending |
| UNBLK-01 | Phase 129 | Complete |
| UNBLK-02 | Phase 129 | Complete |
| UNBLK-04 | Phase 129 | Complete |
| UNBLK-05 | Phase 129 | Complete |
| UNBLK-06 | Phase 129 | Complete |
| EQTYP-01 | Phase 130 | Complete |
| EQTYP-02 | Phase 130 | Complete |
| EQTYP-03 | Phase 130 | Complete |
| EFLOW-02 | Phase 130 | Pending |
| HARDN-01 | Phase 131 | Pending |
| HARDN-02 | Phase 132 | Pending |
| TYPE-10 | Phase 132 | Pending |

**Structural phase (no requirement ownership — operator-mandated E2E audit-first ordering):**

| Phase | Role |
|-------|------|
| Phase 118 — E2E Coverage Audit + Coverage Plan | Approval-gate deliverable (no test code); produces the coverage map + full spec/seed/semantic-step/fixture plan — including the deferred-build end-cluster specs (EQTYP-01/02/03, EFLOW-02, the nominations spec, the EPERM-03 alliance-presence slice) — that Phases 120-122 and 130 execute. |

**Cross-phase notes (criteria, not REQ-ID ownership — no double-mapping):**

- The **EPERM-03 alliance-presence sub-assertion** is built in Phase 130 (its REQ-ID maps to Phase 120 for the candidate/org bulk).
- The **`/nominations`-route E2E assertion** lands in Phase 130 as a success criterion tied to the UNBLK-04 feature (the UNBLK-04 REQ-ID maps to Phase 129, the build phase).

**Coverage:**

- v1 requirements: 48 total (EPERM 11 · EFLOW 11 · EQTYP 3 · UNBLK 6 · HARDN 2 · RUNES 5 · TYPE 10)
- Mapped to phases: 48 (100%) ✓
- Unmapped: 0 ✓
- No requirement maps to more than one phase ✓
- Per-phase REQ counts: 119 → 1 (UNBLK-03) · 120 → 11 (EPERM) · 121 → 9 (EFLOW) · 122 → 1 (EFLOW-10) · 123 → 3 (RUNES) · 124 → 2 (RUNES) · 125 → 3 (TYPE) · 126 → 1 (TYPE-04) · 127 → 2 (TYPE) · 128 → 3 (TYPE) · 129 → 5 (UNBLK) · 130 → 4 (EQTYP 3 + EFLOW-02) · 131 → 1 (HARDN-01) · 132 → 2 (HARDN-02 + TYPE-10). Sum = 1+11+9+1+3+2+3+1+2+3+5+4+1+2 = 48 ✓

---
*Requirements defined: 2026-06-14*
*Last updated: 2026-06-14 after roadmap revision (new-feature work + dependent E2E moved to the end cluster, Phases 129-130; UNBLK-03 folded into the front fixtures phase 119; renumbered 118-132; 48/48 requirements covered)*
