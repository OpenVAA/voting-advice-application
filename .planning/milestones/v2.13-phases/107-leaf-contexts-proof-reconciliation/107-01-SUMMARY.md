---
phase: 107-leaf-contexts-proof-reconciliation
plan: 01
subsystem: ui
tags: [svelte5, runes, context-as-class, auth, derived, vitest]

# Dependency graph
requires:
  - phase: 106-class-conversion-helpers
    provides: "Phase 106 leaf-class idiom (VideoController public $state fields + arrow method fields; PopupStore private $state/$derived + getter) — copied as the canonical class shape"
provides:
  - "class AuthContextProvider implements AuthContext (Svelte 5 leaf class instantiated in initAuthContext())"
  - "isAuthenticated as a private #$derived field exposed via an own-enumerable constructor accessor (spread-safe over { ...authContext })"
  - "four DataWriter wrappers (logout/requestForgotPasswordEmail/resetPassword/setPassword) as §18 arrow-function fields"
  - "headless authContext.svelte.test.ts proving $derived reactivity + arrow-field detach survival + spread-safety"
  - "verified fact: Svelte 5 compiles $state/$derived CLASS fields to private backing + PROTOTYPE accessors (NOT own-enumerable, dropped by object spread)"
affects: [108-app-producers, 109-appcontext-orchestrator-spread-fix, 110-voter, 111-candidate, 112-admin, 113-flatten]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Leaf context-as-class: class XContextProvider implements XContext instantiated in initXContext(); CONTEXT_KEY symbol + get/init factory guards byte-identical"
    - "Spread-safe reactive member: private #field = $derived(...) + own-enumerable accessor assigned via Object.defineProperty in constructor (NOT a bare $derived class field) when a consumer spreads the instance"
    - "Headless *.svelte.test.ts: vi.hoisted holders + vi.mock('$app/state') with a $state-backed reader wired inside $effect.root to drive $derived re-evaluation"

key-files:
  created:
    - apps/frontend/src/lib/contexts/auth/authContext.svelte.test.ts
  modified:
    - apps/frontend/src/lib/contexts/auth/authContext.svelte.ts

key-decisions:
  - "isAuthenticated is a private #$derived + own-enumerable constructor accessor, NOT a bare public $derived field — a bare $derived/$state class field compiles to a prototype accessor that the candidateContext { ...authContext } spread silently drops (headlessly verified). Matches dataContext's constructor-assigned own-property spread-safety precedent."
  - "Preserved the original snapshot-on-spread behavior exactly (own-enumerable getter copied as a value by spread) to keep candidateContext/adminContext byte-identical; the live spread-of-context fix is deferred to Phase 109 per the milestone roadmap."
  - "Exported the class (export class AuthContextProvider) for direct test instantiation — additive, leaves the export * barrel surface, AuthContext type, and both consumers byte-identical."

patterns-established:
  - "Spread-safety gate for context-as-class: before choosing a bare $derived/$state field, check whether an orchestrator spreads the instance; if so, expose the member as an own-enumerable constructor accessor over a private #$derived backing field."

requirements-completed: [CLASS-02]

# Metrics
duration: 8min
completed: 2026-06-12
---

# Phase 107 Plan 01: authContext class conversion + proof reconciliation Summary

**Converted authContext from a factory-closure object literal into a Svelte 5 `class AuthContextProvider implements AuthContext`, with `isAuthenticated` as a spread-safe own-enumerable accessor over a private `#$derived` and the four DataWriter wrappers as arrow-function fields, proven by a new headless regression test.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-12T21:35:32Z
- **Completed:** 2026-06-12T21:43:19Z
- **Tasks:** 2
- **Files modified:** 2 (1 converted, 1 created)

## Accomplishments
- `authContext.svelte.ts` is now a `class AuthContextProvider implements AuthContext` instantiated in `initAuthContext()` via `return setContext<AuthContext>(CONTEXT_KEY, new AuthContextProvider())`.
- The four DataWriter wrappers are §18 arrow-function fields with verbatim bodies (incl. `authToken: ''` cookie-auth stub) — survive `const { logout } = authContext` detach.
- `isAuthenticated` is reactive when read as `instance.isAuthenticated` AND survives the candidateContext `{ ...authContext }` spread (own-enumerable accessor).
- New headless `authContext.svelte.test.ts` (4 cases) proves $derived reactivity, arrow-field detach survival, and spread-safety.
- Type file, barrel, and both consumers (candidateContext, adminContext) are byte-identical; build + `src/lib/contexts/` vitest (96 tests) + svelte-check all green with zero new errors.

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert authContext factory closure to class AuthContextProvider** - `f35efc59e` (refactor)
2. **Task 2: Headless regression test + spread-safety fix** - `295421a13` (test)

