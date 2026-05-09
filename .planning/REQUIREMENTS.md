# Milestone v2.8: Alliance Card + Frontend Hygiene Sweep — Requirements

**Defined:** 2026-05-08
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

**Goal:** Close v2.7's deferred Svelte 5 / typing / lint / packaging loose ends and finish the alliance card render path, in one cohesive frontend hygiene + small-UI-feature milestone. All 7 requirements are predominantly independent and can be developed in parallel; the user-facing surface is a single small UI feature (alliance card), the rest is tech-debt and package hygiene that pays interest forward into v2.9 (E2E coverage) and v3.x (multi-tenant).

**Context sources:**

- `.planning/todos/pending/2026-04-30-alliance-tab-rendering-and-sections-config.md` — alliance card 3-lane analysis (A/B/C); lane A selected
- `.planning/todos/pending/2026-05-08-results-layout-missing-slot-render-tag.md` — consolidated Svelte 5 / SSR / a11y warning sweep (Categories A/B/C captured during Phase 67 UAT)
- `.planning/todos/pending/2026-05-08-expander-state-referenced-locally.md` — superseded by the consolidated sweep above (kept for history)
- `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-02-DEFERRED.md` — 95 pre-existing `apps/frontend/` ESLint errors (Option C) deferred from v2.7
- `.planning/todos/pending/2026-04-25-normalise-app-shared-paradigm.md` — `@openvaa/app-shared` divergence from core/data/matching/filters
- `.planning/todos/pending/2026-04-25-remove-mergesettings-reexports.md` — `apps/frontend/src/lib/utils/merge.ts` shim retire-out
- `.planning/todos/pending/2026-05-08-cleanup-65-01-bind-rationale-comments.md` — strip 92 `// bind: keep —` rationale comments from Phase 65 Plan 01
- `.planning/STATE.md` Accumulated Context — v2.7 close + v2.8 scope decision
- v2.7 PROJECT.md "Out of scope (deferred to v2.8+)" — `@openvaa/supabase` lint-script rename (SQL/ESLint pipeline conflation)

---

## v2.8 Requirements

### ALLIANCE — Alliance card render path (closes v2.7 SEED-01 SC-2 PASS-WITH-CONCERNS)

- [x] **ALLIANCE-01**: The voter results "Alliances" tab renders a working entity card per alliance entity. Lane A from the deferred 3-lane analysis: a real alliance card with at minimum (a) alliance name, (b) member organizations as a sub-list, and (c) an "X candidates across N parties" summary. EntityCard's "subentities" branch (currently hard-coded to `OrganizationNomination → CandidateNomination`) is extended to handle `OBJECT_TYPE.AllianceNomination → OrganizationNomination` correctly. `cardContents.alliance` shape decisions are captured (likely adding `'organizations'` to the union). Voter clicks the Alliances tab → sees populated cards (default seed has 2 alliances + 10 alliance_nominations + 30/10 org-nom parent split per v2.7 SEED-01). The drawer-open path from an alliance card also works (alliance detail tab structure: info, member organizations, [no opinions because alliances do not have own answers]). Manual smoke includes: tab visible, cards populated, click-to-drawer works, member orgs render in the drawer.

### WARN — Svelte 5 / SSR / a11y warning sweep

- [x] **WARN-01**: All vite-plugin-svelte and SvelteKit dev/build warnings surfaced during Phase 67 UAT (consolidated in `.planning/todos/pending/2026-05-08-results-layout-missing-slot-render-tag.md`) are resolved or documented as accepted. Three categories must be addressed:
  - **Category A — Svelte 5 reactivity hazards (`state_referenced_locally`)**: Every confirmed site (e.g. `Expander.svelte:76 defaultExpanded`, `EnumeratedEntityFilter.svelte:48 filter`, plus any others surfaced by a fresh `yarn dev` warning sweep) is rewritten using direct property access or `$derived` so the prop/state read happens inside the tracking scope. Pattern matches the v2.6 P61-03 context-destructuring rule (CLAUDE.md).
  - **Category B — Missing `<slot />` / `{@render children()}` (or equivalent SSR-correct render)**: Every site that triggers the missing-render warning is fixed (or, if intentionally rendering nothing, documented inline).
  - **Category C — A11y warnings**: WCAG 2.1 AA-relevant warnings are fixed (label associations, aria-* attributes, keyboard handling). Cosmetic-only a11y warnings (if any) may be accepted with inline justification.
  - Verification: `yarn dev` from a clean `rm -rf apps/frontend/.svelte-kit node_modules/.vite/` start logs zero un-justified Svelte 5 / SSR / a11y warnings on cold load + voter-flow happy path. `yarn build` for `@openvaa/frontend` is also warning-clean (or, where a warning is accepted, the inline justification is captured).

