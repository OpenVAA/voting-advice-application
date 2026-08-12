# Phase 123: Svelte 5 Idiom Polish — Lifecycle & Reactive-State - Research

**Researched:** 2026-06-17
**Domain:** Svelte 5 runes idiom migration (behavior-neutral) in `apps/frontend/src`
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 — Bug 2 (`termsOfUseAccepted: null`): persist explicit null.** Track edited-state by `!== undefined`, not truthiness. Tri-state: `undefined` = unedited → skip; `null` OR `string` = edited → send to backend. Honors the existing `setTermsOfUseAccepted(value: string | null)` contract. **Both** truthy sites must change: the changed-properties filter (`candidateUserDataState.svelte.ts:150`) and the save guard (`:276`). NOTE: no production UI sets `null` today (`routes/candidate/(protected)/+layout.svelte:50` always passes `new Date().toJSON()`), so this is a latent-correctness / type-faithfulness fix, not a live-bug fix — keep it strictly behavior-neutral for the existing string path.
- **D-02 — Each bug gets a dedicated regression test.** Extend `candidateUserDataState.svelte.test.ts` to assert the terms edit is included in the `updateEntityProperties` call per D-01 semantics (incl. an explicit-null case). Add a `candidateContext` test asserting `entityType` is passed to `getApplicableQuestions` in the `questionBlocks` computation (Bug 1). Both fixes ship with a guarding test.
- **D-03 — Acceptance gate = build + unit tests + svelte-check (no net-new errors over the working baseline) + one full E2E suite run** as the final trust signal. A failing/"did-not-run" E2E test blocks completion (cardinal rule). Capture the svelte-check baseline error count BEFORE migration. The two bug regression tests (D-02) are part of the unit gate.
- **D-04 — Conservative `onMount`/`onDestroy` → `$effect` posture.** Migrate ONLY clean 1:1 cases where `$effect` is behavior-equivalent: no re-run hazard, and no genuine once-only/teardown semantics. Leave ambiguous or genuinely-lifecycle cases as-is, documented per-site (a one-line `// reason:` / `svelte-warning: accepted`-style note where useful). Mind the SSR caveat: `$effect` does not run on the server (neither does `onMount`; `onDestroy` does).
- **D-05 — Reactive `let` → `$state` only when the local is mutated for reactive effect.** Non-reactive locals (computed-once, never reassigned to drive UI) stay `let`. Per-site judgment, not a blanket sweep.

### Claude's Discretion
- **D-06 — Commit granularity** — prefer atomic per-file or per-requirement commits so a regression can be bisected; executor/planner call.
- Exact per-site migrate/leave classification for the lifecycle files and the reactive-`let` sites (apply D-04/D-05 during planning/execution).
- Whether a given leave-untouched lifecycle site warrants an inline rationale comment.

### Deferred Ideas (OUT OF SCOPE)
- **RUNES-03** (svelte/store ESLint guard tree-wide lock-in) and **RUNES-04** (post-runes visual verification pass) — **Phase 124**, do NOT pull in.
- The full `svelte/store`→runes bridge migration — already landed in v2.13 (Phases 113–117); this phase is the remaining idiom polish, NOT the bridge migration.
- `gsd-ui-phase` — skipped (behavior-neutral structural migration, no visual redesign; precedent Phases 76/80).
- Four phase-matched todos (candidate answer store investigation, nominating-org display, nominations route fetch-all, multiple-text-question input) — all feature work, out of scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RUNES-01 | `onMount`/`onDestroy` → `$effect` where semantically equivalent (~24 files), behavior-neutral + verified | Full per-site classification table below (25 real call sites across 21 files). MIGRATE candidates identified with rationale; genuine-lifecycle LEAVE cases enumerated with existing in-code justifications. |
| RUNES-02 | Reactive `let` → `$state`, per-site (non-reactive locals left as `let`) | Detection method + representative candidate sites below. Codebase is already heavily runes-migrated; few true reactive-`let` survivors remain. |
| RUNES-05 | Fix two context bugs (`questionBlocks` missing `entityType`; `userData.save()` dropping `termsOfUseAccepted: null`) | Exact diffs + line numbers confirmed against live source; regression-test shape specified for both. |
</phase_requirements>

## Summary

This is a **mechanical, behavior-neutral Svelte 5 idiom-polish phase** with three independent workstreams (RUNES-01 lifecycle, RUNES-02 reactive-`let`, RUNES-05 two bug fixes). The repo already completed the heavy `svelte/store`→runes bridge migration in v2.13 (Phases 113–117), so what remains is residual idiom cleanup plus two latent bugs.

The single highest-value finding: **the lifecycle-migration surface is much smaller than the "~24 files" headline suggests once classified.** There are **25 real call sites** (13 `onMount` + 12 `onDestroy`) across **21 distinct files**. The overwhelming majority are **genuine lifecycle / teardown semantics that must be LEFT** — browser-only imperative once-only setup (`addEventListener`, `openModal`, polling start), `clearTimeout`/`clearInterval` teardown, `filter.onChange(..., false)` unsubscribe, and several route-level `onMount` one-shots that carry **explicit in-code anti-`$effect` rationale comments** (Phase 86.3 REVERT-TO-ONMOUNT decisions, navigation redirects). Only a small handful are arguable clean 1:1 `$effect` equivalents, and even those mostly fail the D-04 "no re-run hazard / no genuine once-only" test. Per D-04's conservative posture, the correct outcome is **migrate very few, leave most, document the leaves** — this is expected and correct, not under-delivery.

