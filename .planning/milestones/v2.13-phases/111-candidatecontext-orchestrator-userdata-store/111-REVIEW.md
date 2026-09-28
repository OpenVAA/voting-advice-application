---
phase: 111-candidatecontext-orchestrator-userdata-store
reviewed: 2026-06-13T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts
  - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
  - apps/frontend/src/lib/contexts/candidate/index.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: clean
---

# Phase 111: Code Review Report

**Reviewed:** 2026-06-13
**Depth:** standard
**Files Reviewed:** 3
**Status:** clean (all 4 findings are pre-existing, deferred via behaves-identically contract)

## Summary

Phase 111 converts `candidateUserDataStore` and `candidateContext` to the Svelte 5 context-as-class shape (CLASS-06), following the VoterContextProvider and AuthContextProvider precedents. The primary correctness concern was the SSR `logout` landmine: `Object.assign(this, authContext)` attempting to write the authContext's own-enumerable `logout` arrow onto the `get logout()` prototype getter — found during E2E and fixed in commit `1327096e6`.

The fix is verified correct and complete (see Cross-Provider Audit below). No new BLOCKER-class defects are introduced by Phase 111. Two pre-existing WARNING-class bugs are documented because they are now class methods (easier to reason about in isolation) and both are exploitable paths in production. Two INFO items round out the review.

---

## Cross-Provider Audit (explicitly requested)

**Scope:** Every provider doing `Object.assign(this, <class instance>)` — check whether any prototype getter-only accessor on the target collides with an own-enumerable key on the assigned source.

### CandidateContextProvider (Phase 111 subject)

Two `Object.assign` calls in the constructor:

**Call 1: `Object.assign(this, this.#appContext)`**

AppContextProvider exposes ALL its public members as **own-enumerable** instance properties (assigned in its constructor via `Object.assign(this, {...})` + direct field assignments + arrow-field class properties). It has **no prototype getters** on its public surface. The own-enumerable keys it copies are: `appType`, `appSettings`, `appCustomization`, `openFeedbackModal`, `reactiveAppSettings`, `reactiveLocale`, `locale`, `locales`, `darkMode`, `getRoute`, `surveyLink`, `userPreferences`, `popupQueue`, `t`, `translate`, `dataRoot`, `reactiveDataRoot`, `setDataRoot`, `sendTrackingEvent`, `sessionId`, `shouldTrack`, `startPageview`, `startEvent`, `track`, `submitAllEvents`, `resetAllEvents`, `sendFeedback`, `setDataConsent`, `setFeedbackStatus`, `setSurveyStatus`, `startFeedbackPopupCountdown`, `startSurveyPopupCountdown`.

CandidateContextProvider's prototype getter names are: `logout`, `answersLocked`, `constituenciesSelectable`, `selectedConstituencies`, `selectedElections`, `electionsSelectable`, `infoQuestionCategories`, `infoQuestions`, `isPreregistered`, `newUserEmail`, `opinionQuestionCategories`, `opinionQuestions`, `profileComplete`, `questionBlocks`, `requiredInfoQuestions`, `unansweredOpinionQuestions`, `unansweredRequiredInfoQuestions`, `userData`, `preregistrationElectionIds`, `preregistrationConstituencyIds`, `idTokenClaims`, `preregistrationElections`, `preregistrationNominations`.

**Result: ZERO overlap. No collision. Safe.**

**Call 2: `Object.assign(this, authContextRest)` (authContext minus `logout`)**

After the `1327096e6` fix, `authContextRest` contains only: `isAuthenticated` (own-enumerable via `Object.defineProperty`), `requestForgotPasswordEmail`, `resetPassword`, `setPassword` (all arrow-field class properties, own-enumerable).

None of these four names appear as prototype getter names in CandidateContextProvider. The `isAuthenticated` key writes onto a definite-assignment `readonly isAuthenticated!` class field — a plain own property, no getter-only accessor. **No collision. Safe.**

The `logout` key is correctly excluded by the destructure (`const { logout: _inheritedLogout, ...authContextRest } = this.#authContext`). The `_inheritedLogout` binding satisfies the `^_` varsIgnorePattern in ESLint.

### VoterContextProvider (Phase 110 subject)

