# Phase 27: Candidate Route Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 27-candidate-route-migration
**Areas discussed:** Lifecycle + Context, Complex reactive chains, Auth flow side effects

---

## Lifecycle + Context

### getLayoutContext(onDestroy) handling

| Option | Description | Selected |
|--------|-------------|----------|
| Keep onDestroy as-is (Recommended) | Don't convert getLayoutContext(onDestroy) calls. The onDestroy import stays for these 13 files. Context system rewrite is deferred. | ✓ |
| Wrap in $effect | Replace onDestroy(fn) with $effect cleanup at call site. Requires changing the context API signature. | |

**User's choice:** Keep onDestroy as-is
**Notes:** Context system is explicitly deferred scope.

### Standalone onMount conversion

| Option | Description | Selected |
|--------|-------------|----------|
| Convert to $effect (Recommended) | onMount(() => { ... }) → $effect(() => { ... }). Simple init-once effects not tied to context system. | ✓ |
| Keep onMount as-is | Leave unchanged — still works in runes mode. | |

**User's choice:** Convert to $effect

### Standalone onDestroy conversion

| Option | Description | Selected |
|--------|-------------|----------|
| Convert standalone onDestroy (Recommended) | Standalone onDestroy → $effect with cleanup return. Only keep onDestroy for getLayoutContext calls. | ✓ |
| Keep all onDestroy as-is | Don't touch any onDestroy for consistency. | |

**User's choice:** Convert standalone onDestroy

### Event directive pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Same pattern (Recommended) | on:click → onclick, on:submit|preventDefault → onsubmit with e.preventDefault(). Consistent with v1.3. | ✓ |
| You decide | Claude handles event conversion details. | |

**User's choice:** Same pattern as Phase 22/23

---

## Complex Reactive Chains

### Split strategy for interdependent $: chains

| Option | Description | Selected |
|--------|-------------|----------|
| Same split strategy (Recommended) | Pure derivations → $derived, multi-statement → $derived.by(), side effects → $effect. Same Phase 24 rules. | ✓ |
| You decide | Claude determines best rune case-by-case. | |

**User's choice:** Same split strategy

### Mixed block splitting ([questionId] big $: block)

| Option | Description | Selected |
|--------|-------------|----------|
| Split: derive + effect (Recommended) | Extract question/customData/nextQuestionId as $derived.by(), video.load() in separate $effect. | ✓ |
| Single $effect | Convert whole block to $effect since it has side effects. | |
| You decide | Claude determines best split. | |

**User's choice:** Split: derive + effect

### if/else branching chains

| Option | Description | Selected |
|--------|-------------|----------|
| $derived.by() (Recommended) | Wrap if/else in $derived.by(() => { return { submitRoute, submitLabel } }). Pure computation. | ✓ |
| Keep as two $derived | Split into separate $derived() calls, duplicating condition. | |

**User's choice:** $derived.by()

---

## Auth Flow Side Effects

### OIDC callback pattern

| Option | Description | Selected |
|--------|-------------|----------|
| $effect (Recommended) | Whole block is a side effect watching URL params. Single $effect. | ✓ |
| Split: $derived + $effect | Derive authorizationCode, act in $effect. Over-engineered for 2 lines. | |
| You decide | Claude determines approach. | |

**User's choice:** $effect

### Registration key watcher

| Option | Description | Selected |
|--------|-------------|----------|
| $effect (Recommended) | Convert to $effect watching registrationKey. Side effect of input changes. | ✓ |
| You decide | Claude handles registration form patterns. | |

**User's choice:** $effect

### Async data-loading layout

| Option | Description | Selected |
|--------|-------------|----------|
| Same as Phase 24 (Recommended) | $effect for async block, $state() for ready/error. Same pattern as voter layout. | ✓ |
| You decide | Claude determines async layout approach. | |

**User's choice:** Same as Phase 24

---

## Claude's Discretion

- Migration ordering and plan batching across 25 files
- Exact cleanup of redundant imports after migration
- Edge cases in $effect cleanup/teardown
- Batching strategy (by route group vs by complexity)

## Deferred Ideas

- Context system rewrite (separate milestone)
- Store-to-runes migration (separate milestone)
- Layout → +layout conversion (carried from Phase 24)
