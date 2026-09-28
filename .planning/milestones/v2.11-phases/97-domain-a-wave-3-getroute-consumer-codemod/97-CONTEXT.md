# Phase 97: Domain A Wave 3 — getRoute + Consumer Codemod - Context

**Gathered:** 2026-06-04 (batch discussion — `v2.11-DISCUSSION-POINTS.md`)
**Status:** Ready for planning
**Amended:** 2026-06-05 (D-09 added during `--reviews` revision — folds the getRoute producer rewrite into the atomic codemod commit, reduces phase to 2 plans)

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
- **D-05 (97-3):** **One commit for the mechanical codemod rewrite**, then **separate commits for each manual fix** (AdminNav, adminContext, any hand-edits the review surfaces). Clean revert boundary between mechanical and hand-edited changes. **(Amended by D-09):** the AdminNav + adminContext manual fixes (CONS-03) are the clean standalone FIRST commit(s); the `getRoute` producer rewrite + `appContext.type.ts` type change + the 13 script-block `getRouteState.current(...)` migrations are NOT a separate earlier commit — they FOLD INTO the single atomic mechanical codemod commit (the same one that adds the additive `.current` getters and runs `--apply`), exactly as D-08 already folds the hand-edited additive getters into the mechanical commit. This preserves a single clean-revert boundary: 97-01 (CONS-03 manual fixes) ↔ the atomic codemod commit.

### Codemod script lifecycle
- **D-06 (97-4):** **Delete** `apps/frontend/scripts/spike-009-store-codemod.mjs` from the app tree once Wave 3 lands, but **archive a copy under `.planning/`** (e.g. `.planning/archive/` or alongside the spike-009 dir) for provenance. Its ongoing-protection role is taken over by the Phase 98 ESLint guard.

### Naming (K1)
- **D-07:** No migration-era names introduced; `getRoute` keeps its name in place.

### Pitfall-1 `.current` resolution gap (from RESEARCH O-1 — confirmed by user 2026-06-05)
- **D-08 (Option A):** Resolve the codemod's `appSettings.current.X` / `dataRoot.current` target gap by giving the exported `appSettings` / `dataRoot` / `locale` / `darkMode` an **additive `.current` getter on their original names** (the legacy store shape stays for the same-commit-rewritten consumers). This change lands **atomic with the mechanical codemod commit** so the tree never has a broken intermediate state. **No migration-era `reactive*` names reach shipped consumers** (honors D-07). Phase 98 (Wave 4) then only deletes the now-unused store bridges — it does NOT need a second rename sweep. Rejected Option B (retarget codemod to `reactiveAppSettings.current`) because it ships migration-era names into ~145 consumer sites and forces a redundant 145-site rename in Phase 98.

### getRoute producer/consumer atomicity (added 2026-06-05 — `--reviews` revision; resolves REVIEWS.md HIGH finding)
- **D-09 (atomic-merge — extends D-04/D-05/D-08):** The `getRoute` producer rewrite (`{ readonly current: RouteBuilder }`, D-04) DESTROYS `getRoute`'s `Readable` store shape. The ~133 `$getRoute(opts)` template auto-subscribe sites require `getRoute` to be a `Readable` store (`$getRoute(...)` is store auto-subscribe syntax) and are NOT migrated until the codemod runs. Therefore the producer rewrite MUST land **atomic with the codemod `--apply` commit** (the same commit that adds the additive `.current` getters per D-08 and rewrites the `$getRoute(` template sites) — NOT a wave earlier. In that single commit the "before" state is the old store + `$getRoute(...)` consumers (green) and the "after" state is `{ current }` + codemod-rewritten `getRoute.current(...)` consumers (green): atomic, no red intermediate, mirroring the appSettings/dataRoot/locale/darkMode handling exactly. The 13 script-block `getRouteState.current(...)` migrations + the `appContext.type.ts:65` `getRoute` type change land in the SAME atomic commit. **Phase is reduced from 3 plans to 2:** the former 97-02 (standalone getRoute producer plan) is dissolved — its work folds into 97-02 (the renumbered mechanical-codemod plan). 97-01 (CONS-03 manual fixes) remains the clean standalone first commit (it leaves `getRoute` a store, so AdminNav's `$getRoute(...)` still builds green). Rejected the "transiently-additive bridge" alternative (keep store + add `.current`, codemod, then drop the bridge) because it re-introduces the `afterNavigate`/bridge complexity D-04 removes, for two extra commits.

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
