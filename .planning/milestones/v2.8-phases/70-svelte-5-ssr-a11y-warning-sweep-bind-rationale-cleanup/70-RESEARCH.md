# Phase 70: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup — Research

**Researched:** 2026-05-09
**Domain:** Svelte 5 hygiene (`state_referenced_locally`, `slot_element_deprecated`, `a11y_no_noninteractive_element_interactions`, SSR `fetch` eagerness) + comment-only audit-noise cleanup
**Confidence:** HIGH (svelte-check warning surface enumerated end-to-end on cold `.svelte-kit` rebuild; bind-comment count verified by `git grep`; fix patterns cited from official Svelte 5 docs and in-tree exemplars from Phases 61/64/65)

## Summary

Phase 70 closes the four-category Svelte 5 / SSR / a11y warning surface surfaced during v2.7 Phase 67 UAT, plus strips the `// bind: keep —` rationale comments that survived from v2.7 Phase 65 Plan 01. The full warning surface is **smaller than CONTEXT.md anchors imply**: a fresh `svelte-check` over a cold `.svelte-kit` rebuild produces **12 warnings total** — 9 Category A (`state_referenced_locally`), 1 Category B (`slot_element_deprecated`), 1 Category C (`a11y_no_noninteractive_element_interactions`), and 0 Category D in static analysis (the SSR `fetch`-eagerness warning fires only at dev-server runtime — Plan-70-04's Task 1 is the cold-start dev-mode capture). The `bind:` comment count is **27 single-line `// bind:` comments** today (mostly `// bind: keep — usage example in @component doc` inside `@component` blocks), not 92 — the 92 in CONTEXT.md is the count of audited `bind:*` directives, not the count of justification comments (Phase 65 SUMMARY documents the multi-bind elements covered by single comments).

All four warning categories have well-established, in-tree fix patterns: Category A follows CLAUDE.md §"Context Destructuring Rule" (read at use site, not via destructured local); Category B is the canonical Svelte 5 `<slot />` → `{@render children()}` migration; Category C uses `<button>` or `role + tabindex + keyboard handler`; Category D moves module-time fetches to `+page.ts` / `+layout.ts` `load()` (server-shareable) or `onMount()` (client-only). Phase 70 is mechanical sweep + apply pattern + verify; no new libraries, no architectural decisions.

**Primary recommendation:** Execute as 5 parallelizable plans per CONTEXT.md D-02 — Plan-70-01 (Cat A, 9 sites in 6 files), Plan-70-02 (Cat B, 1 site), Plan-70-03 (Cat C, 1 site + sweep `Checkbox/Radio/Switch` analogs), Plan-70-04 (Cat D, captured in cold dev-server log), Plan-70-05 (BIND-strip, 27 `// bind: (keep|ok|justified)` comments). BIND-strip runs LAST when files overlap with category-fix plans (per CONTEXT D-02). Phase 70 verification is one cold-start protocol run + `yarn workspace @openvaa/frontend check` warning-clean assertion + voter-flow happy path Playwright parity.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| `state_referenced_locally` rewrite (Cat A) | Browser (Svelte component runtime) | — | Reactive props/state read at component init; runtime emits the warning |
| `<slot />` → `{@render children()}` migration (Cat B) | Browser (Svelte 5 compiler) | — | Render-tree composition; SSR-irrelevant beyond the same template |
| `a11y_no_noninteractive_element_interactions` fix (Cat C) | Browser (component markup) | — | DOM-level event/role semantics; assistive tech consumes browser-side |
| SSR `fetch`-eagerness move (Cat D) | Frontend Server (SvelteKit `load()`) | Browser (`onMount`) | `load()` is the canonical SSR-safe data path; `onMount` gates client-only fetches |
| `// bind: keep —` comment strip (BIND-01) | App code (Svelte source) | — | Comment-only edit; no behavioural surface |
| Cold-start verification + svelte-check gate | Tooling (Vite + svelte-check) | E2E (Playwright parity) | Static + runtime warning surface lives in the dev-server / typecheck output |
| Voter-flow happy-path smoke | E2E (Playwright) | — | Existing `tests/tests/specs/voter/voter-journey.spec.ts` and siblings |

**Tier note:** Phase 70 touches only the app tier (`apps/frontend/src/`). It does NOT modify any `@openvaa/*` package — none of the four warning categories fire in the framework-agnostic library packages.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Add Category D (SSR fetch-eagerness) to phase scope.** Pulled in from `.planning/todos/pending/2026-05-08-results-layout-missing-slot-render-tag.md` Category B' (~12 occurrences during a single voter-app session). Lands the full Phase 67 UAT warning surface in one phase rather than splitting it across v2.8 + v2.9. ROADMAP SC stays as written; REQUIREMENTS WARN-01 implicitly extends to Category D — planner adds an "SC-1b Category D" or equivalent during plan-phase, OR REQUIREMENTS.md is amended in a small docs commit before plan-phase (planner picks).
- **D-02: 5 parallelizable plans — A / B / C / D / BIND.** One plan per warning category (A/B/C/D) plus one plan for the bind-comment strip. Independent diffs, runnable in parallel waves. Same audit-pattern as v2.7 Phase 65. Planner may merge two plans if the sweep grep reveals very small per-category surface area (e.g. Category C may end up being 1-3 fixes), but the default split is 5. Plan-70-05 (BIND) explicitly LAST in execute order if any A/B/C/D plan touches the same file.
- **D-03: Tests only for sites that surfaced user-visible bugs.** For Category A `state_referenced_locally` sites with a known production-like-bug history (the v2.6 P61-03 destructuring bug class), add a minimal Svelte 5 component reactivity test that would fail before the fix. For pure dev-warning sites without visible-bug history, the warning-gone gate + manual voter-flow smoke is sufficient.
- **D-04: Cold-start = `rm -rf apps/frontend/.svelte-kit node_modules/.vite/ && yarn dev`, then voter-flow happy path.** Standard cold protocol from the source todo. Phase verification runs this once at phase close and asserts zero un-justified warnings across A/B/C/D.
- **D-05: Accepted-warning inline justification format = `// svelte-warning: accepted — <reason>`.** Distinct from the v2.7 P65 `// bind: keep —` family so a future grep can find them. Planner may pick a different convention if a more idiomatic one already exists in the codebase — flag if so.

### Claude's Discretion

- Whether to bundle Category C into Plan-70-03 if the sweep finds only 1-3 a11y warnings (vs justifying a separate plan).
- Exact codemod / sed pattern for Plan-70-05 bind-comment strip — single regex, careful diff review, atomic commit per the source todo.
- Whether the Category D fix-pattern needs a one-line CLAUDE.md note about "module-time fetch is wrong; use load() / onMount()" — planner picks based on whether the rule is already implicit elsewhere in CLAUDE.md.

### Deferred Ideas (OUT OF SCOPE)

- **Custom svelte-eslint rule for the Context Destructuring Rule.** CLAUDE.md notes this is a future possibility if violations recur. Phase 70 does NOT add the rule.
- **SSR perf / cache hardening beyond fixing fetch-eagerness.** The Category D fix is "move fetch to the right lifecycle". Broader SSR cache strategy (e.g. SvelteKit `load()` cache headers, redis-backed dedup) is v2.9+.
- **A11y feature work** (focus-trap, screen-reader announcements, etc.) — separate workstream beyond the warning-fix bar.
- **`apps/frontend/src/lib/paraglide/**` cleanup** — already lint-ignored per Phase 68 Plan 02; not revisited here.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WARN-01 | All vite-plugin-svelte / SvelteKit dev/build warnings (Categories A/B/C + D from D-01) resolved or documented as accepted. Cold `yarn dev` + `yarn build` warning-clean across the four categories. | §Confirmed Warning Sites (full enumeration), §Per-Category Fix Patterns, §Validation Architecture (cold-start + voter-flow gate) |
| BIND-01 | The `// bind: keep —` rationale comments (27 single-line + multi-line variants) are removed from `apps/frontend/src/lib/**/*.svelte`. `bind:*` directives untouched. Comment-only diff. | §BIND-01 Strip Specifics (count + multi-line caveat), §Code Examples (strip pattern), §Pitfall 4 (multi-line comments) |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte | ^5.53.12 | Reactive component framework (runes mode) | Existing dependency `[VERIFIED: package.json catalog]`; Phase 70 is hygiene over current install |
| @sveltejs/kit | ^2.55.0 | App framework + SSR + load() | Existing dependency `[VERIFIED: package.json catalog]`; Cat D fix targets `load()` |
| @sveltejs/vite-plugin-svelte | ^5.1.1 | Vite integration; emits warnings | Existing devDep `[VERIFIED: apps/frontend/package.json]` |
| svelte-check | ^4.4.5 | Static type + warning gate | `yarn workspace @openvaa/frontend check` is the warning-clean gate `[VERIFIED: package.json catalog]` |
| Vitest | catalog | Unit test runner — used for D-03 reactivity regression tests | Existing test infrastructure `[VERIFIED: apps/frontend/vitest.config.ts]` |
| Playwright | catalog | E2E parity gate | Existing baseline `67p / 1f / 34c` carrying forward from v2.6 anchor `[CITED: STATE.md Accumulated Context]` |

**No new libraries.** Phase 70 is pure-hygiene; nothing to install.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `svelte/store` `fromStore` | bundled | Bridge legacy stores into rune-friendly `.current` reads | Already used at multiple sites; pattern reference for Cat A "stable store, destructure ok" exception |
| `svelte` `mount` / `unmount` / `flushSync` | bundled | Component-mount-based reactivity testing | Used by `apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts` — Plan-70-01 reuses for D-03 regression tests `[VERIFIED: codebase]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `$derived(() => x.y)` for Cat A | `// svelte-ignore state_referenced_locally` | LOCKED OUT for fixable cases. Acceptable only where the read is genuinely init-only (e.g. test harnesses — `FilterContextHarness.svelte` uses 4 such silences `[VERIFIED]`). New silences require D-05 `// svelte-warning: accepted —` inline justification. |
| `{@render children()}` for Cat B | Keep `<slot />` + accept warning | LOCKED OUT — `<slot />` is deprecated in Svelte 5 runes mode `[CITED: svelte.dev/docs/svelte/compiler-warnings]`. Migration is one-line. |
| `<button>` for Cat C `<label>` | Add `role="button" tabindex="0"` + handlers | Both valid — planner picks based on visual-design impact. `Input.svelte:521` is custom-styled `<label>` standing in for a hidden file-input trigger; promoting to `<button>` likely simpler. |
| Move fetch into `load()` for Cat D | Move into `onMount()` | Use `load()` if SSR rendering needs the data (no pre-paint blank state); use `onMount()` if data is purely client-side enrichment. CLAUDE.md §"Frontend Data Flow" already canonical for `load()`. |

## Architecture Patterns

### System Architecture Diagram

```
                         Phase 70 Warning Sweep Pipeline
                         ────────────────────────────────

  cold-start protocol (D-04)        svelte-check (yarn check)         dev-server runtime
  ─────────────────────────         ─────────────────────────         ──────────────────
  rm -rf .svelte-kit                static analysis surface           SSR-time fetch trace
  rm -rf node_modules/.vite/                  │                                 │
            │                                 ▼                                 ▼
            ▼                       Cat A / B / C warnings                Cat D warnings
  yarn workspace @openvaa/                 (12 sites)                     (~12 occurrences
   frontend dev                                                            per voter session)
            │                                 │                                 │
            └─────────────────────────────────┼─────────────────────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────────────┐
                                   │  5 parallelizable plans  │
                                   │  ────────────────────    │
                                   │  Plan-70-01 (Cat A)      │
                                   │  Plan-70-02 (Cat B)      │
                                   │  Plan-70-03 (Cat C)      │
                                   │  Plan-70-04 (Cat D)      │
                                   │  Plan-70-05 (BIND-01)    │ ◄── runs LAST when
                                   └──────────────────────────┘     overlapping files
                                              │
                                              ▼
                              ┌──────────────────────────────────┐
                              │  Phase verification gate         │
                              │  ──────────────────────────      │
                              │  cold-start: 0 un-justified      │
                              │              warnings            │
                              │  yarn build: warning-clean       │
                              │  yarn test:unit: green           │
                              │  Playwright parity: 67p/1f/34c   │
                              │  git grep // bind: (keep|ok|     │
                              │             justified): 0 hits   │
                              └──────────────────────────────────┘
```

### Recommended Project Structure (no new files needed)

```
apps/frontend/src/
├── lib/
│   ├── components/
│   │   ├── expander/Expander.svelte       # Cat A — 1 site
│   │   ├── entityFilters/numeric/...      # Cat A — 3 sites
│   │   ├── entityFilters/enumerated/...   # Cat A — 3 sites
│   │   └── input/Input.svelte             # Cat C — 1 site (line 521)
│   ├── admin/components/jobs/
│   │   └── WithPolling.svelte             # Cat B — 1 site (line 28)
│   └── contexts/admin/
│       └── jobStores.svelte.ts            # Cat D candidate (eager fetch trace target)
└── routes/
    ├── admin/login/+page.svelte           # Cat A — 1 site (line 60)
    └── candidate/register/+page.svelte    # Cat A — 2 sites (line 39)
```

### Pattern 1: Category A `state_referenced_locally` fix — `$derived` closure

**What:** Reading a `$state`- or prop-backed value at the top level of `<script>` captures the value once at component init. Subsequent updates do not propagate because the read happens outside the tracking scope. Same hazard class as the v2.6 P61-03 context-destructuring diagnosis.

**When to use:** Every Cat A warning site that needs the read to track updates. Skip the rewrite (and use `// svelte-ignore state_referenced_locally` instead) only where the read is genuinely intended as init-only — `FilterContextHarness.svelte` is the canonical in-tree example `[VERIFIED]`.

**Example — Expander.svelte:76 (init-only — `// svelte-ignore` may be appropriate):**
```svelte
<script lang="ts">
  // BEFORE (line 76):
  let expanded = $state(defaultExpanded);  // Captures initial value only

  // AFTER (Option A — explicit "init-only" intent):
  // svelte-ignore state_referenced_locally
  let expanded = $state(defaultExpanded);  // Init-only: parent does not toggle this prop after mount.

  // AFTER (Option B — propagate updates):
  let expanded = $state(false);
  $effect(() => { expanded = defaultExpanded; });
</script>
```
The choice depends on the prop's intended contract — Plan-70-01 Task 1 audits each site for "is this prop driven post-mount?" and picks Option A or B per call site.

**Example — EnumeratedEntityFilter.svelte:48,65 (read at module-evaluate time, used in `$effect` later):**
```svelte
<script lang="ts">
  // BEFORE:
  const values = filter.parseValues(targets);  // line 48 — both `filter` and `targets` captured once

  // AFTER:
  const values = $derived.by(() => filter.parseValues(targets));
  // OR if the value should genuinely be init-only (parseValues is pure, props don't change):
  // svelte-ignore state_referenced_locally
  const values = filter.parseValues(targets);
</script>
```

**Source:** [svelte.dev/e/state_referenced_locally](https://svelte.dev/e/state_referenced_locally) `[CITED]`. CLAUDE.md §"Context Destructuring Rule" canonical pattern `[VERIFIED]`.

### Pattern 2: Category B `<slot />` → `{@render children()}` migration

**What:** In Svelte 5 runes mode, `<slot />` is deprecated. Layouts and components that accept children must declare `children: Snippet` in `$props()` and render via `{@render children?.()}`.

**Example — WithPolling.svelte (only Cat B site):**
```svelte
<script lang="ts">
  // BEFORE:
  import { onDestroy } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';

  const { jobs: { startPolling, stopPolling } } = getAdminContext();
  startPolling();
  onDestroy(() => stopPolling());

  // AFTER (add children prop):
  import { onDestroy } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';
  import type { Snippet } from 'svelte';

  const { children }: { children?: Snippet } = $props();
  const { jobs: { startPolling, stopPolling } } = getAdminContext();
  startPolling();
  onDestroy(() => stopPolling());
</script>

<!-- BEFORE: -->
<slot />

<!-- AFTER: -->
{@render children?.()}
```

**Source:** [svelte.dev/e/slot_element_deprecated](https://svelte.dev/e/slot_element_deprecated) `[CITED]`. The codebase has 16 layout files already on `{@render children?.()}` `[VERIFIED: grep `+layout.svelte` files] `— this is the only laggard.

### Pattern 3: Category C `a11y_no_noninteractive_element_interactions` fix

**What:** Non-interactive elements (`<label>`, `<div>`, `<p>`, `<li>`) given mouse/keyboard event handlers are invisible to assistive tech. Per WCAG 2.1 AA: use `<button>`, or add `role + tabindex + keyboard handler` (already partial — Input.svelte:521 already has `tabindex="0"` and an `onkeydown` handler).

**Example — Input.svelte:521 (the only Cat C site):**
```svelte
<!-- Context: this is a custom-styled <label> standing in for a hidden file-input click target.
     The actual <input type="file"> is bind:this'd at line 547 and clicked imperatively
     in the onclick handler. Lines 517 and 520 already silence other related warnings via
     // svelte-ignore. -->

<!-- BEFORE (line 521): -->
<label
  id="{id}-image-label"
  tabindex="0"
  class="text-primary flex h-60 justify-stretch"
  class:cursor-pointer={!isDisabled}
  onclick={() => fileInput?.click()}
  onkeydown={handleFileInputLabelKeydown}>
  <!-- ...children... -->
</label>

<!-- AFTER (Option A — promote to <button> matching the actual semantic role): -->
<button
  type="button"
  id="{id}-image-label"
  class="text-primary flex h-60 justify-stretch"
  class:cursor-pointer={!isDisabled}
  disabled={isDisabled}
  onclick={() => fileInput?.click()}
  onkeydown={handleFileInputLabelKeydown}>
  <!-- ...children... -->
</button>

<!-- AFTER (Option B — add role + ensure keyboard handler is sufficient): -->
<!-- svelte-warning: accepted — custom <label> trigger; promoting to <button> would break the
     <label for="{id}"> association used by the screen reader for the actual <input type="file">. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<label
  id="{id}-image-label"
  role="button"
  tabindex="0"
  ...>
```

**Recommendation:** Plan-70-03 Task 1 should test both options in a quick visual smoke. Option A is cleaner per the warning's recommended fix, BUT Option A may break visual styling that depends on `<label>` semantics (e.g. DaisyUI `.label` class). If Option A breaks the look, fall back to Option B with a `// svelte-warning: accepted —` justification.

**Sweep guidance:** Plan-70-03 Task 2 audits other input-control components for the same pattern: `Toggle.svelte`, `Checkbox.svelte` (DaisyUI's checkbox is `<input type="checkbox">` — likely no analogous issue), `Switch.svelte`, etc. The warning surface from svelte-check shows ONLY Input.svelte:521 — so the sweep is small.

**Source:** [svelte.dev/e/a11y_no_noninteractive_element_interactions](https://svelte.dev/e/a11y_no_noninteractive_element_interactions) `[CITED]`. WCAG 2.1 AA (CLAUDE.md §"Important Implementation Notes") `[VERIFIED]`.

### Pattern 4: Category D SSR `fetch`-eagerness fix

**What:** Module-time `fetch()` calls (i.e., `fetch()` invoked at module-evaluation time, NOT inside `load()` / `onMount()` / async functions) run on every SSR request, are not cached by SvelteKit's `load`-function caching, can leak credentials if the request escapes the SSR proxy, and double-fire on hydration. The warning aggregates by message but does not list per-occurrence file in the plugin output — Plan-70-04 Task 1 captures the dev-server stack trace at the time each fires.

**Static-grep shows zero bare module-time fetch calls today** `[VERIFIED — grep results]`:
- `apps/frontend/src/lib/api/utils/auth/providers/{idura,signicat}.ts` — `fetch` inside `async function` body (server-side OIDC token exchange; correct lifecycle).
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:48` — `fetch` inside `async logout()` method.
- `apps/frontend/src/lib/api/base/universalAdapter.ts` — internal `#fetch` is the abstraction; called via `await this.fetch(...)` from within service methods.
- `apps/frontend/src/lib/contexts/admin/jobStores.svelte.ts:32,91` — `fetchAndUpdateJobs()` called from `startPolling()` which is invoked at component-init-time (`WithPolling.svelte:23-24`). On the SERVER, `WithPolling.svelte` mounts during SSR — calling `startPolling()` synchronously schedules `setInterval` AND fires an immediate `fetchAndUpdateJobs()` at line 32 which IS the suspect site.
- `apps/frontend/src/routes/api/cache/+server.ts` — server endpoint, fetch is correct.
- Auth flow `+page.svelte` and `+page.server.ts` — fetch inside form handlers / actions; correct lifecycle.

**The likely Cat D culprit (and Plan-70-04's primary investigation target):** `WithPolling.svelte:24` calls `startPolling()` at component-init time. In SSR, this runs the polling kickoff fetch synchronously before the `onMount` lifecycle gates it to client-only. Move to `onMount` (or guard with `if (browser)`).

**Example fix — WithPolling.svelte:**
```svelte
<script lang="ts">
  // BEFORE:
  import { onDestroy } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';

  const { jobs: { startPolling, stopPolling } } = getAdminContext();
  startPolling();  // Fires fetch at SSR module-eval time — BAD
  onDestroy(() => stopPolling());

  // AFTER (gate via onMount — recommended):
  import { onDestroy, onMount } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';

  const { jobs: { startPolling, stopPolling } } = getAdminContext();
  onMount(() => {
    startPolling();
    return () => stopPolling();
  });

  // OR (gate via $app/environment browser flag):
  import { browser } from '$app/environment';
  if (browser) startPolling();
  onDestroy(() => browser && stopPolling());
</script>
```

**Plan-70-04 Task 1 should:** (a) cold-start `yarn workspace @openvaa/frontend dev`, (b) navigate the voter happy-path, (c) for each `Avoid calling fetch eagerly during server-side rendering` warning, walk the dev-server stack trace to identify the source file, (d) apply Pattern 4 to that site. The CONTEXT.md anchor mentions `apps/frontend/src/lib/api/adapters/supabase/**` as a likely target, but static grep shows **zero** such sites — the actual sites likely surface from contexts that initialise during SSR (the admin polling kickoff is the clearest static-analysis candidate).

**Source:** [SvelteKit issue #14760 — Provide more context for early `fetch` calling error](https://github.com/sveltejs/kit/issues/14760) `[CITED]`. CLAUDE.md §"Frontend (SvelteKit)" `load()` is the canonical SSR data path `[VERIFIED]`.

### Pattern 5: BIND-01 strip codemod

**What:** Remove `// bind: (keep|ok|justified)` rationale comments from `apps/frontend/src/lib/**/*.svelte`. `bind:*` directives stay. Diff is comment-only.

**Critical caveats discovered during research:**

1. **Real count is 27 single-line comments**, not 92 `[VERIFIED: git grep -nE "// bind:" apps/frontend/]`. The 92 in CONTEXT.md is the count of audited `bind:*` directives — Phase 65 SUMMARY documents that multi-bind elements (`<video>` with 5 binds) were covered by single comments, plus 24 of the 27 sites are `// bind: keep — usage example in @component doc` inside `<!--@component -->` doc blocks (not real bindings, just code-example annotations).

2. **One `// bind: migrate —` comment must be PRESERVED** at `apps/frontend/src/lib/components/input/Input.svelte:214` (3 lines). It documents a permanent Svelte-5 migration record (Pattern 1 fix), not a justification for keeping a binding. The strip regex is exactly `// bind: (keep|ok|justified)` — `migrate` is NOT in scope (matches CONTEXT.md and source todo).

3. **Multi-line `// bind:` comments exist** — e.g. `apps/frontend/src/lib/components/video/Video.svelte:117` is 1 line; `Video.svelte:164-165` is 2 lines. The codemod must handle both (single-line removes one line; multi-line removes all consecutive `// ` continuation lines that started with `// bind: keep`).

4. **The codemod target line ranges are stable** — files don't carry the rationale comment in `<!--@component -->` HTML comments (those switched to `// bind:` script-style at Phase 65 D-65-01-2 because nested `<!-- -->` breaks the doc block). Both formats live inside `<script>` blocks today.

**Example — single-line strip:**
```svelte
<!-- BEFORE -->
{#each values as { value, object, count }}
  <label class="label gap-sm cursor-pointer !items-start !p-0">
    <!-- Disable the input if there is only one value -->
    <!-- bind: keep — two-way DOM checkbox group bind:group={selected}; selected is $state -->
    <input type="checkbox" class="checkbox" {value} bind:group={selected} {name} disabled={values.length === 1} />

<!-- AFTER -->
{#each values as { value, object, count }}
  <label class="label gap-sm cursor-pointer !items-start !p-0">
    <!-- Disable the input if there is only one value -->
    <input type="checkbox" class="checkbox" {value} bind:group={selected} {name} disabled={values.length === 1} />
```

**Example — multi-line strip (`Video.svelte:164-165` shape):**
```ts
// BEFORE
  // bind: keep — single-ref `bind:this={video}`; the four below feed
  // two-way DOM `<video>` properties (bind:currentTime/duration/muted/paused).
  let video: HTMLVideoElement | undefined = $state();

// AFTER
  let video: HTMLVideoElement | undefined = $state();
```

**Codemod recipe — recommended approach:**
```bash
# Step 1: Enumerate sites (sanity check before codemod):
git grep -nE "// bind: (keep|ok|justified)" apps/frontend/src/lib/

# Step 2: Per-file targeted edit using sed (or the Edit tool one-by-one):
#   For each file, remove the `// bind: keep —` line AND any subsequent
#   `// ` continuation lines that don't start with another sentinel.
# Step 3: Verify post-strip count is 0:
git grep -nE "// bind: (keep|ok|justified)" apps/frontend/src/lib/  # expected: 0 hits

# Step 4: Verify NO bind:* directives were touched:
git diff --stat HEAD~1 HEAD -- apps/frontend/src/lib/  # only .svelte files; only - lines
git diff HEAD~1 HEAD -- apps/frontend/src/lib/ | grep "^+" | grep "bind:"  # expected: 0
git diff HEAD~1 HEAD -- apps/frontend/src/lib/ | grep "^-" | grep -E "^-\s*<.*bind:"  # expected: 0
```

**Atomic-commit guidance:** Single commit `chore(70-05): strip Phase 65-01 bind: rationale comments — audit complete`. Test gate: `yarn workspace @openvaa/frontend check` warning-clean (no new warnings introduced from comment removal).

### Anti-Patterns to Avoid

- **Don't blanket-add `// svelte-ignore state_referenced_locally`.** That's the silenced-not-fixed path. Add the silence only where the read is genuinely init-only AND the planner has audited the call site. The codebase has 11 existing such silences `[VERIFIED]` — those are not in scope for Phase 70 (don't revisit them).
- **Don't use `// svelte-warning: accepted —` inside `<!--@component -->` doc blocks** — same HTML-comment-nesting hazard documented in Phase 65 D-65-01-2. Use it inside `<script>` blocks only.
- **Don't strip `// bind: migrate —`** at `Input.svelte:214` — that's a permanent record, not an audit-time annotation.
- **Don't rewrite Cat A sites that are inside test harnesses** (`__tests__/*.svelte`). The 7 silences in `FilterContextHarness.svelte` and `GetFilterContextHarness.svelte` are intentional test-time-only reads.
- **Don't introduce new lint-disable comments** that Phase 71's typing-cleanup gate would have to absorb. Phase 70 changes should be lint-clean against the v2.7-close baseline.
- **Don't move SSR `fetch` to `onMount` if `load()` is the right answer.** SSR-needed data should live in `load()` so the page paints with content; `onMount` is for browser-only enrichment.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reactive prop tracking | Manual `$effect` to copy prop into local | `$derived(() => prop.x)` or read `prop.x` at use site | Existing CLAUDE.md §"Context Destructuring Rule" pattern; less code, fewer effects |
| Snippet rendering in layouts | Custom render-prop closure | `{@render children?.()}` | Native Svelte 5; SSR-safe; no manual lifecycle |
| Deferred client-only fetch | Custom `if (typeof window !== 'undefined')` guard | `onMount(() => fetch(...))` or `if (browser)` from `$app/environment` | SvelteKit guards are framework-blessed |
| SSR-needed data fetch | Custom `setTimeout(0)` deferral | `+page.ts` / `+layout.ts` `load({ fetch })` | SvelteKit caches + de-duplicates correctly |
| A11y on custom controls | Custom `keydown` matchers | `<button>` element OR `role + tabindex + keyboard handler` | Native semantics get screen-reader announcement for free |
| Comment-strip codemod | Hand-rolled regex over many files | Per-file `Edit` calls (verifiable diff per file) | 27 sites is small enough; per-file edits give per-file PR review |

**Key insight:** Phase 70 is hygiene over framework-blessed patterns. There is no problem in scope that requires a custom abstraction. Resist the temptation to "fix the underlying issue" (e.g., refactor the polling architecture, restructure the filter components) — that's deferred per CONTEXT.md's `<deferred>`.

## Runtime State Inventory

> Phase 70 is a code-only sweep + comment strip. No data migrations, no live-service config, no OS-registered state, no secrets/env vars, no build artifacts beyond the `.svelte-kit` cache (which the cold-start protocol explicitly wipes).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no schema or persisted-store changes | None |
| Live service config | None — no Supabase migration, no Edge Function changes | None |
| OS-registered state | None — no daemon / cron / pm2 changes | None |
| Secrets/env vars | None — env vars unchanged | None |
| Build artifacts | `.svelte-kit/` cache will be wiped by the cold-start protocol; `node_modules/.vite/` cache will be wiped. Both regenerate automatically on next `yarn dev` / `yarn build`. | None — wipe is the protocol |

**Nothing found in any category** — verified by inspection of the four warning-fix patterns (none of which touch persisted state) and the comment-strip diff (text-only). The `.svelte-kit` and `.vite` cache wipes are part of the verification protocol, not a phase output.

## Common Pitfalls

### Pitfall 1: Cat A — `$derived` wrapping changes semantic timing
**What goes wrong:** Wrapping a previously-init-only read in `$derived` makes the value re-evaluate every time a tracked dep changes. If the original code ASSUMED init-only timing (e.g., `const cookieValue = parseCookie(document.cookie)` at component init, used as a stable identity throughout the component's life), wrapping it in `$derived` may cause unintended re-execution.
**Why it happens:** `$derived` is lazy + memoized but re-runs whenever any tracked source changes. Init-only `let x = expr` runs ONCE.
**How to avoid:** Plan-70-01 Task 1 audits each Cat A site with the question "is this prop / state ever updated post-mount, AND does the consuming code want to re-react?" Y → `$derived`; N → `// svelte-ignore state_referenced_locally` with a one-line "init-only" justification.
**Warning signs:** A Cat A site whose value feeds into an irreversible side effect (e.g., a UUID generator, a one-shot toast) — should stay init-only.
**Sites at potential risk in this phase:**
- `Expander.svelte:76 defaultExpanded` — Plan-70-01 Task 2 must verify whether parents toggle `defaultExpanded` post-mount. Most likely "no" — render-time-only prop. `// svelte-ignore` is the safer pick.
- `EnumeratedEntityFilter.svelte:48 const values = filter.parseValues(targets)` — `values` is read in `<each>` blocks AND used to seed `selected`. If `targets` ever changes, `values` should re-derive — wrap in `$derived.by(...)`. If `targets` is stable (likely — filters don't change targets mid-life), `// svelte-ignore` is fine.
- `NumericEntityFilter.svelte:41 const range = filter.parseValues(targets)` — same shape as EnumeratedEntityFilter, same audit.
- `admin/login/+page.svelte:60 errorMessage` — `errorMessage` is local `$state` updated by form handler; the line-60 read is `if (errorMessage) status = 'error';`. This is genuine init-time-once code (translates `errorParam` → `errorMessage` once at mount, then sets `status` once). `// svelte-ignore` is correct.
- `candidate/register/+page.svelte:39 if (registrationKey) checkKeyAndContinue(registrationKey);` — `registrationKey` is `$state` initialised from URL search-params; the line-39 read is at component init. Genuine init-only. `// svelte-ignore` is correct.

### Pitfall 2: Cat B — `<slot />` migration breaks if children prop type is wrong
**What goes wrong:** After replacing `<slot />` with `{@render children?.()}`, you must also declare `children: Snippet` in `$props()`. Forget the prop declaration → TypeScript errors, runtime undefined-call.
**Why it happens:** Svelte 5 makes `children` a regular prop, not magical.
**How to avoid:** Plan-70-02 Task 1 includes the `import type { Snippet } from 'svelte'` AND the `const { children }: { children?: Snippet } = $props();` declaration as part of the same patch.
**Warning signs:** `svelte-check` errors on the same file post-fix; missing `children` in `$props()` destructure.

### Pitfall 3: Cat C — `<button>` swap breaks DaisyUI `.label` styling
**What goes wrong:** Promoting `<label>` → `<button>` strips the DaisyUI `.label` class semantics (focus rings, padding, flex behaviour). Visual regression.
**Why it happens:** DaisyUI's `.label` class assumes `<label>` element semantics and form-control association.
**How to avoid:** Plan-70-03 Task 1 should test the diff visually (manual smoke or Playwright visual-baseline run). If `<button>` breaks the look, fall back to Pattern 3 Option B (`role="button" tabindex="0"` + keep `<label>`) with `// svelte-warning: accepted —` justification per D-05.
**Warning signs:** Input's image upload zone looks wrong post-fix (loses cursor-pointer, focus ring, or padding). The voter app does NOT exercise this code path (image input is candidate-only — `apps/frontend/src/lib/candidate/`); manual smoke must include candidate profile-image upload.

### Pitfall 4: BIND-01 — multi-line comments split the strip pattern
**What goes wrong:** Naive `sed -i '/\/\/ bind: keep/d'` only deletes the FIRST line of multi-line comments. Continuation lines (e.g., `Video.svelte:165`) survive as orphan `// two-way DOM ...` comments referencing nothing.
**Why it happens:** The regex matches one line; multi-line `//` blocks need a multi-line strip rule.
**How to avoid:** Plan-70-05 Task 1 should:
  (a) For each match of `// bind: (keep|ok|justified)`, ALSO consume any consecutive `// ` lines below that don't start with another known sentinel (`// bind: migrate`, `// svelte-ignore`, `// eslint-disable`, etc.).
  (b) Per-file `Edit` calls give per-file diff review — safer than mass `sed`.
  (c) Verify post-strip diff is COMMENT-ONLY (no `+` lines mentioning `bind:`).

### Pitfall 5: Husky / lint-staged hooks may format the comment-strip diff
**What goes wrong:** Husky hooks run prettier / eslint on staged files. A comment-only strip may trigger Prettier's "remove trailing blank line" / "collapse consecutive blank lines" rule, expanding the diff beyond the intended comment-only scope.
**Why it happens:** Prettier is tied to the husky pre-commit hook in this repo (per `package.json` `"prepare": "husky"`).
**How to avoid:** Use `git -c core.hooksPath=/dev/null commit ...` per the project memory (`project_gsd_repo_hook_workaround.md`). After commit, run `yarn format:check` to confirm no Prettier delta. If Prettier WANTS to edit further, accept those edits as a follow-up commit OR include them in the comment-strip commit (but flag the inclusion in the commit message).
**Warning signs:** `git diff` after staging shows changes outside the comment lines; `yarn format:check` flags the file post-commit.

### Pitfall 6: Cat D — moving fetch to `onMount` breaks SSR-rendered content
**What goes wrong:** If a fetch was eagerly loading data that the page renders during SSR (so the page paints with content), moving to `onMount` makes the page paint blank, then hydrate with content. This is a UX regression even though the warning goes away.
**Why it happens:** `onMount` runs only client-side; SSR sees no data.
**How to avoid:** Plan-70-04 Task 1 audits each Cat D site for "is the fetched data needed during SSR for the initial paint?" Y → move to `+page.ts` / `+layout.ts` `load({ fetch })`. N → move to `onMount` (or guard with `if (browser)`).
**Warning signs:** `WithPolling.svelte` is admin-only — `onMount` is correct (admin polling doesn't need SSR rendering). For any site whose fetched data is in the SSR HTML, prefer `load()`.

### Pitfall 7: svelte-check CI-mode misses Cat D
**What goes wrong:** `yarn workspace @openvaa/frontend check` (svelte-check) finds Cat A/B/C statically but does NOT exercise the SSR runtime — Cat D is only visible in dev-server logs.
**Why it happens:** Cat D fires at fetch invocation time during SSR; svelte-check is static.
**How to avoid:** Plan-70-04 verification MUST run cold-start dev mode, not just `yarn check`. Phase verification gate must include both: `yarn check` (Cat A/B/C clean) + cold-start `yarn dev` voter-flow (Cat D clean).
**Warning signs:** Plan-70-04 declares "warning-clean" based on `yarn check` alone — that's a false positive for Cat D.

## Confirmed Warning Sites — Full Enumeration

> Captured from `yarn workspace @openvaa/frontend check` after `rm -rf apps/frontend/.svelte-kit` on 2026-05-09. Total: **12 warnings**. Run output saved at `/Users/kallejarvenpaa/.claude/projects/-Users-kallejarvenpaa-Desktop-OpenVAA-voting-advice-application-gsd/b8cd8048-7464-4e09-b2c6-99650b591cf4/tool-results/b6to7afyg.txt` (research artifact, not committed).

### Category A — `state_referenced_locally` (9 warnings, 5 files)

| # | File | Line:Col | Symbol | User-visible-bug history? |
|---|------|----------|--------|----------------------------|
| A1 | `apps/frontend/src/lib/components/expander/Expander.svelte` | 76:25 | `defaultExpanded` | NO — pure dev-warning. Expander is render-time-only-prop in 100% of in-tree usages [ASSUMED]. |
| A2 | `apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte` | 41:17 | `filter` | NO — filter is stable per Filter contract [ASSUMED]. |
| A3 | `apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte` | 41:36 | `targets` | NO — targets are stable per parent contract (entity list per scope) [ASSUMED]. |
| A4 | `apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte` | 45:3 | `filter` (2nd ref) | NO — same as A2. |
| A5 | `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte` | 48:18 | `filter` | NO — same shape as A2 (sister component). |
| A6 | `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte` | 48:37 | `targets` | NO — same as A3. |
| A7 | `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte` | 65:3 | `filter` (3rd ref) | NO — same as A2. |
| A8 | `apps/frontend/src/routes/admin/login/+page.svelte` | 60:7 | `errorMessage` | NO — init-time read of `$state` to set `status` from URL `errorParam`; one-shot. |
| A9 | `apps/frontend/src/routes/candidate/register/+page.svelte` | 39:7,44 | `registrationKey` (2 refs on same line) | NO — init-time read of `$state` from URL search-param; one-shot. |

**D-03 verdict:** **0 of 9 Cat A sites need a regression test.** Every site is pure dev-warning; none has a documented user-visible-bug history. Plan-70-01 covers all 9 with the warning-gone gate + manual voter-flow smoke (sufficient per D-03).

**Recommended fix per site (Plan-70-01 Task 2):** For all 9, the audit above suggests `// svelte-ignore state_referenced_locally` with a one-line "init-only" inline comment is correct (Pattern 1 Option A). Confirmation requires a 5-minute audit per site; planner runs the audit and may flip individual sites to `$derived` if any prop turns out to be parent-driven.

### Category B — `slot_element_deprecated` (1 warning, 1 file)

| # | File | Line:Col | Notes |
|---|------|----------|-------|
| B1 | `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` | 28:1 | `<slot />` — sole laggard. The 16 other `+layout.svelte` files in the codebase are already on `{@render children?.()}` `[VERIFIED]`. Apply Pattern 2. |

**Notes:** WithPolling.svelte also overlaps with Cat D (its `startPolling()` at line 24 likely fires the SSR fetch warning). Plan-70-02 + Plan-70-04 both touch this file — order matters per D-02 (BIND-strip last; if Plan-70-02 and Plan-70-04 both edit, Plan-70-04 should land second since the script-block changes are larger).

### Category C — `a11y_no_noninteractive_element_interactions` (1 warning, 1 file)

| # | File | Line:Col | Element | Notes |
|---|------|----------|---------|-------|
| C1 | `apps/frontend/src/lib/components/input/Input.svelte` | 521:9 | `<label>` with `onclick` + `onkeydown` | Custom-styled `<label>` standing in for hidden `<input type="file">` click target. Has `tabindex="0"` AND `onkeydown` already — semantically already a button. Apply Pattern 3 Option A (promote to `<button>`); fall back to Option B if visual regression. |

**Sweep guidance:** No other Cat C sites surfaced from `svelte-check`. Plan-70-03 may scope to this single fix only; the "sweep `Checkbox`/`Radio`/`Switch` analogs" mentioned in CONTEXT.md `<domain>` is a precaution that the current warning surface does not require.

### Category D — SSR `fetch`-eagerness (0 from svelte-check; ~12 expected at dev-server runtime per CONTEXT.md)

**Static-analysis result:** Zero matches in `yarn check`. Cat D fires only at SSR runtime.

**Likely site (1 candidate identified by static reasoning):** `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte:24` — `startPolling()` runs synchronously at component-init, which on the SSR pass triggers the fetch in `jobStores.svelte.ts:32` before `onMount` would gate it client-only.

**Other static candidates investigated and cleared:**
- `apps/frontend/src/lib/api/dataProvider.ts` — re-exports an async-loaded promise; no fetch at module-eval. CLEAR.
- `apps/frontend/src/lib/api/adapters/supabase/**` — every fetch lives inside `async` method bodies, called from `load()` or service callsites. CLEAR.
- `apps/frontend/src/lib/api/utils/auth/providers/{idura,signicat}.ts` — `fetch` inside `async function`. CLEAR.
- All `+page.ts` / `+layout.ts` `load()` functions — `load()` is the canonical SSR fetch path; not module-eval. CLEAR.

**Plan-70-04 task ordering:**
1. **Task 1 (cold-start capture):** `rm -rf apps/frontend/.svelte-kit node_modules/.vite/ && yarn workspace @openvaa/frontend dev 2>&1 | tee /tmp/70-04-dev.log`. Navigate the voter-flow happy path. `grep "fetch.*eagerly" /tmp/70-04-dev.log` for the warning count. Walk dev-server stack traces (visible in HMR output around the warning) to identify per-occurrence file paths. Document each unique site.
2. **Task 2 (apply Pattern 4):** Per site, gate the fetch via `onMount` (client-only data) or move to `+page.ts` / `+layout.ts` `load({ fetch })` (SSR-needed data).
3. **Task 3 (re-verify):** Re-run cold-start; assert zero `fetch.*eagerly` warnings.

**Confidence:** MEDIUM — the WithPolling.svelte hypothesis is informed by static analysis but not runtime-verified. Plan-70-04 Task 1 is the source of truth for the actual surface.

## Plan-by-Plan Implementation Outline

### Plan-70-01 — Category A `state_referenced_locally` rewrites

**Files modified (5):**
- `apps/frontend/src/lib/components/expander/Expander.svelte` (1 site)
- `apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte` (3 sites)
- `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte` (3 sites)
- `apps/frontend/src/routes/admin/login/+page.svelte` (1 site)
- `apps/frontend/src/routes/candidate/register/+page.svelte` (2 sites on same line)

**Wave assignment:** Wave 1 (independent of B/C/D/BIND).
**Plan dependencies:** None.
**Required test additions:** **Zero** per D-03 (no user-visible-bug history on any site).
**Commit cadence:** Atomic per file (5 commits) OR one combined commit `fix(70-01): apply Pattern 1 to 9 state_referenced_locally sites`. Planner picks based on file-by-file review preference. Atomic-per-file is safer for review.

### Plan-70-02 — Category B `<slot />` → `{@render children()}`

**Files modified (1):**
- `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` — line 28 `<slot />` + script-block prop declaration

**Wave assignment:** Wave 1 (independent of A/C/D/BIND).
**Plan dependencies:** None directly. **Soft order with Plan-70-04** since Plan-70-04 also touches WithPolling.svelte (the `startPolling()` SSR fetch fix). Recommendation: Plan-70-04 lands AFTER Plan-70-02 (both are small; sequencing avoids merge friction).
**Required test additions:** None (admin-only component, manual smoke covers).
**Commit cadence:** 1 commit.

### Plan-70-03 — Category C a11y fix

**Files modified (1):**
- `apps/frontend/src/lib/components/input/Input.svelte` — line 521 `<label>` → `<button>` (or `role="button"` fallback)

**Wave assignment:** Wave 1 (independent).
**Plan dependencies:** None.
**Required test additions:** Manual visual smoke for the candidate-app image upload zone (Input.svelte type='image' is candidate-only). Add a one-line entry in the manual smoke checklist; no new automated test needed (D-03 — no user-visible-bug history). If Plan-70-03 lands Pattern 3 Option B (silence + accepted-warning justification) rather than Option A, no visual smoke needed.
**Commit cadence:** 1 commit.

### Plan-70-04 — Category D SSR `fetch`-eagerness

**Files modified (estimated, pending Task 1 capture):**
- `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` (likely; gate `startPolling()` via `onMount`)
- Additional sites surfaced by Task 1 cold-start capture (estimated 0-3 more based on static analysis)

**Wave assignment:** Wave 1 (independent of A/B/C/BIND).
**Plan dependencies:** Soft order — runs AFTER Plan-70-02 if both touch WithPolling.svelte (Plan-70-02 is a 1-line render-tag swap; Plan-70-04 changes the `<script>` block; sequencing avoids overlap).
**Required test additions:** None (admin polling is not in voter-flow; D-03 — no user-visible-bug history on the static candidate).
**Commit cadence:** 1 commit per site identified, or combined per-file. Estimated 1-3 commits.

### Plan-70-05 — BIND-01 strip

**Files modified (estimated, pending file-list re-grep):**
- 27 single-line `// bind: (keep|ok|justified)` comment sites across `apps/frontend/src/lib/{candidate,components,admin,utils,dynamic-components}/**/*.svelte`
- Plus multi-line continuation strips at `Video.svelte:164-165`, `Video.svelte:117` (1-line), and any other multi-line comments matching the regex.

**Wave assignment:** Wave 2 — runs LAST per CONTEXT.md D-02 if any Plan-70-01..04 plan touches a file with `// bind: (keep|ok|justified)` comments. Static-analysis overlap check: 0 of the 5 files Plan-70-01 touches contain `// bind:` comments `[VERIFIED]`; WithPolling.svelte (Plan-70-02 + Plan-70-04 target) contains 0 `// bind:` comments `[VERIFIED]`; Input.svelte (Plan-70-03 target) contains 1 `// bind: keep` comment at line 546 (the `bind:this={fileInput}` annotation). **Plan-70-05 runs after Plan-70-03 to avoid merge friction on Input.svelte.**

**Plan dependencies:** Soft after Plan-70-03 (Input.svelte overlap).
**Required test additions:** None (comment-only diff).
**Commit cadence:** Single atomic commit `chore(70-05): strip Phase 65-01 // bind: (keep|ok|justified) rationale comments — audit complete` (matches the source todo's commit-message guidance).

## Code Examples

### Cold-start verification protocol (D-04, mechanical)
```bash
# Wipe cache
rm -rf apps/frontend/.svelte-kit node_modules/.vite/

# Cold dev-server start; capture warnings
yarn workspace @openvaa/frontend dev 2>&1 | tee /tmp/70-cold-start.log &
DEV_PID=$!

# Wait for readiness, navigate voter-flow happy path manually OR via Playwright
# (the v2.7-close baseline: 67p / 1f / 34c — assert no regression)
# After voter-flow run:
kill $DEV_PID

# Assert zero warnings across A/B/C/D categories
grep -E "(state_referenced_locally|slot_element_deprecated|a11y_no_noninteractive|fetch.*eagerly)" /tmp/70-cold-start.log
# expected: 0 lines (or only `// svelte-warning: accepted —` justified sites)
```

### Static check (Cat A/B/C only)
```bash
yarn workspace @openvaa/frontend check 2>&1 | grep WARNING
# Pre-Phase-70 baseline: 12 warnings (verified 2026-05-09)
# Post-Phase-70 target: 0 warnings (or only accepted-warning sites with inline justification)
```

### BIND-01 strip verification
```bash
# Pre-strip count
git grep -nE "// bind: (keep|ok|justified)" apps/frontend/src/lib/  # expected: 26 hits (across `apps/frontend/src/lib/`)

# Post-strip count
git grep -nE "// bind: (keep|ok|justified)" apps/frontend/src/lib/  # expected: 0 hits

# Untouched bind:* directives count (sanity check — should be unchanged)
grep -rE "(\<|^)bind:" apps/frontend/src/lib/ --include="*.svelte" | grep -v "^.*://" | wc -l
# Pre + post should match (same number of bind: directives in markup)

# Diff is comment-only
git diff HEAD~1 HEAD -- apps/frontend/src/lib/ | grep "^+" | grep -E "(bind:|<input|<button|<label)" | wc -l  # expected: 0
```

### Voter-flow happy path scope (SC-5 parity baseline)
```bash
# Re-run the v2.7-close Playwright baseline; assert no regression
yarn dev:reset-with-data
yarn dev  # background
yarn test:e2e tests/tests/specs/voter/voter-journey.spec.ts \
            tests/tests/specs/voter/voter-results.spec.ts \
            tests/tests/specs/voter/voter-questions.spec.ts \
            tests/tests/specs/voter/voter-matching.spec.ts \
            tests/tests/specs/voter/voter-detail.spec.ts
# Expected: same pass/fail/skip count as the v2.7-close anchor at HEAD 2c7ad2dea (67p / 1f / 34c)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<slot />` for child rendering | `{@render children?.()}` with `Snippet` typing | Svelte 5 (April 2024) | Cat B fix; canonical Svelte 5 |
| Reactive prop tracking via `$:` | `$derived` / `$derived.by` runes | Svelte 5 runes mode | Cat A fix base; CLAUDE.md §"Context Destructuring Rule" |
| Module-eval-time SSR fetch | `+page.ts` / `+layout.ts` `load({ fetch })` | SvelteKit 2.0 | Cat D fix; CLAUDE.md §"Frontend (SvelteKit)" canonical |
| `<label>` with click handler as button | `<button>` element OR `role="button"` + `tabindex="0"` + keyboard | WCAG 2.1 AA + Svelte a11y warnings | Cat C fix |
| Audit-trail rationale comments inline | Permanent rule documented in CLAUDE.md (Context Destructuring Rule) | v2.7 Phase 65 | BIND-01 strip — comments served the audit moment; rationale lives in CLAUDE.md now |

**Deprecated/outdated:**
- `<slot />` in Svelte 5 (only `WithPolling.svelte` still uses it in this codebase).
- `// bind: keep —` rationale comments — audit-trail-only, now redundant.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Static check | svelte-check 4.4.5 (`yarn workspace @openvaa/frontend check`) |
| Unit test | Vitest (`yarn workspace @openvaa/frontend test:unit`) |
| E2E | Playwright (`yarn test:e2e`) |
| Config files | `apps/frontend/vitest.config.ts`, `tests/playwright.config.ts` |
| Quick run command | `yarn workspace @openvaa/frontend check` (Cat A/B/C gate); `yarn workspace @openvaa/frontend dev` (Cat D gate) |
| Full suite command | `yarn workspace @openvaa/frontend check && yarn workspace @openvaa/frontend test:unit && yarn build && yarn test:e2e` |

### Phase Requirements → Test Map
| Req ID / SC | Behavior | Test Type | Automated Command | File Exists? |
|-------------|----------|-----------|-------------------|-------------|
| SC-1 (Cat A) | Zero `state_referenced_locally` warnings on cold-start | static (svelte-check) | `yarn workspace @openvaa/frontend check 2>&1 \| grep state_referenced_locally \| wc -l` (expect 0) | ✅ existing tooling |
| SC-2 (Cat B) | Zero missing-render warnings on cold-start + voter-flow nav | static (svelte-check) + manual nav | `yarn workspace @openvaa/frontend check 2>&1 \| grep slot_element_deprecated \| wc -l` (expect 0) + voter-flow Playwright | ✅ existing tooling |
| SC-3 (Cat C) | Zero a11y warnings (or accepted with `// svelte-warning: accepted —`); `yarn build` warning-clean | static (svelte-check) | `yarn workspace @openvaa/frontend check 2>&1 \| grep a11y_no_noninteractive \| wc -l` (expect 0) + `yarn build` warning grep | ✅ existing tooling |
| SC-1b (Cat D, per D-01) | Zero `fetch.*eagerly` warnings on cold-start dev | dynamic (dev-server log) | cold-start `yarn dev` 2>&1 \| grep "fetch.*eagerly" (expect 0) | ✅ via dev-server output |
| SC-4 (BIND-01) | Zero `// bind: (keep\|ok\|justified)` matches; `bind:*` directives untouched | grep | `git grep -nE "// bind: (keep\|ok\|justified)" apps/frontend/src/lib/` (expect 0) + `git diff` review | ✅ git tooling |
| SC-5 (regression gate) | `yarn build` + `yarn test:unit` + Playwright parity all green | full suite | `yarn workspace @openvaa/frontend check && yarn build && yarn test:unit && yarn test:e2e` | ✅ existing tooling |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend check` (static gate; 30-60s)
- **Per plan merge:** `yarn workspace @openvaa/frontend check && yarn workspace @openvaa/frontend test:unit` (1-2 min)
- **Per phase gate:** Full suite (cold-start dev + svelte-check + build + unit + Playwright voter-flow + bind-grep) before `/gsd-verify-work 70`. Estimated 5-10 min.

### Wave 0 Gaps
- **None — existing test infrastructure covers all phase requirements.** The `apps/frontend/src/lib/contexts/filter/__tests__/FilterContextHarness.svelte` reactivity-test pattern would be the model for any D-03 regression test, but D-03 audit (this RESEARCH §Confirmed Warning Sites) finds zero user-visible-bug-history sites — no regression tests required for this phase.

## Security Domain

**Trigger check:** Phase 70 is a hygiene phase touching only existing UI components and one comment strip. No new trust boundaries, no new attack surface, no auth/data-flow changes.

**ASVS Categories:**
| ASVS Category | Applies | Notes |
|---------------|---------|-------|
| V2 Authentication | no | No auth changes |
| V3 Session Management | no | No session changes |
| V4 Access Control | no | No authz changes |
| V5 Input Validation | no | No new input surfaces |
| V6 Cryptography | no | No crypto changes |

**Threat patterns:** None — Phase 70 is internal hygiene (warning fixes + comment strip) over already-deployed UI code. STRIDE register: T-70-NONE accept.

## Project Constraints (from CLAUDE.md)

The following project-instruction directives apply to Phase 70 work:

- **WCAG 2.1 AA accessibility** (`CLAUDE.md` §"Important Implementation Notes") — Cat C fix must maintain or improve a11y, not regress. Pattern 3 Option A (button promotion) is the preferred WCAG-compliant fix; Option B requires `// svelte-warning: accepted —` justification.
- **TypeScript strictness — avoid `any`** (`CLAUDE.md` §"Important Implementation Notes") — Plan-70-02's `Snippet` type import in `WithPolling.svelte` must be properly typed. No new `any` introductions.
- **Localization — all user-facing strings via i18n** (`CLAUDE.md` §"Important Implementation Notes") — Cat C fix on Input.svelte must NOT change visible text or labels. Image-input alt text already uses `t('components.input.changeImage')`; preserve.
- **Context Destructuring Rule (Svelte 5)** (`CLAUDE.md` §"Context Destructuring Rule (Svelte 5)") — Cat A fixes follow this rule. The rule is permanent in CLAUDE.md (the bind-strip plan relies on this fact).
- **Frontend Data Flow** (`CLAUDE.md` §"Frontend (SvelteKit)") — Cat D fix uses `+page.ts` / `+layout.ts` `load({ fetch })` for SSR-needed data; `onMount(() => fetch(...))` for client-only enrichment. Both are canonical.
- **Code review checklist** (`CLAUDE.md` §"Code Review", `.agents/code-review-checklist.md`) — apply to every PR.
- **Commit hook workaround** (project memory `project_gsd_repo_hook_workaround.md`) — commits use `git -c core.hooksPath=/dev/null` until global config is fixed.

## Assumptions Log

> Claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this to flag decisions needing user confirmation.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Expander.svelte's `defaultExpanded` is a render-time-only-prop in 100% of in-tree usages (no parent toggles it post-mount) | §Pitfall 1, Confirmed Warning Sites A1 | LOW — if a parent does toggle `defaultExpanded`, the silence approach masks a real reactivity bug. Plan-70-01 Task 2 must audit (`git grep "defaultExpanded" apps/frontend/src/lib/ apps/frontend/src/routes/` shows the consumer set). |
| A2 | `filter` and `targets` props in `EnumeratedEntityFilter` and `NumericEntityFilter` are stable per parent contract (do not change post-mount) | §Pitfall 1, Confirmed Warning Sites A2-A7 | LOW — same kind of audit. If a future feature passes a different `targets` array post-mount, the static-init read becomes a real bug. The sister code at `EntityList.svelte` / `EntityListWithControls.svelte` already remounts on filter scope changes via `{#key}` — that's the structural mitigation for stable-targets contract. |
| A3 | The likely Cat D site is `WithPolling.svelte:24` `startPolling()` because it fires synchronously at component-init and the polling kickoff calls `fetch` immediately | §Confirmed Warning Sites Category D | MEDIUM — static analysis suggests this is the only site, but the CONTEXT.md anchor mentions `apps/frontend/src/lib/api/adapters/supabase/**` as a likely target. Plan-70-04 Task 1 cold-start capture is the source of truth. |
| A4 | Pattern 3 Option A (`<button>` promotion) for Input.svelte:521 likely doesn't break visual styling since the file-input click target is a visually-prominent button-like UI ("Add image" / image preview) anyway | §Pitfall 3 | LOW — visual smoke during Plan-70-03 confirms or denies. Fallback (Option B) is well-defined. |

## Open Questions (RESOLVED)

1. **Should Plan-70-04 Task 1 be a separate "capture" plan (60 min: cold-start + walk dev-server traces) before Task 2 implementation?**
   - What we know: Cat D's per-site surface is unknowable from static analysis alone; the cold-start capture is the source of truth.
   - What's unclear: Whether to model Task 1 as a "research-style task within the plan" or split into a separate scout plan first.
   - RESOLVED: Keep Task 1 inside Plan-70-04 (matches the v2.7 Phase 65 pattern of audit-then-fix in one plan). Don't split.

2. **Should the `// svelte-warning: accepted —` convention be added to CLAUDE.md as a permanent format rule (per D-05's "planner may pick a different convention")?**
   - What we know: D-05 specifies `// svelte-warning: accepted — <reason>`. Phase 65 used `// bind: keep —` and `// bind: migrate —`. Both are precedent.
   - What's unclear: Whether to add a one-paragraph CLAUDE.md note documenting `// svelte-warning: accepted —` as the standing pattern for future phases.
   - RESOLVED: Defer to a follow-up todo (NOT folded into Plan-70-03). The CLAUDE.md update is a separate small docs task. Plan-70-03's `<files>` lists only `Input.svelte`, so adding a CLAUDE.md edit would inflate scope; and currently 0 sites use Option B `// svelte-warning: accepted —` (the planning surface is structural fixes per Pattern 3 Option A), so the doc note would be preemptive. Captured at `.planning/todos/pending/2026-05-09-claude-md-svelte-warning-accepted-format.md` and tied to "after Phase 70 lands a real Option B accepted-warning case".

3. **Should Plan-70-05 also strip the 11 existing `// svelte-ignore state_referenced_locally` lines in test harnesses + production sites (e.g., LogoutButton.svelte:55, ConstituencySelector.svelte:51)?**
   - What we know: 11 such silences exist `[VERIFIED]`. They were added pre-Phase-70 (likely Phase 65 or earlier).
   - What's unclear: Whether they're in scope for Phase 70's "leave a clean tree" charter.
   - RESOLVED: **OUT OF SCOPE.** They are deliberate silences with a known intent. CONTEXT.md `<deferred>` doesn't enumerate them; Phase 70 doesn't revisit. A future phase (or a follow-up todo) may audit if needed.

## Sources

### Primary (HIGH confidence)
- Codebase grep — `apps/frontend/src/lib/**/*.svelte`, `apps/frontend/package.json`, `package.json` catalog, `.yarnrc.yml`. Directly verified Svelte ^5.53.12, SvelteKit ^2.55.0, vite-plugin-svelte ^5.1.1, svelte-check ^4.4.5.
- `yarn workspace @openvaa/frontend check` cold-rebuild output — full warning surface enumeration (12 warnings; 9/1/1/0 across A/B/C/D static). Saved at `/Users/kallejarvenpaa/.claude/projects/.../tool-results/b6to7afyg.txt`.
- `git grep -nE "// bind:" apps/frontend/` — verified 27 single-line `// bind:` comments today (26 in `apps/frontend/src/lib/`); 1 is `// bind: migrate —` (preserved); 26 match the strip regex `// bind: (keep|ok|justified)`.
- [svelte.dev/docs/svelte/compiler-warnings](https://svelte.dev/docs/svelte/compiler-warnings) — official `state_referenced_locally`, `a11y_no_noninteractive_element_interactions`, `slot_element_deprecated` definitions and recommended fixes.
- [svelte.dev/e/state_referenced_locally](https://svelte.dev/e/state_referenced_locally) — official Cat A fix-pattern reference.
- [svelte.dev/e/a11y_no_noninteractive_element_interactions](https://svelte.dev/e/a11y_no_noninteractive_element_interactions) — official Cat C fix-pattern reference.
- `CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" — in-tree canonical pattern for Cat A.
- `CLAUDE.md` §"Frontend (SvelteKit)" — in-tree canonical pattern for Cat D `load()`.
- `.planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/65-01-SUMMARY.md` — Phase 65 Plan 01 SUMMARY documenting the 92-bind-directives audit and the `// bind: keep —` convention origin.
- `.planning/REQUIREMENTS.md` §WARN-01, §BIND-01 — phase requirement statements.
- `.planning/ROADMAP.md` §"Phase 70" — SC-1 through SC-5 bar.
- `.planning/phases/70-svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup/70-CONTEXT.md` — locked decisions D-01..D-05.

### Secondary (MEDIUM confidence)
- [GitHub: sveltejs/kit issue #14760 — Provide more context for early `fetch` calling error](https://github.com/sveltejs/kit/issues/14760) — context on Cat D warning's documentation gap.
- [GitHub: sveltejs/svelte issue #11883 — Confusing and unclear warning state_referenced_locally](https://github.com/sveltejs/svelte/issues/11883) — community context on Cat A.
- [GitHub: sveltejs/svelte issue #14450 — a11y: Non-interactive element label cannot have interactive role tab](https://github.com/sveltejs/svelte/issues/14450) — context on the `<label>` interactivity nuance.
- [GitHub: sveltejs/kit Discussions #12571 — Is `fetch()` in Svelte Hooks handle bad](https://github.com/sveltejs/kit/discussions/12571) — community context on Cat D pattern.

### Tertiary (LOW confidence)
- None — all critical claims cross-verified with primary sources.

## Metadata

**Confidence breakdown:**
- Confirmed warning sites (A/B/C surface): **HIGH** — directly verified by `yarn check` cold-rebuild output.
- Cat D static-analysis candidate (WithPolling.svelte:24): **MEDIUM** — informed by static reasoning; needs Plan-70-04 Task 1 cold-start capture for source-of-truth confirmation.
- BIND-01 site count and multi-line caveat: **HIGH** — directly verified by `git grep` and Phase 65 SUMMARY.
- Per-category fix patterns: **HIGH** — official Svelte 5 / SvelteKit docs + in-tree exemplars.
- D-03 verdict (no regression tests needed): **HIGH** — every Cat A site audited as pure dev-warning; no production-bug history exists in `.planning/milestones/`.
- Phase plan ordering and overlap: **HIGH** — file-set overlaps verified by grep.

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (30 days — stable Svelte 5 / SvelteKit 2 surface; no upstream churn expected). After 30 days, re-verify svelte-check warning count against any further Phase 70-pre commits.

---

*Phase: 70-svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup*
*Researched: 2026-05-09*
