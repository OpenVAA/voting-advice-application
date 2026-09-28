# Phase 115: Straggler Clearance - Research

**Researched:** 2026-06-13
**Domain:** Svelte 5 rune migration — final `svelte/store` cleanup + ESLint guard widening
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None beyond ROADMAP success criteria — this is an auto-generated infrastructure phase (discuss skipped).

### Claude's Discretion
All implementation choices are at Claude's discretion. Constraints from ROADMAP success criteria:
- `videoPreferences` → rune conversion must be **behavior-preserving** (same persisted semantics); follow the established rune-state pattern (the `persistedState` / `localStorageState` helpers used elsewhere in the frontend).
- Zero `svelte/store` imports in `apps/frontend/src/**` (test mocks excluded + documented).
- Zero `$:` reactive statements frontend-wide.
- Widened ESLint guard: reintroducing a `svelte/store` import anywhere in the frontend fails lint, and the existing tree passes lint under the widened guard.
- `yarn lint:check` + `yarn build` + `yarn vitest run` green.
- Ordering: SWEEP-01 (convert) before SWEEP-03 (widen guard).

### Deferred Ideas (OUT OF SCOPE)
- Milestone-close green gate (Phase 116 / GATE-01).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SWEEP-01 | Convert the last real `svelte/store` usage (`videoPreferences` writable in `lib/components/video/component-stores.ts`) to a rune; zero `svelte/store` imports remain in `apps/frontend/src/**` (test mocks excluded + documented). | Full consumer inventory below (8 sites, all in `Video.svelte`). Established replacement = `localStorageState`/plain-`$state` from `persistedState.svelte.ts`. **No test-mock import exclusions actually exist** — the one test reference is a comment, not an import. |
| SWEEP-02 | Remove the stray `$: console.info(...)` Svelte-4 reactive statement in `TermsOfUseForm.svelte`; zero `$:` reactive statements remain frontend-wide. | Exact location: `TermsOfUseForm.svelte:19`, and it lives **inside a `@component` JSDoc comment block** (lines 16–22), not in real script. Verified it is the ONLY `$:` match frontend-wide. |
| SWEEP-03 | Extend the `svelte/store` ESLint guard from `lib/contexts/**`+`routes/**` to the whole `apps/frontend/src/**` tree. MUST land AFTER SWEEP-01. | Current guard at `apps/frontend/eslint.config.mjs:80–102`. Exact widening shown below. Tree passes under widened guard ONLY after SWEEP-01 removes `component-stores.ts`'s import. |
</phase_requirements>

## Summary

This is a small, low-risk, well-bounded cleanup phase with **HIGH confidence** across all three requirements — every claim below was grepped/read directly in the live tree, not assumed.

The inventory is tighter than the ROADMAP implied:
- **SWEEP-01:** `videoPreferences` is the single remaining real `svelte/store` import in `apps/frontend/src/**` (1 import line in `component-stores.ts`, 8 consumer sites all inside one file, `Video.svelte`). Crucially, **the current `writable` has NO localStorage persistence at all** despite its docstring claiming it "persist[s] across page loads" — so "behavior-preserving" literally means an in-memory module-scoped `$state`. There is a latent-bug decision here (see Open Questions / Pitfall 1).
- **SWEEP-02:** The lone `$:` is inside a `@component` JSDoc usage example (a comment), not executing code — it is documentation rot, removed by deleting one line.
- **SWEEP-03:** The guard widens by changing one `files` glob array; **no test-mock exclusions are actually needed** — the only `svelte/store` mention in any test file is a comment.

**Primary recommendation:** Convert `component-stores.ts` → `component-stores.svelte.ts` exporting a module-scoped rune handle; update the single import in `Video.svelte` and rewrite its 8 read/write sites; delete the stray `$:` comment line in `TermsOfUseForm.svelte`; widen the ESLint guard's `files` glob to `src/**/*.{ts,svelte}`. Order: SWEEP-01 + SWEEP-02 first (independent), SWEEP-03 last. Decide the persistence question (Open Question 1) before writing the rune handle.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Video playback prefs (muted / captions / transcript) | Browser / Client | — | Pure client-side UI preference state; consumed only inside `Video.svelte` in the browser. |
| ESLint import guard | Build / Tooling | — | Lint-time enforcement, no runtime tier. |
| JSDoc comment hygiene (SWEEP-02) | Source / Docs | — | Documentation-only; no runtime tier. |

## Standard Stack

No new packages. This phase uses only in-tree primitives.

