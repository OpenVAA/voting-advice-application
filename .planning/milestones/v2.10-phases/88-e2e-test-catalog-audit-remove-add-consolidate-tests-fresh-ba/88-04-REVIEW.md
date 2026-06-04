---
phase: 88
plan: 88-04
review_depth: standard
diff_base: 8deb86865
status: issues_found
files_reviewed: 22
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
---

# Code Review — Phase 88 Plan 04 (TIR3 T3-T9)

Standard depth review across 22 files: dev-seed resolver + Writer Pass-5 splice, `supabaseAdminClient` SELECT, baseV1 template edits, 4 fixture files, mega-journey spec migration, testIds registry, `setupFromTemplate` helper, 8 Svelte components with testid additions.

## Findings overview

| Severity | Count |
|----------|-------|
| Critical | 0 |
| Warning  | 4 |
| Info     | 5 |
| **Total** | **9** |

## Critical (BLOCKER)

None. Option B contract integrity is intact:

- `QuestionInCardContent.question` stays `string` in `@openvaa/app-shared` (unmodified).
- The `{externalId}` shape lives only in `packages/dev-seed/src/templates/types.ts` and `baseV1.ts` template literals.
- The Writer Pass-5 resolver flattens `{externalId}` to plain UUID strings before `merge_jsonb_column` writes — verified by code path inspection (`writer.ts:174-191` + `resolveAppSettingsExternalIds.ts:90-129`).
- The persisted JSONB column receives plain UUID strings.
- `selectQuestionExternalIds` uses parameterized Supabase client calls — no SQL injection surface.
- Resolver is pure (no mutation of input — line 117 `{ ...entry, question: uuid }` builds a new entry).
- `baseV1.ts` diff is exactly the documented 2 edits (line 204 cardContents + line 688 `filterable: false`).
- TEXT_RE diff matches documentation: 8 entries dropped, 2 entries tightened to `\[qg-opin-opt-{a,b}-{NotSelected,Skipped}\]` prefix.

## Warning

### WR-01: `TemplateQuestionInCardContent` is exported but never referenced — dead public-API surface

- **File:** `packages/dev-seed/src/templates/types.ts:39-41`
- **Issue:** The widening type is defined and exported, but no module imports it. `baseV1.ts` declares `BASE_V1_APP_SETTINGS` with `as const` (no type annotation), so the `{ externalId: 'test-qu-info-text' }` literal narrows correctly without help from this type. Confirmed via global grep — only the file's own docstring (line 4) references the symbol. The plan-described `TemplateAppSettings` widening does not actually exist — only `TemplateQuestionInCardContent`, and it is dead.
- **Why it matters:** Dead types in a workspace public API surface confuse future maintainers (they assume a usage exists), and the docstring promises a contract (`Consumed by template files (e.g. baseV1.ts)`) that the code does not actually wire.
- **Fix:** Either delete `packages/dev-seed/src/templates/types.ts` (the resolver enforces the contract at runtime; templates work via structural typing alone), or annotate `BASE_V1_APP_SETTINGS` in baseV1.ts to consume the widening type. Pick one. Do not ship an unused public type.

### WR-02: `entityFilters.fixture.ts:160` violates the documented rigidity contract — `.catch(() => true)` on a non-`dismissAllDialogs` helper

- **File:** `tests/tests/fixtures/entityFilters.fixture.ts:160`
- **Issue:** The fixture's header docstring states: "NO `.catch(() => null)` on assertion-bearing locator interactions" and the only exception (per sibling `resultsPage.fixture.ts:154-156`) is `dismissAllDialogs`. But `getFilter()` contains `const isExpanded = await toggle.isChecked().catch(() => true);` — when the lookup fails, the helper assumes "already expanded" and skips the click. This swallows a legitimate failure (e.g., if the `getByRole('checkbox', { name: /expand or collapse/i })` ever finds no element due to a frontend regression, the click is silently skipped and downstream `getOptions()` calls return zero elements — symptoms appear far from cause). The `.catch(() => true)` pattern is assertion-bearing-adjacent (its post-condition is "filter row is expanded for subsequent get* calls").
- **Fix:** Replace with a hard assertion or a non-swallowing probe. Either:
  ```ts
  await expect(toggle).toBeVisible({ timeout: TIMEOUT.element });
  const isExpanded = await toggle.isChecked();
  ```
  or document this exception explicitly in the file header (extend the `dismissAllDialogs` carve-out to include "Expander auto-expand probes").

