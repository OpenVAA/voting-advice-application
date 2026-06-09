---
spike: 018
name: readwrite-split-producer-inputs
type: standard
validates: "Given survey/trackingService producers receiving inputs as bare reactive getters instead of ReactiveHandle<T>.current objects, when appSettings changes, then producer $derived outputs recompute AND zero .current reads remain for the Phase-103 codemod to choke on"
verdict: PARTIAL
related: [017, 009]
tags: [svelte5, runes, producer, survey, tracking, codemod, readwrite-split, phase-103]
---

# Spike 018: producer-internal input reads under the read/write split

## What This Validates

GIVEN the `survey` / `trackingService` producers receive their `appSettings` /
`userPreferences` / `sessionId` inputs as bare reactive getters rather than
`ReactiveHandle<T> = { readonly current: T }` objects,
WHEN the source settings change,
THEN producer `$derived` outputs recompute AND there are zero `.current` reads
left for the Phase-103 codemod's PASS 1 regex to collide with (finding #2).

## Background — Phase-103 finding #2

Production producers read their inputs via `.current`:
- `survey.svelte.ts:23-24` — `appSettings.current.survey?.linkTemplate`, `sessionId.current`
- `trackingService.svelte.ts:88-89` — `appSettings.current.analytics.trackEvents`, `userPreferences.current...`

The Phase-103 codemod PASS 1 is literally `/\b(appSettings)\.current\b/g`. It
cannot distinguish a FOLDED CONTEXT MEMBER named `appSettings` (correct to fold)
from a PRODUCER INPUT PARAMETER named `appSettings` typed `ReactiveHandle<T>`
(folding breaks it). Same identifier, opposite correct treatment → the codemod
rewrites the producer reads and breaks the build. The dry-run proves 5 such sites
across the two files.

## How to Run

```bash
cd apps/frontend
yarn vitest run src/lib/contexts/_spikes-017-019/018-readwrite-split-producer-inputs.spike.svelte.test.ts
```

4 tests, <1s.

## What to Expect

- **Test 1 (bare value — the naive "just pass the value"):** the producer captures
  a snapshot at construction; mutating the source afterwards does NOT propagate.
  `producer.enabled` stays `false`. **Proves you cannot pass a bare reactive read
  across a plain function-call boundary** — eager evaluation freezes it.
- **Test 2 (getter-function input `() => T`):** the producer reads `appSettings()`
  inside its `$derived` → recomputes `false → true` on mutation. Reactive. AND the
  producer source contains no `.current` token.
- **Test 3 (status-quo `.current` handle):** equally reactive (`false → true`) —
  but the source contains `.current`, the exact token the codemod collides with.
- **Test 4 (codemod-collision check):** the Phase-103 PASS 1 regex
  `/\bappSettings\.current\b/` matches Approach 3's source and does NOT match
  Approach 2's source.

## Investigation Trail

1. **Reframed the claim before coding.** The original idea framed producer reads
   as a context-shape problem the read/write split would dissolve. But producers
   receive inputs via *function parameters*, not via the context object — so the
   context's bare-getter shape can't touch them. The real question is narrower:
   *can a producer take a reactive input without a `.current`-spelled read?*
2. **Three approaches, head-to-head.** bare value (Approach 1), getter-function
   (Approach 2), `ReactiveHandle.current` (Approach 3). Reactivity measured by a
   recording `$effect` over the producer's `$derived` output across a mutation.
3. **Compile snag (fixed):** `$state(...)` is only legal as a declaration
   initializer — the first draft reassigned a hoisted `let settings`. Moved the
   `$state` to test-scope initializer form; mutated nested fields from the body
   (Svelte's deep proxy tracks nested mutation). Matches the 017 / PoC pattern.
4. **Result on first clean run:** Approach 1 frozen (non-reactive), Approaches 2
   and 3 both reactive and equivalent. The discriminator between 2 and 3 is purely
   the source spelling vs. the codemod regex.

## Results

**VERDICT: PARTIAL.**

The read/write split does **NOT** eliminate the producer-internal input read:

- **A reactive value cannot cross a function-call boundary "bare."** Reading it
  eagerly snapshots (Approach 1). The producer must read through *some* accessor —
  a getter function `input()`, a `{ current }` handle, or any getter object. There
  is no shape where the producer holds a bare reactive value and stays reactive.

But it **CAN** dissolve Phase-103 finding #2 — by *spelling*, not by removal:

- Switching the producer-input convention from `ReactiveHandle<T>.current` to a
  **getter function `() => T`** keeps reactivity identical (Test 2 ≡ Test 3) while
  removing the `.current` token (Test 4). The codemod's `/\b…\.current\b/` regex no
  longer sees the producer reads, so the LM-1-widened `lib/contexts/**/*.svelte.ts`
  glob stops colliding with them.

### Implication for the broader idea

- **017's win (eliminate `.instance`) is real and clean. 018's "eliminate producer
  reads" is not achievable** — the reads are intrinsic to reactive function inputs.
- The *practical* Phase-103 relevance: finding #2 doesn't require the full
  read/write-split redesign to fix. The minimal fix is either (a) a read-pass
  exclude for the two producer files (the option-1 fix already on the table), or
  (b) migrating producer inputs to a getter-function spelling so the regex can't
  see them. (a) is smaller and lands now; (b) is a convention change worth folding
  into the larger refactor if it happens, but it is NOT a prerequisite.

### Surprise

- Approaches 2 and 3 are reactively *indistinguishable* — both are "call a getter
  in a tracking scope." `.current` was never doing anything reactive that `()`
  couldn't; its only distinguishing property turns out to be that it shares a token
  with the context-fold codemod. The "intricacy" finding #2 exposes is a naming
  collision, not a reactivity-model problem.
