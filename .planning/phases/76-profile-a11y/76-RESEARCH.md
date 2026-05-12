# Phase 76: Profile + A11y — Research

**Researched:** 2026-05-12
**Domain:** Playwright E2E spec authoring (validation rejection paths + reload-persistence) + `@axe-core/playwright` first-run baseline wiring against the post-Phase-73 deterministic suite
**Confidence:** HIGH on validation surface + axe wiring; MEDIUM on fixture extension (depends on PRODUCT-GAP findings); HIGH on determinism contract inheritance.
**HEAD at research:** `e8463a814` (current branch `feat-gsd-roadmap`).

## Summary

Phase 76 is content-heavy spec authoring + a single dev-dep wiring (`@axe-core/playwright@4.11.3`) on top of the Phase 73 / 74 / 75 GREEN-WITH-DEFERRAL determinism baseline (47 PASS_LOCKED / 15 DATA_RACE / 33 CASCADE / SHA `7084db87…` × 3). All three workstreams (A11Y-01 validation rejection, A11Y-02 reload-persistence extension, A11Y-03 axe smoke wiring) write specs against the same `e2e` template baseline `tests/tests/specs/voter/` + `tests/tests/specs/candidate/` already used by Phases 74 + 75. The 4-plan structure in CONTEXT D-01 is correct.

Three findings change the planner's input materially relative to CONTEXT:

1. **`tests/` has NO `package.json`.** CONTEXT D-04 instructs the planner to add `@axe-core/playwright` to `tests/package.json` devDependencies "(NOT root)". That file does not exist — the tests workspace is part of the **root package** (root `package.json` already owns `@playwright/test`, `eslint-plugin-playwright`, `tsx`). The dev-dep MUST go in **root `package.json` `devDependencies`**.
2. **The "invalid email format" A11Y-01 cell has no render surface.** `customData.format === 'email'` does NOT exist on the `Question.customData` type (`packages/app-shared/src/data/customData.type.ts:22-83` enumerates the full set; only `allowOpen` / `disableMultilingual` / `fillingInfo` / `filterable` / `hero` / `hidden` / `locked` / `longText` / `maxlength` / `required` / `vertical` / `arguments` / `infoSections` / `terms` / `video` exist). Email validation in the codebase is HTML5 `type="email"` on the candidate-app **login** + **preregister** forms, NOT on the profile form. **PRODUCT-GAP: defer the email cell.**
3. **The "url format" cell is also a PRODUCT-GAP.** `QuestionInput.svelte:65` sets `type='url'` only when `question.subtype === 'link'`. `subtype` is commented out on every `Question*.type.ts` file in `packages/data/src/objects/questions/` — the only real `subtype` carriers are `Election` and `Constituency`. The `Input.svelte:286-296` URL-validation branch (which emits `components.input.error.invalidUrl`) is unreachable from any current profile field.

**Primary recommendation:** Reduce A11Y-01 from 4 cells to **2 reliably-renderable cells** + 1 boundary cell as default scope:
- **Cell 1 — Image type rejection** (non-image upload → `components.input.error.invalidFile`).
- **Cell 2 — Image size rejection** (oversized file > 20MB → `components.input.error.oversizeFile`).
- **Cell 3 — Name length too long** (HTML5 `maxlength` cap on a `customData.maxlength`-set editable info question; planner adds the `maxlength` to a fixture info question if none exist).

Defer email + url cells with a follow-up todo (PRODUCT-GAP — would require adding `customData.format` to the schema + `Input` component wiring; neither is v2.9 scope per ROADMAP). A11Y-02 fixture audit confirms only 1 textarea-able info question exists today (`test-question-text` at sort 8); name + bio + social-link slots all need fixture extension. A11Y-03 axe wiring is mechanical: install `@axe-core/playwright@^4.11.3`, mirror the `PLAYWRIGHT_VISUAL`/`PLAYWRIGHT_PERF` conditional-project pattern, opt-in via `PLAYWRIGHT_A11Y=1`, capture violation list to `76-A11Y-BASELINE.md`.

## Phase Context

### User Constraints (from CONTEXT.md)

#### Locked Decisions

Verbatim from `76-CONTEXT.md` `<decisions>`:

- **D-01 — 4-plan layout.** Plan 01 (A11Y-01 validation) → Plan 02 (A11Y-02 persistence + fixture audit) → Plan 03 (axe wiring) → Plan 04 (axe baseline + verification gate). Strict serial default; planner may parallelize 01 with 03.
- **D-02 — Existing CAND-03 / CAND-12 / registration coverage continues to pass.** Phase 76 is ADDITIVE.
- **D-03 — A11Y-01 cells: image-type, image-size, name-length-short, name-length-long, email-format.** Each cell asserts (a) error UI surfaces, (b) unsaved input is preserved.
- **D-04 — `PLAYWRIGHT_A11Y` env-flag gates new project.** Mirrors PLAYWRIGHT_VISUAL/PLAYWRIGHT_PERF (`tests/playwright.config.ts:332-353`). Opt-in only.
- **D-05 — Fixture audit required at PLAN.md time.** Editable profile fields render from `candCtx.infoQuestions.filter((q) => !getCustomData(q).locked)` (`profile/+page.svelte:277-280`).
- **D-06 — Fixture audit deliverable: per-field table (EXISTS / MISSING / PRODUCT-GAP).**
- **D-07 — 5 axe routes:** Home, Election/Constituency selectors, Questions flow, Results list, Voter-detail drawer.
- **D-08 — Axe scan settles BEFORE snapshot:** role-based content waits, never mid-animation.
- **D-09 — Determinism contract:** 3× cold-start `--workers=1` identical pass/fail; the Phase-73-locked DATA_RACE pool (15) MUST NOT grow.
- **D-10 — Parity-script regen conditional:** only if new specs land in default baseline (Plans 01 + 02 will).
- **D-11 — Vite-cache wipe MANDATORY** before the 3-run smoke (`rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit`).
- **D-11a — Role/aria locators by default**, `getByTestId` requires inline `// reason:` block.
- **D-12 — Plan order 01 → 02 → 03 → 04 strict serial; some 01↔03 parallelism possible.**

#### Claude's Discretion

Verbatim from CONTEXT:

- A11Y-01 in new file vs. extension to `candidate-profile.spec.ts` (default: new file `candidate-profile-validation.spec.ts`).
- A11Y-02 extends `candidate-profile.spec.ts` directly vs. splits into `candidate-profile-persistence.spec.ts` (default: extend).
- Axe baseline lives at `76-A11Y-BASELINE.md` phase-local vs. project-level (default: phase-local).
- Axe smoke: en-only vs. all 4 locales (default: en-only).
- JSON-serialized vs. markdown-only baseline (default: markdown).
- Whether to extend the seed at all (default: extend if + only if field is missing AND has a real product render surface — D-06 PRODUCT-GAP).

#### Deferred Ideas (OUT OF SCOPE)

- Cite-and-fix WCAG violations from axe smoke (out of v2.9 scope per ROADMAP "A11Y-03 is wiring + first-run baseline only").
- Multi-locale axe coverage (deferred; en baseline only).
- Real-time axe in CI gating.
- Profile field expansion beyond name + bio + social links (audio bio, video portrait, etc.).
- JSON-serialized axe results for CI integration tooling.
- A11Y-01 PRODUCT-GAP fields (per D-06 outcomes).
- Visual-regression-style baseline drift detection for axe.
- Accessibility tree introspection beyond axe rules (keyboard nav order, focus management).
- 58-E2E-AUDIT.md addendum for new fixture extensions (recommended-but-not-blocking).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| A11Y-01 | Candidate profile field validation rejection paths E2E-covered (parameterized: invalid email format, name length boundaries, image type/size violations); each asserts validation error UI + unsaved-state preservation. | §"Concrete Validation Cells" maps each cell to an i18n key + assertion shape. 2 cells RELIABLY cover the contract (image type + image size); 1 cell COVERS via HTML5 `maxlength` cap; 2 cells (email format + url format) are PRODUCT-GAPs and require deferral. |
| A11Y-02 | Profile reload-persistence E2E-covered for all profile fields (name + bio + social links beyond image + answers + comment text). | §"Fixture Audit" enumerates the 1 existing editable info question (`test-question-text`) + identifies missing slots; planner extends `packages/dev-seed/src/templates/e2e.ts` per Phase 74/75 P05 single-template-extension precedent. |
| A11Y-03 | `@axe-core/playwright` wired as WCAG 2.1 AA smoke against 5 routes (home / selector / questions / results / voter-detail); first-run baseline only. | §"@axe-core/playwright Integration" gives version + API + settle pattern + baseline-capture sketch. Mirrors `PLAYWRIGHT_VISUAL` / `PLAYWRIGHT_PERF` opt-in pattern in `tests/playwright.config.ts:332-353`. |

