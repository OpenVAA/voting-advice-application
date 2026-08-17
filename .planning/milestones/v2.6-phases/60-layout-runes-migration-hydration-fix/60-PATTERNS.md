# Phase 60: Layout Runes Migration & Hydration Fix - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 5 (3 modified + 1 potentially deleted + 1 potentially created)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/src/routes/+layout.svelte` (MOD) | layout / SvelteKit route component | request-response (SSR loader → `$derived` branch → render) | `apps/frontend/src/routes/admin/+layout.svelte` | exact (same framework role + data flow shape; already runes-idiomatic) |
| `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` (MOD) | layout / SvelteKit route component (nested, auth-scoped) | request-response (SSR loader → `$derived` enum → render) | `apps/frontend/src/routes/admin/+layout.svelte` + `apps/frontend/src/lib/admin/utils/loadElectionData.ts` | exact (same role) + role-match (same `dataRoot.update(() => provide*(…))` batching idiom) |
| `apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte` (POTENTIALLY DELETED) | component / UI overlay renderer | event-driven (store shift on close) | self (already the reference) | N/A — this IS the analog for the wrapper-component fallback (D-02) |
| `apps/frontend/src/lib/components/popupRenderer/index.ts` (POTENTIALLY DELETED) | barrel export | N/A | self | N/A — 1-line re-export, deleted with the component if removal path taken |
| `tests/tests/specs/voter/voter-popup-hydration.spec.ts` (POTENTIALLY NEW) OR new describe block in `voter-popups.spec.ts` | test / E2E Playwright spec | event-driven (setTimeout → popup render) | `tests/tests/specs/voter/voter-popups.spec.ts` | exact (same popup domain; same `SupabaseAdminClient.updateAppSettings` fixture pattern) |

---

## Pattern Assignments

### `apps/frontend/src/routes/+layout.svelte` (layout, request-response) — LAYOUT-01 + D-05

**Primary analog:** `apps/frontend/src/routes/admin/+layout.svelte` (canonical runes-idiomatic layout shape — no `$effect + .then()`, pure `$derived` branch on `fromStore(...)`-bridged settings).

**Secondary analog (for the `dataRoot.update(() => provide*(…))` batching idiom):** `apps/frontend/src/lib/admin/utils/loadElectionData.ts` lines 56–62.

**Self-reference (the code being refactored) — current buggy pattern to REMOVE:**

`apps/frontend/src/routes/+layout.svelte` lines 74–93 — the `$effect + Promise.all(...).then(...)` pattern:

```svelte
let error = $state<Error | undefined>();
let ready = $state(false);
let underMaintenance = $state(false);

$effect(() => {
  // Read data prop fields to establish dependency tracking
  const settingsP = data.appSettingsData;
  const customP = data.appCustomizationData;
  const electionP = data.electionData;
  const constituencyP = data.constituencyData;

  // Reset state before async work
  error = undefined;
  ready = false;
  underMaintenance = false;

  Promise.all([settingsP, customP, electionP, constituencyP]).then((results) => {
    error = update(results);
  });
});
```

**Imports pattern to preserve** (lines 16–38 — do NOT touch):

```svelte
<script lang="ts">
  import '../app.css';
  import { staticSettings } from '@openvaa/app-shared';
  import { onDestroy } from 'svelte';
  import { fromStore } from 'svelte/store';
  import { afterNavigate, beforeNavigate, onNavigate } from '$app/navigation';
  import { updated } from '$app/state';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { initAppContext } from '$lib/contexts/app';
  import { initAuthContext } from '$lib/contexts/auth';
  import { initComponentContext } from '$lib/contexts/component';
  import { initDataContext } from '$lib/contexts/data';
  import { initI18nContext } from '$lib/contexts/i18n';
  import { initLayoutContext } from '$lib/contexts/layout';
  import { PopupRenderer } from '$lib/components/popupRenderer';
  import { FeedbackModal } from '$lib/dynamic-components/feedback/modal';
  import { logDebugError } from '$lib/utils/logger';
  import MaintenancePage from './MaintenancePage.svelte';
  import type { Snippet } from 'svelte';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
```

**Context init pattern to preserve verbatim** (lines 42–67):

