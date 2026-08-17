# Phase 72: Package Hygiene Trio - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning
**Milestone:** v2.8 Alliance Card + Frontend Hygiene Sweep (Phase 4 of 4)

<domain>
## Phase Boundary

Three independent package-level cleanups land together, in parallel — each as its own plan, runnable in any order or simultaneously with Phases 69-71:

1. **`@openvaa/app-shared` paradigm normalisation (SHARED-01).** Bring `@openvaa/app-shared` in line with the canonical paradigm of `@openvaa/core` / `data` / `matching` / `filters`: consistent `.js` extension policy on TS-internal imports, flat-vs-nested barrel decision, aligned `package.json` scripts + `exports`. The dual ESM+CommonJS build (kept for backend Edge Function consumption) is preserved AND explicitly justified in a doc-comment. A "this is how all packages look" anchor lands at the agreed location (per D-03).

2. **`mergeSettings` re-export shim retirement (SHARED-02).** Delete `apps/frontend/src/lib/utils/merge.ts`; rewrite every consumer in `apps/frontend/src/lib/**` and `tests/**` to import `mergeSettings` / `DeepPartial` directly from `@openvaa/app-shared`. Inventory and either retire or carry forward any other re-export shims of the same shape in `apps/frontend/src/lib/utils/`.

3. **`@openvaa/supabase` lint-script disambiguation (LINT-01).** The script that runs the SQL linter (`supabase db lint --schema public --fail-on warning`) is renamed to `lint:sql` (or equivalent SQL-specific name); the ESLint script (if any) gets a separate `lint:js` or matches the monorepo `lint:check` convention. **Hard rename per D-02 — no deprecated alias.** Root `package.json`, `turbo.json`, `CLAUDE.md` Supabase Commands section, README, and CI workflow references all updated atomically with the rename.