### BIND — `bind:*` rationale-comment cleanup

- [x] **BIND-01**: The 92 inline `// bind: keep — <rationale>` comments added by v2.7 Phase 65 Plan 01 are removed from `apps/frontend/src/lib/**/*.svelte`, with the underlying `bind:*` directives left in place untouched. The rationale is already captured permanently in CLAUDE.md (Context Destructuring Rule + reactive-accessor catalog); the inline comments served the audit moment and now constitute long-term noise. After the sweep: `git grep -nE "// bind: (keep|ok|justified)" apps/frontend/src/lib/` returns zero matches. `yarn build` and `yarn test:unit` remain green; `git diff` is comment-only (no behavioral code changes).

### TYPING — Frontend strict-typing cleanup (95 ESLint errors deferred under v2.7 Phase 68 Option C)

- [ ] **TYPING-01**: The 95 pre-existing `apps/frontend/` ESLint errors deferred under v2.7 Phase 68 Option C are resolved. Breakdown per `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-02-DEFERRED.md`: ~67 `@typescript-eslint/no-explicit-any`, ~13 `@typescript-eslint/naming-convention`, ~11 `func-style`, plus ~4 long-tail. Each `no-explicit-any` error is resolved via real types (preferred) or, where the boundary genuinely admits unknowns, `unknown` + a runtime narrow + an inline justification. Each `naming-convention` and `func-style` error is fixed at the source site (no per-rule disable comments unless inline-justified). After the sweep: `yarn workspace @openvaa/frontend lint:check` exits 0 with zero errors. The frontend now matches the rest of the monorepo's lint-clean baseline. Type-coverage may shift — `yarn workspace @openvaa/frontend check` (svelte-check) baseline must not regress beyond the v2.7-close baseline (160 err / 12 warn) without explicit acknowledgement. E2E + unit suites remain green.

### SHARED — `@openvaa/app-shared` package hygiene

