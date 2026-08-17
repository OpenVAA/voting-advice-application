# Phase 117: dataRoot Cold-Entry Reactivity Fix - Research

**Researched:** 2026-06-13
**Domain:** Svelte 5 runes reactivity (`$derived` referential-equality short-circuit) + SvelteKit Playwright E2E (cold / hard-navigation)
**Confidence:** HIGH

## Summary

The root cause is already proven and validated (debug `dataroot-stale-direct-nav` + Spike 024, 4/4 deterministic tests) and is NOT re-litigated here. `dataRoot` is an identity-stable `DataRoot` object whose only reactive signal is a private `#version` `$state` counter bumped on each `DataRoot.update()`. An intermediate consumer alias `const dataRoot = $derived(ctx.dataRoot)` recomputes on the version bump but returns the same object reference, so Svelte 5's referential-equality rule skips downstream notification — any `dataRoot.<prop>` read off the alias keeps the empty pre-mount snapshot on cold (direct-URL) entry. The fix is per-consumer: drop the alias and read `ctx.dataRoot.<prop>` directly inside the consuming tracking scope (`$derived.by` / template / `$effect`), so the consumer itself takes the `#version` dependency. The provider mechanism (`apps/frontend/src/lib/contexts/data/dataContext.svelte.ts`) is correct and stays. `[VERIFIED: codebase]`

This research delivers the three concrete planner inputs: (1) a re-verified live site map of all 14 `$derived(<ctx>.dataRoot)` alias sites against the current tree, with the operator's elections fix confirmed applied and uncommitted; (2) the cold-entry E2E mechanism — which is **already idiomatic in this repo**: a bare `page.goto('/en/elections')` with NO prior intro walk is the true cold entry, and the harness has working precedent (`perm-disable-*` specs, `navigateDirectlyToQuestions`); (3) a Nyquist Validation Architecture mapping COLD-01/02/03 to observable signals.

