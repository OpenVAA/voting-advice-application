# ADR-88-04-01 — cardContents.candidate external_id resolution

**Status:** ACCEPTED (Phase 88 Plan 04, T3)
**Date:** 2026-05-28
**Deciders:** operator + gsd-plan-phase orchestrator + gsd-execute-phase executor

## Context

TIR3 §"CHANGE SETTINGS" lines 21–29 calls for `cardContents.candidate` to accept
`{question: '<external_id>'}` so dev-seed templates can wire result-card content by
the stable bracket-token (`test-qu-info-text`) instead of the post-seed DB UUID
that only exists after the row is materialized. The current shape
(`question: string` holding a DB UUID) couples `baseV1.ts` to post-seed UUIDs
that don't exist at template-author time.

The runtime surface today:

- **Type** (`packages/app-shared/src/settings/dynamicSettings.type.ts:344-357`):
  `QuestionInCardContent = { question: string; hideLabel?: boolean; format?: ...; }`.
- **Sole runtime consumer** (`apps/frontend/src/lib/utils/entityCards.ts:25-34`):
  `const question = dataRoot.getQuestion(id);` where `id` is expected to be a
  DB UUID. Called from `EntityCard.svelte:125-129`.
- **Seed-time UUID resolution precedent**
  (`packages/dev-seed/src/supabaseAdminClient.ts:243-315`): `importAnswers`
  already builds a `Map<external_id, uuid>` by SELECTing the questions table
  filtered by `project_id`, then rewrites the consumer payload with UUIDs.

The architectural question: **where does `external_id → DB UUID` resolution
land?**

## The two viable strategies

### Option A — load-time, in-frontend resolver

Widen the PUBLIC `QuestionInCardContent.question` to
`string | { externalId: string }`. The lone consumer at
`apps/frontend/src/lib/utils/entityCards.ts:25-34` discriminates on the runtime
shape and resolves `externalId → DataRoot.questions[i].externalId → question.id`
lazily. ~10 LoC, one call site, no adapter touches. Author intent encoded in
the runtime type.

### Option B — seed-time resolution in dev-seed Writer Pass-5

Keep the PUBLIC type as `string`. The Writer's Pass-5 step resolves
`external_id → UUID` BEFORE the `merge_jsonb_column` RPC, mirroring the
`importAnswers` precedent at `packages/dev-seed/src/supabaseAdminClient.ts:243-315`.
PUBLIC type stays unchanged; the persisted JSONB column contains plain UUID
strings exactly as today. Resolution lives behind the dev-seed boundary —
admin-UI / runtime / frontend are unaffected. Template-time author intent is
preserved via a dev-seed-internal `TemplateAppSettings` widening that the
Writer flattens before persistence.

## Decision

**Option B (seed-time).**

## Reasons

1. **The `cardContents` settings shape is itself a near-future rewrite target.**
   A follow-up TODO has been filed (see "Follow-up TODOs" below + plan
   frontmatter `affects:` block):
   *"Refactor `QuestionInCardContent` and other results-cards settings to be
   election-specific. Consider moving the setting to questions or elections
   in `@openvaa/data`."*
   Widening the PUBLIC type now (Option A) locks in an author-intent affordance
   on a surface the project intends to redesign — wasted commit, future
   deprecation noise. Option B keeps the runtime shape narrow and disposable;
   when the election-specific refactor lands, the dev-seed Writer's resolver
   can be retired or refactored without touching the runtime.

2. **Resolution is a one-time seed-side concern, not a runtime-fetch concern.**
   The `{externalId} → UUID` lookup is needed exactly once at seed time (when
   DB rows materialize); the frontend reads from
   `app_settings.settings.results.cardContents.candidate[*].question`
   thousands of times per page render. Option A pays the discriminator cost at
   every render; Option B pays it once.

3. **Smaller blast radius.** Option B touches 2 net new files in dev-seed only
   (`writer.ts` splice + a new `resolveAppSettingsExternalIds.ts` + a
   dev-seed-internal types module). Option A touches 3 packages
   (`@openvaa/app-shared` types, `@openvaa/frontend` resolver, dev-seed
   template) and forces a TypeScript ripple through any code that reads
   `QuestionInCardContent.question`.

