# Phase 64: Voter Results Reactivity Completion — Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 9 file surfaces (5 production, 2 test artifacts, 2 conditional)
**Analogs found:** 8 / 9 (1 file — `voter.fixture.ts` — has no in-codebase analog; only itself)

> Crucial framing inherited from RESEARCH §1: the JSON ground truth shows 4 of 5 failing tests die in `voter.fixture.ts:68` (`page.waitForURL(url ≠ urlBefore, 5000ms)`) BEFORE the test body runs. The 5th (D-14) is `test.skip(true,…)` triggered by absent filter button/checkbox. The reactivity bridge in `filterContext.svelte.ts` is NOT reproduced as broken — Phase 62's Option B is unit-test-proven and the `effect_update_depth_exceeded` symptom does not appear in the report. Pattern assignments below DEFAULT to "preserve incumbent" and only escalate to architectural change if Plan 64-01 reproduction surfaces an actual bridge defect.

---

## File Classification

| File | Status | Role | Data Flow | Closest Analog | Match Quality |
|------|--------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` | modified (audit + conditional fix) | context provider | event-driven (push via FilterGroup.onChange) | itself (Phase 62 incumbent) + `voterContext.svelte.ts` push-based `$effect` mirror | exact (incumbent) |
| `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` | modified (testid hygiene; conditional bridge swap) | compound component | request-response over `$derived` | itself + `apps/frontend/src/routes/(voters)/(located)/+layout.svelte` `$effect.root` pattern | exact (incumbent) |
| `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` | possibly touched (drawer-first paint preserved) | route layout | URL-driven `$derived` graph | itself + `voterContext.svelte.ts` push-based mirror for `voterCtx.matches` readiness | exact (incumbent) |
| `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` | possibly touched (handleAnswer settle gate at consumer) | context provider | push-based `$effect` chain | itself (lines 81–287 are the canonical chain) | exact (incumbent) |
| `tests/tests/fixtures/voter.fixture.ts` | modified (likely root-cause site per RESEARCH §1) | E2E fixture | sequential await chain | none in tree | no analog — standalone |
| `tests/tests/specs/voter/voter-results.spec.ts` | modified (D-11 skip-path → poll-with-timeout) | E2E spec | request-response Playwright | `tests/tests/specs/voter/voter-detail.spec.ts` and pass-locked specs in same file | role-match |
| `packages/filters/src/group/filterGroup.ts` | CONDITIONAL on D-01 mutations | pure-TS class | event-driven (pure-JS `Set<callback>`) | itself (`_onChange` registry on line 17) | exact (incumbent) |
| `packages/dev-seed/src/templates/e2e.ts` | CONDITIONAL on D-04 dev-seed extension | seed template | batch (build-time) | Phase 63 `app_settings.fixed[]` extension precedent (E2E-02) within this same file | exact (precedent) |
| `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` | NEW (Phase 64 artifact) | capture artifact | batch | `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json` | exact (precedent) |
| `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` | modified (constants regen only — D-08) | parity-gate script | batch | itself (lines 53–138 hold the 3 const arrays) | exact (incumbent) |

---

## Pattern Assignments

### `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` (context provider, event-driven)

**Default action:** PRESERVE incumbent. The bridge is unit-test-proven and the failure JSON does NOT cite this file. D-02 audit may relocate the bridge to a `$effect.root()` scope or to `EntityListWithControls.svelte` IF Plan 64-01 reproduction surfaces a cold-deeplink mis-mount; otherwise leave verbatim.

**Analog:** itself (Phase 62 incumbent).

**Imports pattern** (lines 1–6):
```ts
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { page } from '$app/state';
import { parseParams } from '$lib/utils/route';
import type { FilterGroup } from '@openvaa/filters';
import type { FilterContext, InitFilterContextArgs } from './filterContext.type';
```

**Context-key + init guard pattern** (lines 8–21):
```ts
const CONTEXT_KEY = Symbol();

export function getFilterContext(): FilterContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getFilterContext() called before initFilterContext()');
  return getContext<FilterContext>(CONTEXT_KEY);
}
```
This is the codebase-standard context-per-concern shape (also used by `voterContext.svelte.ts:25–28`, `appContext`). Any relocated bridge MUST preserve this entry-point contract — `initFilterContext()` is the only mutation point.

**Version-counter bridge (Option B — INCUMBENT)** (lines 45–88):
```ts
let version = $state(0);

