---
phase: 71-frontend-strict-typing-cleanup
reviewed: 2026-05-10T00:00:00Z
depth: standard
files_reviewed: 59
files_reviewed_list:
  - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts
  - apps/frontend/src/lib/components/button/Button.type.ts
  - apps/frontend/src/lib/components/input/Input.type.ts
  - apps/frontend/src/lib/contexts/app/getRoute.svelte.ts
  - apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts
  - apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts
  - apps/frontend/src/lib/contexts/utils/StackedState.svelte.test.ts
  - apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte
  - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts
  - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte
  - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts
  - apps/frontend/src/routes/(voters)/(located)/+layout.svelte
  - apps/frontend/src/routes/(voters)/(located)/results/+layout.ts
  - apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.ts
  - apps/frontend/src/routes/(voters)/nominations/+layout.svelte
  - apps/frontend/src/routes/+layout.svelte
  - apps/frontend/src/routes/admin/(protected)/+layout.svelte
  - apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.svelte
  - apps/frontend/src/routes/admin/(protected)/question-info/+layout.svelte
  - apps/frontend/src/routes/candidate/auth/callback/+server.ts
  - apps/frontend/src/routes/candidate/auth/logout/+server.ts
  - tests/seed-test-data.ts
  - tests/tests/setup/auth.setup.ts
  - tests/tests/setup/data.setup.ts
  - tests/tests/setup/data.teardown.ts
  - tests/tests/setup/templates/variant-constituency.ts
  - tests/tests/setup/templates/variant-multi-election.ts
  - tests/tests/setup/templates/variant-startfromcg.ts
  - tests/tests/setup/variant-constituency.setup.ts
  - tests/tests/setup/variant-data.teardown.ts
  - tests/tests/setup/variant-multi-election.setup.ts
  - tests/tests/setup/variant-startfromcg.setup.ts
  - tests/tests/specs/candidate/candidate-auth.spec.ts
  - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
  - tests/tests/specs/candidate/candidate-password.spec.ts
  - tests/tests/specs/candidate/candidate-profile.spec.ts
  - tests/tests/specs/candidate/candidate-registration.spec.ts
  - tests/tests/specs/candidate/candidate-settings.spec.ts
  - tests/tests/specs/variants/constituency.spec.ts
  - tests/tests/specs/variants/multi-election.spec.ts
  - tests/tests/specs/variants/results-sections.spec.ts
  - tests/tests/specs/variants/startfromcg.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/specs/voter/voter-popup-hydration.spec.ts
  - tests/tests/specs/voter/voter-popups.spec.ts
  - tests/tests/specs/voter/voter-settings.spec.ts
  - tests/tests/specs/voter/voter-static-pages.spec.ts
  - tests/tests/utils/emailHelper.ts
findings:
  blocker: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 71: Code Review Report

**Reviewed:** 2026-05-10
**Depth:** standard
**Files Reviewed:** 59
**Status:** issues_found (1 warning, 3 info)

## Summary

Phase 71's typing-cleanup work is mechanically sound. All four review axes (cast soundness, type-parameter renames, func-style hoisting, type-only imports) come up clean on the high-risk surfaces:

- **Cast soundness (Plan 71-01).** The `Json → unknown → StoredImage | null` and `Json → unknown → LocalizedAnswers | null` cast chains are paired with runtime guards (`parseStoredImage` checks `!stored?.path`; `parseAnswers` checks `!answers` and per-entry `!answer`), so even a lying cast cannot crash the function. The `asSupabaseMock` helper triad's signature (`(m: MockClient): SupabaseClient<Database>`) is more specific than CONTEXT documented but a strict improvement — the production adapter is generic over `Database`. The `Tables<'nominations'>['Row']` callback type at `supabaseDataWriter.ts:223` correctly narrows the SDK's inferred row shape; downstream destructures (`n.election_id`, etc.) match the schema.
- **Type-parameter renames (Plan 71-02).** All 13 sites cleared with no missed references; `git grep _TElement` and `git grep _Unused` both return zero matches. Cross-file `TFn` convention between `EntityListWithControls.helpers.ts` and `EntityListWithControls.svelte` is consistent. The `_Unused` deletion preserved the broken-but-pre-existing `FilterGroupLike` alias (out of scope).
- **func-style conversions (Plan 71-03).** All 7 mechanical arrow→function declaration conversions are inside enclosing scopes where hoisting is benign — `function handler()` declarations in `+layout.svelte:164`, `filterContext.svelte.ts:83`, and `EntityListWithControls.svelte:91` are each preceded by an early-return guard at the head of their `$effect` callbacks, so the function is reachable but never *registered* (via `addEventListener` / `onChange`) before its dependencies (`appSettings.current.analytics?.platform`, `_filterGroup`, `searchFilter`) are validated. The 4 SvelteKit type-binding disables (`+layout.ts:23`, `+page.ts:28`, `callback/+server.ts:19`, `logout/+server.ts:12`) carry consistent `-- reason: SvelteKit <TypeName> type-binding requires const-form annotation` text and match D-04.
- **Type-only imports (Plan 71-03 long-tail).** `Button.type.ts`, `token-endpoint.test.ts`, and `getIdTokenClaims.test.ts` all correctly distinguish value (`import * as jose from 'jose'`) from type (`import type * as JoseType from 'jose'`); no value-position references through type-only imports.