Both RUNES-05 bugs are confirmed against live source at the exact lines CONTEXT.md predicted. The svelte-check baseline is **151 errors / 1 warning** across 2086 files (all pre-existing TYPE-01/TYPE-02 errors deferred to other phases) — this is the measurable "no net-new errors" gate for criterion 4.

**Primary recommendation:** Treat RUNES-05 (two bugs + two tests) as the load-bearing deliverable; treat RUNES-01/02 as a disciplined audit that LEAVES most sites with documented rationale and migrates only the provably-clean handful. Capture the 151-error svelte-check baseline before touching anything, and run the full E2E suite as the final trust signal.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Lifecycle hook → `$effect` migration | Browser / Client | — | `onMount`/`onDestroy`/`$effect` are all client-render concerns; none run server-side except `onDestroy`. Pure component-tier change. |
| Reactive `let` → `$state` | Browser / Client | — | Component-local reactive state; no cross-tier effect. |
| Bug 1 — `questionBlocks` entityType | Browser / Client (context layer) | — | `candidateContext.svelte.ts` is a client-side reactive context; the `$effect` computing `questionBlocks` runs in-browser against the already-loaded `DataRoot`. |
| Bug 2 — `save()` terms persistence | Browser / Client (context layer) → API | API / Backend | The `save()` path constructs the `updateEntityProperties` payload client-side; the persisted value crosses to the Supabase backend via `UniversalDataWriter`. The fix is client-side payload construction only. |

## Standard Stack

No new dependencies. This phase edits existing code only.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | 5.53.12 | Runes (`$state`, `$effect`, `$derived`), lifecycle hooks | [VERIFIED: yarn.lock — `svelte@npm:5.53.12`, catalog-pinned `^5.53.12`]. Project is on Svelte 5; runes are the target idiom. |
| vitest | catalog (`^3.2.4` per coverage-v8 sibling) | Unit + regression tests | [VERIFIED: apps/frontend/package.json — `test:unit: vitest run`]. Existing `candidateUserDataState.svelte.test.ts` uses it. |
| svelte-check | (bundled via `@openvaa/frontend check`) | Type/diagnostic baseline gate | [VERIFIED: apps/frontend/package.json — `check: svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`]. |
| @playwright/test | catalog | Full E2E suite (final trust signal, D-03) | [VERIFIED: root package.json — `test:e2e: playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe`]. |

**Installation:** None. `yarn install` already satisfied.

## Package Legitimacy Audit

Not applicable — this phase installs **no external packages**. All work is edits to existing `apps/frontend/src` files. No registry verification required.

## Lifecycle Migration Surface — Per-Site Classification (RUNES-01)

> **Method:** `grep -rIn "onMount(\|onDestroy(" --include=*.svelte --include=*.ts apps/frontend/src`, filtering out comments and the commented-out block in `Input.svelte:358-363`. **25 real call sites across 21 distinct files** (13 `onMount` + 12 `onDestroy`). Each site was read in source context and classified per D-04.

**Classification legend:**
- **MIGRATE** — clean 1:1 `$effect`-equivalent: no re-run hazard AND no genuine once-only/teardown semantics.
- **LEAVE** — re-run hazard, browser-only imperative once-only setup, genuine teardown, OR a documented prior anti-`$effect` decision. Add/keep a one-line rationale where useful (D-04).

