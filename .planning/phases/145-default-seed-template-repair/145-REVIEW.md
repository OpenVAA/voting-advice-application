---
phase: 145-default-seed-template-repair
reviewed: 2026-08-24T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - .github/workflows/main.yaml
  - apps/frontend/src/lib/_guards/eslint-store-guard.test.ts
  - packages/dev-seed/src/emitters/answers.ts
  - packages/dev-seed/src/supabaseAdminClient.ts
  - packages/dev-seed/src/templates/default.ts
  - packages/dev-seed/src/templates/defaults/alliances-override.ts
  - packages/dev-seed/src/templates/defaults/candidates-override.ts
  - packages/dev-seed/src/templates/defaults/nominations-override.ts
  - packages/dev-seed/src/templates/defaults/questions-override.ts
  - packages/dev-seed/tests/emitters/answers.test.ts
  - packages/dev-seed/tests/integration/default-template.integration.test.ts
  - packages/dev-seed/tests/templates/default.test.ts
  - tests/playwright.config.ts
  - tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 145: Code Review Report

**Reviewed:** 2026-08-24
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

The four load-bearing claims of this phase were verified by measurement rather than by reading, and three of them hold:

- **The number-range fix works end to end.** Running `runPipeline(defaultTemplate, defaultOverrides)` and reading the emitted answers back: the number question declares `{"min":0,"max":10}` and the 327 emitted answers span exactly `0–10`. The production path goes through the *latent* emitter, not `defaultRandomValidEmit` directly, so this also confirms the `project.ts` `number → defaultRandomValidEmit` delegation actually reaches the fix.
- **No credential problem.** The committed anon literal decodes to `{"iss":"supabase-demo","role":"anon","exp":1983812996}` — the published local `supabase start` demo key, not a hosted-project key. The CI export cannot silently fall back: I reproduced the `set -e` semantics of the `run:` block and confirmed the pipeline's exit status is `tr`'s, so `test -n "$ANON_KEY"` is reached and emits the named `::error::` rather than dying anonymously at the assignment. Values go to `$GITHUB_ENV` only.
- **Gate containment holds.** Both probe tests and the enclosing `describe` carry `@probe`; the root `test:e2e` appends `--grep-invert @probe`; the `_probes` project declares no `dependencies`, so an opt-in run cannot pull the gate's data-setup projects. No file under `tests/tests/fixtures|helpers|utils` was modified (`resultsPage.expectEntityTabs` exists and is untouched).
- **The eslint warm-up fix is complete, contrary to my initial hypothesis.** I suspected the `beforeAll` warmed only the `.ts` parser and left the first `.svelte` case paying a cold svelte-eslint-parser load against the 5000 ms budget. Measured on this tree: cold `.ts` 948 ms, warm `.ts` 3 ms, **first `.svelte` after the warm-up 41 ms**, warm `.svelte` 5 ms. Both parsers are statically imported by `apps/frontend/eslint.config.mjs`, so the warm-up pays the whole cost. No finding.

What the review did surface: the "emit a value the question's own declaration permits" contract that `145-04.1` restored for `number` is still **open for `multipleChoiceCategorical` in the same file** — measured, 142 of 327 default-template candidates (43%) carry a selection count outside the declared `minSelections: 2 / maxSelections: 3`. Beyond that, the new anon guard has two ways to pass for a wrong reason on a developer machine, and the `external_id` rename introduced a namespace collision with the generator it was aligned to.

No Critical findings. No security defects.

## Warnings

### WR-01: Multi-choice answers ignore the declared selection-count constraints — 142/327 default candidates are invalid

**File:** `packages/dev-seed/src/emitters/answers.ts:147-159` (latent twin: `packages/dev-seed/src/emitters/latent/project.ts:202-227`)

**Issue:** `145-04.1` re-established the emitter's "random VALID per question type" contract for `number` by reading `custom_data.min/max`. The sibling path in the same file did not get the same treatment: `pickMultipleChoiceIds` picks each choice on a coin flip and only guarantees `>= 1`, ignoring `custom_data.minSelections` / `maxSelections` entirely. `mapMultiCategorical` (the latent path that the default template actually takes) has the identical gap — it takes every choice whose dot product is `> 0` and falls back to the argmax.

Measured against the current tree by running the real pipeline and histogramming the emitted selection counts for the default template's one multi-choice question (`custom_data: {"filterable":true,"minSelections":2,"maxSelections":3,...}`, 4 choices):

```
selection-count histogram: {"1":138,"2":42,"3":143,"4":4}
```

138 candidates select fewer than `minSelections`, 4 select more than `maxSelections` — **142 of 327 (43.4%)**.