The findings below are all auto-fix collateral introduced by the Plan 71-03 deviation sweep over `tests/`. Nothing in scope is correctness-impacting.

## Warnings

### WR-01: Playwright auto-fix changed `not.toBeVisible()` to `toBeHidden()` — semantically near-equivalent but timing differs

**Files:**
- `tests/tests/specs/candidate/candidate-settings.spec.ts:103,137,259`
- `tests/tests/specs/variants/multi-election.spec.ts:171,341`
- `tests/tests/specs/variants/results-sections.spec.ts:283,291,310,318`
- `tests/tests/specs/variants/startfromcg.spec.ts:134`
- `tests/tests/specs/voter/voter-journey.spec.ts:62,66,82`
- `tests/tests/specs/voter/voter-popups.spec.ts:138`

**Issue:** The Plan 71-03 `eslint --fix tests` deviation sweep activated the `playwright/prefer-to-be-hidden` rule's auto-fix, replacing `await expect(locator).not.toBeVisible()` with `await expect(locator).toBeHidden()`. Both forms are *eventually* equivalent (both poll until the element is hidden or detached), but the polling semantics differ subtly:

- `not.toBeVisible()` — waits for the element to NOT be visible at any point during the timeout.
- `toBeHidden()` — actively waits for the element to reach a hidden state (display:none / visibility:hidden / opacity:0 / empty bounding box / detached).

In practice Playwright treats them as equivalent for assertions, and `toBeHidden()` is the recommended form. **However**, this change was not part of Phase 71's enumerated 95-error scope — it is an unintended behavior shift in 13+ test sites that was bundled into Plan 71-03's "fix all of `tests/`" deviation. None of the sites failed in the verification run, but the change crosses test-behavior boundaries that should normally be reviewed by a test owner.