const _filterGroup = $derived.by<FilterGroup<MaybeWrappedEntityVariant> | undefined>(() => {
  void version;     // defensive dependency edge — see RESEARCH §Pattern 1
  const tree = entityFilters();
  const params = parseParams(page);
  const electionIdRaw = params.electionId;
  const electionId = Array.isArray(electionIdRaw) ? electionIdRaw[0] : electionIdRaw;
  const pluralRaw = params.entityTypePlural;
  const plural = Array.isArray(pluralRaw) ? pluralRaw[0] : pluralRaw;
  const entityType =
    plural === 'candidates' ? 'candidate' : plural === 'organizations' ? 'organization' : undefined;
  if (!electionId || !entityType) return undefined;
  return tree?.[electionId]?.[entityType];
});

$effect(() => {
  const fg = _filterGroup;
  if (!fg) return;
  const handler = () => { version++; };
  fg.onChange(handler, true);
  return () => fg.onChange(handler, false);   // Pitfall 2 cleanup — leaked handlers
});
```
**Cleanup-return discipline** (line 87) is binding — any relocation MUST preserve the detach-old-before-attach-new contract or introduce leaked listeners on scope changes.

**Conditional D-02 fix — `$effect.root` wrap:** if reproduction proves the bare-`$effect`-in-init lifecycle mis-mounts on cold deeplinks, copy the analog at `apps/frontend/src/routes/(voters)/(located)/+layout.svelte:99–135` (RESEARCH Code Example 3):
```ts
const cleanupEffect = $effect.root(() => {
  $effect(() => {
    const fg = _filterGroup;
    if (!fg) return;
    const handler = () => { version++; };
    fg.onChange(handler, true);
    return () => fg.onChange(handler, false);
  });
});
// Caller disposes via cleanupEffect?.() when context tears down.
```

**Conditional D-03 fix — `createSubscriber` wrapper:** if the planner adopts the narrowing-of-`@openvaa/filters` outcome, copy RESEARCH Code Example 2 verbatim into a NEW consumer-side file `apps/frontend/src/lib/contexts/filter/reactiveFilterGroup.svelte.ts` (the package source stays pure-TS per D-01). DO NOT add `import 'svelte/...'` lines inside `packages/filters/src/`.

---

### `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` (compound component, request-response)

**Default action:** PRESERVE the `$derived.by` + `void fctx.version` dependency edge (lines 109–117). Optionally remove the dead-code `data-testid="entity-list-with-controls"` on line 143 (UI-SPEC §Test ID Inventory pre-flagged it; RESEARCH §4 confirmed it never wins because `concatClass(restProps, …)` overrides via "later wins" Svelte 5 spread order). Removal is a clarity improvement, not a behavioral fix.

**Analog:** itself (Phase 62 incumbent).

**Imports + context consumption** (lines 30–46):
```svelte
<script lang="ts" generics="TEntity extends MaybeWrappedEntityVariant = MaybeWrappedEntityVariant">
  import { TextPropertyFilter } from '@openvaa/filters';
  import { fromStore } from 'svelte/store';
  import { Button } from '$lib/components/button';
  import { EntityFilters } from '$lib/components/entityFilters';
  import { Modal } from '$lib/components/modal';
  import { getAppContext } from '$lib/contexts/app';
  import { getFilterContext } from '$lib/contexts/filter';
  import { concatClass } from '$lib/utils/components';
  import EntityList from './EntityList.svelte';
  import { computeFiltered, countActiveFilters } from './EntityListWithControls.helpers';
  import type { FilterGroup } from '@openvaa/filters';
```

**Core `$derived.by` + dual-version-counter bridge** (lines 87–117):
```svelte
let searchVersion = $state(0);
$effect(() => {
  const sf = searchFilter;
  if (!sf) return;
  const handler = () => { searchVersion++; };
  sf.onChange(handler, true);
  return () => sf.onChange(handler, false);   // Pitfall 2 cleanup
});

