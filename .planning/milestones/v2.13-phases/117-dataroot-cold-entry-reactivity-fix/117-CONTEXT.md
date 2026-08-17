# Phase 117: dataRoot Cold-Entry Reactivity Fix - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Source:** Debug session `dataroot-stale-direct-nav` + Spike 024 (validated root cause + scope map) — no discuss-phase needed; decisions are locked by evidence.

<domain>
## Phase Boundary

This phase eliminates a **real user-facing reactivity bug** on direct-URL (cold)
entry to data-dependent voter routes, and adds E2E coverage that locks the
regression — unblocking the Phase 116 milestone-close green gate.

**In scope:**
- Rewriting the `const X = $derived(ctx.dataRoot)` intermediate-alias consumers
  (and any same-shape identity-stable `#version`-bridge accessor consumers) to
  read `ctx.dataRoot.<prop>` directly inside the consuming tracking scope.
- A CLAUDE.md "Context Destructuring Rule" carve-out documenting the hole.
- New E2E coverage for cold/direct-URL entry (hard navigation) to the affected
  voter routes.
- Greening the full E2E + unit + typecheck + lint suite (the Phase 116 gate).

**Out of scope:**
- Any broad codemod of all `$derived(ctx.X)` sites. The defect is bounded
  (Spike 024) to identity-stable mutated-in-place accessors. `appSettings`
  (reference-replaced), `locale` (scalar), and value-replacing arrays
  (`selectedElections`/`opinionQuestions`/`matches`) are NOT affected and MUST
  be left unchanged.
- The separate, already-documented **destructure trap** (Spike 019) — distinct
  failure mode, not touched here.
- Any visual/UI redesign. This is a structural reactivity fix; no UI-SPEC.
- Re-architecting how `dataRoot` is provided/loaded. The accessor mechanism
  (stable ref + `#version` counter) is correct and stays.

</domain>

<decisions>
## Implementation Decisions

### Root cause (LOCKED — debug `dataroot-stale-direct-nav` + Spike 024, 4/4 tests)
- `dataRoot` is an identity-stable object; its only reactive signal is a
  `#version` `$state` counter bumped on `DataRoot.update()`. A consumer alias
  `const dataRoot = $derived(ctx.dataRoot)` recomputes on the version bump but
  returns the **same object reference**, so Svelte 5's referential-equality rule
  **skips downstream notification** — the downstream `$derived`/template read
  keeps the empty pre-mount snapshot.
- Cold/direct-URL entry EXPOSES it (data provided after mount); intro→Continue
  MASKS it (data present before the alias first computes).
- This is the same mechanism as spike-CONVENTIONS §9 (reference-stable proxy),
  recurring at the alias layer.

### Fix shape (LOCKED — matches the operator's already-applied elections fix)
- Replace the intermediate alias with a **direct read inside the consuming
  tracking scope**: `const elections = $derived.by(() => ctx.dataRoot.elections)`
  (NOT `const dataRoot = $derived(ctx.dataRoot); ... dataRoot.elections`).
- Apply ONLY to `dataRoot`-shape (identity-stable `#version`-bridge) accessors.
- `apps/frontend/src/routes/(voters)/elections/+page.svelte` is ALREADY FIXED by
  the operator (working-tree change) — it is the canonical in-tree analog, not
  work to redo. Confirm/keep it.

### Scope of the codemod (LOCKED — from the debug Resolution.scope 14-site map)
- The planner MUST first re-enumerate the live `$derived(<ctx>.dataRoot)` /
  `$derived(voterCtx.dataRoot)` / `$derived(candidateCtx.dataRoot)` alias sites
  against the CURRENT tree (elections already fixed) before rewriting — the
  14-site count is from diagnosis time and must be re-verified.
- Highest-confidence cold-entry repro targets: `(voters)/constituencies/+page.svelte`
  (~lines 56-62) and `(voters)/info/+page.svelte`.
- Classify each site: latent-vulnerable (rewrite) vs route-gated/masked vs
  imperative-writer (leave). Only rewrite genuine stale-prone read consumers.