| File:line | Hook | Classification | Rationale (grounded in source) |
|-----------|------|----------------|-------------------------------|
| `lib/admin/components/jobs/WithPolling.svelte:27` | onMount (returns cleanup `stopPolling`) | **LEAVE** | Genuine mount-once/unmount-once lifecycle: `startPolling()` on mount, `stopPolling()` on teardown. An `$effect` with no deps would also run once, but this is imperative side-effect lifecycle with a teardown return — the idiomatic `$effect(() => { startPolling(); return stopPolling; })` IS a valid 1:1 here. **Borderline MIGRATE** if executor wants it; default LEAVE (no benefit, genuine lifecycle). |
| `lib/components/alert/Alert.svelte:76` | onMount | **LEAVE (or borderline MIGRATE)** | `if (autoOpen) openAlert()` — once-only init. `$effect` reading `autoOpen` would re-fire if `autoOpen` changed; `autoOpen` is a prop and could in principle change. Re-run hazard → LEAVE to preserve once-only semantics. |
| `lib/components/modal/drawer/Drawer.svelte:67` | onMount | **LEAVE** | `containerRef?.openModal()` — imperative once-only DOM action against a `bind:this` ref that is only populated after first render. Genuine mount-time imperative call; re-running on any reactive change would re-open the modal. |
| `lib/components/preventNavigation/PreventNavigation.svelte:43` | onMount | **LEAVE** | `addEventListener('beforeunload', ...)`. Browser-only imperative once-only setup. **Already carries an explicit in-code rationale comment** (line 42: "browser-only; onMount itself doesn't fire on the server"). Paired with the onDestroy below — genuine add/remove lifecycle. |
| `lib/components/preventNavigation/PreventNavigation.svelte:49` | onDestroy | **LEAVE** | `removeEventListener` teardown, browser-guarded. **Already documented** (line 47: "onDestroy fires on both server and client; guard the browser-only API"). Genuine teardown; pairing with onMount could become `$effect(() => { addEventListener(...); return () => removeEventListener(...); })` — a valid MIGRATE, but the existing SSR-guard comment shows the author chose split hooks deliberately. Default LEAVE. |
| `lib/components/questions/QuestionOpenAnswer.svelte:33` | onMount (`tick().then(...)`) | **LEAVE** | Async post-mount DOM measurement (`el.clientHeight < el.scrollHeight`) gated on `tick()`. `$effect` would re-fire on `collapsible`/`fullHeight` writes (re-run/feedback hazard) and `onMount`'s async-then pattern is intentionally one-shot. Re-run hazard → LEAVE. |
| `lib/components/video/Video.svelte:221` | onMount (`setShouldPlay(!!autoPlay)`) | **LEAVE** | One-shot init that starts an interval regime (`initErrorChecking` → `setInterval`). Re-running would spawn duplicate intervals. Genuine once-only. |
| `lib/components/video/Video.svelte:279` | onDestroy (`clearErrorChecking`) | **LEAVE** | `clearTimeout` teardown of the error-check interval. Genuine teardown. (Note: an `$effect` cleanup could own this, but it would have to own the interval start too — a larger refactor than behavior-neutral polish allows.) |
| `lib/components/video/Video.svelte:328` | onMount (`startVideoEvent`) | **LEAVE** | One-shot tracking-event start, paired with `beforeNavigate(endVideoEvent)`. Re-running would create duplicate events (guarded by `if (event) return`, but the once-only intent is clear). LEAVE. |
| `lib/candidate/components/passwordValidator/PasswordValidator.svelte:83` | onDestroy (`clearTimeout(timeout)`) | **LEAVE** | Debounce-timeout teardown. Genuine teardown. (The CLAUDE.md memory notes a prior perm-hang where reactive re-runs reset this 200ms debounce — extra reason to NOT convert to a re-running `$effect`.) |
| `lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:85` | onDestroy (`filter.onChange(updateSelected, false)`) | **LEAVE** | Unsubscribe from a non-reactive `filter.onChange` listener registered imperatively at init (line 82). Genuine teardown of an external subscription. |
| `lib/components/entityFilters/numeric/NumericEntityFilter.svelte:53` | onDestroy (`filter.onChange(updateValues, false)`) | **LEAVE** | Same pattern — unsubscribe external filter listener. Genuine teardown. |
| `lib/components/modal/timed/TimedModal.svelte:104` | onDestroy (`if (timer) clearTimeout(timer)`) | **LEAVE** | Timeout teardown. Genuine teardown. |
| `lib/dynamic-components/entityList/EntityList.svelte:76` | onDestroy (`if (scrollTimeout) clearTimeout(scrollTimeout)`) | **LEAVE** | Scroll-debounce teardown. Genuine teardown. |
| `lib/dynamic-components/feedback/Feedback.svelte:97` | onDestroy (`clearErrorTimeout`) | **LEAVE** | Error-timeout teardown. Genuine teardown. |
| `lib/dynamic-components/feedback/modal/FeedbackModal.svelte:33` | onDestroy (`if (closeTimeout) clearTimeout(closeTimeout)`) | **LEAVE** | Close-timeout teardown. Genuine teardown. |
| `lib/dynamic-components/feedback/popup/FeedbackPopup.svelte:30` | onDestroy (`if (closeTimeout) clearTimeout(closeTimeout)`) | **LEAVE** | Close-timeout teardown. Genuine teardown. |
| `lib/dynamic-components/survey/popup/SurveyPopup.svelte:29` | onDestroy (`if (closeTimeout) clearTimeout(closeTimeout)`) | **LEAVE** | Close-timeout teardown. Genuine teardown. |
| `routes/(voters)/(located)/questions/+layout.svelte:143` | onMount (`start` param handler) | **LEAVE** | **Already carries explicit anti-`$effect` rationale** (lines 137–142: "kept as onMount … porting to afterNavigate/$effect would re-fire on every hop"). Once-per-session deep-link handler. Definitive LEAVE. |
| `routes/(voters)/(located)/questions/+page.svelte:49` | onMount (redirect + stale-category filter) | **LEAVE** | Navigation redirect (`goto`) + one-shot `firstQuestionId = null` reset. `$effect` would re-fire / re-redirect. Genuine navigation one-shot. |
| `routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte:77` | onMount (`goto` redirect) | **LEAVE** | Pure navigation redirect (`goto(..., { replaceState: true })`). Once-only; re-running re-redirects. LEAVE. |
| `routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:196` | onMount (`startEvent` tracking) | **LEAVE** | **File already documents the onMount-vs-$effect split** (line 193 "Pitfall 6 — PRESERVE VERBATIM"; the adjacent countdown logic at 204–215 was DELIBERATELY kept `$effect` while this tracking start was kept `onMount`). One-shot results-entry analytics event. Definitive LEAVE. |
| `routes/(voters)/+layout.svelte:107` | onMount (popup queue) | **LEAVE** | **Explicit REVERT-TO-ONMOUNT decision** (lines 92–106, Phase 86.3): a reactive `$effect` re-queue broke e2e fixtures. Hard LEAVE — converting this would reintroduce a known regression. |
| `routes/candidate/+layout.svelte:56` | onMount (popup queue) | **LEAVE** | **Explicit anti-`$effect` rationale** (lines 49–55): a reactive `$effect` re-run reset PasswordValidator's debounce and hung the set-password submit. Hard LEAVE. |
| `routes/+layout.svelte:173` | onDestroy (`submitAllEvents()`) | **LEAVE** | Analytics flush on teardown, paired with `onNavigate`/`afterNavigate` analytics hooks (Phase 015/016 view-transitions work). Genuine teardown of the root layout. LEAVE. |

