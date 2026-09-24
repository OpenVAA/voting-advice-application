---
created: "2026-06-04T00:00:00.000Z"
title: Extend the svelte/store ESLint guard frontend-wide
area: frontend
files: []
source: v2.11 Phase 98 decision 98-2 (batch discussion v2.11-DISCUSSION-POINTS.md)
resolves_phase: 143
resolved: 2026-08-22
---

## Problem

v2.11 Phase 98 (CLEAN-02) adds a custom ESLint guard that fails the lint gate when a
`svelte/store` import is reintroduced — but **scoped only to `lib/contexts/**` and
`routes/**`** (matching the v2.11 requirement boundary). The rest of the frontend
(`lib/components`, `lib/utils`, dynamic-components, candidate components) is not guarded,
so a `svelte/store` import could creep back there without tripping CI.

## Solution

Extend the Phase 98 ESLint guard to cover the whole `apps/frontend/src/**` tree (or at
least `lib/**`). Expect this to surface existing `svelte/store` usages outside the migrated
context/route scope — triage each (migrate to runes vs explicitly allow). Likely a small
follow-up once v2.11 lands and the contexts/routes tree is provably clean.

## Context

- Deferred from v2.11 (decision **98-2**): v2.11 intentionally scopes the guarantee to
  `lib/contexts/**` + `routes/**`; `matchStore` / `nominationAndQuestionStore` are already
  rune-native and out of scope.
- Pairs with the Phase 98 guard rule implementation as its widening.

## Resolution

**Closed 2026-08-22 by Phase 143 — but the widening this todo asked for had already landed
`7c47b35b7`, nine days after this file was written.**

`7c47b35b7` — *`refactor(115-02): widen svelte/store ESLint guard to src/**/*.{ts,svelte}
(SWEEP-03)`*, **2026-06-13**, Phase 115 — widened the guard block's `files` glob in
`apps/frontend/eslint.config.mjs` from `lib/contexts/**` + `routes/**` to the whole
`src/**` tree. This todo was filed **2026-06-04**. It sat in `pending/` for the following
ten weeks describing work that had been done in the second of them.

**This todo's own prediction is retired against a measurement.** The Solution section
above predicted:

> *"Expect this to surface existing `svelte/store` usages outside the migrated
> context/route scope — triage each (migrate to runes vs explicitly allow)."*

It surfaced **nothing**. Measured at HEAD `04fa5e22c`:

```bash
git grep -n "from 'svelte/store'" -- apps packages   # 2 lines · 1 file · 0 real imports
```

Both hits are inside `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` — one a doc
comment, one the guard spec's own lint-input string literal. The wider grep
(`git grep -n "svelte/store" -- apps/frontend/src`) returns 10 lines across 5 files, and
**all ten are prose or test fixtures**. There was no fallout to triage, so the exclusion
list ends the phase at the same **16 entries** it started with — **0 additions**.

**What was genuinely outstanding** was not construction but **ASSERT-08's proof clause**
under the milestone's standing acceptance rule (`REQUIREMENTS.md:7-13`): *prove the guard
fails before claiming it guards.* The guard had been observed working; it had never been
observed blind. Phase 143 supplies that evidence, and closes two reach gaps the Phase-115
widening never covered — `.js`/`.mjs`/`.cjs` files, and dynamic `import('svelte/store')` —
each measured blind first and then measured catching.

**Evidence:**
`.planning/phases/143-svelte-store-guard-app-wide-reach-fallout-triage/143-NEGATIVE-CONTROL-LEDGER.md`
— 19 rows, both halves of every pair measured in-phase, 0 borrowed observations.
