# Phase 60: Layout Runes Migration & Hydration Fix - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 60-layout-runes-migration-hydration-fix
**Areas discussed:** Hydration fix strategy, Root-layout scope, PopupRenderer fate, Regression-verification strategy

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Hydration fix strategy | Which pattern to try FIRST for the protected-layout bug | ✓ |
| Root-layout scope | How far beyond SC-1 syntactic compliance should Phase 60 go | ✓ |
| PopupRenderer fate | Remove (per LAYOUT-03) or retain with documented rationale | ✓ |
| Regression-verification strategy | How to prove no regressions beyond the 2 direct blocked tests | ✓ |

**User's choice:** All four — full discussion surface.

---

## Hydration Fix Strategy

### Q1: Primary strategy for fixing the `$effect + .then()` hydration bug

| Option | Description | Selected |
|--------|-------------|----------|
| `$derived` on resolved loader data | Drop `$effect + .then()` entirely; compute validation via `$derived` from already-awaited loader data. Smallest diff; sidesteps the bug by not creating the microtask. | ✓ |
| Wrapper component pattern | Like PopupRenderer: runes-mode child with onMount + manual subscribe. Proven to work, but adds indirection. | |
| SvelteKit streaming + `{#await}` | Return unawaited promises and let SvelteKit drive reactivity. Reverses the current `await`-everything policy. | |
| File upstream, keep current workarounds | No in-userland fix — ship cleanest-available workaround; close LAYOUT-02 as blocked-by-upstream. | |

**User's choice:** `$derived` on resolved loader data (Recommended).
**Notes:** Scout insight drove this — both loaders `await` everything before returning, so the `.then()` in `.svelte` is pure ceremony creating a hydration-unsafe microtask.

### Q2: Fallback if primary doesn't unblock the registration tests

| Option | Description | Selected |
|--------|-------------|----------|
| Try wrapper component pattern | Existence proof (PopupRenderer). Solves reactivity via onMount + subscribe rather than $effect. | ✓ |
| Try streaming + `{#await}` | Distinct primitive to try after $derived and wrapper both fail. | |
| Time-box and ship best-effort + file upstream | Cap attempts; keep existing workarounds; defer LAYOUT-02 to post-v2.6. | |
| Pause phase 60 and reassess | Stop and re-evaluate v2.6 scope without LAYOUT-02. | |

**User's choice:** Try wrapper component pattern next (Recommended).

### Q3: Where does data validation logic live after the refactor

| Option | Description | Selected |
|--------|-------------|----------|
| `$derived` for validation, `$effect` for `$dataRoot` writes | Split pure computation from side-effects; no microtasks in critical path. | ✓ |
| Keep `update()` function, call from `$effect` without `.then()` | Minimal refactor; less idiomatic. | |
| Push validation into the loader | Loader returns typed status union; `.svelte` switches via `$derived`. | |
| Mixed — loader validates shape, `.svelte` validates business rules | Shape in loader; underMaintenance / terms-of-use stay in `.svelte`. | |

**User's choice:** `$derived` for validation, `$effect` for `$dataRoot` writes (Recommended).

### Q4: Upstream Svelte 5 bug filing timing

| Option | Description | Selected |
|--------|-------------|----------|
| After phase 60 completes | File with maximal context — either "we worked around it" or "we couldn't". | ✓ |
| Before attempting fixes | File early; risk under-specification. | |
| Only if no user-land fix works | No filing if $derived approach lands cleanly. | |
| Skip filing | Ship workaround, move on. | |

**User's choice:** After phase 60 completes, regardless of outcome (Recommended).

---

## Root-Layout Scope

### Q1: Refactor root `+layout.svelte`'s `$effect + .then()` pattern?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — apply same $derived fix to root | Consistent idiom across both layouts; removes latent bug source. | ✓ |
| No — root works today, leave it | PopupRenderer + loader awaits handle current production behaviour. | |
| Conditional — only if PopupRenderer removal depends on it | Defer to Area 3 outcome. | |

**User's choice:** Yes — apply same $derived fix to root (Recommended).

### Q2: `fromStore()` bridge retirement in Phase 60?

| Option | Description | Selected |
|--------|-------------|----------|
| Defer to post-v2.6 | PROJECT.md Future flags bridge retirement as separate work; cascades across lib/contexts/app. | ✓ |
| Retire the 4 bridges in root +layout.svelte only | Smaller diff; inconsistent midpoint since context modules still expose stores. | |
| Full bridge retirement across lib/contexts/app | Do it once; significantly expands phase scope. | |

**User's choice:** Defer to post-v2.6 (Recommended).

### Q3: Other root-layout cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Keep scope tight — just the hydration refactor | Phase 60 is already doing enough. | ✓ |
| Consolidate the 4 separate $effect blocks | Optional readability improvement. | |
| Move analytics setup out of +layout.svelte | Optional extraction to dedicated context/module. | |

**User's choice:** Keep scope tight (Recommended).