```svelte
initI18nContext();
initComponentContext();
initDataContext();
const {
  appSettings: appSettingsStore,
  dataRoot: dataRootStore,
  openFeedbackModal: openFeedbackModalStore,
  popupQueue,
  sendTrackingEvent: sendTrackingEventStore,
  startPageview,
  submitAllEvents,
  t
} = initAppContext();
initLayoutContext();
initAuthContext();

// Bridge stores to runes reactivity
const appSettings = fromStore(appSettingsStore);
const dataRoot = fromStore(dataRootStore);
const openFeedbackModal = fromStore(openFeedbackModalStore);
const sendTrackingEvent = fromStore(sendTrackingEventStore);
```

**Runes-idiomatic branch pattern to copy from admin layout** (`apps/frontend/src/routes/admin/+layout.svelte` lines 19–27, 44–60):

```svelte
<script lang="ts">
  let { children }: { children: Snippet } = $props();
  const { appSettings, appType, t } = initAdminContext();
  const appSettingsState = fromStore(appSettings);
  // ... no $effect + .then(), no intermediate $state flags ...
</script>

{#if !appSettingsState.current.dataAdapter.supportsAdminApp}
  <MaintenancePage ... />
{:else if !appSettingsState.current.access.adminApp}
  <MaintenancePage ... />
{:else}
  <Layout {menuId} bind:isDrawerOpen>
    {@render children?.()}
  </Layout>
{/if}
```

Key: **reads store state directly in template / derives synchronously; no `.then()`; no intermediate `$state` flags**. Root layout post-refactor converges on this shape.

**Core refactor pattern (from RESEARCH.md Pattern 1 sketch):**

Replace the `$effect` + `$state` flags (lines 74–93) with `$derived` validation + a separate `$effect` for side-effects:

```svelte
// Pure validation — no side effects, no microtasks.
const validity = $derived.by(() => {
  if (!isValidResult(data.appSettingsData, { allowEmpty: true }))
    return { error: new Error('Error loading app settings data') };
  if (!isValidResult(data.appCustomizationData, { allowEmpty: true }))
    return { error: new Error('Error loading app customization data') };
  if (!isValidResult(data.electionData))
    return { error: new Error('Error loading election data') };
  if (!isValidResult(data.constituencyData))
    return { error: new Error('Error loading constituency data') };
  return {
    appSettingsData: data.appSettingsData,
    electionData: data.electionData,
    constituencyData: data.constituencyData
  };
});

const error = $derived('error' in validity ? validity.error : undefined);
const underMaintenance = $derived(
  !('error' in validity) && (validity.appSettingsData.access?.underMaintenance ?? false)
);
const ready = $derived(!('error' in validity));

// Side effect — runs on mount after $derived is computed. No microtask.
$effect(() => {
  if ('error' in validity) return;
  dataRoot.current.update(() => {
    dataRoot.current.provideElectionData(validity.electionData);
    dataRoot.current.provideConstituencyData(validity.constituencyData);
  });
});
```

**`dataRoot.update(() => { provide*(...) })` batching idiom** — copy from `apps/frontend/src/lib/admin/utils/loadElectionData.ts` lines 56–62:

```ts
dataRoot.update(() => {
  dataRoot.provideElectionData(electionData);
  dataRoot.provideConstituencyData(constituencyData);
  dataRoot.provideQuestionData(questionData);
  dataRoot.provideEntityData(nominationData.entities);
  dataRoot.provideNominationData(nominationData.nominations);
});
```

Root layout uses a subset (only `provideElectionData` + `provideConstituencyData`); protected layout uses `provideQuestionData` + `provideEntityData` + `provideNominationData`.

**Orthogonal `$effect` blocks to leave UNTOUCHED per D-07** (lines 95–97, 129–131, 144–151, 159–161):

```svelte
$effect(() => {
  if (error) logDebugError(error.message);
});

$effect(() => {
  if (umamiRef?.trackEvent) sendTrackingEventStore.set(umamiRef.trackEvent);
});

$effect(() => {
  if (!appSettings.current.analytics?.platform) return;
  const handler = () => {
    if (document.visibilityState === 'hidden') submitAllEvents();
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
});

$effect(() => {
  if (feedbackModalRef) openFeedbackModalStore.set(() => feedbackModalRef?.openFeedback());
});
```

These do NOT participate in the hydration race — they read already-reactive stores or bind to refs. Leave as-is.

**Template branch pattern to preserve shape** (lines 186–206) — post-refactor the `{#if}` chain conditions read `$derived` values directly instead of `$state` flags:

```svelte
{#if error}
  <ErrorMessage class="bg-base-300 h-dvh" />
{:else if !ready}
  <Loading class="bg-base-300 h-dvh" />
{:else if underMaintenance}
  <MaintenancePage />
{:else}
  {@render children?.()}
  <FeedbackModal bind:this={feedbackModalRef} />
  {#if appSettings.current.analytics?.platform}
    ...
  {/if}
{/if}

<PopupRenderer {popupQueue} />
```

---

### `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` (layout, request-response) — LAYOUT-02 + D-01/03

**Primary analog:** Same-file current implementation (lines 66–104) — the pattern to REMOVE.

**Secondary analog:** `apps/frontend/src/routes/admin/+layout.svelte` — for the runes-mode branch-on-derived-value shape.

**Tertiary analog (for `$dataRoot.update(() => { provide*(…) })` 5-call batching):** `apps/frontend/src/lib/admin/utils/loadElectionData.ts` lines 56–62 (shown above).

**Self-reference — current buggy pattern to REMOVE** (lines 66–104):

```svelte
let layoutState = $state<'loading' | 'error' | 'terms' | 'ready'>('loading');

$effect(() => {
  // Read data synchronously to register as dependency
  const questionData = data.questionData;
  const candidateUserData = data.candidateUserData;
  // Reset state
  layoutState = 'loading';
  Promise.all([questionData, candidateUserData]).then((resolved) => {
    update(resolved);
  });
});

async function update([questionData, candidateUserData]: [
  DPDataType['questions'] | Error,
  CandidateUserData<true> | undefined
]): Promise<void> {
  if (!isValidResult(questionData, { allowEmpty: true })) {
    logDebugError('Error loading question data');
    layoutState = 'error';
    return;
  }
  if (!candidateUserData?.nominations || !candidateUserData?.candidate) {
    logDebugError('Error loading candidate data');
    layoutState = 'error';
    return;
  }
  const { entities, nominations } = candidateUserData.nominations;
  $dataRoot.provideQuestionData(questionData);
  $dataRoot.provideEntityData(entities);
  $dataRoot.provideNominationData(nominations);
  await tick();                                 // ← DROP per A2 (userData.init is synchronous)
  userData.init(candidateUserData);
  layoutState = !candidateUserData.candidate.termsOfUseAccepted ? 'terms' : 'ready';
}
```

**Imports pattern — preserve but FIX `data: any`** (lines 11–26) — the current `data: any` violates the TypeScript-strictly CLAUDE.md rule:

```svelte
<script lang="ts">
  import { tick } from 'svelte';                      // ← DROP — no longer needed
  import type { Snippet } from 'svelte';
  import { TermsOfUseForm } from '$candidate/components/termsOfUse';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { getCandidateContext } from '$lib/contexts/candidate/candidateContext.svelte';
  import { logDebugError } from '$lib/utils/logger';
  import MainContent from '../../MainContent.svelte';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { CandidateUserData } from '$lib/api/base/dataWriter.type';
  // ADD: import type { LayoutData } from './$types';

  let { data, children }: { data: any; children: Snippet } = $props();  // ← FIX to LayoutData type
```

**Context access pattern to preserve verbatim** (line 32):

```svelte
const { dataRoot, logout, t, userData } = getCandidateContext();
```

**Core refactor pattern (from RESEARCH.md Pattern 1 protected sketch — executor may choose to collapse the enum, but recommended to retain):**

```svelte
// $derived validation — 4-way enum retained as $derived (D-03).
// `data.*` is already resolved (loader awaits everything in +layout.server.ts).
const validity = $derived.by(() => {
  if (!isValidResult(data.questionData, { allowEmpty: true }))
    return { state: 'error' as const };
  const ud = data.candidateUserData;
  if (!ud?.nominations || !ud?.candidate)
    return { state: 'error' as const };
  return {
    state: 'resolved' as const,
    questionData: data.questionData,
    candidate: ud.candidate,
    entities: ud.nominations.entities,
    nominations: ud.nominations.nominations,
    userData: ud
  };
});

// After terms acceptance, termsAccepted flips; recompute branch.
let termsAcceptedLocal = $state(false);
const layoutState = $derived<'loading' | 'error' | 'terms' | 'ready'>(
  validity.state === 'error'
    ? 'error'
    : !validity.candidate.termsOfUseAccepted && !termsAcceptedLocal
      ? 'terms'
      : 'ready'
);

// Side effect — provide data to $dataRoot + init userData once data is valid.
// Reads $derived validity; no .then(); no await tick() (userData.init is synchronous).
$effect(() => {
  if (validity.state !== 'resolved') return;
  $dataRoot.update(() => {
    $dataRoot.provideQuestionData(validity.questionData);
    $dataRoot.provideEntityData(validity.entities);
    $dataRoot.provideNominationData(validity.nominations);
  });
  userData.init(validity.userData);
});
```