4. **Precedent.** `importAnswers` already builds an `externalId → UUID` map by
   SELECTing the questions table filtered by `project_id`
   (`packages/dev-seed/src/supabaseAdminClient.ts:243-270`). Wave 1's Writer
   splice mirrors that pattern — no new abstraction, no new coupling beyond
   what dev-seed already has.

## Consequences

**Positive:**

- No public type widening; no frontend changes; no admin-UI implications.
- Persisted JSONB column shape is unchanged — existing setups and runtime
  consumers continue to work.
- Resolution is contained to dev-seed; if the follow-up election-specific
  refactor lands, the Writer's resolver can be retired or rewritten without
  touching the runtime.
- The Option B Writer SELECT is pre-walk-gated — payloads without
  `{externalId}` references pay zero overhead.

**Negative:**

- Author intent (whether the question was wired by UUID or `external_id`) is
  NOT visible at runtime — the DB column contains UUIDs either way. For
  Phase 88's e2e-test use case this is acceptable.
- dev-seed gains an additional dependency on the questions-table schema —
  but it already has this via `importAnswers`, so no NEW coupling.
- Future templates that wire cardContents by `external_id` MUST go through
  the dev-seed Writer — they cannot bypass it. (Same constraint already
  exists for `importAnswers`-style answer wiring.)

## Implementation

- **Dev-seed-internal type widening:**
  `packages/dev-seed/src/templates/types.ts` (or equivalent dev-seed-local
  types module — planner discovers exact landing during Task 3). Exports
  `TemplateQuestionInCardContent` with `question: string | { externalId: string }`.
- **Pure-function resolver:**
  `packages/dev-seed/src/resolveAppSettingsExternalIds.ts` (NEW).
- **Writer splice:**
  `packages/dev-seed/src/writer.ts` Pass-5 (~line 173–181, before
  `updateAppSettings`).
- **Questions-table SELECT precedent:**
  `packages/dev-seed/src/supabaseAdminClient.ts:243-270` — the `importAnswers`
  map-build.
- **Template wiring:**
  `packages/dev-seed/src/templates/baseV1.ts:204` — gains
  `{ question: { externalId: 'test-qu-info-text' } }` in the TEMPLATE source.
- **Tests:** Vitest unit-test for `resolveAppSettingsExternalIds` covering
  string-passthrough / `{externalId}`-resolved / missing-id-throw + the
  forward-compatible `organization` / `alliance` paths.

## Anchoring evidence

- **Probe 1 (Wave-0):** `questions.external_id` DB column exists at
  `packages/supabase-types/src/database.ts:952` — PASS. Without this column,
  Option B's Writer SELECT would be unimplementable.
- See `88-04-WAVE0-PROBES.txt` for the full probe outcome table.

## Follow-up TODOs (must surface in SUMMARY at plan close)

> **TODO (post-88-04, v2.11+ candidate):** Refactor `QuestionInCardContent`
> and the surrounding results-cards settings (`results.cardContents`, plus
> `entityDetails.contents` and any sibling card-content settings) to be
> **election-specific**. The current shape lives under a single global
> `results.cardContents.{candidate,organization,alliance}` block — but card
> composition is intrinsically election-dependent (different elections show
> different cards, different submatches, different info-items). Consider:
>
> 1. Moving the setting into per-election overrides
>    (`elections[*].settings.results.cardContents`).
> 2. Attaching the setting directly to the question or election data objects
>    in `@openvaa/data` (e.g. `Election.cardContents` getter +
>    `Question.showInCardFor(election)` predicate).
> 3. Keeping a global default + per-election diff (deepest-wins merge).
>
> This is the architectural follow-up that motivated rejecting Option A in
> 88-04. When this lands, the dev-seed Writer's seed-time resolver from this
> plan may be retired, refactored, or repurposed for the new shape.

## Cross-references

- `.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-04-SCOPE.md` — operator-authored spec
- `.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-04-RESEARCH.md` — empirical contract (R-1)
- `.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-04-WAVE0-PROBES.txt` — pre-flight probe outcomes
- `./TEST-INVENTORY-REFACTOR-3.md` — operator's original design doc
