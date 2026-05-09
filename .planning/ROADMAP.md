# Roadmap: OpenVAA

## Milestones

- ✅ **v2.5 Dev Data Seeding Toolkit** — Phases 56-59 (shipped 2026-04-24)
- ✅ **v2.6 Svelte 5 Migration Cleanup** — Phases 60-64 (shipped 2026-04-28)
- ✅ **v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends** — Phases 65-68 (shipped 2026-05-08)
- 🚧 **v2.8 Alliance Card + Frontend Hygiene Sweep** — Phases 69-72 (started 2026-05-08)

See `.planning/MILESTONES.md` for cumulative history and `.planning/milestones/` for archived roadmaps + requirements.

## Phases

<details>
<summary>✅ v2.5 Dev Data Seeding Toolkit (Phases 56-59) — SHIPPED 2026-04-24</summary>

- [x] Phase 56: Generator Foundations & Plumbing (10/10 plans) — completed 2026-04-23
- [x] Phase 57: Latent-Factor Answer Model (7/7 plans) — completed 2026-04-23
- [x] Phase 58: Templates, CLI & Default Dataset (10/10 plans) — completed 2026-04-23
- [x] Phase 59: E2E Fixture Migration (7/7 plans) — completed 2026-04-24

Full details: `.planning/milestones/v2.5-ROADMAP.md`

</details>

<details>
<summary>✅ v2.6 Svelte 5 Migration Cleanup (Phases 60-64) — SHIPPED 2026-04-28</summary>

- [x] Phase 60: Layout Runes Migration & Hydration Fix (5/5 plans) — completed 2026-04-24
- [x] Phase 61: Voter-App Question Flow (3/3 plans) — completed 2026-04-25
- [x] Phase 62: Results Page Consolidation (3/3 plans) — completed 2026-04-26
- [x] Phase 63: E2E Template Extension & Greening (3/3 plans) — completed 2026-04-27
- [x] Phase 64: Voter Results Reactivity Completion (Phase 62-bis) (4/4 plans) — completed 2026-04-28

Full details: `.planning/milestones/v2.6-ROADMAP.md`

</details>

<details>
<summary>✅ v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends (Phases 65-68) — SHIPPED 2026-05-08</summary>

- [x] Phase 65: Svelte 5 Audit Sweeps (3/3 plans) — completed 2026-04-29
- [x] Phase 66: Adapter Type Cleanup (1/1 plan) — completed 2026-04-29
- [x] Phase 67: Default Seed Alliances (2/2 plans) — completed 2026-04-30
- [x] Phase 68: Dev-Tooling Trio (3/3 plans) — completed 2026-05-08 _(95 pre-existing frontend lint errors deferred per Option C)_

Full details: `.planning/milestones/v2.7-ROADMAP.md`
Audit: `.planning/milestones/v2.7-MILESTONE-AUDIT.md` (status: tech_debt — 8/8 reqs wired; 3 documented deferrals)

</details>

### 🚧 v2.8 Alliance Card + Frontend Hygiene Sweep (In Progress)

**Milestone Goal:** Close v2.7's deferred Svelte 5 / typing / lint / packaging loose ends and finish the alliance card render path, in one cohesive frontend hygiene + small-UI-feature milestone. The 7 requirements split as 1 small user-facing UI feature (alliance card Lane A — reconciles v2.7 SEED-01 SC-2 PASS-WITH-CONCERNS) plus 6 frontend / package hygiene items that pay interest forward into v2.9 (E2E coverage) and v3.x (multi-tenant). All work is frontend / package-level — no Supabase migrations, no E2E coverage expansion (E2E is the v2.9 anchor).

- [x] **Phase 69: Alliance Card Lane A** — Voter results "Alliances" tab renders a working entity card per alliance (name + member organizations + summary), with the EntityCard subentities branch extended to handle `AllianceNomination → OrganizationNomination` and the drawer-open path working end-to-end on the v2.7 SEED-01 default seed (completed 2026-05-09)
- [x] **Phase 70: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup** — All three categories of dev/build warnings surfaced during v2.7 Phase 67 UAT (`state_referenced_locally`, missing `<slot />` / `{@render children()}`, a11y) resolved or accepted with inline justification, and the 92 inline `// bind: keep —` rationale comments from v2.7 Phase 65 Plan 01 are removed (rationale is permanently captured in CLAUDE.md) (completed 2026-05-09)
- [ ] **Phase 71: Frontend Strict-Typing Cleanup** — The 95 pre-existing `apps/frontend/` ESLint errors deferred under v2.7 Phase 68 Option C are resolved (~67 `no-explicit-any`, ~13 `naming-convention`, ~11 `func-style`, ~4 long-tail); frontend matches the rest of the monorepo's lint-clean baseline
- [x] **Phase 72: Package Hygiene Trio** — `@openvaa/app-shared` paradigm normalised against `@openvaa/core` / `data` / `matching` / `filters`; the `apps/frontend/src/lib/utils/merge.ts` re-export shim retired in favour of direct `@openvaa/app-shared` imports; `@openvaa/supabase` lint-script disambiguated (SQL vs ESLint pipelines) (completed 2026-05-09)

