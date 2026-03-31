# Phase 51: Mid-Level Context Rewrite - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 51-mid-level-context-rewrite
**Areas discussed:** DataRoot version counter, AppContext complexity, ComponentContext consumers

---

## DataRoot Version Counter

| Option | Description | Selected |
|--------|-------------|----------|
| Version counter ($state) | Increment $state counter on DataRoot.subscribe(). $derived reads both dataRoot and version. | ✓ |
| Proxy wrapper | Wrap DataRoot in reactive proxy that intercepts property reads. More magical. | |
| You decide | Claude picks based on Svelte 5 internals. | |

**User's choice:** Version counter ($state) (Recommended)
**Notes:** Simple, explicit, no DataRoot source changes needed.

---

## AppContext Complexity

| Option | Description | Selected |
|--------|-------------|----------|
| Mechanical replacement only | Swap store primitives, keep same structure. Lowest risk. | |
| Refactor pageDatumStore integration | Simplify data flow since pageDatumStore is migrated. Replace subscribe() with $derived chains. | ✓ |
| You decide | Claude assesses based on code patterns. | |

**User's choice:** Refactor pageDatumStore integration
**Notes:** Take advantage of Phase 50's $app/state migration to simplify AppContext data flow.

---

## ComponentContext Consumers

| Option | Description | Selected |
|--------|-------------|----------|
| All 52 in Phase 51 | Update all ComponentContext consumers when context is rewritten. Mechanical changes. | ✓ |
| Split across phases | Only update consumers that also consume Data/App context. Creates inconsistency window. | |
| You decide | Claude decides based on dependency analysis. | |

**User's choice:** All 52 in Phase 51 (Recommended)
**Notes:** Per D-04 from Phase 50, full consumer migration per phase.

---

## Claude's Discretion

- ComponentContext implementation details
- DataContext version counter placement
- AppContext tracking/survey/popup conversion details
- pageDatumStore simplification approach

## Deferred Ideas

None.