### WR-03: `entityFilters.fixture.ts:29` — `pickByTarget` has a logic bug AND is dead code, kept alive by a `void` reference

- **File:** `tests/tests/fixtures/entityFilters.fixture.ts:27-34, 293-294`
- **Issue:** The function takes a `Target` (`RegExp | string | ((count: number) => number)`); for the indexer branch it calls `target(0)` — passing `0` as the "count" argument, which is incorrect (the contract is "indexer receives the actual element count"). The function header comment even acknowledges this: "count unknown synchronously — caller must ensure the indexer doesn't need `count`". The function is then never called anywhere (`getFilter()` and `getOption()` re-implement the same logic correctly with `await loc.count()`). The trailing `void pickByTarget;` is a code smell hack to defeat `noUnusedLocals`.
- **Fix:** Delete the function and the `void` reference at line 294. Dead code with a known logic bug is worse than no code.

### WR-04: `EntityListControls.svelte:130` — the `entity-list-filter-badge` testid is placed on a `<span>` that the fixture documents as not surviving Svelte 5 snippet compilation

- **File:** `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte:130`
- **Issue:** Wave 1.5 added `<span data-testid="entity-list-filter-badge"><InfoBadge text={numActiveFilters} /></span>` inside `{#snippet badge()}`. The fixture file `entityFilters.fixture.ts:272-282` explicitly documents that this wrapping `<span>` does not appear in the rendered DOM, and the fixture works around it by scoping to the filter button (`getFilterButtonBadge` returns the filter button, not the badge). The testid is registered in `testIds.ts:137` (`filterBadge: 'entity-list-filter-badge'`) but is unreachable. This is a stranded testid — adds noise to the registry and ships dead source-code markup.
- **Fix:** Either (a) remove the wrapping `<span>` and the `filterBadge` testId entry (the fixture's `getFilterButtonBadge` workaround already covers the actual contract); or (b) move the testid up onto a snippet-anchor-survivable element (e.g., directly onto the badge component's outermost element by passing `data-testid` through the `InfoBadge` prop chain if the component supports it). Shipping an unreachable testid is worse than no testid.

## Info

### IN-01: `resolveAppSettingsExternalIds.ts` — error message references "Writer Pass-5" — implementation-detail leakage into a pure-function diagnostic

- **File:** `packages/dev-seed/src/resolveAppSettingsExternalIds.ts:113-115`
- **Issue:** The throw message says: "Verify the question exists in the template and is loaded before app_settings (Writer Pass-5)." The phrase "Writer Pass-5" is implementation-internal — non-Writer callers (e.g., `setupFromTemplate.ts:213` uses the resolver in test-setup context) get a confusing pointer.
- **Fix:** Drop the "(Writer Pass-5)" trailing phrase or rephrase as "Verify the question exists in the template and that the question collection writes have completed before the app_settings write."

### IN-02: `resolveAppSettingsExternalIds.ts:122-128` — the resolver rebuilds `results` and `cardContents` even when only some `CARD_CONTENTS_KEYS` paths have `{externalId}` refs

- **File:** `packages/dev-seed/src/resolveAppSettingsExternalIds.ts:101-128`
- **Issue:** When `settingsContainsExternalIdRefs` returns true for one key (e.g., `candidate`), the resolver rebuilds the entire `cardContents` object including untouched `organization` and `alliance` arrays. The output is a fresh array reference for those keys (`newCardContents[key] = resolvedArr` on line 119 sets every key, including ones with no `{externalId}` refs). This breaks downstream reference-equality checks if any caller relied on `Object.is(input.organization, output.organization)`.
- **Why minor:** No caller currently does this check (`merge_jsonb_column` does deep-merge semantically), so the impact is theoretical. The docstring promises "structural clone of the affected sub-trees only" — the implementation deviates slightly by cloning every cardContents key array, not only the affected one.
- **Fix:** Inside the loop at line 102-120, skip the `resolvedArr` rebuild + assignment when `arr` has no `{externalId}` refs. Minor; performance is not a v1 concern.

### IN-03: `supabaseAdminClient.ts:332-345` — `selectQuestionExternalIds()` silently overwrites on hypothetical external_id collisions