### Core
| Primitive | Source | Purpose | Why Standard |
|-----------|--------|---------|--------------|
| `$state` rune | Svelte 5 compiler | Reactive module/local state replacing `writable` | The project-wide replacement for `svelte/store` (v2.11–v2.13 migration). [VERIFIED: codebase grep] |
| `localStorageState(key, default)` | `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` | Rune-native persisted handle `{ current, set, update }` (versioned localStorage, SSR-safe `browser` gate) | The canonical persisted-rune helper used by `appContext`, voter/candidate answer stores, tracking. [VERIFIED: codebase grep] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `localStorageState` (persisted) | Bare module-scoped `$state` object | The current `writable` does **not** persist (see Pitfall 1). Bare `$state` is the literally-behavior-preserving choice; `localStorageState` would FIX the latent bug and finally honour the docstring. This is the one judgment call — see Open Question 1. |

**Installation:** None — no `npm install`.

## Package Legitimacy Audit

Not applicable — this phase installs zero external packages. All primitives are in-tree (`$state` compiler rune, local `persistedState.svelte.ts` helper).

## Architecture Patterns

### Component Responsibilities

| File | Current | After |
|------|---------|-------|
| `lib/components/video/component-stores.ts` | `import { writable } from 'svelte/store'` exporting `videoPreferences = writable({...})` | Renamed `component-stores.svelte.ts`; exports a rune handle (bare `$state` object **or** `localStorageState(...)`). No `svelte/store` import. |
| `lib/components/video/Video.svelte` | `import { videoPreferences } from './component-stores'` + 8 `$videoPreferences` read/write sites | Import from `./component-stores.svelte`; reads/writes rewritten to rune-handle access. |
| `lib/candidate/components/termsOfUse/TermsOfUseForm.svelte` | `$: console.info(...)` on line 19 inside JSDoc | Line deleted from the JSDoc usage example. |
| `apps/frontend/eslint.config.mjs` | `no-restricted-imports` `svelte/store` ban scoped to `lib/contexts/**` + `routes/**` (lines 80–102) | Same rule, `files` widened to `src/**/*.{ts,svelte}`. |

### Pattern 1: `writable` → module-scoped rune handle

The `.svelte.ts` extension is **required** for `$state` to compile in a non-component module. The current file is `.ts`, so it MUST be renamed.

The 8 consumer sites in `Video.svelte` and exactly how each maps:

```
Line 86:  import { videoPreferences } from './component-stores';        → './component-stores.svelte'
Line 161: $state($videoPreferences.textTracksHidden ?? !showCaptions)   → videoPreferences.current.textTracksHidden ?? !showCaptions
Line 285: $state($videoPreferences.transcriptVisible ?? showTranscript) → videoPreferences.current.transcriptVisible ?? showTranscript
Line 393: if (... || $videoPreferences.muted) return;                   → ... || videoPreferences.current.muted
Line 440: $videoPreferences = { ...$videoPreferences, muted };          → videoPreferences.update(p => ({ ...p, muted }))
Line 453: $videoPreferences = { ...$videoPreferences, textTracksHidden };→ videoPreferences.update(p => ({ ...p, textTracksHidden }))
Line 470: $videoPreferences = { ...$videoPreferences, transcriptVisible};→ videoPreferences.update(p => ({ ...p, transcriptVisible }))
```

**Critical observation:** ALL reads are either one-shot `$state(...)` initializers (lines 161, 285) or imperative reads inside functions (line 393). There is **NO reactive template `{$videoPreferences}` read** anywhere. This means the migration is purely structural — there is no reactive-edge to preserve in the template, which removes the whole class of destructure-trap risk that the Context Destructuring Rule warns about. [VERIFIED: codebase grep]

**Two valid handle shapes:**

Option A — bare `$state` (literally behavior-preserving, no persistence):
```typescript
// component-stores.svelte.ts
let prefs = $state({ muted: false, textTracksHidden: false, transcriptVisible: false });
export const videoPreferences = {
  get current() { return prefs; },
  update(fn: (p: typeof prefs) => typeof prefs) { prefs = fn(prefs); },
  set(v: typeof prefs) { prefs = v; }
};
```

Option B — `localStorageState` (honours the docstring, adds real persistence):
```typescript
// component-stores.svelte.ts
import { localStorageState } from '$lib/contexts/utils/persistedState.svelte';
export const videoPreferences = localStorageState('video-preferences', {
  muted: false, textTracksHidden: false, transcriptVisible: false
});
```
Both expose the same `{ current, set, update }` surface, so the `Video.svelte` rewrite is identical either way — the consumer rewrite does not depend on which option is chosen. (Option B also re-uses the SSR-safe `browser` gate, so it is SSR-safe for free.)

