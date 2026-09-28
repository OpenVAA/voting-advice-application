# Phase 74: High-Leverage E2E Coverage - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Mode:** `--auto` (single-pass; all gray areas auto-selected; recommended option chosen per question — see DISCUSSION-LOG.md for the audit trail)

<domain>
## Phase Boundary

Add eight high-leverage Playwright user-flow specs on top of the now-deterministic Phase-73 baseline (4 PASS_LOCKED / 15 DATA_RACE / 55 CASCADE, SHA-identical across 3 cold runs). Each spec closes a coverage gap that v2.7 + v2.8 explicitly deferred:

- **E2E-01 — translation surface** (multilocale candidate authors translations; single-locale candidate does not see the surface).
- **E2E-02 — browse-without-match** (voter completes location but stays under `minimumAnswers`; entity list renders, scores absent, intro copy non-match).
- **E2E-03 — feedback dialog persistence** (text retained on dismiss + cleared on send).
- **E2E-04 — election + constituency selector matrix** (5 cells: `1e×1c` regression baseline, `1e×Nc`, `Ne×1c`, `Ne×Nc`, `startFromConstituency`).
- **E2E-05 — voter answer in entity details** (4 cases: both-answered, voter-answered+entity-missing, voter-missing+entity-answered, both-missing).
- **E2E-06 — skip/delete/back navigation** (answer N → delete one → results-CTA toggles per `minimumAnswers` threshold; browser-back does not corrupt state).
- **E2E-07 — per-category SubMatch breakdown** on voter-detail (Manhattan + directional metric paths).
- **E2E-08 — locale switching** (route-prefixed form `/fi/...` + locale-switcher widget where present).

Phase 74 is content-heavy spec authoring against a stable suite — NOT new product behavior, NOT framework migration. Each new spec MUST pass 3× cold-start `--workers=1` identically; the Phase-73 DATA_RACE pool (15) must not grow as a side-effect of this phase. Phase 73 is a HARD prerequisite (closed 2026-05-11). May develop in parallel with Phases 75/76/77 once 73 is closed; independent of Phase 78 (CLEAN) per the Pairing note (Order B chosen — see D-06).

</domain>

<decisions>
## Implementation Decisions

### Plan grouping + sequence

