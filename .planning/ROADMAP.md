# Roadmap: OpenVAA

## Milestones

- ✅ **v2.5 Dev Data Seeding Toolkit** — Phases 56-59 (shipped 2026-04-24)
- ✅ **v2.6 Svelte 5 Migration Cleanup** — Phases 60-64 (shipped 2026-04-28)
- ✅ **v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends** — Phases 65-68 (shipped 2026-05-08)
- ✅ **v2.8 Alliance Card + Frontend Hygiene Sweep** — Phases 69-72 (shipped 2026-05-10)
- 🆕 **v2.9 E2E Coverage + Suite Determinism** — Phases 73-78 (planning, framed 2026-05-10)

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

<details>
<summary>✅ v2.8 Alliance Card + Frontend Hygiene Sweep (Phases 69-72) — SHIPPED 2026-05-10</summary>

- [x] Phase 69: Alliance Card Lane A (2/2 plans) — completed 2026-05-09
- [x] Phase 70: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup (5/5 plans) — completed 2026-05-09
- [x] Phase 71: Frontend Strict-Typing Cleanup (3/3 plans) — completed 2026-05-09
- [x] Phase 72: Package Hygiene Trio (3/3 plans) — completed 2026-05-09

Audit: `.planning/milestones/v2.8-MILESTONE-AUDIT.md`

</details>

### 🆕 v2.9 E2E Coverage + Suite Determinism — PLANNING (framed 2026-05-10)

**Milestone Goal:** Reduce the Playwright suite to a hard pass/fail signal first (skip-modifier sweep + 19 data-loading races + 98 `playwright/*` warnings), then add high-leverage coverage on top of that stable base — translation surface, browse-without-match, election/constituency selector matrix, voter answer rendering, skip/delete/back navigation, locale switching, focused question-rendering specs, candidate profile validation+persistence, automated a11y, and the `appSettings`/`appCustomization` toggle matrix (plus `customData.allowOpen` and per-question visibility/required gap-fills). Close residual operator + post-71 hygiene todos in a final cleanup phase.

**Strategy: determinism first, coverage on top.** Adding new tests against an unstable suite hides regressions: a new test failing for a real reason looks like just-another-flake. **Phase 73 (DETERM) is a hard prerequisite for Phases 74-77.** Phase 78 is the residual cleanup tail and may run in parallel with 74-77 (no dependency on coverage phases).

**Gating + parallelism map:**

```
        ┌── Phase 74 (E2E coverage)
        │
Phase 73 ─┼── Phase 75 (QSPEC)        ← Phases 74-77 may develop in parallel
(DETERM)  │                                 once Phase 73 success criteria pass
        ├── Phase 76 (A11Y)
        │
        └── Phase 77 (SETTINGS)

Phase 78 (CLEAN)  ← independent of 73-77; may run in parallel with 74-77
                    (E2E-08 ↔ CLEAN-04 i18n pairing — see phase notes)
```

- [x] **Phase 73: Determinism Baseline** — Clear all `test.skip(true, …)` modifiers, resolve 19 known data-loading race E2E failures, sweep 98 pre-existing `playwright/*` warnings; suite reduces to a hard pass/fail signal (0 skipped, 3-run-stable, 0 lint warnings) — gating prerequisite for Phases 74-77 (completed 2026-05-11)
- [x] **Phase 74: High-Leverage E2E Coverage** — Multilocale candidate translation surface, browse-without-match results, feedback dialog persistence, election/constituency selector matrix (1e×1c / 1e×Nc / Ne×1c / Ne×Nc / startFromConstituency), voter answer in entity details (4-case), skip/delete/back navigation, per-category SubMatch breakdown, locale switching (completed 2026-05-11)
- [x] **Phase 75: Question-Rendering Specs** — Focused user-story specs for Boolean + categorical (single/multi-choice) question rendering in voter flow (deduplicated against matching tests) (completed 2026-05-12, operator-approved GREEN-WITH-DEFERRAL)
- [ ] **Phase 76: Profile + A11y** — Candidate profile validation rejection paths, full profile-field reload-persistence (extending v2.1 CAND-12), `@axe-core/playwright` WCAG 2.1 AA smoke wired against home/selector/questions/results/voter-detail routes
- [ ] **Phase 77: Settings Matrix + Question-Customization Gap-Fills** — Per-toggle coverage of `appSettings` / `appCustomization` (consumes `2026-04-27-extend-e2e-filter-type-coverage`); `customData.allowOpen` E2E coverage; per-question visibility flags + must-answer enforcement
- [ ] **Phase 78: Cleanup Hygiene Phase** — `dev:* → db:*` script rename + `dev:clean` cache wipe; voter-not-located deferred-target redirect; post-71 carry-forward trio (D-04 per-cast distribution + `setStore` cast cleanup + CLAUDE.md Svelte warning-accepted format); i18n wrapper tightening (paired with E2E-08 locale switching); Phase 73 review follow-ups (CR-02 + 7 WR + 5 IN) + voter-fixture race-fix Path B with `--likert-only` seed modifier

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
**Plans**: 3 plans
- [x] 71-01-PLAN.md — `no-explicit-any` sweep (67 errors: 44 test-mock + 17 production-adapter + 5 route-layout + 1 storage-test) [Wave 1]
- [x] 71-02-PLAN.md — `naming-convention` sweep (13 errors — type-parameter `T → TX` renames + 1 `_Unused` deletion; NOT DB-row snake_case per RESEARCH reframing of CONTEXT D-02) [Wave 1]
- [x] 71-03-PLAN.md — `func-style` sweep (11 errors: 7 mechanical + 4 SvelteKit type-binding inline-justified disables) + long-tail (3 `consistent-type-imports` + 1 `no-unused-expressions`) — merged per CONTEXT D-01 + RESEARCH recommendation [Wave 1]

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