This is not merely cosmetic. `apps/frontend/src/lib/utils/multiChoiceValidity.ts`'s `isMultiChoiceCountValid` is the app's single source of truth for this constraint, and `OpinionQuestionInput.svelte:60-102` seeds `currentMultiSelection` from the stored answer and pushes `valid` from it. A candidate whose seeded answer has 1 or 4 selections lands on that question with `valid === false` — the same "the seeder emitted a value the app declares illegal" class the number fix closed, differing only in that the data layer degrades rather than throws (`multipleChoiceCategoricalQuestion.ts` `_normalizeValue` treats each choice as an independent binary subdimension and has no count assertion), which is why it is a Warning and not a Blocker.

The repo already has the honouring precedent: `packages/dev-seed/src/templates/_helpers/buildMinimal.ts:194-198` reads `minSelections` when constructing a default answer.

Note also that `packages/dev-seed/src/templates/defaults/questions-override.ts:19-28` now states that the latent emitter "supports number (via the `defaultRandomValidEmit` fallback) and multipleChoiceCategorical (`mapMultiCategorical`), so candidate answers for both new types are emitted", and then corrects the "for free" claim **for number only**. After this phase that docblock reads as though both types are now emitted validly; only one is.

**Fix:** mirror `emitNumberInDeclaredRange` — read the declared bounds and clamp the pick, in both emitters:

```ts
function declaredSelectionRange(q: TablesInsert<'questions'>, choiceCount: number): { min: number; max: number } {
  const cd = (q.custom_data ?? {}) as { minSelections?: unknown; maxSelections?: unknown };
  const min = typeof cd.minSelections === 'number' ? Math.max(1, cd.minSelections) : 1;
  const max = typeof cd.maxSelections === 'number' ? Math.min(choiceCount, cd.maxSelections) : choiceCount;
  return { min, max: Math.max(min, max) };
}

// pickMultipleChoiceIds / mapMultiCategorical, after the existing scoring pass:
//   while (picked.length < min) picked.push(nextBestUnpicked());
//   if (picked.length > max) picked.length = max;   // scored order, so this drops the weakest
```

Order the surviving ids by score so the truncation is deterministic under a pinned seed, and extend `tests/emitters/answers.test.ts` with a case asserting the emitted length is inside `[minSelections, maxSelections]` — read off the row, as the number case already does.

### WR-02: The anon guard is not scoped to the rows it seeded — leftover `e2e/base` rows satisfy it

**File:** `packages/dev-seed/tests/integration/default-template.integration.test.ts:503-526`

**Issue:** `get_nominations()` is called with no arguments, so it returns **every** nomination in the database that anon can see, from every template and every project — the RPC's `WHERE` clause filters only on the two optional ids, `unconfirmed`, and the entity-join guard (`00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql:105-108`). The assertions then count by `entity_type` with no linkage back to the rows the test just wrote.

`beforeAll`'s `runTeardown('seed_', ...)` removes only `seed_`-prefixed rows. `packages/dev-seed/src/templates/e2e/base.ts:406` sets `externalIdPrefix: ''`, so an `e2e/base` dataset installed earlier is **not** removed and its anon-visible candidate nominations remain in the table.

Concrete failure scenario: a developer follows the documented workflow in `CLAUDE.md` — `yarn db:seed --template e2e/base` for a manual Playwright run — then exports `SUPABASE_URL` and runs `yarn test:unit`. The default template's 327 candidates could be entirely invisible to anon (the exact defect this guard exists to catch) and `byType.get('candidate')` would still be `> 0`, counting `e2e/base`'s candidates. The guard goes green on rows it did not write. CI is unaffected because the runner's database is fresh, but the guard is advertised in this file's own header as "the only thing in the repository that crosses that boundary".

**Fix:** intersect the RPC result with the candidate ids this run actually seeded — `readClient` and `prefix` are already in scope:

```ts
const { data: seededCands } = await readClient
  .from('candidates')
  .select('id')
  .eq('project_id', TEST_PROJECT_ID)
  .like('external_id', `${prefix}%`);
const seededIds = new Set((seededCands ?? []).map((c) => c.id));

const anonSeededCandNoms = ((noms ?? []) as Array<{ entity_type: string; candidate_id: string | null }>).filter(
  (n) => n.entity_type === 'candidate' && n.candidate_id != null && seededIds.has(n.candidate_id)
);
expect(anonSeededCandNoms.length, 'anon-visible candidate nominations FROM THIS SEED').toBeGreaterThan(0);
```