- **D-01 — 7 plans, 1 verification gate folded into final plan.** ROADMAP estimates "~6-8 plans — likely 1 plan per E2E-0X requirement, with E2E-04 the largest given the 5-cell matrix; E2E-05 + E2E-07 may bundle since both extend voter-detail.spec.ts." Auto-selected plan layout:
  1. **Plan 01 — E2E-01 (candidate translation surface).** Adds `tests/tests/specs/candidate/candidate-translation.spec.ts` against the existing 4-locale `staticSettings` baseline. Multilocale variant is the only assertion path; single-locale variant deferred per D-04.
  2. **Plan 02 — E2E-02 (browse-without-match).** Adds NEW variant template `variant-low-minimum-answers` + setup + Playwright project + spec `tests/tests/specs/voter/voter-browse-without-match.spec.ts`.
  3. **Plan 03 — E2E-03 (feedback persistence) + E2E-06 (skip/delete/back).** Both are voter-flow sequence tests with similar shape (state mutation → assert). Bundled into 1 plan for plan-count efficiency. New spec(s): `voter-feedback-persistence.spec.ts` (E2E-03) + `voter-navigation.spec.ts` (E2E-06). E2E-03 may instead extend the existing `voter-popups.spec.ts` (which already covers VOTE-15 feedback popup timing) — planner's call at PLAN.md time.
  4. **Plan 04 — E2E-04 cell 2 + cell 4 (`1e×Nc` and `Ne×Nc`).** Adds 2 NEW variant templates + setups + Playwright projects. Specs at `tests/tests/specs/variants/1e-Nc.spec.ts` + `tests/tests/specs/variants/Ne-Nc.spec.ts`. The remaining 3 cells reuse existing assets (see D-05).
  5. **Plan 05 — E2E-05 + E2E-07 (voter-detail extension).** Extends `tests/tests/specs/voter/voter-detail.spec.ts` (or splits into `voter-detail-cases.spec.ts` + `voter-detail-submatch.spec.ts` for parallelism — planner's call). E2E-05 needs the 4-case answer fixture (see D-07); E2E-07 reuses existing category metadata in the default `e2e` template.
  6. **Plan 06 — E2E-08 (locale switching).** Adds `tests/tests/specs/voter/voter-locale-switching.spec.ts`. Order B chosen (see D-06): Phase 74 lands first; CLEAN-04 i18n tightening lands afterward in Phase 78 and the existing E2E-08 spec re-validates.
  7. **Plan 07 — Verification + 3-run determinism gate.** Final plan runs the post-phase 3-run cold-start `--workers=1` smoke (same shape as Phase 73 Plan 06); re-runs the parity-script (`tests/scripts/diff-playwright-reports.ts`) self-identity smoke; regenerates constants IF and ONLY IF new specs land in DATA_RACE (per D-10); produces `74-VERIFICATION.md`. Includes the v2.8-close vite-cache wipe recipe (D-12).

  Risk: Plan 04 is the largest given 2 new variant projects + 2 new specs + 5-cell parameterized matrix logic. Planner may split into 04a (variant scaffolding) + 04b (spec authoring) if scope exceeds the per-plan ceiling.

### Variant fixture strategy (E2E-01 / E2E-02 / E2E-04)

- **D-02 — New variant templates follow the existing 3-variant shape.** Each new variant lives at `tests/tests/setup/templates/variant-<name>.ts`, composes `BUILT_IN_TEMPLATES.e2e` from `@openvaa/dev-seed` as the base, applies a per-variant overlay via `mergeSettings` (deep-merge from `@openvaa/app-shared`, NOT the frontend's shallow `mergeAppSettings`), declares per-row `constituency_groups`/`constituencies`/`elections` to override pipeline full-fanout where needed (per `variant-multi-election.ts` shape). Setup files live at `tests/tests/setup/variant-<name>.setup.ts`. Playwright project entries land in `tests/playwright.config.ts` after the existing variant projects with the `data-setup-<name>` → `variant-<name>` dependency chain.

- **D-03 — New variants required by Phase 74:**
  - **`variant-low-minimum-answers`** (E2E-02): overlay sets `dynamicSettings.matching.minimumAnswers` so a voter who completes location and skips opinion questions stays under threshold. Confirm the exact knob path at PLAN.md time — current default is `5` at `dynamicSettings.ts:42`.
  - **`variant-1e-Nc`** (E2E-04 cell 2): single election with N constituencies (target N = 3 — enough to exercise a real dropdown, not enough to add fixture bloat). Asserts: selectors visible (election bypassed because 1e auto-implies; constituency selector shown), constituency dropdown options filtered to this election's CGs only.
  - **`variant-Ne-Nc`** (E2E-04 cell 4): N elections × M constituencies (target 2×3). Asserts: both selectors shown, constituency dropdown options for the currently-selected election filter to THAT election's CGs only (no cross-election bleed — the strongest assertion of the matrix).
  - **NO new variant for E2E-01.** The existing 4-locale `staticSettings` config IS the multilocale variant. See D-04.
  - **NO new variant for E2E-05.** Extend the default `e2e` template's voter answer dataset to include the 4-case mix (see D-07).
  - **NO new variant for E2E-06 / E2E-07 / E2E-08.** Each runs against the default `e2e` template.

### E2E-01 single-locale path

- **D-04 — Single-locale assertion deferred to a follow-up todo.** `staticSettings.supportedLocales` is hardcoded in `packages/app-shared/src/settings/staticSettings.ts:46-64` (4 locales: en/fi/sv/da; en `isDefault`) with no runtime override mechanism. Testing the single-locale build path would require either (a) building the frontend with a patched `staticSettings.ts` (CI plumbing complexity that exceeds the per-phase scope), (b) component-level test outside Playwright's reach, or (c) deferral to a follow-up that adds a `staticSettings` runtime-override mechanism. Phase 74 picks **(c)**:
  - **In scope:** Assert the multilocale render contract — translation tab/dialog renders on a candidate's question where `localizationDisabled !== true`; tab is absent on a question where it IS set. Role/aria locators; no test-id additions required. The candidate sees translation surface UI; can author translations; saved translations persist across reload.
  - **Deferred:** Single-locale absence assertion. Captured as a new `.planning/todos/pending/` entry at phase close: "E2E-01 single-locale variant — add a `staticSettings.supportedLocales` runtime-override mechanism (or build-time variant) so a 1-locale build can be served at a per-project Playwright baseURL; spec asserts translation tab does not render."
  - **ROADMAP SC #1 interpretation:** PASS-WITH-DEFERRAL. The deferred single-locale variant is the LESSER-risk case (absence-of-feature); the multilocale variant is the HIGHER-risk case (translation surface is post-v2.8 code with no E2E gate today). Phase 74 closes the higher-risk gap and bounds the phase.

  Rationale: The translation surface code path is what v2.8 explicitly deferred — the multilocale render is the actual regression risk. The single-locale absence path is mechanical and best covered when we add the runtime-override mechanism.

### E2E-04 selector matrix cell mapping

- **D-05 — 5-cell matrix to existing/new variants:**

  | Cell | Variant | Status |
  |------|---------|--------|
  | `1e × 1c` (regression baseline) | base `e2e` template | EXISTS — keep; assert selectors-bypassed contract |
  | `1e × Nc` | NEW `variant-1e-Nc` | NEW in Plan 04 |
  | `Ne × 1c` | EXISTING `variant-multi-election` | EXISTS — reuse; add new assertions for the matrix contract |
  | `Ne × Nc` | NEW `variant-Ne-Nc` | NEW in Plan 04 |
  | `startFromConstituency` | EXISTING `variant-startfromcg` | EXISTS — reuse; add new assertions where matrix-shaped |

  Per-cell assertions (uniform): (a) URL state (selectors-bypassed vs. shown), (b) selector visibility on the page, (c) where the constituency dropdown is shown, options are filtered to the selected election's constituencies (no cross-election bleed — strongest in `Ne×Nc`).

  The 3 reused-variant assertions are additive — do NOT modify the existing CONF-01..CONF-06 invariants. Plan 04 may split spec authoring across the existing variant spec files OR introduce a single matrix-driven helper at `tests/tests/utils/selectorMatrix.ts` that each variant spec invokes. Planner's call.

### E2E-08 / CLEAN-04 ordering

- **D-06 — Order B chosen.** Phase 74 lands first; CLEAN-04 (i18n wrapper tightening) lands in Phase 78 afterward. E2E-08 covers the pre-tightening wrapper; after CLEAN-04 lands, the existing E2E-08 spec re-validates against the tightened wrapper.

  Rationale: Phase 74 has 8 E2E-0X requirements and is content-heavy. CLEAN-04 is a surface refactor (typing tightening + cleaner runtime override). Locking Phase 74 first avoids blocking 8 coverage gaps on 1 typing change. Phase 78 verification record documents the order taken. Recorded in `74-VERIFICATION.md` "Dependency direction" field at phase close.

### E2E-05 voter-answer fixture extension

- **D-07 — Extend `e2e` default template voter dataset for 4-case mix.** E2E-05 needs entity-vs-voter answer-state coverage:
  - (a) both answered
  - (b) voter answered + entity missing
  - (c) voter missing + entity answered
  - (d) both missing

  Approach: extend `packages/dev-seed/src/templates/e2e.ts` voter dataset (introduced in Phase 59) to add at least 4 opinion-question answer cells per entity-voter pair covering the 4 cases. Re-runs `yarn build` for `@openvaa/dev-seed`. NO new variant template — the 4 cases live in the same default `e2e` baseline so they don't require a new Playwright project.

  Open question for planner: whether to introduce a small `voter-detail-cases-fixture` audit (per 58-E2E-AUDIT.md convention) anchoring the 4 cases to spec assertions. RECOMMENDED if E2E-05 + E2E-07 are split across plans.

### E2E-03 + E2E-06 colocation

- **D-08 — Bundle E2E-03 + E2E-06 in Plan 03.** Both are voter-flow sequence tests with similar shape (open → modify → assert; answer → delete → assert). Bundling is plan-count efficient AND keeps the voter-flow sequence-test pattern (a new shape in v2.9) in one place where a shared helper can emerge if needed.

  Planner may split into 2 plans if the per-plan ceiling is exceeded (E2E-06's browser-back state-corruption assertion is the heaviest sub-case). Default: 1 bundled plan.

### Determinism contract + parity-gate regen

- **D-09 — Determinism contract (SC #9):** All new specs MUST pass 3× cold-start `--workers=1` identically per the Phase-73 gate shape. New specs are EXPECTED to land in `PASS_LOCKED`; any new spec that lands in `DATA_RACE` requires per-test rationale in `74-VERIFICATION.md` (per Phase 73 D-02 + D-09 pattern — env-gated, infrastructure flake, deferred bug). The Phase-73-locked `DATA_RACE` pool (15 imgproxy-tied infrastructure flakes) MUST NOT grow as a side-effect of Phase 74.

- **D-10 — Parity-script constants regen — conditional.** Re-run `tests/scripts/diff-playwright-reports.ts` constants regen via the post-Phase-73 tooling (Plan 6 of Phase 73 restored `regen-constants.mjs` and the diff-script — confirmed at HEAD per 73-VERIFICATION.md SC #4) **only if**:
  - New variant projects are added (Plans 02 + 04 add 3 new projects: `variant-low-minimum-answers`, `variant-1e-Nc`, `variant-Ne-Nc`) — each new project contributes new tests to the parity baseline, which IS a constants-regen trigger; OR
  - The cold-start pass/fail set changes for any pre-existing test.

  Plan 07 (verification) decides. If both conditions hold, the new PASS_LOCKED count grows by the count of new-spec passes; DATA_RACE/CASCADE must stay at the Phase-73-locked values UNLESS new specs are explicitly classified into them (per D-09).

  **CRITICAL — IMGPROXY_TIED_TITLES list (CONTEXT 73 D-09).** This list is structurally fragile: a renamed test fails the regen loudly. Plan 04's new variant specs MUST avoid `IMGPROXY_TIED_TITLES` patterns (entity-detail drawer + image-upload paths) unless the regen is explicitly re-baselined. Planner: read `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md` lines 11–32 for the bound title list before authoring specs.

### Locator + lint convention

- **D-11 — Role/aria locators by default; `getByTestId` requires inline `// reason:`.** Per the post-Phase-73 `playwright/no-raw-locators` lint rule at `'error'` (lint-gate bumped per Phase 73 DETERM-03 final step) + the v2.7 P67 / v2.8 P70 "semantic locators preferred" convention. The v2.8 P71 D-04 inline `// reason:` block is the canonical shape for justified test-id usage.

  Concretely: prefer `getByRole('button', { name: t('...') })`, `getByLabel(...)`, `getByText(...)` over `page.locator('[data-testid="..."]')` and over `getByTestId(...)`. The IN-03 review finding from Phase 73 ("audit unjustified getByTestId usages and replace with semantic locators (or add `// reason:` blocks per P70 Cat A)") is captured as Phase 78 CLEAN-05; Phase 74 specs land on the NEW side of the convention, not the old.

### Vite-cache wipe + end-of-phase gate

- **D-12 — Vite-cache wipe is mandatory before the 3-run smoke.** Plan 07's gate MUST start with `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` per the v2.8-close gotcha (`.planning/milestones/v2.8-MILESTONE-AUDIT.md` §"Bundled Manual Smoke") + the Phase 73 Plan 6 recipe. The v2.9 Phase 78 / CLEAN-01 `dev:clean` script — `yarn db:reset-with-data` chained with cache wipe — is the durable form; Phase 74 uses the imperative recipe directly (don't wait for CLEAN-01).

### Spec file layout

- **D-13 — New spec files (planner may rename at PLAN.md time):**
  - `tests/tests/specs/candidate/candidate-translation.spec.ts` (E2E-01)
  - `tests/tests/specs/voter/voter-browse-without-match.spec.ts` (E2E-02; runs under a new `voter-app-low-minimum-answers` Playwright project depending on `data-setup-low-minimum-answers`)
  - `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` (E2E-03; OR extend `voter-popups.spec.ts` if planner prefers colocation — E2E-03's dismiss-vs-send sequence is orthogonal to VOTE-15 popup timing, so a fresh spec is cleaner)
  - `tests/tests/specs/variants/1e-Nc.spec.ts` (E2E-04 cell 2)
  - `tests/tests/specs/variants/Ne-Nc.spec.ts` (E2E-04 cell 4)
  - extension to `tests/tests/specs/voter/voter-detail.spec.ts` OR new `voter-detail-cases.spec.ts` + `voter-detail-submatch.spec.ts` (E2E-05 + E2E-07)
  - `tests/tests/specs/voter/voter-navigation.spec.ts` (E2E-06)
  - `tests/tests/specs/voter/voter-locale-switching.spec.ts` (E2E-08)

### Claude's Discretion

- **Plan-04 split into 04a + 04b** if scope exceeds the per-plan ceiling — planner's call at PLAN.md time.
- **E2E-05 + E2E-07 split into 2 specs vs. extending `voter-detail.spec.ts`** — planner's call. Split favors parallelism; extension favors smaller diff. Either is acceptable.
- **E2E-03 fold into `voter-popups.spec.ts` vs. new file** — planner's call. New file is cleaner; folding is more economical.
- **Whether to introduce a `selectorMatrix.ts` test helper or per-spec assertion blocks** for E2E-04's 5 cells (D-05) — planner's call.
- **Whether the dev-seed E2E template extension for D-07 (4-case voter answers) requires a follow-on `58-E2E-AUDIT.md`-style addendum** documenting the 4 cells — RECOMMENDED but not blocking.

### Folded Todos

None folded — see "Reviewed Todos" under `<deferred>`. All keyword-matched todos are already routed to other phases per `.planning/STATE.md §"Deferred Items"` table; folding any of them into Phase 74 would create a scope conflict.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 74 anchors (REQUIREMENTS / ROADMAP / STATE / PROJECT)

- `.planning/REQUIREMENTS.md` §E2E-01..E2E-08 (lines 40, 42, 44, 46, 48, 50, 52, 54) — locked success criteria; the per-requirement-ID contract.
- `.planning/ROADMAP.md` §"Phase 74: High-Leverage E2E Coverage" (lines 174-188) — phase goal + dependencies + 9 success criteria + plan estimate.
- `.planning/STATE.md` lines 1-150 — v2.9 status (Phase 73 closed 2026-05-11; Phase 74 ready to plan); plan-count estimate table (line ~127); Phase 73 → Phase 78 CLEAN-05 follow-up routing (line ~135).
- `.planning/PROJECT.md` §"Current Milestone: v2.9" — milestone framing + 6-phase shape + Phase 73 close summary.

### Inputs to Phase 74

- `.planning/notes/2026-05-10-v2.9-e2e-coverage-inventory.md` — operator framing of the 8 E2E-0X gaps + their "Strategy" hints + NOT REAL gaps table.
- `.planning/notes/2026-05-08-e2e-test-inventory.md` — broader E2E inventory underlying v2.9 framing.

### Pattern references (Phase 73 — determinism contract + tooling)

- `.planning/phases/73-determinism-baseline/73-CONTEXT.md` D-01..D-10 — the binding determinism contract this phase inherits (3-run `--workers=1` cold-start identical pass/fail; per-test rationale for any DATA_RACE entry; vite-cache wipe recipe).
- `.planning/phases/73-determinism-baseline/73-VERIFICATION.md` — verdict + 5/5 PASS table + 3-run SHA-identity (`e2e56e73fa42...` × 3) + parity-gate output. Sets the baseline contract Phase 74 MUST preserve.
- `.planning/phases/73-determinism-baseline/73-REVIEW.md` — 12-finding residual being closed in Phase 78 CLEAN-05; advisory CR-02 (voter-popups race-tolerance regression) is NOT a Phase 74 concern (those tests are CASCADE-pool entries).
- `tests/scripts/diff-playwright-reports.ts` — parity-script restored in Phase 73 Plan 06 (CONTEXT D-08 source restoration). Phase 74 Plan 07 invokes it for the verification gate (per D-10).
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs` — one-shot constants regenerator; bind-source for Phase 74 if parity-script constants need regen (per D-10).
- `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md` lines 11-32 — IMGPROXY_TIED_TITLES list referenced from `regen-constants.mjs`; structurally fragile — read before Plan 04 spec authoring (per D-10 CRITICAL note).

### Pattern references (v2.6 P64 + v2.8 close gotchas)

- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-CONTEXT.md` D-07..D-11 + Pitfall 5 — race-tolerant `expect.poll(...).toBeGreaterThan(0)` pattern; parity-gate convention; IMGPROXY classification rules.
- `.planning/milestones/v2.8-MILESTONE-AUDIT.md` §"Bundled Manual Smoke (2026-05-10)" — vite-cache wipe recipe + why it's required between phases (per D-12).
- `.planning/todos/completed/2026-05-09-phase-69-parity-gate-followup.md` §"Pre-capture caveat" — permanent home for the vite-cache gotcha.

### Variant template shape (Phase 74 will add 3 new variants)

- `tests/tests/setup/templates/variant-multi-election.ts` — canonical reference for new variant templates (per D-02). Composes `BUILT_IN_TEMPLATES.e2e` + `mergeSettings` overlay + per-row constituency-group/constituency declarations. Specifically the `baseFixed(...)` helper pattern + the overlay-row inventory comment block.
- `tests/tests/setup/templates/variant-constituency.ts` — second reference for variant template shape.
- `tests/tests/setup/templates/variant-startfromcg.ts` — third reference; covers the existing `startFromConstituency` case (E2E-04 cell 5).
- `tests/tests/setup/variant-multi-election.setup.ts` — canonical reference for the setup file that drives a variant project (used by Plan 02 + Plan 04 for the 3 new variants).
- `tests/playwright.config.ts` — Playwright project layout + the variant project dependency chain (lines 1-50 explain the project structure). Phase 74 Plans 02 + 04 add 3 new variant projects following this shape.

### Spec hosts (Phase 74 may extend / colocate)

- `tests/tests/specs/voter/voter-detail.spec.ts` — host for E2E-05 + E2E-07 extension (per D-13).
- `tests/tests/specs/voter/voter-popups.spec.ts` — feedback popup VOTE-15 already covered here (line 5, 72-94, 156-198); E2E-03 may colocate or fork to a new file (per D-13).
- `tests/tests/specs/variants/multi-election.spec.ts` — `Ne×1c` cell reused (per D-05); adds matrix assertions on top of existing CONF-01..CONF-06 invariants.
- `tests/tests/specs/variants/startfromcg.spec.ts` — `startFromConstituency` cell reused (per D-05).
- `tests/tests/specs/candidate/candidate-questions.spec.ts` — E2E-01 host neighborhood (translation surface lives on the candidate questions page; per D-13 candidate-translation.spec.ts is added as a sibling).

### Settings + dev-seed surface (Phase 74 will modify)

- `packages/app-shared/src/settings/staticSettings.ts:46-64` — `supportedLocales` (4 entries; en/fi/sv/da); hardcoded with NO runtime override (per D-04).
- `packages/app-shared/src/settings/dynamicSettings.ts:42` — `minimumAnswers: 5` default; overridden in `variant-low-minimum-answers` (per D-03).
- `packages/app-shared/src/settings/dynamicSettings.ts:88` — `hideHero: false` default; not in scope for Phase 74 (Phase 77 SETTINGS-03 covers per-question visibility).
- `packages/dev-seed/src/templates/e2e.ts` — base E2E template; D-07 extension target (add 4-case voter answers for E2E-05). Spec contract per §1-3 of `.planning/milestones/v2.5-phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md`.
- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte:85` — `description = $state('')`; reset triggered at line 134 (on send) but NOT on cancel — confirms the E2E-03 contract is implementation-derived (dismiss preserves the inner `$state`, send resets). E2E-03 asserts the contract, not the mechanism.
- `apps/frontend/src/lib/i18n/init.ts:11-34` — i18n init reads `staticSettings.supportedLocales`; sets `defaultLocale` per `isDefault`. E2E-08 exercises this code path; CLEAN-04 will tighten it (per D-06).

### Project-level conventions

- `CLAUDE.md` §"Development Commands" + §"Single Test Development" — `yarn test:e2e` invocation contract.
- `CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" — referenced if E2E-05/E2E-07 voter-detail extension surfaces a Svelte 5 reactivity hazard (e.g., destructured reactive accessor) in the existing spec.
- `tests/eslint.config.mjs` — post-Phase-73 lint config with 7 `playwright/*` rules at `'error'` (lint-gate bumped per Phase 73 DETERM-03 final step). All new specs MUST pass `yarn lint:check`.
- `tests/playwright.config.ts:43-50` — `timeout: 90000` (per-test 90s ceiling — established in Phase 64 P64-03 RECAPTURE for full-suite render-pressured fixtures); `fullyParallel: true`; `workers: process.env.CI ? 1 : 6`. New specs honor these.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`expect.poll(...)` race-tolerant assertion pattern** (v2.6 P64 D-11): `await expect.poll(async () => /* count */).toBeGreaterThan(0)`. Default polling 5s; configurable `{ timeout, intervals }`. Use this for any "X must eventually appear" contract in new specs.
- **`waitFor` against asserted element** (v2.6 P64): `await page.getByRole('...').waitFor({ state: 'visible' })`. The no-networkidle replacement of choice. Already the convention.
- **Semantic locators** (`getByRole`, `getByLabel`, `getByText`): canonical per `playwright/no-raw-locators` at `'error'` post-Phase-73 (per D-11).
- **`mergeSettings` from `@openvaa/app-shared`** (deep merge): canonical for variant template overlays. Source: `packages/app-shared/src/utils/merge.ts`; hoisted from frontend in v2.6 Phase 64 (per PROJECT.md "Last Shipped: v2.6"). NOT the frontend's shallow `mergeAppSettings`.
- **`baseFixed(table)` helper** (in `variant-multi-election.ts`): canonical pattern for variant templates that extend the base e2e template's `fixed[]` arrays without losing it.
- **`E2E_BASE_APP_SETTINGS`** from `@openvaa/dev-seed`: the base `app_settings.settings` JSONB payload; variant overlays compose ON TOP of this via `mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY)` (per `variant-multi-election.ts:35-50`).
- **`buildRoute` utility** (`tests/tests/utils/buildRoute.ts`): canonical route construction for spec navigation (`buildRoute({ route: 'CandAppQuestions', locale: 'en' })`); replaces raw URL strings.
- **`testIds.voter.*` / `testIds.candidate.*` map** (`tests/tests/utils/testIds.ts`): centralized testId registry — used only where role-based locators fall short (per D-11). Phase 74 specs SHOULD prefer role-based locators and add to this map only with `// reason:` justification.
- **`voter.fixture.ts answeredVoterPage`**: existing fixture-prepared voter page that has completed the answer loop. E2E-05/E2E-07/E2E-08 specs can build on top of this; E2E-02 (browse-without-match) needs the OPPOSITE — an UN-answered voter page under the low-minimumAnswers variant (Plan 02 may need a new fixture variant or a fresh-state navigation path).
- **`pages/voter/EntityDetailPage.ts` page object**: existing voter-detail page object; canonical for E2E-05/E2E-07 extension (per Phase 73 file-reviewed list).
- **Parity-script tooling** (`tests/scripts/diff-playwright-reports.ts` + `regen-constants.mjs`): restored in Phase 73 Plan 06; Phase 74 Plan 07 invokes the diff-script for the verification gate (per D-10).

### Established Patterns

- **3-run determinism gate** (v2.6 P64 + Phase 73 SC #4): single fresh `yarn dev:reset-with-data && yarn test:e2e --workers=1` followed by 2 re-runs without resetting; identical pass/fail set across all 3 runs is the gate. Phase 74 Plan 07 runs this gate at end of phase (per D-09 + D-12).
- **Per-spec investigative pass** (v2.6 P64 D-11): rewrite + race-fix in one go; produces a deterministic test contract per spec.
- **Inline `// reason:` justification for accepted lint warnings or test-id usage** (v2.8 P70 Cat A "Option A inline ignore-with-rationale preamble"; v2.8 P71 D-04 per-cast distribution): the canonical shape. Phase 74 specs follow this convention (per D-11).
- **Variant project shape** (Phase 59 + Phase 63): each variant is a Playwright project with `data-setup-<name>` dependency + `variant-<name>` test project, dependency-chained per `tests/playwright.config.ts:1-50`. Phase 74 adds 3 new variant projects (per D-02 + D-03).
- **Spec contract anchoring via `58-E2E-AUDIT.md`** (Phase 58 D-58-15 + D-58-16): every external_id / display-text contract that a spec depends on is anchored in the audit. D-07 extension may need an audit addendum (per Claude's Discretion).
- **Cluster-level vs per-cast `// reason:` annotations** (v2.8 P71 D-04): per-cast distribution preferred where strict reading expects it. If race fixes or new fixtures introduce `// reason:` annotations, distribute per-site.

### Integration Points

- **`tests/playwright.config.ts`** — 3 new variant projects + the spec inclusion paths (per D-02). Plan 04 modifies this most.
- **`packages/dev-seed/src/templates/e2e.ts`** — voter dataset extension target for E2E-05 (per D-07). Requires `yarn build @openvaa/dev-seed` after edit.
- **`tests/tests/setup/templates/index.ts`** — registers new variant templates; new entries land here.
- **`tests/tests/setup/`** — 3 new `variant-<name>.setup.ts` files; each follows the existing `variant-multi-election.setup.ts` shape.
- **`tests/tests/specs/voter/voter-detail.spec.ts`** — E2E-05/E2E-07 extension target.
- **`tests/tests/specs/variants/`** — host for E2E-04 cell-2 + cell-4 new specs.
- **`tests/tests/utils/`** — likely 1 new helper (`selectorMatrix.ts`?) if Plan 04 chooses the helper path; planner's call.
- **`tests/scripts/diff-playwright-reports.ts`** — Plan 07 invokes for the verification gate.

</code_context>

<specifics>
## Specific Ideas

- **E2E-01 multilocale assertion shape** — assert via `getByRole('tab', { name: t('candidate.questions.translations') })` (or equivalent aria-label-based locator). Walk: navigate to a candidate question where `localizationDisabled !== true`, switch to the translation tab, type a translation in `fi` (or another non-default locale), save, reload, assert the translation persists. NO test-id additions per D-11.
- **E2E-02 minimum-answers threshold** — `variant-low-minimum-answers` overlay sets `dynamicSettings.matching.minimumAnswers = 1` (or `0`); voter completes location and skips opinion questions; navigates to results; asserts (a) no match-score column visible (role/aria), (b) intro copy is the alternative no-match form (assert via `t('voter.results.intro.noMatches')` or equivalent translation key), (c) entity cards still render.
- **E2E-03 feedback sequence** — open feedback dialog via the feedback button (already exists per `voter-popups.spec.ts:72-94` reference); type literal text X (e.g. `'persistence test text'`); dismiss via the cancel button; reopen; assert textarea value === X; type new text Y; send (which may auto-close after success); reopen after auto-close; assert textarea value === `''`. The reset is triggered at `Feedback.svelte:134` on send — confirms the contract assertion is correct.
- **E2E-04 matrix assertion helper** — if planner chooses the helper path, signature: `assertSelectorCell({ page, elections, constituencies, expectURL, expectElectionVisible, expectConstituencyVisible, expectConstituencyOptions })`. Lives at `tests/tests/utils/selectorMatrix.ts`. Each variant spec invokes once.
- **E2E-05 4-case fixture marker** — annotate the 4 voter-entity answer pairs in `packages/dev-seed/src/templates/e2e.ts` with comment markers `E2E-05/case-(a)..(d)` matching audit convention. Spec asserts each marker pair by external_id lookup.
- **E2E-06 sequence** — fixture-load `answeredVoterPage` (voter has answered N ≥ `minimumAnswers` opinion questions); assert results-CTA enabled; navigate back to a question and delete the answer (bringing count below `minimumAnswers`); assert results-CTA disabled (or hidden); re-answer; assert re-enabled. Browser-back assertion: `await page.goBack()` after each state transition; assert answer state survives navigation.
- **E2E-07 per-category SubMatch assertion** — extend voter-detail's existing category-tab assertion block to walk per-category and assert per-category match percentage renders for both Manhattan (ordinal-question categories) AND directional (categorical-question categories) metric paths. Reuses the fixture's category metadata (already loaded in `voter-detail.spec.ts`).
- **E2E-08 locale switch path** — spec navigates to `/en/...` (assert key string in en); navigates to `/fi/...` via direct URL (route-prefixed form, asserts translated key string); navigates BACK to `/en/...` via locale-switcher widget IF it's present in the voter-app UI (locator: `getByRole('button', { name: /English|Suomi/ })` or equivalent). If no widget exists in the voter-app, document that in `74-VERIFICATION.md` and assert ONLY the route-prefixed path (still satisfies SC #8).
- **Variant project naming** — keep aligned with the existing `variant-<scenario>` convention (NOT `e2e-04-cell-2`-style numeric naming). Concrete: `variant-1e-Nc`, `variant-Ne-Nc`, `variant-low-minimum-answers`.
- **Planner re-baseline at PLAN.md time** — re-run `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=html` (or equivalent) at Phase 74 start to confirm the Phase 73 baseline (4 PASS_LOCKED / 15 DATA_RACE / 55 CASCADE) still holds before adding new specs. If baseline drifted, surface as a Phase 74 blocker before authoring specs.

</specifics>

<deferred>
## Deferred Ideas

- **E2E-01 single-locale variant** (D-04) — captured as new `.planning/todos/pending/` entry at phase close: add a `staticSettings.supportedLocales` runtime-override mechanism (or per-Playwright-project build-time variant); spec asserts translation tab does NOT render under single-locale config. Phase 74 PASS-WITH-DEFERRAL on ROADMAP SC #1.
- **Per-question visibility / must-answer enforcement** — Phase 77 SETTINGS-03. Not Phase 74.
- **`customData.allowOpen` E2E coverage** — Phase 77 SETTINGS-02. Not Phase 74.
- **A11y axe smoke + profile validation** — Phase 76 (A11Y-01/02/03). Not Phase 74.
- **i18n wrapper tightening (CLEAN-04)** — Phase 78. E2E-08 spec WILL re-validate against the tightened wrapper after Phase 78 lands (Order B per D-06).
- **CR-02 voter-popups race-tolerance regression** — Phase 78 CLEAN-05. Even though E2E-03 may share `voter-popups.spec.ts` (planner's call), the CR-02 fix is NOT a Phase 74 concern; the affected tests are CASCADE-pool entries today.
- **Phase 73 review backlog (CR-02 + 7 WR + 5 IN)** — Phase 78 CLEAN-05. Not Phase 74.
- **`tests/scripts/diff-playwright-reports.ts` permanent home + CI integration** — out of scope; the script is restored at HEAD per Phase 73 Plan 06 and is invoked manually per Plan 07.
- **Custom `expectEventually(locator, predicate)` helper** — deferred from Phase 73 (`73-CONTEXT.md §"Deferred Ideas"`). If Phase 74 specs use `expect.poll(...).toBeGreaterThan(0)` 5+ times, consider extracting; defer otherwise.
- **`58-E2E-AUDIT.md`-style addendum for D-07 voter-answer 4-case fixture** — recommended-but-not-blocking; planner's call.

### Reviewed Todos (not folded)

All keyword-matched todos surfaced by `gsd-sdk query todo.match-phase 74` are routed to OTHER phases per `.planning/STATE.md §"Deferred Items"`. Folding any of them into Phase 74 would create scope conflict.

- `2026-03-28-generalize-candidate-app-to-party-app.md` (score 0.9) — v2.10+ architectural change; NOT Phase 74. Pure keyword match (`candidate`).
- `2026-03-28-investigate-migrating-candidate-answer-store.md` (score 0.9) — architectural investigation; future milestone. NOT Phase 74.
- `2026-04-25-remove-mergesettings-reexports.md` (score 0.6) — already resolved by v2.8 P72 SHARED-01/02. Stale; surface for removal from `.planning/todos/pending/`.
- `2026-04-27-extend-e2e-filter-type-coverage.md` (score 0.6) — Phase 77 / SETTINGS-01. Folded into the toggle matrix per STATE.md.
- `2026-04-30-alliance-tab-rendering-and-sections-config.md` (score 0.6) — Phase 69 ALLIANCE-01 territory; already shipped. Stale.
- `2026-05-08-cleanup-65-01-bind-rationale-comments.md` (score 0.6) — v2.8 P70 BIND-01 territory; already shipped. Stale.
- `2026-05-09-claude-md-svelte-warning-accepted-format.md` (score 0.6) — Phase 78 / CLEAN-03 sub-finding 3.
- `2026-05-09-rewrite-parent-answer-imputation.md` (score 0.6) — matching-package internal; future matching-focused milestone.
- `2026-05-09-tighten-i18n-wrapper.md` (score 0.6) — Phase 78 / CLEAN-04 (paired with E2E-08 per D-06 Order B).

Remaining lower-score matches (< 0.6) are noise — Phase 74 is E2E-coverage spec authoring against the post-73 stable baseline, not architectural / cleanup / matching-package work.

</deferred>

---

*Phase: 74-High-Leverage E2E Coverage*
*Context gathered: 2026-05-11*