type ApplyFn = { apply: <T>(targets: Array<T>) => Array<T> };
const filtered = $derived.by(() => {
  void fctx.version;   // subscribe to filterGroup mutations via filterContext bridge
  void searchVersion;  // subscribe to searchFilter mutations via local bridge
  return computeFiltered(
    entities,
    activeFilterGroup as unknown as ApplyFn | undefined,
    searchFilter as unknown as ApplyFn | undefined
  );
});
```
This is the canonical replacement for the deleted `EntityListControls.svelte:56–73` circular chain. PRESERVE verbatim unless reproduction proves the bridge is the failure surface.

**testid prop-forward caveat** (line 143; UI-SPEC pre-flagged):
```svelte
<div data-testid="entity-list-with-controls" {...concatClass(restProps, 'flex flex-col')}>
```
The hardcoded testid is dead code (Svelte 5 attribute spread "later wins" — verified). RESEARCH §4 resolution: the prop-forwarded `data-testid="voter-results-list"` from `+layout.svelte:381` correctly overrides on warm-nav. The terminal fixture wait at `voter.fixture.ts:84` resolves when reached; failures happen earlier in the answer-loop.

**Optional cleanup pattern (LOW priority):**
```svelte
<!-- Phase 64 may opt to drop the dead testid for clarity, OR move it AFTER spread: -->
<div {...concatClass(restProps, 'flex flex-col')} data-testid={restProps['data-testid'] ?? 'entity-list-with-controls'}>
```
Behavior-equivalent today. Out of failure surface.

---

### `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` (route layout, URL-driven `$derived`)

**Default action:** NO functional change. Phase 62 D-10 source-order contract (drawer block BEFORE list container) and `content-visibility: auto` are LOCKED. Phase 64 may need to verify `voterCtx.matches[activeElectionId]?.[activeEntityType]` readiness on cold deeplinks (RESEARCH D-05 direction (a)) but reproduction is the gate.

**Analog:** itself + `voterContext.svelte.ts` push-based `$effect` mirror (for any readiness-gating decision).

**URL-as-SoT `$derived` graph pattern** (lines 99–148):
```svelte
const ENTITY_PLURALS = ['candidates', 'organizations'] as const;
type EntityPlural = (typeof ENTITY_PLURALS)[number];

const _parsedParams = $derived(parseParams(page));
const _urlElectionId = $derived(/* array→scalar normalization */);

const activeElectionId = $derived<string | undefined>(
  _urlElectionId ?? (elections.length === 1 ? elections[0].id : undefined)
);

const _urlPlural = $derived<EntityPlural | undefined>(
  _urlPluralRaw === 'candidates' || _urlPluralRaw === 'organizations' ? _urlPluralRaw : undefined
);

