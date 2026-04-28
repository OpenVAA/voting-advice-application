# Phase 61: Voter-App Question Flow - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Milestone:** v2.6 Svelte 5 Migration Cleanup

<domain>
## Phase Boundary

Fix the voter-app question-flow defects surfaced during Phase 58 UAT and confirmed by Phase 60 execution: (1) boolean opinion questions render no answer controls (QUESTION-01), (2) candidate result-detail page lacks a boolean case in the match-breakdown switch (QUESTION-02), (3) category-selection screen defaults to no categories and the question counter is stuck at 0 due to a reactivity break (QUESTION-03). Also folded in: the 6 direct + 18 cascade `candidate-questions.spec.ts` testId-timeout failures handed off from Phase 60 (QUESTION-04, newly added — same reactivity class expected).

Scope covers QUESTION-01, QUESTION-02, QUESTION-03, QUESTION-04. Success measured by:
- Boolean opinion questions render an answer control and can be answered + advanced from.
- Candidate result-detail opens without error after a voter has answered a boolean question.
- Category selector has a sensible default (all opinion categories checked) and the question counter updates reactively on every toggle.
- `candidate-questions-list` / `candidate-questions-start` testIds become visible; the 6 direct `candidate-questions.spec.ts` tests pass; the 18 dependent cascade tests run and pass.

Out of scope for this phase: results-page consolidation (Phase 62), E2E carry-forward greening for unrelated data-race failures (Phase 63), new overlay architecture (future milestone), `fromStore()` bridge retirement (future milestone), SSR-guard sweep across unrelated utilities (Phase 60 follow-up).

</domain>

<decisions>
## Implementation Decisions

### Boolean Answer UI Pattern (QUESTION-01)

- **D-01:** Reuse the existing `QuestionChoices` grid with two synthesized pseudo-choices. Lowest-friction path — keeps voter visual language consistent with singleChoice ordinal/categorical; no new grid/layout component.
- **D-02:** Labels come from i18n defaults `common.yes` / `common.no`, with per-question override via `customData` (existing Question extensibility). No new content-model surface required.
- **D-03:** Synthesis happens in `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` — add an `isBooleanQuestion(question)` branch alongside `isSingleChoiceQuestion`. The branch creates two pseudo-choices (`{ id: 'yes', label: t('common.yes') }`, `{ id: 'no', label: t('common.no') }`) and delegates to `QuestionChoices`. `@openvaa/data`'s `BooleanQuestion` type stays pure — the UI layer handles the choice-synthesis, not the data layer.
- **D-04:** Skip behavior is the same as ordinal — the existing skip affordance in `QuestionActions` continues to apply regardless of question type. Voters can still refuse to answer boolean questions.

### Boolean Match-Breakdown (QUESTION-02)

- **D-05:** **No matching-layer work needed.** `packages/data/src/objects/questions/variants/booleanQuestion.ts` already implements `_normalizeValue` (false→`COORDINATE.Min`, true→`COORDINATE.Max`) and inherits the default single-dimension subdimension shape. The matching algorithm in `@openvaa/matching` treats `BooleanQuestion` identically to a 2-point ordinal — Manhattan/Euclidean distance is already defined. **QUESTION-02 is purely a UI-layer dispatch fix.**
- **D-06:** Display via the extended singleChoiceOrdinal renderer path — add a `boolean` case alongside `singleChoiceOrdinal` and `singleChoiceCategorical` in the per-question match-breakdown component's type-switch. Render the boolean match using the same visual idiom singleChoiceOrdinal uses (two positions on a line, voter and candidate markers on `COORDINATE.Min` and `COORDINATE.Max`). Consistent voter experience; minimal UI work.
- **D-07:** Missing-side (unanswered) behavior matches ordinal — matching algorithm already skips unanswered questions via `isMissingValue`; breakdown UI renders the neutral/grayed state consistent with other question types. No new logic.

### Category Default + Reactivity (QUESTION-03)