**Primary recommendation:** Rewrite the 8 genuinely cold-exposed/latent voter+candidate+admin alias sites to direct `ctx.dataRoot.<prop>` reads (matching the elections fix), leave the imperative writers and `(located)`-gated/already-populated sites unchanged, add a CLAUDE.md carve-out, and add a cold-entry E2E (bare `page.goto('/en/elections')` asserting `voter-elections-list` visible) plus a static grep gate proving zero remaining alias-then-read shapes. Run the full suite (dev server must already be running — there is no `webServer` block in the Playwright config).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| dataRoot reactive provider (`#version` bridge) | Frontend Server (SvelteKit client runtime) | — | The bridge lives in the data context provider; per Spike 024 it is correct and untouched. |
| dataRoot consumer reads (alias→direct rewrite) | Browser / Client (Svelte component reactive scope) | — | The defect is per-consumer; the fix is reading `ctx.dataRoot.<prop>` inside the consuming tracking scope. |
| Cold-entry data provisioning | Frontend Server (loaders / `(located)` layout `$effect`) | — | Data arrives after mount on direct-URL entry; this only EXPOSES the latent consumer bug, it is not changed. |
| Cold-entry regression coverage | E2E (Playwright, dev-server harness) | static grep | Hard-navigation `page.goto` reproduces the empty-list failure; grep locks the codemod scope. |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Root cause (LOCKED):** Svelte 5 `$derived` referential-equality downstream-skip on an INTERMEDIATE alias over an identity-stable `#version`-bridge accessor (`dataRoot`). Do NOT re-diagnose. Cold/direct-URL entry exposes it; intro→Continue masks it.
- **Fix shape (LOCKED):** Replace the intermediate alias with a DIRECT read inside the consuming tracking scope — `const elections = $derived.by(() => ctx.dataRoot.elections)` (NOT `const dataRoot = $derived(ctx.dataRoot); ... dataRoot.elections`). Apply ONLY to `dataRoot`-shape (identity-stable `#version`-bridge) accessors.
- `apps/frontend/src/routes/(voters)/elections/+page.svelte` is ALREADY FIXED by the operator (working-tree change) — canonical in-tree analog; confirm/keep, do not redo.
- **Scope of codemod (LOCKED):** Re-enumerate live alias sites against the CURRENT tree first (the 14-site count is from diagnosis time). Highest-confidence cold-entry repro targets: `(voters)/constituencies/+page.svelte` and `(voters)/info/+page.svelte`. Classify each: latent-vulnerable (rewrite) vs route-gated/masked vs imperative-writer (leave).
- **Documentation (LOCKED):** Add a carve-out to CLAUDE.md's "Context Destructuring Rule": the canonical `const X = $derived(ctx.X)` is safe for value-replacing accessors but has a hole for `dataRoot` (and same-shape `#version`-bridge accessors); the safe consumption is a direct `ctx.dataRoot.<prop>` read in the tracking scope. The spike CONVENTIONS.md anti-pattern entry already exists (Spike 024) — cite, don't duplicate.
- **Verification (LOCKED — project E2E hard rule):** Failing E2E is a cardinal failure; NO "known-flaky" exemptions; check the WHOLE suite. New E2E must assert cold/direct-URL entry (hard navigation, NOT the fixture's intro→Continue walk) to `/elections` (+ `/constituencies`, `/info`) renders populated data. Phase is DONE only when full E2E + unit + typecheck + lint are green (= Phase 116 GATE-01).

### Claude's Discretion
- Exact Playwright spec/fixture shape for the cold-entry assertion (hard `goto` vs existing voter-journey fixture, seed template, project wiring).
- Whether the cold-entry assertion lives in a new spec or extends an existing located-route spec.
- Wave/plan decomposition.

### Deferred Ideas (OUT OF SCOPE)
- A custom svelte-eslint rule to flag `$derived(ctx.dataRoot)`-shape aliases (capture as backlog).
- Auditing non-`dataRoot` `#version`-bridge handles (`answers`/sub-stores) for the same shape — note in plan if any surface, but gate-unblocking scope is the `dataRoot` consumers.
- The separate destructure trap (Spike 019); any visual/UI redesign; re-architecting how `dataRoot` is provided/loaded.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COLD-01 | Codemod the affected alias sites | Live 14-site map below (§Site Table); 8 to rewrite, 1 already fixed, 5 leave. Fix shape = elections/+page.svelte (verified, working-tree). |
| COLD-02 | CLAUDE.md carve-out doc | Exact insertion point identified (§Documentation); reactive-accessor inventory already in CLAUDE.md; cite Spike 024 / CONVENTIONS — don't duplicate. |
| COLD-03 | Cold-entry E2E regression coverage + full suite green | Cold-entry mechanism verified (§Cold-Entry E2E Mechanism): bare `page.goto('/en/elections')`, `data-setup-base` (`e2e/base`) seed, `voter-elections-list` testid assertion. Full-suite commands in §Validation Architecture. |

## Standard Stack

No new packages. This is a pure-source reactivity fix + E2E test addition inside the existing monorepo toolchain.

### Core (existing, in-tree)
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Svelte | 5.x (`$derived` push-pull) | Reactive runtime; the referential-equality short-circuit is the defect mechanism | Project framework |
| SvelteKit | 2.x | Routing; `[[lang=locale]]` prefix, `page.goto` cold entry | Project framework |
| Playwright | (tests workspace) | E2E harness; `page.goto` hard navigation | Existing E2E stack |
| Vitest | (frontend) | Unit/spike harness (Spike 024 repro) | Existing unit stack |

**No installation required.** `[VERIFIED: codebase]`

## Package Legitimacy Audit

Not applicable — this phase installs no external packages. (The only `package.json` working-tree change is a new `db:reset-with-e2e-data` script alias, not a dependency.) `[VERIFIED: git diff package.json]`

## Architecture Patterns

### System Architecture Diagram (the reactivity edge)

```
DataRoot.update(() => dr.provide*Data(...))   [mutates IN PLACE; ref unchanged]
        │
        ▼  subscribe callback
  DataContextProvider.#version++  ($state counter)        ◄── the ONLY reactive signal
        │
        ▼  get dataRoot() { void self.#version; return dataRoot; }   [stable ref + version read]
        │
   ┌────┴─────────────────────────────────────────┐
   │ appContext.dataRoot (own-enumerable forward)  │
   │ voterCtx.#dataRoot / candidateCtx.#dataRoot   │  [forward the SAME stable-ref accessor]
   └────┬─────────────────────────────────────────┘
        │
   ┌────┴────────────────────────────────────┐         ┌──────────────────────────────────────┐
   │ BROKEN consumer:                         │         │ FIXED consumer (operator, elections):  │
   │ const dataRoot = $derived(ctx.dataRoot)  │         │ const e = $derived.by(                 │
   │ const e = $derived.by(()=>dataRoot.elec) │         │   () => ctx.dataRoot.elections)        │
   │   alias recomputes → SAME ref →          │         │   thunk reads ctx.dataRoot directly →  │
   │   downstream-skip → STALE empty snapshot │         │   takes #version dep → re-runs → LIVE  │
   └──────────────────────────────────────────┘        └──────────────────────────────────────┘
```

### Pattern 1: Direct accessor read inside the consuming tracking scope (the FIX)
**What:** Delete the `const X = $derived(ctx.dataRoot)` alias; read `ctx.dataRoot.<prop>` directly inside every `$derived` / `$derived.by` / template / `$effect` that consumes it.
**When to use:** Every latent-vulnerable `dataRoot` consumer (and only `dataRoot`-shape `#version`-bridge accessors).
**Example (verified, the canonical analog):**
```svelte
<!-- Source: apps/frontend/src/routes/(voters)/elections/+page.svelte:43-44 (operator's applied fix) -->
let elections = $derived.by(() => {
  let result = voterCtx.dataRoot.elections;   // direct read → takes #version dep → re-runs on provide
  // ...
});
```
`[VERIFIED: codebase — git diff is exactly alias→direct inside the same $derived.by]`

### Anti-Patterns to Avoid
- **The alias-indirection:** `const dataRoot = $derived(ctx.dataRoot)` then reading `dataRoot.<prop>` downstream. Goes stale on cold entry. This is precisely what the codemod removes.
- **Broad codemod:** Do NOT rewrite all `$derived(ctx.X)` sites. `appSettings` (reference-replaced), `locale` (scalar), and value-replacing arrays (`selectedElections`/`opinionQuestions`/`matches`) propagate through the alias correctly — leave them. `[VERIFIED: Spike 024 4/4 + dataContext source]`
- **Provider changes:** Do NOT touch the `#version` bridge or the `dataRoot` getter — they are correct (Spike 022/024).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reproduce post-mount data provision in a test | A bespoke provider mock | Existing cold-entry `page.goto` precedent (`perm-disable-*`, `navigateDirectlyToQuestions`) | The repo already drives cold/hard navigation idiomatically. |
| Resolve seed UUIDs for a deeplink URL | Hard-code IDs | `resolveSeedUuids()` in `tests/tests/utils/voterNavigation.ts:25-46` | Already caches `e2e/base` election + leaf-constituency UUIDs. |
| Wait for post-hydration list mount | `isVisible({timeout})` (one-shot, ignores timeout) | `waitForVisible()` polling helper / `expect(...).toBeVisible({timeout})` | Documented elections-continue-stall hazard; the list mounts a beat after navigation. |

**Key insight:** Everything the cold-entry E2E needs already exists in the harness. The fix is the new work; the test is a thin assembly of existing helpers.

## Runtime State Inventory

This is a source-reactivity + test phase, not a rename/migration. No stored data, live-service config, OS-registered state, secrets, or build artifacts carry a renamed string.

- **Stored data:** None — no schema/seed string is renamed.
- **Live service config:** None.
- **OS-registered state:** None.
- **Secrets/env vars:** None — no env var name changes.
- **Build artifacts:** None — Svelte source edits only; rebuilt by `yarn dev`/`turbo`.

**Nothing found in any category** — verified by scope (the codemod touches only `.svelte` consumer scopes + one CLAUDE.md doc + one E2E spec).

## Site Table — Live `$derived(<ctx>.dataRoot)` Alias Enumeration (COLD-01)

Re-verified against the CURRENT working tree (2026-06-13). Grep: `grep -rn '\$derived(.*\.dataRoot)' apps/frontend/src/routes apps/frontend/src/lib`. **14 alias sites found** (matches the diagnosis-time count; elections/+page.svelte is no longer an alias site because the operator removed the alias — so 14 remaining aliases + 1 fixed = the 14-site map plus the fixed analog). `[VERIFIED: codebase grep + per-file read]`

| # | File:line | Current shape | Proposed shape | Classification |
|---|-----------|---------------|----------------|----------------|
| — | `routes/(voters)/elections/+page.svelte:44` | **NO alias** — reads `voterCtx.dataRoot.elections` directly in `$derived.by` | (keep) | **ALREADY FIXED** (operator, uncommitted working-tree change) |
| 1 | `routes/(voters)/constituencies/+page.svelte:39` → used at `:59` (`dataRoot.constituencyGroups`) + `:62` (`dataRoot.elections`) | `const dataRoot = $derived(voterCtx.dataRoot)`; read in `$derived.by` (`useSingleGroup`) and `$derived` (`elections`) | Remove alias; read `voterCtx.dataRoot.constituencyGroups` / `voterCtx.dataRoot.elections` directly in each thunk | **REWRITE** — HIGH-confidence cold repro, not `(located)`-gated |
| 2 | `routes/(voters)/info/+page.svelte:19` → template `:41,43,44` (`dataRoot.elections`) | `const dataRoot = $derived(ctx.dataRoot)`; read in template `{#if}` / `{#each}` | Read `ctx.dataRoot.elections` directly in template (or a `const elections = $derived.by(() => ctx.dataRoot.elections)` used in template) | **REWRITE** — cold repro target; not gated |
| 3 | `routes/(voters)/(located)/+layout.svelte:38` → `:93-96` (`dataRoot.update/provide*`) | `const dataRoot = $derived(voterCtx.dataRoot)`; used as WRITER inside `updateAsync()` | (leave) | **LEAVE — imperative writer** (this is the provider/gate; mutates in place inside untracked fn) |
| 4 | `routes/(voters)/(located)/questions/+layout.svelte:59` → `:103` (`dataRoot.getQuestion`) | `const dataRoot = $derived(voterCtx.dataRoot)`; read in a `$derived`/`$derived.by` | Read `voterCtx.dataRoot.getQuestion(...)` directly | **REWRITE (low-risk)** — masked in practice by `(located)` ready-gate, but carries the latent pattern; rewrite for consistency + defence-in-depth |
| 5 | `routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte:43` → `:53` (`dataRoot.getQuestionCategory`) | `const dataRoot = $derived(voterCtx.dataRoot)`; read in `$derived` | Read `voterCtx.dataRoot.getQuestionCategory(...)` directly | **REWRITE (low-risk)** — `(located)`-gated/masked; rewrite for consistency |
| 6 | `lib/dynamic-components/entityDetails/EntityInfo.svelte:47` → `:65` (`dataRoot.elections.length`) | `const dataRoot = $derived(ctx.dataRoot)`; read in template `{#if}` | Read `ctx.dataRoot.elections` directly | **REWRITE (low-risk)** — only renders inside already-populated details routes; latent |
| 7 | `lib/dynamic-components/questionHeading/QuestionHeading.svelte:50` → `:55` (`dataRoot.elections` fallback branch) | `const dataRoot = $derived(ctx.dataRoot)`; read in a `$derived` (fallback branch only) | Read `ctx.dataRoot.elections` directly in the fallback | **REWRITE (low-risk)** — fallback branch; latent |
| 8 | `lib/dynamic-components/entityCard/EntityCard.svelte:82` → `:132` (passes `dataRoot` to helper) | `const dataRoot = $derived(ctx.dataRoot)`; passed into `getCardQuestions`/props | Pass `ctx.dataRoot` directly (read inside the consuming `$derived.by`) | **REWRITE (low-risk)** — masked by already-populated results/details context; latent |
| 9 | `routes/candidate/preregister/(authenticated)/elections/+page.svelte:18` → `:30` (`elections={dataRoot.elections}`) | `const dataRoot = $derived(candCtx.dataRoot)`; template prop | Read `candCtx.dataRoot.elections` directly | **REWRITE** — cold exposure (candidate preregister elections); not `(located)`-gated |
| 10 | `routes/candidate/(protected)/preview/+page.svelte:32` → `:66-67` (`dataRoot.provideEntityData` / `getCandidate`) | `const dataRoot = $derived(ctx.dataRoot)`; used as WRITER inside async | (leave) | **LEAVE — imperative writer** (candidate-side `provide*` + immediate read at call time) |
| 11 | `routes/candidate/(protected)/profile/+page.svelte:39` → `:70-71` (`dataRoot.getElection/getConstituency` inside `{@const}` parse) | `const dataRoot = $derived(candCtx.dataRoot)`; read in a `{@const}` reactive read | Read `candCtx.dataRoot.getElection(...)` directly | **REWRITE (low-risk)** — likely masked by nominations-ref change + protected gate; rewrite for consistency |
| 12 | `routes/candidate/(protected)/questions/[questionId]/+page.svelte:51` → `:75` (`dataRoot.getQuestion`) | `const dataRoot = $derived(candCtx.dataRoot)`; read in `$derived.by` | Read `candCtx.dataRoot.getQuestion(...)` directly | **REWRITE (low-risk)** — protected-gated/masked; rewrite for consistency |
| 13 | `routes/admin/(protected)/argument-condensation/+page.svelte:28` → `:66-67` (imperative reads) + `:136` (`{#each dataRoot.elections}`) | `const dataRoot = $derived(ctx.dataRoot)`; mixed imperative + template `{#each}` | Read `ctx.dataRoot.elections` directly in the template; imperative `:66-67` reads live at call time so are fine either way | **REWRITE** — admin cold exposure for the `{#each dataRoot.elections}` template read |
| 14 | `routes/admin/(protected)/question-info/+page.svelte:29` → `:82-83` (imperative) + `:156` (`{#each dataRoot.elections}`) | `const dataRoot = $derived(ctx.dataRoot)`; mixed imperative + template `{#each}` | Read `ctx.dataRoot.elections` directly in the template | **REWRITE** — admin cold exposure for the `{#each dataRoot.elections}` template read |

**Disposition summary:**
- **ALREADY FIXED (keep):** 1 — `(voters)/elections/+page.svelte` (operator, uncommitted).
- **REWRITE (genuine cold exposure, HIGH priority):** #1 constituencies, #2 info, #9 candidate preregister elections, #13 admin argument-condensation, #14 admin question-info.
- **REWRITE (latent / masked, low-risk, do for consistency + carve-out compliance):** #4, #5, #6, #7, #8, #11, #12.
- **LEAVE — imperative writers:** #3 `(located)/+layout.svelte` (the WRITER/gate), #10 candidate preview (the candidate WRITER).

**Drift vs the debug `Resolution.scope` 14-site map:** No drift in membership. The debug map listed elections as site #1 "ALREADY FIXED" and `(located)/+layout.svelte` + preview as the imperative writers (#14 + preview). The live tree confirms exactly that: the operator removed the elections alias (so it no longer matches the grep), and the remaining 14 grep hits map 1:1 to the debug map's sites #2–#13 + the two writers. **Recommendation for the planner:** rewrite the 5 HIGH + 7 low-risk sites (12 total); leave the 2 writers. The imperative reads at `argument-condensation:66-67` / `question-info:82-83` / `preview:66-67` read the live value at call time and do not need the rewrite, but removing the alias still requires inlining those reads to `ctx.dataRoot.<method>` — handle in the same edit.

## dataRoot Accessor Mechanism Confirmation (planner: fix is per-consumer, not provider-side)

`[VERIFIED: apps/frontend/src/lib/contexts/data/dataContext.svelte.ts]`

- `DataContextProvider` holds `readonly #dataRoot: DataRoot` and `#version = $state(0)` (line 53-54).
- Constructor subscribes: `dataRoot.subscribe(() => untrack(() => { this.#version++; }))` (line 71-75) — the version counter is the sole reactive bridge; the write is `untrack`-wrapped (no self-loop).
- The accessor is installed via `Object.defineProperty(this, 'dataRoot', { get() { void self.#version; return dataRoot; }, enumerable: true })` (line 81-88) — **identity-stable object, reactive only via the version read**. Own-enumerable so it survives `{ ...dataCtx }` spreads.
- Writes go through `setDataRoot = (updater) => untrack(() => updater(this.#dataRoot))` (line 97-99) — arrow field, detach-safe.

**Forwarding accessors (confirmed same stable-ref):**
- `appContext.svelte.ts:187-189` — forwards `dataRoot` as a BARE own-enumerable reactive accessor (spread-safe).
- `voterContext.svelte.ts:163-164` (`get #dataRoot() { return this.#appContext.dataRoot; }`) + `:355` (`readonly dataRoot!`).
- `candidateContext.svelte.ts:108-109` + `:258` — same forward.

**Conclusion for the planner:** The provider + all three forwards return the SAME stable `DataRoot` reference; reactivity is carried only by `#version`. Therefore the fix MUST be per-consumer (read `ctx.dataRoot.<prop>` inside the tracking scope); there is no provider-side change that would help, and changing the provider is explicitly out of scope.

## Cold-Entry E2E Mechanism (COLD-03 — the key research deliverable)

**Verdict: LOW RISK — the mechanism already exists in this repo and is idiomatic.** A true COLD entry is a bare `page.goto('/en/elections')` with NO prior Home→Intro walk. The voter-journey fixture's `walkUntilQuestionsIntro` is the WARM path (it clicks Continue, so data is already provided before the consumer's first compute — this is exactly what MASKS the bug). `[VERIFIED: tests/tests/fixtures/voter/voter-journey.fixture.ts:124-185 + voterIntro.ts:23-30]`