### Anti-Patterns to Avoid
- **Leaving the file as `.ts`:** `$state` will not compile outside a `.svelte`/`.svelte.ts` module — it must be renamed.
- **Reintroducing a `subscribe`/`fromStore` bridge:** Not needed — no reactive template read exists. Keep it to `current`/`set`/`update`.
- **Using `$effect` to persist (if Option B is hand-rolled):** Persist imperatively inside `set`/`update` (the `localStorageState` helper already does this, see `persistedState.svelte.ts:123–131`). A module-scope `$effect` would throw `effect_orphan`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Persisted rune state (if Option B) | A custom localStorage wrapper | `localStorageState` from `persistedState.svelte.ts` | Already SSR-gated, versioned, JSON-safe, and unit-tested (`persistedState.svelte.test.ts`). [VERIFIED: codebase grep] |

**Key insight:** Both the rune-state replacement pattern and the ESLint guard pattern already exist verbatim in the tree from the v2.11–v2.13 migration. This phase is mechanical application of established patterns, not novel design.

## Runtime State Inventory

This phase touches a `writable` and a lint glob — it has a refactor surface, so the inventory applies:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None** — the current `videoPreferences` `writable` writes to **no** persistent store; it is in-memory module scope only (verified by reading `component-stores.ts` — no localStorage/sessionStorage). If Option B is chosen a NEW localStorage key (`video-preferences`) is introduced, but there is no existing data to migrate. | None (Option A) / none-to-migrate (Option B introduces a fresh key) |
| Live service config | None — pure client-side UI state, no external service. | None |
| OS-registered state | None. | None |
| Secrets/env vars | None. | None |
| Build artifacts | The renamed file `component-stores.ts` → `component-stores.svelte.ts` changes its import specifier (`./component-stores` → `./component-stores.svelte`). `yarn build` recompiles; no stale artifact persists. Confirm no other importer exists — grep found only `Video.svelte`. [VERIFIED: codebase grep] | Update the single import path; rebuild |

**Import-path update inventory (the rename):** Exactly ONE importer — `Video.svelte:86`. No barrel re-export, no `index.ts` in `lib/components/video/` re-exporting `component-stores`. [VERIFIED: grep for `component-stores` across `apps/frontend/src`]

## Common Pitfalls

### Pitfall 1: "Behavior-preserving" hides a latent bug — the writable never persisted
**What goes wrong:** The docstring in `component-stores.ts` says *"Store for persistent video selections"* and `Video.svelte:13` says preferences *"persist across page loads"* — but the `writable` has **no localStorage backing**. Selections are lost on reload today.
**Why it happens:** Doc written for an intended-but-never-implemented persistence.
**How to avoid:** Make an explicit decision (Open Question 1). Option A reproduces today's actual (non-persisting) behavior — strictly "behavior-preserving." Option B implements what the docs always claimed — "behavior-correcting." Either is defensible; the phase must pick one and note it, not silently change behavior.
**Warning signs:** A reviewer flagging that the docstring and the code disagree.

### Pitfall 2: File extension — `$state` in a `.ts` file silently fails / errors
**What goes wrong:** Putting `$state` in `component-stores.ts` (no `.svelte`) produces a compile error or no reactivity.
**How to avoid:** Rename to `component-stores.svelte.ts` (matches the convention of every `*.svelte.ts` state module in `lib/contexts/`).
**Warning signs:** `yarn build` error referencing runes outside a component, or non-reactive UI.

### Pitfall 3: Flat-config REPLACES, not merges, `no-restricted-imports`
**What goes wrong:** When you widen the guard's `files` glob, the in-scope override **replaces** the inherited `no-restricted-imports` array from `shared-config/eslint.config.mjs` (the deep-relative-`lib` `patterns` ban). The current guard already re-includes that `patterns` block verbatim (lines 93–98) precisely for this reason — keep it.
**Why it happens:** ESLint flat config does not deep-merge rule option arrays; the last matching config wins wholesale.
**How to avoid:** When widening `files`, keep BOTH the `svelte/store` `paths` ban AND the deep-relative `patterns` ban in the same override object (do not drop the `patterns` block). This is documented inline in the existing config comment (lines 77–79).
**Warning signs:** Deep-relative `../../lib/...` imports stop being flagged after the change.

### Pitfall 4: SWEEP-03 before SWEEP-01 = self-inflicted lint failure
**What goes wrong:** Widening the guard while `component-stores.ts` still imports `svelte/store` makes `yarn lint:check` fail (the guard now covers `lib/components/**`).
**How to avoid:** Land SWEEP-01 (remove the import) strictly before SWEEP-03. The CONTEXT and REQUIREMENTS both mandate this order.

