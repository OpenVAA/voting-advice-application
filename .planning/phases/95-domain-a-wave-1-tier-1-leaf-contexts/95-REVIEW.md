---
phase: 95-domain-a-wave-1-tier-1-leaf-contexts
reviewed: 2026-06-04T00:00:00Z
depth: standard
files_reviewed: 49
files_reviewed_list:
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
  - apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts
  - apps/frontend/src/lib/contexts/app/popup/popupStore.type.ts
  - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts
  - apps/frontend/src/lib/contexts/data/dataContext.svelte.ts
  - apps/frontend/src/lib/contexts/data/dataContext.type.ts
  - apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts
  - apps/frontend/src/lib/contexts/layout/layoutContext.type.ts
  - apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
  - apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts
  - apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts
  - apps/frontend/src/lib/utils/settings.ts
  - apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.test.ts
  - apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts
  - apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.test.ts
  - apps/frontend/src/lib/contexts/voter/answerStore.svelte.test.ts
  - apps/frontend/src/lib/utils/settings.test.ts
  - apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte
  - apps/frontend/src/routes/(voters)/+layout.svelte
  - apps/frontend/src/routes/(voters)/+page.svelte
  - apps/frontend/src/routes/(voters)/about/+page.svelte
  - apps/frontend/src/routes/(voters)/info/+page.svelte
  - apps/frontend/src/routes/(voters)/privacy/+page.svelte
  - apps/frontend/src/routes/+layout.svelte
  - apps/frontend/src/routes/admin/+layout.svelte
  - apps/frontend/src/routes/admin/login/+page.svelte
  - apps/frontend/src/routes/Banner.svelte
  - apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/questions/+layout.svelte
  - apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte
  - apps/frontend/src/routes/candidate/+layout.svelte
  - apps/frontend/src/routes/candidate/forgot-password/+page.svelte
  - apps/frontend/src/routes/candidate/login/+page.svelte
  - apps/frontend/src/routes/candidate/password-reset/+page.svelte
  - apps/frontend/src/routes/candidate/preregister/(authenticated)/+layout.svelte
  - apps/frontend/src/routes/candidate/preregister/+layout.svelte
  - apps/frontend/src/routes/candidate/preregister/+page.svelte
  - apps/frontend/src/routes/candidate/register/+layout.svelte
  - apps/frontend/src/routes/Header.svelte
  - apps/frontend/src/routes/Layout.svelte
  - apps/frontend/src/routes/MainContent.svelte
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 95: Code Review Report

**Reviewed:** 2026-06-04
**Depth:** standard
**Files Reviewed:** 49
**Status:** issues_found

## Summary

This phase migrates a set of Tier-1 leaf contexts/stores to Svelte 5 runes (CTX-01..05): `mergeAppSettings` purity (CTX-01), the rune-native `localStorageState`/`PersistedState` helper consumed by `answerStore` and `candidateUserDataStore`, the rune-native `popupStore` (`current` getter replacing the `Readable` + `$popupQueueState` bridge), the token-keyed `settingsOverlay` registry replacing index-based `StackedState` (CTX-04), and the ~30 route/nav callsite migrations (`getLayoutContext(onDestroy)` → `getLayoutContext()`, `.push(...)` → `.use(...)`).

Overall the migration is careful and internally consistent: the write-after-read `untrack()` invariant is correctly applied in `settingsOverlay.push`/revert and the `dataContext` subscribe callback; `mergeAppSettings` purity is pinned by tests; the SSR-synchronous-init merge (D-04) is sound; the token-keyed overlay correctly fixes the out-of-order revert hazard the index stack carried. No security vulnerabilities, secrets, injection, or data-loss defects were found in scope.

The findings below are correctness/robustness/quality concerns. None are blockers. The most material ones are: (WR-01) the legacy `localStorageWritable`'s never-torn-down `subscribe` persistence, which is partially carried into the new code path; (WR-02) a behavior-preserving-but-fragile non-reactive overlay read pattern in several `use(...)` callsites; (WR-03) the unbounded `dataRoot.subscribe` in `dataContext`; and (WR-04) a re-push hazard in `preregister/+page.svelte`.