const activeEntityType = $derived.by<EntityType | undefined>(() => {
  const fromUrl: EntityType | undefined =
    _urlPlural === 'candidates' ? 'candidate' : _urlPlural === 'organizations' ? 'organization' : undefined;
  if (fromUrl && entityTabs.some((t) => t.type === fromUrl)) return fromUrl;
  return entityTabs[0]?.type;   // single-source fallback
});
```
PRESERVE verbatim. Any drawer-rendering bug fix MUST land in `drawerEntity` derivation (lines 165–186) without introducing a `$state` twin for URL-derivable state.

**Drawer-first source order + `content-visibility: auto`** (lines 281–399; D-10 LOCKED):
```svelte
{#if Object.values(voterCtx.nominationsAvailable).some(Boolean)}
  {#if drawerVisible && drawerEntity}
    <EntityDetailsDrawer
      entity={drawerEntity}
      onClose={handleDrawerClose}
      data-testid="voter-results-drawer" />
  {/if}

  <MainContent ...>
    {#snippet fullWidth()}
      <div
        class="bg-base-300 flex min-h-[120vh] flex-col items-center [content-visibility:auto]"
        style="content-visibility: auto;"
        data-testid="voter-results-list-container">
        ...
      </div>
    {/snippet}
  </MainContent>
{:else}
  <MainContent title={t('error.noNominations')}>...</MainContent>
{/if}
```
SOURCE ORDER IS BINDING. Drawer block first; list container second; both inside the `nominationsAvailable.some(Boolean)` gate.

**Silent-degradation drawer-entity guard** (lines 165–186):
```svelte
const drawerEntity = $derived.by<MaybeWrappedEntityVariant | undefined>(() => {
  if (!drawerVisible) return undefined;
  const entityType = page.params.entityTypeSingular as EntityType;
  const entityId = page.params.id!;
  try {
    const { entity } = getEntityAndTitle({
      dataRoot: $dataRoot,
      matches: voterCtx.matches,
      entityType,
      entityId,
      nominationId
    });
    return entity;
  } catch (e) {
    logDebugError(`Could not get entity details for ${entityType} ${entityId}. Error: ${...}`);
    return undefined;   // UI-SPEC empty-state "Deeplink to entity not found" — silent degradation
  }
});
```
On cold-nav with unpopulated `voterCtx.matches`, this catches and degrades silently. RESEARCH D-05 direction (a) flags this as a potential failure site — but RESEARCH §1 deprioritizes it because the deeplink fixture timeout happens BEFORE this code runs.

---

### `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (context provider, push-based `$effect` chain)

**Default action:** Phase 64 boundary explicitly EXCLUDES "deeper voter-app reactivity refactor". RESEARCH §2 traces fixture flake to `_selectedQuestionBlocks` not settling before `setTimeout(handleJump, 350ms)` fires in `[questionId]/+page.svelte:115–119`. The fix per RESEARCH §2 lives at the consumer (`handleAnswer` awaits `questionBlock` settle) or in fixture budget, NOT in `voterContext.svelte.ts` itself.

**Analog:** itself (canonical 7+ `$effect` chain at lines 81–287).

**Push-based `$state` mirror via `$effect` pattern** (lines 78–115):
```ts
let selectedElections = $state<Array<Election>>([]);
let selectedConstituencies = $state<Array<Constituency>>([]);

$effect(() => {
  const dr = reactiveDataRoot.current;
  const settings = appSettingsState.current;
  const electionId = _electionId.value;
  const constituencyId = _constituencyId.value;
  if (!dr.elections.length) {
    selectedElections = [];
    return;
  }
  const ids = electionId?.length ? electionId : getImpliedElectionIds({ ... });
  if (!ids?.length) {
    selectedElections = [];
    return;
  }
  try {
    selectedElections = ids.map((id) => dr.getElection(id));
  } catch (e) {
    logDebugError(`[selectedElections] Error fetching election: ${e}`);
    selectedElections = [];
  }
});
```
This is the QUESTION-04 fix (Phase 61-03) — pull-chain `$derived.by` was replaced with push-based `$effect` writing into `$state`. The pattern propagates correctly across destructured context accessors. Any new `voterContext` mirrors MUST follow this shape.

**Question-blocks chain** (lines 239–287) — DO NOT MODIFY in Phase 64. RESEARCH §2 hypothesis says this chain's settle race is the fixture flake mechanism; the FIX site is `[questionId]/+page.svelte:handleAnswer`, not here.

**filterContext init pattern** (line 372):
```ts
// Phase 62 D-05: initialize the dedicated filterContext using a closure over
// the just-built FilterTree.
initFilterContext({ entityFilters: () => _entityFilters.value });
```
`_entityFilters` is built by `filterStore({ … })` at line 360. The closure pattern (function-getter, not value) preserves reactivity across the boundary. PRESERVE.

---

### `tests/tests/fixtures/voter.fixture.ts` (E2E fixture, sequential await chain)

**No in-codebase analog** — this is the only voter-journey fixture. Treat as standalone.

**Failure surface (lines 58–68; RESEARCH §1 PRIMARY):**
```ts
for (let i = 0; i < voterAnswerCount; i++) {
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption).nth(voterAnswerIndex);
  await answerOption.waitFor({ state: 'visible' });

  const urlBefore = page.url();
  await answerOption.click();

  // Wait for auto-advance: URL changes to the next question or results page
  await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
  // ↑ THIS LINE is the failure point for RESULTS-01 + RESULTS-02 + D-15 + D-08 shapes 3+4
  ...
}
```

**Phase 64 fix candidates (RESEARCH §2 — pick after reproduction):**

- **Option F1 — Increase fixture budget:** change `timeout: 5000` to `timeout: 10000` on line 68. Pragmatic, symptomatic, cheap. Preserves 30s test budget headroom for retries.
- **Option F2 — Settle gate at consumer (preferred per RESEARCH):** modify `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/[questionId]/+page.svelte:115–119` so `handleAnswer` awaits `questionBlock` settling before scheduling `handleJump`. Smaller blast radius than touching the fixture; fixes the underlying race instead of widening the timeout.
- **Option F3 — Reduce default `voterAnswerCount` from 16 to 12:** per RESEARCH §2; verify `appSettings.matching.minimumAnswers` default is ≤ 8 first. Fewer answer-loop iterations → fewer accumulated races.

**Terminal wait (line 84) — KEEP unchanged:**
```ts
await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 10000 });
```
This is the `voter-results-list` testid sentinel. Resolves correctly per RESEARCH §4 testid-forwarding analysis — failures happen in the answer-loop above, not here.

---

### `tests/tests/specs/voter/voter-results.spec.ts` (E2E spec, request-response Playwright)

**Default action:** D-11 — replace 6 `test.skip(true, …)` paths in RESULTS-01/02 + D-14 + D-15 with poll-with-timeout hard assertions. RESEARCH Pitfall 4 binds: use `expect.poll(...).toBeGreaterThan(0)` NOT `expect(...).toHaveCount(1)` — the reactive chain needs settle time.

**Analog:** RESEARCH Code Example 4 (verbatim) + the existing pass-locked tests in the same file (lines 77–148) for hard-assertion idiom.

**Existing hard-assertion idiom** (lines 77–93; pass-locked test):
```ts
test('should display candidates section with result cards', async ({ answeredVoterPage: page }) => {
  const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
  await expect(candidateSection).toBeVisible();

  const firstCard = page.getByTestId(testIds.voter.results.card).first();
  await expect(firstCard).toBeVisible();

  const cardCount = page.getByTestId(testIds.voter.results.card);
  await expect(cardCount).toHaveCount(visibleCandidateCount);
});
```
This is the canonical "test exercises locator + asserts visible/count after fixture lands" pattern. D-11 hardenings should follow this idiom but use `expect.poll` for race-tolerant assertions on filter-button rendering.

**Skip-path replacement pattern (D-11 + RESEARCH Code Example 4 + Pitfall 4):**

REPLACE (current at lines 169–172, 178–181, 203–211, 232–242):
```ts
const filterButton = page.getByTestId('entity-list-filter');
if ((await filterButton.count()) === 0) {
  test.skip(true, 'No filters available in the seed.');
  return;
}
```

WITH (poll-with-timeout — gives the reactive chain time to settle while still failing deterministically if the button never appears):
```ts
const filterButton = page.getByTestId('entity-list-filter');
await expect
  .poll(() => filterButton.count(), {
    timeout: 5000,
    message: 'Party filter button must render — e2e seed has 4 parties (D-11 + D-12)'
  })
  .toBeGreaterThan(0);
```

**Console-error watcher pattern** (lines 155–161; RESULTS-01 negative assertion — PRESERVE):
```ts
const consoleErrors: Array<string> = [];
page.on('console', (msg) => {
  const txt = msg.text();
  if (msg.type() === 'error' || txt.includes('effect_update_depth_exceeded')) {
    consoleErrors.push(`${msg.type()}: ${txt}`);
  }
});
// ... later:
expect(
  consoleErrors.filter((e) => e.includes('effect_update_depth_exceeded'))
).toEqual([]);
```
This is the binding negative assertion for RESULTS-01. PRESERVE verbatim.

**Deeplink testing pattern** (lines 267–306; PRESERVE — failure is upstream in fixture, not in test body):
```ts
const firstCardLink = page.getByTestId('entity-card-action').first();
const href = await firstCardLink.getAttribute('href');
const parsed = parseResultHref(href);
expect(parsed).not.toBeUndefined();

await page.goto(`/results/candidates/candidate/${parsed!.id}${parsed!.search}`);
await page.waitForLoadState('domcontentloaded');

await expect(page.getByTestId(DRAWER_TESTID)).toBeVisible({ timeout: 5000 });
await expect(page.getByTestId(LIST_CONTAINER_TESTID)).toBeVisible();
```

---

### `packages/filters/src/group/filterGroup.ts` (CONDITIONAL — pure-TS class, event-driven)

**Default action:** NO MODIFICATION. RESEARCH Pitfall 2 forbids `import 'svelte/...'` inside `packages/filters/src/`. D-01 hard-constrains UI-framework agnosticism. Acceptance gate: `grep -rn "from 'svelte" packages/filters/src/` returns zero.

**Analog:** itself.

**Existing pure-JS subscription registry** (lines 17, 99–115; reusable as-is):
```ts
private _onChange: Set<(filter: typeof this) => void> = new Set();

doOnChange() {
  if (this.suspendOnChange) return;
  this._onChange.forEach((f) => f(this));
}

onChange(handler: (filterGroup: typeof this) => void, add = true) {
  if (add) {
    this._onChange.add(handler);
  } else {
    this._onChange.delete(handler);
  }
}
```
Permissible categories of D-01-compliant additions IF reproduction demands it:
- (a) Pure-TS API additions (e.g., `getSnapshot(): { filters: Array<...>, active: boolean }`)
- (b) Internal correctness/notification-ordering fixes in `doOnChange` dispatch
- (c) `Filter.setRule` / `Filter._rules` immutability guarantees (in sibling `filter/base/filter.ts`)
- (d) New generic accessors that consumers can wrap themselves

EXCLUDED: any Svelte-specific code path. The consumer-side wrapper (`reactiveFilterGroup.svelte.ts` per RESEARCH Code Example 2) is where `createSubscriber` lives, NOT here.

---

### `packages/dev-seed/src/templates/e2e.ts` (CONDITIONAL — seed template, batch)

**Default action:** D-04 PREFERRED-MINIMUM is "fix consumer-side wiring first". The e2e template ALREADY ships 4 parties with candidate nominations (verified by RESEARCH §3 against lines 192–228). If the EnumeratedFilter for party isn't rendering, fix the consumer (filterContext / EntityListWithControls) first; only extend the template if a true seed gap is identified.

**Analog:** Phase 63 E2E-02 precedent (this same file) — `app_settings.fixed[0].settings` extension is the template-driven app_settings precedent.

**Phase 63 E2E-02 extension pattern (precedent)** (lines 60–80; the `E2E_BASE_APP_SETTINGS` block):
```ts
/**
 * Base `app_settings.settings` JSONB payload for the e2e template (Phase 63 E2E-02).
 *
 * Source of truth for the legacy `updateAppSettings(...)` call that lived in
 * `tests/tests/setup/data.setup.ts:53-72` pre-Phase-63. Copied verbatim so
 * Playwright specs that depend on the 5 top-level keys (questions, results,
 * entities, notifications, analytics) see the same persisted state they got
 * before the migration.
 *
 * Consumed by:
 *   - This file's `e2eTemplate.app_settings.fixed[0].settings` (base).
 *   - `tests/tests/setup/templates/variant-*.ts` — each variant composes this
 *     base with a variant-specific overlay via mergeSettings(...).
 */
```
Any Phase 64 D-04 extension MUST follow this shape: declare the additional rows/settings as named exports, wire into `e2eTemplate.<table>.fixed[]` with full literal external_ids, citation comment to `64-CONTEXT.md` D-04 + `64-RESEARCH.md` §3, and ensure variant overlays compose cleanly via `mergeSettings`.

**Audit-citation discipline** (file-level docstring, lines 28–46): every fixed[] entry carries a `§N.M` audit reference. New entries added by Phase 64 MUST cite `64-RESEARCH.md` §3 (filter rendering for D-14) explicitly so future maintainers know the seed-test contract.

---

### `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` (NEW artifact, batch capture)

**Analog:** `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json` (4550 lines; same shape).

**Capture invocation pattern** (Phase 64 D-07 + D-08 single-capture):
```bash
yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json \
  > .planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json
```
ONE invocation serves both purposes (D-07 PASS verification of 5 named tests + D-08 baseline for constants regen). RESEARCH Pitfall 6 forbids running twice.

**Artifact location convention** (mirror Phase 63):
- `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json` — Phase 63 baseline (preserved as-is per Phase 63 D-15)
- `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` — Phase 64 baseline (NEW; Phase 64 D-08 anchor)
- `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` — v2.5 baseline (preserved per Phase 63 D-15, honored by Phase 64)

---

### `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` (modified — constants regen ONLY)

**Default action:** D-08 + RESEARCH Pitfall 5 — regenerate ONLY the 3 const arrays (`PASS_LOCKED_TESTS`, `DATA_RACE_TESTS`, `CASCADE_TESTS`) at lines 53–138. RULES (lines 293–377) are scope-locked — DO NOT MODIFY.

**Analog:** itself.

**Constants-block shape (CURRENT, lines 53–138)** — pattern to follow when regenerating:
```ts
/** 41 tests locked PASSING on baseline; any regression is a BLOCKER. */
const PASS_LOCKED_TESTS: ReadonlyArray<string> = [
  'auth-setup :: setup/auth.setup.ts > authenticate as candidate',
  'candidate-app :: specs/candidate/candidate-auth.spec.ts > should login with valid credentials',
  // ... 41 entries, sorted, '<projectName> :: <specFile> > <specTitle>' format
];

/** 10 tests in the flake pool; they may pass or fail post-swap. Pool MUST NOT grow. */
const DATA_RACE_TESTS: ReadonlyArray<string> = [
  'voter-app :: specs/voter/voter-detail.spec.ts > should display candidate answers correctly in info and opinions tabs',
  // ... 10 entries
];

/** 25 tests cascaded (did-not-run) on baseline; must not NEW-regress. */
const CASCADE_TESTS: ReadonlyArray<string> = [
  'data-setup-constituency :: setup/variant-constituency.setup.ts > import constituency dataset',
  // ... 25 entries
];
```

**ID format** (line 220 of `flattenReport`):
```ts
const id = `${projectName} :: ${specFile} > ${specTitle}`;
```
ALL regenerated entries MUST use this exact shape.

**Regen workflow (RESEARCH Code Example 5)**:
1. Capture single full-suite JSON to `post-fix/playwright-report.json` (D-07 invocation above).
2. Use `flattenReport` (exported, line 200) to produce `Array<FlatTest>` from the JSON.
3. Partition by status:
   - `status === 'pass'` → `PASS_LOCKED_TESTS`
   - imgproxy-upload + 13 cascades + any `status === 'flaky'` → `DATA_RACE_TESTS` (D-09)
   - `status === 'cascade'` (skipped/did-not-run) → `CASCADE_TESTS`
4. Sort each array alphabetically.
5. Patch the 3 const arrays in `diff-playwright-reports.ts:53–138`. Update the `/** N tests … */` JSDoc comment counts.
6. Self-identity smoke test: `tsx diff-playwright-reports.ts post-fix/playwright-report.json post-fix/playwright-report.json` MUST output `PARITY GATE: PASS`.

**RESEARCH Pitfall 5 binding constraint:** the 14 imgproxy-tied tests (1 direct + 13 cascades) ALL go into `DATA_RACE_TESTS`. Document the rationale inline in the regenerated file. Do NOT change the rule logic.

---

## Shared Patterns

### Context-per-concern with Symbol-keyed `setContext`/`getContext`

**Source:** `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:8–21` + `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:23–28`
**Apply to:** Any new context modules (NONE expected in Phase 64; binding for future LLM chat follow-up).

```ts
const CONTEXT_KEY = Symbol();

export function getXContext(): XContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getXContext() called before initXContext()');
  return getContext<XContext>(CONTEXT_KEY);
}

export function initXContext(args: InitXContextArgs): XContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initXContext() called for a second time');
  // ... build ctx
  return setContext<XContext>(CONTEXT_KEY, ctx);
}
```

### `$effect` cleanup-return discipline (RESEARCH Pitfall 2)

**Source:** `filterContext.svelte.ts:80–88` + `EntityListWithControls.svelte:88–99`
**Apply to:** Any `$effect` that subscribes to an external (non-rune) source — `FilterGroup.onChange`, `Filter.onChange`, custom event-emitters.

```ts
$effect(() => {
  const target = someExternalSource;
  if (!target) return;
  const handler = () => { /* mutate $state mirror */ };
  target.onChange(handler, true);
  return () => target.onChange(handler, false);   // BINDING — leaks listeners without this
});
```

### Push-based `$state` mirror via `$effect` (Phase 61 QUESTION-04 fix)

**Source:** `voterContext.svelte.ts:78–115` (selectedElections) + `:117–144` (selectedConstituencies) + `:186–220` (question categories)
**Apply to:** Any context property that must propagate through destructured accessors. RESEARCH §2 hypothesis cites `_selectedQuestionBlocks` settling in this chain as the fixture-flake mechanism.

```ts
let xMirror = $state<XType>(initialValue);

$effect(() => {
  const upstream = someUpstreamRune;
  // ... compute next value
  xMirror = nextValue;
});

// Context exposes via getter (NOT direct property — avoids stale capture):
return setContext<XContext>(CONTEXT_KEY, {
  get x() { return xMirror; }
});
```

### Defensive dependency-edge `void`-read (Phase 62 D-04 + RESEARCH §Pattern 3)

**Source:** `filterContext.svelte.ts:63` + `EntityListWithControls.svelte:110–111`
**Apply to:** Any `$derived` consumer that depends on `$state` mutations from an external bridge BUT doesn't otherwise read the bridge's `$state` value.

```ts
const computed = $derived.by(() => {
  void fctx.version;     // subscribe to filterGroup mutations via the bridge
  void searchVersion;    // subscribe to search-filter mutations via local bridge
  return /* compute over state that mutates via the bridge */;
});
```

### URL-as-single-source-of-truth (Phase 62 D-09, D-13)

**Source:** `+layout.svelte:99–148` (URL-derived `$derived` graph)
**Apply to:** All routable state — tab index, drawer visibility, active entity type. NEVER introduce `$state` twins for URL-derivable state.

```svelte
const _urlPlural = $derived<EntityPlural | undefined>(
  /* normalize page.params + page.url.searchParams via parseParams */
);
const activeEntityType = $derived.by(() => {
  /* derive from URL with single-fallback */
});
```

### Drawer-first source order + `content-visibility: auto` (Phase 62 D-10)

**Source:** `+layout.svelte:281–399`
**Apply to:** Any cold-deeplink rendering that prioritizes one content block over another.

```svelte
{#if drawerVisible && drawerEntity}
  <EntityDetailsDrawer ... />     <!-- SOURCE-ORDER FIRST: paints first on cold-nav -->
{/if}

<MainContent ...>
  {#snippet fullWidth()}
    <div style="content-visibility: auto;">     <!-- LAYOUT/PAINT DEFERRED until in-view -->
      ...
    </div>
  {/snippet}
</MainContent>
```

### Single-invocation Playwright capture for parity (Phase 64 D-07 + D-08; RESEARCH Pitfall 6)

**Source:** `tests/playwright.config.ts` + `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json` (precedent)
**Apply to:** Plan 64-03 verification.

```bash
yarn playwright test -c ./tests/playwright.config.ts \
  --workers=1 --reporter=json \
  > .planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json
```
ONE capture verifies the 5 named tests AND seeds the constants-regen baseline. Two captures = double wall time + flake variance — explicitly forbidden.

### UI-framework agnosticism (Phase 64 D-01 hard constraint)

**Source:** `packages/filters/src/group/filterGroup.ts:17, 99–115` (pure-JS `Set<callback>`)
**Apply to:** Any Phase 64 modification to `packages/filters/src/**`.

**Acceptance gate:**
```bash
grep -rn "from 'svelte" packages/filters/src/
# Expected output: (no matches)
```
If this returns ANY result after Phase 64 changes, the change is rejected.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `tests/tests/fixtures/voter.fixture.ts` | E2E fixture | sequential await chain | The voter-journey fixture is unique in tree; no other fixture answers a multi-step opinion-question loop. Closest siblings (`tests/tests/fixtures/*`) are auth/setup fixtures with different data-flow shapes. Treat as standalone — Phase 64 modifications follow the file's own existing patterns + RESEARCH §2's three fix candidates (F1/F2/F3). |

---

## Metadata

**Analog search scope:**
- `apps/frontend/src/lib/contexts/**` (filter, voter, app contexts)
- `apps/frontend/src/lib/dynamic-components/entityList/**`
- `apps/frontend/src/routes/(voters)/**` (results layout + sibling layouts for `$effect.root` references)
- `packages/filters/src/group/**` (FilterGroup as sole modification target conditional on D-01)
- `packages/dev-seed/src/templates/**` (e2e template precedent for D-04)
- `tests/tests/specs/voter/**` (voter-results spec + sibling specs for hard-assertion idioms)
- `tests/tests/fixtures/**` (voter.fixture analog search — none found)
- `.planning/phases/59-e2e-fixture-migration/scripts/**` (diff-playwright-reports script)
- `.planning/phases/63-e2e-template-extension-greening/post-v2.6/**` (precedent capture artifact)

**Files scanned:** ~12 production files, 4 test files, 3 dev-seed files, 2 planning artifacts.

**Pattern extraction date:** 2026-04-27.

**Key cross-cutting findings:**
1. The Phase 62 incumbent reactivity bridge is unit-test-proven; 4 of 5 failures are FIXTURE timeouts not reactivity bugs (RESEARCH §1). Default plan posture: PRESERVE incumbents, escalate only if reproduction surfaces a defect.
2. The `voterContext.svelte.ts` push-based `$effect` mirror chain (lines 78–287) is the established shape for context state propagation; RESEARCH §2 cites the question-blocks subset as the likely fixture-flake mechanism but explicitly puts the FIX site at `[questionId]/+page.svelte` not in voterContext itself.
3. The parity-gate script's RULES are locked; only the 3 embedded const arrays change in D-08 regen. RESEARCH Pitfall 5 binds the 14 imgproxy-tied tests into `DATA_RACE_TESTS`.
4. UI-framework agnosticism (D-01) is enforced by a single grep gate. Any Svelte primitive in `packages/filters/src/` is a code-review hard rejection.