One `Object.assign` call: `Object.assign(this, this.#appContext)`.

VoterContextProvider's prototype getter names are: `answers`, `constituenciesSelectable`, `currentResultsElection`, `currentResultsEntityType`, `electionsSelectable`, `entityFilters`, `filterContext`, `firstQuestionId`, `infoQuestionCategories`, `infoQuestions`, `matches`, `nominationsAvailable`, `opinionQuestionCategories`, `opinionQuestions`, `resultsAvailable`, `selectedConstituencies`, `selectedElections`, `selectedQuestionBlocks`, `selectedQuestionCategoryIds`.

**Result: ZERO overlap with AppContextProvider's own-enumerable keys. No collision. Safe.**

VoterContextProvider does NOT inherit from AuthContextProvider, so no `logout` analog exists. No additional audit needed.

### AuthContextProvider (Phase 107 subject)

No `Object.assign(this, <class instance>)` calls. The single use is `Object.defineProperty(this, 'isAuthenticated', {...})` to install an own-enumerable getter for the spread-safety contract. **No collision risk.**

**Cross-provider audit result: ALL CLEAN. No live getter-only/own-enumerable collision exists in any provider.**

---

## Narrative Findings (AI reviewer)

### Warnings

#### WR-01: `save()` silently skips persisting `termsOfUseAccepted: null` [PRE-EXISTING — deferred]

**File:** `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts:276`
**Severity:** WARNING
**Pre-existing:** Yes (preserved verbatim from the pre-Phase-111 factory; Phase 111 did not introduce it)
**Disposition:** Deferred — behaves-identically contract; tracked in `.planning/todos/pending/2026-06-13-userdata-save-skips-null-termsofuseaccepted.md`

The save guard `if (image || termsOfUseAccepted)` uses a truthy check. When `setTermsOfUseAccepted(null)` is called (a valid call per the public API — `value: string | null`), `#editedTermsOfUseAccepted` is `null`, which is falsy. The condition is `false`, so the property update RPC is never called and the `null` edit is silently discarded. `resetTermsOfUseAccepted()` is then called at line 291, clearing the edit. The user believes the value was saved; it was not.

The same falsy check at line 150 also means `#unsavedProperties` does not surface `'termsOfUseAccepted'` when the pending edit is `null`, so no "unsaved changes" indicator warns the user.

The `#current` derived (line 78) correctly uses `?? termsOfUseAccepted` (nullish coalescing), so the rendered UI DOES show `null` as the effective value — increasing the apparent inconsistency, as the composite render looks correct but save does nothing.

**Fix:**
```typescript
// Line 150 — unsavedProperties must detect null explicitly
[
  this.#editedImage !== undefined ? 'image' : undefined,
  this.#editedTermsOfUseAccepted !== undefined ? 'termsOfUseAccepted' : undefined
].filter((p) => p !== undefined) as Array<keyof LocalizedCandidateData>

// Line 276 — save must fire when termsOfUseAccepted is null
if (image !== undefined || this.#editedTermsOfUseAccepted !== undefined) {
```

Note: `#editedImage` uses `undefined` as the "no edit" sentinel (line 219: `resetImage = () => { this.#editedImage = undefined; }`), so `!== undefined` is the correct discriminant for image too, aligning both branches.

---

#### WR-02: `questionBlocks` computation omits `entityType` from `getApplicableQuestions` [PRE-EXISTING — deferred]

**File:** `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:368`
**Severity:** WARNING
**Pre-existing:** Yes (confirmed via `git show 0e6f39f5a` — the omission predates Phase 111 and was preserved verbatim in the refactor)
**Disposition:** Deferred — behaves-identically contract; tracked in `.planning/todos/pending/2026-06-13-candidatecontext-questionblocks-missing-entitytype.md`

The third `$effect` in the constructor builds `nextBlocks` for `#questionBlocks` at line 368:

```typescript
const nextBlocks = nextOpinionCats
  .map((c) => c.getApplicableQuestions({ elections, constituencies }))  // ← missing entityType
  .filter((b) => b.length > 0);
```

