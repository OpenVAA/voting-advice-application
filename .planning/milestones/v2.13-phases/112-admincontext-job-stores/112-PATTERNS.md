# Phase 112: adminContext + Job Stores - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 2 conversion targets (+ 2 type barrels, 1 index)
**Analogs found:** 2 / 2 (both exact — sibling Phase 110/111 conversions)

## File Classification

| Conversion Target | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` | context provider (orchestrator) | request-response (composing-leaf + DataWriter wrappers) | `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` (`CandidateContextProvider`) | exact (two-base Object.assign + exclusion + delegating-getter mechanic) |
| `apps/frontend/src/lib/contexts/admin/jobStores.svelte.ts` | store factory | event-driven (`$state` Map registry + `$derived` projections + polling) | `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts` (`MatchStoreImpl`) | role-match (class wrapping `$derived` projection; closest in-tree store-class shape) |

Both targets are leaf-level within the admin surface; no cross-file ordering constraint between them beyond `adminContext` importing `jobStores()` (line 4, `const jobs = jobStores()` at line 38). Convert jobStores first (it is the dependency), then adminContext.

---

## Pattern Assignments

### `adminContext.svelte.ts` (context provider, two-base composition)

**Analog:** `candidateContext.svelte.ts` (`CandidateContextProvider`) — the canonical two-base (`appContext` + `authContext`) class conversion with the exact LANDMINE this phase must reproduce.

#### 1. v2.11 auth-forwarding fix — MUST be preserved verbatim (current adminContext L97-117)

The current object-literal does NOT spread authContext. Reproduce this exactly in class form:

```typescript
const adminContext: AdminContext = {
  ...appContext,
  // CONS-03 / Pitfall 2: do NOT spread the auth context here. Object spread invokes
  // the source's isAuthenticated $derived getter exactly once at init time and captures
  // the boolean by value, de-reactivating admin auth gating (the nav would show
  // authenticated links to a logged-out user until a hard refresh). An explicit
  // delegating getter re-reads the live $derived on every access instead.
  get isAuthenticated() {
    return authContext.isAuthenticated;
  },
  // The four auth functions are plain (non-reactive) fns — forwarding by reference is correct.
  logout: authContext.logout,
  requestForgotPasswordEmail: authContext.requestForgotPasswordEmail,
  resetPassword: authContext.resetPassword,
  setPassword: authContext.setPassword,
  ...
```

**Class translation (copy from candidateContext L90-106, L276-279, L493-499 mechanics):**
- Hold `#authContext = getAuthContext()` as a private field.
- `isAuthenticated` → **prototype getter delegating to live `$derived`** (NOT a copied value):
  ```typescript
  get isAuthenticated() {
    return this.#authContext.isAuthenticated;
  }
  ```
- The four auth functions (`logout`, `requestForgotPasswordEmail`, `resetPassword`, `setPassword`) → **arrow-field direct-reference forwards** captured at init (candidateContext holds `#authLogout = this.#authContext.logout` then re-exposes; for admin, none are wrapped/overridden so plain field forwards suffice):
  ```typescript
  logout = this.#authContext.logout;
  requestForgotPasswordEmail = this.#authContext.requestForgotPasswordEmail;
  resetPassword = this.#authContext.resetPassword;
  setPassword = this.#authContext.setPassword;
  ```
  NOTE: admin's `logout` is NOT wrapped (unlike candidateContext, which wraps with `goto(...).then(#reset)`). So admin does NOT need the getter-only-prototype `logout` override that caused the Phase-111 TypeError. Admin can use a plain arrow field — see §2 collision audit for why this is safe.

#### 2. Getter-collision audit (Phase 111 landmine, commit 1327096e6)

Conversion reproduces the former `...appContext` spread (current L98) via `Object.assign(this, this.#appContext)` — appContext is own-enumerable since Phase 109 (`AppContextProvider`).

**CRITICAL FINDING — auth members do NOT collide via appContext:**
- `AppContext` exposes NONE of `isAuthenticated` / `logout` / `requestForgotPasswordEmail` / `resetPassword` / `setPassword` (verified: `grep` in `src/lib/contexts/app/` returns zero hits). Auth members arrive ONLY from `authContext`, which is NOT assigned (per SC-2: no `{ ...authContext }` spread — auth members are individually forwarded).
- Therefore `Object.assign(this, this.#appContext)` cannot overwrite any auth prototype getter/field. **There is no exclusion needed on the appContext source for auth keys.**

**Where the Phase-111 TypeError WOULD bite — and why admin avoids it:**
- The Phase-111 landmine was: `Object.assign` writing authContext's own-enumerable `logout` arrow onto a getter-ONLY prototype accessor throws `TypeError: Cannot set property logout which has only a getter`.
- Admin does NOT spread authContext at all, and does NOT use a getter-only `logout` accessor (no logout override). So `logout` as a plain arrow field is safe — nothing assigns over it.
- **`isAuthenticated` IS a getter-only prototype accessor** (it must re-read the live `$derived`). Since neither `Object.assign(this, this.#appContext)` (appContext lacks the key) nor any authContext assign (none exists) writes `isAuthenticated`, the getter-only accessor is never written → no TypeError. **Confirm during planning: do NOT add any `Object.assign` that carries an `isAuthenticated` key onto the instance.**

**appContext keys reproduced by `Object.assign(this, this.#appContext)`** (declare each as `readonly X!: AppContext['X']` definite-assignment field, per candidateContext L236-267): `appType, appSettings, appCustomization, openFeedbackModal, reactiveAppSettings, reactiveLocale, locale, locales, darkMode, getRoute, surveyLink, userPreferences, t, translate, dataRoot, reactiveDataRoot, setDataRoot, sendTrackingEvent, sessionId, shouldTrack, startPageview, startEvent, track, submitAllEvents, resetAllEvents, sendFeedback, setDataConsent, setFeedbackStatus, setSurveyStatus, startFeedbackPopupCountdown, startSurveyPopupCountdown, popupQueue`.

#### 3. Own members of adminContext

- `userData` → get/set prototype accessor over `#userData = $state<BasicUserData | undefined>(undefined)` (current L32, L112-117). Copy the get/set accessor shape from candidateContext `newUserEmail` (L541-546).
- `jobs` → field `jobs = jobStores()` (or `new JobStoresProvider()` after §jobStores conversion). Current L38, L118.
- The 8 DataWriter wrapper methods (`updateQuestion, getActiveJobs, getPastJobs, startJob, getJobProgress, abortJob, abortAllJobs, insertJobResult`) + the `injectAuthToken` helper → **arrow fields** (§18 — survive detach), copying the candidateContext wrapper pattern (L407-411):
  ```typescript
  updateQuestion = (
    opts: WithOptionalAuth<Parameters<DataWriter['updateQuestion']>[0]>
  ): ReturnType<DataWriter['updateQuestion']> => {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.updateQuestion(this.#injectAuthToken(opts)));
  };
  ```
  `injectAuthToken` → private arrow field `#injectAuthToken` (it is read by the wrappers).

#### 4. init/get/setContext scaffolding (current L11-19, L129-130)

Copy the candidateContext scaffolding shape (L594-606) — `getAdminContext()` guard + `initAdminContext()` returns `setContext(CONTEXT_KEY, new AdminContextProvider())`. Preserve the existing `Symbol('admin')` key and the existing error messages byte-identical (consumers call `getAdminContext()` / `initAdminContext()` unchanged — 16 consumer files, none spread).

---

### `jobStores.svelte.ts` (store factory → class)

**Analog:** `matchStore.svelte.ts` (`MatchStoreImpl`) — class holding `$state`/`$derived` and exposing read-only projection getters. Secondary shape ref: candidateUserDataStore (factory→object-with-getters, `current`/`hasUnsaved` getters at L157-173).

**Convert the `jobStores()` factory (current L12-135) to a class** preserving registry semantics + the `JobStores` return shape byte-identical:

- `#pollInterval: NodeJS.Timeout | undefined` and `#lastPastJobsUpdate: string | undefined` → private fields (current L17-21).
- `#jobs = $state<Map<string, JobInfo>>(new Map())` → private `$state` field (current L49). This is the registry; `fetchAndUpdateJobs` replaces it with a new Map (current L113-116) — preserve the new-Map replacement (Svelte 5 Map reactivity).
- The three `$derived` projections → private `$derived` / `$derived.by` fields (current L51-70: `#pastJobs`, `#activeJobsByFeature`, `#pastJobsByFeature`). Note `#pastJobsByFeature` reads `#pastJobs` — declare `#pastJobs` BEFORE `#pastJobsByFeature` (D1 field-init order; matches current declaration order).
- `startPolling`, `stopPolling`, `fetchAndUpdateJobs` → **arrow fields** (detach-safe; `startPolling`/`stopPolling` are returned to consumers and called from `WithPolling.svelte`).
- The three projections exposed as **read-only prototype getters** matching `JobStores` type exactly (current L122-134):
  ```typescript
  get activeJobsByFeature() { return this.#activeJobsByFeature; }
  get pastJobs() { return this.#pastJobs; }
  get pastJobsByFeature() { return this.#pastJobsByFeature; }
  ```
- Module-private `isActive` + `filterByKnownNames` helpers (current L137-145) stay as module-level functions OR private static — keep module-level (simplest, no `this`).

**Back-compat handle (per CONTEXT decision D / Phase 114 RENAME):** keep an exported `jobStores()` factory wrapper returning `new JobStoresProvider()` so `adminContext` and any importer call site stay unchanged until Phase 113/114. (jobStores has NO direct consumers other than adminContext — verified.)

**MatchStoreImpl excerpt to copy** (`matchStore.svelte.ts` L39-51 — `#deps` + `$derived.by` field shape):
```typescript
class MatchStoreImpl {
  #deps: MatchStoreDeps;
  constructor(deps: MatchStoreDeps) { this.#deps = deps; }
  #value = $derived.by(() => { ... });
}
```
jobStores has no constructor deps — it is self-contained (polls its own URLs), so the class needs only a parameterless constructor (or none) + the `$effect`-free field initializers. No effect context required for construction (no `$effect` blocks in jobStores), so `new JobStoresProvider()` is safe outside an effect scope — unlike adminContext/candidateContext.

---

## Shared Patterns

### Class conversion conventions (CONVENTIONS §17–22)
**Source:** `candidateContext.svelte.ts` class JSDoc (L34-80) + field/constructor layout.
**Apply to:** both targets.
- §17 prototype get/set accessors for surface members (spread-safe).
- §18 arrow fields for any method that may be detached (DataWriter wrappers, polling fns).
- D1 field-init order: `$state`/`$derived` field initializers run BEFORE constructor body; declare a field before any field that reads it.
- `$effect` blocks (if any) go in the constructor — legal only because the provider is constructed at component-init (effect context). adminContext has NO `$effect` currently; do not introduce one. jobStores has none.
- `@internal` test-seam JSDoc + "do not construct directly; use initAdminContext()" note (copy candidateContext L75-79). For jobStores, the `@internal` note can omit the effect-context warning (no effects).

### Two-base Object.assign + exclusion mechanic (the LANDMINE)
**Source:** `candidateContext.svelte.ts` constructor L303-305 + JSDoc L52-58, L293-301.
**Apply to:** adminContext ONLY (jobStores has no base).
```typescript
Object.assign(this, this.#appContext);
// candidateContext excludes logout because IT has a getter-only logout override.
// adminContext does NOT spread authContext at all (SC-2) and has no getter-only
// member that any assign source carries → NO exclusion needed for admin.
```
Key difference from candidateContext: admin does NOT assign authContext (forwards the 5 auth members individually), so the `const { logout: _x, ...rest } = authContext` exclusion is NOT used here. Admin's only `Object.assign` source is appContext, which carries no colliding key.

### Type-only barrel export
**Source:** `admin/index.ts` (current 3 lines) + candidate barrel precedent.
**Apply to:** keep `export * from './adminContext.svelte'` and `'./jobStores.type'`; jobStores impl is imported by adminContext via relative path, not re-exported as value unless already so. Preserve the existing barrel surface byte-identical.

---

## No Analog Found

None — both targets have strong sibling analogs.

| File | Note |
|------|------|
| (n/a) | jobStores' polling/`setInterval` lifecycle has no class analog in-tree, but the structure (private fields + arrow methods + `$state`/`$derived`) is fully covered by MatchStoreImpl + the general §17–22 conventions. |

---

## Risk / Plan-Split Guidance

| File | Size | Risk | Notes |
|------|------|------|-------|
| `jobStores.svelte.ts` | 146 lines | LOW | Self-contained, no base, no `$effect`, no consumers but adminContext. Mechanical class wrap. |
| `adminContext.svelte.ts` | 132 lines | MEDIUM | The auth-forwarding fix (SC-2) is the only sharp edge; getter-collision audit shows appContext carries NO auth keys, so the Phase-111 TypeError path is structurally absent IF no `isAuthenticated`-bearing Object.assign is added. 8 DataWriter wrappers are mechanical. |

**Recommended split:** 1–2 plans + a gate task.
- **Plan 01:** jobStores → `JobStoresProvider` class + back-compat `jobStores()` factory wrapper. (independent, low risk)
- **Plan 02:** adminContext → `AdminContextProvider` class (depends on Plan 01 for `jobs` field type, but works against the back-compat factory so order-independent in practice).
- **Gate task:** `yarn build` + `yarn vitest run src/lib/contexts/` + `yarn svelte-check` (151 baseline, zero new). No E2E this phase (admin E2E lands Phase 116).

**Test coverage note:** NO existing test file for adminContext or jobStores (verified — `admin/` has no `*.test.ts`). The vitest gate runs the broader `src/lib/contexts/` suite (appContext/authContext/candidateUserDataStore/answerStore/VideoController tests). Consider whether a thin smoke test for `JobStoresProvider` projections is warranted, but it is NOT required by SC-4.

## Metadata

**Analog search scope:** `apps/frontend/src/lib/contexts/{admin,candidate,voter,app,auth,layout}/`
**Files scanned:** adminContext.svelte.ts, jobStores.svelte.ts, adminContext.type.ts, jobStores.type.ts, admin/index.ts, candidateContext.svelte.ts, matchStore.svelte.ts (head), appContext.type.ts, authContext.type.ts, appContext.svelte.ts (class shape), answerStore.svelte.ts (head), candidateUserDataStore.svelte.ts (head); consumer grep across `src/`.
**Pattern extraction date:** 2026-06-13