No structural-findings block was provided to this review.

## Warnings

### WR-01: `storageWritable` persists via a `subscribe` that is never unsubscribed

**File:** `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts:125-142`
**Issue:** `storageWritable` registers `store.subscribe((v) => saveItemToStorage(...))` and never tears it down (the comment at lines 136-138 acknowledges this is intentional, "matching the old storageStore behavior"). The new rune-native `storageState` (the path this phase actually migrates `answerStore`/`candidateUserDataStore` onto) avoids this by persisting imperatively in `set`/`update`. But `storageWritable`/`localStorageWritable` is still live and is what `appContext` uses for `userPreferences` (`appContext.svelte.ts:142`). Each `localStorageWritable(...)` call leaks one permanent subscriber. For the contexts re-initialized per navigation/SSR-request this is a slow accumulation. Since the rune-native `storageState` already demonstrates the leak-free idiom, the `storageWritable` path should either be migrated or have its non-teardown documented as a known, bounded (init-once) cost.
**Fix:** Where the consumer is initialized once per app lifecycle (e.g. `userPreferences`), document the bounded cost explicitly. Otherwise migrate remaining `localStorageWritable` consumers to `localStorageState` so persistence is imperative and no subscriber is retained:
```ts
// Prefer the rune-native handle (no retained subscriber):
const userPreferences = localStorageState('appContext-userPreferences', {} as UserPreferences);
// ...and drop the fromStore(userPreferences) bridge in favor of userPreferences.current.
```

### WR-02: `use(overlay)` snapshots the overlay at call time — runtime-reactive settings silently stop updating

**File:** `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:33-38`; `apps/frontend/src/routes/candidate/preregister/+layout.svelte` (cancel action); `apps/frontend/src/routes/(voters)/+page.svelte:30-37`; `apps/frontend/src/routes/candidate/login/+page.svelte:114-118`
**Issue:** `settingsOverlay.use(overlay)` is `$effect(() => push(overlay))` — the `overlay` argument is evaluated **once, at the `use()` call site (component init)**, and the inner `$effect` only re-pushes the already-captured object. Several callsites pass an overlay whose value is derived from a reactive accessor read at init — e.g. `results: $appSettings.questions.showResultsLink ? 'show' : 'hide'`, `imageSrc: $darkMode ? ... : ...`, `cancel: candCtx.idTokenClaims ? 'show' : 'hide'`. If those reactive values change after init (DB settings override merge via `mergeAppSettings`, dark-mode toggle, late token arrival), the merged overlay does NOT update. This matches the OLD `push(...)`-at-init behavior (so it is not a regression), but the migration is the right moment to either make it reactive or document the intentional one-shot read — especially because `(voters)/+layout.svelte:72-82` DOES wrap `useTopBar(...)` in an `$effect` precisely to get this reactivity, creating an inconsistency a future maintainer will trip over.
**Fix:** For overlays that must track reactive settings, wrap the `use()` in an `$effect` (mirroring `(voters)/+layout.svelte`):
```ts
$effect(() => {
  topBarSettings.use({
    progress: 'show',
    actions: { results: $appSettings.questions.showResultsLink ? 'show' : 'hide' }
  });
});
```
For intentionally static overlays, add a one-line comment noting the value is read once at init and is not expected to change at runtime.

### WR-03: `dataRoot.subscribe(...)` in `initDataContext` is never unsubscribed

**File:** `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts:85-90`
**Issue:** `initDataContext` calls `dataRoot.subscribe(() => untrack(...))` with no teardown. The `createDataRootBridge` subscriber set is also never cleared. `initDataContext` is asserted single-call-per-context, so in steady state this is one retained closure — acceptable — but it is undocumented and the closure captures `dataRoot`, `version`, and `dataRootStore`, keeping them alive for the context's full lifetime. Under SSR, where a context is created per request, an un-disposed subscription on a per-request `DataRoot` is a per-request retained closure. Confirm `DataRoot` (and this subscription) is disposed with the request scope, or document why no teardown is needed.
**Fix:** If `initDataContext` can run in a disposable scope, capture and dispose the unsubscriber on teardown:
```ts
const unsub = dataRoot.subscribe(() => untrack(() => { version++; dataRootStore.set(dataRoot); }));
onDestroy?.(unsub); // or tie to the context's disposal hook
```
Otherwise add a comment asserting single-lifetime ownership (mirroring the `storageWritable` note).