### Existing precedent for cold/hard navigation
- `tests/tests/specs/perm/perm-disable-voter-app.spec.ts:30` — `await page.goto('/en/elections')` (bare cold entry).
- `tests/tests/specs/perm/perm-disable-election-2co.spec.ts:22` — asserts `testIds.voter.elections.list` visibility after a bypass walk.
- `tests/tests/utils/voterNavigation.ts:261-271` — `navigateDirectlyToQuestions()` does `page.goto('${base}/questions?electionId=…&constituencyId=…')` with runtime-resolved seed UUIDs — the hard-nav fallback pattern.
- `tests/tests/utils/voterNavigation.ts:25-46` — `resolveSeedUuids()` caches the `e2e/base` election (`test-e2e-base-el-reg`, `test-e2e-base-el-mun`) + leaf-constituency UUIDs.
- `tests/tests/specs/voter/voter-journey.spec.ts:348-355` — ALREADY does `page.goto(buildRoute({route:'Info'}))` cold, but asserts only `voter-info-content` (a static `{@html}` div, line 37-39) + the return button — it does NOT assert `dataRoot.elections` content, so it does NOT currently catch this bug. The new coverage must assert the data-dependent region. `[VERIFIED: info/+page.svelte:41-53 + spec:348-355]`

### Recommended cold-entry assertion shape
```ts
// New spec or step under the data-setup-base project (e2e/base seed).
// COLD entry: no Home→Intro walk — go straight to the route.
await page.goto('/en/elections');
// Assert the data-dependent list renders (proves dataRoot.elections populated post-mount).
await expect(page.getByTestId(testIds.voter.elections.list))
  .toBeVisible({ timeout: TIMEOUTS.slowPage });
// Optional stronger signal: at least one option present.
await expect(page.getByTestId(testIds.voter.elections.option).first())
  .toBeVisible({ timeout: TIMEOUTS.element });
```
On the OLD alias form this times out (empty list — `{#if elections.length}` never renders, info `{#each dataRoot.elections}` empty); on the fix it renders. `[VERIFIED: elections/+page.svelte:111-119 gate + testIds.ts:130-141]`