- [x] **SHARED-01**: `@openvaa/app-shared` is normalised to match the import / barrel / build paradigm of `@openvaa/core`, `@openvaa/data`, `@openvaa/matching`, `@openvaa/filters`. Concretely: (a) consistent `.js` extension policy on TS-internal imports (matching the rest of the monorepo's TS+ESM convention); (b) flat exports vs. nested utils sub-barrel decision aligned with the canonical paradigm; (c) `package.json` scripts and `exports` field aligned; (d) the dual ESM+CommonJS build (kept for backend Edge Function consumption) is preserved AND explicitly justified in a brief doc-comment at the top of the package's README or `package.json`. Per-package divergences (if any survive) are inline-justified. Reference: a one-paragraph "this is how all packages look" anchor lands in `CLAUDE.md` or a packages-level README.

- [x] **SHARED-02**: The `apps/frontend/src/lib/utils/merge.ts` re-export shim (added in v2.6 Phase 63 Plan 01 to keep import sites stable when `mergeSettings` + `DeepPartial` were hoisted to `@openvaa/app-shared`) is retired. Every consumer in `apps/frontend/src/lib/**` and `tests/**` imports `mergeSettings` / `DeepPartial` directly from `@openvaa/app-shared`. The shim file is deleted. `git grep -nE "from ['\"]\\\$lib/utils/merge['\"]" apps/frontend/ tests/ packages/` returns zero matches. `yarn build` + `yarn test:unit` remain green. Any other re-export shims of the same shape in `apps/frontend/src/lib/utils/` discovered during this sweep (per the source todo) are inventoried and either retired (preferred) or carried forward as a follow-up todo with an explicit reason.

### LINT — `@openvaa/supabase` lint-script rename

- [x] **LINT-01**: The conflated SQL/ESLint pipelines in `apps/supabase/package.json` are disambiguated. The script that runs `sqlfluff` (or whichever SQL linter — see existing `yarn supabase:lint` semantics) is renamed to a SQL-specific name (e.g., `lint:sql`); the ESLint script (if any) gets a separate `lint:js` or matches the monorepo `lint:check` convention. Root-level `package.json` and `turbo.json` task references updated. Documentation (`CLAUDE.md` Supabase Commands section, README) updated. CI workflow references updated. `yarn supabase:lint` either continues to work as a deprecated alias OR is removed if no consumer remains. Verification: `yarn supabase:lint:sql` (or the chosen final name) runs the SQL linter against `apps/supabase/migrations/`; `yarn lint:check` at the root runs only the JS/TS linter and does not touch SQL files.

---

## Future Requirements (deferred)

_Items tracked but not in v2.8 scope. Carry forward to v2.9+ or backlog._

- **E2E coverage workstream (v2.9 anchor)** — Fill voter/candidate/variant/visual/perf gaps catalogued in `.planning/notes/2026-05-08-e2e-test-inventory.md` (~30 gap categories across ~103 existing tests). Specific work units include: filter-type matrix coverage (`.planning/todos/pending/2026-04-27-extend-e2e-filter-type-coverage.md`), `test.skip(true, …)` sweep (`.planning/todos/pending/2026-04-27-remove-e2e-skip-modifiers.md`), 19 pre-existing data-loading race failures, locale switching, automated a11y sweep, expanded perf budgets, expanded visual baselines. User-led inventory audit is the entry-point.
- **Sharable URLs + multi-tenant (v2.9 candidate, paired)** — `results-url-refactor-followups` (shorter IDs, multi-election URL schema, upstream voter routes; `.planning/todos/pending/results-url-refactor-followups.md`) + `frontend-project-id-scoping` (per-instance project scoping in voter data provider; `.planning/todos/pending/frontend-project-id-scoping.md`). Pair as a single milestone — multi-tenant prep wants the typing cleanup landing first.
- **DB-01 nominations table cleanup** — deferred 2026-04-29 during v2.7 Phase 66 discussion; user opted to keep the table as is. Source todo `.planning/todos/pending/2026-04-28-cleanup-nominations-table.md` stays open.
- **Generalize candidate app to support parties** — `.planning/todos/pending/2026-03-28-generalize-candidate-app-to-party-app.md` + PROJECT.md §Milestones #21.
- **Investigate migrating candidate answer store** — architectural investigation, `.planning/todos/pending/2026-03-28-investigate-migrating-candidate-answer-store.md`.
- **Strapi-era auth-flow leftovers** — `password-reset-code-method` (`.planning/todos/pending/password-reset-code-method.md`) + `register-page-registrationkey-method` (`.planning/todos/pending/register-page-registrationkey-method.md`). Pair as a small "candidate-app auth dead-code retirement" workstream.
- **Configurable mock data generation** — `.planning/todos/pending/configurable-mock-data.md`. Supabase replacement for the old Strapi `GENERATE_MOCK_DATA_ON_INITIALISE`.
- **Adapter package loading via TSConfig** — `.planning/todos/pending/adapter-package-loading.md`.
- **AdminWriter rename** — `.planning/todos/pending/rename-admin-writer.md`. Low priority.
- **SQL linting / formatting tooling** — `.planning/todos/pending/sql-linting-formatting.md`. CI hygiene.
- **Admin App migration** — PROJECT.md §Milestones #18.
- **Settings & Configuration paradigm reorg** — PROJECT.md §Milestones #20.
- **Automated security and secrets scanning** — PROJECT.md §Milestones #19.
- **Trusted publishing for npm (OIDC)** — deferred until after initial manual publish (PROJECT.md Future).
- **165 pre-existing intra-package circular deps** in `@openvaa/data` / `@openvaa/matching` / `@openvaa/filters` (the `internal.ts` barrel pattern) — dedicated structural refactor milestone.
- **Claude Skills: architect, components, LLM** — deferred to post-Svelte 5 stabilization (PROJECT.md Future + §Milestones #17).

## Out of Scope

| Feature | Reason |
|---------|--------|
| New voter / candidate / admin features | v2.8 is hygiene + 1 small UI feature only. No new user-facing capabilities beyond ALLIANCE-01. |
| Alliance card Lane B (drop alliance from sections) or Lane C (conditional render guard) | ALLIANCE-01 commits to Lane A. Lanes B/C are quick rollback / temporary hack alternatives that this milestone explicitly rejects. |
| Schema migrations (DB-01, project-scoping schema work) | All v2.8 work is frontend / package-level. No supabase migration files touched. |
| `@openvaa/data` / `@openvaa/matching` / `@openvaa/filters` paradigm changes | SHARED-01 is `@openvaa/app-shared` only. Other packages are the canonical reference, not the target. |
| E2E coverage expansion | v2.9 anchor. Existing E2E suite must continue to pass at the v2.7-close baseline; that's the only E2E gate for v2.8. |
| Local imgproxy intermittent crash | Infrastructure debt, not a code issue (fix with `supabase stop && supabase start`). Carried forward from v2.6/v2.7. |
| `yarn workspace @openvaa/frontend check` (svelte-check) baseline reduction | TYPING-01 commits to "do not regress beyond 160 err / 12 warn." Reducing the baseline is welcome but not gated. |

---

## Traceability

Phase assignments mapped to `.planning/ROADMAP.md`. Success-criterion references point to the numbered criteria under each phase's `**Success Criteria**` block in ROADMAP.md.

| Requirement | Phase | Success Criteria | Status |
|-------------|-------|------------------|--------|
| ALLIANCE-01 | Phase 69 — Alliance Card Lane A | SC-1, SC-2, SC-3, SC-4 | Complete (Plans 69-01 + 69-02; SC-4 manual smoke PASSED 2026-05-09; parity gate deferred — see `.planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md`) |
| WARN-01 | Phase 70 — Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup | SC-1 (Category A), SC-2 (Category B), SC-3 (Category C), SC-5 (regression gate) | In Progress (Plan 70-01 complete: SC-1 Category A — 10 warnings → 0; Plan 70-02 complete: SC-2 Category B — 1 warning → 0; Plan 70-03 complete: SC-3 Category C — 1 warning → 0 via Pattern 3 Option A button promotion; Plan 70-04 pending for SC-1b/D) |
| BIND-01 | Phase 70 — Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup | SC-4 (comment strip), SC-5 (regression gate) | Pending |
| TYPING-01 | Phase 71 — Frontend Strict-Typing Cleanup | SC-1, SC-2, SC-3, SC-4 | Pending |
| SHARED-01 | Phase 72 — Package Hygiene Trio | SC-1, SC-4 (regression gate) | Pending |
| SHARED-02 | Phase 72 — Package Hygiene Trio | SC-2, SC-4 (regression gate) | Complete |
| LINT-01 | Phase 72 — Package Hygiene Trio | SC-3, SC-4 (regression gate) | Complete (Plan 72-03) |

**Coverage:**
- v2.8 requirements: 7 total
- Mapped to phases: 7 ✓
- Unmapped: 0 ✓
- Phases used: 4 (Phase 69, 70, 71, 72)
- Orphaned phases: none (every phase has at least one requirement)
- Duplicates: none (every requirement maps to exactly one phase)

---

*Requirements defined: 2026-05-08*
*Last updated: 2026-05-08 after roadmap drafted (4 phases 69-72; 7 requirements mapped 1:1)*
