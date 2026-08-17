# Phase 129: New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the coverage-unblocking product features (UNBLK-01/02/04/05/06): a MultipleText input component, a number-scale opinion input + matching dispatch, a multi-choice categorical opinion variant (input + matching), the `/nominations` route question-data fetch, and the residual alliance-render gap in voter results. Per the operator-approved Phase 118 coverage plan (119.4 override), **fixtures and seed additions ship in this phase alongside the features** — Phase 130 authors specs only. The new number-scale and multipleChoiceCategorical opinion questions go directly into the MAIN question category of `e2e/base` (non-additive placement), and the resulting voter-journey re-baselines land here too so the suite is green at phase close (E2E cardinal rule).

**Codebase reality (scouted 2026-07-17):**
- `OpinionQuestionInput.svelte` is the single dispatch site for **both** voter and candidate opinion answering — number + multi-choice branches there fix both apps at once. Unsupported types currently render an inline `error.unsupportedQuestion`.
- `NumberQuestion` in `@openvaa/data` is already fully matchable — only the input UI + seed authoring are missing.
- `MultipleChoiceCategoricalQuestion` exists but has a literal `// TODO: Implement for matching` — the matching engine already supports categorical subdimensions, so the gap is only the data-class implementation.
- `MultipleTextQuestion` is non-matchable by design; `QuestionInput.svelte` (info-question dispatch) currently **throws** for it.
- **Alliance render is largely pre-built (Phase 69):** `EntityCard` has an alliance branch rendering member-org subcards in-card, `EntityDetails` has the member-orgs children tab, results routes accept `alliances`, and the matching cascade (org→alliance imputation) exists. Yet the Phase-118 audit (2026-06-14) verified alliances don't render in voter results against `e2e/base` — the residual gap is unknown (plausibly seed wiring, a settings/`results.sections` gap, or the `EntityCard` settings-type TODO).
- `/nominations` fix is a one-loader change: `nominations/+layout.ts` fetches only nomination data; adding `getQuestionData({ locale })` gives parity with `(located)/+layout.ts`.

**Out of bounds:** The nominating-org display in candidate profile (deferred — own RPC + type-regen slice), the parent-answer-imputation rewrite (structural refactor, explicitly out of alliance-ship scope), and all Phase 130 spec authoring.

</domain>

<decisions>
## Implementation Decisions

### MultipleText input (UNBLK-01)
- **D-01 — Row list with add/remove buttons + reordering.** One text input per value bound to `Array<string>`, "+ add" button, per-row remove — matching the todo sketch and existing Input primitive conventions. **Model on the existing multi-select categorical to implement reordering as well** (user note). Used for candidate INFO questions; voters only see values rendered on the entity-detail info tab.
- **D-02 — Min/max item-count question settings.** No hard limit by default; empty rows dropped on save. **Add `min`/`max` question settings for controlling the number of items** (user note). If `min > 1`: render that many rows initially, prevent deletion below min, but still allow reordering.

### Number-scale opinion input (UNBLK-05)
- **D-03 — Slider (range input) with live numeric value label.** The common VAA idiom; works for any min/max span (`NumberQuestion` carries `min`/`max`); keyboard-accessible arrows give exact-value control — this is the locator/interaction contract the Phase-130 `answerNumberScale(question, value)` fixture builds on.
- **D-04 — Display mode: same slider rendered read-only with both markers (voter + entity).** `OpinionQuestionInput`'s `mode='display'` is reused by `EntityOpinions` — mirrors how Likert answers display today. EQTYP-02 asserts this surface in Phase 130.

### Multi-choice categorical opinion variant (UNBLK-02)
- **D-05 — Extend `QuestionChoices` with a multi-select (checkbox semantics) mode.** Keeps one choice-rendering component; the fixture's `question-choice` locator contract carries over (explicitly wanted by the coverage plan).
- **D-06 — Matching: binary-subdimension extension per the existing categorical reference impl.** Each selected choice's subdimension = 1, unselected = 0, distance normalized over subdimensions — consistent with `packages/matching`'s documented paradigm; no new engine code. Fills the `// TODO: Implement for matching` in `multipleChoiceCategoricalQuestion.ts`.
- **D-07 — Selection constraints: zero-as-unanswered by default, PLUS optional min/max selection counts via questionSettings.** When min/max is specified, the component shows info text: "Select 2 to 3 options." / "Select 2 options." (localized). **Candidate app: disable saving while outside min/max. Voter app: keep the action button as Skip while outside min/max** (user note).

