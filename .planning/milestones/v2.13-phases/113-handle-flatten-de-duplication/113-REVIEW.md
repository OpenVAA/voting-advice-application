---
phase: 113-handle-flatten-de-duplication
reviewed: 2026-06-13T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
  - apps/frontend/src/lib/contexts/app/appContext.type.ts
  - apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts
  - apps/frontend/src/lib/contexts/data/dataContext.svelte.ts
  - apps/frontend/src/lib/contexts/data/dataContext.type.ts
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
  - apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts
  - apps/frontend/scripts/flatten-current-codemod.mjs
  - apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte
  - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
  - apps/frontend/src/routes/(voters)/(located)/+layout.svelte
findings:
  critical: 1
  warning: 1
  info: 1
  total: 3
status: resolved
resolution: >
  CR-01 (BLOCKER) fixed — Object.assign(this, this.#appContext) in voter/candidate/admin
  orchestrators replaced with new inheritContextMembers() helper that forwards bare reactive
  accessors (appSettings/dataRoot/locale) as LIVE accessors instead of value snapshots.
  Added apps/frontend/src/lib/contexts/utils/inheritContextMembers.ts + .test.ts (4 liveness
  tests, addressing WR-01's missing-liveness-assertion gap). Verified: build 14/14,
  svelte-check 151 (exact baseline, 0 net-new), context vitest 104 passed + 4 new. IN-01
  (stale getRoute.current count metric) is a non-blocking doc note, left as-is.
---

# Phase 113: Code Review Report

**Reviewed:** 2026-06-13
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Phase 113 flattens the `appSettings` / `dataRoot` / `locale` context handles from
`{ current }` objects to bare own-enumerable reactive accessors installed via
`Object.defineProperty(this, …, { enumerable: true })`, runs an idempotent codemod
flattening ~152 consumer `.current` reads, repairs ~46 destructure-trap sites, and
updates the CLAUDE.md Context Destructuring Rule.

Three of the four focus areas are SOUND and well-executed:

- **Producer accessor conversions on `appContext` and `dataContext`** are correct.
  The `Object.defineProperty` accessors close over `self`/`this` and re-read the
  backing `$state`/`#version` per access — reactivity is preserved, no value is
  snapshotted at the producer level. The own-enumerable install is the correct
  choice to survive `{ ...appContext }`.
- **Destructure-trap contract (focus #2):** verified clean. The codemod's PASS-2
  audit reports 0 traps for the three names across both `.svelte` and `.ts` globs;
  a manual scan of the broader CLAUDE.md reactive-accessor list found no
  destructures in the changed files.
- **Codemod over-reach guard (focus #3):** clean. `getRoute.current` occurrence
  count is unchanged at 151; producer-internal `this.#appSettings.current` reads
  are correctly excluded by the `#` in the negative lookbehind; the codemod is
  idempotent (0 rewrites on re-run, both globs); the `_spikes` skip is present.
- **LanguageSelection.svelte fix (focus #4):** correct — `ctx` is the live
  `getAppContext()` accessor and the `currentLocale.current` → bare `currentLocale`
  alias repair is right.

However, there is ONE load-bearing BLOCKER: the orchestrator forwarding boundary in
voterContext / candidateContext / adminContext (`Object.assign(this, this.#appContext)`)
**snapshots** the three now-bare reactive accessors into frozen value properties,
silently re-introducing the exact reactivity-loss class this phase exists to prevent.
This is undetectable by the type system (the type is a bare value) and was not caught
because the Task-3 live E2E gate was explicitly never run.

## Critical Issues

### CR-01: `Object.assign(this, this.#appContext)` freezes `appSettings`/`dataRoot`/`locale` into stale non-reactive snapshots on voter/candidate/admin contexts

**File:** `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:384`
**Also:** `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:310`, `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts:217`

**Issue:**
After FLATTEN-02, `appContext.appSettings` / `appContext.dataRoot` / `appContext.locale`
are bare reactive **accessors** installed via `Object.defineProperty(this, …, { get(){…}, enumerable: true })`.
The three downstream orchestrators reproduce the inherited appContext members with
`Object.assign(this, this.#appContext)`.

`Object.assign` performs `[[Get]]` on each source own-enumerable property and
`CreateDataProperty` on the target — i.e. it **invokes the accessor once and copies
the returned VALUE as a plain, static data property**. It does NOT copy the accessor.
Verified at runtime:

```js
const appCtx = {};
let v = 1;
Object.defineProperty(appCtx, 'appSettings', { get(){ return v; }, enumerable: true, configurable: true });
const target = {};
Object.assign(target, appCtx);
v = 999;
target.appSettings; // → 1  (FROZEN snapshot, not 999)
Object.getOwnPropertyDescriptor(target, 'appSettings'); // { value: 1, ... } — a DATA property, not an accessor
```

Consequence: `voterCtx.appSettings`, `voterCtx.dataRoot`, `voterCtx.locale`
(and the candidate/admin equivalents) are **frozen at construction time**. Any consumer
that reactively reads these members off a voter/candidate/admin context — e.g.
`const dataRoot = $derived(voterCtx.dataRoot)` — re-reads the same static value forever
and never re-evaluates when the underlying state changes.

This is the SAME destructure-trap reactivity-loss class the phase exists to eliminate,
silently re-introduced at the `Object.assign` boundary. Per-member impact:

- **`dataRoot` (most severe):** populated AFTER construction (the protected layouts call
  `setDataRoot(...)` to provide question/nomination data). The DataRoot object reference
  is stable, but the snapshot bypasses the `void #version` reactive read inside the
  accessor — so `$derived`/`$effect`/template reads of `voterCtx.dataRoot` /
  `candCtx.dataRoot` / `adminCtx.dataRoot` will NOT re-run when data is provided. UI
  bound to these can lock in a pre-data state.
- **`appSettings`:** `#appSettingsValue` is REASSIGNED by the re-merge `$effect`
  (`appContext.svelte.ts:384`) on navigation with changed DB settings — a snapshot
  taken at construction then holds a stale settings object.
- **`locale`:** `#componentCtx.locale` changes on language switch — the snapshot holds
  the stale locale.

Why it was missed: the bare-value types (`AppContext['appSettings']` = `AppSettings`,
`['dataRoot']` = `DataRoot`, `['locale']` = `string`) make the snapshot type-check
identically to a live read, so svelte-check stays green (151/151). The
`appContext.spread.svelte.test.ts` guard only asserts the spread copy is *defined* and
equals the init-time value — it never mutates the backing and re-reads, so it cannot
detect the freeze. The Task-3 live E2E gate (113-04-SUMMARY "E2E Gate — NOT run") is
the only gate that would have caught it, and it was explicitly not run.

Affected consumers (read one of the three members off a voter/candidate/admin context):
`(voters)/intro/+page.svelte`, `(voters)/elections/+page.svelte`,
`(voters)/constituencies/+page.svelte`, `(voters)/(located)/+layout.svelte`,
`(voters)/(located)/questions/+layout.svelte`, `(voters)/(located)/questions/+page.svelte`,
`(voters)/(located)/questions/category/[categoryId]/+page.svelte`,
`(voters)/nominations/+page.svelte`, candidate `(protected)/+page.svelte`,
`(protected)/profile/+page.svelte`, `(protected)/preview/+page.svelte`,
`(protected)/questions/+page.svelte`, `(protected)/questions/[questionId]/+page.svelte`,
candidate `register/+page.svelte`, `login/+page.svelte`,
`preregister/(authenticated)/elections/+page.svelte`,
`LogoutButton.svelte`, `CandidateNav.svelte`, admin
`(protected)/argument-condensation/+page.svelte`, `(protected)/question-info/+page.svelte`,
`admin/login/+page.svelte`. (Components that read these off `getAppContext()` directly
— e.g. `EntityCard.svelte`, `EntityDetails.svelte`, `QuestionHeading.svelte` — are NOT
affected, because they hit the live appContext accessor.)

**Fix:**
Do not let `Object.assign` flatten the three reactive accessors. Re-install them as
live accessors on each orchestrator AFTER the `Object.assign`, forwarding to the live
appContext getter — mirroring the bare-accessor pattern already used on the producers.
For each of voter/candidate/admin:

```ts
constructor() {
  Object.assign(this, this.#appContext);
  // (candidate also: const { logout, ...authRest } = this.#authContext; Object.assign(this, authRest);)

  // Re-install the three bare reactive accessors as LIVE forwards — Object.assign
  // above copied them as frozen value snapshots (Object.assign invokes the source
  // getter once and writes a static data property).
  const appContext = this.#appContext;
  for (const key of ['appSettings', 'dataRoot', 'locale'] as const) {
    Object.defineProperty(this, key, {
      get() { return appContext[key]; },
      enumerable: true,
      configurable: true
    });
  }
  // ... rest of constructor
}
```

(The orchestrators already expose `this.#appSettings` / `this.#dataRoot` / `this.#locale`
private GETTERS for their own internal reads, so internal reactivity was never broken —
only the PUBLIC inherited members read by consumers. Alternatively, expose each as a
public prototype getter delegating to the private getter, but a prototype getter would
be dropped by any future `{ ...orchestratorContext }` spread; the per-key
`Object.defineProperty(enumerable:true)` keeps the spread-safety discipline consistent
with appContext. Note: voter/candidate are not currently spread by any consumer, but
matching the appContext discipline is the safer, convention-consistent choice.)

Add a regression test that, for each orchestrator (or at minimum a unit assertion on the
`Object.assign` result), mutates the appContext backing and asserts the orchestrator's
`appSettings`/`dataRoot`/`locale` reflect the change — the current spread test only checks
init-time equality and cannot catch this freeze.

## Warnings

### WR-01: Spread/forwarding test asserts presence but not liveness — cannot catch the snapshot-freeze regression

**File:** `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts:185-197`

**Issue:**
The "bare reactive members survive the spread" test asserts only that the spread copy's
members are defined / equal to the init-time value and that the keys appear in
`Object.keys(spread)`. It never mutates the backing state and re-reads to confirm the
copied member is still LIVE. As CR-01 shows, a bare `Object.defineProperty` accessor
copied by spread/`Object.assign` becomes a frozen value — so this test passes even when
reactivity is dead. The test's own inline comment (lines 181-184) even acknowledges
"`{ ...instance }` copies a defineProperty enumerable getter as a VALUE (the getter is
invoked once at spread time)" — i.e. the test documents the freeze but does not flag it
as a problem, because for appContext's OWN consumers it is not (they read the live
accessor directly). The gap is that no test covers the orchestrator forwarding boundary,
which is exactly where the freeze becomes a live bug.

**Fix:**
Add a liveness assertion at the forwarding boundary. After constructing an orchestrator
(or simulating `Object.assign(target, appContextInstance)`), mutate the appContext
backing (e.g. via the re-merge `$effect` or a direct `#appSettingsValue` change through a
test seam) and assert the forwarded `appSettings`/`dataRoot`/`locale` reflect the new
value. This converts the silent type-level pass into a real reactive regression gate.

## Info

### IN-01: Stale `getRoute.current` count references in summaries (147 vs 151)

**File:** `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` (and 113-02/113-03 SUMMARYs)

**Issue:**
113-02-SUMMARY and 113-03-SUMMARY report the `getRoute.current` guard count as 147
(line-count `grep -c`), while 113-04-SUMMARY correctly reports 151 occurrences
(`grep -o`) and notes the 147→148 line-count delta is a prettier line-wrap artifact.
The actual current occurrence count is 151 (verified), and the codemod demonstrably
touched zero `getRoute` reads. No functional defect — the guard held — but the
inconsistent metric across summaries could mislead a future reviewer into thinking the
out-of-scope handle was modified. Documentation-only.

**Fix:**
None required for correctness. If desired, normalize the earlier summaries to the
occurrence-count metric (151) for consistency, as 113-04-SUMMARY already did.

---

_Reviewed: 2026-06-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