_Note: Task 1 is a `tdd="true"` task, but per the plan's task split the regression test was authored in Task 2 (the dedicated test-authoring task); the spread-safety correction discovered while writing the test was folded into Task 2's commit since it is what makes the test pass correctly._

## Files Created/Modified
- `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` - Converted to `class AuthContextProvider`; private `#isAuthenticated = $derived(!!page.data.session)` + own-enumerable constructor accessor; four arrow-field DataWriter wrappers; factory/symbol/guards byte-identical.
- `apps/frontend/src/lib/contexts/auth/authContext.svelte.test.ts` - New headless `*.svelte.test.ts` (4 cases) for the converted class.

## Decisions Made
- **isAuthenticated shape (deviation from plan's literal mechanism):** The plan specified a bare public `$derived` field on the assumption it would be an own-enumerable property surviving the candidateContext spread. Headless verification disproved this: Svelte 5 compiles `$state`/`$derived` *class fields* to private backing fields + **prototype** accessors, which are NOT own-enumerable and are dropped by `{ ...instance }`. The original object-literal `get isAuthenticated()` WAS own-enumerable (spread copied it as a snapshot — the documented spread-of-context trap, CONVENTIONS Spike 009/019). To keep consumers byte-identical until the Phase 109 spread-of-context fix, `isAuthenticated` is exposed as an own-enumerable accessor assigned in the constructor over a private `#$derived` backing field — the canonical `dataContext` spread-safety precedent (PATTERNS line 138).
- **Class export:** added `export class AuthContextProvider` for direct test instantiation (plan's preferred option a). Additive; barrel/type/consumers unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] isAuthenticated bare `$derived` field would break candidateContext spread-survival**
- **Found during:** Task 2 (authoring the spread-safety test case)
- **Issue:** The plan's specified `isAuthenticated = $derived(!!page.data.session)` bare class field is NOT own-enumerable in compiled Svelte 5 output (verified headlessly: `Object.keys(instance)` excludes it; `{ ...instance }` drops it). This silently breaks the candidateContext `{ ...authContext }` spread contract (line ~367) — `isAuthenticated` would vanish from the candidate context, strictly worse than the original snapshot behavior.
- **Fix:** Backed `isAuthenticated` with a private `#isAuthenticated = $derived(...)` and installed an own-enumerable getter in the constructor via `Object.defineProperty` (dataContext own-property precedent). This reproduces the original own-enumerable, snapshot-on-spread, live-on-instance-read semantics exactly.
- **Files modified:** apps/frontend/src/lib/contexts/auth/authContext.svelte.ts
- **Verification:** Spread test case asserts all five members are `in spread`; reactivity test asserts `instance.isAuthenticated` re-evaluates; consumers byte-identical; build + vitest + svelte-check green.
- **Committed in:** `295421a13` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — corrected mechanism to preserve consumer byte-identity).
**Impact on plan:** The deviation corrects a latent spread-survival bug in the plan's literal mechanism while fully satisfying every must-have (class, $derived over page.data.session, spread-survival, arrow-field detach survival, byte-identical consumers, all gates green). No scope creep. The plan's `isAuthenticated = $derived(...)` field-form acceptance grep no longer matches by design; the `$derived(...page.data.session)` key_link pattern and all other ACs still match.

## Issues Encountered
- **vi.mock hoisting:** initial test referenced top-level `writer`/`session` from inside hoisted `vi.mock` factories (ReferenceError). Resolved with `vi.hoisted`.
- **Non-reactive mock:** a plain mutable holder for `page.data.session` did not drive the `$derived` (runes only track reactive sources). Resolved by creating a `$state` cell inside `$effect.root` and wiring it into the mock's reader via a `setSession` setter.

## Next Phase Readiness
- Leaf-class idiom proven on the lowest-blast-radius context, with the **spread-safety gate** documented for the rest of the milestone (110/111/112 orchestrators + the 109 spread-of-context fix MUST treat reactive members spread by a consumer as own-enumerable accessors, not bare `$derived`/`$state` fields).
- Phase 109 owns the candidateContext/adminContext spread-of-context fix (re-declare the getters); this plan deliberately preserved the snapshot-on-spread behavior to stay byte-identical.
- No blockers. Pre-existing svelte-check errors in authContext (SupabaseDataWriter vs Promise<UniversalDataWriter> typing on `prepareDataWriter` args, 4×) are unchanged and out of scope (present on clean checkout; total error count 151 → 151).

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/contexts/auth/authContext.svelte.ts
- FOUND: apps/frontend/src/lib/contexts/auth/authContext.svelte.test.ts
- FOUND: .planning/phases/107-leaf-contexts-proof-reconciliation/107-01-SUMMARY.md
- FOUND commit: f35efc59e
- FOUND commit: 295421a13

---
*Phase: 107-leaf-contexts-proof-reconciliation*
*Completed: 2026-06-12*
