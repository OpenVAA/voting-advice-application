# Phase 123: Svelte 5 Idiom Polish — Lifecycle & Reactive-State - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 123-svelte-5-idiom-polish-lifecycle-reactive-state
**Areas discussed:** Bug-fix semantics

---

## Gray-area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Verification gate | How to prove behavior-neutral + bug fixes (E2E / unit+svelte-check / targeted tests) | |
| Lifecycle scope | migrate-vs-leave boundary for ~24 onMount/onDestroy sites (conservative vs aggressive) | |
| Bug-fix semantics | Bug 2 null behavior + per-bug regression tests | ✓ |

**User's choice:** Bug-fix semantics only. Verification gate and Lifecycle scope resolved with the recommended defaults (D-03, D-04, D-05).

---

## Bug-fix semantics — Q1: Bug 2 (`termsOfUseAccepted: null`)

Context surfaced before asking: the only production caller (`routes/candidate/(protected)/+layout.svelte:50`) always passes a timestamp string; no UI sets `null`. Setter type is `string | null`, so the bug is latent-correctness.

| Option | Description | Selected |
|--------|-------------|----------|
| Persist explicit null | Track edited-state via `!== undefined`; undefined=skip, null\|string=send. Type-faithful. | ✓ |
| Guard fix only, null stays no-op | Decouple image/terms saves but keep null = no change. | |
| Narrow the type to string | Drop null handling entirely if terms can only ever be accepted. | |

**User's choice:** Persist explicit null.
**Notes:** Both truthy sites change (`:150` filter and `:276` guard). Keep the existing string path strictly behavior-neutral; only new behavior is a (currently-unreachable) null edit reaching the backend.

## Bug-fix semantics — Q2: regression-test scope

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated test for each | Extend candidateUserDataState test (Bug 2) + add candidateContext questionBlocks entityType test (Bug 1). | ✓ |
| Test Bug 2, observe Bug 1 | Unit-test Bug 2; verify Bug 1 by reasoning/observable behavior. | |
| You decide per testability | Test where clean, observe where brittle. | |

**User's choice:** Dedicated test for each.

---

## Claude's Discretion
- Per-site migrate/leave classification for the ~24 lifecycle files and reactive-`let` sites (apply D-04/D-05 during planning/execution).
- Commit granularity (D-06).
- Whether a leave-untouched lifecycle site warrants an inline rationale comment.

## Deferred Ideas
- None new. Four phase-matched todos reviewed and NOT folded (all feature work): candidate answer-store investigation, display nominating org, fix nominations route fetch, MultipleTextQuestion input. See CONTEXT.md `<deferred>`.