(`prefix` is currently a local of the first `it`; hoist it to a file constant or re-derive it from the template.) The same scoping should be applied to the `organization` assertion.

### WR-03: The role control discards its query error, so an unauthenticated anon client passes it

**File:** `packages/dev-seed/tests/integration/default-template.integration.test.ts:489-490`

**Issue:** The guard-of-the-guard destructures only `data`:

```ts
const { data: anonAccounts } = await anonClient.from('accounts').select('id');
expect((anonAccounts ?? []).length, 'anon accounts rowcount (role control)').toBe(0);
```

supabase-js returns `{ data: null, error }` on a transport or auth failure. If `SUPABASE_ANON_KEY` is set to a key that does not authenticate against **this** instance — the CI wiring-loss scenario the `main.yaml` comment block names by name, or a stale key in a developer's shell — PostgREST answers 401, `data` is `null`, and `(null ?? []).length === 0` **satisfies the control**. The control's stated purpose is to prove the credential's identity; a credential that authenticates as nothing at all is indistinguishable from a correctly-anon one at this line.

The test as a whole is still red in that scenario, but only because of the unrelated `expect(error).toBeNull()` on the RPC five lines later. The control does not carry its own weight, which is precisely the property the surrounding comment claims for it ("reproducing it inside the check built to prevent it would be worse than having no check at all").

**Fix:** assert the absence of an error on both control queries:

```ts
const { data: anonAccounts, error: anonAccountsErr } = await anonClient.from('accounts').select('id');
expect(anonAccountsErr, 'anon accounts query must succeed — a 401 would satisfy the rowcount check vacuously').toBeNull();
expect((anonAccounts ?? []).length, 'anon accounts rowcount (role control)').toBe(0);
```

Same treatment for the `svcAccounts` read at line 491 (there a 401 fails the `> 0` assertion, so it is already safe, but the symmetry is worth keeping).

### WR-04: `con_01`–`con_05` collide with `ConstituenciesGenerator`'s synthetic id namespace, and contradict the file's own stated convention

**File:** `packages/dev-seed/src/templates/default.ts:103-112` (with `packages/dev-seed/src/generators/ConstituenciesGenerator.ts:63-65`)

**Issue:** The rename to the generator typecodes is correct on the typecode axis — `ConstituenciesGenerator` does emit `con_`, `OrganizationsGenerator` does emit `org_` (verified). But the constituency discriminators were renamed to the *generated-row* form, and `default.ts:36-38` states the convention as: "the discriminator is **semantic for hand-authored rows** and **zero-padded for generated ones**." `con_01`…`con_05` are hand-authored rows carrying zero-padded discriminators — the file violates the convention it declares two paragraphs above the block.

That is not just a documentation inconsistency; it is what creates the collision. `ConstituenciesGenerator.generate` numbers synthetic rows from `i = 0` **irrespective of how many `fixed[]` rows precede them** (`external_id: \`${externalIdPrefix}con_${String(i).padStart(2, '0')}\``, line 65). So any future template shape that keeps this `fixed[]` block and raises `constituencies.count` above 1 emits a synthetic `seed_con_01` that is byte-identical to the hand-authored `seed_con_01`; `bulk_import` upserts by `external_id`, so one silently overwrites the other inside a single batch and `nominations-override`'s matrix column mapping is left pointing at a faker-named row. The pre-rename `c_01` form could not collide with `con_NN` by construction. `organizations` is unaffected (`org_blue` etc. are semantic).

Today this is latent — `constituencies.count` is `0`. The finding is that the rename removed a structural guarantee without replacing it.

**Fix (either)** — restore semantic discriminators, which satisfies both the typecode alignment and the file's stated convention:

```ts
{ external_id: 'con_uusimaa_north', name: { en: 'Uudenmaa North' }, sort_order: 0, is_generated: false },
{ external_id: 'con_uusimaa_south', name: { en: 'Uudenmaa South' }, sort_order: 1, is_generated: false },
// ...
```

**or** close the collision at the generator by offsetting the synthetic index past the fixed rows (`const base = (fragment.fixed ?? []).length; ... con_${String(base + i).padStart(2, '0')}`) and drop the "semantic for hand-authored" clause from the `default.ts` docblock so the two agree.

### WR-05: The alliance-nomination `external_id` format is hand-inlined 45 lines below the helper that owns it

**File:** `packages/dev-seed/src/templates/defaults/nominations-override.ts:215-221` (helper at `defaults/alliances-override.ts:112-114`, correctly used at `nominations-override.ts:172`)

**Issue:** `allianceNomExtId` is imported into this file and used to **emit** the alliance nominations at line 172. The org-nom `parent_nomination` reference that must resolve to those exact ids does not call it — it re-writes the template literal by hand:

```ts
parent_nomination: {
  external_id: `${externalIdPrefix}nom_alliance_${allianceKey}_${constituencyExtId}`
}
```

The producer and the consumer of the same identifier are now two independent copies of one format string. Editing `allianceNomExtId` — for instance to lowercase the alliance key, which `default.ts:53-56` explicitly contemplates as a future change — silently desynchronises them: every org-nom's `parent_nomination` would reference a nomination that was never emitted. The blast radius is the alliance reverse-fill the phase's own docblock cites (`supabaseDataProvider.ts:391-405`). It is caught downstream (`orgNomsWithParent.length` would fall to 0 against an expected 30 in the integration test) but only by a numeric assertion in a Supabase-gated test, not at the point of the mistake. This is also a direct hit on the project checklist item "There is no code that is repeated within the PR or elsewhere in the repo."

**Fix:**

```ts
...(allianceKey ? { parent_nomination: { external_id: allianceNomExtId(allianceKey, constituencyExtId, externalIdPrefix) } } : {})
```

## Info

### IN-01: `NUMBER_FALLBACK_RANGE` is not pinned as tightly as its docblock claims

**File:** `packages/dev-seed/src/emitters/answers.ts:111-115` and `packages/dev-seed/tests/emitters/answers.test.ts:38-39, 94-106`

**Issue:** The docblock reads "Pinned by `tests/emitters/answers.test.ts` so it cannot be dropped silently." The test does not import the constant; it declares its own `const FALLBACK = { min: 0, max: 100 }` and asserts that emitted values fall *inside* `[0, 100]` (plus `new Set(values).size > 1`). Narrowing the production fallback to, say, `[0, 50]` therefore passes both assertions — the pin is a one-sided envelope, not an equality. Widening it would be caught.

**Fix:** export `NUMBER_FALLBACK_RANGE` and assert against it directly (`expect(NUMBER_FALLBACK_RANGE).toEqual({ min: 0, max: 100 })`, plus `Math.max(...values)` close to `max` over the 100-draw sample), or soften the docblock claim to describe the envelope it actually holds.

### IN-02: Stale `c_05` identifier in the probe header — renamed by this same phase

**File:** `tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts:67`

**Issue:** "on the default template that resolves to **Pirkanmaa** (`c_05`)". `c_05` became `con_05` in this phase (`default.ts:110`). The line is a provenance note a reader would use to reproduce the measurement, and it names an identifier that no longer exists anywhere in the tree — this is the only surviving `c_0N` reference in `packages/`, `apps/` or `tests/`.

**Fix:** `con_05`.

### IN-03: `ALLIANCE_MEMBERSHIP` is exported for a consumer that does not import it

**File:** `packages/dev-seed/src/templates/defaults/alliances-override.ts:17-19, 39-42`

**Issue:** The header states "ALLIANCE_MEMBERSHIP and findAllianceForParty are exported so `nominations-override.ts` can (a) ... and (b) ...". `nominations-override.ts:44` imports `ALLIANCE_KEYS`, `allianceExtId`, `allianceNomExtId` and `findAllianceForParty` — not `ALLIANCE_MEMBERSHIP`. The constant's only reader is `findAllianceForParty`, three lines below it in the same module.

**Fix:** drop the `export` (keep it module-local) and correct the header to name the four symbols that are actually exported for cross-module use.

### IN-04: `db:seed --seed <int>` does not vary candidate names (pre-existing)

**File:** `packages/dev-seed/src/templates/defaults/candidates-override.ts:81-85`

**Issue:** `buildLocaleFaker` seeds each per-locale Faker with a hardcoded `42 + LOCALE_SEED_OFFSETS[locale]`, not with the template/CLI seed. `Ctx` (`src/ctx.ts:30-60`) carries no `seed` field, so the docblock's "read defensively ... fall back to a canonical `42`" is accurate about the constraint — but the consequence is that `yarn db:seed --template default --seed 7` produces the *same 327 candidate names* as `--seed 42`, while every other faker-driven field varies. The advertised flag is a partial no-op.

Outside this phase's diff (only `terms_of_use_accepted` was added to this file); recorded so it is not rediscovered.

**Fix:** add `seed: number` to `Ctx` and set it in `buildCtx` from `template.seed ?? 42`, then `f.seed(ctx.seed + LOCALE_SEED_OFFSETS[locale])`. `__buildLocaleFakerForTests` already takes a `baseSeed` parameter, so the test surface is ready for it.

---

_Reviewed: 2026-08-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
