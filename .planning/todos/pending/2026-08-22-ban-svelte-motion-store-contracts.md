---
created: '2026-08-22T00:00:00.000Z'
title: Ban svelte/motion's store-shaped `tweened`, after migrating the two live call sites to `Tween`
area: frontend
files:
  - apps/frontend/eslint.config.mjs
  - apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte
  - apps/frontend/src/lib/components/modal/timed/TimedModal.svelte
source: Phase 143 (D-07)
---

## Problem

The `svelte/store` ban is enforced; the **store-shaped half of `svelte/motion` is not**. `tweened()`
returns a Svelte-3/4 store contract (`subscribe`, `set`, `update`) — the same seam the store ban exists
to remove — and nothing stops a new one being written today.

Svelte 5 replaced it with the `Tween` class. Two files in the frontend already use `Tween`; two still
use `tweened`.

## The measured table — why this is a migration, not a rule

Measured by Phase 143 at HEAD `04fa5e22c`
(`git grep -n "svelte/motion" -- apps packages` → **4 lines, 4 files**; log
`${TMPDIR:-/tmp}/gsd-143/inventory-motion-grep.log`), and re-confirmed at Phase 143's close:

| `file:line` | Import | Status |
| --- | --- | --- |
| `apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte:44` | `import { tweened } from 'svelte/motion';` | **live legacy call site — blocks the ban** |
| `apps/frontend/src/lib/components/modal/timed/TimedModal.svelte:55` | `import { tweened } from 'svelte/motion';` | **live legacy call site — blocks the ban** |
| `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:5` | `import { Tween } from 'svelte/motion';` | already the Svelte-5 class form |
| `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts:2` | `import type { Tween } from 'svelte/motion';` | already the Svelte-5 class form |

**The blocking fact, stated plainly: a `svelte/motion` ban cannot land green until those two `tweened`
sites move to `Tween`.** That makes this a **migration** phase with a rule at the end of it, not an
evidence phase — which is exactly why Phase 143 scoped it out rather than absorbing it. A todo naming
its blockers is actionable; one saying "file a ban" is not.

## Solution

1. Migrate `PasswordValidator.svelte:44` and `TimedModal.svelte:55` from `tweened` to `Tween`. Both are
   animation-only usages, so the migration is behavioural-parity work with a visual check, not a data
   change.
2. Only then add the ban. The mechanism is already proven in-tree by Phase 143: an entry in the guard
   block's existing `no-restricted-imports` `paths` array, or a `no-restricted-syntax` selector for the
   dynamic form.
3. Ban the **specifier**, not the identifier — `svelte/motion` also exports `Tween`, `Spring` and
   `prefersReducedMotion`, all of which are the *supported* forms. A blanket module ban would forbid
   the migration target. Constrain to the named legacy exports (`tweened`, `spring`) or lint the
   identifier.

## Two traps Phase 143 already paid for, inherited here

- **Flat config REPLACES, it does not merge.** Any local `no-restricted-imports` /
  `no-restricted-syntax` array in `apps/frontend/eslint.config.mjs` **replaces** the inherited one
  wholesale. Phase 143 hit this at a second rule key and closed it with a standing regression case;
  dropping an inherited ban produces **zero** errors and ships invisibly. Re-include verbatim, and add
  a regression case for whatever you re-include.
- **Prove it blind before claiming it guards.** The milestone's standing acceptance rule
  (`REQUIREMENTS.md:7-13`) wants the injection observed **passing** before it is observed **failing**.
  Unlike Phase 143's `svelte/store` case, the pre-ban scope here still exists, so the OLD half needs no
  reconstruction — just measure it before you land the rule.

## Context

- **Source:** Phase 143 decision **D-07**, measured out of scope. The measurement is recorded in
  `.planning/phases/143-svelte-store-guard-app-wide-reach-fallout-triage/143-NEGATIVE-CONTROL-LEDGER.md`
  § Out of scope, measured (D-07 / D-08), together with an ESLint probe run showing the current guard is
  **SILENT** on `svelte/motion` against a **FIRING** control — so the silence is attributable to the
  rule's reach, not to a misconfigured probe.
- **All numbers in this todo live in that ledger.** Cross-referenced rather than restated so nothing
  here can drift from its source.
- Not scheduled: no `resolves_phase`.