- **D-08:** Default selection state is **all opinion categories checked** on a fresh voter session. This matches the ROADMAP SC-3 preference. **Bug investigation note:** the todo (`svelte5-cleanup.md §3`) reports that the current behavior sometimes manifests correctly and sometimes not — researcher must investigate the intermittent failure mechanism (likely a race between context initialization and the category-list render), not just implement the default. The fix is both a product decision (locked: all-checked) AND a debugging task (find why the current intent intermittently fails).
- **D-09:** Reactivity fix shape is `$derived` migration per the Phase 60 pattern. The todo points to `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — specifically the `_opinionQuestions` / `selectedQuestionCategoryIds` derivation chain. Replace any leftover `$:` or `$effect`-based derivation with `$derived`. If any store mutation happens inside an `$effect` during the fix, apply the Phase 60 `get(store) + untrack(() => store.update(...))` idiom to avoid `effect_update_depth_exceeded`.
- **D-10:** Counter scope — preserve the existing counting semantics (whatever the current code intends to count; executor does NOT reinterpret the counter). Fix only the reactivity bug so the counter updates on category toggle. If the intended semantics are ambiguous from the code, document the discovered semantic in SUMMARY.md but don't change it in this phase.
- **D-11:** Category-selection persistence is session-only — in-memory `$state` in the voter context. No `sessionStorage` or `localStorage` wiring in this phase. Selection resets when the session clears, matching how other voter-context state behaves.

### Folded Scope — Candidate-Questions TestId-Timeout (QUESTION-04)

- **D-12:** Fold the Phase 60 candidate-questions handoff into Phase 61 as a new requirement **QUESTION-04**. Previously out of strict voter-app scope, but same reactivity-class bug family. Phase 61 becomes "voter-app question flow + candidate-app question-list reactivity". REQUIREMENTS.md is updated to add QUESTION-04; ROADMAP.md Phase 61 Requirements line updated to include QUESTION-04.
- **D-13:** Plan QUESTION-04 as a sibling to the voter-context reactivity fix (D-09). Strong prior: the same `$derived`/`$effect` patterns that broke in `voterContext.svelte.ts` probably broke in `candidateContext.svelte.ts` (or the candidate questions page). If researcher/planner diagnoses a different root cause (e.g., a pure testId-visibility issue rather than reactivity), they may split the plans — but the starting hypothesis is "same class".
- **D-14:** New requirement ID is **QUESTION-04** in REQUIREMENTS.md, extending the existing QUESTION cluster. Text: "Candidate-app question-list reactivity is restored — the `candidate-questions-list` and `candidate-questions-start` testIds become visible within Playwright's default timeout on the candidate questions route, so the 6 direct `candidate-questions.spec.ts` tests pass and their 18 dependent cascade tests (candidate-app-mutation / candidate-app-settings / candidate-app-password / re-auth-setup) run and pass."

### Claude's Discretion

- Exact plan split within the phase (one plan per REQ-ID vs grouped). Planner decides based on file-overlap and wave parallelism. Starting suggestion: Plan 61-01 (boolean rendering: QUESTION-01 + QUESTION-02, both UI-layer dispatch fixes in closely-related files), Plan 61-02 (category reactivity: QUESTION-03, voter-context $derived migration), Plan 61-03 (candidate-questions testId diagnosis + fix: QUESTION-04).
- Diagnostic depth before coding for D-08's intermittent-failure aspect. Researcher/planner may allocate a short investigation block before committing to the fix shape.
- Whether the D-14 QUESTION-04 work produces one plan or splits into diagnosis-plan + fix-plan based on diagnosis outcome.
- Exact test-ID identifiers used for the D-01 boolean input if Playwright coverage expands during execution (e.g., `opinion-question-input` already exists; sub-testId for the Yes/No pseudo-choices can be planner discretion).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements

- `.planning/ROADMAP.md` §Phase 61 — Goal, Depends on, Requirements (QUESTION-01/02/03, QUESTION-04 after update), Success Criteria 1-3
- `.planning/REQUIREMENTS.md` §QUESTION — requirement text for QUESTION-01/02/03; QUESTION-04 added during this discussion; §Out of Scope
- `.planning/phases/60-layout-runes-migration-hydration-fix/post-change/diff.md` §Phase 61 handoff — the 6 direct + 18 cascade candidate-questions failures cited for QUESTION-04
- `.planning/phases/60-layout-runes-migration-hydration-fix/60-VERIFICATION.md` — LAYOUT-02 verification evidence (confirms the hydration fix is the foundation Phase 61 builds on)

### Bug Context & Prior Investigation

- `.planning/todos/pending/svelte5-cleanup.md` — Phase 58 UAT findings (QUESTION-01/02/03 repros); §3 explicitly notes the voter-context derivation chain is the likely QUESTION-03 site

### Target Files (Voter App — QUESTION-01/02/03)

- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` — QUESTION-01 refactor target (add `isBooleanQuestion` branch on line 61)
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` — reused for boolean rendering via synthesized pseudo-choices
- `apps/frontend/src/lib/components/input/QuestionInput.svelte` — reference: already has `[QUESTION_TYPE.Boolean]: 'boolean'` wired on line 49 for info questions (the gap is only the opinion path)
- `packages/data/src/objects/questions/variants/booleanQuestion.ts` — confirmed matching-ready (no change needed); read for understanding
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/[questionId]/+page.svelte` — voter question page (dispatches to OpinionQuestionInput)
- Candidate result-detail match-breakdown component (location TBD — planner to locate via grep for the `singleChoiceOrdinal`/`singleChoiceCategorical` type-switch; QUESTION-02 target)
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — QUESTION-03 target; `_opinionQuestions` / `selectedQuestionCategoryIds` derivation chain
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/category/+page.svelte` — category picker page (QUESTION-03 UI side)
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/category/[categoryId]/+page.svelte` — category detail page