Additionally, `voter-popups.spec.ts:217-220` was rewritten:
```ts
// BEFORE
const dialogCount = await page.getByRole('dialog').count();
expect(dialogCount).toBe(0);
// AFTER
const dialogCount = page.getByRole('dialog');  // ← variable now holds a Locator, not a number
await expect(dialogCount).toHaveCount(0);
```
The `dialogCount` variable name now mis-describes its contents (it's a Locator, not a count). The polling vs. snapshot semantics also changed: `count()` is a single snapshot whereas `toHaveCount(0)` polls. The intent ("after waiting, verify no dialog appeared") is preserved, but the variable rename was missed.

**Fix:** Either (a) accept these changes as cleanup (most likely correct path — these auto-fixes are project-conformant) and rename `dialogCount` → `dialogLocator` at `voter-popups.spec.ts:217`, or (b) confirm the test-owner is comfortable with the timing-semantic shift before phase close. The verification report should explicitly note that 14 test assertions changed shape under the deviation auto-fix.

```ts
// voter-popups.spec.ts:217-220 — recommended cleanup
const dialogLocator = page.getByRole('dialog');
await expect(dialogLocator).toHaveCount(0);
```

## Info

### IN-01: Variant template imports have prettier-formatting glitches not auto-fixed

**Files:**
- `tests/tests/setup/templates/variant-constituency.ts:53-54`
- `tests/tests/setup/templates/variant-multi-election.ts:33-34`
- `tests/tests/setup/templates/variant-startfromcg.ts:35-36`

**Issue:** When the Plan 71-03 auto-fix sweep split `import { ..., type Template }` into separate value+type imports, it left two formatting glitches:

1. Trailing-double-space before closing brace: `import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS  } from '@openvaa/dev-seed';` (note the two spaces before `}`).
2. Missing whitespace inside type-import braces: `import type {Template} from '@openvaa/dev-seed';` (project convention everywhere else is `{ Template }` with spaces).

These glitches survive `eslint --fix` because they are Prettier's responsibility. `tests/` is **not** in `.prettierignore`, so a `yarn format:check` run will catch them — and may turn red on CI if format-check is part of the pipeline. Phase 71's verification didn't run `yarn format:check`, so the issue is currently latent.

**Fix:** `yarn format` (or scoped `prettier --write tests/tests/setup/templates/`) to clean up the spacing. Or roll into the next phase's hygiene sweep.

### IN-02: Production adapter `// reason:` anchors are cluster-level, not per-cast (D-04 strict reading)

**Files:**
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — 13 cast sites at lines 105-107, 158, 191, 214, 324, 355, 356, 451, 452, 482, 532; only line 104 carries the `// reason:` line
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — 2 cast sites at lines 208 and 353; both carry their own `// reason:` lines (good)

**Issue:** D-04 specifies single-line `// reason: <reason>` immediately preceding each `unknown`-typed cast, distinct from the `// bind:` and `// svelte-warning:` families "so a future grep can find each independently." In `supabaseDataProvider.ts`, the convention was applied at the cluster level (one `// reason:` line at 104 covers all 13 casts in the file), not per-site. The reason text also only mentions `StoredImage` ("structural superset of StoredImage; parseStoredImage runtime-guards on .path") even though 2 of the 13 casts (lines 356, 452) target `LocalizedAnswers` and pass through `parseAnswers`, not `parseStoredImage`.

This is consistent with the summary's claimed "15 reason-tagged sites in the supabase adapter" (which clears the SC-1 grep gate of ≥7) but is technically a soft application of D-04. A strict per-cast reading would expect ~15 separate `// reason:` lines distributed across the 15 cast sites, with the reason text reflecting the actual function being called (parseStoredImage vs parseAnswers).

**Fix:** Either tighten the per-site application going forward (each cast carries its own `// reason:` line with target-function-specific reason text) or update D-04's wording in CONTEXT to reflect cluster-level application as acceptable. No source change required for Phase 71 — the verification gate is satisfied and the convention is anchored, just inconsistently between the two adapter files.

### IN-03: `func-style` conversion in `getRoute.svelte.ts:36` is correct, but the surrounding `setStore` cast at line 41 could be cleaner now that `buildFn` is hoisted

**Files:**
- `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts:36-44`

**Issue:** The `const buildFn = () => { ... }` → `function buildFn(): RouteBuilder { ... }` conversion is mechanically correct and behavior-preserving. With function-declaration hoisting now in play, the line-order constraint that previously required `buildFn` to be defined before the `writable<RouteBuilder>(buildFn())` call no longer applies — but this is a stylistic improvement, not a defect. The pre-existing `(store as { set: (v: RouteBuilder) => void }).set` cast at line 41 is unrelated to phase 71 and is documented out of scope.

**Fix:** No action required. Noted only because it's adjacent to a phase 71 edit and a future cleanup pass might consolidate.

---

## Out-of-scope items observed but not flagged

Per phase context, the following were verified as pre-existing and NOT flagged:
- The duplicate JSDoc block at `Input.type.ts:45-54` (two `@typeParam` blocks adjacent).
- The broken `FilterGroupLike<TEntity>` alias at `EntityListWithControls.helpers.ts:43` referencing un-imported `MaybeWrappedEntityVariant` (acknowledged in summary).
- The 27 `unused-imports/no-unused-vars` warnings in `apps/frontend/`.
- The 98 pre-existing playwright warnings in `tests/`.
- The 3 legacy `// eslint-disable-next-line @typescript-eslint/no-explicit-any` sites at `popupComponent.type.ts:26`, `components.ts:34`, `buildRoute.ts:58`.
- The pre-existing locale-extraction bug at `supabaseDataWriter.ts:49` (`window.location.pathname.split('/')[1] || 'en'` — would yield `'candidate'` for unprefixed URLs).
- The pre-existing `createRemoteJWKSet` mock shape at `getIdTokenClaims.test.ts:46` (returns the keyset directly instead of a factory function).

---

_Reviewed: 2026-05-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