**Net RUNES-01 outcome (expected):** Of 25 sites, **0 are unambiguous MIGRATE**; 2–3 are *borderline* (`WithPolling:27`, `PreventNavigation:43+49` as a paired `$effect`-with-cleanup) where an idiomatic `$effect(() => { setup(); return teardown; })` is a legal 1:1. Per the D-04 conservative posture **the recommended disposition is to LEAVE all 25** and, for any site lacking one, add a one-line `// reason:` note explaining why it stays a lifecycle hook. **This is the correct, success-criteria-satisfying outcome** — criterion 1 says "migrated … where semantically equivalent; genuine lifecycle semantics retained," and the surface is genuine-lifecycle-dominant. The planner should frame RUNES-01 as an **audit-and-document** task, not a bulk-rewrite task, and must not pressure-migrate borderline sites against documented prior decisions.

> **If the executor elects to migrate the 2–3 borderline `$effect`-with-cleanup sites:** the idiom is `$effect(() => { setup(); return () => teardown(); });` (Svelte 5 `$effect` cleanup runs on unmount AND before re-run). MUST verify the effect has **no reactive deps that would re-fire** — e.g. `WithPolling` reads only stable context destructures, so its `$effect` would run exactly once; that one is the safest. Each migrated site requires its own per-site verification (build + the relevant E2E spec green).

## Reactive-`let` → `$state` Candidate Identification (RUNES-02)

### Reliable detection method

The repo is **already deeply runes-migrated** — most mutable reactive locals are already `$state(...)`. To find genuine survivors (a `let` that is *reassigned to drive UI*, NOT already `$state`):

```bash
# 1. Find bare `let X = ...` (no $state/$derived/$props on the RHS) in .svelte scripts:
grep -rn '^\s*let [a-zA-Z_]' apps/frontend/src --include="*.svelte" \
  | grep -v '\$state' | grep -v '\$derived' | grep -v '\$props' | grep -v '\$bindable'

# 2. For each candidate, check whether it is REASSIGNED anywhere (mutation = reactive intent):
#    grep the same identifier for `<name> =` assignments outside its declaration.
#    - Reassigned AND read in template/$derived/$effect  → MIGRATE to $state (D-05).
#    - Never reassigned (computed-once const-like local) → LEAVE as `let`.
#    - Holds a non-reactive handle (timeout id, interval id, event ref, bind:this target
#      already declared $state) → LEAVE as `let` (these are intentionally non-reactive).
```

**Per-site judgment is mandatory (D-05).** The decisive test is: *is this `let` reassigned, and does a template / `$derived` / `$effect` read of it need to re-evaluate when it changes?* If yes → `$state`. If it's a timer id, a one-shot computed value, or an imperative ref, it stays `let`.

### Representative survivor sites found

These bare `let` declarations sit adjacent to confirmed teardown sites and are **intentionally non-reactive** — they hold timer/event handles and are reassigned in callbacks but **never read reactively**. They are **LEAVE-as-`let`** examples (useful as anti-pattern reference for the executor):

| Site | Declaration | Disposition | Why |
|------|-------------|-------------|-----|
| `Video.svelte:215` | `let lastPlaying = { time: -1, videoTime: -1 }` | **LEAVE** | Mutated inside the interval callback but never read in a tracking scope — pure imperative bookkeeping. `$state` would add needless reactivity. |
| `Video.svelte:333` | `let event: TrackingEvent<...> \| undefined = undefined` | **LEAVE** | Imperative tracking-event handle, set/cleared in callbacks, never template-read. |
| `PasswordValidator.svelte` (timeout var) / `FeedbackModal.svelte:32` / `FeedbackPopup.svelte:29` / `SurveyPopup.svelte:28` / `EntityList` (scrollTimeout) | `let closeTimeout`/`scrollTimeout`/`timeout: NodeJS.Timeout` | **LEAVE** | Timer ids — non-reactive by design. |

**Confirmed MIGRATE survivors:** The grep above must be run during planning to enumerate them precisely; based on the spot survey, **genuine reactive-`let` survivors are rare** (the v2.13 migration already converted the obvious ones — e.g. `Video.svelte` already uses `$state` for `shouldPlay`, `jumpBackPressed`, etc.). The planner should run the grep, hand-classify each hit, and expect a **small** MIGRATE set. Do NOT blanket-convert (D-05).

**[ASSUMED]** that the reactive-`let` MIGRATE set is small (<~5 sites). This is based on the spot survey showing existing `$state` saturation, not an exhaustive grep — the planner must run the detection method to confirm the exact set.

## RUNES-05 — The Two Bug Fixes (exact diffs + test shape)

### Bug 1 — `candidateContext.svelte.ts:378` omits `entityType`

**Confirmed against live source.** The `questionBlocks` `$effect` (lines 355–379) computes `entityType = ENTITY_TYPE.Candidate` at line 359 and passes it to **three** sibling `getApplicableQuestions` calls (lines 364, 369, 372) plus the `appliesTo` call (line 363). Line 378 is the **lone omission**:

```ts
// CURRENT (candidateContext.svelte.ts:377-379) — Bug 1
const nextBlocks = nextOpinionCats
  .map((c) => c.getApplicableQuestions({ elections, constituencies }))   // ← missing entityType
  .filter((b) => b.length > 0);
```

**Fix (one line, mirrors siblings):**

```ts
// FIXED
const nextBlocks = nextOpinionCats
  .map((c) => c.getApplicableQuestions({ elections, constituencies, entityType }))
  .filter((b) => b.length > 0);
```

[VERIFIED: codebase read — lines 359, 363–364, 369, 372 all pass `entityType`; 378 does not.] `entityType` is already in scope at line 378 (declared at 359, same `$effect` body). Zero blast radius beyond `questionBlocks`. Exposed via the `get questionBlocks()` getter at line 565.

