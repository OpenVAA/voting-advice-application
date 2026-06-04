# Plan 88-04 — Research

**Researched:** 2026-05-27
**For:** /gsd-plan-phase Plan 88-04 (T3–T9 fixtures + spec refactor)
**Authoritative scope:** [88-04-SCOPE.md](./88-04-SCOPE.md)
**Status:** Complete

## Summary (5 lines)

1. **R-1 ADR resolution:** Recommend **Option A** (load-time resolver) with the resolver site at `apps/frontend/src/lib/utils/entityCards.ts:25-32` (the only `QuestionInCardContent` consumer in the runtime tree). The current `dataRoot.getQuestion(id)` call is replaced with a `getQuestionId(q, $dataRoot)` discriminator. No adapter changes; no DataRoot API additions needed because the Supabase adapter ALREADY hydrates `Question.id` from the DB UUID. Trade-off vs Option B: Option B's seed-time precedent at `packages/dev-seed/src/supabaseAdminClient.ts:243-315` (`importAnswers`) is structurally identical to what Option B would need, BUT Option A is preferred because (a) it keeps `dynamicSettings.type.ts` honest about author intent, (b) it surfaces `[ASSUMED]` external_ids at runtime where the error is loudest, and (c) it makes the same shape reusable for non-dev-seed authoring tools (admin UI, etc.).
2. **R-2 testid pre-flight:** Out of 3 SCOPE-called testids, **0 currently exist on the components the fixtures will key off.** `score-gauge`, `election-symbol`, and `entity-list-filter-badge` are all MISSING. Additional MISSING testids: filter dialog options, filter rows, filter reset/close buttons, member-cards container, sub-card distinction. Recommendation: lock a discrete Wave-1.5 testid-surgery task in PLAN (alongside T3) before T4 fixtures.
3. **R-3 baseV1 row-counts:** TIR3's counts (5 outer org-cards / 2 Party-BB members / 5 Party-AA members / 13 Regional cands / 2 Polar / 12 minus-CA-AA-Special / 1 years≥50 / 0 intersect / 1 Party=NoAnswer) all RECONCILE against the post-T2 baseV1 dataset. **One MAJOR divergence**: TIR3 expects 3 filter rows (Party + pick-multiple + years-of-experience) but the actual baseV1 declares `test-qu-info-boolean` as `filterable: true` (line 683) — runtime will likely render a 4th filter. Planner MUST decide whether to (a) bake `≥3` instead of `=3`, (b) drop `filterable:true` from boolean in a baseV1 edit, or (c) revise the TIR3 spec count to 4.
4. **R-3 secondary divergence:** TIR3 expects info-item values "Regional Election" / "Region North" / "Alliance A (AL-A)" but after T2's [<id>] rename the displayed strings are `[el-reg] Regional Election` / `[co-reg-n] Region North` / `[al-a] Alliance A`. The Alliance short_name "AL-A" lives in `short_name`, not in `name`, so "Alliance A (AL-A)" is composed at render time. Spec MUST use case-insensitive substring / regex match (e.g. `/Regional Election/i`) not exact equality.
5. **R-4 fixture partition:** Recommend **3 files** (`resultsPage.fixture.ts`, `entityFilters.fixture.ts` bundling dialog+filter, `entityDetails.fixture.ts`) + a NEW composition root `tests/tests/fixtures/views.ts` to avoid colliding with the existing Page-Object `tests/tests/fixtures/index.ts`. The TIR3 fixtures are FUNCTION-FIXTURES (return helper objects that operate on `page`), structurally distinct from the existing `voter.fixture.ts` / `voter-mega.fixture.ts` walk-fixtures. Bundling avoids `entityFilters` being a near-empty file that re-exports.

## Project Constraints (from CLAUDE.md)

Binding directives that affect this plan:

- **Svelte 5 context destructuring rule** — stable refs (`t`, `getRoute`, `appSettings`, `dataRoot`) MAY be destructured; reactive accessors (`opinionQuestions`, `matches`, etc.) MUST be read via `ctx.X` direct access. This is RELEVANT to T3 IF the resolver lands inside a `+page.svelte` or component that consumes `dataRoot` reactively. The recommended placement (`utils/entityCards.ts`) is a pure function that receives `dataRoot` as a parameter — destructure rule does NOT apply at the resolver site itself, but DOES apply at the EntityCard.svelte call-site (which already correctly reads `$dataRoot` via store-prefix).
- **TypeScript strict, no `any`** — type widening for `QuestionInCardContent` must use a tagged-union or optional-property discriminator, not `string & {}` tricks.
- **WCAG 2.1 AA** — testid additions must be data-attributes only (no role/label changes).
- **Code review checklist** — `/.agents/code-review-checklist.md`.
- **`commit_docs`** — not relevant to this research pass.

## R-1 — T3 ADR resolution

### Current state (grep evidence)

