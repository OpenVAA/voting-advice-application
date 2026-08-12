---
created: "2026-06-04T00:00:00.000Z"
title: Extend the svelte/store ESLint guard frontend-wide
area: frontend
files: []
source: v2.11 Phase 98 decision 98-2 (batch discussion v2.11-DISCUSSION-POINTS.md)
resolves_phase: 143
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