**Behavioral note:** `nextBlocks` feeds the opinion-question blocks shown to candidates. Omitting `entityType` means `getApplicableQuestions` does not filter by candidate-applicability — potentially surfacing questions that should be entity-type-scoped out. The fix tightens to match siblings; **for the common single-entity-type election this is behavior-neutral**, but for multi-entity-type setups it correctly removes non-applicable questions. Flag this in the plan: the fix is *correctness-restoring*, and the E2E suite + the candidate questions flow must stay green (no questions disappearing in the default seed, which is single-entity-type Candidate).

### Bug 2 — `candidateUserDataState.svelte.ts` drops explicit `termsOfUseAccepted: null`

**Confirmed against live source.** Tri-state field declared at line 60 (`#editedTermsOfUseAccepted = $state<string | null | undefined>(undefined)`), setter at 222 (`setTermsOfUseAccepted(value: string | null)`), reset to `undefined` at 226–228. Two truthy guards drop an explicit `null`:

**Site 1 — changed-properties filter (line 150):**

```ts
// CURRENT (line 148-153)
#unsavedProperties = $derived.by(
  () =>
    [this.#editedImage ? 'image' : undefined, this.#editedTermsOfUseAccepted ? 'termsOfUseAccepted' : undefined].filter(
      (p) => p !== undefined
    ) as Array<keyof LocalizedCandidateData>
);
```

**Fix (line 150 — test `!== undefined` per D-01):**

```ts
this.#editedTermsOfUseAccepted !== undefined ? 'termsOfUseAccepted' : undefined
```

(The `#editedImage` truthy guard on the same line is OUT of D-01 scope — `#editedImage` is `ImageWithFile | undefined`, not tri-state, so its truthy check is correct. Change ONLY the terms guard.)

**Site 2 — save guard (line 276):**

```ts
// CURRENT (line 276-280)
if (image || termsOfUseAccepted) {
  updatedCandidate = await dataWriter.updateEntityProperties({
    ...updateArgs,
    properties: { image, termsOfUseAccepted }
  });
```

**Fix (line 276 — guard terms by `!== undefined`):**

```ts
if (image || termsOfUseAccepted !== undefined) {
```

(`image` keeps its truthy check; only the terms condition becomes `!== undefined`.)

[VERIFIED: codebase read — line 60 declaration, 150 filter guard, 222 setter, 276 save guard, 279 payload.]

**Behavior-neutrality proof (D-01 / CONTEXT specifics):** For the existing string path, `string !== undefined` is `true` exactly when `string ?` (truthy) is `true`, since a non-empty timestamp string is always truthy — so the string path is byte-for-byte unchanged. The only new behavior: an explicit `null` (currently unreachable — `routes/candidate/(protected)/+layout.svelte:50` always passes `new Date().toJSON()`) now reaches `updateEntityProperties`. **Latent-correctness fix, not a live-bug fix.** Keep the empty-string edge in mind: `''` (empty string) is falsy AND `!== undefined`, so the fix *would* now send an empty-string terms value where the old code skipped it — but no caller sets `''`, so this is theoretically reachable only via a future `setTermsOfUseAccepted('')`. Document this as intended per the tri-state contract (`undefined`=skip, everything else=send).

### Regression Test Shape (D-02)

**Test A — Bug 2, extend `candidateUserDataState.svelte.test.ts`** (existing suite; fake `updateEntityProperties` at lines 58–70 already accepts `termsOfUseAccepted?: string | null`, so no fake changes needed):

```ts
// New it() inside describe('candidateUserDataState.save()')
it('Test 5: explicit termsOfUseAccepted: null is sent to updateEntityProperties (tri-state, D-01)', async () => {
  const { store, updateEntityProperties } = setup(makeUserData());
  store.setTermsOfUseAccepted(null);            // explicit un-accept (tri-state edited)
  flushSync();
  await store.save();
  flushSync();
  expect(updateEntityProperties).toHaveBeenCalledTimes(1);
  expect(updateEntityProperties.mock.calls[0][0].properties.termsOfUseAccepted).toBeNull();
});

it('Test 6: unedited termsOfUseAccepted (undefined) is NOT sent (no updateEntityProperties call)', async () => {
  const { store, updateEntityProperties } = setup(makeUserData());
  // no setTermsOfUseAccepted call → stays undefined
  flushSync();
  await store.save();
  flushSync();
  expect(updateEntityProperties).not.toHaveBeenCalled();  // guards the "skip when unedited" half
});
```

The existing **Test 3** (line 148–164, string timestamp) already guards the string path; Tests 5+6 add the explicit-null and unedited-undefined cases. Together they pin the full tri-state contract. **Test 6 fails today only if a regression makes the filter over-eager; it passes today and after the fix** — it's the behavior-neutrality guard. **Test 5 fails before the fix** (current truthy guard drops `null`) **and passes after** — the true regression test.

**Test B — Bug 1, NEW file `candidateContext.svelte.test.ts`** (no existing test for this context):

The challenge: `candidateContext` is constructed via `initCandidateContext()` which composes `getAppContext()` + `getAuthContext()` and reads `page` / `dataWriter` — heavy to instantiate. **Recommended test strategy (lightest that guards the bug):** test the *observable property* — that `questionBlocks` only contains entity-applicable questions — by exercising the `$effect` against a fake `DataRoot` whose `questionCategories[].getApplicableQuestions` is a `vi.fn()` spy, then asserting the spy was called with an arg object containing `entityType: ENTITY_TYPE.Candidate` for the `nextBlocks` computation.