**`QuestionInCardContent` type — current shape** ([`packages/app-shared/src/settings/dynamicSettings.type.ts:344-357`](../../../packages/app-shared/src/settings/dynamicSettings.type.ts#L344-L357)):

```ts
export type QuestionInCardContent = {
  /**
   * The question's id.
   */
  question: string;   // ← currently typed as a single string, expected to be a DB UUID
  hideLabel?: boolean;
  format?: QuestionInCardContentFormat;
};
```

**The sole runtime consumer** ([`apps/frontend/src/lib/utils/entityCards.ts:25-34`](../../../apps/frontend/src/lib/utils/entityCards.ts#L25-L34)):

```ts
const questions = (appSettings.results?.cardContents?.[type] ?? []).filter(isQuestion).map((q) => {
  const { question: id, ...rest } = q as QuestionInCardContent;
  const question = dataRoot.getQuestion(id);   // ← throws if id is not a UUID-key in dataRoot.questions
  return { question, ...rest };
});
```

Called from `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:125-129`:
```ts
qs = getCardQuestions({ type, appSettings: $appSettings, dataRoot: $dataRoot });
```

**Other `cardContents` reads** (string-array-only — DO NOT touch question objects, so out of T3 scope):
- `EntityCard.svelte:123` — `.includes('submatches')` (literal-string membership check)
- `EntityCard.svelte:140` — `.includes('children')` (literal-string)
- `EntityCard.svelte:149` — `.includes('children')` (literal-string)
- `voterContext.svelte.ts:401-403` — scans `Object.entries(cardContents)` looking for `'submatches'` literal

The `submatches` and `children` literals are NOT `QuestionInCardContent` objects (the `isQuestion` filter at `entityCards.ts:36-38` discriminates by `'question' in value && typeof value.question === 'string'`). So **T3's surface is exactly ONE call site** at `entityCards.ts:27`.

**`DataRoot` — no external_id-keyed lookup** (verified via grep of `packages/data/src/root/dataRoot.ts`):
- `getQuestion(id: Id)` at line 388 takes the internal `Id` type — there is no `getQuestionByExternalId` or `byExternalId` method.
- Adding one would require schema-aware adapter changes (the data layer is currently external_id-agnostic).
- Confirmed via `grep -rnE "external_id|externalId" packages/data/src/` returning ZERO hits — the data layer is intentionally provenance-blind.

**Seed-time precedent for Option B** ([`packages/dev-seed/src/supabaseAdminClient.ts:243-315`](../../../packages/dev-seed/src/supabaseAdminClient.ts#L243-L315)):

The `importAnswers` method already does exactly what Option B would need: select questions by `external_id` IN `[...extIds]`, build a `Map<external_id, uuid>`, rewrite the consumer payload (in that case `candidate.answers`) with UUIDs. The structural blueprint exists; Option B would extract this Map-build into a shared helper and apply it to `app_settings.settings.results.cardContents.candidate[*].question` during `Writer.write()` (call site: `packages/dev-seed/src/writer.ts:173-181`, the `updateAppSettings` pass).

**The current baseV1 wiring** ([`packages/dev-seed/src/templates/baseV1.ts:202-211`](../../../packages/dev-seed/src/templates/baseV1.ts#L202-L211)):

```ts
results: {
  cardContents: {
    candidate: ['submatches'],   // ← TIR3 adds a 2nd entry: {question: 'test-qu-info-text'}
    organization: ['children'],
    alliance: ['children']
  },
  showFeedbackPopup: 180,
  showSurveyPopup: 500,
  sections: ['candidate', 'organization']
},
```

Note: the SCOPE memo refers to "baseV1.ts:~204" — the actual line for `candidate: ['submatches'],` is **204** ✓ confirmed.

The `test-qu-info-text` question external_id is declared at [`baseV1.ts:635-643`](../../../packages/dev-seed/src/templates/baseV1.ts#L635-L643):

```ts
{
  external_id: 'test-qu-info-text',
  type: 'text',
  name: { en: '[qu-info-text] Info: short biography.' },
  category: { external_id: 'test-qg-info' },
  ...
}
```

`[VERIFIED via grep]`

And the default value (every candidate gets it via `DEFAULT_INFO_ANSWERS`) at `baseV1.ts:246`:
```ts
'test-qu-info-text': { value: { en: 'Default candidate biography text.' } },
```

### Recommended option: **A (load-time, in-frontend resolver)** + rationale

**Decision:** Option A.

**Trade-off table (grounded in concrete code paths):**

| Dimension | Option A (load-time) | Option B (seed-time) |
|---|---|---|
| Type widening | `QuestionInCardContent.question: string` widened to `string \| { externalId: string }` discriminated union. Adapter-blind. | Type unchanged. Author intent (UUID vs external_id) is INVISIBLE in the type. |
| New code surface | ~10 lines: a `getQuestionId(q, dataRoot)` discriminator + a `findQuestionByExternalId(dataRoot, extId)` helper that walks `dataRoot.questions`. Pure-function, unit-testable. | ~30 lines: a `resolveCardContentsExternalIds(settings, client)` method on Writer, plumbed into the `updateAppSettings` pass. Coupled to Supabase client + project_id scoping. |
| Where errors surface | On first results-page render in the consuming app — loud, traceable. | At seed-time CLI run — also loud, but ALSO requires writing a new test path. |
| Reusability for admin UI | YES — the admin UI will eventually let humans wire `cardContents` by external_id. Option A's resolver becomes the canonical reader. | Partial — admin-UI saves would need to call the resolver too, OR the admin UI would write UUIDs directly (different UX). |
| Risk to non-test consumers | None — dev/prod seeds with UUID literals (none currently exist, but `e2e.ts:95+default.ts:246` use the string-only entries `['submatches']` / `['children']`) keep working: the discriminator falls through to the `string` branch. | None — UUID literals from the wire are still UUIDs after merge. |
| Reverse-direction breakage | Backend writes (admin UI in the future) that emit `{externalId: '...'}` payloads would land in the frontend WITHOUT round-tripping through dev-seed Writer. Option B silently FAILS in that path. | — |

**Why A wins:** the seed-time precedent (`importAnswers`) is for a DATA write path (candidate answers → DB), not a SETTINGS write path. Settings are read by both the frontend AND the future admin UI; encoding "external_id vs UUID" in the type and resolving at the consumer keeps every reader honest.

**Open question for discuss-phase:** if the operator prefers Option B for shipping-velocity reasons (smaller frontend diff, no type widening), the precedent is solid (`importAnswers` is well-tested) and the trade-off is acceptable for a TEST-data wiring task. This is operator's call.

### Type widening surface

**New shape for `QuestionInCardContent`** ([`packages/app-shared/src/settings/dynamicSettings.type.ts:344-357`](../../../packages/app-shared/src/settings/dynamicSettings.type.ts#L344-L357)):

```ts
export type QuestionInCardContent = {
  /**
   * Reference to the question whose answer is shown in the card. May be either:
   *  - a string DB id (`Id` / UUID) — the historical shape; or
   *  - an `{ externalId }` reference resolved at consumer-load time via
   *    `dataRoot.questions.find(q => q.externalId === ...)` (Phase 88 Plan 04, T3).
   *
   * The discriminator at the call site lives in `apps/frontend/src/lib/utils/entityCards.ts`.
   */
  question: string | { externalId: string };
  hideLabel?: boolean;
  format?: QuestionInCardContentFormat;
};
```

**Alternative shape (tagged-union — more explicit, less ergonomic):**

```ts
question: { id: string } | { externalId: string };
```

I recommend the **`string | { externalId: string }`** form (union of `string` with a discriminator object) because:
- Existing seed templates (`e2e.ts`, `default.ts`) that emit literal-string UUID-shape entries continue compiling unchanged.
- The new shape `{ externalId: 'test-qu-info-text' }` is self-documenting at the author site (no `type` field needed).
- `typeof q.question === 'string'` is a free type-discriminator.

### Resolver placement

**Recommended:** `apps/frontend/src/lib/utils/entityCards.ts:25-34` (the existing `getCardQuestions` function).

**Concrete patch shape:**

```ts
export function getCardQuestions({ type, appSettings, dataRoot }: ...): Array<...> {
  const questions = (appSettings.results?.cardContents?.[type] ?? [])
    .filter(isQuestion)
    .map((q) => {
      const { question: ref, ...rest } = q as QuestionInCardContent;
      const id = typeof ref === 'string' ? ref : resolveQuestionExternalId(dataRoot, ref.externalId);
      const question = dataRoot.getQuestion(id);
      return { question, ...rest };
    });
  return questions;
}

function resolveQuestionExternalId(dataRoot: DataRoot, externalId: string): Id {
  // dataRoot.questions is an Array<AnyQuestionVariant> — `externalId` is a field
  // on the DataObject base (verified via packages/data/src/objects/questions/base/question.ts:N).
  const match = dataRoot.questions.find((q) => q.externalId === externalId);
  if (!match) {
    throw new Error(
      `cardContents.candidate[*].question: external_id '${externalId}' not found in dataRoot.questions.`
    );
  }
  return match.id;
}

function isQuestion(value: unknown): value is QuestionInCardContent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'question' in value &&
    (typeof value.question === 'string' ||
      (typeof value.question === 'object' &&
       value.question !== null &&
       'externalId' in value.question &&
       typeof (value.question as { externalId: unknown }).externalId === 'string'))
  );
}
```

**Pre-condition the planner MUST verify** (Task 1 of T3): does the `AnyQuestionVariant` / `Question` class actually expose an `externalId` field at runtime? `[ASSUMED]` — based on the seed-time precedent. The planner should add a Task 0 grep:

```bash
grep -nE "externalId" packages/data/src/objects/questions/base/question.ts
```

If `externalId` is NOT on the question class, the resolver needs to come from elsewhere — likely the Supabase adapter's row-mapper at `apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts` (which already reads `external_id` columns) needs to be checked. **Defer this verification to Task 0 of the T3 wave — it's a 30-second grep.**

**SSR-safety:** `getCardQuestions` is called inside an `EntityCard.svelte` `$derived.by` block reading `$dataRoot` reactively (`EntityCard.svelte:127`). On SSR, `dataRoot` is hydrated by the page's `load` function. The resolver is pure (no `window` / `document` / `localStorage` access), so SSR-safe by construction.

### ADR draft outline (verbatim — planner uses this as the ADR task body)

```markdown
# ADR-88-04-01 — cardContents.candidate external_id resolution

**Status:** ACCEPTED (Phase 88 Plan 04, T3)
**Date:** 2026-05-27
**Deciders:** {operator name}, gsd-discuss-phase

## Context

TIR3 §"CHANGE SETTINGS" lines 21-29 calls for `cardContents.candidate` to accept
`{question: '<external_id>'}` so dev-seed templates can wire result-card content
by the stable bracket-token (`test-qu-info-text`) instead of the DB UUID that
only exists post-seed.

Two viable strategies:

- **Option A — load-time, in-frontend.** Widen `QuestionInCardContent.question`
  to `string | {externalId: string}`. The lone consumer at
  `apps/frontend/src/lib/utils/entityCards.ts:25-34` discriminates on the
  runtime shape and resolves `externalId → DataRoot.questions[i].externalId →
  question.id` lazily.
- **Option B — seed-time, in dev-seed Writer.** Keep the type as `string`. The
  Writer's `updateAppSettings` pass resolves `external_id → UUID` before the
  `merge_jsonb_column` RPC, mirroring the precedent at
  `packages/dev-seed/src/supabaseAdminClient.ts:243-315` (`importAnswers`).

## Decision

**Option A.**

Reasons (see RESEARCH.md R-1):

1. The author-intent (UUID vs external_id) is encoded in the type — the future
   admin-UI write path stays honest. Option B silently strips the distinction.
2. Smaller diff (~10 LoC, one call site, no adapter touches).
3. Errors surface at the consumer with a precise message; Option B's failures
   surface at seed-time but only in templates that USE the new shape.
4. The DataRoot already exposes `question.externalId` (verified via grep at
   {add commit-sha after T3 Task 0 verifies}). No new method on DataRoot.

## Consequences

**Positive:**
- Templates author `{externalId: 'test-qu-info-text'}` and read like English.
- No dev-seed coupling to settings-schema internals.

**Negative:**
- Frontend bundle gains ~10 LoC + the `resolveQuestionExternalId` walk is O(n)
  per render. Acceptable: `dataRoot.questions` is bounded (<100 in
  production, ~20 in baseV1).

**Open follow-ups:**
- v2.11+ may add an indexed `dataRoot.questionsByExternalId` lookup if profiling
  shows the linear walk matters. Not needed for this plan.

## Implementation

- Type: `packages/app-shared/src/settings/dynamicSettings.type.ts:344-357`
- Resolver: `apps/frontend/src/lib/utils/entityCards.ts` (existing file —
  edit `getCardQuestions` + add `resolveQuestionExternalId`)
- Wiring: `packages/dev-seed/src/templates/baseV1.ts:204`
- Tests: vitest unit-test for `getCardQuestions` covering both branches
  (string and {externalId}) + the not-found error path.
```

## R-2 — DOM testid pre-flight

### Existing testids relevant to T4 fixtures (filename:line)

| testid | File | Line | Registered in `testIds.ts`? |
|---|---|---|---|
| `entity-card` | `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` | 220 | `testIds.voter.results.card` (line 116) |
| `entity-card-title` | `EntityCard.svelte` | 245 | `testIds.voter.results.cardTitle` (line 117) |
| `voter-results-entity-tabs` | `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` | 384 | `testIds.voter.results.entityTabs` (line 120) |
| `voter-results-election-select` | `…/+layout.svelte` | 357 | `testIds.voter.results.electionAccordion` (line 122) |
| `voter-results-candidate-section` | `…/+layout.svelte` | 391 | `testIds.voter.results.candidateSection` (line 118) |
| `voter-results-party-section` | `…/+layout.svelte` | 393 | `testIds.voter.results.partySection` (line 119) |
| `voter-results-alliance-section` | `…/+layout.svelte` | 395 | NOT registered (testIds.ts missing entry — surfaces as Phase 88 follow-up; not blocking for 88-04) |
| `entity-list-controls` | `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` | 110 | NOT registered |
| `entity-list-search` | `EntityListControls.svelte` | 118 | NOT registered |
| `entity-list-filter` | `EntityListControls.svelte` | 128, 137 (active + inactive Button variants) | NOT registered |
| `entity-list-with-controls` | `EntityListWithControls.svelte` | 161 | NOT registered |
| `entity-details` | `EntityDetails.svelte` | 133 | NOT registered (consumed via raw string in voter-mega-journey) |
| `info-item` | `InfoItem.svelte` | 30 | NOT registered |
| `entity-opinion-question` | `EntityOpinions.svelte` | 43 | `testIds.voter.entityDetail.opinionQuestion` (line 132) |
| `voter-entity-detail-info/-opinions/-children` | `EntityDetails.svelte` | 150, 152, 156 | `testIds.voter.entityDetail.{infoTab,opinionsTab,childrenTab}` (lines 126-128) |
| `voter-missing-nominations-modal` | (elsewhere — referenced in voter-mega-journey) | — | `testIds.voter.missingNominationsModal` (line 97) |

### MISSING testids + recommended addition site

| testid (proposed) | Why fixture needs it | Recommended file:line | Proposed testIds.ts constant |
|---|---|---|---|
| `score-gauge` | T5 `expect submatches contain 4 score gauges` | `apps/frontend/src/lib/components/scoreGauge/ScoreGauge.svelte:62` (the outermost `<div>` — replace existing `class="vaa-score-gauge ..."` with `data-testid="score-gauge"` adjacent) | `testIds.voter.results.scoreGauge = 'score-gauge'` |
| `sub-matches` | Group anchor for "submatches are shown" assertion | `apps/frontend/src/lib/components/subMatches/SubMatches.svelte:28` (the outer `<div>`) | `testIds.voter.results.subMatches = 'sub-matches'` |
| `election-symbol` | T5 `election symbol "10"` assertion | `apps/frontend/src/lib/components/electionSymbol/ElectionSymbol.svelte:33` (the `<span>`) | `testIds.voter.results.electionSymbol = 'election-symbol'` |
| `entity-list-filter-badge` | T8 `getFilterButtonBadge()` — distinguishes 1-badge vs empty-badge state | `apps/frontend/src/lib/components/infoBadge/InfoBadge.svelte:24` (the outer `<div>`) — note: `InfoBadge` is shared; adding testid here affects every InfoBadge instance. **Alternative**: scope the testid by adding it at the `EntityListControls.svelte:130` snippet `{#snippet badge()}<InfoBadge text={numActiveFilters} />{/snippet}` — wrap the snippet body in a `<span data-testid="entity-list-filter-badge">…</span>`. Recommend the wrapper approach (no cross-cutting impact). | `testIds.voter.results.filterBadge = 'entity-list-filter-badge'` |
| `entity-filter-row` | T8 `getFilters() → expect Party, Info: pick multiple…, Info: years of experience` — needs to enumerate filter rows | `apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte:51` (the `<Expander>` — wrap in a `<div data-testid="entity-filter-row" data-filter-name={filter.name}>` OR pass via `<Expander data-testid="entity-filter-row">` if Expander forwards attrs) | `testIds.voter.results.filterRow = 'entity-filter-row'` |
| `entity-filter-option` | T8 `getOptions()` on enumerated filters (Party + pick-multiple) | `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:200` (the `<label class="label ...">` for each value-row — add `data-testid="entity-filter-option"`) | `testIds.voter.results.filterOption = 'entity-filter-option'` |
| `entity-filter-numeric-min` / `-max` | T8 `setNumberRange(50, null)` — needs distinct min/max slider locators | `apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte:87` (min `<input type="range">`) and line 93 (max `<input type="range">`) — add testid to each `<input>` | `testIds.voter.results.filterNumericMin = 'entity-filter-numeric-min'`, `filterNumericMax = 'entity-filter-numeric-max'` |
| `entity-filter-dialog` | T8 `openFilterDialog() / close() / reset()` — the Modal that wraps EntityFilters | `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte:163` (the `<Modal>` element — pass `data-testid="entity-filter-dialog"` if Modal forwards attrs; verify by reading `apps/frontend/src/lib/components/modal/Modal.svelte` first) | `testIds.voter.results.filterDialog = 'entity-filter-dialog'` |
| `entity-filter-dialog-reset` | T8 `dialog.reset()` — currently the Reset Button has no testid | `EntityListControls.svelte:172` (the Reset Button — add `data-testid="entity-filter-dialog-reset"`) | `testIds.voter.results.filterDialogReset = 'entity-filter-dialog-reset'` |
| `entity-filter-dialog-apply` | T8 `dialog.close()` — the "Apply and close" Button | `EntityListControls.svelte:171` (the apply Button — add `data-testid="entity-filter-dialog-apply"`) | `testIds.voter.results.filterDialogApply = 'entity-filter-dialog-apply'` |
| `entity-list-filter-button` (rename/clarify existing) | T4 `openFilterDialog()` needs ONE testid for the filter-trigger button. Currently `entity-list-filter` is set TWICE (once on active-state Button line 128, once on inactive-state Button line 137). Two Buttons with the SAME testid means `.first()` or `.nth(0)` is needed. Recommend keeping the existing testid (no rename) since the two Buttons render conditionally (only one ever in the DOM at a time). | (no change needed — document the conditional-rendering invariant in the fixture's docstring) | `testIds.voter.results.filterButton = 'entity-list-filter'` (just register the existing literal) |

### Additional testids needed for full fixture surface (T4)

These are testids the planner can either ADD or work around via role-based locators:

| Need | Workaround (no testid add) | testid add (preferred) |
|---|---|---|
| `getEntityTabs()` — enumerate tab list | `page.getByTestId('voter-results-entity-tabs').getByRole('tab')` — works | none needed |
| `selectEntityTab(orgs)` — click a tab | `entityTabs.getByRole('tab', { name: /parties|organizations/i })` — works | none needed |
| `selectElection(reg)` — click the regional election | The `voter-results-election-select` testid is on the accordion. Inner radio/option needs `getByRole('radio', { name: /Regional/i })` — needs DOM check. | none needed |
| `getEntityCards()` — outer cards only (no member-card descent) | `page.getByTestId('voter-results-candidate-section').getByTestId('entity-card')` works BUT `entity-card` is on BOTH outer and subcard (`EntityCard.svelte:220` sets it unconditionally). Need to filter by variant: subcards live under `<EntityCard variant="subcard">` (EntityCard.svelte:333). The subcard's `<article>` ALSO gets `data-testid="entity-card"`. **Solution:** add `data-testid="entity-card-subcard"` to the recursive `<EntityCard variant="subcard">` invocation (`EntityCard.svelte:333`) so the fixture can EXCLUDE subcards. OR: change the outer testid to `entity-card-outer` and the inner to `entity-card-sub` (more invasive). | `testIds.voter.results.cardSubcard = 'entity-card-subcard'` — added at `EntityCard.svelte:333` ONLY when `variant === 'subcard'` |
| `selectTab(info)` on entity-details | `page.getByRole('tablist').getByRole('tab', { name: /basic info/i })` — works, EXCEPT the i18n translation `entityDetails.tabs.info = 'Basic Info'` (entityDetails.json:6). Use the i18n value in fixture, NOT the SETTINGS keyword "info". | none — work via role + name |
| `getMemberCards()` — only the children cards inside `entity-details` `voter-entity-detail-children` tab | `page.getByTestId('voter-entity-detail-children').getByTestId('entity-card')` — works | none needed |
| `openEntityDetailsForCard(/Party AA/)` | `page.getByTestId('entity-card').filter({ hasText: /Party AA/i }).first().click()` — works (EntityCard `<article>` is the click target via its `EntityCardAction`) | none needed |
| `dismissAllDialogs()` — best-effort | Press Escape; check for Modal-class element; works. No testid needed. | none |
| `expectInfoItem(/Election/, /Regional Election/i)` | `page.getByTestId('info-item').filter({ hasText: /Election/i }).filter({ hasText: /Regional Election/i })` — works (info-item is shared label+value container) | optional: split `info-item-label` / `info-item-value` if assertions need precision |

### Aggregate addition burden

**Components touched (file count):** 6 — ScoreGauge, SubMatches, ElectionSymbol, InfoBadge (via wrapper at EntityListControls), EntityFilters, EnumeratedEntityFilter, NumericEntityFilter, EntityListControls (Modal + buttons), EntityCard (subcard variant).

**Recommendation:** ONE Wave-1.5 task in PLAN (between T3 and T4) titled "Add testids for fixture surface" that performs all additions atomically. Each addition is mechanically simple (one `data-testid=` attribute) and zero behavioural impact. Same posture as Phase 86.1 testid-sweep tasks — succinct, well-bounded.

## R-3 — baseV1 row-count reconciliation

### T6 counts — Regional Election org tab (5 / 2 / 5)

**Nominations under EL-Reg (test-el-reg), CO-Reg-N (test-co-reg-n)** — verified via [`packages/dev-seed/src/templates/baseV1.ts:1209-1392`](../../../packages/dev-seed/src/templates/baseV1.ts#L1209-L1392):

| External_id | Type | Parent |
|---|---|---|
| `test-nom-reg-n-or-aa` | Organization (Party AA) | AL-A |
| `test-nom-reg-n-or-ab` | Organization (Party AB) | AL-A |
| `test-nom-reg-n-or-ba` | Organization (Party BA) | AL-B |
| `test-nom-reg-n-or-bb` | Organization (Party BB) | AL-B |
| `test-nom-reg-n-or-c`  | Organization (Party C)  | (none — standalone) |

**Outer org-card count: 5** ✓ matches TIR3.

**Party AA candidates** (under `parent_nomination: test-nom-reg-n-or-aa`):

| External_id | first/last | Hidden? |
|---|---|---|
| test-nom-reg-n-ca-aa-special | "Special Candidate AA" | NO (terms_of_use_accepted set, baseV1.ts:873) |
| test-nom-reg-n-ca-aa-hidden  | "Hidden Candidate AA"  | YES (terms_of_use_accepted ABSENT, baseV1.ts:902 — `hideIfMissingAnswers` triggers) |
| test-nom-reg-n-ca-aa-1 | "Generic AA One"     | NO |
| test-nom-reg-n-ca-aa-2 | "Generic AA Two"     | NO |
| test-nom-reg-n-ca-aa-3 | "Generic AA Three"   | NO |
| test-nom-reg-n-ca-aa-4 | "Generic AA Four"    | NO |

**Visible Party-AA member count: 5** ✓ matches TIR3 "Show all 5 candidates" + post-collapse-expand "5".

Party BB candidates (under `test-nom-reg-n-or-bb`): test-nom-reg-n-ca-bb-1 ("Polar-Max BB One") + test-nom-reg-n-ca-bb-2 ("Generic BB Two") = **2 members** ✓.

**`maxSubcards` default = 3** (`EntityCard.svelte:68`). Party BB has 2 ≤ 3 → no "Show all" button. ✓
Party AA has 5 > 3 → "Show all 5 candidates" button shown. After click → all 5. ✓
Card text per TIR3 "expect card to be Party BB - Best-Regional-Party": baseV1.ts:485 — `name: { en: '[or-bb] Party BB - Best-Regional-Party' }` ✓ — the bracket prefix makes the spec a regex `/Party BB - Best-Regional-Party/i` (post-T2 text).

### T7 counts — Party AA organisation-details (5 members) + Info-item values

**Member-cards on Party AA's details `members` tab:** SAME 5 candidates as T6 above (hidden-filter applies the same way). ✓ matches TIR3 count 5.

**Info-item values** — DIVERGENCE vs TIR3:

| TIR3 says | Actual displayed text (post-T2) | Verified at |
|---|---|---|
| `Election / Regional Election` | `Election` / `[el-reg] Regional Election` | baseV1.ts:355 |
| `Constituency / Region North` | `Constituency` / `[co-reg-n] Region North` | baseV1.ts:414 |
| `alliance / Alliance A (AL-A)` | `Alliance` (or similar — label TBD) / `[al-a] Alliance A` + short_name "AL-A" rendered separately | baseV1.ts:508-509 |

**Action for planner:** assertions MUST be regex/substring (`/Regional Election/i`), NOT exact equality (`expect(...).toHaveText('Regional Election')`). The TIR3 spec is design intent — actual contract is the regex.

Alliance "(AL-A)" rendering — `short_name` is read separately. Whether the entity-details info-item value shows `[al-a] Alliance A (AL-A)` or only `[al-a] Alliance A` depends on how EntityInfo renders parent-nomination alliances. NOT verified at research time. **Action for planner:** Task 0 of T7 should be a "DOM dump" — open the details drawer for Party AA against a fresh baseV1 seed and copy the literal info-item text for each of the 3 keys. Lock the regex contract from THAT text.

**Tab labels (DIVERGENCE vs TIR3):** TIR3 says `expectTabs(info, members, opinions)` — actual i18n labels:
- `info` → "Basic Info" (entityDetails.json:6)
- `opinions` → "Opinions" (line 7)
- `children` → "Members" (line 5) — note: the SETTINGS keyword is `children`, the displayed tab name is "Members"

**Action for planner:** fixture `expectTabs([info, children, opinions])` should accept SETTINGS keywords as input, internally resolve via i18n. Alternative: take display strings directly. Recommend SETTINGS keywords for spec readability + an internal i18n lookup map.

### T8 counts — filters

**Total Regional cands (candidate tab, no filter):** 14 nominations under `test-el-reg / test-co-reg-n` whose row has `candidate:` set, MINUS CA-AA-Hidden (terms_of_use_accepted absent) = **13** ✓ matches TIR3.

**Polar / Polar-Min regex hit count:**
- "Polar-Min BA One" (test-ca-ba-1, baseV1.ts:962-964)
- "Polar-Max BB One" (test-ca-bb-1, baseV1.ts:983-985)
= **2** ✓ matches TIR3.

**Party = "No answer" count:** the only Regional candidate without a parent_nomination → no organization → 1. That's `test-ca-independent` ("Free Independent", baseV1.ts:1025-1027, nominated at baseV1.ts:1384-1392). = **1** ✓ matches TIR3.
- **TIR3 says first card name "Free independent"** — actual `first_name: 'Free' last_name: 'Independent'` → displayed name "Free Independent" (capital "I"). Spec should use `/Free Independent/i` regex (case-insensitive) ✓.

**multipleChoiceCategorical answers distribution** (`test-qu-info-multipleChoiceCategorical`):
- CA-AA-Special → `['c']` (baseV1.ts:894)
- All other candidates → DEFAULT `['a', 'b']` (baseV1.ts:244)

**`pick multiple, setSelection(/Choice A|B/)` count:** of 13 visible cands, 12 have ['a','b'] (which intersects with {A, B}) and 1 (CA-AA-Special) has ['c'] (does NOT intersect) → **12 visible, CA-AA-Special NOT visible** ✓ matches TIR3.

**Filter dropdown enumerated options for `pick multiple`:** `parseValues(targets)` returns unique values present in `targets` (13 visible cands → values `a`, `b`, `c`). Missing-value row NOT added (no candidate has a missing value for this question — `DEFAULT_INFO_ANSWERS` fills it). Result: **3 options** (A, B, C) ✓ matches TIR3.

**number filter (`years-of-experience`) options:**
- `NumericEntityFilter.svelte` renders min + max slider with text labels showing current values. The filter's `custom_data: { min: 0, max: 80 }` (baseV1.ts:672) hints don't override `parseValues(targets)` which scans actual data.
- Default value (all candidates): 42 (DEFAULT_INFO_ANSWERS, baseV1.ts:253)
- CA-AA-Special override: 99 (baseV1.ts:895 — but the candidate is at baseV1.ts:895 within `test-ca-aa-special`'s `answersByExternalId`)
- Therefore `parseValues` returns `{min: 42, max: 99}`.

**TIR3 expects `expect count 2 (min + max); expect to have text 42 and 99`** ✓ matches.

**setNumberRange(50, null) → 1 visible** (CA-AA-Special with years=99). All other 12 have years=42 < 50. **= 1** ✓ matches TIR3.

**Intersect (pick-multiple = A|B + years≥50):**
- A|B match: 12 (excludes CA-AA-Special with `['c']`).
- years≥50: 1 (only CA-AA-Special with 99).
- Intersection: 0 ✓ matches TIR3.

### MAJOR T8 divergence — filter row count

**TIR3 expects:** `getFilters() → expect Party, Info: pick multiple..., Info: years of experience` (3 rows).

**Actual baseV1 filterable questions:**
- `test-qu-info-multipleChoiceCategorical` — filterable:true (baseV1.ts:616)
- `test-qu-info-number` — filterable:true (baseV1.ts:672)
- **`test-qu-info-boolean` — filterable:true (baseV1.ts:683)** ← TIR3 does NOT mention this

Plus the implicit Party filter (always shown).

→ **4 filter rows likely** at runtime. The implicit Party filter is rendered by the filterStore — verification needed via `apps/frontend/src/lib/contexts/voter/filterStore.svelte.ts` (the planner should grep to confirm filter shape).

**Disposition options for the planner:**
1. **Patch baseV1 in Wave 0 of T8:** flip `test-qu-info-boolean.custom_data.filterable` from `true` to `false`. Smallest diff. Risk: breaks any spec that depended on a 3rd info filter (none expected — boolean filter is not exercised elsewhere).
2. **Update TIR3 spec count to 4 filters:** add a `expect(getFilters()).toHaveCount(4)` assertion. Acknowledges reality. Risk: TIR3's downstream cells in T8 only test 3 filters (Party + pick-multiple + years); a 4th boolean filter unused.
3. **Use `≥3`** matcher: weaker contract, but documents the design intent.

**Recommendation:** Option 1 — flip boolean filterable off. This is a 1-character edit to baseV1.ts and aligns with TIR3's apparent intent (3 filters is the design surface). The edit IS in T8's Wave-0 (operator-implied) baseV1-edit territory.

**Planner MUST surface this in PLAN.md must_haves block** so the operator can sign off before T8 executor wave.

### T9 — TEXT_RE consumer inventory

**`TEXT_RE` definition:** [`tests/tests/specs/voter/voter-mega-journey.spec.ts:75-124`](../../../tests/tests/specs/voter/voter-mega-journey.spec.ts#L75-L124) — 44 entries.

**Consumer count:** 44 `TEXT_RE.<key>` references in the spec body (lines 349-1217). Full inventory:

| Entry | First/canonical use line | KEEP/DROP after T5-T8 land |
|---|---|---|
| `partiesTab` | 782, 815, 1036, 1115 (× 4) | **KEEP** — fixture `selectEntityTab('orgs')` works via i18n role-based matcher; in non-fixture sites still useful |
| `candidateTab` | 786, 832, 1074, 1107, 1169 (× 5) | **KEEP** — same as above |
| `opinionsTab` | 879, 986, 1061 (× 3) | **KEEP** — entityDetails fixture `selectTab('opinions')` will use this internally |
| `infoTab` | 882 | **KEEP** — same |
| `membersTab` | 1052 | **KEEP** — entityDetails fixture `selectTab('children')` |
| `regional` | 773, 775 | **KEEP** — `resultsPage.selectElection(/Regional/i)` will use this |
| `opinion` | unused outside TEXT_RE def | **DROP** |
| `regionalElection` | unused outside TEXT_RE def | **DROP** (replaced by `regional`) |
| `municipal` | 774 | **KEEP** |
| `munSeSw` | unused outside TEXT_RE def | **DROP** |
| `filtMunNe` | unused outside TEXT_RE def | **DROP** |
| `filtPerQuestionSe` | unused outside TEXT_RE def | **DROP** |
| `filtMunSe` | unused outside TEXT_RE def | **DROP** |
| `regOnlyParents` | 623 | **KEEP** (used in the regions filtering check) |
| `munLeafNames` | 618 | **KEEP** |
| `northEast` | 640 | **KEEP** |
| `baseOpinion` | 668, 673, 688, 691 (× 4) | **KEEP** — pre-fixture spec body still iterates Base category by name |
| `optionalOpinionsA` | 677, 724, 754 (× 3) | **KEEP — needs update** to include the new prefix. After T2 the displayed text is `[qg-opin-opt-a-NotSelected] Optional Opinion Questions A`; the regex `/Optional Opinion Questions A/i` STILL matches as substring (verified). But the planner should TIGHTEN to `/\[qg-opin-opt-a-NotSelected\]/i` per TIR3 line 173. Same for `optionalOpinionsB`. |
| `optionalOpinionsB` | 677 (× 1, used via `text` lookup) | **KEEP — needs update** (see above) |
| `regionalOpinionsCategory` | 756 | **KEEP** |
| `regionallyFilteredCategory` | 763 | **KEEP** |
| `baseOpinion1Likert5` | 691 | **KEEP** |
| `baseOpinion5Boolean` | 734 | **KEEP** |
| `regionalOpinionsQuestion` | 761 | **KEEP** |
| `filtMunNeOpinion` | 764 | **KEEP** |
| `polarMax` | 854 | **DROP** (T5 EDIT step refactors result-card-contents to use fixtures + `entity-card` testid + `[ca-bb-1]` token from the candidate's first_name rendering — but baseV1's `first_name: 'Polar-Max'` is NOT bracket-prefixed; first/last names are the only baseV1 strings that did NOT get the `[<id>]` rename in T2 because they're authored fields not entity-name-display fields. So `polarMax` regex is still needed at the EDIT site. Re-classify: **KEEP**) |
| `polarMin` | 855 | **KEEP** (same reasoning as polarMax — first_name) |
| `answerCount` | 669 | **KEEP** |
| `matchPercent` | unused outside def | **DROP** |
| `perfectMatchTier` | unused outside def | **DROP** |
| `hiddenCandidate` | 861 | **KEEP** — hidden-candidate check still needed |
| `specialCandidate` | 857, 920 | **KEEP** — used in the voter-vs-entity matrix step |
| `neitherAnswered` | 1020 | **KEEP** — D4-case info-text assertion |
| `resultsRoute` | unused outside def | **DROP** |
| `resultsCandidatesOrRoot` | 1144 | **KEEP** |
| `resultsOrganizationsOrRoot` | 1116 | **KEEP** |
| `introRoute` | 551 | **KEEP** |
| `closeDialog` | 349 | **KEEP** — module-helper `dismissAllDialogs` site |
| `closeFiltersOrApply` | 400 | **KEEP** — module-helper site |

**Summary:** of 44 entries:
- **DROP entirely** (unused after T5-T8): 8 entries (`opinion`, `regionalElection`, `munSeSw`, `filtMunNe`, `filtPerQuestionSe`, `filtMunSe`, `matchPercent`, `perfectMatchTier`, `resultsRoute`)
- **KEEP, tighten with `[<id>]` prefix**: 2 entries (`optionalOpinionsA`, `optionalOpinionsB`) per TIR3 line 173-174 explicit ask
- **KEEP unchanged**: 34 entries

**Verdict on full TEXT_RE deletion:** NOT possible — 34 entries still consumed by spec body. T9 is a tightening pass, not a deletion pass.

**Planner action:** T9 task explicitly enumerate the 8 DROP entries (single-block deletion) + 2 TIGHTEN entries (regex update). T9 runs AFTER T5–T8 land. Final grep gate: `grep -cE "TEXT_RE\.<dropped-entry>" voter-mega-journey.spec.ts` returns 0 for each dropped entry.

## R-4 — Fixture partition recommendation

### Existing fixtures directory state

```
tests/tests/fixtures/
├── index.ts             — Page-Object composition root (existing)
├── voter-mega.fixture.ts — Walk-fixture (Phase 88 Plan 01)
└── voter.fixture.ts     — Walk-fixture (legacy Likert-only voter)
```

[`tests/tests/fixtures/index.ts`](../../../tests/tests/fixtures/index.ts) is the **Page-Object composition root** — it extends `base.test` with class-instance fixtures (HomePage, LoginPage, …) and re-exports `expect`. The new TIR3 fixtures are FUNCTION-STYLE (no class wrapping; helpers that take `page` and return narrow capability sets). Mixing the two styles in one `index.ts` is possible but cluttered.

The existing voter/candidate Page-Object pattern in `tests/tests/pages/{voter,candidate}/*.ts` is its OWN convention; the TIR3 fixtures should NOT replace those Pages but should COEXIST.

### Recommended partition: 3 files

**Recommendation:** **3 files** + a SEPARATE composition root.

```
tests/tests/fixtures/
├── index.ts                       — UNCHANGED (Page-Object composition root, legacy)
├── voter-mega.fixture.ts          — UNCHANGED (Phase 88 Plan 01 walk-fixture)
├── voter.fixture.ts               — UNCHANGED (Likert walk-fixture)
├── resultsPage.fixture.ts         — NEW (TIR3 — resultsPage helpers)
├── entityFilters.fixture.ts       — NEW (TIR3 — bundles entityFilters + entityFilterDialog + entityFilter)
├── entityDetails.fixture.ts       — NEW (TIR3 — entityDetails helpers)
└── views.ts                       — NEW composition root for the TIR3 fixtures
```

**Rationale for the 3-file partition (vs 5):**

1. **`entityFilter` (single filter row) and `entityFilterDialog` (modal-level) are tightly coupled** — `dialog.reset()` affects all `entityFilter` instances; `getFilter(name)` returns an `entityFilter`-shaped object that the same caller uses for `getOption`/`setSelection`. Splitting these into separate files makes the imports churn 3:1 for no readability win.
2. **`resultsPage` and `entityDetails` are semantically distinct surfaces** — different routes (`/results/...` vs `/results/.../<entity>/<id>`), different testid surfaces. Two files for two surfaces.
3. **`entityFilters` lives between them** but is conceptually "results-page filter chrome" — could fold into `resultsPage`. However, TIR3 explicitly names `entityFilters` as a separate fixture domain (lines 73-91), and the filter-dialog choreography (T8) is ~20 helpers vs `resultsPage`'s ~7 — separation earns its keep on LOC alone.

**Rationale for the SEPARATE composition root (`views.ts`):**

The existing `tests/tests/fixtures/index.ts` is the Page-Object root consumed by ~30 specs. The TIR3 fixtures are FUNCTION-FIXTURES with no class equivalents. Mixing both into `index.ts` would require:
- Either a single mega-`base.extend<...>` call mixing Page classes with function-helpers (works but obscures the boundary)
- Or two `test` exports from one file (confusing)

A separate `views.ts` allows:
```ts
// tests/tests/specs/voter/voter-mega-journey.spec.ts
import { test, expect } from '../../fixtures/views';
// vs
import { test, expect } from '../../fixtures';  // legacy Page-Object Pages
```

The two roots can later be merged in v2.11+ when the Page-Object specs migrate to function-fixture pattern. For 88-04 specifically, keeping them separate avoids touching 30 unrelated specs.

### Composition root shape (`views.ts`)

```ts
/**
 * Composition root for the TIR3 function-fixtures (Phase 88 Plan 04).
 *
 * Sibling to tests/tests/fixtures/index.ts (the legacy Page-Object root).
 * Consumed by voter-mega-journey.spec.ts (T5-T8) and any future perm-* /
 * variant-* specs that need the resultsPage / entityFilters / entityDetails
 * abstractions.
 */
import { expect, test as base } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createResultsPage } from './resultsPage.fixture';
import { createEntityFilters } from './entityFilters.fixture';
import { createEntityDetails } from './entityDetails.fixture';
import type { ResultsPageFixture } from './resultsPage.fixture';
import type { EntityFiltersFixture } from './entityFilters.fixture';
import type { EntityDetailsFixture } from './entityDetails.fixture';

type ViewFixtures = {
  resultsPage: ResultsPageFixture;
  entityFilters: EntityFiltersFixture;
  entityDetails: EntityDetailsFixture;
};

export const test = base.extend<ViewFixtures>({
  resultsPage: async ({ page }, use) => {
    await use(createResultsPage(page));
  },
  entityFilters: async ({ page }, use) => {
    await use(createEntityFilters(page));
  },
  entityDetails: async ({ page }, use) => {
    await use(createEntityDetails(page));
  }
});

export { expect };
```

Each `createX(page)` factory returns an object whose methods are bound to `page` — caller writes `resultsPage.selectElection(/Regional/i)` (no need to pass `page` per-call). This pattern is the Playwright community standard for function-fixtures and matches the SCOPE memo's signature spec.

**Type files:** each `*.fixture.ts` exports both `createX(page): XFixture` and `type XFixture = ReturnType<typeof createX>` — keeps fixture types co-located with implementation.

## Risks surfaced (carried into planner)

| ID | Risk | Mitigation handed to planner |
|---|---|---|
| **R-1** | T3 ADR Option A vs B decision unresolved | This RESEARCH.md recommends Option A. discuss-phase MUST ratify. If operator picks B, type widening section becomes inert and the resolver lands in `packages/dev-seed/src/writer.ts` `updateAppSettings` pass (precedent: `importAnswers`). |
| **R-2** | DataRoot.questions[].externalId may not exist at runtime | Planner adds Task 0 to T3 wave: `grep -n externalId packages/data/src/objects/questions/base/question.ts` — verify before resolver impl. If missing, Option A becomes more expensive (~50 LoC to add the field to question + adapter mapping) and Option B becomes preferable. |
| **R-3** | Boolean filter divergence: actual baseV1 declares 4 filterable info questions; TIR3 spec expects 3 | Planner adds Wave-0 baseV1 edit task: flip `test-qu-info-boolean.custom_data.filterable` to false. Operator sign-off needed in PLAN must_haves block. Alternative: revise T8 spec to assert 4 filters. |
| **R-4** | Info-item display values include `[<id>]` prefix after T2 — TIR3's literal expectations no longer hold | All info-item assertions in T7 MUST use regex/substring; planner specifies a Task 0 "DOM dump" of Party AA's details drawer against fresh baseV1 to lock the exact regex contracts. |
| **R-5** | Tab name divergence: SETTINGS keyword vs i18n display string | `entityDetails.selectTab(keyword)` MUST translate via i18n at fixture site, not at spec site. Lock the i18n map in `entityDetails.fixture.ts` doc-comment. |
| **R-6** | Subcard descent on `getEntityCards()` — testid `entity-card` set on BOTH outer + subcard `<article>` | Planner adds testid `entity-card-subcard` to `EntityCard.svelte:333` (subcard recursive call) in the Wave-1.5 testid-surgery task. Fixture `getEntityCards()` filters by `:not([data-testid="entity-card-subcard"])`. |
| **R-7** | `entity-list-filter` testid is set on TWO conditionally-rendered Buttons (active vs inactive state, lines 128 + 137) — `getByTestId('entity-list-filter')` returns variable count | Document in fixture docstring: only ONE of the two is in DOM at any time (conditional render); `.first()` is safe. No frontend change. |
| **R-8** | Filter button badge testid placement decision: shared `InfoBadge` (Modal, Button, others) vs wrapper at `EntityListControls:130` | Recommend wrapper approach — cross-cutting `InfoBadge` testid pollutes unrelated cells. |
| **R-9** | TEXT_RE deletion vs tightening confusion | T9 task spec MUST enumerate the 8 DROP keys + 2 TIGHTEN keys verbatim (per R-3 inventory above). No "drop everything" framing — leads to spec-body breakage. |
| **R-10** | Fixture coupling to baseV1 dataset (SCOPE R4) | Fixture method signatures take `name: RegExp \| string \| (count: number) => index` — NOT hardcoded `'Party AA'`. The "Party AA" string lives in spec body, not fixture body. Lock in PLAN must_haves block. |
| **R-11** | Modal forwards data-testid? | Verify before T4 — `apps/frontend/src/lib/components/modal/Modal.svelte` must forward `data-testid` via `concatProps` or spread. If not, the `entity-filter-dialog` testid lands on a wrapper `<div>` around the `<Modal>` invocation instead. |
| **R-12** | Election selector inner click — `voter-results-election-select` accordion is the testid for the OUTER container; selecting "Regional Election" requires `getByRole('radio', {name: /Regional/i})` or similar inside. Need to grep the accordion's child shape. | Planner adds Task 0 to T4: verify the election-selector child role + name shape. |
| **R-13** | Test environment availability — Playwright + Supabase + frontend dev server | Already in place — Phase 88 Plans 01-03 ran successfully. No new tooling needed. |
| **R-14** | Discuss-phase budget for R-1 + R-3 + R-4 | discuss-phase is REQUIRED (per SCOPE R6 + Phase 88 ROADMAP line 357). Budget for: T3 ADR ratification (R-1), boolean filter disposition (R-3), fixture-file partition sign-off (R-4). ~3 discrete decisions. |

## Open Questions

1. **`Question.externalId` runtime field existence** — `[ASSUMED]`. Planner Task 0 of T3 to verify via grep.
2. **`Modal` component data-testid forwarding** — `[ASSUMED]` it does. Planner Task 0 of T4 to verify.
3. **Election-selector accordion child role shape** — not researched. Planner Task 0 of T4.
4. **`Expander` component data-testid forwarding** — needed for `entity-filter-row` testid placement (R-2 table). Planner Task 0 of T4.
5. **Whether `package/dev-seed` Writer's `updateAppSettings` would need touching for Option A** — verified: NO. Option A is pure-frontend.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | `Question.externalId` exists as a runtime field on `AnyQuestionVariant` instances | R-1 resolver placement | Option A scope balloons; Option B becomes simpler |
| A2 | `Modal` and `Expander` Svelte components forward `data-testid` via `restProps` / `concatProps` | R-2 testid addition sites | Testids land on wrapper `<div>` siblings instead of the target elements; cosmetic-only impact on locator paths |
| A3 | `parseValues(targets)` for an enumerated filter excludes the missing-value pseudo-row when all targets have values | R-3 T8 pick-multiple count = 3 | If a missing-value row appears, count would be 4 — same R-3 boolean-filter mitigation applies |
| A4 | Hidden candidate `test-ca-aa-hidden` is filtered out at the rendering layer because `terms_of_use_accepted` is absent (NOT because of an explicit `hidden:true` flag) | R-3 visible-candidate counts | Counts shift if the hide mechanism differs — likely the `hideIfMissingAnswers` setting (dynamicSettings.type.ts:113-118) acts on `answers`, not `terms_of_use_accepted`. Planner Task 0 of T6: run baseV1 + load Regional Election + count visible cards. |
| A5 | Election-symbol `'10'` is rendered as text content of the `ElectionSymbol` `<span>` (not as an alt-text image) for the test-nom-reg-n-ca-bb-1 nomination | R-2 election-symbol testid use | If image-mode is on, the assertion needs `alt` matching instead of text matching — testid placement unchanged |
| A6 | First-position candidate card in the candidate-list (after voter answers `max` mode) is `test-ca-bb-1` ("Polar-Max BB One") with `election_symbol: '10'` | R-3 T5 EDIT-step setup | Verified via inspection of POLAR_MAX answer set (baseV1.ts:278-290) + the answer template at `withInfoAnswers(POLAR_MAX)`. NOT runtime-verified — Wave-1 verification recommended |

**Confirmation needed:** A1–A6 should be verified in Wave-0 (PLAN authoring) via single-line grep / quick-DOM-dump tasks before T3-T8 executor waves start.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js | All tasks | ✓ | (Yarn 4 workspace) | — |
| Yarn 4 | All tasks | ✓ | (committed) | — |
| Supabase CLI | T7+T8 DOM verification | ✓ | (per CLAUDE.md "yarn dev" path) | — |
| Playwright | All T4-T9 verification | ✓ | (apps/frontend + tests/) | — |
| `yarn db:seed --template baseV1` | T6+T7+T8 count verification | ✓ | T2's baseV1 verified at 135 rows (260527-nat-SUMMARY.md:115) | — |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Playwright (E2E) + Vitest (unit, where T3 resolver is unit-tested) |
| Config file | `tests/playwright.config.ts` (E2E) + `apps/frontend/vitest.config.ts` (unit) |
| Quick run command | `cd tests && npx playwright test --project=voter-mega-journey` |
| Full suite command | `yarn test:e2e` (full Playwright matrix per CLAUDE.md) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| T3-ADR | ADR doc committed under `88-04-ADR-…` before T4 starts | manual (review gate) | n/a | created in T3 Task 1 |
| T3-resolver | `getCardQuestions` accepts both `string` and `{externalId}` shapes | unit | `cd apps/frontend && yarn test:unit src/lib/utils/entityCards.test.ts` | ❌ Wave 0 — need new test file |
| T3-baseV1-wiring | baseV1.ts:204 cardContents.candidate includes `{externalId: 'test-qu-info-text'}` | integration (e2e — T5 EDIT step) | covered by T5 spec | covered |
| T4-fixtures-exist | 3 fixture files + views.ts compile | typecheck | `cd tests && npx tsc --noEmit -p .` | ❌ Wave 0 |
| T4-fixture-consumption | ≥3 cells consume fixtures | grep gate | `grep -cE "(resultsPage\.\|entityFilters\.\|entityDetails\.)" tests/tests/specs/voter/voter-mega-journey.spec.ts` ≥ 3 | covered by T5-T8 outputs |
| T5-edit | result-card-contents asserts test-qu-info-text answer + 4 score gauges + election symbol "10" | e2e | covered in voter-mega-journey project run | exists |
| T6-add | matching:organisations step asserts 5 outer cards + Party BB 2 children + Party AA 3+5 show-all/collapse | e2e | covered in voter-mega-journey project run | exists |
| T7-refactor | voter-vs-entity matrix uses fixtures + organisation details cell asserts 13 info-items + 5 members | e2e | covered in voter-mega-journey project run | exists |
| T8-add | filters:text (count 2 polar) + filters:dialog (1/13/12/1/0 choreography + badges) | e2e | covered in voter-mega-journey project run | exists |
| T9-cleanup | TEXT_RE has zero dead entries; `optionalOpinionsA/B` regex tightened | grep gate | `grep -cE "TEXT_RE\.(opinion\|regionalElection\|munSeSw\|filtMunNe\|filtPerQuestionSe\|filtMunSe\|matchPercent\|perfectMatchTier\|resultsRoute)" tests/tests/specs/voter/voter-mega-journey.spec.ts` = 0 | exists |
| AC-rigidity | No `expect.soft`, no try/catch around expect, no `[*-followup]`, no `.catch(() => null)` on assertion-bearing locators | grep gate | `grep -cE "expect\.soft\|\\[[a-z0-9]+-followup\\]" tests/tests/specs/voter/voter-mega-journey.spec.ts` = 0 (try/catch and `.catch` need manual review) | covered |
| AC-cold-start-green | `voter-mega-journey` project green cold-start | e2e | `yarn db:reset && cd tests && npx playwright test --project=voter-mega-journey` | gate at plan close |

### Sampling Rate

- **Per task commit:** `cd tests && npx tsc --noEmit -p .` + targeted spec-cell run (e.g. `npx playwright test --project=voter-mega-journey --grep "result-card-contents"`)
- **Per wave merge:** full `voter-mega-journey` project + `baseV1` data-setup-baseV1 chain (do NOT touch perm-* or default chains — out of scope)
- **Phase gate:** full `voter-mega-journey` project + grep gates for rigidity assertions

### Wave 0 Gaps

- [ ] `apps/frontend/src/lib/utils/entityCards.test.ts` — vitest unit-test for `getCardQuestions` covering both branches + not-found error (NEW)
- [ ] `tests/tests/fixtures/resultsPage.fixture.ts` — covers REQ T4 (NEW)
- [ ] `tests/tests/fixtures/entityFilters.fixture.ts` — covers REQ T4 (NEW)
- [ ] `tests/tests/fixtures/entityDetails.fixture.ts` — covers REQ T4 (NEW)
- [ ] `tests/tests/fixtures/views.ts` — composition root (NEW)
- [ ] `.planning/phases/88-…/88-04-ADR-cardContents-resolver.md` — ADR artefact (NEW)

## Sources

### Primary (HIGH confidence)

- `apps/frontend/src/lib/utils/entityCards.ts` — sole `QuestionInCardContent` consumer (resolver site)
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` — calls `getCardQuestions` + the `cardContents.[type].includes(...)` checks
- `packages/app-shared/src/settings/dynamicSettings.type.ts:344-357` — type widening target
- `packages/dev-seed/src/templates/baseV1.ts` — full 1745-line authoritative baseV1 dataset
- `packages/dev-seed/src/supabaseAdminClient.ts:243-315` — `importAnswers` precedent for Option B
- `tests/tests/specs/voter/voter-mega-journey.spec.ts:75-124, 349-1217` — TEXT_RE definition + 44 consumers
- `tests/tests/fixtures/{index.ts,voter.fixture.ts,voter-mega.fixture.ts}` — existing fixture root + walk-fixture precedents
- `tests/tests/utils/testIds.ts` — testId registry to be appended to
- All directly grep-verified — no Context7/WebSearch needed; this is a pure intra-repo reconciliation pass

### Secondary

- `.planning/phases/88-…/88-04-SCOPE.md` — authoritative SCOPE memo (operator)
- `.planning/quick/260527-nat-…/260527-nat-SUMMARY.md` — T1+T2 retro + recommendation for 88-04
- `./TEST-INVENTORY-REFACTOR-3.md` — operator's original design doc (194 lines)
- `.planning/phases/88-…/88-03-PLAN.md` — precedent for must_haves block + atomic-task framing + Svelte-5 ctx caveats

### Tertiary

- None — no WebSearch was needed for this research (all evidence in-tree).

## Metadata

**Confidence breakdown:**
- R-1 ADR resolution: **HIGH** — both options grounded in actual code paths (entityCards.ts:25-34 and importAnswers:243-315); recommendation rests on author-intent + bundle-size + future admin-UI reuse argument
- R-2 testid pre-flight: **HIGH** — every testid existence/non-existence verified by grep; placement sites identified by line number
- R-3 baseV1 row counts: **HIGH** for all counts confirmed against the seed (5/2/5/13/2/12/1/0/1) — **MEDIUM-HIGH** for the boolean-filter divergence (filterable:true grep'd, but runtime rendering not seed-verified)
- R-3 info-item display values: **MEDIUM** — the `[<id>]` prefix presence is confirmed; the alliance "(AL-A)" composition logic is not source-verified
- R-4 fixture partition: **HIGH** — recommendation based on existing fixture-file shapes + Playwright community standard

**Research date:** 2026-05-27

**Valid until:** 2026-06-10 (14 days — short shelf-life because the baseV1 seed and frontend are both active surfaces; any commit landing during this window may shift counts or testid coverage)

## RESEARCH COMPLETE
