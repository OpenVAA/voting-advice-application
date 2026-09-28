---
created: 2026-08-21T09:31:00.000Z
title: 'Condenser.run() returns Array<Array<Argument>> behind an `as Array<Argument>` cast'
area: packages/argument-condensation
severity: major
source: Phase 142 (P-1, found by `142-02` Task 1 while remediating F15-C)
files:
  - packages/argument-condensation/src/core/condensation/condenser.ts
  - packages/argument-condensation/src/core/types/condensation/condensationResult.ts
  - packages/argument-condensation/src/core/condensation/planValidation.ts
---

## Problem

`CondensationRunResult.data.arguments` is **declared** `Array<Argument>`
(`condensationResult.ts:32`) but is `Array<Array<Argument>>` **at runtime** for
any plan whose final step is a **single-batch MAP** — the shape
`handleQuestion` builds for the package's own fixtures.

- `condenser.ts:205` returns it behind an `as Array<Argument>` cast, which hides
  the mismatch from the type checker entirely.
- `planValidation.ts:149`'s `structure` bookkeeping reports `'list'` while the
  payload is still physically nested.

A consumer writing the obvious `result.data.arguments.map((a) => a.text)` gets
`[undefined]` — no type error, no runtime throw, just wrong data.

`condenserStandalone.test.ts` is unaffected: its plan ends in REDUCE, which
collapses the nesting. That asymmetry is why the defect survived — the two test
files exercise different plan shapes and only one of them nests.

**Measured, not inferred:** a green clean-tree probe during `142-02` observed
`run.data.arguments` as `[[arg, arg]]`, not `[arg, arg]`.

## Solution

Collapse the list-of-lists at the single-batch-MAP exit so the runtime value
matches the declared type, and **delete the `as Array<Argument>` cast** — the
cast is the thing that makes the divergence invisible, so removing it is part of
the fix rather than a tidy-up afterwards. Then reconcile `planValidation.ts:149`'s
`structure: 'list'` claim with what is actually returned.

## Why it was not fixed in Phase 142

`142-02` was a **test-only** plan by its own success criteria. Collapsing the
nesting changes `Condenser.run()`'s observable output for **every** consumer —
Rule-4-class product change, not an in-flight auto-fix.

The remediated test documents the nesting inline and uses `flat()`, so it
asserts real argument content either way and **will keep passing once the product
is fixed**. That `flat()` is load-bearing, not a convenience: without it the
assertion cannot satisfy D-11 E8's *"each argument carrying non-empty text"* at
all.

Recorded in three places by `142-02`: the ledger's Deferred section (P-1), the
phase `deferred-items.md`, and `.planning/WINDOWS.md`.