Because the `$effect` is a private class member, the practical seam is to **extract the block-computation into a testable pure helper** OR to construct the provider inside `$effect.root` with stubbed upstream contexts. Given behavior-neutrality constraints, the **lower-risk approach** is a spy-based assertion: mock a `QuestionCategory`-shaped object where `appliesTo` returns `true` and `getApplicableQuestions` is a spy returning a non-empty array, drive it through the provider, and assert **every** `getApplicableQuestions` invocation (including the `nextBlocks` one) received `entityType`. The planner should size this as the larger of the two test tasks and may add a Wave-0 fixture/helper if direct construction proves too heavy.

**[ASSUMED]** the exact construction seam for the candidateContext test — the planner/executor must confirm whether `initCandidateContext` can be driven in `$effect.root` with stubbed `getAppContext`/`getAuthContext`, or whether a small extract-pure-helper refactor (behavior-neutral) is the cleaner test seam. Either is acceptable; the assertion (`getApplicableQuestions` called with `entityType` in the blocks path) is the invariant.

## Architecture Patterns

### System Flow — Bug 2 save path (data flow)

```
setTermsOfUseAccepted(value)        [UI edit; value ∈ {string, null}]
        │ writes
        ▼
#editedTermsOfUseAccepted ($state)  [tri-state: undefined | null | string]
        │ read by
        ├─► #unsavedProperties ($derived, line 148)  ──guard line 150──►  drives #hasUnsaved
        │
        └─► save() (line 242)
                │ reads #editedTermsOfUseAccepted → local `termsOfUseAccepted`
                ▼
            guard line 276:  if (image || termsOfUseAccepted !== undefined)
                │ true
                ▼
            dataWriter.updateEntityProperties({ properties: { image, termsOfUseAccepted } })
                │ crosses tier
                ▼
            Supabase backend (persists value, incl. explicit null)
                │ returns ONLY changed props
                ▼
            #updateCandidateData({ ...savedData.candidate, ...updatedCandidate })  [merge, not replace]
                ▼
            resetTermsOfUseAccepted() → #editedTermsOfUseAccepted = undefined
```

### Pattern: Svelte 5 `$effect` with cleanup (only if migrating a borderline lifecycle site)

```ts
// Source: https://svelte.dev/docs/svelte/lifecycle-hooks (cited)
// Equivalent to onMount(() => { setup(); return teardown; }) ONLY when the
// effect has no reactive deps that would re-fire (otherwise re-run hazard).
$effect(() => {
  setup();
  return () => teardown();  // runs on unmount AND before each re-run
});
```

### Anti-Patterns to Avoid
- **Converting a documented REVERT-TO-ONMOUNT site to `$effect`** (`routes/(voters)/+layout.svelte:107`, `routes/candidate/+layout.svelte:56`). These were deliberately reverted because reactive re-queueing broke e2e fixtures / hung the password submit. Re-converting reintroduces known regressions.
- **Blanket `let`→`$state` sweep.** Violates D-05; turns non-reactive timer/handle locals into needlessly-reactive `$state`, risking extra effect invalidations.
- **Changing the `#editedImage` truthy guard.** Out of D-01 scope — `#editedImage` is `T | undefined`, not tri-state; truthy is correct there.
- **Replacing instead of merging in the save path.** The existing merge (`{ ...savedData.candidate, ...updatedCandidate }`, line 286) is load-bearing — `updateEntityProperties` returns only changed props. Do not touch it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Lifecycle teardown | Custom unsubscribe bookkeeping | Existing `onDestroy` / `$effect` cleanup return | Already idiomatic; the cleanup-return is the framework primitive. |
| Tri-state edited tracking | A boolean `isEdited` flag | The existing `undefined \| null \| string` tri-state + `!== undefined` test | The contract already exists (line 60/222/226); D-01 just makes the guards honor it. |
| svelte-check delta measurement | Manual error-count diffing scripts | Capture the `COMPLETED … N ERRORS` summary line before/after | svelte-check prints a machine-readable final summary (see baseline below). |

**Key insight:** This phase is *removing* hand-rolled-feeling idioms in favor of framework primitives — but only where the framework primitive is genuinely equivalent. The codebase's existing in-line rationale comments are the institutional memory of where that equivalence breaks; respect them.

## Common Pitfalls

### Pitfall 1: Over-migrating lifecycle hooks against documented decisions
**What goes wrong:** Converting an `onMount` one-shot to `$effect` reintroduces a fixed regression (popup re-queue breaking e2e fixtures; debounce reset hanging the password submit).
**Why it happens:** The "migrate ~24 files" headline reads as a mandate; the reality is most sites are genuine lifecycle.
**How to avoid:** Read each site's surrounding comments first. Treat REVERT-TO-ONMOUNT and "PRESERVE VERBATIM" annotations as hard LEAVE.
**Warning signs:** An e2e fixture stops advancing past an intro/popup; a debounced submit button stays disabled.

### Pitfall 2: Bug-2 fix changing the string path behavior
**What goes wrong:** A sloppy rewrite that conflates the `image` and `termsOfUseAccepted` guards, or changes the merge.
**Why it happens:** Both guards live on one line (150) / one condition (276).
**How to avoid:** Change ONLY the terms sub-expression to `!== undefined`; leave `image` truthy. Verify Test 3 (existing string-path test) still passes unchanged.
**Warning signs:** Test 3 changes behavior, or `image`-only saves stop firing.

### Pitfall 3: svelte-check baseline drift from environment, not code
**What goes wrong:** Re-running svelte-check after `svelte-kit sync` or a dep change yields a different baseline, masking/inventing "net-new" errors.
**Why it happens:** `check` runs `svelte-kit sync` first, regenerating `.svelte-kit/`.
**How to avoid:** Capture the baseline on the **clean working tree at phase start** (151 errors / 1 warning — see below), and re-measure with the same command on the same tree state. Compare the `N ERRORS` count, not individual lines.
**Warning signs:** Error count shifts on files this phase never touched.