### Phase 73: Determinism Baseline
**Goal**: After this phase, the existing Playwright suite is a hard pass/fail signal — zero `test.skip(true, …)` modifiers in test bodies, zero pre-existing data-loading race failures (each diagnosed and fixed deterministically at either the test level or the code level), and zero `playwright/*` ESLint warnings across `tests/`. Three consecutive serial runs produce identical pass/fail sets. New coverage in Phases 74-77 lands on top of this stable base, so a new test failing for a real reason cannot be misclassified as just-another-flake.
**Depends on**: Nothing (first phase of v2.9; runs over the v2.8-close baseline at HEAD `632c00513`; v2.6 parity baseline `67p / 1f / 34c` carried forward at HEAD `2c7ad2dea`)
**Gating**: HARD prerequisite for Phases 74, 75, 76, 77. Phase 78 (CLEAN) does NOT depend on Phase 73 and may run in parallel with the coverage phases.
**Requirements**: DETERM-01, DETERM-02, DETERM-03
**Success Criteria** (what must be TRUE):
  1. **Skip-modifier sweep complete.** `git grep -nE "test\.skip\(true," tests/` returns zero matches outside of comments. Each pre-existing `test.skip(true, …)` is classified per the protocol in `.planning/todos/pending/2026-04-27-remove-e2e-skip-modifiers.md` (legitimate skip → gated by environment flag; convert-to-poll → `expect.poll(...).toBeGreaterThan(0)` matching the v2.6 Phase 64 voter-results.spec.ts pattern; fix-and-remove → underlying race resolved). Post-sweep, `yarn test:e2e` reports 0 skipped tests on a green run.
  2. **Data-loading races resolved.** Each of the 19 known pre-existing data-loading race E2E failures (PROJECT.md "Future") has been investigated by failure type (race in initial fetch / subscription not flushed / auth-cookie not set in time / hydration timing) and given a deterministic fix — at the test level (proper `waitFor` against asserted element; `waitForLoadState('networkidle')` replaced; conditional `if (...)` masking removed) or at the code level (where the race surfaces a real product bug). After the resolution pass: 3 consecutive `yarn test:e2e --workers=1` runs produce identical pass/fail sets; the v2.6 parity baseline `67p / 1f / 34c` either lifts to a stable green count or is explicitly re-baselined in the phase verification report (whichever is honest given what the investigations surface).
  3. **Playwright lint warnings resolved.** All 98 pre-existing `playwright/*` ESLint warnings in `tests/` are cleared per the breakdown in `.planning/todos/pending/2026-05-10-tests-playwright-hygiene-sweep.md`: `playwright/no-conditional-in-test` (`if (...)` branches inside test bodies replaced with explicit assertions or split into separate tests), `playwright/no-raw-locators` (`page.locator('...')` rewritten to semantic locators `getByRole` / `getByText` / `getByTestId`), `playwright/no-networkidle` (`waitForLoadState('networkidle')` replaced with `waitFor` against the asserted element). After the sweep: `yarn lint:check` at the root exits 0 with 0 warnings across all workspaces (frontend baseline 0/0; tests/ contributes 0/0). The conditional / `networkidle` rewrites are paired with DETERM-02 — the same patterns drive both the warnings and the flakiness.
  4. **Determinism gate.** A single fresh `yarn dev:reset-with-data && yarn test:e2e` cold-start run (followed by 2 re-runs without resetting) produces identical pass/fail sets across all three runs; the gate is recorded in the phase verification report so subsequent phases inherit the baseline.
  5. **No new gaps introduced.** `yarn build`, `yarn test:unit`, root `yarn lint:check`, and workspace `svelte-check` remain at or below their v2.8-close baselines (frontend lint 0 errors / 0 warnings target; svelte-check ≤ 159 errors). No new `test.skip(true, …)`, no new `if (...)` branches in test bodies, no new `networkidle` waits introduced by the sweep itself.
