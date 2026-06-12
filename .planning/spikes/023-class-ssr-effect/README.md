---
spike: 023
name: class-ssr-effect
type: standard
validates: "Given a context-as-class, when its merged/derived initial value is sourced from $effect vs a synchronous field initializer vs a $derived field, then only the latter two are SSR-correct ($effect never runs on the server) — AND a class with $effect in its constructor cannot even be constructed outside an effect context (effect_orphan)"
verdict: VALIDATED
related: [008, 020, 021]
tags: [svelte5, runes, class, ssr, effect, hydration, class-conversion]
---

# Spike 023: the SSR `$effect` hazard in the class shape

## What This Validates

GIVEN a context-as-class whose merged/derived initial value can be sourced three ways,
WHEN it is read at server-render time (before any effect flush),
THEN only the synchronous field initializer and the `$derived` field are SSR-correct —
`$effect` never runs on the server (Svelte docs + CONVENTIONS §7) — AND a class with
`$effect` in its constructor cannot even be constructed outside an effect context.

## How to Run

```bash
cd apps/frontend
yarn vitest run src/lib/contexts/_spikes-020-class-conversion/023-class-ssr-effect.spike.svelte.test.ts
```

4 tests, <10ms. Rune-level SSR model: "read the field before any effect flush" == the
server render (effects never flush server-side); "after flushSync" == client hydration.

## Results — VALIDATED

| Class shape | Server-render value (no flush) | Verdict |
|-------------|-------------------------------|---------|
| `settings = $state(pureMerge(BASE, DB))` (sync field initializer, CONVENTIONS §7) | **merged (correct)** | SSR-SAFE |
| `settings = $derived.by(() => pureMerge(BASE, this.#db))` ($derived field) | **merged (correct)** — `$derived` computes on read | SSR-SAFE |
| `settings = $state(BASE)` + `$effect(() => settings = merge(...))` in constructor | **BASE (wrong)** — merge appears only after client flush → flash / hydration mismatch | SSR-BROKEN |

### Sharper finding — `effect_orphan` at construction

A class that calls `$effect` in its constructor **throws `effect_orphan` when
constructed outside an effect context** (module scope, an `initXxxContext()` factory,
or SSR setup that isn't inside a component/`$effect.root`). So an `$effect`-merge isn't
merely *wrong* server-side — depending on where the class is instantiated it may be
*impossible to construct at all*. This is a hard, compile-into-runtime signal that
merge/initialization logic belongs in **field initializers** or **`$derived` fields**,
never `$effect`.

## Implication for the class migration

The CONVENTIONS §7 synchronous-init rule **relocates, it does not relax**, under classes:

- Any field whose initial value depends on `page.data` / `load()` output must be set in
  a **synchronous field initializer** (read `page.data` at construction) or be a
  **`$derived` field** over a reactive source.
- `$effect` in a context class is reserved for *post-construction reactions* (e.g. the
  production appContext's post-navigation re-merge), and even then the class must be
  instantiated inside a component/effect context — which `setContext(KEY, new Ctx())`
  in a component `<script>` satisfies, but a bare factory or module singleton does not.
- This pairs with 021: persistence and merge both stay off `$effect`. The class shape
  makes the rule enforceable (the `effect_orphan` throw) rather than silent.