- **File:** `packages/dev-seed/src/supabaseAdminClient.ts:340-344`
- **Issue:** The `map.set` in the loop will silently overwrite earlier entries if two rows share the same `external_id` within the project (the DB has `UNIQUE(project_id, external_id)` on `questions` per migration schema, so this should be impossible — but a defensive log on collision would catch a future schema drift).
- **Fix:** Optional — add `if (map.has(row.external_id)) console.warn(...)` inside the loop. Or accept the DB invariant and leave as-is.

### IN-04: `setupFromTemplate.ts:42-44` — re-exporting `resolveAppSettingsExternalIds` / `settingsContainsExternalIdRefs` from `@openvaa/dev-seed` requires test consumers to reach into dev-seed internals

- **File:** `packages/dev-seed/src/index.ts:60` + `tests/tests/setup/setupFromTemplate.ts:37,40`
- **Issue:** The post-seed `toMatchObject` parity check in `setupFromTemplate.ts:199-216` duplicates the Writer's resolver call. This is a leaky abstraction — the test setup file must know about Writer Pass-5 ordering. A cleaner API would be a Writer method like `getEffectiveSettings(template): Promise<Record<string, unknown>>` that returns the fully resolved payload, isolating the Pass-5 mechanics inside the Writer.
- **Fix:** Optional API improvement; defer until v2.11+ cardContents refactor.

### IN-05: `voter-mega-journey.spec.ts:867` — STAGE 5a filter regex includes the unbracketed legacy label, raising regex-match ambiguity

- **File:** `tests/tests/specs/voter/voter-mega-journey.spec.ts:867,881,888`
- **Issue:** The fixture call uses `/pick multiple|multipleChoiceCategorical|\[qu-info-multipleChoiceCategorical\]/i` — an OR-regex spanning three possible label shapes (raw legacy, programmatic alias, T2-bracket-prefixed). The T2 prefix is the new convention; the other alternatives are dead branches. Same for `/years of experience|\[qu-info-number\]/i` on line 881/888. Keeping the legacy alternatives in the spec hides regressions if the bracket prefix accidentally disappears post-T2.
- **Fix:** Drop the legacy alternatives — use `/\[qu-info-multipleChoiceCategorical\] pick multiple/i` and `/\[qu-info-number\] .*years of experience/i` directly. This locks the contract to T2's display convention (same posture T9 took for `optionalOpinionsA/B` in TEXT_RE).

## Notes / Verified clean

- `baseV1.ts` diff = exactly the 2 documented edits (line 204 cardContents wiring + line 688 `filterable: false`); no drift.
- All 8 Svelte components are pure testid additions or `data-testid` attribute changes; no behavioral edits to event handlers, props, reactive declarations, or effect blocks.
- `EntityCard.svelte:220` conditional testid `variant === 'subcard' ? 'entity-card-subcard' : 'entity-card'` is a ternary on a prop, which is reactive in Svelte 5 prop-update semantics. Subcards are now excluded from `getByTestId('entity-card')` — context confirms this is intentional; this is a callsite-impacting change but pre-existing voter-detail / voter-results specs that previously matched subcards under `entity-card` will need to be audited (probably already done in the T7/T8 migration).
- `selectQuestionExternalIds` uses `.eq('project_id', this.projectId)` and `.select('id, external_id')` via Supabase client — parameterized, no SQL injection. Same shape as the verified-clean `importAnswers` map-build at lines 243-277.
- Writer Pass-5 splice is idempotent: `settingsContainsExternalIdRefs` is the gate (line 180); if false, no SELECT fires and the existing per-row loop runs unchanged. If true, the SELECT runs once for the whole batch, then each row gets resolved-and-merged.
- Fixture rigidity contract holds in the 3 view fixtures + composition root: zero `expect.soft`, zero `try/catch` around `expect()`, zero `[*-followup]` markers in fixture bodies. Hardcoded baseV1 strings appear only inside comments (e.g., `'Party AA'` in a docstring on `resultsPage.fixture.ts:19`).
- The `dismissAllDialogs` `.catch(() => null)` chain is documented and scoped to best-effort cleanup (the helper is followed by hard assertions at callsites).

## Out of scope (not v1 review concerns)

- The `voter-mega-journey.spec.ts` still contains `expect.soft` calls (lines 582, 1058+) and `[u53-followup]` console.info notes — these are pre-existing patterns from the u53 cleanup, not introduced by 88-04. The rigidity contract scopes to **fixtures**, not spec bodies.
- Spec body `.catch(() => null)` patterns on dialog dismissal helpers (e.g. lines 197, 339-376) are pre-existing best-effort cleanup conventions; not in scope for this review.