**Plans**: 6 plans
- [x] 73-01-PLAN.md — Inventory: 3 cold --workers=1 runs + classify 36-test race pool by failure type + lint-baseline re-baselining (CONTEXT D-03) [Wave 1]
- [x] 73-02-PLAN.md — Mechanical sweep: no-networkidle (6) + no-raw-locators (37) — semantic locators via testIds registry; zero behavioral risk [Wave 2, depends on 01]
- [x] 73-03-PLAN.md — Voter-specs cluster: voter-settings/voter-popup-hydration/voter-journey conditional rewrites + voter-results no-wait-for-timeout (paired DETERM-02 + DETERM-03) [Wave 3, depends on 01,02]
- [x] 73-04-PLAN.md — Candidate-specs cluster + bank-auth D-07: 17 bank-auth warnings (12 cond-expect + 4 cond + 1 D-07-justified skip) + candidate-profile/settings/questions/auth (operator-review checkpoint on // reason: text quality) [Wave 4, depends on 01-03, has checkpoint]
- [x] 73-05-PLAN.md — Variants + setup hooks cluster: variant specs + auth.setup.ts auth-cookie race + data.setup idempotence + DETERM-01 cross-check [Wave 5, depends on 01-04]
- [x] 73-06-PLAN.md — Parity-gate regen + 3-run determinism gate + lint-gate bump 'warn'→'error' + 73-VERIFICATION.md (operator-review checkpoint on per-test DATA_RACE pool rationale) [Wave 6, depends on 01-05, has checkpoint]

### Phase 74: High-Leverage E2E Coverage
**Goal**: After this phase, Playwright covers eight high-leverage user-flow gaps that v2.8 explicitly deferred to v2.9: a multilocale candidate using the translation surface (and a single-locale candidate not seeing it); a voter who is located but under `minimumAnswers` browsing the entity list without match scores; feedback-dialog text persistence across dismiss + reset on send; the full election + constituency selector matrix (1e×1c / 1e×Nc / Ne×1c / Ne×Nc + startFromConstituency); the voter's answer rendering alongside the entity's answer in the entity-detail drawer for all four (answered / missing) cases; skip / delete / back navigation with predictable result-CTA availability; per-category SubMatch breakdown on voter-detail; and locale switching (route-prefixed + locale-switcher widget). Each gap maps to a focused spec or a parameterized matrix-driven spec.
**Depends on**: Phase 73 (HARD — coverage lands on top of a stable, deterministic baseline; running these specs against the pre-Phase-73 suite would mix pass-fail signal with flakiness noise)
**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06, E2E-07, E2E-08
**Success Criteria** (what must be TRUE):
  1. **Translation surface (E2E-01).** A parameterized fixture exercises both multilocale (`staticSettings.supportedLocales.length > 1`) and single-locale variants. The multilocale variant asserts the translation tab/dialog renders and the candidate can author translations on a question where `localizationDisabled` is not set; the single-locale variant asserts the translation surface is not rendered. Locators are role/aria-based (no test-id additions required for this gap).
  2. **Browse-without-match (E2E-02).** A variant fixture sets `minimumAnswers` low enough that a voter who completes location but skips opinion questions stays under threshold. Spec navigates to results and asserts (a) the match-score column/badge is absent, (b) the page intro copy does not reference matches, (c) the entity list still renders with cards.
  3. **Feedback persistence (E2E-03).** Sequence test: open feedback dialog → type text X → dismiss → reopen → assert text X is retained. Then: type text Y → send → reopen → assert empty state.
  4. **Selector matrix (E2E-04).** Variant matrix covers all five cells (`1e × 1c` regression baseline, `1e × Nc`, `Ne × 1c`, `Ne × Nc`, `startFromConstituency`). Per cell: assert URL state (selectors-bypassed vs. shown), selector visibility on the page, and (where the constituency dropdown is shown) that its options are filtered to the selected election's constituencies — no cross-election bleed.
  5. **Voter answer in entity details (E2E-05).** A parameterized fixture covers all four cases: (a) both answered, (b) voter answered + entity missing, (c) voter missing + entity answered, (d) both missing. Voter-detail spec asserts both rows render with appropriate visual state (agree / disagree / missing-marker) per case.
  6. **Skip / delete / back (E2E-06).** Sequence test: voter answers N questions (above `minimumAnswers`) → asserts results-CTA enabled → deletes one answer that brings count below threshold → asserts results-CTA disabled → re-answers → asserts re-enabled. Browser-back navigation through these states does not corrupt answer state.
  7. **Per-category SubMatch (E2E-07).** Voter-detail spec gains a per-category assertion block reusing fixture category metadata; verifies subdimensional-pillar rendering for both Manhattan and directional metric paths. Does NOT cover the input flow (that's QSPEC-02).
  8. **Locale switching (E2E-08).** Spec visits the page in `en` → asserts key strings → switches to `fi` (or another configured locale) via both the route-prefixed form (`/fi/...`) and the locale-switcher widget (if present) → asserts translated key strings → switches back. Coverage exercises the i18n wrapper improvements landed in CLEAN-04 if Phase 78 ran first; otherwise CLEAN-04 lands afterward and exercises this spec — the dependency direction is recorded in the phase verification report.
  9. **Determinism preserved.** All new specs pass on 3 consecutive `--workers=1` runs identically; the post-Phase-73 baseline does not regress (no new flakiness added).
**Plans**: 7 plans
- [x] 74-01-PLAN.md — E2E-01 candidate translation surface (multilocale Button + reload-persistence) [Wave 1, autonomous]
- [x] 74-02-PLAN.md — E2E-02 browse-without-match: NEW variant-low-minimum-answers project + spec [Wave 1, autonomous]
- [x] 74-03-PLAN.md — E2E-03 feedback dismiss-preserves/send-resets + E2E-06 skip/delete/back CTA toggle (2 specs bundled) [Wave 1, autonomous]
- [x] 74-04-PLAN.md — E2E-04 selector matrix: 2 NEW variants (1e-Nc + Ne-Nc) + 2 new specs + additive blocks in multi-election.spec.ts + startfromcg.spec.ts [Wave 1, autonomous]
- [x] 74-05-PLAN.md — E2E-05 4-case voter-vs-entity + E2E-07 per-category SubMatch (dev-seed extension + voter-detail.spec.ts additive blocks) [Wave 1, autonomous]
- [x] 74-06-PLAN.md — E2E-08 locale switching (route-prefix + LanguageSelection widget; Order B per CONTEXT D-06) [Wave 1, autonomous]
- [x] 74-07-PLAN.md — Verification gate: vite-cache wipe + 3-run cold-start + parity-script regen + 74-VERIFICATION.md [Wave 2, depends on 01-06, has checkpoint]

### Phase 75: Question-Rendering Specs
**Goal**: After this phase, Playwright has two focused user-story specs that walk a voter end-to-end through a Boolean opinion question and a categorical (single-choice + multi-choice) opinion question — input shape correct, voter answers, navigates, sees their answer reflected on entity-detail. Closes the gap that matching tests cover question-shape indirectly but no permanent E2E user-story gate exists for the v2.6-shipped BooleanQuestion + the long-shipped categorical surfaces.
**Depends on**: Phase 73 (HARD — same determinism prerequisite as Phase 74). May develop in parallel with Phase 74.
**Requirements**: QSPEC-01, QSPEC-02
**Success Criteria** (what must be TRUE):
  1. **Boolean spec (QSPEC-01).** A focused spec walks the voter through a Boolean opinion question end-to-end: input renders as the v2.6 Phase 61 2-button radio shape (per `isBooleanQuestion` type guard + `OpinionQuestionInput` boolean branch), voter selects an answer, answer persists across navigation, voter sees the answer reflected on entity-detail (their row vs. entity's row). Asserted via role-based locators (no new test-ids required).
  2. **Categorical spec (QSPEC-02).** A focused spec walks the voter through a categorical opinion question end-to-end — both single-choice and multi-choice shapes — with the same shape: input renders correctly, voter answers, navigates, sees their answer reflected on entity-detail. Per-category match breakdown is NOT asserted here (that's E2E-07's responsibility — QSPEC-02 covers only the input + flow).
  3. **Deduplication.** Each new spec is checked assertion-by-assertion against existing matching tests in `tests/tests/specs/voter/voter-matching.spec.ts` and unit-level matching tests in `packages/matching/`; no assertion duplicates an existing test's coverage. Where overlap exists, the QSPEC version asserts the user-flow + render-shape contract (Playwright's strength), and the existing matching test continues to assert the matching-algorithm contract.
  4. **Determinism preserved.** Both new specs pass on 3 consecutive `--workers=1` runs identically; the post-Phase-73 baseline does not regress.
**Plans**: 3 plans (split from 2 per 2026-05-12 revision: Plan 02 → Plan 02a + Plan 02b per CONTEXT D-01 fallback)
- [x] 75-01-PLAN.md — QSPEC-01 (Boolean spec) + e2e template boolean-question addition + `walkToQuestion(page, sortOrder)` helper extraction + W-03 i18n-hardening deferred-todo [Wave 1, autonomous]
- [x] 75-02a-PLAN.md — QSPEC-02 single-choice spec (4-step contract incl. B-02 browser-back persistence) + pre-flight DB seed gate (B-04) + unified dedup audit artifact at 75-02-DEDUP-AUDIT.md (B-03 Nyquist-compliant persistent file) [Wave 2, depends on 01, autonomous]
- [x] 75-02b-PLAN.md — Verification gate (vite-cache wipe + 3-run cold-start + parity-script regen) + 75-VERIFICATION.md + QSPEC-02 multi-choice deferred-todo + operator checkpoint [Wave 3, depends on 02a, has checkpoint]
**UI hint**: yes

### Phase 76: Profile + A11y
**Goal**: After this phase, Playwright covers candidate profile validation rejection paths (parameterized bad-input cells), full profile-field reload-persistence (extending v2.1 CAND-12 beyond image + answers + comment text to name + bio + social links), and a wired `@axe-core/playwright` WCAG 2.1 AA smoke against the 5 highest-traffic routes (home / selector / questions / results / voter-detail). The smoke surfaces the first-run violation baseline; cite-and-fix of those violations is explicitly out of scope for v2.9 (carried forward as a follow-up phase).
**Depends on**: Phase 73 (HARD — same determinism prerequisite). May develop in parallel with Phases 74, 75, 77.
**Requirements**: A11Y-01, A11Y-02, A11Y-03
**Success Criteria** (what must be TRUE):
  1. **Profile validation rejection paths (A11Y-01).** Parameterized profile spec exercises bad-input cells: invalid email format, name length boundaries (too short / too long), image type violation (non-image upload), image size violation (oversized upload). Each cell asserts (a) the validation error UI surfaces, (b) the unsaved state is preserved (the bad input is not silently discarded; the user can correct it). Happy paths remain covered by the existing `candidate-profile.spec.ts`.
  2. **Profile reload-persistence (A11Y-02).** A spec extends v2.1 CAND-12 beyond image + answers + comment text to cover all profile fields: name, bio, social links (where the fixture's info questions include them — fixture must include the social-link info questions for the spec to assert that surface). After save → page reload → all fields show their saved values. The existing CAND-12 image + answers + comment coverage continues to pass alongside.
  3. **Axe smoke wired (A11Y-03).** `@axe-core/playwright` is added as a dev dependency and integrated into the suite as a WCAG 2.1 AA smoke. Initial coverage: home, election/constituency selector, questions flow, results list, voter-detail drawer (5 routes). The smoke runs on every `yarn test:e2e` invocation OR is gated behind a `PLAYWRIGHT_A11Y` env flag (decision made during phase planning per existing `PLAYWRIGHT_VISUAL` / `PLAYWRIGHT_PERF` convention). Violations surfaced by the first run are documented in a follow-up todo at `.planning/todos/pending/` for cite-and-fix in a future phase — A11Y-03 is wiring + first-run baseline only.
  4. **No false-positive failures.** The first-run axe baseline is recorded; subsequent runs against an unchanged frontend produce identical violation lists. Wiring does not add flakiness (the smoke is deterministic).
  5. **Determinism preserved.** All new specs + the axe smoke pass on 3 consecutive `--workers=1` runs identically; the post-Phase-73 baseline does not regress.
**Plans**: TBD (estimate ~3-4 plans — 1 plan per A11Y-0X requirement, with A11Y-03 potentially split into "wire harness" + "first-run baseline + follow-up todo capture")
**UI hint**: yes

### Phase 77: Settings Matrix + Question-Customization Gap-Fills
**Goal**: After this phase, Playwright covers each individual `appSettings` / `appCustomization` toggle (extending the v2.4 `candidate-settings.spec.ts` which covers app-mode + notifications + hideHero + help/privacy); `customData.allowOpen` is E2E-covered (closing the v2.0 milestone-notes gap); and per-question visibility flags + must-answer enforcement are covered. Folds the existing `2026-04-27-extend-e2e-filter-type-coverage.md` todo into SETTINGS-01 (filter-type matrix is one slice of the toggle coverage).
**Depends on**: Phase 73 (HARD — same determinism prerequisite; SETTINGS-01 specifically benefits from a stable baseline because variant fixtures + per-toggle assertion-cells are exactly the shape that exposes flakiness loudly). May develop in parallel with Phases 74, 75, 76.
**Requirements**: SETTINGS-01, SETTINGS-02, SETTINGS-03
**Success Criteria** (what must be TRUE):
  1. **Toggle matrix (SETTINGS-01).** Enumerate the toggles surfaced by `staticSettings` + `dynamicSettings` (extending `candidate-settings.spec.ts`'s app-mode + notifications + hideHero + help/privacy coverage). For each toggle, an assertion-per-toggle exists — implemented as a parameterized matrix-driven spec where the shape allows (most cell-level toggles), or as a dedicated spec where toggle interactions warrant (e.g., toggles that change navigation flow). The existing `2026-04-27-extend-e2e-filter-type-coverage.md` todo (filter-type matrix: `EnumeratedFilter` already covered, `NumberFilter` / `TextFilter` / categorical-question filters / constituency-based filters / `FilterGroup` AND/OR composition uncovered) is folded into SETTINGS-01 as one slice of the toggle coverage. Post-resolution: the pending todo is marked resolved (or removed) at phase close.
  2. **`customData.allowOpen` (SETTINGS-02).** A variant fixture enables `allowOpen` on a subset of questions. Spec asserts (a) the open-comment UI surfaces on those questions, (b) voter can author comment text, (c) comment persists across reload (matching the existing CAND-12 persistence pattern for candidate comments). Closes the v2.0 milestone-notes gap.
  3. **Per-question visibility + must-answer (SETTINGS-03).** `hideHero` is already covered by the existing settings spec; SETTINGS-03 adds variant-fixture coverage for the remaining per-question visibility/required configuration: hidden questions don't render in the question flow; required-but-unanswered questions block navigation to results (per `requiredInfoQuestions` / `unansweredOpinionQuestions` voter-context contracts).
  4. **Determinism preserved.** All new specs + matrix-driven cells pass on 3 consecutive `--workers=1` runs identically; the post-Phase-73 baseline does not regress.
**Plans**: TBD (estimate ~3-5 plans — SETTINGS-01 likely 2-3 plans given matrix breadth; SETTINGS-02 + SETTINGS-03 likely 1 plan each)

### Phase 78: Cleanup Hygiene Phase
**Goal**: After this phase, five residual cleanup workstreams are closed in one bundled phase (same shape as v2.7 Phase 68 / v2.8 Phase 72 hygiene trios, scaled up): the `dev:* → db:*` Supabase script rename + new `dev:clean` cache wipe + `db:reset` / `db:reset-with-data` chaining `dev:clean` (the v2.8-close hidden-gotcha recipe); voters who hit a located route without `selectedElection` + `selectedConstituency` set are redirected through the selector with the original route preserved as a deferred-target; the 3 post-71 carry-forward findings (D-04 per-cast distribution + `setStore` cast cleanup + CLAUDE.md Svelte warning-accepted format) are resolved; the i18n wrapper is tightened, paired with E2E-08 locale-switching coverage; and the Phase 73 review backlog (CR-02 voter-popups race-tolerance regression + 7 WR test-quality findings + 5 IN polish findings) + voter-fixture heterogeneous-question-types race (Path B with `--likert-only` seed modifier) close jointly so the 16 tests in the post-73 DATA_RACE pool flip to PASS_LOCKED.
**Depends on**: Phase 73 closed (CLEAN-05 acts on Phase 73 review findings + the post-73 DATA_RACE pool). Independent of Phases 74-77; may run in parallel with them — same pattern as v2.7 Phase 68 Dev-Tooling Trio + v2.8 Phase 72 Package Hygiene Trio.
**Pairing note**: CLEAN-04 (i18n wrapper tightening) and E2E-08 (locale switching, Phase 74) are deliberately paired — locale-switching coverage exercises the i18n wrapper improvements. Two valid orderings:
  - **Order A:** Phase 78 lands first → CLEAN-04 i18n tightening lands → E2E-08 in Phase 74 exercises the tightened wrapper.
  - **Order B:** Phase 74 lands first → E2E-08 covers the pre-tightening wrapper → CLEAN-04 in Phase 78 lands and the existing E2E-08 spec re-validates against the tightened wrapper.

  The phase verification report records which order was taken; either is honest. The pairing is documented so the dependency is not lost during planning.
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05
**Success Criteria** (what must be TRUE):
  1. **`dev:* → db:*` rename + `dev:clean` (CLEAN-01).** Renames per `2026-05-10-rename-package-scripts-dev-to-db.md`: `dev:start → db:start`, `dev:stop → db:stop`, `dev:down → db:down`, `dev:reset → db:reset`, `dev:reset-with-data → db:reset-with-data`, `dev:status → db:status`, `dev:seed → db:seed`. New `yarn dev:clean` wipes `apps/frontend/.svelte-kit` + `node_modules/.vite/`. `db:reset` and `db:reset-with-data` chain `dev:clean` after the supabase reset (the v2.8-close recipe). Root `package.json`, CI workflows, and `CLAUDE.md` "Supabase Commands" section are updated. `yarn db:status` runs supabase status; `yarn dev:* → db:*` aliases either are removed entirely or kept as deprecated shims with a logged deprecation warning (decision deferred to phase planning per the source todo).
  2. **Voter-not-located redirect (CLEAN-02).** Voters who hit a located route (`/results/...`, `/questions/...`) without `selectedElection` + `selectedConstituency` set are redirected through the selector with the original route preserved as a deferred-target — after the voter completes selection, they resume the originally-requested route. Source: `2026-05-10-redirect-unlocated-voter-to-selectors.md`. E2E-covered by a spec that arrives at `/results/X` cold (no localStorage), completes the selector, and asserts final URL matches the original deferred target.
  3. **Post-71 carry-forward trio (CLEAN-03).** All three post-71 OOS findings closed:
     - **D-04 per-cast distribution** (`2026-05-10-d04-per-cast-reason-distribution.md`): the cluster-level `// reason:` anchor in `supabaseDataProvider.ts` (covering 13 cast sites) is distributed to per-cast lines, with reason text that distinguishes JSONB → typed-shape vs. JSONB → answers cases.
     - **`setStore` cast cleanup** (`2026-05-10-getroute-setstore-cast-cleanup.md`): the structural cast at `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts:41` is replaced with a properly-typed approach (likely returning the writable as `Writable<RouteBuilder>` rather than `Readable` from the factory, or restructuring to avoid the setter-extraction pattern).
     - **CLAUDE.md Svelte warning-accepted format** (`2026-05-09-claude-md-svelte-warning-accepted-format.md`): a canonical anchor for the v2.8 Phase 70 Cat A "inline ignore-with-rationale preamble" pattern is added to CLAUDE.md so future warning-acceptance decisions follow the same shape.
  4. **i18n wrapper tightening (CLEAN-04).** The i18n wrapper at `apps/frontend/src/lib/i18n/` is tightened per `2026-05-09-tighten-i18n-wrapper.md`. Specific tightening tracked in the source todo; expected outcome: stricter typing on translation function arguments + cleaner runtime override surface. The pairing with E2E-08 (locale switching, Phase 74) is exercised per the order chosen at phase planning time (see Pairing note above).
  5. **Phase 73 review backlog + voter-fixture race-fix (CLEAN-05).** Closes the 13-item residual from Phase 73 close. Source-of-truth: `.planning/phases/73-determinism-baseline/73-REVIEW.md` (CR-02 + 7 WR + 5 IN findings) and `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` (operator-locked Path B). Specifically:
     - **Voter-fixture race (Path B + `--likert-only`).** Add `--likert-only` seed mode to `@openvaa/dev-seed` (CLI flag + e2e template override). After: `yarn db:reset-with-data --likert-only` (or `db:seed --likert-only` per the CLEAN-01 rename) feeds a 16-Likert-only opinion-question seed; `voter.fixture.ts answeredVoterPage` keeps its Likert-only loop. The 16 tests in the post-73 DATA_RACE pool flip to PASS_LOCKED. Heterogeneous-question-type coverage deferred to future-milestone backlog (out of scope).
     - **CR-02 voter-popups race-tolerance regression** (`tests/tests/specs/voter/voter-popups.spec.ts:138, 220`). Replace `waitFor({state:'visible'})` on already-visible anchors with `expect(dialog).toBeHidden({ timeout: 3000 })` / `expect(dialogLocator).toHaveCount(0, { timeout: 3000 })` so the 2-5s popup-delay wait actually takes 2-5s.
     - **WR-01 / WR-02 / WR-03** test-determinism follow-ups: replace residual `.catch(()=>false)` swallow-trap in `multi-election.spec.ts:145`; rewrite the race-prone `selectElectionFromAccordionIfPresent` helpers in `constituency.spec.ts` + `startfromcg.spec.ts` to branch deterministically on the resolved anchor; root-cause-or-document the SvelteKit silent `goto()` fallback at `multi-election.spec.ts:215-231` and add hard precondition asserts on `electionUuids`/`constituencyUuids` in `beforeAll`.
     - **WR-04 / WR-05 / WR-06 / WR-07** setup + admin-client hardening: drop the wasted `reload()` in `auth.setup.ts` retry loop; wrap `forceRegister`'s 4-step mutation in try/catch with compensating `auth.admin.deleteUser` rollback; propagate per-user errors in `deleteAllTestUsers`; delete `fixGoTrueNulls` as dead code (or wire it into `safeListUsers` with upstream-issue link if still relevant).
     - **IN-01..IN-05** polish items: throw-on-missing-key (or `// reason:`) for the demo-JWT fallback in `candidate-bank-auth.spec.ts:28-33`; tighten the `body.error ?? body.msg ?? body.details` precedence chain with `typeof` checks; audit unjustified `getByTestId` usages and replace with semantic locators (or add `// reason:` blocks per P70 Cat A); strengthen the trivial `toBeLessThanOrEqual` filter assertion in `voter-results.spec.ts`; replace the tautological `expect(true).toBe(true)` in `data.setup.ts:146` with a semantic post-condition check.
     - **Acceptance verification.** (a) `yarn db:reset-with-data --likert-only` runs cleanly; (b) 3-run cold-start `--workers=1` × 3 identical pass/fail set with the 16 previously-DATA_RACE tests now passing; (c) `tests/scripts/diff-playwright-reports.ts` constants re-regenerated against the post-CLEAN-05 baseline (PASS_LOCKED grows by 16, DATA_RACE shrinks by 16) with `PARITY GATE: PASS`; (d) all 12 review findings either fixed in code or accepted inline with a `// reason:` block; (e) `STATE.md §Blockers/Concerns` Phase 73 follow-up entries removed; (f) `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` moved to `.planning/todos/completed/`; (g) `73-REVIEW.md` annotated with the per-finding resolution (or post-close cross-link to the CLEAN-05 plan(s)).
  6. **No regressions.** `yarn build`, `yarn test:unit`, root `yarn lint:check`, and the Phase 73 Playwright determinism baseline all remain green at HEAD post-phase. The 6 source todos (`2026-05-10-rename-package-scripts-dev-to-db.md`, `2026-05-10-redirect-unlocated-voter-to-selectors.md`, `2026-05-10-d04-per-cast-reason-distribution.md`, `2026-05-10-getroute-setstore-cast-cleanup.md`, `2026-05-09-claude-md-svelte-warning-accepted-format.md`, `2026-05-09-tighten-i18n-wrapper.md`) are removed from `.planning/todos/pending/` (or marked resolved) at phase close.
**Plans**: TBD (estimate ~6-8 plans — 1 per CLEAN-01/02/04 + CLEAN-03 potentially splitting into 1 plan per sub-finding given the 3-pack shape + CLEAN-05 splitting into 2-3 plans by sub-cluster: voter-fixture Path B (`@openvaa/dev-seed` flag + fixture wiring) as 1 plan; CR-02 + WR-01..WR-04 test-spec hardening as 1 plan; WR-05..WR-07 admin-client hardening + IN-01..IN-05 polish as 1 plan)

### 🆕 Next milestone — Not yet planned

After v2.9 ships, run `/gsd-new-milestone` to frame the next milestone. v2.10 candidates already captured: sharable URLs + multi-tenant pair (`results-url-refactor-followups` + `frontend-project-id-scoping`); Luxembourg + Danish VAA reconciliation.

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
| 69. Alliance Card Lane A | v2.8 | 2/2 | Complete | 2026-05-09 |
| 70. Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup | v2.8 | 5/5 | Complete | 2026-05-09 |
| 71. Frontend Strict-Typing Cleanup | v2.8 | 3/3 | Complete | 2026-05-09 |
| 72. Package Hygiene Trio | v2.8 | 3/3 | Complete | 2026-05-09 |
| 73. Determinism Baseline | v2.9 | 6/6 | Complete    | 2026-05-11 |
| 74. High-Leverage E2E Coverage | v2.9 | 7/7 | Complete   | 2026-05-11 |
| 75. Question-Rendering Specs | v2.9 | 3/3 | Complete   | 2026-05-12 |
| 76. Profile + A11y | v2.9 | 0/TBD | Not started | — |
| 77. Settings Matrix + Question-Customization Gap-Fills | v2.9 | 0/TBD | Not started | — |
| 78. Cleanup Hygiene Phase | v2.9 | 0/TBD | Not started | — |