### Pitfall 5: SWEEP-02 `$:` is inside a comment, not code
**What goes wrong:** Treating it as a real reactive statement to "convert" rather than delete.
**How to avoid:** It lives in the `@component` JSDoc usage block (`TermsOfUseForm.svelte:16–22`). The script body (lines 25–40) is already clean Svelte 5. Just delete line 19 from the doc example (it logs `termsAccepted` — pure debug rot). Confirm zero `$:` remain frontend-wide afterward with the grep below.

## Code Examples

### Verify the full `svelte/store` inventory (SWEEP-01 gate)
```bash
# Real imports only (excludes comments). Expected after SWEEP-01: empty.
grep -rn "import.*['\"]svelte/store['\"]" apps/frontend/src
# Broader (catches comment mentions too — currently 1 import + 1 test comment):
grep -rn "svelte/store" apps/frontend/src
```

### Verify zero `$:` reactive statements (SWEEP-02 gate)
```bash
# Expected after SWEEP-02: empty.
grep -rn '\$:' apps/frontend/src --include="*.svelte"
```
Note: this raw grep currently matches exactly one line — `TermsOfUseForm.svelte:19`, inside the JSDoc. Distinguish real `$:` labels from `$:` in CSS/strings: there are none of the latter in this tree (verified). [VERIFIED: codebase grep]

### Widen the ESLint guard (SWEEP-03)
In `apps/frontend/eslint.config.mjs`, change the override `files` (line 81) from:
```js
files: ['src/lib/contexts/**/*.{ts,svelte}', 'src/routes/**/*.{ts,svelte}'],
```
to:
```js
files: ['src/**/*.{ts,svelte}'],
```
Keep the entire `rules` body unchanged (both the `svelte/store` `paths` ban AND the deep-relative `patterns` ban — Pitfall 3). Update the leading comment (lines 74–79) to note D-03's widening is now done. The `.svelte.ts` files match `*.{ts,svelte}` (the `.ts` segment matches), so the new `component-stores.svelte.ts` is covered.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `svelte/store` `writable` | `$state` rune handles exposing `current`/`set`/`update` | v2.11–v2.13 migration | `videoPreferences` is the final straggler. |
| `$: label` reactive statements | `$derived` / `$effect` | Svelte 5 migration | The only remaining `$:` is dead doc text. |

**Deprecated/outdated:**
- `videoPreferences` `writable`: replaced by a rune handle in this phase.
- The `component-stores.ts` docstring's persistence claim: never true; resolve with Option B or correct the doc under Option A.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | None. All claims verified by direct grep/read in the live tree this session. | — | — |

**If this table is empty:** All claims in this research were verified — no user confirmation needed except the deliberate Option A vs B judgment call (Open Question 1), which is Claude's discretion per CONTEXT.

## Open Questions (RESOLVED)

1. **Persist video preferences, or reproduce today's non-persistence? (Option A vs B)**
   - **RESOLVED: Option A (bare `$state`, strictly behavior-preserving) chosen per 115-01-PLAN.md objective; docstring corrected to stop claiming persistence. Option B (localStorageState) deferred as a follow-up todo.**
   - What we know: The current `writable` does NOT persist; docs claim it does.
   - What's unclear: Whether "behavior-preserving" means "reproduce actual runtime behavior" (Option A, bare `$state`) or "honour documented intent" (Option B, `localStorageState('video-preferences', ...)`).
   - Recommendation: Default to **Option A (bare `$state`)** to keep the phase strictly behavior-preserving and risk-free (no new localStorage key, no SSR concerns, no E2E surprise), and update the docstring to stop claiming persistence. Note Option B as a one-line follow-up todo if the team wants real persistence. Both are within Claude's discretion; the planner should pick A and state it explicitly in the plan. (Picking B is also acceptable but introduces a new persisted key — slightly larger blast radius.)

## Environment Availability

Skipped — this phase is purely source + lint-config changes with no external runtime dependencies. Verification uses already-present `yarn` scripts.

## Validation Architecture