### Target Files (Candidate App — QUESTION-04)

- `apps/frontend/src/routes/candidate/(protected)/questions/` (directory) — candidate questions route; start of QUESTION-04 investigation
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` (likely) — parallel to voterContext; possible QUESTION-04 reactivity site
- `tests/tests/specs/candidate/candidate-questions.spec.ts` — 6 direct failing tests; testIds to restore: `candidate-questions-list`, `candidate-questions-start`

### Prior-Phase Patterns (read for pattern reuse)

- `apps/frontend/src/routes/+layout.svelte` — Phase 60 reference: `$derived.by()` validation + dedicated `$effect` for store writes + `get(store) + untrack()` idiom
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` — Phase 60 reference: same pattern applied to candidate-protected layout
- `.planning/phases/60-layout-runes-migration-hydration-fix/60-CONTEXT.md` D-01/D-03 — pattern origin
- `.planning/phases/60-layout-runes-migration-hydration-fix/60-RESEARCH.md` §Common Pitfalls — `effect_update_depth_exceeded` root cause + fix

### E2E Surfaces

- `tests/tests/specs/candidate/candidate-questions.spec.ts` — QUESTION-04 gate; 6 direct tests + 18 cascade
- `tests/tests/specs/voter/` — QUESTION-01/02/03 E2E coverage: existing voter tests + possibly new cases for boolean + category-default
- `tests/playwright.config.ts` — Playwright config at repo root; invoke via `yarn playwright test -c ./tests/playwright.config.ts <spec> --workers=1`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`QuestionChoices.svelte`** — the component QuestionChoices grid already handles yes/no pseudo-choices via its existing props (no changes needed to it; only OpinionQuestionInput needs the synthesis branch).
- **`isBooleanQuestion` type guard from `@openvaa/data`** — verify it exists (same cluster as `isSingleChoiceQuestion`, `isMultipleChoiceQuestion`). If missing, add it as a small helper next to the existing guards.
- **i18n keys `common.yes` / `common.no`** — verify existence in `packages/app-shared` locale files. Should already be present; if not, add them as part of QUESTION-01 work.
- **`BooleanQuestion.ensureValue`** — already boolean-safe; reuse in OpinionQuestionInput if needed to normalize answer values.
- **`$derived` + `$effect` split pattern from Phase 60** — proven idiom for runes-mode reactivity. Reuse for QUESTION-03 and QUESTION-04.
- **`get(store) + untrack(() => store.update(...))` idiom** — Phase 60's fix for `effect_update_depth_exceeded`. Apply if the fix involves store mutation from an effect.
- **Existing `logDebugError` and `ErrorMessage` components** — preserve error-path rendering for unsupported question types; the boolean branch removes the need for the existing error fallback on the boolean path, but the fallback stays for genuinely unsupported types.

### Established Patterns

