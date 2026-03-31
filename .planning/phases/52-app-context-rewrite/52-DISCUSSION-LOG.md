# Phase 52: App Context Rewrite - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 52-app-context-rewrite
**Areas discussed:** VoterContext derived chains, CandidateContext async patterns, Final zero-$store sweep

---

## VoterContext Derived Chains

| Option | Description | Selected |
|--------|-------------|----------|
| Mechanical $derived conversion | Each derived() becomes $derived(). Keep same chain structure. | |
| Consolidate into single reactive object | Merge 20 derived stores into fewer blocks. More refactoring risk. | |
| You decide | Claude picks based on dependency graph. | ✓ |

**User's choice:** You decide
**Notes:** Claude has discretion to choose mechanical or consolidated approach based on actual code.

---

## CandidateContext Async Patterns

| Option | Description | Selected |
|--------|-------------|----------|
| Same pattern as AppContext | Page data subscriptions become $derived, auth state from page session, async methods stay as-is. | |
| You decide | Claude picks based on candidateContext.ts code patterns. | ✓ |

**User's choice:** You decide
**Notes:** Apply Phase 51's AppContext refactoring pattern. Claude decides specifics.

---

## Final Zero-$store Sweep

| Option | Description | Selected |
|--------|-------------|----------|
| Grep sweep in success criteria | Explicit grep commands validating zero svelte/store and $app/stores imports. | ✓ |
| CI lint rule | ESLint rule or CI check for permanent enforcement. | |
| You decide | Claude picks validation level. | |

**User's choice:** Grep sweep in success criteria (Recommended)
**Notes:** Scriptable one-time validation. CI rule can be added later.

---

## Claude's Discretion

- VoterContext internal structure (mechanical vs consolidation)
- CandidateContext conversion patterns
- AdminContext conversion
- Sub-module handling (answerStore, matchStore, filterStore, etc.)

## Deferred Ideas

None.