## Validation Architecture (8 dimensions — Nyquist)

> Required because `workflow.nyquist_validation` is implicitly enabled (`.planning/config.json` does not set it to `false`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright `1.58.2` (per Phase 75 verification record) |
| Config file | `tests/playwright.config.ts` (90s per-test timeout; `fullyParallel: true`; `workers: 1` in CI / `6` local) |
| Quick run command (per task) | `yarn playwright test -c tests/playwright.config.ts <spec-glob> --workers=1 --reporter=line` |
| Full suite command | `yarn dev:reset-with-data && yarn test:e2e --workers=1` |
| Per-plan smoke | Same as quick run, scoped to the new spec(s) — Phase 74/75 precedent: PASS × 3 isolated before merging |
| Parity gate | `yarn tsx tests/scripts/diff-playwright-reports.ts <run-N> <run-M>` × 3 pair comparisons |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| A11Y-01 (image-type cell) | Non-image upload → `components.input.error.invalidFile` renders + textarea retains nothing (image area shows placeholder, not the rejected filename) | Playwright e2e | `yarn playwright test -c tests/playwright.config.ts tests/tests/specs/candidate/candidate-profile-validation.spec.ts --workers=1 -g "image-type"` | ❌ Wave 0 (new spec) |
| A11Y-01 (image-size cell) | Oversized image > 20MB → `components.input.error.oversizeFile` renders | Playwright e2e | `yarn playwright test -c tests/playwright.config.ts tests/tests/specs/candidate/candidate-profile-validation.spec.ts --workers=1 -g "image-size"` | ❌ Wave 0 |
| A11Y-01 (name-too-long cell) | Type > `maxlength` chars in a maxlength-bound editable info question → input value caps at the limit | Playwright e2e | `yarn playwright test -c tests/playwright.config.ts tests/tests/specs/candidate/candidate-profile-validation.spec.ts --workers=1 -g "name-too-long"` | ❌ Wave 0 |
| A11Y-01 (email cell, name-too-short cell, url cell) | PRODUCT-GAP — no render surface today | DEFER | N/A (filed as follow-up todo at phase close per CONTEXT D-03 + D-06 PRODUCT-GAP path) | n/a |
| A11Y-02 (image persistence) | Existing CAND-12 — already passes | Playwright e2e | (existing) `tests/tests/specs/candidate/candidate-profile.spec.ts:181-202` | ✅ |
| A11Y-02 (display-name persistence) | Save name-bound info question → reload → assert value persists | Playwright e2e | `yarn playwright test -c tests/playwright.config.ts tests/tests/specs/candidate/candidate-profile.spec.ts --workers=1 -g "CAND-12"` (extension) | ❌ Wave 0 (extension) |
| A11Y-02 (bio persistence) | Save bio-bound info question (textarea / longText) → reload → assert value persists | Playwright e2e | (same command as above; same `test()` block extension) | ❌ Wave 0 (fixture + spec) |
| A11Y-02 (social-link persistence) | Save social-link info question → reload → assert value persists | Playwright e2e | (same) | ❌ Wave 0 (fixture + spec; also PRODUCT-GAP candidate — see Fixture Audit) |
| A11Y-03 (axe smoke) | Each of 5 routes → settle → `new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()` → `results.violations` recorded to `76-A11Y-BASELINE.md` (no `expect(violations.length).toBe(0)`; first-run baseline only) | Playwright e2e (opt-in) | `PLAYWRIGHT_A11Y=1 yarn playwright test -c tests/playwright.config.ts --project=a11y-smoke --workers=1` | ❌ Wave 0 (new spec + new project + new dev-dep) |

### Sampling Rate

- **Per task commit:** scoped per-spec smoke (`--workers=1 -g "<grep-pattern>"`)
- **Per wave merge:** full per-plan smoke 3× (Phase 74/75 precedent) + isolated lint pass.
- **Phase gate:** vite-cache wipe → 3-run cold-start `--workers=1` SHA-256 identical → 3 PARITY GATE PASS pair comparisons → axe smoke isolated 2-run determinism check (per CONTEXT D-09).

### Wave 0 Gaps

- [ ] `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` — covers A11Y-01 cells 1+2+3.
- [ ] `tests/tests/specs/a11y/a11y-smoke.spec.ts` — covers A11Y-03 (new directory + new spec).
- [ ] `tests/tests/data/test_image_oversized.png` (or generated runtime) — > 20MB image fixture for A11Y-01 cell 2. **Existing `tests/tests/test_image_black.png`** (~few KB) is fine for happy-path; A11Y-01 needs a dedicated oversize. Recommendation: generate at test-runtime via `Buffer.alloc(21 * 1024 * 1024)` or commit a binary fixture.
- [ ] `tests/tests/data/test_not_image.txt` — non-image fixture for A11Y-01 cell 1 (a 5-byte plain-text file is sufficient).
- [ ] **Fixture extension to `packages/dev-seed/src/templates/e2e.ts`** — new info questions for name, bio, social-links per A11Y-02 (see Fixture Audit).
- [ ] Root `package.json` devDependencies: `@axe-core/playwright@^4.11.3` (NOT `tests/package.json` — that file does not exist).
- [ ] `tests/playwright.config.ts` — new conditional project block at line 354-367 area mirroring `PLAYWRIGHT_PERF`.

### Dimension Coverage

#### 1. Existence

- **What to test:** Every spec file authored is loadable by Playwright (no syntax errors, no broken imports). New project entry resolves. Test image fixtures exist on disk.
- **How to assert:** `yarn playwright test --list -c tests/playwright.config.ts` enumerates all tests including new ones; `PLAYWRIGHT_A11Y=1 yarn playwright test --list -c tests/playwright.config.ts --project=a11y-smoke` enumerates the axe project under the env flag.
- **Command:** `yarn playwright test --list -c tests/playwright.config.ts | grep -E "candidate-profile-validation|a11y-smoke"`

#### 2. Behavior

- **What to test:** Each A11Y-01 cell asserts both (a) the i18n error string surfaces and (b) the unsaved input state is preserved. A11Y-02 extension asserts each new field's saved value renders identically post-`page.reload()`. A11Y-03 produces a stable violation list.
- **How to assert:**
  - A11Y-01: `await expect(page.getByText(/* invalidFile literal */)).toBeVisible({ timeout: 5000 })` AFTER triggering the rejection; for input-preservation: `await expect(textareaLocator).toHaveValue(BAD_INPUT_LITERAL)` (text inputs) OR for image rejection: assert the upload area still shows the "Add an image" placeholder (no image accepted) via `await expect(imageArea.getByRole('img')).not.toBeAttached()`.
  - A11Y-02: pattern from `candidate-profile.spec.ts:181-202` extended — `await page.reload(); await expect(getByLabel(LABEL)).toHaveValue(SAVED_VALUE)`.
  - A11Y-03: `const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();` → write `results.violations` to baseline artifact (NO `expect(violations).toHaveLength(0)`).
- **Command:** per-plan smoke × 3 in isolation.

#### 3. Integration

- **What to test:** New specs participate in the Playwright project dependency chain WITHOUT breaking the existing 27-project layout. Axe project depends on `data-setup` (and optionally `auth-setup` for the `/candidate/*` routes if added later).
- **How to assert:** `tests/scripts/diff-playwright-reports.ts` parity gate: 3 pair comparisons output `PARITY GATE: PASS` after constants regen.
- **Command:** `yarn tsx tests/scripts/diff-playwright-reports.ts run-1.json run-2.json` × 3 pairs (1v2, 2v3, 1v3).

#### 4. Edge Cases

- **What to test:**
  - A11Y-01 image-size: file exactly at 20MB cap (must NOT reject — boundary inclusive of `maxFilesize`); 1 byte over.
  - A11Y-01 name-length: empty string (HTML5 `maxlength` does not enforce minimum); whitespace-only string.
  - A11Y-02: race-tolerant assertion against post-reload data-load (use `expect.poll(...).toContain(value)` with `{ timeout: 5000 }` per Phase 73 race-fix pattern, not `expect(...).toBeVisible()` against an SSR-stale snapshot).
  - A11Y-03: scan AFTER role-based content settle (NOT after `waitForLoadState('networkidle')` — DETERM-03 forbids).
  - Axe smoke determinism: scan twice in succession on identical DOM → identical violation list.
- **How to assert:** Per-cell test bodies. Edge cases NOT a separate suite — fold into the parameterized cell assertions.

#### 5. Observability

- **What to test:** When a Phase 76 spec fails, the failure cause is identifiable from the Playwright HTML report.
- **How to assert:** Each spec uses `test.step('description', async () => { ... })` to break long sequences into report-visible steps. Axe failures (if any production fix lands later) report violation-rule-IDs in the assertion message.
- **Command:** `yarn playwright show-report tests/playwright-report` after a run.

#### 6. Performance

- **What to test:** New specs do NOT inflate full-suite cold-start runtime beyond the Phase 75 baseline (~25.7 min). Axe smoke (opt-in) adds ≤ 60s per route × 5 routes = ≤ 5 min total when enabled.
- **How to assert:** Capture per-test duration from `report.json`; surface in `76-VERIFICATION.md` if any new test exceeds 30s.
- **Command:** `node -e "const r=require('./tests/playwright-results/report.json'); /* aggregate */ "` (or use the existing parity-gate output formatting).

#### 7. Security

- **What to test:** Axe smoke does NOT submit credentials over plain HTTP; does NOT scrape the DOM into externally-uploaded baseline artifacts; does NOT log tokens.
- **How to assert:** Visual review at code-review time. The axe results are written to `76-A11Y-BASELINE.md` (markdown) and committed to git — confirm no PII / no auth tokens / no candidate emails appear in the rule-list (axe only emits rule-IDs + DOM-selector strings, NEVER input values, but a malformed rule could surface input text in `node.html` — strip if present).
- **Command:** Manual review of `76-A11Y-BASELINE.md` content before commit.

#### 8. Validation-of-Validation

- **What to test:** The verification gate itself is honest — 3-run SHA identity is computed correctly (project-qualified `projectName :: file > title|status` format per Phase 74/75 precedent); parity-script regen targets the right `run-N-report.json`; axe baseline is captured from a clean cold-start (NOT a flaky imgproxy run).
- **How to assert:** Plan 04 verification gate replicates the Phase 74 P07 / Phase 75 P02b shape: `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` → `yarn supabase:reset && yarn dev:seed --template e2e` (NOT `yarn dev:reset-with-data` — that loads the `default` template, NOT `e2e`; per Phase 75 Plan 02a finding) → 3-run smoke → SHA-256 each run's sorted-status capture → assert all 3 hashes identical.
- **Command:** Plan 04 records the exact recipe in `76-VERIFICATION.md`.

## Concrete Validation Cells (per A11Y-01 cell)

Concrete mapping of each CONTEXT D-03 cell to (field external_id / source, error i18n key, assertion shape, RENDER-STATUS).

| # | Cell | Field source | Trigger | i18n key emitted | Assertion shape | RENDER-STATUS |
|---|------|--------------|---------|------------------|-----------------|---------------|
| 1 | Image type rejection | `<Input type="image">` at `profile/+page.svelte:265-272`; container testId `profile-image-upload` | Upload `not-an-image.txt` via `ProfilePage.uploadImage(filePath)` | `components.input.error.invalidFile` ("The file is invalid.") at `Input.svelte:267` | `await expect(page.getByText('The file is invalid.')).toBeVisible({ timeout: 3000 })` AND `await expect(imageArea.getByRole('img')).not.toBeAttached()` (no image accepted) | **RENDER-OK** — direct `Input.svelte:265-285` handler, no fixture changes needed. |
| 2 | Image size rejection | Same as #1 | Upload `oversized.png` (file > 20MB; `Input.svelte:90` `maxFilesize = 20 * 1024 * 1024`) via `ProfilePage.uploadImage(filePath)` | `components.input.error.oversizeFile` ("The file is too large. The maximum size is 20 MB.") at `Input.svelte:269` | `await expect(page.getByText(/The file is too large/i)).toBeVisible({ timeout: 3000 })` AND `await expect(imageArea.getByRole('img')).not.toBeAttached()` | **RENDER-OK** — direct handler. Need a >20MB fixture (recommend runtime-generated via `Buffer.alloc(21*1024*1024).fill(0)` written to a tmp `.png`-extension file; the type-check at `Input.svelte:267` passes when the file extension and `Blob.type` indicate image, so an actual valid PNG header padded with zeros is the cleanest path. Alternative: commit a 21MB binary to `tests/tests/data/`). |
| 3 | Name length too long | Editable info question with `customData.maxlength` set; rendered through `QuestionInput.svelte` → `Input.svelte:602` `<input type="text">` with HTML5 `maxlength` attribute | Type a string > maxlength chars into the text input | **NONE** — HTML5 `maxlength` silently caps the value; no `handleError` fires. The `Input.svelte` handler (line 298 — "All other types") just sets `value = currentTarget.value` to the (already-capped) string. | `await input.fill('x'.repeat(maxlength + 50)); await expect(input).toHaveValue('x'.repeat(maxlength))` (verify HTML5 cap took effect — input accepts the keystroke but truncates) | **RENDER-PARTIAL** — the assertion shape changes from "error message surfaces" to "input value caps at maxlength". CONTEXT D-03 anticipates this: "above the configured `maxlength`; HTML5 native enforcement at `Input.svelte:602` rejects characters past the limit so the spec asserts the input value caps OR a translation-string error surfaces if the field uses custom JS." Default to value-cap assertion. **REQUIRES** an editable info question with `customData.maxlength` set in the e2e fixture (see Fixture Audit — none exist today; planner adds 1). |
| 4 | Name length too short | Same field as #3 | Type 0 chars (empty); for `required: true` the `required-badge` shows on init via `Input.svelte:556-560` for image or :612-616 for text — this is the existing UI behavior, NOT a save-time error | **NONE** — no `handleError` for "required field empty" in `Input.svelte`. `required` shows a badge (warning icon + sr-only "Required" text) but does NOT block save. The save path (`+page.svelte:125-143`) does check `allRequiredFilled` (line 94) but only enables/disables the submit button via `canSubmit` — does NOT emit a translation-key error. | The "required-badge" sr-only text uses `t('common.required')` at `Input.svelte:614` — assertion: `await expect(input.locator('..').getByText(t('common.required'))).toBeAttached()` (sr-only) AFTER typing+clearing. | **RENDER-DEGENERATE** — this is a state-display assertion, not a rejection-path assertion. CONTEXT D-03 acknowledges: "If the seed has only `maxlength` (no `minlength`), the 'too short' boundary becomes 'empty string' (testing the empty-state rejection path) — planner's call at PLAN.md time." **Recommend defer** (file under PRODUCT-GAP follow-up) — empty-state save IS allowed by the product today; asserting a rejection that doesn't exist is asserting non-behavior. |
| 5 | Email format | Editable info question with `customData.format === 'email'` (per CONTEXT D-03 + Specifics line 287) | Type `'not-an-email'` into the email-formatted input | **NONE** — `customData.format` is **NOT** a property in the `CustomData.Question` type at `packages/app-shared/src/data/customData.type.ts:22-83`. There is no email-format validation path in `Input.svelte`. The only email validation in the app is HTML5 `type="email"` on `tests/tests/specs/candidate/candidate-auth.spec.ts` login + preregister forms — NOT on profile. | N/A | **PRODUCT-GAP** — defer to follow-up todo. Adding email validation to profile would require: (a) adding `format` to `CustomData.Question` type + JSON schema, (b) adding an `'email'` branch to `INPUT_TYPES` in `QuestionInput.svelte:40-48`, (c) adding `handleError('components.input.error.invalidEmail')` (key also doesn't exist yet — would need to be added to `apps/frontend/src/lib/i18n/translations/en/components.json` `input.error` block, currently containing only 4 keys: `fileLoadingError` / `invalidFile` / `invalidUrl` / `oversizeFile`). NONE of these are in v2.9 scope. |
| 6 (BONUS) | URL format (social links) | Editable info question whose `QuestionInput`-derived input renders as `type='url'` per `QuestionInput.svelte:65` (`question.type === Text && question.subtype === 'link'`) | Type `'not a url'` into the url-formatted input | **NONE in profile** — `type='url'` triggers `Input.svelte:286-296` `handleError('components.input.error.invalidUrl')` IF reached, but `Question.subtype` is **commented out** on every question type in `packages/data/src/objects/questions/`. No question in any seed today has `subtype: 'link'`. | N/A | **PRODUCT-GAP** — defer. Same architectural addition required (subtype field on Question + seed wiring + frontend trigger). NOT in v2.9 scope. |

### Recommended A11Y-01 Cell Set (Default)

3 cells RELIABLY assertable today:

```ts
const validationCells = [
  {
    name: 'image-type',
    setup: async ({ profilePage }) => profilePage.uploadImage('tests/tests/data/test-not-an-image.txt'),
    assertError: 'The file is invalid.',          // components.input.error.invalidFile literal
    assertPreservation: async ({ page }) =>
      // Image area shows no <img> — rejection preserved nothing-image, lets user try again
      expect(page.getByTestId('profile-image-upload').getByRole('img')).not.toBeAttached()
  },
  {
    name: 'image-size',
    setup: async ({ profilePage }) => profilePage.uploadImage(/* runtime-generated 21MB PNG */),
    assertError: /The file is too large/i,        // matches templated translation: "The file is too large. The maximum size is 20 MB."
    assertPreservation: async ({ page }) =>
      expect(page.getByTestId('profile-image-upload').getByRole('img')).not.toBeAttached()
  },
  {
    name: 'name-too-long',
    setup: async ({ page, fillingInfoExternalId }) => {
      const input = page.getByLabel(/* the name-bound info question's label, sourced from fixture */);
      await input.fill('x'.repeat(MAXLEN + 50));   // overflow attempt
    },
    assertError: null,                             // no error fires — HTML5 caps silently
    assertPreservation: async ({ input }) =>
      expect(input).toHaveValue('x'.repeat(MAXLEN))   // verify cap took effect
  }
];
```

Cells 4 (name-too-short) + 5 (email) + 6 (url) → **DEFERRED** with single follow-up todo: `2026-05-12-a11y-01-product-gap-cells.md` (email-format / url-format / required-empty rejection paths require schema additions; recommend revisiting when `customData.format` or equivalent capability lands in a future feature phase).

### Translation Key Contract

Per CONTEXT D-03 "Every error-message assertion uses the i18n key — `t('components.input.error.invalidFile')`, etc.":

The 4 i18n keys that exist in `apps/frontend/src/lib/i18n/translations/en/components.json` `input.error`:

```json
{
  "fileLoadingError": "Failed to load the file.",
  "invalidFile":      "The file is invalid.",
  "invalidUrl":       "The URL is not valid.",
  "oversizeFile":     "The file is too large. The maximum size is {maxFilesize} MB."
}
```

A11Y-01 cells 1+2 use `invalidFile` + `oversizeFile`. **No `invalidEmail` key, no `required` rejection key, no `tooShort` key.** Specs match the literal English string per the W-03 i18n-hardening deferred-todo precedent (Phase 75 P01 Task 5) — they will be `t()`-keyed when CLEAN-04 lands. Use templated regex (`/The file is too large/i`) for the parameterized `oversizeFile` string to absorb the `{maxFilesize}` interpolation.

## Fixture Audit (per A11Y-02 field)

Audit of `packages/dev-seed/src/templates/e2e.ts` info-question set (lines 322-572) against A11Y-02's required field surface (name, bio, social links).

### Existing info questions in e2e fixture

| External_id | Type | Sort | Editable? | `customData` | Renders as | A11Y-02 fit |
|-------------|------|------|-----------|--------------|------------|-------------|
| `test-question-text` | `text` | 8 | YES (no `locked` set) | none | `<input type="text">` (default; no `longText` flag) | One-line text — usable as a "display name" or "headline" analog if `customData.maxlength` is added. |

**That's it.** Only ONE editable info question exists in the e2e fixture today. It's the `'Campaign slogan'` field used by `voter-detail.spec.ts:88` for slogan-rendering assertions.

### Per-field audit

| A11Y-02 field | Profile UI render path | Fixture state | Action required | RENDER-STATUS |
|---------------|------------------------|---------------|------------------|---------------|
| **Image** | `profile/+page.svelte:265-272` (`<Input type="image">`) | n/a (image is on `candidate.image`, not an info question) | None — covered by existing CAND-12 at `candidate-profile.spec.ts:181-202`. | **EXISTS** |
| **Display name** | Editable info question loop at `profile/+page.svelte:277-280` | MISSING — no name-bound info question. (`first_name` / `last_name` are LOCKED display-only at lines 198-211; per CONTEXT D-03 those are not the test target.) | Add 1 fixture info question, e.g. `external_id: 'test-question-displayname'`, `type: 'text'`, `category: 'test-category-info'`, `customData: { maxlength: 50 }` (also satisfies A11Y-01 cell 3); seed Alpha's answer `{ value: 'Alpha The Test' }`. | **MISSING** (extend fixture) |
| **Bio** | Same | MISSING — no `longText`-flagged textarea info question. | Add 1 fixture info question, e.g. `external_id: 'test-question-bio'`, `type: 'text'`, `category: 'test-category-info'`, `customData: { longText: true, maxlength: 500 }` (renders as `<textarea>` per `QuestionInput.svelte:67`); seed Alpha's answer `{ value: 'Alpha biography text…' }`. | **MISSING** (extend fixture) |
| **Social link 1** | Same | MISSING + **PRODUCT-GAP** for url-format validation (see Validation Cells §6 above). For PERSISTENCE only (no validation), a plain text input works. | OPTION A (persistence only, no validation): add `external_id: 'test-question-social-1'`, `type: 'text'`, `category: 'test-category-info'`, no `customData.format`; seed Alpha's answer `{ value: 'https://example.com/alpha' }`. The string saves and reloads as plain text — A11Y-02's "social link persists" SC is satisfied with the same shape as the bio assertion. OPTION B: defer the social-link slot entirely — passes-with-deferral on A11Y-02 SC #2's "social links" clause. | **MISSING + PRODUCT-GAP-PARTIAL** (extend for persistence only; defer url-format validation) |
| **Social link 2** | Same | Same as Social link 1 | Same — add 2nd if redundancy is wanted; otherwise 1 cell suffices. | **MISSING + PRODUCT-GAP-PARTIAL** |

### Recommended fixture extension

Add 3 new info questions to `packages/dev-seed/src/templates/e2e.ts` `questions.fixed[]` (after sort 18 boolean — append at sort 19/20/21 to preserve existing sort-order invariants and the voter fixture's `voterAnswerCount=16` Likert loop). Add Alpha's answers to `test-candidate-alpha.answersByExternalId`:

```ts
// New info questions for A11Y-01 / A11Y-02 (Phase 76 Plan 02 fixture extension)
{
  external_id: 'test-question-displayname',
  type: 'text',
  name: { en: 'Display name (Phase 76 anchor)' },
  category: { external_id: 'test-category-info' },
  custom_data: { maxlength: 50 },     // A11Y-01 cell 3 anchor + A11Y-02 name persistence
  allow_open: false,
  required: false,
  sort_order: 19,
  is_generated: false
},
{
  external_id: 'test-question-bio',
  type: 'text',
  name: { en: 'Biography (Phase 76 anchor)' },
  category: { external_id: 'test-category-info' },
  custom_data: { longText: true, maxlength: 500 },   // renders as <textarea>
  allow_open: false,
  required: false,
  sort_order: 20,
  is_generated: false
},
{
  external_id: 'test-question-social-1',
  type: 'text',
  name: { en: 'Social link (Phase 76 anchor)' },
  category: { external_id: 'test-category-info' },
  // NO format — url-format validation is PRODUCT-GAP; this slot tests persistence only.
  allow_open: false,
  required: false,
  sort_order: 21,
  is_generated: false
}
```

Plus Alpha's answers (extend `answersByExternalId`):
```ts
'test-question-displayname': { value: 'Alpha The Test' },
'test-question-bio':         { value: 'Alpha biography text used by Phase 76 A11Y-02 reload-persistence.' },
'test-question-social-1':    { value: 'https://example.com/alpha' }
```

**Cross-spec impact:** Adding 3 sort-19/20/21 info questions does **not** affect the voter fixture's Likert loop (`voterAnswerCount=16` only walks ordinal opinion questions in sort 0-15). It does extend `infoQuestions` count from 2 (test-question-text + 1 locked-by-default — actually only 1 today) to 5; the existing CAND-03 test at line 167 checks `await expect(main.getByRole('textbox').first()).toBeVisible()` which is shape-agnostic. **Re-runs** of `voter-detail.spec.ts:88` (slogan assertion) are unaffected because `test-question-text` remains intact. Run `yarn build @openvaa/dev-seed` after edit per Phase 74 P05 + Phase 75 P01 precedent.

**58-E2E-AUDIT.md addendum:** RECOMMENDED — same as Phase 75 P02a's optional addendum for boolean. Single LOC: enumerate the 3 new external_ids + Alpha answers + spec ownership (A11Y-01 / A11Y-02). Operator's discretion at Plan 02 close (mirrors CONTEXT Claude's Discretion §6).

## @axe-core/playwright Integration

### Version + Install

| Property | Value |
|----------|-------|
| Package | `@axe-core/playwright` |
| Latest stable | **`4.11.3`** (verified via `npm view @axe-core/playwright version` 2026-05-12) |
| Last published | 2026-04-30 (per `npm view @axe-core/playwright time --json`) |
| License | MPL-2.0 (Mozilla Public License) |
| Maintainer | Deque Labs |
| Source | [github.com/dequelabs/axe-core-npm](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) |
| Peer dep | `@playwright/test ^1.0.0` (root already has `1.58.2`) — compatible |

**Install command** (root package.json — `tests/package.json` does not exist):

```bash
yarn add --dev @axe-core/playwright
```

This adds to root `devDependencies` alongside the existing `@playwright/test`, `eslint-plugin-playwright`, `tsx`, `glob`, etc. **Note for planner: CONTEXT D-04 says "tests/package.json devDependencies (NOT root)" — that path doesn't exist; the rationale "matches how `playwright/eslint-plugin-playwright` is already scoped" is wrong (verified: `eslint-plugin-playwright` IS in root `devDependencies` per `package.json` listing). Add to root.**

### AxeBuilder API (canonical)

From [Deque's official README](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md):

```typescript
import { AxeBuilder } from '@axe-core/playwright';
import { test } from '@playwright/test';

test('axe smoke', async ({ page }) => {
  await page.goto('/');
  // settle the DOM (role-based content wait — avoid networkidle per DETERM-03)
  await page.getByRole('heading').first().waitFor({ state: 'visible' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])    // WCAG 2.1 AA superset; plain wcag2aa works too
    .analyze();

  // results.violations — Array of { id, impact, description, helpUrl, nodes }
  // First-run baseline only — record, do NOT assert a specific count
  console.log(`[A11Y-03] ${results.violations.length} violations`);
});
```

### API Surface (selectors / rule control)

| Method | Purpose | Phase 76 use |
|--------|---------|--------------|
| `.withTags(tags)` | Restrict to specific WCAG levels | `['wcag2aa']` per ROADMAP A11Y-03 contract |
| `.include(selector)` | Restrict scan to a CSS selector subtree | Voter-detail drawer scan: `.include('[role="dialog"]')` to focus on the drawer not the page behind |
| `.exclude(selector)` | Skip a subtree | Could exclude testbed UI if it interferes (none expected) |
| `.disableRules(ids)` | Skip specific rule IDs by name | First-run baseline: do NOT pre-suppress; capture everything |
| `.analyze()` | Run scan, return `axe.AxeResults` | Returns `{ violations, passes, incomplete, inapplicable, ... }` |

### Results Structure (axe-core API)

`results.violations` is `Array<axe.Result>` where each entry shape (from [axe-core API docs](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md)):

```typescript
{
  id: string;              // e.g. 'color-contrast', 'aria-required-children', 'label'
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;     // human-readable rule summary
  help: string;            // short help text
  helpUrl: string;         // link to deque rule docs
  tags: string[];          // ['wcag2aa', 'cat.color', ...]
  nodes: Array<{           // each occurrence
    html: string;          // the offending element's HTML (CAUTION: may include input values — strip if PII)
    target: string[];      // CSS selector path
    failureSummary: string;
  }>;
}
```

### Settle Pattern (per CONTEXT D-08)

Axe takes a static DOM snapshot. Mitigations from CONTEXT D-08 + verified against deque docs:

1. **Wait for role-based content** before scan: `await page.getByRole('heading').first().waitFor()` or `await page.getByRole('main').waitFor()`.
2. **Resolve interactive state** before scan: e.g., for selector route, complete the constituency selection so dropdown state is settled — scan AFTER selection, not during.
3. **Wait for drawer animation** for voter-detail: `await drawer.toBeVisible({ timeout: 5000 })` THEN scan.
4. **NEVER use** `waitForLoadState('networkidle')` — DETERM-03 forbids; replaced by role-based waits.
5. **NO animation-disabled context needed** — axe is static-DOM, not pixel-diff. Per CONTEXT D-08: "the determinism risk is LOW IF routes are navigated in order + scans run post-load-settle."

### 5-Route Spec Sketch

```typescript
// tests/tests/specs/a11y/a11y-smoke.spec.ts
import { AxeBuilder } from '@axe-core/playwright';
import { test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';

const ROUTES = [
  {
    name: 'home',
    navigate: async (page) => page.goto(buildRoute({ route: 'Home', locale: 'en' })),
    settle: async (page) => page.getByRole('heading').first().waitFor()
  },
  {
    name: 'elections',
    navigate: async (page) => page.goto(buildRoute({ route: 'Elections', locale: 'en' })),
    settle: async (page) => page.getByRole('combobox').first().waitFor()
  },
  {
    name: 'constituencies',
    navigate: async (page) => page.goto(buildRoute({ route: 'Constituencies', locale: 'en' })),
    settle: async (page) => page.getByRole('combobox').first().waitFor()
  },
  {
    name: 'questions',
    navigate: async (page) => page.goto(buildRoute({ route: 'Questions', locale: 'en' })),
    settle: async (page) => page.getByRole('heading', { name: /question/i }).first().waitFor()
  },
  {
    name: 'results',
    navigate: async (page) => page.goto(buildRoute({ route: 'Results', locale: 'en' })),
    settle: async (page) => page.getByRole('list').first().waitFor()
  },
  {
    name: 'voter-detail-drawer',
    navigate: async (page) => {
      await page.goto(buildRoute({ route: 'Results', locale: 'en' }));
      await page.getByRole('link').filter({ hasText: /alpha|beta/i }).first().click();
    },
    settle: async (page) => page.getByRole('dialog').waitFor({ state: 'visible' })
  }
];

for (const r of ROUTES) {
  test(`A11Y-03 axe smoke — ${r.name}`, async ({ page }) => {
    await r.navigate(page);
    await r.settle(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    // First-run baseline ONLY: log + write artifact; do NOT assert violation count.
    console.log(`[A11Y-03] ${r.name}: ${results.violations.length} violations`);
    // Plan 04 captures the per-route violation list to 76-A11Y-BASELINE.md.
  });
}
```

### Conditional Project Block (Plan 03)

Add at `tests/playwright.config.ts` between lines 353 and 367 (after `PLAYWRIGHT_PERF`, before `PLAYWRIGHT_BANK_AUTH`):

```typescript
// Accessibility smoke: WCAG 2.1 AA scan via @axe-core/playwright (Phase 76 A11Y-03)
//   PLAYWRIGHT_A11Y=1 npx playwright test -c tests/playwright.config.ts --project=a11y-smoke
...(process.env.PLAYWRIGHT_A11Y
  ? [
      {
        name: 'a11y-smoke',
        testDir: './tests/specs/a11y',
        use: { ...devices['Desktop Chrome'] },
        dependencies: ['data-setup']
      }
    ]
  : [])
```

The voter-detail route requires actual data (candidates to click), so `dependencies: ['data-setup']` is correct. NO need for `auth-setup` since all 5 axe routes are voter-app (unauthenticated). Mirrors `visual-regression` project shape exactly.

### Baseline Capture Strategy (Plan 04)

**Recommended:** Write a Playwright `test.afterAll()` hook in `a11y-smoke.spec.ts` that aggregates per-route `results.violations` arrays and emits a markdown file `76-A11Y-BASELINE.md`. Contents:

```markdown
# Phase 76 Axe Smoke — First-Run Baseline (2026-05-12)

Run conditions: `PLAYWRIGHT_A11Y=1 yarn playwright test --project=a11y-smoke --workers=1`
HEAD: <commit-sha>
Tags: wcag2aa
Determinism: 2-run identical (per Plan 04 verification)

## Route: home
| Rule ID | Impact | Count | helpUrl |
|---------|--------|-------|---------|
| color-contrast | serious | 3 | https://dequeuniversity.com/rules/axe/4.10/color-contrast |
| ... | ... | ... | ... |

## Route: elections
...
```

Determinism check: run the smoke twice in succession on the same baseline (per CONTEXT D-09 axe-smoke determinism check); both runs must produce identical violation lists. If they don't, the smoke is flaky — surface as a Phase 76 blocker.

**Cite-and-fix follow-up todo** (per ROADMAP A11Y-03 + CONTEXT D-07): file at Plan 04 close: `.planning/todos/pending/2026-05-12-a11y-axe-first-run-violations.md` listing per-route rule-IDs + impact + count + cross-link to `76-A11Y-BASELINE.md`. Routes the cite-and-fix work to v2.10+ backlog.

## Risks & Landmines

### LANDMINE 1 — `tests/package.json` does not exist (CONTEXT D-04 mis-instructs the planner)

CONTEXT D-04 says "Adds `@axe-core/playwright` to `tests/package.json` devDependencies (NOT root — keep the a11y harness isolated to the E2E workspace per the existing `playwright/eslint-plugin-playwright` precedent)." That file does NOT exist (verified via `find tests -maxdepth 2 -name package.json`). The dev-dep MUST go in root `package.json`.

**The premise is wrong:** `eslint-plugin-playwright` IS in root `devDependencies` per `package.json` listing (verified via `python3 -c "import json; print(list(json.load(open('package.json')).get('devDependencies', {}).keys()))"`). The "harness isolation" rationale doesn't apply.

**Mitigation:** planner adds to root `package.json`. Document in `76-DECISIONS-DELTA.md` (or inline in the first PLAN.md) that CONTEXT D-04's "NOT root" instruction was based on an incorrect premise; root is the only valid target.

### LANDMINE 2 — A11Y-01 5 cells reduce to 3 reliably-renderable cells

CONTEXT D-03 enumerates 5 cells (image-type, image-size, name-empty, name-too-long, email-format). Of these:
- 2 (image type + size) are RELIABLY renderable today.
- 1 (name-too-long) is renderable IF the planner adds `customData.maxlength` to a fixture info question.
- 2 (email-format + name-too-short) are PRODUCT-GAPs (no email-format render path; required-empty doesn't fail save in the current product).

**Mitigation:** Plan 01 ships 3 cells (image-type, image-size, name-too-long). PRODUCT-GAP cells deferred to a single follow-up todo at phase close. ROADMAP SC #1 reads "parameterized profile spec exercises bad-input cells … invalid email format, name length boundaries, image type/size violations" — passes-with-deferral on the email-format clause + name-too-short clause; full-PASS on image type/size + name-too-long. Same shape as Phase 74 D-04 (E2E-01 single-locale PASS-WITH-DEFERRAL) and Phase 75 D-03 (QSPEC-02 multi-choice PASS-WITH-DEFERRAL).

### LANDMINE 3 — IMGPROXY_TIED_TITLES collision risk

Per CONTEXT D-10 + D-11 (CRITICAL note): the 14-title IMGPROXY_TIED_TITLES list at `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs:64-78` is structurally fragile. Phase 76 specs touch entity-detail drawer image-upload paths.

The current 14 bound titles:
```
'should upload a profile image (CAND-03)'
'should show editable info fields on profile page (CAND-03)'
'should persist profile image after page reload (CAND-12)'
'should show read-only warning when answers are locked'
'should show maintenance page when candidateApp is disabled'
'should show maintenance page when underMaintenance is true'
'should display notification popup when enabled'
'should render help page correctly'
'should render privacy page correctly'
'should hide hero when hideHero is enabled'
'should show hero when hideHero is disabled'
'should change password and login with new password'
'should logout and return to login page'
're-authenticate as candidate'
```

The match shape is `id.endsWith('> ' + title)` — i.e., **the spec title itself**, not the project or file. Any new Phase 76 test whose `test('…')` title ends with one of these strings will be falsely classified as DATA_RACE.

**Phase 76 NEW test titles audit:**
- `'A11Y-01 image-type rejection surfaces error and preserves nothing-image state'` — no collision.
- `'A11Y-01 image-size rejection surfaces error and preserves nothing-image state'` — no collision.
- `'A11Y-01 name-too-long caps input value at maxlength'` — no collision.
- `'should persist display name after page reload (A11Y-02)'` — POTENTIAL collision shape (close to `'should persist profile image after page reload (CAND-12)'`). Recommendation: prefix with `'A11Y-02 '` — `'A11Y-02 should persist display name after page reload'` — collision-free.
- `'A11Y-03 axe smoke — home'` (× 5 routes) — no collision.

**Mitigation:** Plan 04 verification gate runs `regen-constants.mjs:80-87` IMGPROXY-titles-match-count assertion. If it fails (any new test title accidentally ends with a bound title), surface immediately and rename. Planner: prefix all new A11Y-02 tests with `'A11Y-02 '` to avoid the CAND-12 / CAND-03 / CAND-09 collision risk explicitly.

### LANDMINE 4 — Imgproxy 502 infrastructure flake during axe baseline capture

A11Y-01 image-rejection cells DEPEND on the imgproxy container being responsive (the file-input handler's image-type/size check happens BEFORE imgproxy hits, but the parent `<Input type="image">` SSR may race-fail to render if imgproxy 502s). Per Phase 73 / 74 / 75 close notes: imgproxy is intermittently 502 (`docker ps | grep imgproxy` may return empty after `supabase start`).

**Mitigation:** Plan 04 verification gate must `supabase stop && supabase start` between cold-start runs per Phase 73 D-09 recipe. If imgproxy is down during the baseline-capture run, the axe smoke will surface a wave of "image alt text missing" violations that aren't real production violations — they're infrastructure-flake artifacts. Document in `76-A11Y-BASELINE.md` whether imgproxy was up at capture time.

### LANDMINE 5 — Phase 75 verification gate seeded `e2e` template, NOT `default`

Per Phase 75 P02b verification record: `yarn dev:reset-with-data` seeds the `default` template (327 candidates, 24 questions), NOT the `e2e` template (18 candidates, 19 questions today; will become 22 after Phase 76 fixture extension). Verification gates depending on the e2e fixture MUST use `yarn supabase:reset && yarn dev:seed --template e2e`.

**Mitigation:** Plan 04 vite-cache wipe + reset recipe MUST use:
```bash
rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit
yarn supabase:reset && yarn dev:seed --template e2e
```
NOT `yarn dev:reset-with-data` (which loads the default template and would fail the new A11Y-01 + A11Y-02 fixture-dependent specs).

### LANDMINE 6 — `voter-detail-drawer` axe scan needs candidates to click

The 5th axe route (voter-detail drawer) requires:
1. Voter has located (selectedElection + selectedConstituency set).
2. Candidates are visible on the results list.
3. Voter clicks a candidate to open the drawer.

Step 1 typically requires the voter fixture's answeredVoterPage flow OR direct URL navigation with localStorage prefill. **`answeredVoterPage` fixture is the Phase 78 CLEAN-05 voter-fixture-race anchor** (Phase 75 confirmed: 16+ tests fail × 3 deterministically because of this fixture under full-suite cold-start).

**Mitigation:**
- OPTION A: Skip the answer loop. Use `localStorage.setItem('voter.electionId', '<id>')` + `localStorage.setItem('voter.constituencyId', '<id>')` in a `page.addInitScript` before `goto('/results')`. The voter context will see selected election+constituency; the page renders results list (no match scores, but the drawer is still openable per E2E-02 browse-without-match precedent).
- OPTION B: Walk the answer loop via `walkToQuestion` helper (Phase 75 P01 export at `tests/tests/utils/voterNavigation.ts`) THEN navigate to results. Risks the voter-fixture race.

**Recommendation: OPTION A** — direct navigation via localStorage prefill avoids the fixture race entirely. The drawer renders with browse-mode (no match scores), which is fine for axe (axe doesn't care if scores are absent).

### LANDMINE 7 — Default `e2e` template has only 1 visible candidate organization tab

The default `e2e` results page shows candidates by default (per `E2E_BASE_APP_SETTINGS.results.cardContents` in e2e.ts). Voter-detail drawer opens on candidate click. **No additional fixture needed for the drawer route** — Alpha/Beta/Gamma/Delta/Epsilon are all visible (terms_of_use_accepted set). Pick the first card.

## Open Questions

1. **Should A11Y-02 extend `candidate-profile.spec.ts` directly or split to a new file?**
   - What we know: CAND-12 lives at `candidate-profile.spec.ts:181-202`; the file is 204 lines today. Adding 3-4 new persistence tests for name + bio + social-link extends the file by ~80 LOC to ~285 LOC.
   - What's unclear: Per-spec readability ceiling — Phase 75 split P02 into 02a + 02b at ~250 LOC. 285 is close to that ceiling.
   - Recommendation: Default to extending `candidate-profile.spec.ts` (CONTEXT default; CAND-12 pattern is the immediate analog and the test infrastructure is already set up — `loginAsCandidate`, fresh-candidate registration, `serial` describe block). Split only if the planner finds the file becomes hard to read after extension.

2. **Should the A11Y-01 spec use a `for…of` parameterized runner OR explicit `test()` per cell?**
   - What we know: Lint rule `playwright/no-conditional-in-test` is at `'error'` post-Phase-73; conditional inside `test()` body is forbidden. `for…of` at module level (outside `test()`) is allowed (Phase 75 P01 + Phase 74 P05 use this pattern).
   - What's unclear: 3 cells (the recommended scope) is small enough that explicit `test()` per cell is also clean.
   - Recommendation: `for…of` at module level for parameterized cells (consistent with Phase 75 P01 boolean spec's pattern); each iteration registers 1 `test()` with cell-name in the title.

3. **Should A11Y-03 axe baseline include `wcag21aa` tag (in addition to `wcag2aa`)?**
   - What we know: ROADMAP A11Y-03 SC #3 says "WCAG 2.1 AA". `withTags(['wcag2aa'])` covers WCAG 2.0 AA only; `wcag21aa` adds the 2.1 delta rules (e.g., reflow, target-size).
   - What's unclear: Whether the v2.9 cite-and-fix downstream phase wants 2.0 AA OR 2.1 AA OR superset.
   - Recommendation: Use `withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])` — the WCAG 2.1 AA SUPERSET — per ROADMAP literal "WCAG 2.1 AA". First-run baseline captures the maximum surface; cite-and-fix downstream can subset later.

4. **Is the `dependencies: ['data-setup']` enough for the axe project, or does it need `auth-setup` too?**
   - What we know: The 5 axe routes are all voter-app (unauthenticated). `data-setup` provides candidate/question data; `auth-setup` provides candidate-Alpha session storage (only needed for `/candidate/*` routes).
   - What's unclear: Whether the `dependencies: ['data-setup']` chain alone produces the 327-candidate (default-template) seed OR the 18-candidate (e2e-template) seed at run-time.
   - Recommendation: `dependencies: ['data-setup']` is correct (the existing `data.setup.ts` invokes the e2e template). No auth-setup needed. Confirms by inspection of `tests/tests/setup/data.setup.ts`.

5. **Should the fixture extension (Plan 02) include adding `customData.maxlength` to `test-question-displayname` even though A11Y-02 only needs persistence (not the maxlength contract)?**
   - What we know: A11Y-02 needs persistence; A11Y-01 needs maxlength enforcement. Sharing 1 question for both lowers fixture surface.
   - What's unclear: Whether A11Y-01 (Plan 01) or A11Y-02 (Plan 02) lands first per CONTEXT D-12 strict-serial order.
   - Recommendation: D-12 says "01 → 02 → 03 → 04 strict serial". Plan 01 introduces the fixture extension (so A11Y-01 cell 3 has its maxlength field); Plan 02 extends the same fixture (bio + social-link) and writes the persistence tests. Plan 02's fixture diff is additive on top of Plan 01's. NO conflict if planner orders correctly.

## Sources

### Primary (HIGH confidence — direct codebase verification)

- `tests/playwright.config.ts:325-367` — conditional-project pattern for `PLAYWRIGHT_VISUAL` / `PLAYWRIGHT_PERF` / `PLAYWRIGHT_BANK_AUTH`. Phase 76 P03 mirrors this. [VERIFIED via Read]
- `tests/tests/specs/candidate/candidate-profile.spec.ts:1-204` — host file for CAND-03/CAND-12; reusable helpers `loginAsCandidate` + `loginIfRedirectedToLoginPage`. [VERIFIED via Read]
- `tests/tests/pages/candidate/ProfilePage.ts:24-37` — `uploadImage(filePath)` page object method. [VERIFIED via Read]
- `apps/frontend/src/lib/components/input/Input.svelte:90, 265-285, 602, 629` — file-input handler + maxFilesize default + ErrorMessage rendering. [VERIFIED via Read]
- `apps/frontend/src/lib/components/input/QuestionInput.svelte:65, 79-85` — `subtype === 'link'` branch (dead) + `customData.maxlength` plumbing. [VERIFIED via Read]
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:198-280` — locked name fields + image upload + editable info-question loop. [VERIFIED via Read]
- `packages/dev-seed/src/templates/e2e.ts:321-572` — e2e template question fixture (1 editable info question today). [VERIFIED via Read]
- `packages/app-shared/src/data/customData.type.ts:22-83` — `CustomData.Question` type (NO `format` field; NO `email`/`url` enum). [VERIFIED via Read]
- `apps/frontend/src/lib/i18n/translations/en/components.json` `input.error` block — 4 keys exist (`fileLoadingError`, `invalidFile`, `invalidUrl`, `oversizeFile`); NO `invalidEmail` / `required` / `tooShort`. [VERIFIED via Bash grep]
- Root `package.json` — devDependencies list includes `@playwright/test`, `eslint-plugin-playwright`, `tsx`, etc. NO `tests/package.json` exists. [VERIFIED via Read + Bash find]
- `tests/scripts/diff-playwright-reports.ts:42-200` — parity-script with current 47 PASS_LOCKED + 15 DATA_RACE + 33 CASCADE constants from Phase 75 regen. [VERIFIED via Read]
- `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs:64-78` — IMGPROXY_TIED_TITLES list (14 strings). [VERIFIED via Bash sed]

### Primary (HIGH confidence — verified via web)

- `npm view @axe-core/playwright version` → `4.11.3` (verified 2026-05-12 via Bash). Last published 2026-04-30.
- [Deque Labs `@axe-core/playwright` README](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md) — official AxeBuilder API + install + withTags + analyze() shape. [VERIFIED via WebFetch]

### Secondary (MEDIUM confidence — verified with multiple sources)

- [axe-core API docs](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md) for `axe.AxeResults` + `axe.Result` shape. Cross-referenced with [Playwright accessibility-testing official guide](https://playwright.dev/docs/accessibility-testing) and [npm package page](https://www.npmjs.com/package/@axe-core/playwright). All 3 sources agree on `withTags()`, `analyze()`, `results.violations` array shape.

### Tertiary (LOW confidence — flagged for verification)

- None. All claims in this research were either verified against the codebase or against an authoritative source.

## Project Constraints (from CLAUDE.md)

Phase 76 is content-heavy spec authoring. CLAUDE.md directives that apply:

| Directive | Applicability to Phase 76 |
|-----------|---------------------------|
| `yarn workspace @openvaa/<name>` for workspace commands | All `yarn build` / `yarn dev:seed` invocations follow this. |
| **Context Destructuring Rule (Svelte 5)** — destructure stable refs only; reactive accessors via `ctx.X` | Phase 76 specs do NOT modify Svelte components, but if any new spec asserts against a context-derived value, it must use `ctx.X`. Default A11Y assertions use page-level locators (no context destructuring needed). |
| **Code Review Checklist** at `.agents/code-review-checklist.md` | Plan 04 verification gate references; planner reads before authoring. |
| **WCAG 2.1 AA compliance** for the app itself | This is the ENTIRE POINT of A11Y-03. The first-run baseline surfaces the gaps; cite-and-fix is downstream. |
| **`MISSING_VALUE` / empty literals convention** | Not directly relevant — Phase 76 doesn't touch matching code. |
| **Localization** — all user-facing strings support multi-locale | A11Y-03 axe runs on `en` only per CONTEXT D-07 Claude's Discretion default. Translation surface itself is covered by Phase 74 E2E-01. |

## Metadata

**Confidence breakdown:**

- A11Y-01 cell scoping (3 reliable + 2 PRODUCT-GAP): **HIGH** — verified by reading `Input.svelte` + `QuestionInput.svelte` + `customData.type.ts` + i18n keys directly.
- A11Y-02 fixture audit (1 EXISTS + 3 MISSING): **HIGH** — verified by reading the full e2e template fixture and confirming only 1 editable info question.
- A11Y-03 axe wiring (`@axe-core/playwright@4.11.3` + AxeBuilder API + conditional-project pattern): **HIGH** — verified via npm registry + Deque official README + existing `tests/playwright.config.ts:332-353` reference patterns.
- LANDMINE 1 (tests/package.json doesn't exist): **HIGH** — verified by `find tests -maxdepth 2 -name package.json` returning no matches.
- LANDMINE 4-5 (imgproxy + e2e seed selection): **HIGH** — verified via Phase 73/74/75 verification records.
- Determinism contract inheritance: **HIGH** — verified via `73-VERIFICATION.md` + `74-VERIFICATION.md` + `75-VERIFICATION.md`.

**Research date:** 2026-05-12
**Valid until:** 2026-06-11 (30 days for stable patterns; axe-core/playwright follows the upstream `@axe-core/playwright` 4.x line — minor releases per CONTEXT specifics line 332 — recheck npm version at PLAN.md time).

---

## RESEARCH COMPLETE

**Phase:** 76 — Profile + A11y
**Confidence:** HIGH (codebase claims verified directly; npm version verified via registry; axe API verified via Deque official README)

### Key Findings

1. **CONTEXT D-04 mis-instructs** the dev-dep target: `tests/package.json` does NOT exist. `@axe-core/playwright@^4.11.3` MUST go in root `devDependencies`. The "isolation" rationale is also wrong (`eslint-plugin-playwright` is already in root).
2. **A11Y-01 cell count reduces from 5 → 3 reliably-renderable cells.** Email-format and URL-format cells are PRODUCT-GAPs (no `customData.format` field on `Question` type; `subtype` is commented out everywhere). Required-empty / name-too-short doesn't fail save in current product. Plan 01 ships 3 cells (image-type + image-size + name-too-long via HTML5 `maxlength` cap); 2 cells deferred to single follow-up todo.
3. **A11Y-02 fixture extension is REQUIRED.** Only 1 editable info question exists today (`test-question-text` at sort 8). Planner adds 3 new info questions at sort 19/20/21 (`test-question-displayname` with `maxlength` for A11Y-01 cell 3 anchor, `test-question-bio` with `longText`, `test-question-social-1`) + 3 Alpha answers — single additive diff to `e2e.ts`. Voter fixture's `voterAnswerCount=16` Likert loop unaffected.
4. **`@axe-core/playwright@4.11.3`** is the latest stable (npm-verified). MPL-2.0 licensed by Deque Labs. Compatible with Playwright 1.58.2 (peer-dep `@playwright/test ^1.0.0`). Canonical API: `new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()`.
5. **Verification gate seed protocol** (Plan 04): MUST use `yarn supabase:reset && yarn dev:seed --template e2e` (NOT `yarn dev:reset-with-data` which loads the `default` template). Per Phase 75 P02b finding.
6. **IMGPROXY_TIED_TITLES collision audit clean** for proposed test titles IF planner prefixes A11Y-02 tests with `'A11Y-02 '` (avoids the CAND-12 / CAND-03 / CAND-09 endsWith collision risk).
7. **Voter-detail drawer route** (axe smoke 5th route) should use `page.addInitScript` localStorage prefill for election+constituency to avoid the Phase-78-CLEAN-05-tracked answeredVoterPage fixture race.

### File Created

`/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/76-profile-a11y/76-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard stack (axe version + API) | HIGH | npm registry + Deque official README directly verified. |
| Architecture (conditional-project pattern) | HIGH | Mirrors PLAYWRIGHT_VISUAL/PERF blocks already in production at `tests/playwright.config.ts:332-353`. |
| A11Y-01 validation cell renderability | HIGH | Read Input.svelte + QuestionInput.svelte + customData.type.ts + i18n JSON directly; PRODUCT-GAP claims are negative-existence verifiable. |
| A11Y-02 fixture audit | HIGH | Full read of `e2e.ts` lines 321-572. |
| Pitfalls (LANDMINEs 1-7) | HIGH | Each landmine cross-referenced to a specific file + line in the codebase or a verification record. |
| Determinism inheritance | HIGH | Verified via Phase 73/74/75 verification records. |

### Open Questions

5 surfaced — see §"Open Questions" above. Most are planner's discretion (default recommended); Q5 (fixture-shared-between-Plans-01-and-02) needs Plan-01-first ordering per CONTEXT D-12.

### Ready for Planning

Research complete. Planner can now create PLAN 01 / 02 / 03 / 04 PLAN.md files with concrete cell shapes, fixture extension diff, axe wiring snippet, and verification gate recipe all locked down.

---

*Phase: 76-Profile + A11y*
*Research completed: 2026-05-12*
