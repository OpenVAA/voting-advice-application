---
spike: 020
name: class-context-core
type: standard
validates: "Given a context re-expressed as a Svelte 5 class with $state/$derived fields, when consumers read fields off the instance, then Groups A (wholesale-reassigned objects), B (primitives), D ($derived), G (delegation) become plain fields/getters with NO { current } handle — while methods (E) require arrow-function fields to survive detach and the destructure trap (019) survives unchanged"
verdict: VALIDATED
related: [017, 019, 007]
tags: [svelte5, runes, class, context, destructure-trap, this-binding, class-conversion]
---

# Spike 020: class-as-context core — Groups A, B, D, E, G + the trap

## What This Validates

GIVEN each context becomes a `class` with `$state`/`$derived` fields (the documented
Svelte 5 idiom: *"use classes with $state fields to share reactivity between
components, instead of using stores"*),
WHEN consumers read members off the instance,
THEN the audit's mechanical groups collapse as follows — and two disciplines survive.

## How to Run

```bash
cd apps/frontend
yarn vitest run src/lib/contexts/_spikes-020-class-conversion/020-class-core.spike.svelte.test.ts
```

6 tests, <10ms.

## Results — VALIDATED

| Group | Member shape | Class outcome |
|-------|-------------|---------------|
| **A** wholesale-reassigned object/array | `settings = $state({...})`, written `this.settings = {...}` | **Reactive via `instance.settings` with NO `{ current }` handle.** The `$state` field compiles to a prototype getter/setter; a bare property read inside a tracking scope takes the dependency, a reassignment notifies. This is the win the audit predicted: the handle existed only because a reassigned **`let`** goes stale — a reassigned **field** does not. |
| **B** primitive | `appType = $state('voter')` | Plain field; reactive via `instance.appType`. Drives a `$derived` field correctly. |
| **D** derived projection | `shouldTrack = $derived.by(() => …this.x…)` | `$derived` **class field**. 1:1 mapping, reads cleanest. |
| **E** method | regular `setX(){…}` vs arrow `setX = () => {…}` | **THE caveat (load-bearing).** A detached regular method (`const { setX } = ctx`, `onclick={ctx.setX}`) loses `this` → throws `TypeError`. An **arrow-function field** captures `this` at construction → survives detach. Context methods are routinely destructured, so **every method that crosses the context boundary MUST be an arrow field.** |
| **G** delegation | `get isAuthenticated(){ return this.#auth.isAuthenticated }` | Getter delegation forwards a nested class's `$derived` live — the idiomatic replacement for the spread-of-context anti-pattern (CONVENTIONS Anti-Patterns). |

### Two disciplines that survive the class move

1. **The destructure trap (Spike 019) is unchanged.** `const { settings } = ctx`
   invokes the prototype getter ONCE and binds a frozen value; `ctx.settings` updates,
   the destructured local does not. The CLAUDE.md Context Destructuring Rule +
   Phase-103 PASS 3/PASS 4 remain mandatory. Classes neither fix nor worsen the trap —
   a `$state`/`$derived`/`get` field has the same getter-snapshot semantics as today's
   bare getter.
2. **The arrow-field rule is the NEW discipline classes introduce.** Factory functions
   close over their methods, so detach was a non-issue; class methods live on the
   prototype and bind `this` dynamically, so detach breaks them. This is a *net new*
   migration constraint, not present in the current factory shape.

## Implication for "turn each context into a class?"

**YES for Groups A, B, D, E, G** — the conversion is a clear simplification: object
and primitive fields shed their `{ current }` handles, derived members become fields,
delegation becomes getters. The cost is a mechanical discipline (arrow methods) and an
unchanged one (no destructuring). See 021 (Group C localStorage), 022 (Group C
version-bridge), 023 (SSR) for the parts that don't simplify or that add constraints.