**Form handlers pattern — SIMPLIFY** (lines 41–54) — after refactor `handleSubmit` no longer writes `layoutState` directly; the `$derived` recomputes from `termsAcceptedLocal`:

```svelte
// Before (current, lines 41–48):
async function handleSubmit() {
  if (!termsAccepted) return;
  status = 'loading';
  userData.setTermsOfUseAccepted(new Date().toJSON());
  await userData.save();
  layoutState = 'ready';                         // ← DROP — $derived handles this
  status = 'success';
}

// After:
async function handleSubmit() {
  if (!termsAcceptedLocal) return;
  status = 'loading';
  userData.setTermsOfUseAccepted(new Date().toJSON());
  await userData.save();
  status = 'success';
  // layoutState recomputes via $derived — no explicit write needed.
}
```

**Template branch pattern to preserve verbatim** (lines 107–131) — the 4-way `{#if}` chain works unchanged once `layoutState` is `$derived`:

```svelte
{#if layoutState === 'error'}
  <ErrorMessage class="bg-base-300" />
{:else if layoutState === 'loading'}
  <Loading />
{:else if layoutState === 'terms'}
  <MainContent title={t('dynamic.candidateAppPrivacy.consent.title')}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('dynamic.candidateAppPrivacy.consent.heroEmoji')} />
      </figure>
    {/snippet}
    <TermsOfUseForm bind:termsAccepted={termsAcceptedLocal} />
    {#snippet primaryActions()}
      <Button
        text={t('common.continue')}
        variant="main"
        disabled={!termsAcceptedLocal}
        loading={status === 'loading'}
        onclick={handleSubmit} />
      <Button color="warning" text={t('common.logout')} loading={status === 'loading'} onclick={handleCancel} />
    {/snippet}
  </MainContent>
{:else}
  {@render children?.()}
{/if}
```

Bindings update from `termsAccepted` → `termsAcceptedLocal` consistently.

---

### `apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte` (component, event-driven) — LAYOUT-03 + D-08

**Two paths** depending on empirical removal outcome:

#### Path A: Deletion (D-08 4a — if new E2E passes with inline popup)

Delete the component and its barrel. Inline the body into root `+layout.svelte` just after the `</PopupRenderer>` slot (currently line 209).

**Self-reference — the entire reusable body** (lines 10–23):

```svelte
<script lang="ts">
  import { fromStore } from 'svelte/store';
  import type { PopupStore } from '$lib/contexts/app/popup/popupStore.type';

  let { popupQueue }: { popupQueue: PopupStore } = $props();

  const queueState = fromStore(popupQueue);
  let currentItem = $derived(queueState.current);
</script>

{#if currentItem}
  {@const item = currentItem}
  <svelte:component this={item.component} {...item.props ?? {}} onClose={() => { item.onClose?.(); popupQueue.shift(); }} />
{/if}
```

**Inlining transformation** — per RESEARCH.md Pitfall 5, swap `<svelte:component>` for the runes-idiomatic `{@const Component = …}` + `<Component …>` form:

```svelte
<!-- In root +layout.svelte, replace `<PopupRenderer {popupQueue} />` (line 209) with: -->

<!-- Popup service: inline renderer; popupQueue already fromStore-bridged above -->
{#if popupQueueState.current}
  {@const item = popupQueueState.current}
  {@const Component = item.component}
  <Component {...item.props ?? {}} onClose={() => { item.onClose?.(); popupQueue.shift(); }} />
{/if}
```

Requires adding to the existing bridge block:

```svelte
const popupQueueState = fromStore(popupQueue);
```

(Alongside the existing `appSettings`, `dataRoot`, `openFeedbackModal`, `sendTrackingEvent` bridges on lines 64–67.)

