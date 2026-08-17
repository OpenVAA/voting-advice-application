# Phase 123: Svelte 5 Idiom Polish — Lifecycle & Reactive-State - Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 4 edit targets + 1 new file (lifecycle/reactive-`let` audit covers ~21 in-place sites, classified in RESEARCH not re-enumerated here)
**Analogs found:** 5 / 5

> **Phase shape:** This is an in-place idiom-polish phase. Most "files" are modified, not created. Their analog is the surrounding/sibling code in the same file. RESEARCH.md already classifies all 25 lifecycle call sites (per-site MIGRATE/LEAVE) and the reactive-`let` detection method — that mapping is NOT duplicated here. This document focuses pattern-extraction effort where it adds value: the ONE new file (Bug 1 test), the Bug 2 test extension, and the two one-line bug-fix analogs.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `candidateContext.svelte.test.ts` (NEW) | test | request-response (spy assertion) | `candidateUserDataState.svelte.test.ts` | role-match (same dir, same vitest+`$effect.root` idiom) |
| `candidateUserDataState.svelte.test.ts` (extend) | test | CRUD (save payload) | itself — existing Test 3 (line 148-164) | exact (same describe block) |
| `candidateContext.svelte.ts:378` (Bug 1 fix) | context | event-driven (`$effect` compute) | sibling calls `:363/364/369/372` (same `$effect`) | exact |
| `candidateUserDataState.svelte.ts:150,276` (Bug 2 fix) | store/model | CRUD (save guard) | tri-state field decl `:60` + setter `:222` | exact (in-file contract) |
| ~21 lifecycle / reactive-`let` files (audit) | component | various | sibling in-file rationale comments | per-site (see RESEARCH table) |

## Pattern Assignments

### `candidateContext.svelte.test.ts` (NEW — test, spy assertion) — RUNES-05 Bug 1

**Analog:** `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.test.ts` (full file, lines 1-191).

The new test is the larger of the two test tasks (research A2 / Open Question 1). The analog supplies the harness idioms; the planner must confirm the construction seam in Wave 0.

**Test-harness construction pattern to copy** (`candidateUserDataState.svelte.test.ts:99-113`):
```ts
function setup(userData) {
  const fake = makeFakeWriter();
  let store!: CandidateUserDataState;
  cleanup = $effect.root(() => {
    store = candidateUserDataState({ /* stubbed deps */ });
  });
  store.init(userData);
  flushSync();
  return { store, ...fake };
}
```
Mirror this: construct the context inside `$effect.root(() => { ... })`, capture the handle, then `flushSync()` so the `questionBlocks` `$effect` settles. Keep the `cleanup` teardown in `afterEach` (`:83,89-94`).

**Fake/spy pattern to copy** (`makeFakeWriter`, `:54-80`): the analog builds a minimal fake with `vi.fn()` methods that mirror the real return SHAPE. For Bug 1, build a `QuestionCategory`-shaped fake where:
- `appliesTo` → returns `true`
- `getApplicableQuestions` → a `vi.fn()` spy returning a non-empty array

Then assert **every** `getApplicableQuestions` invocation (including the `nextBlocks` call at source `:378`) received an arg object containing `entityType: ENTITY_TYPE.Candidate`. This spy-on-the-collaborator assertion is the lower-risk seam recommended in RESEARCH (vs. heavy `initCandidateContext` instantiation).

**Module-mock + helper-factory idioms to copy** (`:8-39`): `vi.mock('$app/environment', () => ({ browser: true, ... }))` and the `makeUserData(overrides?)` factory. The new test will need analogous mocks/factories for the upstream contexts (`getAppContext`/`getAuthContext`) and a `makeDataRoot()`-style factory producing the fake `questionCategories[]`.

**Open seam (A2) — flag for planner:** confirm whether `initCandidateContext` runs cleanly under `$effect.root` with stubbed `getAppContext`/`getAuthContext`, OR whether a behavior-neutral pure-helper extract of the blocks computation is the cleaner seam. Either is acceptable; the invariant assertion (`getApplicableQuestions` called with `entityType`) holds regardless. Size this as a Wave-0 task.

---

### `candidateUserDataState.svelte.test.ts` (extend — test, CRUD) — RUNES-05 Bug 2

**Analog:** existing **Test 3** in the same file (`:148-164`).

Test 3 is the happy-path string-timestamp case and is the structural template for the two new cases (Test 5 explicit-null, Test 6 unedited-undefined). Copy its exact shape:
```ts
const { store, updateAnswers, updateEntityProperties } = setup(makeUserData());
store.setTermsOfUseAccepted('2026-05-31T00:00:00Z');  // ← vary this line per new test
flushSync();
await store.save();
flushSync();
expect(updateEntityProperties).toHaveBeenCalledTimes(1);
expect(updateEntityProperties.mock.calls[0][0].properties.termsOfUseAccepted)...
```

**No fake changes needed** — the existing `updateEntityProperties` fake (`:58-70`) already types `termsOfUseAccepted?: string | null`.

- **Test 5** (explicit null — true regression, fails before fix): `store.setTermsOfUseAccepted(null)` → assert `...properties.termsOfUseAccepted).toBeNull()` and `toHaveBeenCalledTimes(1)`.
- **Test 6** (unedited undefined — behavior-neutrality guard, passes before & after): no setter call → assert `expect(updateEntityProperties).not.toHaveBeenCalled()`.