## Phase Details

### Phase 69: Alliance Card Lane A
**Goal**: After `yarn dev:reset-with-data`, voters who navigate to the "Alliances" tab on the results page see populated alliance cards (name, member organizations sub-list, "X candidates across N parties" summary), can click through to an alliance detail drawer with member-organizations rendered, and the v2.7 SEED-01 SC-2 PASS-WITH-CONCERNS deferral is reconciled.
**Depends on**: Nothing (first phase of v2.8; runs over the v2.7-close baseline at HEAD post-Phase-68; the v2.7 SEED-01 default seed already ships 2 alliances + 10 alliance-noms + 30/10 org-nom parent split, so the data is in place)
**Requirements**: ALLIANCE-01
**Success Criteria** (what must be TRUE):
  1. `EntityCard.svelte`'s `subentities` branch — currently hard-coded to `OrganizationNomination → CandidateNomination` per the v2.7 Phase 67 fix-forward — handles `OBJECT_TYPE.AllianceNomination → OrganizationNomination` correctly. The `cardContents` union is widened to include `'organizations'` (or the equivalent shape decision is captured in a doc-comment beside the type) so alliance-specific card content can be requested without leaking into other entity types.
  2. After `yarn dev:reset-with-data`, the voter results page's "Alliances" entity tab renders a populated card per seeded alliance — at minimum each card shows (a) the alliance name, (b) member organizations as a sub-list, and (c) an "X candidates across N parties" summary derived from the v2.6 P64 reverse-filled `organizationNominationIds`. No empty cards, no `cardContents` runtime errors.
  3. Clicking an alliance card opens the entity detail drawer; the drawer's tab structure is appropriate for an alliance entity (info + member organizations; no opinions tab since alliances do not own answers). Member-org rendering inside the drawer reuses the existing organization-nomination rendering surface — no new bespoke components for the drawer body.
  4. A 5-step manual smoke (tab visible → cards populated → click-to-drawer → member orgs render in the drawer → return to list) passes on a clean `yarn dev:reset-with-data` start. The v2.7-close Playwright parity baseline continues to pass — no E2E regressions from the EntityCard / cardContents changes.
**Plans**: 2 plans
- [x] 69-01-PLAN.md — Type rename ('candidates' → 'children') + alliance render path (EntityCard + EntityDetails) + route-matcher widening + +layout.svelte tab handling + dev-seed templates + i18n + fixture pin updates [Wave 1]
- [x] 69-02-PLAN.md — Cascading-impute pipeline (imputeParentAnswers childProxies generalisation + matchStore Alliance branch) + regression-guard unit test + manual smoke + broader-refactor todo capture [Wave 2, depends on 01] (completed 2026-05-09; parity gate deferred to follow-up todo per executor fallback — `yarn dev` was active for SC-4 smoke)
**UI hint**: yes

### Phase 70: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup
**Goal**: All three categories of vite-plugin-svelte / SvelteKit warnings surfaced during v2.7 Phase 67 UAT (`state_referenced_locally`, missing `<slot />` / `{@render children()}`, a11y) are resolved or carry an inline justification, and the 92 single-line `// bind: keep —` rationale comments left over from v2.7 Phase 65 Plan 01 are removed — leaving a clean, audit-noise-free `apps/frontend/src/lib/**/*.svelte` tree backed by the permanent CLAUDE.md "Context Destructuring Rule" reference.
**Depends on**: Phase 69 (warning sweep includes any warnings introduced by the Phase 69 EntityCard / cardContents changes; ordering keeps the sweep against a single moving target rather than two)
**Requirements**: WARN-01, BIND-01
**Success Criteria** (what must be TRUE):
  1. **Category A — Svelte 5 reactivity hazards.** Every `state_referenced_locally` warning surfaced by a fresh `yarn dev` from a cleaned `apps/frontend/.svelte-kit` + `node_modules/.vite/` start (e.g., `Expander.svelte:76 defaultExpanded`, `EnumeratedEntityFilter.svelte:48 filter`, plus any others the cold start surfaces) is rewritten using direct property access or `$derived` so the prop/state read happens inside the tracking scope. Pattern matches the v2.6 P61-03 / v2.7 Phase 65 context-destructuring rule recorded in CLAUDE.md.
  2. **Category B — Missing `<slot />` / `{@render children()}`.** Every site that triggers the missing-render warning is fixed (or, if the site intentionally renders nothing, the omission is documented inline beside the component definition). Cold `yarn dev` + voter happy-path navigation produces zero un-justified missing-render warnings.
  3. **Category C — A11y warnings.** Every WCAG 2.1 AA-relevant warning (label associations, `aria-*` attributes, keyboard handling) is fixed at the source site. Cosmetic-only warnings, if any, are accepted with an inline justification. `yarn build` for `@openvaa/frontend` is warning-clean across these categories (or, where a warning is accepted, the inline justification is captured on the source line).
  4. The 92 `// bind: keep — <rationale>` single-line comments added by v2.7 Phase 65 Plan 01 are stripped from `apps/frontend/src/lib/**/*.svelte` with the underlying `bind:*` directives left in place untouched. `git grep -nE "// bind: (keep|ok|justified)" apps/frontend/src/lib/` returns zero matches; the diff for that workstream is comment-only (no behavioral changes).
  5. `yarn build` and `yarn test:unit` remain green; the v2.7-close Playwright parity baseline continues to pass — no E2E regressions from the warning fixes or comment strip.