Also delete:
- `apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte`
- `apps/frontend/src/lib/components/popupRenderer/index.ts`
- Import line in root `+layout.svelte` line 32: `import { PopupRenderer } from '$lib/components/popupRenderer';`
- Line 208 comment + line 209 `<PopupRenderer {popupQueue} />` usage

#### Path B: Retention (D-08 4b — if new E2E fails with inline popup)

Keep the component. Add the rationale comment required by D-10 + SC-3. Analog for the comment style — there is no direct in-repo analog for "documented-workaround comment naming an upstream issue", so use this shape (referenced format from D-10 bullets):

```svelte
<!--@component
Renders the first popup from the popup queue store.

### Usage
```svelte
<PopupRenderer {popupQueue} />
```

### Rationale (Svelte 5 runes-mode workaround)

Retained in v2.6 Phase 60 after empirical removal attempt failed.

**Upstream Svelte 5 limitation:** Store `.set()` from `setTimeout` callbacks is not
tracked by `$derived` when the derivation lives in the root-layout runes-mode
component context during post-hydration first flush. Wrapping the derivation in
a nested runes-mode component (this file) restores tracking, because each
component establishes its own reactive scope.

**Minimum reproduction:** `tests/tests/specs/voter/voter-popup-hydration.spec.ts`
(or the popup-hydration describe block in `voter-popups.spec.ts`) —
`setTimeout` → `popupQueue.push(...)` during full page load.

**Upstream issue:** See TODO-UPSTREAM-LINK (filed post-Phase 60 per D-04).

**Removal viability:** Retry deletion once upstream Svelte issue is resolved
(re-run the popup-hydration spec with inline rendering in root `+layout.svelte`
after upgrading Svelte past the fix).
-->

<script lang="ts">
  import { fromStore } from 'svelte/store';
  import type { PopupStore } from '$lib/contexts/app/popup/popupStore.type';
  ...
</script>
```

---

### `tests/tests/specs/voter/voter-popup-hydration.spec.ts` (test, event-driven) — D-09

**Primary analog:** `tests/tests/specs/voter/voter-popups.spec.ts` (entire file — same popup domain, same `SupabaseAdminClient.updateAppSettings(...)` fixture pattern, same serial-describe + settings-restore policy).

**Placement alternatives per CONTEXT.md Claude's Discretion:**
1. New file `tests/tests/specs/voter/voter-popup-hydration.spec.ts` (recommended — isolation from the existing 3 describe blocks which depend on the `answeredVoterPage` fixture).
2. New describe block appended to `tests/tests/specs/voter/voter-popups.spec.ts`.

**Imports pattern to copy verbatim** (`voter-popups.spec.ts` lines 20–23):

```ts
import { voterTest as test } from '../../fixtures/voter.fixture';
import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
```

**Describe-config pattern** (`voter-popups.spec.ts` lines 26, 31, 75–78):

```ts
test.describe.configure({ mode: 'serial', timeout: 60000 });
test.use({ storageState: { cookies: [], origins: [] }, trace: 'off' });

test.describe('setTimeout popup on full page load (LAYOUT-03 regression gate)', { tag: ['@voter'] }, () => {
  const client = new SupabaseAdminClient();
  test.describe.configure({ mode: 'serial' });
```

**beforeAll / afterAll settings-mutation pattern** (`voter-popups.spec.ts` lines 37–70, 80–92):

```ts
const suppressInterferingPopups = {
  notifications: { voterApp: { show: false } },
  analytics: { trackEvents: false }
};

const preserveNavigationSettings = {
  questions: {
    questionsIntro: { show: false, allowCategorySelection: false },
    categoryIntros: { show: false, allowSkip: true },
    showResultsLink: true
  },
  entities: {
    hideIfMissingAnswers: { candidate: false },
    showAllNominations: true
  }
};

const defaultPopupSettings = {
  results: { showFeedbackPopup: null, showSurveyPopup: null },
  survey: { showIn: [], linkTemplate: '' },
  notifications: { voterApp: { show: true } },
  analytics: { trackEvents: false },
  ...preserveNavigationSettings
};

test.beforeAll(async () => {
  await client.updateAppSettings({
    results: { showFeedbackPopup: 2, showSurveyPopup: null },
    survey: { showIn: [], linkTemplate: '' },
    ...preserveNavigationSettings,
    ...suppressInterferingPopups
  });
});

test.afterAll(async () => {
  await client.updateAppSettings(defaultPopupSettings);
});
```

