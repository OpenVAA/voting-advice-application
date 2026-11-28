---
title: Phase 153's own planning docs carry stale line citations — every one checked by plan 04 had moved
created: 2026-08-29
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 04
priority: medium
suggested_phase: 153-build-tooling-config-correctness
keywords: [stale-citations, line-numbers, 153-PATTERNS, 153-CONTEXT, REQUIREMENTS, comment-sweep, phase-152, navigate-by-symbol, REVIEW-CFG-03]
---

# Stale line citations across the Phase 153 planning docs

## Origin

Plan `153-04` was told to navigate by symbol rather than by line number, and to re-measure any
inherited figure. Doing so turned up that **every single line citation the plan asked it to follow
had moved**, while the one *count* it was given was correct. The cause is almost certainly Phase
152's comment sweep, which rewrote comments across `apps/**`, `packages/**` and `tests/**` and
shortened hundreds of files after these docs were written.

This is filed rather than fixed because plan 04's scope is `apps/frontend/vitest.config.ts` and its
own evidence fragment. Rewriting sibling plans' source docs mid-wave would race plans 05-11, which
are reading them now.

## What was measured

Measured at `dd5db8890` on `integration/ship-12-squash`, 2026-08-29.

| Doc | Citation as written | Actual |
|---|---|---|
| `153-04-PLAN.md` (objective, task 1) | `vitest.config.ts` usages at `:18,22,25,26,27,28,32,36,40,44,48`; "56 lines" | lines `16,20,23,24,25,26,30,34,38,42,46`; file is **54** lines |
| `153-04-PLAN.md` (task 1 `read_first`) | `scripts/assert-i18n-catalog-namespaces.mjs:57` | `:53` (the `REPO_ROOT` const; `:50` is the `node:url` import) |
| `153-04-PLAN.md` (task 1 `read_first`) | `packages/dev-seed/tests/ciTypecheckGate.test.ts:38` | `:22` (the `HERE` const; `:19` is the import) |
| `153-PATTERNS.md:578-579` | same two, `:57` and `:38-40`; plus `apps/frontend/vite.config.ts:10` | `:53`, `:22`; and `vite.config.ts:9` |
| `153-04-PLAN.md` (task 1 `action`) | "two-line `//` comment in the register of `vite.config.ts:8-9`" | `:8` is a **one-line** comment, `:9` is the code — the model is one line, not two |
| `.planning/REQUIREMENTS.md:97` | cited sites `:18,22,25,26,27,28,32,36,40,44` — **10** numbers | 11 sites, none at those lines |

The one inherited **count** that held: `__dirname` occurrences = **11**, exactly as the plan's
"count correction" section re-measured it. Frontend suite = 54 files / 816 tests, also exactly as
inherited. So the failure mode here is specifically *positional* citations, not quantitative ones.

## Why it matters beyond bookkeeping

The plan's "two-line comment" instruction was not merely imprecise — following it literally would
have **tripped a live guard**. `scripts/assert-comment-hygiene.mjs` Rule 2 (the forced-line-break
predicate, added by plan 152-15) fails any comment line that ends without terminal punctuation and
continues on the next line at the same post-marker indent. The cited model, `vite.config.ts:8`, is a
single dense line precisely because of that rule. Plan 04 wrote one line and the guard stayed at
1579 files / 0 violations.

That is the general risk: a stale citation is usually harmless, but a stale *description* of a
convention can instruct a sibling plan straight into a guard failure.

## Suggested action

1. Before plans 05-11 read `153-PATTERNS.md § Derive-your-own-directory`, correct its two source
   citations (`:57` → `:53`, `:38-40` → `:22`, `vite.config.ts:10` → `:9`).
2. Prefer symbol-anchored citations (`the REPO_ROOT const`, `the HERE const`) over line numbers in
   phase docs that will be read after a sweep phase.
3. `REQUIREMENTS.md:97`'s parenthetical is now discharged — plan 04 re-counted and found 11 — but
   the row still displays the stale 10-number list. Only the checkbox and traceability cells were
   written by `requirements mark-complete`; the prose was deliberately left alone, since hand-editing
   `REQUIREMENTS.md` is forbidden.