### Alliance render (UNBLK-06)
- **D-08 — Research-first.** Phase 129 research pins the exact residual gap (seed wiring? `results.sections` settings gap? `EntityCard` settings-type TODO?) before planning; build only what's missing — do not re-build what Phase 69 shipped.
- **D-09 — Alliance card also shows a match score/gauge like org cards, if the existing org→alliance imputation cascade already produces alliance matches** (recommended-if-cheap accepted; likely mostly display wiring). Minimum bar regardless: alliance card in results sections, member orgs as clickable children in-card, working member-orgs drawer.
- **D-10 — Verify Alliance A ↔ member-org seed wiring in `e2e/base` renders correctly as part of UNBLK-06 verification in THIS phase**, so Phase 130 is assert-only (moved forward from the coverage plan's "confirm at 130 build time").

### Nominations route (UNBLK-04)
- **D-11 — Core fetch fix only.** Add `getQuestionData({ locale })` to `(voters)/nominations/+layout.ts` for parity with `(located)/+layout.ts`. The "display nominating organization in candidate profile" todo is **deferred** — it needs a new candidate-scoped RPC + supabase-types regen and is not required by any 129/130 requirement.

### Seed, fixtures & re-baselines
- **D-12 — Main-category seed placement (non-additive, locked by the Phase 118 coverage plan).** The new number-scale and multipleChoiceCategorical opinion questions go directly into the MAIN question category of `e2e/base`. The rigid-expectation re-baselines (`Answer 4` gate, 4→5+ score gauges, category counts, results-CTA boundary) are planned up-front work, not a fallback.
- **D-13 — Re-baseline edits to `voter-journey.spec.ts` land in Phase 129, same plan wave as the seed change.** The suite must be green at 129 close (cardinal rule); Phase 130 then only adds new assertions.
- **D-14 — Fixtures ship in Phase 129 alongside the features** (119.4 operator override). The input↔fixture locator contract (`question-choice` etc.) is pinned in the Phase 129 UI-SPEC.
- **D-15 — Default (demo) template parity.** Add one number-scale + one multi-choice opinion question to the `default` Finnish demo template too — the demo exercises everything the frontend supports.
- **D-16 — Fix `buildMinimal.ts` `defaultAnswerForQuestion` number-branch gap** (currently falls through to `{ value: '' }`) as part of the UNBLK-05 seed work.

### Process
- **D-17 — Separate UI-SPEC before planning** (129.2, locked): run `/gsd-ui-phase 129` after this discussion, before the planner — the phase has real visual surface (3 new inputs + alliance card). The UI-SPEC grounds the new inputs + alliance card in existing Button/Input/EntityCard conventions and pins the input↔fixture locator contract.
- **D-18 — Todo folding.** Folded into this phase: `2026-05-31-implement-multiple-text-question-input.md` (is UNBLK-01; includes baseV1/e2e-seed restore list + spec touchpoints), `2026-05-31-fix-nominations-route-fetch-all-questions.md` (is UNBLK-04; its spec pointer `voter-mega-journey.spec.ts:1128` is stale — spec renamed `voter-journey.spec.ts`), `2026-05-12-qspec-02-multi-choice-categorical-variant.md` (UNBLK-02's prior scope write-up; its E2E items are superseded by the Phase 118 plan, its component/matching/seed items apply). Deferred: see `<deferred>`.

### Claude's Discretion
- Exact slider implementation details (native `<input type=range>` vs styled wrapper) within DaisyUI/Tailwind conventions — UI-SPEC decides.
- Exact shape of the min/max questionSettings keys (`customData` vs typed settings extension) — researcher/planner picks the smallest honest extension consistent with `@openvaa/app-shared` question-settings conventions.
- Whether the alliance residual gap fix lands as seed change, settings change, or component fix — dictated by what research finds (D-08).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 129 entry (goal + 4 success criteria).
- `.planning/REQUIREMENTS.md` — UNBLK-01, UNBLK-02, UNBLK-04, UNBLK-05, UNBLK-06.
- `.planning/v2.14-E2E-COVERAGE-PLAN.md` — operator-approved 2026-06-14; source of the locked decisions (main-category placement, 119.4 fixtures-with-features override, 129.2 UI-SPEC mandate, Phase-130 spec paths).
- `.planning/phases/129-new-feature-build-question-inputs-alliance-render-nomination/129-130-DISCUSSION.md` — the filled batch discussion doc (source of all D-XX decisions).

### Question inputs (D-01..D-07)
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` (+ `.type.ts`) — single opinion-answer dispatch site for voter AND candidate apps; number + multi-choice branches go here; `mode='display'` reused by `EntityOpinions`.
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` (+ `.type.ts`) — extend with multi-select checkbox mode (D-05); carries the `question-choice` locator contract.
- `apps/frontend/src/lib/components/input/QuestionInput.svelte` (+ `.type.ts`) — info-question dispatch; currently throws for MultipleText; D-01 input lands here.
- `packages/data/src/objects/questions/variants/numberQuestion.ts` — already matchable; carries `min`/`max`.
- `packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.ts` — the `// TODO: Implement for matching` D-06 fills.
- `packages/data/src/objects/questions/variants/multipleTextQuestion.ts` — non-matchable by design.
- `packages/matching/` — categorical subdimension reference paradigm (single-choice categorical = the reference impl D-06 extends).

### Alliance render (D-08..D-10)
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` — alliance branch with in-card member-org subcards (Phase 69); settings-type TODO (submatches/card-content settings only typed for candidate/org) is a suspect for the residual gap.
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` — member-orgs children tab.
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte` — display-mode consumer for D-04.
- `.planning/milestones/` Phase 69 artifacts — what alliance work already shipped (avoid re-building).

### Nominations fetch (D-11)
- `apps/frontend/src/routes/(voters)/nominations/+layout.ts` — the one-loader fix site.
- `apps/frontend/src/routes/(voters)/(located)/+layout.ts` — the parity reference (`getQuestionData({ locale })`).

### Seed & fixtures (D-12..D-16)
- `packages/dev-seed/src/templates/base.ts` + `packages/dev-seed/src/templates/e2e/` — `e2e/base` template (main-category question additions).
- `packages/dev-seed/src/templates/default.ts` — Finnish demo template (D-15 parity additions).
- `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` — `defaultAnswerForQuestion` number-branch gap (D-16).
- `tests/tests/specs/voter/voter-journey.spec.ts` — rigid expectations to re-baseline (D-13): `Answer 4` gate, 4→5+ score gauges, category counts, results-CTA boundary.
- `tests/tests/utils/testIds.ts` — the E2E selector catalogue any new locators must be registered in.

### Folded todos (D-18)
- `.planning/todos/pending/2026-05-31-implement-multiple-text-question-input.md`
- `.planning/todos/pending/2026-05-31-fix-nominations-route-fetch-all-questions.md`
- `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md`

### Review gate
- `.agents/code-review-checklist.md` — mandatory per CLAUDE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OpinionQuestionInput.svelte` dispatch — one component fixes voter + candidate simultaneously; existing Likert/categorical branches are the pattern reference.
- Existing multi-select categorical UI (info-question side) — the reordering pattern D-01 models on.
- Phase 69 alliance render stack (EntityCard alliance branch, member-orgs drawer, results-route `alliances` param, org→alliance imputation cascade) — build only the missing residual.
- `e2e/base` template + existing fixture layer (Phase 119) — the seed/fixture substrate this phase extends.

### Established Patterns
- **E2E cardinal rule** — full-suite green at phase close; "did not run" counts as failure; fresh dev server on :5173 + `yarn db:reset` before the gate.
- **Context Destructuring Rule (Svelte 5)** — new components consuming contexts must follow the ctx.X reactive-accessor read pattern (CLAUDE.md).
- **Localization** — all new user-facing strings (incl. the min/max helper text "Select 2 to 3 options.") must support all 4 locales.
- **WCAG 2.1 AA** — slider keyboard accessibility and checkbox semantics are hard requirements, not polish.
- Atomic per-cluster commits for clean bisects (workstream convention).

### Integration Points
- Seed changes to `e2e/base` main category ripple into `voter-journey.spec.ts` expectations — D-13 couples them into the same wave.
- The `question-choice` locator contract couples `QuestionChoices` to the Phase 119 fixture layer — extending, not renaming, is the contract.
- `mode='display'` couples `OpinionQuestionInput` to `EntityOpinions` (entity-detail opinions tab) — the number-scale display marker work (D-04) is asserted by EQTYP-02 in Phase 130.
- New questionSettings keys (D-02, D-07) touch `@openvaa/app-shared` types consumed by both frontend and dev-seed.

</code_context>

<specifics>
## Specific Ideas

- MultipleText: reorder support modeled on the existing multi-select categorical; min > 1 renders min rows initially with deletion prevented but reordering allowed.
- Multi-choice min/max UX exact copy: "Select 2 to 3 options." / "Select 2 options." — candidate save disabled outside range; voter action button stays Skip outside range.
- The slider's keyboard-arrow exact-value control is a first-class requirement — the Phase-130 boundary-matching test (voter at min ranks the min-positioned candidate first) depends on driving exact values.
- UNBLK-06 is "find and close the residual gap", not a greenfield build — research output should name the gap precisely before any plan task builds anything.

</specifics>

<deferred>
## Deferred Ideas

- **`2026-05-31-display-nominating-org-in-candidate-profile-nominations.md`** — deferred (D-11): needs a new candidate-scoped RPC + supabase-types regen; its own slice, not required by 129/130 requirements.
- **`2026-05-09-rewrite-parent-answer-imputation.md`** — deferred (D-18): structural refactor, explicitly out-of-scope of the alliance ship per its own text.

</deferred>

---

*Phase: 129-new-feature-build-question-inputs-alliance-render-nomination*
*Context gathered: 2026-07-17*