### Pitfall 4: Bug-1 fix hiding questions in multi-entity-type setups
**What goes wrong:** Adding `entityType` correctly filters out non-candidate-applicable opinion questions — which *is* the fix, but could surprise if a test seed relied on the un-filtered behavior.
**Why it happens:** The default seed is single-entity-type (Candidate), so it's behavior-neutral there; a multi-type seed would see fewer blocks.
**How to avoid:** Verify the candidate questions E2E flow stays green on the default seed; document that the change is correctness-restoring, not neutral, for multi-type configs.
**Warning signs:** Candidate opinion-question count drops in any E2E spec.

## Runtime State Inventory

> This is a code-only idiom migration with two latent-bug fixes. No data migration, no stored-state rename. Inventory included for completeness per protocol.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no datastore keys/collections/ids reference any renamed symbol (nothing is renamed). | None. |
| Live service config | None — no external-service config touched. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None. | None. |
| Build artifacts | `.svelte-kit/` is regenerated by `svelte-kit sync` on each `check`/`build`; not committed, auto-refreshes. | None (auto). |

**Behavioral state note (not a rename):** Bug 2 changes which `termsOfUseAccepted` values reach the Supabase backend (explicit `null` now persists). No *existing stored data* changes — only the future write path. No backfill/migration needed (no caller sets `null` today).

## Code Examples

### Bug 1 fix (one line)
```ts
// Source: apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:377-379
const nextBlocks = nextOpinionCats
  .map((c) => c.getApplicableQuestions({ elections, constituencies, entityType }))  // add entityType
  .filter((b) => b.length > 0);
```

