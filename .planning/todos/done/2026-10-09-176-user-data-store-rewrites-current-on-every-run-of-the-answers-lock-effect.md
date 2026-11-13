---
created: 2026-10-09T00:00:00.000Z
title: While answers are locked, the contestant user-data store replaces `userData.current` by an equal copy on every entity load
area: frontend / contestant context
severity: minor
source: Phase 176 plan 01's reading of the "Error formatting nomination" line, and the debug session that explained its second line (`.planning/debug/nomination-line-twice-answers-locked.md`)
owner: unassigned
files:
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
---

## Problem

The store's constructor holds an effect that, while `answersLocked` is on, writes an empty draft and empty
staged properties on every run, whether or not there is anything to clear (`draft?.answers.set({})` and
`this.#staged = {}` inside `untrack`). Each write puts a new object into a signal that `userData.current`
is derived from, and `current` is a JSON clone, so every reader of `current` updates once more with equal
data on each entity load under the lock.

Measured in a component test of the real profile page, entity layout, context provider and store
(vitest, head `35f8df68a`): with the lock on, `parseNomination` is called three times for one nomination
where it is called twice with the lock off. Guarding both writes so they are made only when there is
something to clear brings it back to two; guarding either alone does not.

Nothing is remounted, no focus or input state is lost (every field is locked in that state), and no
network read is doubled: every reader of `userData.current` was checked, none is keyed on its objects and
no `{#key}` reads it. Read in code, not measured: one extra `localStorage` write of an empty draft per
entity load under the lock. It is wasted work. It is also what turned one console line into two on the
answers-locked profile.

Not measured in a browser.

## Solution

Guard both writes (clear the draft only when it holds an answer; reset the staged properties only when one
is staged), and add a store-level case that `current` keeps its identity after `init` when answers are
locked and nothing is staged or drafted.

Related, same store, not this defect: `current` returns a new JSON clone on every recomputation, so with
the lock off every staged edit or drafted answer also re-renders every reader of it.

## Update 2026-10-09 — one visible symptom fewer; the write stands (Phase 176 close)

The profile's nominations block, whose second `Error formatting nomination` line under the answers lock was this defect's one visible symptom, was deleted by plan 176-13: the phase's closing run logs the line 0 times. The store's effect is untouched and still replaces `userData.current` by an equal copy on every run while answers are locked. Nothing that Phase 176 built reads the copy in a way that shows: the nominations view and the task state's "has a nomination" follow page data, not the store.

## Resolution

**Closed 2026-10-11** by Phase 177 plan 177-18, at the phase's close (plan 177-21). Owner by operator decision F6 (a): Phase 177.

- **What was done: both writes are guarded.** The effect in the constructor of `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts` clears the draft only when it holds an answer and resets the staged properties only when one is staged, so a run of the effect with nothing to clear writes nothing and `current` is not replaced by an equal copy. Commit `77ec7ba38` (`fix(177-18): the user-data store writes under the answers lock only when there is something to clear`), after the red commit `1b0bbe32a` (`test(177-18): the user-data store keeps its current value under the answers lock when there is nothing to clear`).
- **The store-level case this todo asked for** is `with answers locked and nothing drafted or staged, current stays the object it was when an entity is loaded` in `contestantUserDataState.svelte.test.ts`, beside two cases that hold the other direction: the lock turning on with a drafted answer clears the draft, and with a staged property discards it. Part of the frontend unit suite, green in the phase's closing gate set.

**What was not tested.** The defect was never measured in a browser, and neither is the fix: the evidence is the store's own unit cases. The related observation of this todo, that `current` returns a new JSON clone on every recomputation with the lock off, is unchanged and is not this defect.