### Harness wiring facts the planner needs `[VERIFIED: tests/playwright.config.ts + base.setup.ts]`
- **Seed template:** `data-setup-base` runs `setupFromTemplate('e2e/base')` — multi-election (`el-reg` + `el-mun`) + multi-constituency hierarchy. This is the correct seed (NOT `--likert-only`; that flag is only needed for the voter answer-loop, irrelevant to a list-visibility assertion).
- **Project wiring:** Add the cold-entry assertion to an existing project that `dependencies: ['data-setup-base']` (e.g. extend `voter-journey` with a cold step, OR add a dedicated spec wired to a `data-setup-base`-dependent project). `voter-journey` (config `:212-217`) is the natural home — but note it is `mode: 'serial'` and one long test; a SEPARATE small spec under a `data-setup-base` dependency keeps the cold contract isolated (recommended). Either is acceptable per Claude's Discretion.
- **Locale / route prefix:** All voter routes are under `[[lang=locale]]`; use the `/en/...` prefix explicitly (matches every existing `page.goto`). `buildRoute({route:'Elections', locale:'en'})` is NOT usable for Elections via the limited test builder only if the route demands no extra params — Elections/Constituencies/Info demand none, so `buildRoute` works, but the existing cold specs use literal `/en/elections`; either is fine.
- **Auth/session:** None needed for voter routes (`/en/elections`, `/en/constituencies`, `/en/info` are public). Candidate/admin sites (#9–#14) need auth — the cold E2E should target the VOTER routes (#1, #2) which are the locked highest-confidence repro targets and need no auth.
- **No `webServer` block:** The Playwright config has NO `webServer` — the dev server (`yarn dev`) MUST be running already (port 5173 / `FRONTEND_PORT`). This matches the project E2E Hard Rule (run the whole suite against a live stack).
- **Post-hydration mount hazard:** The elections/constituencies lists mount a beat AFTER navigation (`$dataRoot` provided by a post-hydration `$effect` in `routes/+layout.svelte`). Use a waiting assertion (`toBeVisible({ timeout: TIMEOUTS.slowPage })`) NOT `isVisible()` (one-shot). Documented as the elections-continue-stall hazard. `[VERIFIED: voter-journey.fixture.ts:146-159]`

### Recommended cold targets (locked priority)
1. `/en/elections` — primary (site #1 region; the operator already proved the fix here).
2. `/en/constituencies` — secondary (site #1 in table; needs election context — may require deeplink params via `resolveSeedUuids()` or arriving with elections preselected; verify whether a bare cold `/en/constituencies` redirects when no election is selected).
3. `/en/info` — tertiary (site #2; bare cold `page.goto('/en/info')` + assert election names render, i.e. an assertion STRONGER than the existing content-only step).

**Risk/surprise:** `/en/constituencies` cold entry may redirect to `/en/elections` when no election is selected (its `+page.ts` has redirects — see file header). The planner should confirm whether the constituencies cold assertion needs election query params (use `navigateDirectlyToQuestions`'s `resolveSeedUuids()` pattern to build `?electionId=…`) or whether `/elections` + `/info` cold coverage is sufficient to lock the regression. `/elections` and `/info` are the safest, param-free cold targets.

## Documentation (COLD-02)

**Insertion point:** CLAUDE.md → "### Context Destructuring Rule (Svelte 5)" section, specifically the "**Reactive accessors**" paragraph (item 2) and the "Canonical pattern" block. The reactive-accessor inventory already lists `appSettings`, `dataRoot`, `locale` as flattened in Phase 113. `[VERIFIED: CLAUDE.md Context Destructuring Rule section]`

**Carve-out content (planner drafts; do NOT duplicate the spike):**
- The canonical `const X = $derived(ctx.X)` is the correct READ pattern for value-replacing accessors (`appSettings` reference-replaced, `locale` scalar, the array accessors) — the existing destructure-trap guidance stands for those.
- It has a HOLE for `dataRoot` (and any same-shape identity-stable `#version`-bridge accessor): aliasing `const dataRoot = $derived(ctx.dataRoot)` and reading `dataRoot.<prop>` downstream goes STALE on cold/direct-URL entry, because the alias yields the same `DataRoot` reference every recompute and Svelte 5 skips downstream notification.
- The safe consumption for `dataRoot` is reading `ctx.dataRoot.<prop>` DIRECTLY inside the consuming tracking scope (`$derived.by` / template / `$effect`) — never through an intermediate `$derived` alias.
- Cite (do not duplicate): `.planning/spikes/024-derived-alias-stable-ref-skip/README.md`, `.planning/spikes/CONVENTIONS.md` §9 + the Spike-024 anti-pattern entry, and `.planning/debug/dataroot-stale-direct-nav.md`.

## Common Pitfalls

### Pitfall 1: Over-broad codemod
**What goes wrong:** Rewriting `$derived(ctx.appSettings)` / `$derived(ctx.locale)` / array accessors too.
**Why it happens:** Pattern-matching on `$derived(ctx.X)` without checking accessor shape.
**How to avoid:** Rewrite ONLY `dataRoot` aliases. Spike 024 proves the others propagate correctly.
**Warning signs:** A diff touching files that never reference `dataRoot`.

### Pitfall 2: Leaving the imperative-writer aliases but mishandling their inlined reads
**What goes wrong:** Removing the alias at `(located)/+layout.svelte` / `preview` (the writers) breaks the `dataRoot.update(...)` write path.
**Why it happens:** Treating writers like read consumers.
**How to avoid:** LEAVE sites #3 and #10 entirely. For the mixed sites (#13, #14, and #10's imperative reads), the imperative `getElection`/`findQuestions` calls read live at call time and are safe — but if the alias is removed for the template read, inline those imperative reads to `ctx.dataRoot.<method>` in the same edit.
**Warning signs:** A `dataRoot.update is not a function` or stale entity after preview provide.

### Pitfall 3: Asserting a non-data-dependent anchor in the cold E2E
**What goes wrong:** The test passes on the BROKEN code because it asserts a static element (e.g. `voter-info-content`, the `{@html}` div) rather than the `dataRoot.elections` region.
**Why it happens:** Copying the existing Info step which only asserts static content.
**How to avoid:** Assert `voter-elections-list` / `voter-elections-option` (data-dependent) — these are hidden when `elections.length === 0`.
**Warning signs:** The new test passes even when run against `git stash`'d (pre-fix) source.

### Pitfall 4: Using `isVisible()` instead of a waiting assertion
**What goes wrong:** One-shot `isVisible()` lands in the post-hydration mount window, returns false, test flakes.
**How to avoid:** Use `expect(...).toBeVisible({ timeout: TIMEOUTS.slowPage })`.
**Warning signs:** Intermittent failures in the sub-second window after `goto`.

## Code Examples

### Fix (the canonical analog) `[VERIFIED: codebase]`
```svelte
<!-- BROKEN (the alias-indirection): -->
const dataRoot = $derived(voterCtx.dataRoot);
let elections = $derived.by(() => dataRoot.elections);   // stale on cold entry

<!-- FIXED (elections/+page.svelte:43-44): -->
let elections = $derived.by(() => {
  let result = voterCtx.dataRoot.elections;              // direct read → re-runs on #version
  return result;
});
```

### Cold-entry E2E `[CITED: tests/tests/specs/perm/perm-disable-voter-app.spec.ts:30 + testIds.ts]`
```ts
import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import { TIMEOUTS } from '../../helpers';

test('cold direct-URL entry to /elections renders the populated elections list', async ({ page }) => {
  await page.goto('/en/elections');                       // COLD: no intro walk
  await expect(page.getByTestId(testIds.voter.elections.list))
    .toBeVisible({ timeout: TIMEOUTS.slowPage });          // fails on the OLD alias, passes on the fix
});
```

### Static grep gate (COLD-03 codemod-completeness signal)
```bash
# Must return ZERO hits (outside the two allowed imperative-writer sites) after the codemod:
grep -rn '\$derived(.*\.dataRoot)' apps/frontend/src/routes apps/frontend/src/lib
# Allowed remaining: (voters)/(located)/+layout.svelte (writer), candidate/(protected)/preview/+page.svelte (writer).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `appSettings`/`dataRoot`/`locale` as `{ current }` handles | Bare reactive accessors (handle-flatten) | v2.13 Phase 113 (FLATTEN-02) | Created the bare `dataRoot` accessor whose alias-indirection exposes this bug |
| Per-field `$derived(ctx.X)` alias as universal safe pattern | Direct `ctx.dataRoot.<prop>` read for identity-stable `#version`-bridge accessors | This phase (117) | CLAUDE.md carve-out documents the hole |

**Deprecated/outdated:**
- `const dataRoot = $derived(ctx.dataRoot)` then `dataRoot.<prop>`: now an anti-pattern for `dataRoot` specifically (Spike 024).

## Validation Architecture

> Nyquist validation enabled (config `workflow.nyquist_validation` absent → treated as enabled).

### Test Framework
| Property | Value |
|----------|-------|
| E2E framework | Playwright (`tests/` workspace; `tests/playwright.config.ts`) |
| Unit framework | Vitest (frontend) |
| Config file | `tests/playwright.config.ts` (no `webServer` — live `yarn dev` required) |
| Quick run command | `yarn test:e2e --project=voter-journey` (or the new cold spec's project) |
| Full suite command | `yarn test:e2e` (= `playwright test -c ./tests/playwright.config.ts ./tests`) |
| Lint/type gate | `yarn lint:check` (turbo lint + tests eslint + `yarn typecheck:tests`) |
| Unit gate | `yarn test:unit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COLD-01 | All `dataRoot` alias-then-read sites rewritten to direct reads; no broad codemod | static grep | `grep -rn '\$derived(.*\.dataRoot)' apps/frontend/src/routes apps/frontend/src/lib` returns only the 2 allowed writer sites | ✅ (grep; no new file) |
| COLD-01 | Rewritten consumers compile + lint clean | static | `yarn lint:check` + `yarn build` | ✅ existing |
| COLD-02 | CLAUDE.md carve-out documents the `dataRoot` alias hole | manual/grep | grep CLAUDE.md for the carve-out keyword (e.g. `#version`-bridge / identity-stable) under Context Destructuring Rule | ❌ Wave 0 (doc edit) |
| COLD-03 | Cold direct-URL `/en/elections` renders populated list | E2E | new cold spec: `await expect(getByTestId('voter-elections-list')).toBeVisible()` after `page.goto('/en/elections')` | ❌ Wave 0 (new spec) |
| COLD-03 | Cold direct-URL `/en/info` renders election data region | E2E | extend/assert the `dataRoot.elections` region (stronger than the existing content-only step) | ❌ Wave 0 |
| COLD-03 | Full suite green (Phase 116 GATE-01) | E2E + unit + lint | `yarn test:e2e` && `yarn test:unit` && `yarn lint:check` | ✅ existing |

### Observable signals
- **COLD-01:** grep returns 0 alias-then-read hits outside the 2 writer sites; `git diff` touches only `dataRoot` consumers + the 2 writers' inlined reads.
- **COLD-02:** CLAUDE.md contains the carve-out paragraph citing Spike 024.
- **COLD-03:** the cold spec FAILS against pre-fix source (`git stash` the elections fix + re-add an alias to confirm) and PASSES against the fix; full `yarn test:e2e` green.

### Sampling Rate
- **Per task commit:** the relevant single spec/project + `yarn lint:check` on the touched files.
- **Per wave merge:** `yarn test:e2e --project=voter-journey` (+ cold spec project) + `yarn test:unit`.
- **Phase gate:** full `yarn test:e2e` (incl. a11y-smoke, perm family) + `yarn test:unit` + `yarn lint:check` all green = Phase 116 GATE-01.

### Wave 0 Gaps
- [ ] New cold-entry E2E spec (or step) under a `data-setup-base`-dependent project — covers COLD-03.
- [ ] CLAUDE.md carve-out edit — covers COLD-02.
- [ ] (No framework install needed — Playwright + Vitest already wired.)

*Negative-control recommendation:* before declaring COLD-03 done, run the new spec once against the pre-fix source (or with the alias re-introduced) to confirm it RED-fails — proving the test actually exercises the regression.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Local Supabase + `yarn dev` (port 5173) | E2E (no `webServer` in config) | assumed (operator runs it) | local | none — required for `yarn test:e2e` |
| `e2e/base` seed (`data-setup-base`) | cold-entry E2E | ✓ (built-in template) | — | — |
| Playwright browsers | E2E | ✓ (`yarn playwright install`) | — | — |

**Missing dependencies with no fallback:** The dev server must be running (`yarn dev`) before `yarn test:e2e` — the config has no `webServer` block. The planner should include a "dev server up + DB seeded" precondition in the E2E task.

## Open Questions

1. **`/en/constituencies` cold entry redirect.**
   - What we know: `constituencies/+page.ts` has redirects (file header); cold entry without a selected election may bounce to `/elections`.
   - What's unclear: whether the constituencies cold assertion needs `?electionId=` query params.
   - Recommendation: Lock COLD-03 on `/en/elections` + `/en/info` (param-free, no-auth, highest-confidence). Treat `/en/constituencies` as optional/best-effort using `resolveSeedUuids()` deeplink params if the planner wants a third target.

2. **New spec vs extend voter-journey.**
   - What we know: `voter-journey` is `mode: 'serial'`, one long test; it already has a cold `/info` step.
   - Recommendation: a small dedicated cold spec under a `data-setup-base`-dependent project keeps the cold contract isolated and the negative-control re-run cheap. (Claude's Discretion per CONTEXT.md.)

## Sources

### Primary (HIGH confidence)
- `.planning/debug/dataroot-stale-direct-nav.md` — root cause + `Resolution.scope` 14-site map (locked, not re-diagnosed).
- `.planning/spikes/024-derived-alias-stable-ref-skip/README.md` — 4/4 validated affected-vs-not classification.
- `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` — `#version` bridge + stable-ref accessor (lines 52-100).
- `apps/frontend/src/routes/(voters)/elections/+page.svelte:43-44` — operator's applied fix (verified via `git diff`).
- `apps/frontend/src/routes/**` + `lib/dynamic-components/**` — live grep + per-file read of all 14 alias sites.
- `tests/tests/fixtures/voter/voter-journey.fixture.ts`, `tests/tests/utils/voterNavigation.ts`, `tests/tests/utils/voterIntro.ts`, `tests/playwright.config.ts`, `tests/tests/utils/testIds.ts`, `tests/tests/specs/perm/perm-disable-*.spec.ts`, `tests/tests/specs/voter/voter-journey.spec.ts` — E2E harness.
- `CLAUDE.md` — Context Destructuring Rule + reactive-accessor inventory.

### Secondary (MEDIUM confidence)
- `Resolution.scope` Svelte 5.53.12 `$derived` push-pull docs (cited in debug doc; referential-equality downstream-skip).

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all tooling in-tree and verified.
- Site map: HIGH — grep + per-file read; 1:1 reconciled with the debug map, no drift.
- Accessor mechanism: HIGH — read directly from `dataContext.svelte.ts` + all three forwards.
- Cold-entry E2E mechanism: HIGH — existing `page.goto` cold precedent + `resolveSeedUuids` + testIds all verified.
- Validation Architecture: HIGH — commands verified against root `package.json` scripts + Playwright config.

**Research date:** 2026-06-13
**Valid until:** 2026-07-13 (stable; source-internal, no external dependency churn)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The local dev server + seeded DB are running when E2E executes (no `webServer` block) | Environment Availability | E2E cannot run; planner must add an explicit precondition task |
| A2 | `/en/constituencies` cold entry may redirect without a selected election | Open Questions / Site Table #1 | Constituencies cold target may need deeplink params; mitigated by locking COLD-03 on `/elections` + `/info` |
| A3 | Low-risk masked sites (#4-#8,#11,#12) are safe today but rewritten for consistency | Site Table | If left unrewritten, the carve-out's "zero alias-then-read" grep gate would still flag them; rewriting is the conservative choice |