### Bug 2 fix (two sub-expressions)
```ts
// Source: candidateUserDataState.svelte.ts:150 (changed-props filter)
this.#editedTermsOfUseAccepted !== undefined ? 'termsOfUseAccepted' : undefined

// Source: candidateUserDataState.svelte.ts:276 (save guard)
if (image || termsOfUseAccepted !== undefined) {
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `onMount`/`onDestroy` for all setup/teardown | `$effect` with cleanup return where reactive-equivalent; lifecycle hooks retained for genuine once-only/teardown | Svelte 5 (project on 5.53.12) | This phase audits the boundary; most sites correctly stay lifecycle hooks. |
| Reactive mutable locals via `let` + `$:` | `$state` runes | v2.13 (Phases 113–117) | Mostly done already; RUNES-02 mops up survivors. |
| `svelte/store` bridges in contexts | Pure runes + getters | v2.13 (Phases 113–117) | DONE — not this phase. RUNES-03/04 (ESLint lock-in, visual verify) are Phase 124. |

**Deprecated/outdated:**
- `beforeUpdate`/`afterUpdate` → `$effect.pre`/`$effect` (per Svelte docs). Not present in this phase's surface, but the same migration philosophy applies.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Reactive-`let` MIGRATE survivor set is small (<~5 sites) | RUNES-02 | LOW — planner runs the grep to confirm exact set; under-estimate just means more per-site classification work, no behavior risk. |
| A2 | The candidateContext Bug-1 test can be driven via `$effect.root` with stubbed upstream contexts OR a behavior-neutral pure-helper extract | RUNES-05 Test B | MEDIUM — if neither seam is clean, the test may need a heavier harness; the *assertion* (entityType passed) is fixed regardless. |
| A3 | Bug-1 fix is behavior-neutral on the default (single-entity-type) seed | RUNES-05 / Pitfall 4 | MEDIUM — verify via candidate questions E2E flow; for multi-type configs it correctly removes non-applicable questions (correctness-restoring, not neutral). |

## Open Questions (RESOLVED)

1. **candidateContext test seam (A2)** — RESOLVED in plan **123-01 (T2)**: Wave 0 confirms the lightest seam before writing the test and records which seam was used. The assertion (`getApplicableQuestions` called with `entityType`) is invariant either way, so this is a construction-detail decision, not a blocking unknown.
   - What we know: `initCandidateContext` composes `getAppContext()`+`getAuthContext()`, reads `page`/`dataWriter`.
   - What's unclear: whether it constructs cleanly under `$effect.root` with stubs, or needs a small pure-helper extract for the blocks computation.
   - Recommendation: Planner spikes the lightest seam in Wave 0; the assertion (`getApplicableQuestions` called with `entityType`) is invariant either way.

2. **Borderline lifecycle sites (WithPolling:27, PreventNavigation:43+49)** — RESOLVED in plan **123-03 (T3)**: handled as an OPTIONAL executor-discretion task with **default LEAVE** per D-04; migrate only if the executor wants a demonstrative example and verifies the relevant spec green.
   - What we know: These are legal `$effect`-with-cleanup 1:1 conversions.
   - What's unclear: whether migrating them adds enough value to justify the per-site E2E re-verification.
   - Recommendation: Default LEAVE (conservative D-04); migrate only if the executor wants a demonstrative example and verifies the relevant spec green.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| svelte | All edits | ✓ | 5.53.12 | — |
| vitest | Unit + regression tests | ✓ | catalog (`^3.2.4` sibling) | — |
| svelte-check | Baseline gate (D-03) | ✓ | via `@openvaa/frontend check` | — |
| @playwright/test | Full E2E suite (D-03 final trust) | ✓ | catalog | — |
| Local Supabase + dev server | E2E run | ✓ (per project memory: -gsd repo runs E2E clean via host Vite + local Supabase, ~95/0) | — | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

> nyquist_validation is not set to `false` in `.planning/config.json` (key absent → treated as enabled). Section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (unit/regression) + Playwright (E2E final trust) |
| Config file | `apps/frontend` workspace vitest config; `tests/playwright.config.ts` (E2E) |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` (or `cd apps/frontend && yarn test:unit`) |
| Full suite command | `yarn test:e2e` (root; `playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RUNES-05 / Bug 2 | explicit `null` terms reaches backend; `undefined` skipped; string path unchanged | unit | `yarn workspace @openvaa/frontend test:unit -- candidateUserDataState` | ✅ extend `candidateUserDataState.svelte.test.ts` (add Test 5 + Test 6) |
| RUNES-05 / Bug 1 | `getApplicableQuestions` called with `entityType` in `questionBlocks` blocks path | unit | `yarn workspace @openvaa/frontend test:unit -- candidateContext` | ❌ Wave 0 — NEW `candidateContext.svelte.test.ts` |
| RUNES-01 | each migrated lifecycle site behavior-neutral (per-site) | E2E (relevant spec) | `yarn test:e2e` (targeted spec per migrated site) | ✅ existing E2E suite |
| RUNES-02 | reactive-`let`→`$state` behavior-neutral | unit + E2E | `yarn workspace @openvaa/frontend test:unit` + `yarn test:e2e` | ✅ existing suites |
| All (criterion 4) | no net-new svelte-check errors over baseline | static gate | `yarn workspace @openvaa/frontend check` | ✅ (baseline below) |

### Sampling Rate
- **Per task commit (D-06 atomic commits):** `yarn workspace @openvaa/frontend test:unit` (fast) + `yarn workspace @openvaa/frontend check` for any touched file.
- **Per requirement:** the requirement's mapped test green.
- **Phase gate (D-03):** build green + full unit suite green + svelte-check ≤ baseline (151 errors / 1 warning) + **one full E2E suite run green** (cardinal rule — "did not run" counts as failure).

### svelte-check Baseline (captured 2026-06-17, clean working tree at phase start)
```
COMPLETED 2086 FILES  151 ERRORS  1 WARNINGS  30 FILES_WITH_PROBLEMS
```
[VERIFIED: ran `yarn workspace @openvaa/frontend check` on the phase-start tree.] All 151 errors are pre-existing `qs` ambient-declaration (TS7016) + admin-jobs `+server.ts` cookies/fetch type-drift + a few `Type 'string' is not assignable to type 'number'` route errors — **all deferred to other phases (TYPE-01/TYPE-02), none in this phase's edit surface.** Criterion 4 = "no net-new errors over the working baseline" → **error count must remain ≤ 151** after migration. Re-measure with the identical command on the same tree state (Pitfall 3).

### Wave 0 Gaps
- [ ] `candidateContext.svelte.test.ts` — NEW file; covers RUNES-05 Bug 1 (`entityType` in blocks path). Confirm the construction/test seam (A2) before writing.
- [ ] Capture & pin the svelte-check baseline (151/1) as a phase artifact before any edit.
- [ ] (No framework install needed — vitest + Playwright already present.)

## Security Domain

> `security_enforcement` is not set in `.planning/config.json` (treated as enabled by default). However, this phase is a **behavior-neutral idiom migration** with **no changes to authentication, session management, access control, input-validation surface, or cryptography**. Bug 2 touches a save payload but only changes *which existing tri-state value* (an already-validated terms timestamp / null) is forwarded — no new input surface, no new trust boundary, no auth/crypto change.

**Applicable ASVS categories: NONE introduced or modified by this phase.** The existing controls (Supabase Auth PKCE cookies, Edge-Function authorization, parameterized RPC writes) are untouched. No STRIDE threat pattern is newly opened. **No security work required for this phase.** The only adjacent concern — that Bug 2 forwards an explicit `null` to the backend — is a *type-faithfulness* change validated by the regression test, not a security-relevant data-exposure change (the value is the candidate's own terms-acceptance state, already within their authorization scope).

## Sources

### Primary (HIGH confidence)
- Codebase reads (VERIFIED this session): `candidateContext.svelte.ts:355-390,565`; `candidateUserDataState.svelte.ts:55-60,140-163,215-294`; `candidateUserDataState.svelte.test.ts` (full); all 25 lifecycle call sites in their source context; `apps/frontend/package.json` scripts; `yarn.lock` svelte pin; root `package.json` test:e2e.
- `yarn workspace @openvaa/frontend check` run — baseline 151 errors / 1 warning.
- CLAUDE.md "Context Destructuring Rule (Svelte 5)" + "Svelte Warning-Accepted Format" (project conventions, non-negotiable).
- `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` (`untrack()` invariant; SSR caveat for `$effect`; destructure-trap paradigm-preserving).

### Secondary (MEDIUM confidence)
- https://svelte.dev/docs/svelte/lifecycle-hooks (CITED) — `onMount` does not run server-side; `onDestroy` is the only lifecycle hook that runs in a server-side component; `$effect` is the recommended modern replacement where reactive-equivalent.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Lifecycle classification (RUNES-01): HIGH — every site read in source context; dispositions grounded in code + existing in-line rationale comments.
- Reactive-`let` (RUNES-02): MEDIUM — method is solid; exact MIGRATE set assumed-small pending a planning-time grep (A1).
- Bug fixes (RUNES-05): HIGH — both bugs confirmed at predicted line numbers against live source; diffs are minimal and behavior-neutrality is provable for the string path.
- Verification gate (D-03): HIGH — commands verified, svelte-check baseline captured.

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (stable; svelte-check baseline valid only against the phase-start tree — re-measure if other phases land first).

## RESEARCH COMPLETE