- **Type-switch via type guards, not string comparison:** `isSingleChoiceQuestion(question)` / `isBooleanQuestion(question)` / `isMultipleChoiceQuestion(question)` — the codebase consistently uses type guards rather than `question.type === 'boolean'` string checks. Preserve.
- **Opinion vs info question separation:** `OpinionQuestionInput` is a distinct path from `QuestionInput`. The boolean fix for voter opinion flow lives in `OpinionQuestionInput`; `QuestionInput` is already boolean-aware for info questions.
- **Matching-interface contract in `@openvaa/data`:** every Matchable question exposes `_normalizeValue` returning `CoordinateOrMissing`. `@openvaa/matching` consumes this without knowing the underlying question type. D-05 leverages this: boolean match is already matching-layer-complete.
- **Testid convention:** `data-testid="opinion-question-input"` wraps the OpinionQuestionInput root element. Playwright specs query by these testIds. New testIds for Yes/No pseudo-choices should follow the `opinion-question-input-<choiceId>` or `opinion-question-yes` / `-no` convention (planner discretion).

### Integration Points

- **Voter flow:** `/questions` → `/questions/category` → `/questions/[questionId]` → `/results` → `/results/[candidateId]`. QUESTION-01 affects `/questions/[questionId]`; QUESTION-02 affects `/results/[candidateId]`; QUESTION-03 affects `/questions/category`.
- **Candidate flow:** `/candidate/questions` — QUESTION-04 target. Depends on the protected candidate layout (Phase 60 fix) already rendering correctly.
- **Voter context:** `voterContext.svelte.ts` drives category selection, answer state, and matching input. Both QUESTION-03 and the boolean work read from this context.
- **Seed coverage:** default template has 1 boolean + 18 ordinal + 5 categorical = 24 opinion questions. E2E template has 17 opinion questions. Exercising the full flow against the default seed validates all branches end-to-end.

</code_context>

<specifics>
## Specific Ideas

- **Matching-layer is DONE for boolean** (user correction during discussion — verified against `booleanQuestion.ts`). Phase 61 does NOT touch `@openvaa/matching` or `@openvaa/data`. This is a narrow UI + reactivity fix.
- **QUESTION-03 is a bug with intermittent manifestation** — the correct behavior (all-checked default) manifests sometimes and not others. Researcher must characterize the failure mode, not just implement the "happy path" default. Likely a race between voter-context initialization and the category-list component's initial render.
- **QUESTION-04 is a hypothesis fold** — the candidate-questions testId-timeout is classified "same reactivity class" as a working hypothesis, not a proven diagnosis. Researcher/planner should validate this hypothesis first and split plans if the root cause differs.
- **Pattern reuse:** Phase 60's `$derived` + `$effect` split + `get(store) + untrack()` idiom is proven in production (both layouts). Phase 61 reuses these patterns for QUESTION-03 and QUESTION-04.

</specifics>

<deferred>
## Deferred Ideas

- **Admin-configurable category defaults.** D-08 picks "all checked" as the locked default; making the default admin-configurable (via `app_customization`) is a potential future feature, not Phase 61 scope.
- **Cross-session category-selection persistence (localStorage).** D-11 picks session-only; persistent preferences could be added later if voter research supports the UX.
- **Dedicated boolean UI (two big buttons) or slider/toggle.** D-01 picks the QuestionChoices-grid reuse; a dedicated boolean component is deferred unless the shared grid proves insufficient.
- **Agree/Disagree framing** (as opposed to Yes/No). D-02 locks Yes/No from `common.yes`/`common.no`; a future UX pass could adopt agree/disagree framing.
- **Dedicated subdimension for boolean** (2-way categorical treatment). D-05 confirms boolean uses the existing single-axis ordinal subdim; splitting into dedicated subdims is deferred (over-engineered for binary).
- **New `REACTIVITY` REQ-ID cluster.** D-14 locks `QUESTION-04` in the existing QUESTION cluster; a dedicated reactivity cluster could be introduced later if more reactivity-class bugs surface across apps.
- **Test-ID visibility issue as an alternative hypothesis for QUESTION-04.** D-13 picks the expected-same-reactivity-class hypothesis; if diagnosis shows missing/renamed testIds instead, the fix may be much smaller — researcher/planner decides.

### Reviewed Todos (not folded)

None — `svelte5-cleanup.md` is directly the source of QUESTION-01/02/03; no other pending todos matched Phase 61 scope beyond the QUESTION-04 fold.

</deferred>

---

*Phase: 61-voter-app-question-flow*
*Context gathered: 2026-04-24*
