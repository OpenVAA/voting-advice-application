# Phase 76: Profile + A11y - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning
**Mode:** `--auto` (single-pass; all gray areas auto-selected; recommended option chosen per question — see DISCUSSION-LOG.md for the audit trail)

<domain>
## Phase Boundary

Add three coverage workstreams to the post-Phase-73 deterministic Playwright baseline:

- **A11Y-01 — Candidate profile validation rejection paths.** Parameterized spec exercises bad-input cells (invalid email format; name length boundaries too short / too long; image type violation = non-image upload; image size violation = oversized upload). Each cell asserts (a) the validation error UI surfaces, (b) the unsaved state is preserved (input is not silently discarded). Happy paths remain covered by the existing `candidate-profile.spec.ts`.
- **A11Y-02 — Profile reload-persistence extension.** Extends v2.1 CAND-12 (currently asserts image + answers + comment text persistence after page reload) to cover the full editable-field surface — name, bio, social links. The fixture must include any info questions whose answers back those fields (social links specifically). Existing CAND-12 image + answers + comment coverage continues to pass alongside.
- **A11Y-03 — Wire `@axe-core/playwright` WCAG 2.1 AA smoke.** Add dev dependency + integrate as Playwright smoke. Initial coverage: 5 routes (home, election/constituency selector, questions flow, results list, voter-detail drawer). Gated behind `PLAYWRIGHT_A11Y=1` env flag matching the existing `PLAYWRIGHT_VISUAL` / `PLAYWRIGHT_PERF` convention (D-04). First-run violation baseline only — cite-and-fix of violations is explicitly OUT OF SCOPE for v2.9 (captured as a follow-up todo at phase close, per ROADMAP SC #3 + REQUIREMENTS A11Y-03).

Phase 76 is content-heavy spec authoring + a single dev-dep wiring on a stable suite — NOT new product behavior, NOT framework migration. Each new spec MUST pass 3× cold-start `--workers=1` identically; the Phase-73-locked DATA_RACE pool MUST NOT grow as a side effect. Phase 73 is a HARD prerequisite (closed 2026-05-11). Phase 74 / 75 already shipped (GREEN-WITH-DEFERRAL). May develop in parallel with Phases 77 / 78.

</domain>

<decisions>
## Implementation Decisions

### Plan grouping + sequence

- **D-01 — 4 plans, verification gate folded into final plan.** ROADMAP estimates "~3-4 plans — 1 plan per A11Y-0X requirement, with A11Y-03 potentially split into 'wire harness' + 'first-run baseline + follow-up todo capture'" (line 217). Auto-selected layout:
  1. **Plan 01 — A11Y-01 (validation rejection paths).** New file `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` (sibling of existing `candidate-profile.spec.ts`). Parameterized test runner walks 4 bad-input cells:
     - Invalid email format (against editable email info question if present; D-05 confirms fixture surface at PLAN.md time — fall back to a non-email field with format constraint if the e2e fixture has no editable email info question).
     - Name length too short (1 char on a name-bound info question with `maxlength` set such that there is also a minimum — note: name fields in the profile route at `profile/+page.svelte:198-211` are LOCKED display-only — D-05 requires the planner to confirm which info questions back the name surface; OR retarget to the editable name analog if no min-length exists, captured in `<deferred>`).
     - Name length too long (above the configured `maxlength`; HTML5 native enforcement at `Input.svelte:602` rejects characters past the limit so the spec asserts the input value caps OR a translation-string error surfaces if the field uses custom JS).
     - Image type violation (non-image file upload via `ProfilePage.uploadImage('non-image.txt')`); maps to `handleError('components.input.error.invalidFile')` at `Input.svelte:267`.
     - Image size violation (oversized file > `maxFilesize` MB, default 20 MB per `Input.svelte:90`); maps to `handleError('components.input.error.oversizeFile')` at `Input.svelte:269`.

     Each cell asserts: (a) the `ErrorMessage` component renders the expected i18n key (`getByText(t('components.input.error.invalidFile'))` etc.), (b) the unsaved input is preserved — the textarea/input retains the bad text OR the image-upload area shows the rejected file's filename so the user can correct it. NO submit success: each cell stops at the validation surface.
  2. **Plan 02 — A11Y-02 (profile reload-persistence extension).** Extends `candidate-profile.spec.ts` CAND-12 (lines 181-202) — or adds a new sibling `candidate-profile-persistence.spec.ts` if the existing file grows past the per-spec ceiling — to assert name + bio + social-link info-question answers persist after `page.reload()`. Reuses `loginAsCandidate(page)` helper (lines 76-83). Fixture extension to the e2e template at `packages/dev-seed/src/templates/e2e.ts` REQUIRED if the current info-question set does not include bio + social-link slots — D-06 details the fixture audit at PLAN.md time.
  3. **Plan 03 — A11Y-03 wire `@axe-core/playwright`.** Adds `@axe-core/playwright` to `tests/package.json` devDependencies (NOT root — keep the a11y harness isolated to the E2E workspace per the existing `playwright/eslint-plugin-playwright` precedent). Adds a new project entry in `tests/playwright.config.ts` gated behind `process.env.PLAYWRIGHT_A11Y` (D-04 — mirrors the existing PLAYWRIGHT_VISUAL block at lines 332-341 + PLAYWRIGHT_PERF at lines 344-353). New spec at `tests/tests/specs/a11y/a11y-smoke.spec.ts`. Wires `injectAxe()` + `checkA11y()` against the 5 routes (D-07). Production frontend code is NOT modified — the smoke records the violation baseline; cite-and-fix is deferred.
  4. **Plan 04 — A11Y-03 first-run baseline capture + follow-up todo + verification gate.** Runs the axe smoke on a cold-start `yarn dev:reset-with-data` (or its post-CLEAN-01 equivalent, but Phase 78 has not landed yet — use the imperative recipe per D-11). Captures the violation list per route into `76-A11Y-BASELINE.md` (a phase artifact, not gating). Files the cite-and-fix follow-up todo at `.planning/todos/pending/2026-05-12-a11y-axe-first-run-violations.md` (gives downstream phases a discrete entry to plan against). Runs the verification gate inline (vite-cache wipe per D-11 + 3-run cold-start `--workers=1` smoke + parity-script self-identity smoke + conditional constants regen per D-10); produces `76-VERIFICATION.md`. Same shape as Phase 74 P07 / Phase 75 P02b verification gates.

  Risk: Plan 04 carries both the first-run baseline AND the verification gate; if the violation count is large (likely — first axe scans typically surface dozens of WCAG findings against an unaudited frontend), the baseline-capture step expands the plan. Planner may split into 04a (baseline capture + follow-up todo) + 04b (verification gate) if Plan 04 scope exceeds the per-plan ceiling. Default: 1 bundled plan.

### Existing-coverage baseline (do NOT re-assert)

- **D-02 — Existing CAND-03 / CAND-12 / registration coverage in `candidate-profile.spec.ts` continues to pass.** Phase 76 is ADDITIVE:
  - CAND-03 (lines 147-179) — profile image upload happy path; NOT touched.
  - CAND-12 (lines 181-202) — image + answers + comment-text persistence after reload; A11Y-02 EXTENDS the assertion surface (name + bio + social links) but does NOT replace the image assertion.
  - Registration flow (lines 85-145) — fresh candidate registration; NOT touched.

  A11Y-01's NEW spec file decouples the rejection-path assertions from the happy-path file (cleaner separation; mirrors Phase 75 D-04 "scope-marked file names" pattern — e.g., `voter-question-rendering-boolean.spec.ts` vs. `voter-matching.spec.ts`). Planner may opt to extend `candidate-profile.spec.ts` directly if the rejection cells fit cleanly under its `test.describe.configure({ mode: 'serial' })` block — Claude's Discretion.

### Validation surface — what the rejection paths actually assert

- **D-03 — 4 cells, fail-loud rationale per cell.** Per the scout's profile-validation map:
  - **Image rejection cells (2 cells — guaranteed surface):** `Input.svelte:265-285` enforces type + size at the file-input handler. Both branches call `handleError(...)` which renders the `ErrorMessage` inline component at line 629. The spec uses `ProfilePage.uploadImage(filePath)` (`tests/tests/pages/candidate/ProfilePage.ts:24-37`) with a non-image file (e.g., a `.txt` fixture) for type rejection, and an oversized image fixture for size rejection.
  - **Email format cell:** The profile route at `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` reuses `<QuestionInput>` for editable info questions; HTML5 `type="email"` is only used in the preregister/login routes today (per scout §2). The email-format cell either (a) targets a non-locked info question with `customData.format === 'email'` (planner verifies at PLAN.md time by reading the seed) OR (b) is DEFERRED to a follow-up todo if no profile-form email field exists. Default: (a) with PLAN.md fallback to (b).
  - **Name length cells:** Profile firstName/lastName fields are LOCKED display-only at `profile/+page.svelte:198-211`. The name-length boundary cells therefore target editable info questions with `customData.maxlength` set (e.g., a "display name" / "headline" / "bio" question). Planner confirms the editable-name analog at PLAN.md time. If the seed has only `maxlength` (no `minlength`), the "too short" boundary becomes "empty string" (testing the empty-state rejection path) — planner's call at PLAN.md time.

  **Translation key contract:** Every error-message assertion uses the i18n key — `t('components.input.error.invalidFile')`, `t('components.input.error.oversizeFile')`, etc. — to avoid hard-coded English strings (mirrors Phase 74 E2E-01 + Phase 75 QSPEC-01 patterns). Planner imports the i18n surface the same way Phase 74 P01 / Phase 75 P01 did.

### Axe smoke wiring + env-flag gating

- **D-04 — `PLAYWRIGHT_A11Y` env flag gates the new project.** Mirrors the existing `PLAYWRIGHT_VISUAL` (lines 332-341) + `PLAYWRIGHT_PERF` (lines 344-353) conditional-project pattern in `tests/playwright.config.ts`. Concrete shape:

  ```typescript
  ...(process.env.PLAYWRIGHT_A11Y
    ? [
        {
          name: 'a11y-smoke',
          testDir: './tests/specs/a11y',
          use: { ...devices['Desktop Chrome'] },
          dependencies: ['data-setup']
        }
      ]
    : []),
  ```

  **NOT default-on:** Default `yarn test:e2e` invocations do NOT trigger the axe smoke. Opt-in: `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke`. Rationale: axe scans are slower than functional Playwright assertions; first-run baseline approach means the smoke is exploratory, not gating. Mirrors PLAYWRIGHT_VISUAL precedent (visual-regression scans are opt-in for the same reason).

  Reverse alternative considered + REJECTED:
  - Run axe in every `yarn test:e2e` invocation (`fullyParallel: true` adds the smoke to the default run). REJECTED — adds ~30-60s to every CI run for a baseline-only deliverable; violates the "stable signal first, coverage on top" v2.9 strategy.
  - Add `@axe-core/playwright` to root `package.json` devDependencies. REJECTED — keeps the a11y harness isolated to the E2E workspace; matches how `playwright/eslint-plugin-playwright` is already scoped (per scout §4).

### Profile fixture extension for A11Y-02

- **D-05 — Profile field surface depends on seed info questions.** Per scout §7: editable profile fields are RENDERED from `candCtx.infoQuestions.filter((q) => !getCustomData(q).locked)` (profile/+page.svelte:277-280). The fixture's info-question set in `packages/dev-seed/src/templates/e2e.ts` determines which fields are testable.

  Phase 76 A11Y-02 covers:
  - **Name** — REQUIRES an editable non-locked info question whose answer is intended as the candidate's display name. Planner audits the current e2e seed at PLAN.md time; if NO such field exists, Plan 02 extends the seed (mirrors Phase 74 P05 + Phase 75 P01 "extend e2e template" pattern).
  - **Bio** — REQUIRES an editable info question (likely text-typed with `customData.longText: true` to render as `<textarea>`). Same fixture audit applies.
  - **Social links** — REQUIRES one or more info questions whose `customData.format === 'url'` (or similar). Same fixture audit applies. ROADMAP SC #2 explicitly says "the fixture's info questions must include them — fixture must include the social-link info questions for the spec to assert that surface."

  **Default approach:** Extend `e2e.ts` info-question fixed[] to include name + bio + 2 social-link slots IF not already present, with candidate Alpha's answers pre-populated so the spec can save → reload → assert. NO new variant template (same shape as Phase 74 P05 + Phase 75 P01 — single-template extension preserves the base `voter-app` / `candidate-app` Playwright project).

- **D-06 — Fixture audit at PLAN.md time.** Planner re-reads `packages/dev-seed/src/templates/e2e.ts` info-question block at Plan 02 start. Concrete deliverable: a table mapping (profile field → fixture info-question external_id → planner action). Three possible outcomes per field:
  - EXISTS — use as-is, spec asserts persistence.
  - MISSING — extend the fixture (1 new info question + Alpha answer cell); spec asserts persistence.
  - PRODUCT-GAP — the field doesn't render in the profile UI (e.g., social links surface is unimplemented); DEFERRED to follow-up todo; planner records in `76-VERIFICATION.md`.

### Axe smoke routes + assertion shape

- **D-07 — 5-route smoke matches ROADMAP SC #3 literally.** Per scout §6:

  | Route | Path (en) | Spec already exercises | Smoke entry |
  |---|---|---|---|
  | Home (voter landing) | `/` | voter-journey.spec.ts (VOTE-02 / VOTE-04) | `await page.goto(buildRoute({ route: 'Home', locale: 'en' }))` → settle → `checkA11y(page)` |
  | Selector (election/constituency) | `/elections` / `/constituencies` | voter-journey.spec.ts (VOTE-02 / VOTE-03 implicitly) | navigate via test-id `electionSelector` / `constituencySelector` controls — assert AFTER selector renders, NOT during dropdown animation (per D-08 flakiness mitigation) |
  | Questions flow | `/(voters)/(located)/questions` | voter-journey.spec.ts (VOTE-04 / VOTE-06) | Walk to question 1 → settle → `checkA11y(page)` |
  | Results list | `/(voters)/(located)/results` | voter-results.spec.ts | Walk to results page (post-answer-loop or via low-minimumAnswers path) → settle → `checkA11y(page)` in default state (candidate tab, no filters applied) |
  | Voter-detail drawer | rendered as overlay on results/+layout.svelte | voter-detail.spec.ts | Open drawer via candidate card click → wait for drawer `toBeVisible()` → `checkA11y(page)` |

  **Each scan asserts `violations.length` is captured to a structured baseline artifact, NOT compared against a hardcoded expected count.** First-run = baseline; subsequent runs against an unchanged frontend produce IDENTICAL violation lists (this is the SC #4 determinism contract for the smoke — surfaced violations must be deterministic, the smoke does not assert a specific count).

  Baseline artifact: `76-A11Y-BASELINE.md` produced at Plan 04. Format: per-route list of (rule-id, impact, count). Cite-and-fix is a separate downstream phase (not v2.9).

- **D-08 — Flakiness mitigation:** Axe scans take a DOM snapshot. Mitigations:
  - Scan AFTER explicit content-visibility waits (`await page.getByRole('heading').first().waitFor()` or equivalent role-based settle), NEVER mid-animation.
  - Selector route: select a constituency BEFORE scanning so the dropdown's mutable state is fully resolved.
  - Results page: scan in default state (candidate tab, no filters); do NOT scan during a filter-toggle transition.
  - Voter-detail drawer: scan AFTER drawer `toBeVisible()` wait so async rendering completes.

  No animation-disabled context needed (axe is static-DOM, not pixel-diff like visual-regression). Per scout §8 the determinism risk is LOW IF routes are navigated in order + scans run post-load-settle.

### Determinism contract + parity-gate regen

- **D-09 — Determinism contract (ROADMAP SC #5 + SC #4):** All new specs MUST pass 3× cold-start `--workers=1` identically per the Phase-73 gate shape. New specs are EXPECTED to land in `PASS_LOCKED`; any new spec that lands in `DATA_RACE` requires per-test rationale in `76-VERIFICATION.md` (per Phase 73 D-02 + D-09 + Phase 74 D-09 + Phase 75 D-07 pattern — env-gated, infrastructure flake, deferred bug). The Phase-73-locked `DATA_RACE` pool MUST NOT grow as a side effect of Phase 76.

  **Axe smoke determinism:** The smoke does NOT enter the regular parity baseline (it's gated behind `PLAYWRIGHT_A11Y`). Per D-04 the axe project is opt-in; the 3-run gate runs the DEFAULT project set, not the axe project. The axe-smoke determinism check is a separate one-shot at Plan 04 (run twice in succession on the same baseline; identical violation lists → smoke is deterministic).

- **D-10 — Parity-script constants regen — conditional.** Re-run `tests/scripts/diff-playwright-reports.ts` constants regen via Phase 73 P06 `regen-constants.mjs` (per Phase 74 D-10 + Phase 75 D-08 source map) **only if**:
  - New tests are added to the DEFAULT baseline (Plans 01 + 02 add new test IDs — REGEN IS EXPECTED for the +N new PASS_LOCKED entries), OR
  - The cold-start pass/fail set changes for any pre-existing test.

  No new variant projects in Phase 76 (D-05 declines that path; D-04 axe project is OUT of the default baseline). Plan 04 verification step decides if regen is needed.

  **IMGPROXY_TIED_TITLES safety:** Phase 76 specs DO touch entity-detail drawer image-upload paths (A11Y-01 image rejection cells + A11Y-02 image persistence reuse from CAND-12). Planner reads `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:11-32` for the bound title list BEFORE authoring specs to confirm new spec names do NOT collide with the structurally-fragile IMGPROXY_TIED_TITLES pattern (per Phase 74 D-10 CRITICAL note + Phase 75 D-08 inheritance).

### Locator + lint convention

- **D-11a — Inherits Phase 74 D-11 / Phase 75 D-06.** Role/aria locators by default (`getByRole`, `getByLabel`, `getByText`); `getByTestId(...)` only as a SCOPE wrapper with inline `// reason:` annotation per the v2.7 P67 / v2.8 P70 Cat A / Phase 73 IN-03 convention. The post-Phase-73 `playwright/no-raw-locators` lint rule at `'error'` is non-negotiable; all new specs MUST pass `yarn lint:check` clean.

  Specifically Phase 76 will re-use the EXISTING `testIds.candidate.profile.{submit, imageUpload, returnButton}` registry (per scout §1) — these are already justified by the existing CAND-03 / CAND-12 tests. NEW test-id additions are NOT expected for Phase 76 (validation errors, axe scan results, and persistence reads are all role/aria-locatable).

### Vite-cache wipe + end-of-phase gate

- **D-11 — Vite-cache wipe is mandatory before the 3-run smoke.** Plan 04's verification gate MUST start with `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` per the v2.8-close gotcha + Phase 73 P06 recipe + Phase 74 D-12 + Phase 75 D-09 inheritance. The v2.9 Phase 78 / CLEAN-01 `dev:clean` script is the durable form; Phase 76 uses the imperative recipe directly (Phase 78 has not landed yet; do not wait for CLEAN-01).

### Plan order + dependency direction

- **D-12 — Plan 01, 02, 03, 04 mostly-serial; some parallelism possible.** Plan 01 (A11Y-01 validation paths) and Plan 02 (A11Y-02 persistence) both touch `candidate-profile*.spec.ts` neighborhood and the seed; serial to avoid merge conflict. Plan 03 (axe wiring) is independent of Plans 01 + 02 (touches `tests/package.json` + `tests/playwright.config.ts` + new `tests/specs/a11y/` directory). Plan 04 verification gate requires Plans 01 + 02 + 03 all landed (it asserts the 3-run determinism contract + captures the axe baseline). Default order: 01 → 02 → 03 → 04 strict serial. Planner may parallelize 01 with 03 if Plan 03 stays out of the seed (D-04 keeps it out).

  Parallel-with-other-phases: Phase 76 runs in parallel with Phases 77 + 78 (per ROADMAP line 211); those touch different surfaces (settings matrix in 77; cleanup in 78).

### Claude's Discretion

- **Whether A11Y-01 lives in `candidate-profile-validation.spec.ts` (new file) or extends `candidate-profile.spec.ts`.** Default: new file per the scope-marked-filenames precedent (Phase 75 D-04). Alternative: extend existing file under the serial-mode block. Planner's call at PLAN.md time based on the existing file's size + cohesion.
- **Whether A11Y-02 extends `candidate-profile.spec.ts` directly (close to CAND-12) or splits into `candidate-profile-persistence.spec.ts`.** Default: extend (CAND-12's pattern is the immediate analog; new fields slot naturally beneath the existing image assertion). Alternative: split if the existing file grows past a per-spec readability ceiling.
- **Whether the axe baseline artifact lives at `76-A11Y-BASELINE.md` (phase-local) or as a top-level project artifact.** Default: phase-local (matches Phase 73's `73-PARITY-BASELINE.md` precedent — phase-scoped baselines stay in the phase directory until promoted to a project-level artifact by a downstream cite-and-fix phase). Alternative: promote at Phase 76 close if the downstream phase is already framed.
- **Whether the axe smoke runs against ONE locale (en) or all 4 (en/fi/sv/da).** Default: 1 locale (en) for the first-run baseline. Rationale: axe scans don't typically surface locale-specific WCAG violations (translations are TEXT content, not WCAG structure); cite-and-fix will surface any locale-asymmetric violations after the en baseline is fixed. Alternative: 4 locales — REJECTED for v2.9 scope (4× the violation list with marginal additional signal).
- **Whether to capture violations as JSON for diffability (e.g., for future CI cite-and-fix tooling).** Default: markdown for human review at v2.9 (`76-A11Y-BASELINE.md`). Alternative: dual JSON + markdown — RECOMMENDED but not blocking; planner can add JSON serialization at Plan 04 if it doesn't bloat the plan.
- **Whether to extend the seed AT ALL for A11Y-02.** Default: extend if + only if the field is missing AND the field has a real product render surface (D-06 PRODUCT-GAP outcome). If the field doesn't render in the product, A11Y-02 PASSES-WITH-DEFERRAL on that field (mirrors Phase 74 D-04 single-locale precedent + Phase 75 D-03 multi-choice precedent).

### Folded Todos

None folded. The keyword-matched todos surfaced by `gsd-sdk query todo.match-phase 76` route to OTHER phases per `.planning/STATE.md §"Deferred Items"` (see "Reviewed Todos" under `<deferred>`). Phase 76's scope is bounded by REQUIREMENTS A11Y-01/02/03; folding peripheral todos would create scope conflict.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 76 anchors (REQUIREMENTS / ROADMAP / STATE / PROJECT)

- `.planning/REQUIREMENTS.md` §A11Y-01 / A11Y-02 / A11Y-03 — locked success criteria; the per-requirement-ID contract.
- `.planning/ROADMAP.md` §"Phase 76: Profile + A11y" (lines 211-219) — phase goal + dependencies + 5 success criteria + plan estimate.
- `.planning/STATE.md` — v2.9 milestone state; Phase 75 closed 2026-05-12; Phase 76 / 77 / 78 ready to discuss/plan.
- `.planning/PROJECT.md` §"Current Milestone: v2.9" — milestone framing + 6-phase shape + Phase 76 is one of 4 coverage phases that run in parallel post-Phase-73.

### Pattern references (Phase 73 — determinism contract + tooling)

- `.planning/phases/73-determinism-baseline/73-CONTEXT.md` D-01..D-10 — binding determinism contract Phase 76 inherits (3-run `--workers=1` cold-start identical pass/fail; per-test rationale for any DATA_RACE entry; vite-cache wipe recipe).
- `.planning/phases/73-determinism-baseline/73-VERIFICATION.md` — verdict + 5/5 PASS table + 3-run SHA-identity + parity-gate output. The Phase-73-locked baseline contract Phase 76 MUST preserve.
- `tests/scripts/diff-playwright-reports.ts` — parity-script restored in Phase 73 P06. Phase 76 P04 invokes it for the verification gate (per D-10).
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs` — one-shot constants regenerator; bind-source if Phase 76 needs constants regen for new PASS_LOCKED entries.
- `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:11-32` — IMGPROXY_TIED_TITLES list referenced from `regen-constants.mjs`; structurally fragile — read before Plan 04 verification gate (per D-10).

### Pattern references (Phase 74 / 75 — direct precedents)

- `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` D-09..D-13 — determinism contract + vite-cache wipe + locator convention + spec file layout. Phase 76 inherits verbatim.
- `.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md` — verdict shape (GREEN-WITH-DEFERRAL); Phase 76's `76-VERIFICATION.md` follows the same structure.
- `.planning/phases/75-question-rendering-specs/75-CONTEXT.md` D-01 / D-04 / D-06 / D-09 — small-phase plan layout (verification gate folded into final plan); spec-file naming with scope markers; role/aria + `// reason:` test-id convention; vite-cache wipe. Phase 76 follows the same patterns at a slightly larger scale (4 plans vs. 2).
- `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` — Phase 75 verdict shape.
- `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` D-04 — PASS-WITH-DEFERRAL precedent for E2E-01 single-locale. Phase 76 D-05/D-06 mirror this for any A11Y-02 field that's a PRODUCT-GAP (no render surface).

### Profile + validation surface (Phase 76 will assert against)

- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:198-211` — locked firstName/lastName display fields. Confirms why name length cells (D-03) target editable info-question analogs, not the locked display fields.
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:266-272` — `<Input type="image">` for profile picture upload; the image rejection cells (A11Y-01 image type / size) assert against this surface.
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:277-280` — editable info-question loop (`candCtx.infoQuestions.filter((q) => !getCustomData(q).locked)`); the name/bio/social-link assertion cells (A11Y-02) and the length-boundary cells (A11Y-01 name length) target the info-questions rendered here.
- `apps/frontend/src/lib/components/input/Input.svelte:90` — `maxFilesize: 20` (default 20 MB ceiling for image upload). A11Y-01 image-size cell asserts the rejection branch fires above this.
- `apps/frontend/src/lib/components/input/Input.svelte:265-285` — file-input handler; type + size validation logic. Both branches call `handleError(...)`. A11Y-01 image cells assert this surface.
- `apps/frontend/src/lib/components/input/Input.svelte:267` — `'components.input.error.invalidFile'` i18n key emitted for non-image upload. Spec uses `t('components.input.error.invalidFile')`.
- `apps/frontend/src/lib/components/input/Input.svelte:269` — `'components.input.error.oversizeFile'` i18n key emitted for oversized upload. Spec uses `t('components.input.error.oversizeFile')`.
- `apps/frontend/src/lib/components/input/Input.svelte:602` — HTML5 native `maxlength` on `<input type="text">`. A11Y-01 name-length-too-long cell asserts via input value cap OR translation-string error.
- `apps/frontend/src/lib/components/input/Input.svelte:629` — `ErrorMessage` component (inline variant) renders the translation string. Spec asserts via `getByText(t('...'))`.
- `apps/frontend/src/lib/components/input/QuestionInput.svelte:79-85` — bridges `customData.maxlength` from Question data to Input component. Confirms `maxlength` is sourced from seed `custom_data` JSONB.
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — answer persistence layer (the `as Json` cluster mentioned in Phase 78 CLEAN-03a). Phase 76 A11Y-02 asserts post-reload reads complete; per D-02 the existing CAND-12 image-persistence assertion already exercises this surface.

### Spec hosts (Phase 76 may extend / colocate)

- `tests/tests/specs/candidate/candidate-profile.spec.ts:1-204` — host for A11Y-01 + A11Y-02 (per D-01). CAND-12 lives at lines 181-202; A11Y-02 extends or splits from this pattern.
- `tests/tests/specs/candidate/candidate-profile.spec.ts:31-44` — comment block ("Pattern 4 canonical 3") documenting the hoisted `loginIfRedirectedToLoginPage` helper to satisfy `playwright/no-conditional-in-test`. Phase 76 specs inherit this pattern.
- `tests/tests/specs/candidate/candidate-profile.spec.ts:46-61` — hoisted `loginIfRedirectedToLoginPage(page, email, password)` helper. Reused.
- `tests/tests/specs/candidate/candidate-profile.spec.ts:76-83` — `loginAsCandidate(page)` helper. Reused.
- `tests/tests/pages/candidate/ProfilePage.ts:1-46` — `ProfilePage` page object; `uploadImage(filePath)` at lines 24-37 is the canonical entry for A11Y-01 image rejection cells.

### Axe smoke wiring surface (Phase 76 will modify in P03 + P04)

- `tests/playwright.config.ts:325-367` — conditional-project pattern block. PLAYWRIGHT_VISUAL at lines 332-341; PLAYWRIGHT_PERF at lines 344-353. Phase 76 P03 adds a third PLAYWRIGHT_A11Y entry here.
- `tests/playwright.config.ts:43-50` — `timeout: 90000`; `fullyParallel: true`; `workers: process.env.CI ? 1 : 6`. Axe smoke project honors these.
- `tests/package.json` — devDependencies destination for `@axe-core/playwright`. Phase 76 P03 adds the dep here (NOT root package.json per D-04).
- `tests/tests/specs/visual/visual-regression.spec.ts` — pattern reference for an opt-in specialized smoke (under PLAYWRIGHT_VISUAL). Phase 76 P03's new spec follows the same shape.

### Routes for axe smoke (Phase 76 will navigate)

- `apps/frontend/src/lib/utils/route/route.ts:1-86` — route ID → path map. Used via `buildRoute({ route: 'Home', locale: 'en' })`.
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/+page.svelte` — voter landing (home).
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/elections/+page.svelte` — election selector.
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/constituencies/+page.svelte` — constituency selector.
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/` — questions flow.
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+page.svelte` — results list.
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+layout.svelte` — voter-detail drawer overlay host.

### Project-level conventions

- `CLAUDE.md` §"Development Commands" + §"Single Test Development" — `yarn test:e2e` invocation contract. The post-CLEAN-01 (Phase 78) `db:*` rename is not yet active; Phase 76 uses the existing `dev:*` aliases.
- `CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" — Phase 76 specs assert against the candidate context; if a destructuring-rule hazard surfaces, the canonical anchor is here.
- `tests/eslint.config.mjs` — post-Phase-73 lint config with 7 `playwright/*` rules at `'error'`. All new specs MUST pass `yarn lint:check`.
- `tests/playwright.config.ts:43-50` — `timeout: 90000`; new specs honor.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`ProfilePage` page object** (`tests/tests/pages/candidate/ProfilePage.ts:1-46`) — `uploadImage(filePath)` (lines 24-37) + `submit()` methods. A11Y-01 image rejection cells call `uploadImage('non-image.txt')` / `uploadImage('oversized.png')`.
- **`loginAsCandidate(page)`** (`candidate-profile.spec.ts:76-83`) — login helper. A11Y-01 + A11Y-02 specs start here.
- **`loginIfRedirectedToLoginPage(page, email, password)`** (`candidate-profile.spec.ts:46-61`) — hoisted to satisfy `playwright/no-conditional-in-test`. Phase 76 specs inherit the pattern.
- **`testIds.candidate.profile.{submit, imageUpload, returnButton}`** — existing registry per scout §1; reused for scope wrappers with `// reason:` blocks if needed.
- **`Input.svelte`'s `handleError(key)` → `ErrorMessage` render path** — the canonical validation-error surface. A11Y-01 cells assert against `ErrorMessage`'s rendered text via `getByText(t('...'))`.
- **`PLAYWRIGHT_VISUAL` / `PLAYWRIGHT_PERF` conditional-project pattern** (`tests/playwright.config.ts:332-341 / 344-353`) — canonical opt-in smoke project shape. Phase 76 P03 mirrors for `PLAYWRIGHT_A11Y`.
- **`@axe-core/playwright`** — NOT yet a dep (per scout §4). Phase 76 P03 adds to `tests/package.json` devDependencies.
- **`buildRoute({ route, locale })`** (`tests/tests/utils/buildRoute.ts`) — canonical route construction. Axe smoke uses for navigation.
- **`page.reload()` + role-based assertion** pattern (`candidate-profile.spec.ts:181-202` CAND-12). A11Y-02 extends this to name + bio + social-link assertions.

### Established Patterns

- **3-run determinism gate** (v2.6 P64 + Phase 73 SC #4 + Phase 74 D-09 + Phase 75 D-07): single fresh `yarn dev:reset-with-data && yarn test:e2e --workers=1` followed by 2 re-runs without resetting; identical pass/fail set across all 3 runs is the gate. Phase 76 P04 runs this gate at end of phase (per D-09 + D-11).
- **Inline `// reason:` justification for accepted lint warnings or test-id usage** (v2.8 P70 Cat A / v2.8 P71 D-04 / Phase 73 D-07 / Phase 74 D-11 / Phase 75 D-06): canonical shape. Phase 76 specs follow.
- **Scope-marked filenames** (Phase 75 D-04): `candidate-profile-validation.spec.ts` (A11Y-01) decouples from `candidate-profile.spec.ts` (happy paths); makes the dedup audit explicit. Phase 76 inherits where the new spec scope differs from the existing file's scope.
- **Single-template fixture extension** (Phase 74 P05 + Phase 75 P01): if A11Y-02 needs new info questions, extend `packages/dev-seed/src/templates/e2e.ts` directly (no new variant project). Same shape Phase 75 P01 used for the boolean question.
- **Opt-in specialized smoke under env flag** (`tests/specs/visual/` under `PLAYWRIGHT_VISUAL`): Phase 76 P03's axe smoke at `tests/specs/a11y/` under `PLAYWRIGHT_A11Y` mirrors the structure.
- **PASS-WITH-DEFERRAL for unimplemented surfaces** (Phase 74 D-04 + Phase 75 D-03): when a SC clause requires a render path that doesn't exist in the product, defer with a `.planning/todos/pending/` follow-up. Phase 76 D-06 mirrors for any A11Y-02 field that's a PRODUCT-GAP.

### Integration Points

- **`packages/dev-seed/src/templates/e2e.ts`** — Plan 02 MAY modify (extend info-question set + Alpha answer cells for name/bio/social links per D-05/D-06). Requires `yarn build @openvaa/dev-seed` after edit. No new variant.
- **`tests/tests/specs/candidate/candidate-profile-validation.spec.ts`** — NEW file (Plan 01) — or extension to `candidate-profile.spec.ts` per Claude's Discretion.
- **`tests/tests/specs/candidate/candidate-profile.spec.ts`** — Plan 02 EXTENDS (A11Y-02) OR Plan 02 adds new `candidate-profile-persistence.spec.ts` per Claude's Discretion.
- **`tests/package.json`** — Plan 03 adds `@axe-core/playwright` devDep.
- **`tests/playwright.config.ts:325-367`** — Plan 03 adds PLAYWRIGHT_A11Y conditional-project entry.
- **`tests/tests/specs/a11y/a11y-smoke.spec.ts`** — NEW file (Plan 03).
- **`tests/scripts/diff-playwright-reports.ts`** — Plan 04 invokes for the verification gate.
- **`.planning/todos/pending/2026-05-12-a11y-axe-first-run-violations.md`** — NEW follow-up todo (Plan 04 files this at phase close per ROADMAP SC #3).
- **`76-A11Y-BASELINE.md`** — NEW phase artifact (Plan 04 captures first-run violations).
- **NO changes to:** `apps/frontend/src/lib/components/input/Input.svelte` (Phase 76 asserts AGAINST existing validation paths; does NOT modify them). `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` (no production-code changes; cite-and-fix is out of scope). `packages/data/` (no schema changes).

</code_context>

<specifics>
## Specific Ideas

- **A11Y-01 cell-shape (parameterized test runner):**
  ```ts
  const validationCells = [
    { name: 'invalid-email', field: 'test-info-question-email', input: 'not-an-email', errKey: 'components.input.error.invalidEmail' },
    { name: 'name-empty',    field: 'test-info-question-displayname', input: '',          errKey: 'components.input.error.required' },
    { name: 'name-too-long', field: 'test-info-question-displayname', input: 'x'.repeat(201), errKey: null /* HTML5 maxlength caps */ },
    { name: 'image-type',    field: '__image__', file: 'fixtures/not-an-image.txt', errKey: 'components.input.error.invalidFile' },
    { name: 'image-size',    field: '__image__', file: 'fixtures/oversized.png',    errKey: 'components.input.error.oversizeFile' },
  ];
  for (const cell of validationCells) {
    test(`A11Y-01 ${cell.name} surfaces error + preserves input`, async ({ page }) => { /* … */ });
  }
  ```
  Exact field external_ids confirmed at PLAN.md time after fixture audit (D-05/D-06).
- **A11Y-02 walk:** Login as Alpha → navigate to /candidate/profile → for each field in (image, displayName, bio, socialLink1, socialLink2) → assert pre-populated value → `page.reload()` → assert each field STILL shows the same value. The existing CAND-12 (lines 181-202) covers the image + answers + comment-text branch; A11Y-02 adds the displayName + bio + socialLink branches.
- **A11Y-03 spec sketch:**
  ```ts
  import AxeBuilder from '@axe-core/playwright';
  import { test } from '@playwright/test';

  const ROUTES = [
    { name: 'home', route: 'Home', settle: () => page.getByRole('heading').first().waitFor() },
    { name: 'elections', route: 'Elections', settle: () => /* selector dropdown settle */ },
    { name: 'constituencies', route: 'Constituencies', settle: () => /* … */ },
    { name: 'questions', route: 'CandAppQuestions' /* or voter questions route */, settle: () => /* … */ },
    { name: 'results', route: 'Results', settle: () => page.getByRole('list').first().waitFor() },
    { name: 'voter-detail', route: 'Results', settle: async () => { /* click candidate, await drawer */ } },
  ];
  for (const r of ROUTES) {
    test(`A11Y-03 axe smoke — ${r.name}`, async ({ page }) => {
      await page.goto(buildRoute({ route: r.route, locale: 'en' }));
      await r.settle();
      const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
      // Record violations to baseline artifact; do NOT assert count.
      console.log(`[A11Y-03] ${r.name}: ${results.violations.length} violations`);
    });
  }
  ```
- **`76-A11Y-BASELINE.md` shape:**
  ```markdown
  # Phase 76 Axe Smoke — First-Run Baseline (2026-05-12)
  ## Route: home
  - color-contrast (serious) × 3
  - aria-required-children (critical) × 1
  ## Route: elections
  - ...
  ```
- **Cite-and-fix follow-up todo content:** Captured at Plan 04 close — `2026-05-12-a11y-axe-first-run-violations.md`. Lists per-route violation rule-IDs + impact + count; flags `.planning/phases/76-profile-a11y/76-A11Y-BASELINE.md` as the source; estimates per-violation fix effort (small if e.g. missing alt-text, large if requires re-architecting headings). Routes the todo to the v2.10+ backlog (cite-and-fix is NOT v2.9 scope).
- **`@axe-core/playwright` version pin:** Planner picks the latest stable at Plan 03 (currently `^4.x` per npm). Pin to caret-major; minor updates auto-pick up rule-set improvements. Bind: `tests/package.json` devDependencies.
- **Planner re-baseline at PLAN.md time:** Re-run `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=html` at Phase 76 start to confirm the Phase 75-close baseline holds. If baseline drifted, surface as a Phase 76 blocker before authoring specs. Mirrors Phase 74 + 75 specifics.

</specifics>

<deferred>
## Deferred Ideas

- **Cite-and-fix WCAG violations** (D-07 + ROADMAP SC #3): Out of scope for v2.9. A11Y-03 wires the harness + captures the first-run baseline ONLY. A new follow-up todo at `.planning/todos/pending/2026-05-12-a11y-axe-first-run-violations.md` (filed at Plan 04 close) scopes the cite-and-fix work for a downstream phase / milestone. Per ROADMAP "A11Y-03 is wiring + first-run baseline only."
- **Single-locale axe coverage** (Claude's Discretion in D-07): Multi-locale axe scans (4× the baseline volume) are deferred. v2.9 baseline is en only; future cite-and-fix may extend.
- **Real-time axe in CI gating** (D-04 alternative): The smoke is OPT-IN behind `PLAYWRIGHT_A11Y`. Default CI does NOT enforce axe pass/fail. Future phase can promote to gating once the baseline violations are fixed.
- **Profile field expansion (e.g., audio bio, video portrait)**: Out of phase scope — A11Y-02 covers ONLY name + bio + social links (per ROADMAP SC #2). Other future field surfaces belong in future phases.
- **JSON-serialized axe results for CI tooling integration** (Claude's Discretion in D-04): Default is markdown for the v2.9 baseline. Future cite-and-fix tooling can promote to JSON.
- **A11Y-01 PRODUCT-GAP fields** (D-03): If the e2e fixture does not include an editable email info question OR the social-link field doesn't render in the profile UI (D-06 PRODUCT-GAP outcome), those cells DEFER with a follow-up todo. PASSES-WITH-DEFERRAL on the relevant SC clause.
- **Visual-regression-style baseline drift detection for axe results**: Out of phase scope; current approach is a one-shot baseline. Drift detection (compare against prior baseline; surface deltas) belongs in the cite-and-fix downstream phase.
- **Accessibility tree introspection beyond axe rules** (e.g., keyboard navigation order, focus management): Out of phase scope. A11Y-03 is a WCAG 2.1 AA RULES smoke; keyboard / focus is a separate concern best covered by manual accessibility testing OR a future phase.
- **`58-E2E-AUDIT.md`-style addendum for new fixture extensions** (Phase 75 specifics last item): Recommended-but-not-blocking if Plan 02 extends `e2e.ts` info-question set. Planner's call at Plan 02 close.

### Reviewed Todos (not folded)

All keyword-matched todos surfaced by `gsd-sdk query todo.match-phase 76` are routed to OTHER phases per `.planning/STATE.md §"Deferred Items"`. Folding any of them into Phase 76 would create scope conflict — same disposition as Phases 74 + 75.

- `2026-04-27-extend-e2e-filter-type-coverage.md` — Phase 77 / SETTINGS-01.
- `2026-05-09-tighten-i18n-wrapper.md` — Phase 78 / CLEAN-04.
- `2026-05-10-d04-per-cast-reason-distribution.md` — Phase 78 / CLEAN-03 sub-finding 1.
- `2026-05-10-getroute-setstore-cast-cleanup.md` — Phase 78 / CLEAN-03 sub-finding 2.
- `2026-05-10-rename-package-scripts-dev-to-db.md` — Phase 78 / CLEAN-01.
- `2026-05-10-redirect-unlocated-voter-to-selectors.md` — Phase 78 / CLEAN-02.
- `2026-05-09-claude-md-svelte-warning-accepted-format.md` — Phase 78 / CLEAN-03 sub-finding 3.
- `2026-05-11-voter-fixture-heterogeneous-question-types.md` — Phase 78 / CLEAN-05 (Path B `--likert-only` seed modifier).
- `2026-05-11-e2e-01-single-locale-runtime-override.md` — Phase 74 D-04 deferral; future runtime-override capability. NOT Phase 76.
- `2026-05-12-58-e2e-audit-addendum-qspec.md` — Phase 75 follow-up; NOT Phase 76.
- `2026-05-12-qspec-01-i18n-hardening.md` — Phase 75 follow-up; NOT Phase 76.
- `2026-05-12-qspec-02-multi-choice-categorical-variant.md` — Phase 75 follow-up; deferred to v2.10+ feature phase. NOT Phase 76.
- `2026-03-28-generalize-candidate-app-to-party-app.md` — v2.10+ architectural change.
- `2026-03-28-investigate-migrating-candidate-answer-store.md` — architectural investigation; future milestone.
- `adapter-package-loading.md` — not v2.9.
- `configurable-mock-data.md` — medium-priority; not v2.9.
- `frontend-project-id-scoping.md` — v2.10 candidate.
- `password-reset-code-method.md` — Strapi-era leftover.
- `register-page-registrationkey-method.md` — Strapi-era leftover.
- `rename-admin-writer.md` — dev-seed internal API hygiene; low priority.
- `results-url-refactor-followups.md` — v2.10 candidate.
- `sql-linting-formatting.md` — CI hygiene; not v2.9.
- `2026-05-09-rewrite-parent-answer-imputation.md` — matching-package internal; future matching-focused milestone.

Phase 76 is bounded to A11Y-01 (profile validation rejection paths) + A11Y-02 (profile field reload-persistence extension) + A11Y-03 (axe smoke wiring + first-run baseline). Architectural / cleanup / matching-package work belongs in other phases.

</deferred>

---

*Phase: 76-Profile + A11y*
*Context gathered: 2026-05-12*