**In scope (per D-01 plan split — 3 parallelizable plans):**
- **Plan-72-01 — SHARED-01: app-shared paradigm normalisation.** Audit `@openvaa/app-shared` against `@openvaa/core` / `data` / `matching` / `filters`. Pick canonical paradigm (likely the 4-package shape since it's already the majority). Bring app-shared in line: `.js` extensions on TS-internal imports, flat-vs-nested barrel structure, `package.json` `scripts` + `exports`. Preserve dual ESM+CJS build with an explicit justification in a `package.json` field comment or top-of-README doc-comment. Land the "canonical paradigm" anchor doc per D-03.
- **Plan-72-02 — SHARED-02: mergeSettings shim retirement.** Inventory `apps/frontend/src/lib/utils/` for re-export shims. Delete `merge.ts`; rewrite all consumers (`apps/frontend/src/lib/**`, `tests/**`) to import directly from `@openvaa/app-shared`. `git grep -nE "from ['\"]\\\$lib/utils/merge['\"]" apps/frontend/ tests/ packages/` returns zero matches at end of plan. Any other shims discovered: retire (preferred) or capture as a follow-up todo with a reason.
- **Plan-72-03 — LINT-01: supabase lint-script rename.** Rename in `apps/supabase/package.json`. Update root `package.json` (`yarn supabase:lint` script removed, `yarn supabase:lint:sql` added or equivalent). Update `turbo.json` task references. Update `CLAUDE.md` §"Supabase Commands" + README. Update CI workflow references. **No alias retained** — `yarn supabase:lint` stops working at end of plan; muscle memory hits an error and migrates.

All 3 plans are independent. No shared mutation between them. Verification gate runs once at phase close: `yarn build`, `yarn test:unit`, `yarn lint:check`, plus `yarn supabase:lint:sql` (or chosen final name) running the SQL linter against migrations, plus the v2.7-close Playwright parity baseline.

**Out of scope:**
- Paradigm changes to `@openvaa/core` / `data` / `matching` / `filters` (they're the canonical reference, not the target).
- Schema migrations (no Supabase migration files touched).
- Fixing the 4 pre-existing SQL `warning extra` entries from Supabase migrations (`is_localized_string`, `_bulk_upsert_record`, `resolve_email_variables`) — that's a separate cleanup todo.
- Restructuring `@openvaa/app-shared`'s API surface (paradigm normalisation only — no API breakage).
- Removing the dual ESM+CommonJS build (it stays — backend Edge Function consumption depends on it).
- New rules / lint enforcement preventing future re-export shims (the cleanup is the rule for now).
- npm publishing / version bumps (paradigm changes in app-shared are internal-only; no external API change).

</domain>

<decisions>
## Implementation Decisions

### Plan Split

- **D-01: Three parallelizable plans, one per requirement.** Plan-72-01 (SHARED-01), Plan-72-02 (SHARED-02), Plan-72-03 (LINT-01). Independent diffs, runnable in any order or simultaneously. Same model as v2.7 Phase 68 dev-tooling trio. The phase verification gate consolidates all three at close.

### Supabase Lint Rename Strategy

- **D-02: Hard rename — no deprecated alias.** `yarn supabase:lint` stops working; replaced by `yarn supabase:lint:sql` (or planner's equivalent SQL-specific name). All callers (root package.json, turbo.json, CLAUDE.md, README, CI workflow files) updated atomically in Plan-72-03's diff. Cleanest result; one source of truth. Anyone with muscle memory hits a clear error message and updates their command.
- **Rename target naming:** planner's call between `lint:sql`, `lint:db`, `db:lint` — pick whichever already matches monorepo conventions (e.g., if other packages use `lint:<lang>` then `lint:sql`). Default suggestion: `lint:sql`.

### Anchor Doc Location

- **D-03: Both CLAUDE.md (short anchor) + `packages/README.md` (detailed paradigm doc) — UNLESS CLAUDE.md is bloating.** The paradigm anchor lives in two places: a 1-paragraph short anchor in CLAUDE.md pointing to the longer detail doc, and a longer canonical paradigm doc at `packages/README.md` (new file). Discoverable from the file Claude already reads at session start, AND extensible for the rare new-package-creation task.
- **Bloat-judgment escape hatch:** if the planner finds CLAUDE.md is already at risk of bloating (currently ~250 lines; ROADMAP SC-1 implies a "brief doc-comment", not a section), they may opt to put the anchor ONLY in `packages/README.md` and skip the CLAUDE.md addition, citing the user's note "new pkg creation is rare so it may not be useful in all task contexts". Either result satisfies SC-1.

### Canonical Paradigm Verification

- **D-04: 4-package canonical = `@openvaa/core` + `data` + `matching` + `filters`.** Already lint-clean and already the structural majority per the source todo. Plan-72-01's audit confirms which specific paradigms each of the four uses (likely consistent; verify); the dominant pattern wins. Where the four diverge slightly (rare per the source todo), `@openvaa/core` is the tiebreaker since it's the lowest in the dependency graph.

### `.js` Extension Policy

- **D-05: Match the monorepo's TS+ESM convention; verify by grep across the four canonical packages.** The source todo notes this is "a TypeScript + ESM convention used elsewhere in the monorepo, but not consistently applied within app-shared". Plan-72-01's first step is `grep -rE "from '\\..*\\.js'" packages/{core,data,matching,filters}/src/` to confirm the convention; whatever the four packages do, app-shared adopts.

### Dual ESM+CJS Build Justification

- **D-06: Brief doc-comment at top of `@openvaa/app-shared` README OR in `package.json` `description`.** Single sentence: "Builds to both ESM (frontend consumers) and CommonJS (Supabase Edge Functions, which run on Deno but consume CJS for some legacy paths) — both outputs are required and intentional."  Planner picks README vs package.json based on visibility (README is more discoverable; package.json is closer to the code reading it).

### `mergeSettings` Shim Retire — Inventory Discipline

- **D-07: Inventory `apps/frontend/src/lib/utils/` for shape-equivalent shims; retire OR todo.** Plan-72-02's first step is a sweep of `apps/frontend/src/lib/utils/` for files that just `export *` or `export { … } from '@openvaa/*'`. For each: rewrite consumers + delete shim (preferred) OR capture a new todo with a reason if retirement is non-trivial. The source todo flags this as part of "the same family of post-Phase 63 hoist hygiene work".

### Claude's Discretion

- Final SQL-script name (`lint:sql` vs `lint:db` vs `db:lint`) — planner picks per monorepo convention.
- Whether the dual-build justification lives in README or `package.json` description.
- Whether the canonical paradigm doc at `packages/README.md` includes a code-snippet template (e.g., "minimum-viable package.json + tsconfig.json for a new package") or stays prose-only.
- Whether to anchor the "no new re-export shims" rule via lint-config (probably not — too costly), via CLAUDE.md note (maybe), or via convention only (default; matches the source todo's "Apply the same rule going forward" wording).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### v2.8 Milestone Anchors
- `.planning/ROADMAP.md` §"Phase 72: Package Hygiene Trio" — phase goal, dependencies (none), SC-1 (SHARED-01), SC-2 (SHARED-02), SC-3 (LINT-01), SC-4 (regression gate).
- `.planning/REQUIREMENTS.md` §SHARED-01 / §SHARED-02 / §LINT-01 — three single-requirement scope statements.

### Source Todos
- `.planning/todos/pending/2026-04-25-normalise-app-shared-paradigm.md` — SHARED-01 source. Identifies signals: `.js` extensions inconsistency, barrel structure divergence, dual ESM+CJS build divergence-but-intentional.
- `.planning/todos/pending/2026-04-25-remove-mergesettings-reexports.md` — SHARED-02 source. Provenance: v2.6 Phase 63 Plan 01 hoisted `mergeSettings` + `DeepPartial` from `apps/frontend/src/lib/utils/merge.ts` into `@openvaa/app-shared`, leaving the shim as short-term scaffolding.
- `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-02-DEFERRED.md` §2 — LINT-01 source. Symptom + recommended rename approach.

### Upstream Phase Context
- `.planning/milestones/v2.6-phases/63-e2e-template-extension/` — Phase 63 Plan 01 (where `mergeSettings` was hoisted; the shim was added there).
- `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-CONTEXT.md` — Phase 68 lint pipeline addition (uncovered the SQL/JS conflation).

### Canonical Paradigm References
- `packages/core/` — canonical paradigm anchor (lowest in dep graph; tiebreaker per D-04).
- `packages/data/`, `packages/matching/`, `packages/filters/` — corroborating canonical packages.
- `packages/app-shared/` — the target of paradigm normalisation. Current divergence: `.js` extensions inconsistency, barrel structure differences.
- `packages/shared-config/` — ESLint + TS configs (informational; no changes here).

### Project-Level Anchors
- `CLAUDE.md` §"Module Resolution & Dependencies" — current short paradigm note. Possible expansion target for D-03's CLAUDE.md anchor.
- `CLAUDE.md` §"Build System" — Turborepo overview. Possible expansion target for the lint-task description.
- `CLAUDE.md` §"Supabase Commands" — current `yarn supabase:lint` reference; updated by Plan-72-03.
- `apps/supabase/package.json` — current `lint` script definition; renamed by Plan-72-03.
- `package.json` (root) — `supabase:lint` script forwarding; updated by Plan-72-03.
- `turbo.json` — task definitions; updated by Plan-72-03.
- CI workflow files (e.g. `.github/workflows/*.yml`) — `yarn supabase:lint` invocations; updated by Plan-72-03.

### Related (Not Modified)
- `.planning/todos/pending/sql-linting-formatting.md` — broader CI hygiene; out of v2.8 scope.
- The 4 pre-existing SQL `warning extra` entries from Supabase migrations — captured in Phase 68 Plan 02 deferred-tech-debt §3; out of Phase 72 scope.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`@openvaa/core` / `data` / `matching` / `filters`** — already canonical paradigm reference. Plan-72-01's audit reads from these without changing them.
- **Existing v2.7 P68 dev-tooling trio plan structure** — three independent plans for three independent requirements, parallelized, single phase verification gate at close. Phase 72 follows this structural model.
- **Phase 63 Plan 01 hoist commit** — provenance for the `merge.ts` shim. `git log` + `git blame` are authoritative for when the shim was added.

### Established Patterns
- **Three-plan trio for independent package cleanups** — v2.7 P68 used this; Phase 72 reuses it.
- **Hard-rename over deprecated-alias** — same pattern as v2.7 Phase 68 introducing new ESLint rules without retaining the old (un-rule'd) state. Phase 72 LINT-01 applies the same discipline.
- **Canonical-package-as-reference** — when normalising one package against others, the four lint-clean packages serve as the reference. Same pattern as v2.6 P64's "use core/data as the imputation paradigm reference".
- **Inventory-then-retire** — Plan-72-02's "inventory `lib/utils/` for shape-equivalent shims" follows the same audit-then-fix pattern as v2.7 P65's bind-audit + Phase 70's warning-sweep.

### Integration Points
- **Independent of Phases 69-71** — no dependency. Plan-72-* may run in parallel with any other v2.8 phase. The phase-final verification gate is the only synchronisation point.
- **`yarn lint:check` pipeline** — Plan-72-03 changes which workspaces this task covers (the supabase workspace's old `lint` script, which conflated SQL+JS, is split). Verify root `yarn lint:check` is green AFTER the rename + before phase close.
- **`@openvaa/app-shared` consumers** — frontend (`apps/frontend/`) and supabase Edge Functions (`apps/supabase/functions/`). Plan-72-01's paradigm normalisation must preserve both consumption paths — hence the explicit dual ESM+CJS build justification.
- **CI workflow updates (Plan-72-03)** — touches `.github/workflows/*.yml`. Must be tested by running CI on a feature branch before merging, not just locally.

</code_context>

<specifics>
## Specific Ideas

- User explicitly chose three parallel plans (one per requirement) over one combined or two-plan splits.
- User explicitly chose hard-rename for the supabase lint script — no deprecated alias, no soft transition.
- User chose "both CLAUDE.md + packages/README.md UNLESS CLAUDE.md is getting bloated" — explicit acknowledgement that CLAUDE.md size matters for context efficiency, with packages/README.md as the long-form home.

</specifics>

<deferred>
## Deferred Ideas

- **The 4 pre-existing SQL `warning extra` entries** from Supabase migrations (Phase 68 deferred-tech-debt §3): `is_localized_string`, `_bulk_upsert_record`, `resolve_email_variables` × 2. Out of Phase 72 scope; capture in `.planning/todos/pending/` if not already there.
- **Lint enforcement against future re-export shims** — out of scope. Convention via CLAUDE.md note or PR-review attention is the gate; no new lint rule.
- **Restructuring `@openvaa/app-shared`'s API surface** — out of scope. Paradigm normalisation only.
- **Dropping the dual ESM+CJS build** — explicitly preserved (backend Edge Function consumption depends on it). Future: if Edge Functions migrate fully to ESM, this could revisit.
- **npm publishing / version bumps** — paradigm changes are internal-only. No external API change; no publish.

### Reviewed Todos (not folded)
- Both source todos (SHARED-01 + SHARED-02 + LINT-01 source) are folded into this phase. No reviewed-but-deferred items.

</deferred>

---

*Phase: 72-package-hygiene-trio*
*Context gathered: 2026-05-09*