**Plans**: 5 plans
- [x] 70-01-PLAN.md — Cat A `state_referenced_locally` rewrites (5 files, 9 sites; LogoutButton.svelte analog) [Wave 1]
- [x] 70-02-PLAN.md — Cat B `<slot />` → `{@render children?.()}` (WithPolling.svelte 3-part Snippet patch) [Wave 1]
- [x] 70-03-PLAN.md — Cat C a11y fix (Input.svelte:521 `<label>` → `<button>` Option A; Option B fallback if visual smoke fails) [Wave 1, has checkpoint]
- [x] 70-04-PLAN.md — Cat D SSR fetch-eagerness (cold-start capture + `onMount` wrap; primary site WithPolling.svelte:24) [Wave 1]
- [x] 70-05-PLAN.md — BIND-01 strip 26 `// bind: (keep|ok|justified)` comments across 24 files; preserve `// bind: migrate` block [Wave 2, depends on 70-03]
**UI hint**: yes

### Phase 71: Frontend Strict-Typing Cleanup
**Goal**: The 95 pre-existing `apps/frontend/` ESLint errors deferred under v2.7 Phase 68 Option C are resolved at the source — every `no-explicit-any` becomes a real type or a runtime-narrowed `unknown` with an inline justification; every `naming-convention` and `func-style` error is fixed at the source site without per-rule disable comments — bringing the frontend in line with the rest of the monorepo's lint-clean baseline.
**Depends on**: Phase 70 (typing cleanup runs against a Svelte-5-warning-clean baseline; the warning sweep may rewrite a handful of the same files, so ordering keeps the typing diffs against a stable target)
**Requirements**: TYPING-01
**Success Criteria** (what must be TRUE):
  1. `yarn workspace @openvaa/frontend lint:check` exits 0 with zero errors. The breakdown per `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-02-DEFERRED.md` (~67 `@typescript-eslint/no-explicit-any`, ~13 `@typescript-eslint/naming-convention`, ~11 `func-style`, ~4 long-tail) is resolved at the source — each `no-explicit-any` becomes either a real type (preferred) or `unknown` + a runtime narrow + an inline `// reason: …` comment; each `naming-convention` and `func-style` error is fixed at the source site (no per-rule `// eslint-disable-next-line` unless inline-justified).
  2. `yarn workspace @openvaa/frontend check` (svelte-check) baseline does not regress beyond the v2.7-close baseline of 160 errors / 12 warnings without explicit acknowledgement in the phase verification report. Reductions are welcome but not gated.
  3. Root-level `yarn lint:check` is green across the monorepo — the frontend now matches the lint-clean state of `@openvaa/core`, `@openvaa/data`, `@openvaa/matching`, `@openvaa/filters`, `@openvaa/app-shared`.
  4. `yarn test:unit` remains green and the v2.7-close Playwright parity baseline continues to pass — no behavioral regressions from the typing tightening.
**Plans**: TBD

