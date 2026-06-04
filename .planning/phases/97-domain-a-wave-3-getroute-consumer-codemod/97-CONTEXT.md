# Phase 97: Domain A Wave 3 — getRoute + Consumer Codemod - Context

**Gathered:** 2026-06-04 (batch discussion — `v2.11-DISCUSSION-POINTS.md`)
**Status:** Ready for planning

<domain>
## Phase Boundary

`getRoute` becomes rune-native, and every consumer site across the frontend (146 `$store.X` template auto-subscribe sites in 45 `.svelte` files + 134 `$getRoute(opts)` call sites) is mechanically migrated off the store bridges — surfacing and fixing the real `AdminNav` destructure production bug and the `adminContext` spread-of-context anti-pattern.

**Depends on:** Phases 95 + 96. Independent of Domain B.
Requirements: **CTX-08, CONS-01, CONS-02, CONS-03**. **UI hint: yes.**
</domain>

<decisions>
## Implementation Decisions

### Production-bug fix ordering
- **D-01 (97-2):** Fix `AdminNav.svelte:33` (`isAuthenticated` destructure) + `adminContext.svelte.ts:97` (spread-of-context anti-pattern) as the **FIRST task of the phase, BEFORE running the codemod.** The codemod's destructure-trap audit pass then verifies the fix. (Matches spike-009 guidance: "fix before codemod runs.")

### Codemod execution + review
- **D-02 (97-1):** **Run the codemod → human-review the full diff → commit.** Do not auto-apply blind. The review is where regressions and any remaining destructure traps surface across the 280 sites.
- **D-03:** The codemod is idempotent + dry-run-by-default; it rewrites `$store.X` → `ctx.current.X` / local `$derived` aliases and migrates the 134 `$getRoute(opts)` call sites to the rune-native `getRoute`.

### getRoute (CTX-08)
- **D-04:** `getRoute` becomes a pure `$derived.by` reading `page.params` / `page.route` / `page.url` as **separate fields** (never `page` as a whole value inside a tracking scope — Pattern 3). The custom `afterNavigate` republish workaround AND the `writable<RouteBuilder>` store are removed.

### Commit shape
- **D-05 (97-3):** **One commit for the mechanical codemod rewrite**, then **separate commits for each manual fix** (AdminNav, adminContext, any hand-edits the review surfaces). Clean revert boundary between mechanical and hand-edited changes.

### Codemod script lifecycle
- **D-06 (97-4):** **Delete** `apps/frontend/scripts/spike-009-store-codemod.mjs` from the app tree once Wave 3 lands, but **archive a copy under `.planning/`** (e.g. `.planning/archive/` or alongside the spike-009 dir) for provenance. Its ongoing-protection role is taken over by the Phase 98 ESLint guard.

### Naming (K1)
- **D-07:** No migration-era names introduced; `getRoute` keeps its name in place.

### Claude's Discretion
- Exact archive path under `.planning/` for the codemod script.
- Batching of the manual-fix review (single pass vs file-group passes) as long as D-02's review-before-commit holds.
</decisions>

<specifics>
## Specific Ideas
- This is the highest-blast-radius phase (280 sites + admin auth). Existing E2E suite must stay green; admin auth-context `$derived` accessors must react correctly post-fix.
- **UI hint:** admin nav / auth-gated surfaces are touched — verify visually + via E2E that auth state still drives nav rendering.
</specifics>

<canonical_refs>
## Canonical References — MUST read before planning/implementing
- `Skill("spike-findings-voting-advice-application-gsd")`.
- Spikes: `009-store-codemod-feasibility`, `012-getroute-rune`.
- `.planning/v2.11-DECISIONS.md`.
- `CLAUDE.md` → "Context Destructuring Rule (Svelte 5)".
- The codemod script (`apps/frontend/scripts/spike-009-store-codemod.mjs`) + its in-header notes.
</canonical_refs>
