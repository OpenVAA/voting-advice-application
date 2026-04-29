---
title: Svelte 5 frontend audit sweeps — `bind:*` and `{#key}` usages
priority: medium
created: 2026-04-23
updated: 2026-04-29
resolves_phase: 65
context: Originally surfaced during Phase 58 voter-app UAT (5-section list); sections 1-3 (boolean-question rendering, candidate-result detail boolean handling, category-selection reactivity) were resolved by v2.6 Phase 61 (QUESTION-01/02/03/04). Items 4 and 5 below were added during v2.6 Phase 64 manual smoke (2026-04-28) and remain open as audit sweeps.
---

# Svelte 5 cleanup — `bind:*` and `{#key}` audits

This todo originally tracked five voter-app surfaces. Items 1, 2, and 3
(boolean question rendering, candidate-result boolean match-breakdown,
category selection default + counter reactivity) shipped in v2.6
Phase 61 and are recorded under that phase's plans. Items 4 and 5
remain as durable audit sweeps that surfaced during v2.6 Phase 64
manual smoke.

## 1. Audit and possibly remove all `bind:*` props

Surfaced during Phase 64 manual smoke (2026-04-28). `QuestionChoices.svelte:271`
emitted `binding_property_non_reactive` for `bind:this={inputs[id]}` because
`inputs` was a plain `const` instead of `$state`. Local fix landed; broader
question is whether the codebase has other latent `bind:*` patterns that:

- Bind to non-reactive properties (Svelte 5 warns or silently mis-syncs)
- Use two-way `bind:` where one-way prop + callback would be clearer in
  Svelte 5 idioms
- Could be replaced with `$bindable()` callsite-driven flow at the parent

Goal: sweep `apps/frontend/src/lib/**/*.svelte` for every `bind:` usage,
classify each as keep / migrate / remove, and either fix or document the
rationale to retain.

- **Where to look**: `grep -rn "bind:" apps/frontend/src/lib --include='*.svelte'`
- **Patterns to flag**:
  - `bind:this` on non-`$state` targets (the Phase 64 fix pattern)
  - `bind:value`/`bind:checked` against props NOT declared with `$bindable()`
  - Two-way bindings that flow data UP through 3+ component layers
- **Acceptance**: zero `binding_property_non_reactive` warnings on any
  voter-flow path; documented decision per remaining `bind:*` site.

## 2. Audit and possibly remove all `{#key}` blocks

Surfaced during Phase 64 manual smoke (2026-04-28). `EntityList.svelte:104`
wrapped each card in `{#key item}<EntityCard {...item} />{/key}`. Combined with
the upstream cascade where `filtered.map((e) => ({ entity: e }))` minted fresh
wrapper objects on every URL change, `{#key item}` forced every
`<EntityCard>` (and its `<img>` portrait) to remount on drawer open/close.

After fixing the upstream cascade (appSettingsValue / selectedElections
ref-equality guards), removing the `{#key item}` and the wrapper-cache had
no visible regression — Svelte's positional reuse handled the case fine.
Suggests the original `{#key item}` was a defensive Svelte-5-migration paste
that's now load-bearing for nothing.

Goal: sweep every `{#key …}` use and reclassify each as keep / replace-with-
each-key / remove. Many may be the same defensive pattern.

- **Where to look**: `grep -rn "{#key" apps/frontend/src --include='*.svelte'`
- **Patterns to flag**:
  - `{#key item}` inside `{#each items as item}` — usually replaceable with a
    keyed each `{#each items as item (item.id)}` or removable entirely if the
    template is positional.
  - `{#key url}` / `{#key params.X}` — defensive force-remount on navigation.
    Often unnecessary once upstream reactivity is stable.
  - `{#key derivedTuple}` where the tuple's content rarely changes — measure
    whether the remount is doing useful work.
- **Acceptance**: every retained `{#key}` has an inline justification, or a
  test demonstrating the remount is observable behavior.

## Acceptance

- `bind:*` audit complete (item 1).
- `{#key}` audit complete (item 2).