### Phase 72: Package Hygiene Trio
**Goal**: Three independent package-level cleanups land together — `@openvaa/app-shared` is normalised to match the import / barrel / build paradigm of the canonical reference packages (`core`, `data`, `matching`, `filters`); the `apps/frontend/src/lib/utils/merge.ts` re-export shim is retired in favour of direct `@openvaa/app-shared` imports at every consumer; and the conflated SQL/ESLint pipelines in `apps/supabase/package.json` are disambiguated with explicit `lint:sql` / `lint:js` (or equivalent) script names.
**Depends on**: Nothing (independent of Phases 69-71; can run in parallel with any of them, but scheduled last per the milestone close cadence — same pattern as v2.7 Phase 68 Dev-Tooling Trio)
**Requirements**: SHARED-01, SHARED-02, LINT-01
**Success Criteria** (what must be TRUE):
  1. **SHARED-01 — `@openvaa/app-shared` paradigm normalisation.** The package matches the import / barrel / build conventions of `@openvaa/core` / `data` / `matching` / `filters`: consistent `.js` extension policy on TS-internal imports per the monorepo's TS+ESM convention; flat exports vs. nested utils sub-barrel decision aligned with the canonical paradigm; `package.json` `scripts` and `exports` field aligned. The dual ESM+CommonJS build (kept for backend Edge Function consumption) is preserved and explicitly justified in a brief doc-comment at the top of the package's README or `package.json`. A one-paragraph "this is how all packages look" anchor lands in `CLAUDE.md` or a packages-level README.
  2. **SHARED-02 — `mergeSettings` re-export shim retired.** Every consumer in `apps/frontend/src/lib/**` and `tests/**` imports `mergeSettings` / `DeepPartial` directly from `@openvaa/app-shared`; the `apps/frontend/src/lib/utils/merge.ts` shim file is deleted; `git grep -nE "from ['\"]\\\$lib/utils/merge['\"]" apps/frontend/ tests/ packages/` returns zero matches. Any other shape-equivalent re-export shims in `apps/frontend/src/lib/utils/` discovered during the sweep are either retired (preferred) or carried forward with an explicit follow-up todo.
  3. **LINT-01 — `@openvaa/supabase` lint-script disambiguation.** The script that runs the SQL linter (current `yarn supabase:lint` semantics) is renamed to a SQL-specific name (e.g., `lint:sql`); the ESLint script (if any) gets a separate `lint:js` or matches the monorepo `lint:check` convention. Root-level `package.json`, `turbo.json`, `CLAUDE.md` Supabase Commands section, README, and CI workflow references are updated. `yarn supabase:lint` either continues to work as a deprecated alias OR is removed if no consumer remains. After the rename, `yarn lint:check` at the root runs only the JS/TS linter and does not touch SQL files; the renamed SQL script runs the SQL linter against `apps/supabase/migrations/`.
  4. `yarn build`, `yarn test:unit`, and `yarn lint:check` all green at HEAD; the v2.7-close Playwright parity baseline continues to pass — no behavioral regressions from the package-level changes.
**Plans**: 3 plans
- [x] 72-01-PLAN.md — `@openvaa/app-shared` paradigm normalisation (SHARED-01)
- [x] 72-02-PLAN.md — `mergeSettings` shim retirement (SHARED-02)
- [x] 72-03-PLAN.md — `@openvaa/supabase` lint-script hard rename (LINT-01)

### 🆕 Next milestone — Not yet planned

Run `/gsd-new-milestone` to question → research → write requirements → roadmap the next milestone.

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 56. Generator Foundations & Plumbing | v2.5 | 10/10 | Complete | 2026-04-23 |
| 57. Latent-Factor Answer Model | v2.5 | 7/7 | Complete | 2026-04-23 |
| 58. Templates, CLI & Default Dataset | v2.5 | 10/10 | Complete | 2026-04-23 |
| 59. E2E Fixture Migration | v2.5 | 7/7 | Complete | 2026-04-24 |
| 60. Layout Runes Migration & Hydration Fix | v2.6 | 5/5 | Complete | 2026-04-24 |
| 61. Voter-App Question Flow | v2.6 | 3/3 | Complete | 2026-04-25 |
| 62. Results Page Consolidation | v2.6 | 3/3 | Complete | 2026-04-26 |
| 63. E2E Template Extension & Greening | v2.6 | 3/3 | Complete | 2026-04-27 |
| 64. Voter Results Reactivity Completion | v2.6 | 4/4 | Complete | 2026-04-28 |
| 65. Svelte 5 Audit Sweeps | v2.7 | 3/3 | Complete | 2026-04-29 |
| 66. Adapter Type Cleanup | v2.7 | 1/1 | Complete | 2026-04-29 |
| 67. Default Seed Alliances | v2.7 | 2/2 | Complete | 2026-04-30 |
| 68. Dev-Tooling Trio | v2.7 | 3/3 | Complete | 2026-05-08 |
| 69. Alliance Card Lane A | v2.8 | 2/2 | Complete   | 2026-05-09 |
| 70. Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup | v2.8 | 5/5 | Complete   | 2026-05-09 |
| 71. Frontend Strict-Typing Cleanup | v2.8 | 0/? | Not started | - |
| 72. Package Hygiene Trio | v2.8 | 3/3 | Complete   | 2026-05-09 |