> `workflow.nyquist_validation` was not found set to `false`; section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (unit) + Playwright (E2E, not in scope here) |
| Config file | `apps/frontend/vitest.config.*` (workspace-level) |
| Quick run command | `yarn vitest run` (from `apps/frontend`) or `yarn test:unit` (root, all packages) |
| Full suite command | `yarn test:unit` (root) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SWEEP-01 | Zero real `svelte/store` imports in `apps/frontend/src/**` | grep gate | `grep -rn "import.*svelte/store" apps/frontend/src` (expect empty) | ✅ (grep) |
| SWEEP-01 | Video prefs still toggle (muted/captions/transcript) | unit/manual | existing `Video.svelte` behavior; no dedicated unit test exists today | ❌ (no Video unit test — rely on build + manual/E2E smoke; not worth a new test for an in-memory toggle) |
| SWEEP-02 | Zero `$:` frontend-wide | grep gate | `grep -rn '\$:' apps/frontend/src --include="*.svelte"` (expect empty) | ✅ (grep) |
| SWEEP-03 | Reintroducing `svelte/store` anywhere fails lint | lint gate | `yarn lint:check` green on clean tree; add a throwaway `svelte/store` import → confirm it fails | ✅ (lint) |
| All | Build + unit green | build/unit | `yarn build` (15 workspaces), `yarn vitest run` (~766 baseline) | ✅ |

### Sampling Rate
- **Per task commit:** the relevant grep gate + `yarn lint:check`
- **Per wave merge:** `yarn build` + `yarn vitest run`
- **Phase gate:** `yarn lint:check` + `yarn build` + `yarn vitest run` all green before `/gsd-verify-work`

### Wave 0 Gaps
- None — existing infrastructure (grep gates, `yarn lint:check`, `yarn build`, `yarn vitest run`) fully covers all three requirements. No new test files needed for an in-memory UI-toggle migration with no reactive template edge.

## Security Domain

Not applicable in substance — no auth, input handling, crypto, access control, or data exposure surface. The changes are: (1) an in-memory client-side UI-preference state primitive swap, (2) deletion of a debug `console.info` from a comment, (3) a lint-config glob widening. No ASVS category is engaged. (If Option B is chosen, the new localStorage key holds only non-sensitive UI booleans — no PII.)

## Sources

### Primary (HIGH confidence)
- `apps/frontend/src/lib/components/video/component-stores.ts` — the `writable` definition (read in full).
- `apps/frontend/src/lib/components/video/Video.svelte` — all 8 consumer sites (read).
- `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` — `localStorageState` helper (read in full).
- `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte` — stray `$:` at line 19 (read in full).
- `apps/frontend/eslint.config.mjs` — current `svelte/store` guard (read in full, lines 74–102).
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` — reference `localStorageState` consumer (`current`/`update` usage).
- `.planning/REQUIREMENTS.md` lines 113–121 — SWEEP-01/02/03 definitions.
- `.planning/phases/115-straggler-clearance/115-CONTEXT.md` — phase boundary + ordering constraint.
- Project skill `spike-findings-voting-advice-application-gsd/references/persistent-rune-stores.md` — `runeLocalStorage`/persisted-rune findings (referenced; the in-tree `persistedState.svelte.ts` is the shipped descendant).

### Secondary / Tertiary
- None — all findings are HIGH confidence from direct tree inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — in-tree primitives, read directly.
- Architecture: HIGH — single importer, 8 well-mapped sites, no reactive template edge.
- Pitfalls: HIGH — flat-config replace-not-merge and `.svelte.ts` extension are documented in the existing config and migration history; persistence latent-bug verified by reading the source.

**Research date:** 2026-06-13
**Valid until:** 2026-07-13 (stable; tree is frozen pre-Phase-116 close)

## RESEARCH COMPLETE

**Phase:** 115 - Straggler Clearance
**Confidence:** HIGH

### Key Findings
- `videoPreferences` is the **only** real `svelte/store` import in `apps/frontend/src/**` (1 import, 8 consumer sites all in `Video.svelte`); rename `component-stores.ts` → `.svelte.ts` and expose a `current`/`set`/`update` rune handle. No reactive template read exists, so no destructure-trap risk.
- The current `writable` has **NO localStorage persistence** despite docstrings claiming it does — Option A (bare `$state`, behavior-preserving) vs Option B (`localStorageState`, behavior-correcting) is the one judgment call; recommend Option A + fix the docstring.
- SWEEP-02's `$:` is **inside a JSDoc `@component` comment** at `TermsOfUseForm.svelte:19` — delete one line; it is the only `$:` frontend-wide.
- SWEEP-03 widens one `files` glob to `src/**/*.{ts,svelte}`; **no test-mock exclusions are actually needed** (the lone test reference is a comment). Must keep both ban blocks (flat-config replaces, not merges) and land strictly after SWEEP-01.

### File Created
`.planning/phases/115-straggler-clearance/115-RESEARCH.md`

### Ready for Planning
Research complete. Planner can create PLAN.md files. Recommended ordering: SWEEP-01 + SWEEP-02 (independent) → SWEEP-03 (guard widening, last).