**Assertion pattern** (`voter-popups.spec.ts` lines 94–109):

```ts
test('should show feedback popup after delay on results page', async ({ answeredVoterPage }) => {
  test.setTimeout(60000);
  const page = answeredVoterPage;

  await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible();

  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible', timeout: 15000 });

  await expect(dialog).toBeVisible();
  await expect(dialog.locator('h3').first()).toBeVisible();
});
```

**Divergence point (the NEW aspect for D-09):** the analog uses the `answeredVoterPage` fixture which reaches `/results` via **client-side navigation through the question flow** — this path does not exercise the hydration race. The new D-09 test must reach `/results` via `page.goto('/results')` **full page load** (SSR + hydration). Per RESEARCH.md Open Question 4 + Assumption A7, the seeding helper is planner's design:

- Option 1: `page.addInitScript(...)` that seeds voter answers into localStorage before the navigation.
- Option 2: Temporary test-only query param on `/results` that accepts serialized answers.
- Option 3: Dedicated admin-API helper.

**Assertion skeleton for the new D-09 test:**

```ts
test('popup appears on full page load to /results (LAYOUT-03 hydration path)', async ({ page }) => {
  test.setTimeout(60000);

  // Seed voter answers so /results is reachable without question-flow navigation.
  await seedVoterAnswersViaPage(page);   // ← planner designs this helper

  // Full page load — SSR + hydration path (NOT client-side nav).
  await page.goto('/results');
  await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: 10000 });

  // Popup is pushed via setTimeout(..., 2s) after hydration — verifies inline
  // renderer (post D-08 removal) or PopupRenderer wrapper (retention) surfaces it.
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible', timeout: 15000 });
  await expect(dialog).toBeVisible();
});
```

---

## Shared Patterns

### Pattern S-1: `fromStore(...)` bridge for runes-mode reactivity

**Sources:**
- `apps/frontend/src/routes/+layout.svelte` lines 64–67 (4 bridges)
- `apps/frontend/src/routes/admin/+layout.svelte` line 26
- `apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte` lines 11, 16

**Apply to:** Root `+layout.svelte` (add `popupQueueState` if D-08 removal path taken); protected `+layout.svelte` (no change — uses `getCandidateContext()` directly, which exposes already-runes-friendly state); PopupRenderer (if retained, no change).

**Canonical shape** (root layout lines 64–67):

```svelte
const appSettings = fromStore(appSettingsStore);
const dataRoot = fromStore(dataRootStore);
const openFeedbackModal = fromStore(openFeedbackModalStore);
const sendTrackingEvent = fromStore(sendTrackingEventStore);
```

Each exposes `.current` for reading in `$derived` / `$effect` and `{#if …}`. Per D-06 this bridge is preserved — its retirement is post-v2.6.

---

### Pattern S-2: `$derived` validation + separate `$effect` for side-effects

**Source:** RESEARCH.md Pattern 1 (both root and protected sketches); no direct code-level analog in current repo because this IS the pattern being introduced.

**Apply to:** Root `+layout.svelte` (replaces lines 74–93 `$effect + .then()`); protected `+layout.svelte` (replaces lines 66–104).

**Canonical shape:**

```svelte
// Pure validation — NEVER inside $derived body as a side-effect.
const validity = $derived.by(() => { /* pure checks returning discriminated union */ });

// Side-effect — reads $derived, never calls .then().
$effect(() => {
  if (validity.state !== 'resolved') return;
  // provide*(…) + userData.init(…) / dataRoot.update(() => …)
});
```

