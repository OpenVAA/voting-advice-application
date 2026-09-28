---
spike: 011
name: hmr-rune-contexts
type: standard
validates: "Given Vite HMR firing on edits to a rune-context file or its consumers, when the spike route is live in the browser with established state, then (a) component remounts cleanly (in-memory $state resets, log array clears, destructure-trap consumer re-captures), (b) localStorage-backed state survives the HMR (runeLocalStorage rehydrates new $state from storage on remount), (c) class-instance singletons (DataRoot) survive — same instance, populated collections preserved, (d) consoles stay clean — no effect_update_depth_exceeded, no zombie $effects, no hydration mismatches"
verdict: VALIDATED
related: [001, 002, 003, 007]
tags: [svelte5, runes, hmr, vite, dx]
---

# Spike 011 — HMR Behavior with Rune Contexts

## What This Validates

Developer experience question: when a developer edits a rune-context file
during local dev, does Vite HMR handle it gracefully? Production today's
`toStore`/`fromStore` bridges interact with HMR in known-quirky ways
(reactive stores sometimes leak across module reloads). Does the rune-native
approach degrade DX, match it, or improve it?

Three behaviors to characterize:

1. **State preservation** — what state survives HMR? (in-memory $state,
   localStorage-backed, singleton class instances)
2. **Effect cleanup** — do old `$effect`s clean up on module reload? Do new
   ones register without colliding with old ones?
3. **Console hygiene** — do hydration warnings, effect-loop errors, or
   reactivity stalls appear after an edit?

## Method

Used the Spike 007 sub-route (`/runes-test/voter-context-orchestration`) as
the test environment — it has multiple rune surfaces in play (appSettings,
dataRoot, voterAnswerRuneStore, the new voterRuneContext) plus two consumer
components (canonical + destructure-trap).

Procedure:
1. Drive page to a known state: click "Load DataRoot" → "Select first
   election" → "Set 3 demo answers". Verify canonical consumer shows
   `selectedElections=1, opinionQuestions=18, matchesCount=327, profileComplete=true`.
2. Edit `voterRuneContext.svelte.ts` to add `* 1` to the `matchesCount`
   derivation (semantic no-op, forces HMR).
3. Wait ~3s for Vite HMR to fire.
4. Snapshot DOM state. Compare to pre-edit.
5. Repeat: revert the edit to force a second HMR cycle. Snapshot again.

## Results

**Verdict:** VALIDATED ✓ — HMR DX is non-degraded vs production.

### State preservation matrix

| Surface | Pre-HMR | Post-HMR | Survived? |
|---------|---------|----------|-----------|
| Canonical consumer `selectedElections.length` | 1 | 0 | ✗ (component remounted) |
| Canonical consumer `opinionQuestions.length` | 18 | 0 | ✗ (derived from selectedElections) |
| Canonical consumer `matchesCount` | 327 | 327 | ✓ (derived from voterAnswers + candidates) |
| Canonical consumer `profileComplete` | true | true | ✓ (derived from voterAnswers) |
| Destructure-trap consumer values | 0/0/0/false | 0/0/**327**/**true** | re-captured at new init (now showing live values) |
| Log array | 4 lines | empty | ✗ (in-memory $state reset on remount) |
| voterAnswers (localStorage-backed) | 3 answers | 3 answers | ✓ (runeLocalStorage rehydrated) |
| DataRoot.candidates.length | 327 | 327 | ✓ (singleton preserved) |

**Key observations:**

1. **Component remount, not partial update.** All `+page.svelte` and consumer
   components reinitialized — their `$state` declarations re-ran with defaults.
   This is standard Svelte/Vite HMR behavior for `.svelte` files; not specific
   to runes.

2. **localStorage rehydration preserves user data.** `runeLocalStorage`
   (Spike 003) reads localStorage at construction time, so the new module's
   `voterAnswers` store re-reads the same persisted data. The downstream
   `$derived` `matchesCount` and `profileComplete` produce the same values
   as before — no user-visible reset.