### Documentation (LOCKED)
- Add a carve-out to CLAUDE.md's "Context Destructuring Rule": the canonical
  `const X = $derived(ctx.X)` is safe for value-replacing accessors but has a
  hole for `dataRoot` (and same-shape `#version`-bridge accessors); the safe
  consumption is a direct `ctx.dataRoot.<prop>` read in the tracking scope.
- The spike CONVENTIONS.md anti-pattern entry already exists (Spike 024) — cite,
  don't duplicate.

### Verification (LOCKED — project E2E hard rule)
- Per CLAUDE.md's E2E Hard Rule: failing E2E is a cardinal failure; NO
  "known-flaky" exemptions; the recommended check is the **whole** suite.
- New E2E must assert cold/direct-URL entry (hard navigation, NOT the fixture's
  intro→Continue walk) to `/elections` (+ `/constituencies`, `/info`) renders
  populated data (e.g. `elections.length > 0` / list visible).
- The phase is DONE only when the full E2E suite (incl. a11y-smoke) + unit +
  typecheck + lint are green — which is exactly the Phase 116 GATE-01.

### Claude's Discretion
- Exact Playwright spec/fixture shape for the cold-entry assertion (researcher
  to determine the harness idiom — hard `goto` vs the existing voter-journey
  fixture, seed template, project wiring).
- Whether the cold-entry assertion lives in a new spec or extends an existing
  located-route spec.
- Wave/plan decomposition.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Root cause + scope (authoritative)
- `.planning/debug/dataroot-stale-direct-nav.md` — full diagnosis, eliminated
  hypotheses, Evidence, and the `Resolution.scope` 14-site consumer map.
- `.planning/spikes/024-derived-alias-stable-ref-skip/README.md` — the validated
  affected-vs-not classification (4/4 deterministic tests) + signal-for-the-build.
- `.planning/spikes/024-derived-alias-stable-ref-skip/spike024.svelte.test.ts` —
  the reproduction harness (for the mechanism, not for shipping).

### In-tree analog + the rule
- `apps/frontend/src/routes/(voters)/elections/+page.svelte` — the operator's
  applied fix (direct `ctx.dataRoot` read inside `$derived.by`). Canonical analog.
- `CLAUDE.md` → "Context Destructuring Rule" — the rule that gets the carve-out;
  reactive-accessor inventory (appSettings/dataRoot/locale flattened in Phase 113).
- `.planning/spikes/CONVENTIONS.md` → §9 + the Spike-024 anti-pattern entry.

### Migration provenance
- `.planning/ROADMAP.md` → Phase 113 (handle-flatten that created the bare
  `dataRoot` accessor) and Phase 116 (the gate this phase unblocks).
- `apps/frontend/src/lib/contexts/data/` (dataContext + `#version` bridge),
  `lib/contexts/voter/`, `lib/contexts/candidate/` (the `dataRoot` accessors).

</canonical_refs>

<specifics>
## Specific Ideas

- The Phase 116 blocker was `voter-journey` failing at `elections.length === 0`
  in the Playwright dev-server harness — provisionally filed as a test-harness
  artifact and explicitly NOT root-caused (STATE.md). This phase's E2E coverage
  should reproduce that exact cold-entry failure and prove it fixed.
- Spike 024 proves the contrast WITHIN one accessor: alias read stale, direct
  read live — so a per-site rewrite is sufficient; no provider/loader change.

</specifics>

<deferred>
## Deferred Ideas

- A custom svelte-eslint rule to flag `$derived(ctx.dataRoot)`-shape aliases
  (CLAUDE.md notes lint enforcement of the destructure rule is currently a
  guideline). Out of scope for this fix phase; capture as backlog if desired.
- Auditing non-`dataRoot` `#version`-bridge handles (`answers`/sub-stores) for
  the same shape — note in the plan if any surface, but the gate-unblocking
  scope is the `dataRoot` consumers.

</deferred>

---

*Phase: 117-dataroot-cold-entry-reactivity-fix*
*Context gathered: 2026-06-13 from debug `dataroot-stale-direct-nav` + Spike 024*
