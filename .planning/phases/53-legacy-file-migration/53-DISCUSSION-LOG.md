# Phase 53: Legacy File Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 53-legacy-file-migration
**Areas discussed:** Root layout migration strategy, <svelte:component> replacement, Admin route migration scope

---

## Root Layout Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Full runes rewrite | Convert all patterns at once in one commit. After Phases 50-52, context APIs already $state-based. | ✓ |
| Incremental (props first, then reactivity) | Two commits: props/slot first, reactive blocks second. | |
| You decide | Claude picks based on complexity. | |

**User's choice:** Full runes rewrite (Recommended)
**Notes:** Single pass — export let data → $props(), $: → $derived/$effect, <slot> → {@render children()}.

---

## <svelte:component> Replacement

| Option | Description | Selected |
|--------|-------------|----------|
| Direct component render | Svelte 5 allows <Module.default .../> directly in {#await}. No wrapper needed. | ✓ |
| You decide | Claude picks idiomatic approach. | |

**User's choice:** Direct component render (Recommended)
**Notes:** Clean and idiomatic. Eliminates deprecated <svelte:component> tag.

---

## Admin Route Migration Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Mechanical bulk migration | All admin files follow same pattern. Apply identical runes conversion. | ✓ |
| You decide | Claude handles as straightforward work. | |

**User's choice:** Mechanical bulk migration (Recommended)
**Notes:** No special handling needed — standard SvelteKit pages.

---

## Claude's Discretion

- Root layout $effect structure for Promise.all data loading
- on:hidden event handling for VisibilityChange
- Header, Banner, MaintenancePage, +error conversion details
- PreviewColorContrast.svelte migration

## Deferred Ideas

None.