Insert both inside the existing `describe('candidateUserDataState.save()')` block, after Test 4 (`:190`).

---

### `candidateContext.svelte.ts:378` (Bug 1 fix — context, `$effect`)

**Analog:** the three sibling calls in the SAME `$effect` body (`:363` `appliesTo`, `:364/369/372` `getApplicableQuestions`) — all pass `entityType`.

`entityType` is already in scope (declared `:359`). The lone omission at `:378`:
```ts
// CURRENT
.map((c) => c.getApplicableQuestions({ elections, constituencies }))
// FIXED — mirror siblings
.map((c) => c.getApplicableQuestions({ elections, constituencies, entityType }))
```
Zero blast radius beyond `questionBlocks` (exposed via getter `:565`). Behavior-neutral on the default single-entity-type seed; correctness-restoring for multi-type (RESEARCH Pitfall 4 — verify candidate questions E2E flow stays green).

---

### `candidateUserDataState.svelte.ts:150,276` (Bug 2 fix — store, CRUD)

**Analog:** the in-file tri-state contract — field decl `:60` (`#editedTermsOfUseAccepted = $state<string | null | undefined>(undefined)`), setter `:222`, reset-to-`undefined` `:226`.

Two truthy guards must honor the tri-state via `!== undefined` (D-01):
- **`:150`** (changed-props filter): `this.#editedTermsOfUseAccepted !== undefined ? 'termsOfUseAccepted' : undefined`
- **`:276`** (save guard): `if (image || termsOfUseAccepted !== undefined) {`

**Scope discipline (RESEARCH anti-patterns):** change ONLY the terms sub-expression at each site. Leave the `#editedImage` truthy guard (`:150`, same line) and `image` truthy guard (`:276`) untouched — `#editedImage` is `T | undefined`, not tri-state. Do NOT touch the merge at `:286`. Verify Test 3 still passes unchanged (string-path behavior-neutrality, RESEARCH Pitfall 2).

---

### Lifecycle (RUNES-01) + reactive-`let` (RUNES-02) audit — in-place, per-site

**Analog:** each site's surrounding in-file rationale comments are the institutional memory. RESEARCH classifies all 25 lifecycle call sites (recommended disposition: LEAVE all 25, document the leaves) and gives the reactive-`let` detection grep + the LEAVE-as-`let` examples (timer/handle locals). Do not re-derive here — consume the RESEARCH tables directly.

**Hard-LEAVE analogs (documented prior decisions — never migrate):** `routes/(voters)/+layout.svelte:107` (REVERT-TO-ONMOUNT, Phase 86.3), `routes/candidate/+layout.svelte:56` (debounce-hang revert), `routes/(voters)/(located)/questions/+layout.svelte:143` and `.../results/[[electionTab]]/+layout.svelte:196` (explicit anti-`$effect` "PRESERVE VERBATIM" comments).

**`$effect`-with-cleanup idiom** (only if executor elects to migrate a borderline site like `WithPolling:27`): `$effect(() => { setup(); return () => teardown(); });` — MUST verify no reactive deps re-fire. Default is LEAVE.

## Shared Patterns

### Tri-state edited-field contract
**Source:** `candidateUserDataState.svelte.ts:60` (decl), `:222` (setter), `:226` (reset)
**Apply to:** Both Bug 2 guard sites (`:150`, `:276`). `undefined` = unedited → skip; `null` OR `string` = edited → send. Test via `!== undefined`, never truthiness.

### `$effect.root` test harness
**Source:** `candidateUserDataState.svelte.test.ts:99-113` + `afterEach` cleanup `:83,89-94`
**Apply to:** Both test files. Construct rune-backed state inside `$effect.root`, `flushSync()` to settle, tear down via captured `cleanup` in `afterEach`.

### `vi.fn()` collaborator-shape fake
**Source:** `candidateUserDataState.svelte.test.ts:54-80` (`makeFakeWriter`)
**Apply to:** Both tests. Fakes mirror the real collaborator's return SHAPE; spies assert call args (`mock.calls[0][0]`).

### Module + factory stubs
**Source:** `candidateUserDataState.svelte.test.ts:11-39` (`vi.mock('$app/environment')`, `makeUserData`)
**Apply to:** The new `candidateContext` test needs analogous upstream-context mocks + a `DataRoot`/`QuestionCategory` factory.

### svelte-check baseline gate (D-03, criterion 4)
**Source:** RESEARCH baseline `COMPLETED 2086 FILES 151 ERRORS 1 WARNINGS`
**Apply to:** Every touched file. Re-measure with `yarn workspace @openvaa/frontend check` on the same tree state; error count must stay ≤ 151 (RESEARCH Pitfall 3 — capture before any edit).

## No Analog Found

None. Every edit target has a sibling/in-file or same-directory analog. The one NEW file (`candidateContext.svelte.test.ts`) has a strong role-match analog in `candidateUserDataState.svelte.test.ts` (same directory, same vitest + `$effect.root` idiom); only its collaborator fakes differ.

## Metadata

**Analog search scope:** `apps/frontend/src/lib/contexts/candidate/` (test + context + store), in-file sibling lines for both bug fixes. Lifecycle/reactive-`let` surface mapped by RESEARCH (consumed, not re-searched).
**Files scanned:** 3 read in full/part this session (`candidateUserDataState.svelte.test.ts`, `candidateContext.svelte.ts:355-389`) + RESEARCH/CONTEXT.
**Pattern extraction date:** 2026-06-17
