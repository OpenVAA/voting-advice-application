# Phase 115 — Deferred Items (out-of-scope discoveries)

## Pre-existing `yarn lint:check` failures in `apps/frontend/src/lib/contexts/**` (logged during 115-02)

**Discovered:** 2026-06-13, during Plan 115-02 Task 2 (clean-tree lint gate).

**Status:** OUT OF SCOPE for Phase 115 (straggler-clearance) — not introduced by the
`svelte/store` guard widening (SWEEP-03). Logged, NOT fixed, per the executor SCOPE BOUNDARY rule.

### Why out of scope

All 16 failing lint errors live in `apps/frontend/src/lib/contexts/**`, which was ALREADY
covered by the guard's OLD `files` glob (`src/lib/contexts/**/*.{ts,svelte}`). The Plan 115-02
change widened the glob to a strict SUPERSET (`src/**/*.{ts,svelte}`); it did not add or change
coverage for `lib/contexts/**`. None of the 16 errors are `no-restricted-imports` /
`svelte/store` violations (that rule passes clean: 0 violations on the clean tree, and the
widened guard provably fires on a `svelte/store` probe under the newly-covered
`lib/components/**` path). The failing rules are inherited base-config rules unrelated to
SWEEP-03, introduced by the Phase 112 / 114 context-as-class migration (e.g. `appContext.svelte.ts`
was last touched by commit `18691ff4d` in Phase 114). The lint tree was already red at the
115-02 baseline commit (`029c493c2`) before any 115-02 change.

### The 16 errors (5 of which are `--fix`-autofixable)

| File | Line | Rule |
|------|------|------|
| `lib/contexts/_spikes-017-019/017-readwrite-split-dataroot.spike.svelte.test.ts` | — | (spike test) |
| `lib/contexts/_spikes-017-019/018-readwrite-split-producer-inputs.spike.svelte.test.ts` | — | (spike test) |
| `lib/contexts/_spikes-020-class-conversion/022-class-version-bridge.spike.svelte.test.ts` | — | (spike test) |
| `lib/contexts/_spikes-020-class-conversion/023-class-ssr-effect.spike.svelte.test.ts` | — | (spike test) |
| `lib/contexts/app/appContext.spread.svelte.test.ts` | 30:9 | `func-style` |
| `lib/contexts/app/appContext.svelte.ts` | 204:11 | `@typescript-eslint/no-this-alias` |
| `lib/contexts/app/tracking/trackingService.svelte.ts` | 1:1, 131:11 | `simple-import-sort/imports`, `@typescript-eslint/no-this-alias` |
| `lib/contexts/auth/authContext.svelte.ts` | 60:11 | `@typescript-eslint/no-this-alias` |
| `lib/contexts/candidate/candidateContext.svelte.ts` | 200:3 | `no-unused-private-class-members` (`#questionCategories`) |
| `lib/contexts/component/componentContext.svelte.ts` | 1:1 | `simple-import-sort/imports` |
| `lib/contexts/data/dataContext.svelte.ts` | 79:11 | `@typescript-eslint/no-this-alias` |
| `lib/contexts/layout/layoutContext.svelte.ts` | 1:1 | `simple-import-sort/imports` |
| `lib/contexts/voter/voterContext.svelte.ts` | 100:3 | `no-unused-private-class-members` (`#questionCategories`) |

(`✖ 16 problems (16 errors, 0 warnings)`; 5 autofixable with `--fix`.)

### Recommended disposition

Triage as a Phase 116 milestone-close gate item (GATE-01) or a dedicated context-as-class
lint-cleanup follow-up. The `no-this-alias` errors are the deliberate `const self = this`
spread-safe handle pattern from the context-as-class migration and may warrant a scoped
`// eslint-disable-next-line` with rationale rather than a refactor; the `simple-import-sort`
and `func-style` ones are mechanical `--fix` candidates; the two `#questionCategories`
unused-private-member errors need a usage/removal decision.