All other `getApplicableQuestions` calls in the same `$effect` (lines 354, 359, 362) pass `entityType: ENTITY_TYPE.Candidate`. The missing `entityType` in the blocks computation means `questionBlocks` may contain questions that do not apply to the `Candidate` entity type, while `opinionQuestions` (line 362) correctly filters them out. A consumer iterating `questionBlocks.questions` would see more questions than `opinionQuestions`.

**Fix:**
```typescript
const nextBlocks = nextOpinionCats
  .map((c) => c.getApplicableQuestions({ elections, constituencies, entityType }))
  .filter((b) => b.length > 0);
```

---

### Info

#### IN-01: `#questionCategories` private field is written but never read outside the `$effect` [PRE-EXISTING — deferred]

**File:** `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:189, 371`
**Severity:** INFO
**Disposition:** Deferred — pre-existing, matches VoterContextProvider precedent; no phase-introduced defect

`#questionCategories` is assigned at line 371 in the third `$effect` but has no corresponding prototype getter and is not referenced elsewhere in the class. `CandidateContext` does not include `questionCategories` in its type. The field consumes memory and introduces a $state signal write on every question chain recalculation with no consumer.

The equivalent in `VoterContextProvider` is similarly not exposed — so this matches the voter precedent and is intentional. The lint rule `no-unused-private-class-members` flags it (noted in 111-03-SUMMARY as a pre-existing lint error).

**Fix:** Remove the field if it will never be exposed:
```typescript
// Delete: #questionCategories = $state<Array<QuestionCategory>>([]);
// Delete the assignment: this.#questionCategories = nextQuestionCategories;
```
Or suppress with the existing project lint-acceptance pattern if the field is reserved for a future surface accessor.

---

#### IN-02: `reloadCandidateData` passes `loadNominations: false` but discards nomination data silently [PRE-EXISTING — deferred]

**File:** `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts:232-239`
**Severity:** INFO
**Disposition:** Deferred — by-design behavior documented in JSDoc; no phase-introduced defect

`reloadCandidateData()` calls `dataWriter.getCandidateUserData({ ..., loadNominations: false })` and then calls `#updateCandidateData(userData.candidate)` — which replaces only `this.#savedData.candidate` while preserving `this.#savedData.user` and `this.#savedData.nominations` via the spread at line 110-113. This is correct by design (method is documented as "does not reload User or Nominations data").

However, if `userData` returned from the API contains a non-null `nominations` object (some adapters may populate it regardless of the flag), the returned `userData.nominations` is silently discarded. The existing JSDoc documents this, but callers have no indication that stale nominations could exist after a reload cycle if the nomination status changed server-side between `init()` and `reloadCandidateData()`.

No code change required — the behavior is documented and by design. Consider adding a `loadNominations: false` note to the `reloadCandidateData` JSDoc to make the stale-nominations caveat visible at the call site.

---

## Appendix: D1 Field-Init Order Verification

The declared field order in `CandidateContextProvider` is:

1. `#appContext` / `#authContext` / stable refs (field initializers, run first)
2. `#answersLocked` (`$derived` from `#reactiveAppSettings`) 
3. `#idTokenClaims` (`$derived` from `page.data`)
4. `#userData` (reads `#answersLocked` and `#reactiveLocale` via thunks — **declared after both**, D1 correct)
5. `#newUserEmail`, `#electionsSelectable`, `#constituenciesSelectable`, persisted handles
6. `#preregistrationElections`, `#preregistrationNominations` (`$derived.by` reading persisted handles)
7. `#selectedElections`, `#selectedConstituencies`, `#question*` `$state` mirrors (push targets for `$effect`s)
8. `#requiredInfoQuestions`, `#unansweredRequiredInfoQuestions`, `#unansweredOpinionQuestions`, `#profileComplete` (`$derived` reading `#infoQuestions`/`#opinionQuestions`)
9. Constructor: `Object.assign` calls, then three `$effect` blocks

D1 ordering is satisfied. The thunk-arg pattern (`answersLocked: () => this.#answersLocked`) defers reads until the first effect execution, which is always after all field initializers complete, so the order is safe even if the `$derived` thunks were swapped.

---

*Reviewed: 2026-06-13*
*Reviewer: Claude (gsd-code-reviewer)*
*Depth: standard*