**Rules enforced by this pattern:**
- `$derived` body is side-effect-free (modulo `isValidResult`'s benign `logDebugError`; see Pitfall 1 mitigation — route new logging into the downstream `$effect`).
- `$effect` body reads `$derived` values, never resolves a Promise, never calls `.then()` or `await tick()`.

---

### Pattern S-3: `dataRoot.update(() => { provide*(...) })` batching

**Source:** `apps/frontend/src/lib/admin/utils/loadElectionData.ts` lines 56–62 (5-call batch — canonical).
**Partial application:** `apps/frontend/src/routes/+layout.svelte` lines 114–117 (2 of the 5 calls).

**Apply to:** Root `+layout.svelte` (preserved — already uses the idiom with 2 calls); protected `+layout.svelte` (currently lines 98–100 calls `$dataRoot.provideQuestionData / provideEntityData / provideNominationData` WITHOUT wrapping them in `$dataRoot.update(() => …)` — refactor should wrap them to match the loadElectionData canonical form).

**Canonical shape** (`loadElectionData.ts` lines 56–62):

```ts
dataRoot.update(() => {
  dataRoot.provideElectionData(electionData);
  dataRoot.provideConstituencyData(constituencyData);
  dataRoot.provideQuestionData(questionData);
  dataRoot.provideEntityData(nominationData.entities);
  dataRoot.provideNominationData(nominationData.nominations);
});
```

Protected-layout post-refactor form (3-call subset):

```ts
$dataRoot.update(() => {
  $dataRoot.provideQuestionData(validity.questionData);
  $dataRoot.provideEntityData(validity.entities);
  $dataRoot.provideNominationData(validity.nominations);
});
```

---

### Pattern S-4: Loader-awaits-everything (preserved)

**Source:** `apps/frontend/src/routes/+layout.ts` lines 9–12 (comment + policy); lines 22–37 (await usage). `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` lines 20–80 (same policy, different data).

**Apply to:** N/A — DO NOT MODIFY either loader. Per D-01 this policy is load-bearing; the `$derived` refactor relies on `data.*` fields being resolved values (not Promises) at the `.svelte` component level.

**Policy cite** (`+layout.ts` lines 7–12):

```ts
 * All data is awaited before returning to ensure SvelteKit serializes it
 * for the client (instead of streaming promises which can cause hydration
 * issues in Svelte 5 legacy mode).
 */
```

---

### Pattern S-5: Playwright E2E serial describe + settings-restore

**Source:** `tests/tests/specs/voter/voter-popups.spec.ts` lines 26, 31, 75–92 (describe-config + beforeAll/afterAll lifecycle).

**Apply to:** New D-09 test (`voter-popup-hydration.spec.ts` OR new block in `voter-popups.spec.ts`). Ensures no cross-test interference via the global `app_settings` Postgres table.

**Canonical shape:**

```ts
test.describe.configure({ mode: 'serial', timeout: 60000 });
test.use({ storageState: { cookies: [], origins: [] }, trace: 'off' });

test.describe('<descriptor>', { tag: ['@voter'] }, () => {
  const client = new SupabaseAdminClient();
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => { await client.updateAppSettings({ /* test-specific */ }); });
  test.afterAll(async () => { await client.updateAppSettings(defaultPopupSettings); });

  // tests...
});
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | | | Every file in Phase 60 scope has a strong in-repo analog. The `$derived` + separate-`$effect` pattern is the only shape without a direct in-repo precedent, but it is a structural refactor of existing code using existing primitives (`$derived`, `$effect`, `fromStore`, `isValidResult`, `dataRoot.update`), not a new component or novel architecture. |

---

## Metadata

**Analog search scope:**
- `apps/frontend/src/routes/+layout.svelte` (self)
- `apps/frontend/src/routes/+layout.ts` (loader policy)
- `apps/frontend/src/routes/admin/+layout.svelte` (canonical runes-mode layout)
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` (self)
- `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` (loader policy)
- `apps/frontend/src/lib/admin/utils/loadElectionData.ts` (`dataRoot.update` batching)
- `apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte` (self + wrapper-fallback reference)
- `apps/frontend/src/lib/components/popupRenderer/index.ts` (barrel)
- `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts` (popup store shape — already runes-reactive)
- `apps/frontend/src/lib/contexts/app/popup/popupStore.type.ts` (store type)
- `apps/frontend/src/lib/api/utils/isValidResult.ts` (validation helper)
- `tests/tests/specs/voter/voter-popups.spec.ts` (D-09 E2E analog)
- `tests/tests/specs/candidate/candidate-registration.spec.ts` (blocked test shape for LAYOUT-02 gate)
- `tests/tests/specs/candidate/candidate-profile.spec.ts` (blocked test shape for LAYOUT-02 gate)

**Files scanned:** 14 (2 layouts + 1 admin reference + 2 loaders + 1 util + 3 popup files + 1 validation util + 3 E2E specs + 1 README-level check)

**Pattern extraction date:** 2026-04-24

---

## PATTERN MAPPING COMPLETE