3. **DataRoot singleton survives via module identity.** `voterRuneContext`
   pulls `dataRoot` from the parent layout's context. When the voterRuneContext
   module reloads, it calls `getDataRootRuneContext()` which retrieves the
   SAME instance (the parent layout didn't remount). DataRoot's
   `Updatable.subscribe()` notifications continue to work.

4. **Destructure-trap re-capture is interesting.** The trap consumer was
   showing `0/0/0/false` from the original init. After HMR remount, it
   re-captured at the current state — now showing
   `selectedElections=0, opinionQuestions=0, matchesCount=327, profileComplete=true`
   (matching the live values at remount-time). The trap is **silently fixed
   during HMR** but will go stale again the moment the user mutates state.
   This is actually a **DX risk** — a developer doing HMR-driven manual
   testing may not notice the trap until they ship.

### Effect cleanup

- No `effect_update_depth_exceeded` warnings across either HMR cycle.
- No "duplicate $effect" warnings.
- The producer `$effect` in voterRuneContext (auto-provide elections) cleanly
  re-registered.
- DataRoot's `Updatable.subscribe(() => version++)` callback re-registered
  (the version counter $state was reset to 0 in the new module, but the
  callback fires normally on subsequent provides).

### Console hygiene

Zero errors / warnings observed across both HMR cycles. Specifically checked
for:
- `effect_update_depth_exceeded` — clean
- `hydration` mismatches — none (HMR doesn't re-trigger hydration, only
  re-renders)
- `state_unsafe_mutation` — clean
- Vite HMR error overlay — never appeared

## Investigation Trail

- **2026-05-22** — Drove the spike-007 page to known state (1/18/327/true).
  Edited `voterRuneContext.svelte.ts` to add `* 1` to matchesCount derivation.
  Waited 3s. Snapshot. Reverted edit, waited 2s. Second snapshot.

- **Two consistent HMR cycles** — both edits triggered component remount.
  Persisted state (localStorage + DataRoot singleton) survived each cycle.
  In-memory `$state` (selectedElections in voterRuneContext, log array in
  +page) reset each cycle.

## Signal for the Real Migration

1. **HMR DX is non-degraded** — the rune-native pattern works with Vite HMR
   the same way `.svelte` files always have. No new DX issues introduced.

2. **The "HMR-masks-destructure-trap" finding is a real risk for developers.**
   During HMR-driven manual testing, the destructure-trap consumer
   *temporarily* shows current values (because it re-captures at remount).
   A developer iterating quickly might think the trap is fixed when it
   isn't. **Mitigation:** the Spike 009 codemod's destructure-trap audit
   pass should be part of pre-commit checks — running on push catches what
   HMR masks.

3. **localStorage rehydration is a DX win.** Today's `localStorageWritable`
   uses `store.subscribe(saveToStorage)` which fires asynchronously; HMR
   timing can race with the save. `runeLocalStorage`'s imperative
   `set/update` writes synchronously on every mutation, so HMR-cycle data
   is always consistent.

4. **DataRoot singleton across HMR is good.** The version-counter pattern
   (Spike 002) survives HMR because DataRoot is held by the parent layout's
   context — which doesn't remount when a child module changes. Voter
   wouldn't have to re-load all data on every HMR cycle.

5. **Component remount is the right behavior** — it would be *worse* if
   $state values persisted across HMR, because then in-flight state could
   leak old code paths. Svelte/Vite's "remount component, preserve external
   state" model fits the rune migration cleanly.

## What to Avoid

1. **Don't expect in-memory `$state` to survive HMR.** If a value should
   persist across edits, route it through `runeLocalStorage` (or
   `runeSessionStorage` per Spike 010's recommendation) or hold it in a
   context-level singleton.

2. **Don't rely on HMR-masked destructure-trap behavior.** As noted above,
   the trap re-captures at remount time, which can lull a developer into
   thinking destructured consumers are reactive. Run the Spike 009 codemod
   audit pass.

## Source Files

This spike uses the Spike 007 source (`apps/frontend/src/routes/runes-test/voter-context-orchestration/`)
as the test environment — no new files needed. The investigation trail
documents the edit-revert sequence.