### WR-04: `preregister/+page.svelte` re-pushes `PreregisteredNotification` on every effect re-run

**File:** `apps/frontend/src/routes/candidate/preregister/+page.svelte:38-44`
**Issue:** The `$effect` pushes `PreregisteredNotification` into `popupQueue` whenever `candCtx.isPreregistered && !candCtx.idTokenClaims`. The effect re-runs whenever either reactive dependency changes, with no guard against pushing a duplicate while a prior instance is still queued/open. With the migrated rune-native `popupStore` (FIFO, no dedup), a dependency flip-flop can enqueue the same notification multiple times. This is pre-existing logic (not changed by the diff beyond the context-acquisition line), but it sits directly on the migrated `popupQueue` surface and the new store offers no dedup safety net.
**Fix:** Guard against re-push, e.g. with a one-shot flag or by checking the queue head:
```ts
let shown = false;
$effect(() => {
  if (!shown && candCtx.isPreregistered && !candCtx.idTokenClaims) {
    shown = true;
    popupQueue.push({ component: PreregisteredNotification });
  }
});
```

## Info

### IN-01: Dead ternary — both branches identical

**File:** `apps/frontend/src/routes/admin/login/+page.svelte:71`
**Issue:** `imageSrc: darkModeState.current ? '/images/hero-admin.png' : '/images/hero-admin.png'` — both arms of the ternary are the same string, so the `darkModeState.current` read is pointless (and registers no useful behavior). This is on a line changed by the `.push` → `.use` migration, so it is in scope.
**Fix:** `imageSrc: '/images/hero-admin.png'` (drop the ternary), or supply the intended dark-mode asset if one exists.

### IN-02: `candidateUserDataStore.save()` skips `termsOfUseAccepted` when set to `null`

**File:** `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts:122-124, 228`
**Issue:** `_unsavedProperties` marks `termsOfUseAccepted` unsaved only when `editedTermsOfUseAccepted` is truthy, and `save()` gates the property update on `if (image || termsOfUseAccepted)`. A deliberate `setTermsOfUseAccepted(null)` (the setter accepts `string | null`) is therefore treated as "no change" and never persisted, and never reported via `hasUnsaved`. This logic was not introduced by this phase (the diff only swapped the store backing), so it is informational — but it now rides on the migrated rune-native handle and is worth a tracking note.
**Fix:** Distinguish "unset" (`undefined`) from "explicitly cleared" (`null`) using a sentinel or `!== undefined` checks throughout (`_unsavedProperties`, `save()`), rather than truthiness.

### IN-03: `JSON.parse(JSON.stringify(...))` clone idiom duplicated across stores

**File:** `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts:65`; `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts:21`
**Issue:** The "round-trip clone because Svelte 5 `$state` proxies can't be `structuredClone`d" idiom is repeated verbatim (with near-identical explanatory comments) in two stores. This is acceptable but is duplicated logic the checklist flags ("no code repeated within the PR or elsewhere").
**Fix:** Extract a small `snapshotClone<T>(v: T): T` (or use Svelte's `$state.snapshot`) shared util with the rationale documented once.

### IN-04: `getStorage` unreachable `else throw`

**File:** `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts:202-211`
**Issue:** `getStorage(type: StorageType)` exhaustively handles `'localStorage'` and `'sessionStorage'` (the only `StorageType` members) and then throws in an `else`. Given the union type, the `else` is unreachable dead code under correct typing. Harmless defensive code, but flagged for completeness.
**Fix:** Optionally drop the `else` and return `sessionStorage` for the second branch, or keep as a defensive guard with a `// defensive: unreachable under StorageType` comment.

---

_Reviewed: 2026-06-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