---

## PopupRenderer Fate

### Q1: Preferred outcome for PopupRenderer post-refactor

| Option | Description | Selected |
|--------|-------------|----------|
| Attempt removal, keep+document if empirically broken | Delete, validate with setTimeout-popup E2E, restore+document if popups break. | ✓ |
| Keep PopupRenderer with documented rationale | Conservative; don't risk popup reactivity. SC-3 accepts this. | |
| Refactor/rename, don't fully remove | Middle ground — keep dedicated component but simplify. | |

**User's choice:** Attempt removal, keep+document if empirically broken (Recommended).
**User's notes:** "Ultimately we want to handle all overlays centrally" — captured as deferred idea (future overlay-architecture milestone), not Phase 60 scope.

### Q2: How to verify removal attempt is safe

| Option | Description | Selected |
|--------|-------------|----------|
| Add E2E test for setTimeout-triggered popup rendering | Current coverage is implicit; dedicated test validates refactor + regression-guards. | ✓ |
| Manual verification only | Faster; no regression guard. | |
| Rely on existing E2E suite | Feedback modal exercises popup infra indirectly. | |

**User's choice:** Add an E2E test for setTimeout-triggered popup rendering (Recommended).

### Q3: Content of retained-rationale comment (if kept)

| Option | Description | Selected |
|--------|-------------|----------|
| Limitation + reproduction + removal conditions | Names specific Svelte 5 behaviour + repro pointer + conditions for future removal. | ✓ |
| Pointer to upstream bug + short summary | Minimal — text + GitHub issue link. | |
| Reference to v2.1 PopupRenderer decision + status | Point to PROJECT.md Key Decisions; minimal in-code detail. | |

**User's choice:** Limitation + reproduction + removal conditions (Recommended).

---

## Regression-Verification Strategy

### Q1: Primary regression gate

| Option | Description | Selected |
|--------|-------------|----------|
| Playwright parity gate against SHA `3c57949c8` | Same methodology as v2.5; delta-rule comparison. | ✓ |
| Per-test comparison against v2.5 final run | More granular; more fragile to intentional cascade shifts. | |
| Hand-picked regression test list | Layout-sensitive specs only; misses unrelated regressions. | |
| Full E2E suite with workers=1 (deterministic) | More expensive; clean pass/fail without flake handling. | |

**User's choice:** Playwright parity gate against SHA `3c57949c8` baseline (Recommended).

### Q2: Carry-forward failure handling

| Option | Description | Selected |
|--------|-------------|----------|
| Don't attempt greening, just hold the line | Phase 60 is layout fixes, not E2E greening; cascade passes are opportunistic. | ✓ |
| Opportunistically pass LAYOUT-02-unblocked tests | Verify and track; don't chase non-self-resolving cascade. | |
| Include cascade-test verification as success condition | Tightens gate; overloads Phase 60 with Phase 63 scope. | |

**User's choice:** Don't attempt greening, just hold the line (Recommended).

### Q3: Unit-test coverage for the new pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Integration-ish: E2E covers the pattern | Bug only manifests in SSR+hydration; E2E is the right level. | ✓ |
| Vitest unit tests for validation $derived logic | Pure validation can be tested without hydration. | |
| Playwright tests for both layouts' hydration states | Higher coverage; more maintenance. | |

**User's choice:** Integration-ish: page-level E2E tests cover the pattern (Recommended).

### Q4: LAYOUT-03 validation approach during execution

| Option | Description | Selected |
|--------|-------------|----------|
| Empirical: build $derived fix, try deletion, observe | Single decision point during execution; no speculation. | ✓ |
| Parallel contingent plans for removal + retention | Planner picks based on empirical result; more overhead. | |
| Keep PopupRenderer unconditionally | Skip removal attempt; defer to later phase. | |

**User's choice:** Empirical: build the $derived fix, try deletion, observe (Recommended).

---

## Claude's Discretion

- Plan boundaries within Phase 60 (single plan vs split per layout vs split per LAYOUT-XX requirement). Planner picks.
- Exact shape of the setTimeout-popup E2E test (D-09). Executor chooses idiomatic fixture patterns.
- Whether the protected layout keeps its existing `layoutState` enum post-refactor, or collapses into separate `$derived` signals. Either is acceptable.
- If the wrapper fallback (D-02) is invoked, exact file placement for any new runes-mode subcomponent.

## Deferred Ideas

- Centralized overlay handling — "ultimately we want to handle all overlays centrally" (user direction). Future milestone.
- `fromStore()` / `toStore()` bridge retirement — PROJECT.md Future; separate refactor effort.
- `$effect` block consolidation in root `+layout.svelte` — optional cleanup.
- Analytics setup extraction to dedicated module — optional cleanup.
- Proactive upstream Svelte 5 filing before execution — D-04 explicitly sequences it after.
- Parallel contingent plans for PopupRenderer — rejected in D-14 in favour of single empirical decision point.
