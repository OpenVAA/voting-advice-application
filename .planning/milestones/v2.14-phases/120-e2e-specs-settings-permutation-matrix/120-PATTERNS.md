# Phase 120: E2E Specs — Settings-Permutation Matrix - Pattern Map

**Mapped:** 2026-06-15
**Files analyzed:** 24 (create/modify/rename/delete across config, setup/teardown, specs)
**Analogs found:** 24 / 24 (every target has an exact in-repo analog)

> **Key grounding fact (verified this session):** the entire **dev-seed layer is already built**. All perm templates exist with their FINAL names (`perm-question-video.ts`, `perm-interactive-info.ts`, `perm-org-matching.ts`, `perm-access-disable.ts`, `show-feedback-survey.ts`), all Phase-119 fixtures/helpers/test-ids exist and are smoke-proven by the 4 probes, and the template registry (`packages/dev-seed/src/templates/index.ts`) already maps every key. **Phase 120 writes NO new perm template and NO new fixture** — it wires Playwright projects + setup/teardown pairs and authors the `*.spec.ts` assertion bodies. Treat any "NEW perm template" / "NEW fixture" language in the coverage plan as ALREADY-DONE; confirm-don't-rebuild.

---

## File Classification

| Target File | Role | Data Flow | Action | Closest Analog | Match |
|-------------|------|-----------|--------|----------------|-------|
| `tests/playwright.config.ts` (`_probes` project + setup) | Playwright project entry | request-response (isolation seed→run) | MODIFY (add) | `data-setup-base` + `cold-entry-dataroot` leaf shape | role-match |
| `tests/playwright.config.ts` (5 new perm nodes) | Playwright project entry | request-response | MODIFY (append tail) | `perm-disable-allow-open` triple (798–813) | exact |
| `tests/tests/setup/perm/perm-question-video.{setup,teardown}.ts` | setup-teardown pair (authed) | file-I/O (seed + storageState) | CREATE | `perm-hide-hero.{setup,teardown}.ts` | exact |
| `tests/tests/setup/perm/perm-interactive-info.{setup,teardown}.ts` | setup-teardown pair (unauth) | request-response (seed only) | CREATE | `perm-header-show-feedback.setup.ts` | exact |
| `tests/tests/setup/perm/perm-org-matching.{setup,teardown}.ts` | setup-teardown pair (unauth) | request-response | CREATE | `perm-header-show-feedback.setup.ts` | exact |
| `tests/tests/setup/perm/perm-access-disable.{setup,teardown}.ts` | setup-teardown pair (unauth) | request-response | CREATE | `perm-disable-voter-app.{setup,teardown}.ts` | exact |
| `tests/tests/setup/perm/perm-show-feedback-survey.{setup,teardown}.ts` | setup-teardown pair (unauth) | request-response | RENAME (`git mv`) | `perm-header-show-feedback.{setup,teardown}.ts` (self) | exact |
| `tests/tests/specs/perm/perm-question-video.spec.ts` | perm-chain spec | event-driven (UI walk + assert) | CREATE | `perm-hide-hero.spec.ts` + `video.probe.spec.ts` | exact |
| `tests/tests/specs/perm/perm-interactive-info.spec.ts` | perm-chain spec | event-driven | CREATE | `questionInfo.probe.spec.ts` | exact |
| `tests/tests/specs/perm/perm-org-matching.spec.ts` | perm-chain spec | event-driven | CREATE | `orgMatching.probe.spec.ts` | exact |
| `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` | perm-chain spec | event-driven | RENAME + EXTEND | `perm-header-show-feedback.spec.ts` (self) + `popupNotice.probe.spec.ts` | exact |
| `tests/tests/specs/perm/perm-access-disable.spec.ts` | perm-chain spec (consolidated) | event-driven | CREATE (absorb 2) | `perm-disable-voter-app.spec.ts` + `perm-disable-candidate-app.spec.ts` | exact |
| `tests/tests/specs/voter/voter-journey.spec.ts` (EPERM-04/05) | voter-journey extension | event-driven | MODIFY (in place) | the file itself (org-card step 749–781; details step 829+) | exact |
| `perm-disable-voter-app.{spec,setup,teardown}.ts` + projects | DELETE | — | DELETE | absorbed into `perm-access-disable` | n/a |
| `perm-disable-candidate-app.{spec,setup,teardown}.ts` + projects | DELETE | — | DELETE | absorbed into `perm-access-disable` | n/a |

---

## Part 1 — The `_probes` Isolation Project (D-01/D-02)

### `tests/playwright.config.ts` — add a `_probes` project + its setup

**Analog 1 — leaf project reading a seeded dataset read-only** (`cold-entry-dataroot`, lines 226–232):

```typescript
{
  name: 'cold-entry-dataroot',
  testDir: './tests/specs/voter',
  testMatch: /cold-entry-dataroot\.spec\.ts/,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-base']
},
```

**Analog 2 — a setup project that seeds ONE template via `setupFromTemplate`** (`perm-header-show-feedback.setup.ts`, full file):

```typescript
import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-header-show-feedback dataset', async () => {
  await setupFromTemplate('perm-header-show-feedback', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
```

**How to compose the `_probes` project (D-02 — ONE probe per run, fresh server, clean DB):** The 4 probe specs are seeded OUT-OF-BAND via the dev-seed CLI (`yarn db:seed --template <perm>`) — they document this in their own headers (e.g. `video.probe.spec.ts:36–44`). Each probe clobbers the `app_settings` singleton, so they MUST run one-at-a-time, NOT serially in one project run. Two viable shapes (Claude's discretion at build, lean per D-02):

1. **Minimal (matches how 119-08 ran it, now committed):** a single `_probes` project entry
   ```typescript
   {
     name: '_probes',
     testDir: './tests/specs/_probes',
     testMatch: /\.probe\.spec\.ts$/,
     use: { ...devices['Desktop Chrome'] },
     // NO data-setup dependency — each probe is seeded out-of-band per its
     // header (yarn db:seed --template <perm>) and run as a SINGLE-FILE
     // invocation (npx playwright test <file> --project=_probes). Running the
     // whole project at once would clobber app_settings between probes.
   }
   ```
   The isolation contract lives in the RUN discipline (single-file `npx playwright test <probe> --project=_probes`), not in a per-probe setup project — mirroring exactly what each probe header already documents.

2. **Per-probe setup projects (stronger isolation, more wiring):** one `data-setup-probe-<name>` project per probe (each calling `setupFromTemplate('<perm>')` per the `perm-header-show-feedback.setup.ts` analog) + a matching `_probes` spec project that `testMatch`-scopes to that single probe file and `dependencies: ['data-setup-probe-<name>']`. This puts the seed INSIDE the Playwright graph (no out-of-band CLI step) but multiplies the project count by 4.

> The 4 probe spec files (`tests/tests/specs/_probes/{video,questionInfo,popupNotice,orgMatching}.probe.spec.ts`) ALREADY EXIST and are written. Part 1 adds ONLY the project wiring + the D-02 re-diagnosis (trace separating detach-vs-never-mounts + ruling out the degraded-Vite confound). The 4 already-green probes (`entityFilters/navMenu/theme/trackingIntercept`) match the same `*.probe.spec.ts` glob, so a broad `_probes` project picks all 8 up — scope `testMatch` if only the 4 deferred ones should run under the project.

**The suspected (NOT-to-apply-until-confirmed) churn fix site** — `tests/tests/fixtures/voter/voter-journey.fixture.ts:206–210`:

```typescript
// 5b. Click questions-intro start.
const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
if (await questionsStart.isVisible({ timeout: TIMEOUTS.page }).catch(() => false)) {
  await questionsStart.click();   // ← line 209: the REVERTED dispatchEvent('click') site
}
```

The probes ALREADY sidestep this churn locally via `start.dispatchEvent('click')` (`video.probe.spec.ts:59–61`) and the `followLinkWhenHrefResolved` href-navigation pattern (`voter-journey.fixture.ts:245`). CONDITION 2: do NOT touch line 209 in the shared fixture until isolation re-diagnosis confirms it; prefer the probe-local dispatchEvent already in place.

---

## Part 2 — Pattern Assignments (the EPERM spec bodies)

### `perm-question-video.spec.ts` (EPERM-06) — perm-chain spec, NEW

**Spec analogs:** `perm-hide-hero.spec.ts` (candidate-authed storage-state slice) + `video.probe.spec.ts` (voter visibility-matrix walk).

**Project wiring** (append after `perm-disable-allow-open`, `tests/playwright.config.ts:798–813` triple):

```typescript
{
  name: 'data-setup-perm-question-video',
  testMatch: /perm-question-video\.setup\.ts/,
  teardown: 'data-teardown-perm-question-video',
  dependencies: ['perm-disable-allow-open']   // perm-family tail
},
{
  name: 'data-teardown-perm-question-video',
  testMatch: /perm-question-video\.teardown\.ts/
},
{
  name: 'perm-question-video',
  testDir: './tests/specs/perm',
  testMatch: /perm-question-video\.spec\.ts/,
  fullyParallel: false,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-perm-question-video']
},
```

**Setup/teardown** — candidate slice needs an authed storage-state, so mirror `perm-hide-hero.setup.ts` EXACTLY (`setupFromTemplate('perm-question-video', { extraTeardownPrefix: ['test-', 'e2e-perm-'] })` → `forceRegister` → `waitForLoginForm` → UI login → `storageState({ path })`). The candidate external_id prefix is `e2e-perm-qvid-` (from `perm-question-video.ts:42` `const P = 'e2e-perm-qvid-'`). Teardown mirrors `perm-hide-hero.teardown.ts` (`unregisterCandidate` + `runTeardown(PREFIX)` + unlink storage JSON).

**Voter visibility-matrix assertion pattern** (from `video.probe.spec.ts:52–83`) — uses `createVideoReader(page)` + `video.expectVideo(true|false)`, churn-robust `start.dispatchEvent('click')`, `followLinkWhenHrefResolved`. The Video reader asserts **visibility-not-churn** (`tests/tests/fixtures/shared/video.fixture.ts:62–72` — `toBeVisible()` / `toBeHidden()`, NEVER attach/detach, because `Video.svelte` root carries `class:hidden={!hasContent}`).

```typescript
const video = createVideoReader(page);          // tests/tests/fixtures/shared/video.fixture.ts
await video.expectVideo(false);  // category intro: no video (seeded on questions only)
await video.expectVideo(true);   // q1/q3/q5: video present
```

**Candidate `hideVideo` slice** (from `perm-hide-hero.spec.ts:45–51`) — `createCandidateQuestionsOverviewPage(page).goToPage()` → `.goToQuestion(/\[QU-OPIN-...\]/)` → anchor on `testIds.candidate.questions.answerInput` visible → `createVideoReader(page).expectVideo(...)`. Re-seed `hideVideo=true` as a second sub-test (perm-singleton re-seed pattern). Test-id: `testIds.shared.video` = `'video'` (`testIds.ts:332`).

---

### `perm-interactive-info.spec.ts` (EPERM-07) — perm-chain spec, NEW

**Spec analog:** `questionInfo.probe.spec.ts` (the full two-mode + advanced-content walk is already demonstrated there).

**Project wiring:** same triple shape; `data-setup-perm-interactive-info` `dependencies: ['perm-question-video']` (append after EPERM-06 if it lands first, else `['perm-disable-allow-open']`). Unauthenticated voter → NO storage state → setup is the simple `perm-header-show-feedback.setup.ts` shape (`setupFromTemplate('perm-interactive-info', { extraTeardownPrefix: ['test-', 'e2e-perm-'] })`), teardown is a bare `runTeardown(PREFIX)`.

**Assertion pattern** (`questionInfo.probe.spec.ts:44–70`) — consumes the `questionInfo` fixture already wired into `views.ts:27` (`createQuestionInfo`):

```typescript
await walkUntilQuestionsIntro(page);            // voter-journey.fixture export
await voterQuestionsPage.clickStart();
await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible();
await questionInfo.expectInfoMode(undefined, 'popup');     // modal dialog (interactiveInfo.enabled)
await questionInfo.expectInfoSections([0]);                // customData.infoSections render
await questionInfo.expectArguments(undefined, 'categorical'); // QuestionArguments per choiceId
// second test: expander mode on the default question
await questionInfo.expectInfoMode(undefined, 'expander');  // inline reveal, NO modal
```

Reader signatures + test-ids (`tests/tests/fixtures/voter/questionInfo.fixture.ts:60–79`, test-ids `testIds.ts:186–189`): `popupInfoButton`/`popupInfoModal`/`infoSection`/`argumentGroup`. For the `arguments` slice the spec must assert each of Likert/Boolean/Categorical separately (call `expectArguments(idx, type)` per carrier).

> **`customData.terms` extension is SEPARATE** — it rides `voter-journey.spec.ts` against `e2e/base` (already seeded in 119), NOT this perm. See the voter-journey extension section below.

---

### `perm-org-matching.spec.ts` (EPERM-10) — perm-chain spec, NEW

**Spec analog:** `orgMatching.probe.spec.ts` (the readers are proven there; the spec adds the 3-mode re-seed matrix with EXACT score values).

**Project wiring:** same triple; setup is unauthenticated (results path uses in-test answering via `answerAndAdvanceToResults`, not a storage state) → `perm-header-show-feedback.setup.ts` shape with `setupFromTemplate('perm-org-matching', ...)`.

**Assertion pattern** (`orgMatching.probe.spec.ts:38–57`):

```typescript
await walkUntilQuestionsIntro(page);
await answerAndAdvanceToResults(page, 'max');             // voter-journey.fixture exports
await resultsPage.selectEntityTab('orgs');               // resultsPage.fixture.ts:122
const gauge = await resultsPage.expectOrgMatchScore(() => 0);  // :228 — first org card
await aboutPage.expectOrgMatchingDisclosure('impute');   // aboutPage.fixture.ts:66
```

`resultsPage.expectOrgMatchScore(target)` (`resultsPage.fixture.ts:228`) returns the score-gauge `Locator`; `aboutPage.expectOrgMatchingDisclosure(mode)` (`aboutPage.fixture.ts:66`, `OrgMatchingMode = 'none'|'answersOnly'|'impute'` at :38). **PRIMARY (EPERM-10 NOTE):** re-seed the singleton per mode (perm-singleton pattern) and assert EXACT expected scores — `none` = no gauge, `answersOnly` = blank org answers penalised as polar-opposite, `impute` = member-imputed (differs from answersOnly). About-page disclosure is the secondary lighter assertion. Both `resultsPage` and `aboutPage` are wired into `views.ts` (lines 24, 28).

---

### `perm-show-feedback-survey.spec.ts` (EPERM-09) — RENAME + EXTEND

**This is a `git mv`, not a new file.** Rename source = `perm-header-show-feedback.spec.ts` (full file is 25 lines — header-feedback-button assertion). The dev-seed template + registry are ALREADY renamed to `show-feedback-survey` (`index.ts:43,89`); only the test layer rename remains.

**Steps:**
1. `git mv tests/tests/specs/perm/perm-header-show-feedback.spec.ts tests/tests/specs/perm/perm-show-feedback-survey.spec.ts`
2. `git mv tests/tests/setup/perm/perm-header-show-feedback.setup.ts perm-show-feedback-survey.setup.ts` (+ `.teardown.ts`), and change the `setupFromTemplate('perm-header-show-feedback', ...)` arg to `'show-feedback-survey'`.
3. In `playwright.config.ts` rename the A3 node triple (`data-setup-perm-header-show-feedback` / `data-teardown-...` / `perm-header-show-feedback`, lines 668–687) to `…-show-feedback-survey`, KEEPING its position after `perm-hide-hero` and its `dependencies: ['perm-hide-hero']`. Also update the DOWNSTREAM dependency: `data-setup-perm-header-show-help` (line 691–695) `dependencies: ['perm-header-show-feedback']` → `['perm-show-feedback-survey']`.
4. **EXTEND** the spec body — keep the existing `perm-header-show-feedback.spec.ts:15–24` header-feedback assertion verbatim, then add the popup-coordination assertions from `popupNotice.probe.spec.ts:30–49`:

```typescript
const popups = createPopupNotice(page);           // fixtures/shared/popupNotice.fixture.ts
await walkUntilQuestionsIntro(page);
await answerAndAdvanceToResults(page, 'max');
await popups.expectVisible('feedback');           // placement + timing + once
await popups.dismissAndReload('feedback');        // dismiss-persistence across reload
// independent survey assertion (same 4 criteria)
await popups.expectVisible('survey');
await popups.dismissAndReload('survey');
```

Fixture surface (`popupNotice.fixture.ts:46–60`): `expectVisible(kind)`, `dismiss(kind)`, `dismissAndReload(kind)`, `kind: 'feedback'|'survey'`. Test-ids `testIds.shared.feedbackPopup`='feedback-popup', `surveyPopup`='survey-popup' (`testIds.ts:336–337`). **WR-05 caveat** (`popupNotice.fixture.ts:25–32`): `dismiss()` matches English close labels only — the suite runs English, so it holds. Add the `survey.showIn[]` per-surface assertions (frontpage/entityDetails/navigation/resultsPopup) per the EPERM-09 NOTE, auditing which surfaces are already covered at build time.

---

### `perm-access-disable.spec.ts` (EPERM-11) — CONSOLIDATE 2 specs into 1

**Analog = the two specs being absorbed:** `perm-disable-voter-app.spec.ts` (full, 40 lines) + `perm-disable-candidate-app.spec.ts` (full, 36 lines). The consolidated template `perm-access-disable.ts` + registry entry already exist (`index.ts:111`).

**Steps:**
1. CREATE `tests/tests/specs/perm/perm-access-disable.spec.ts` with **three sub-tests** (`test.describe('perm-access-disable')` + 3 `test(...)`), re-seeding the `app_settings` singleton per mode (perm-singleton pattern):
   - `access.voterApp=false` → migrate `perm-disable-voter-app.spec.ts:16–39` verbatim (voter `/` + `/elections` show MaintenancePage via `getByRole('main')`+`heading{level:1}`+`startButton` hidden; `/candidate` available).
   - `access.candidateApp=false` → migrate `perm-disable-candidate-app.spec.ts:16–35`.
   - `access.underMaintenance=true` (NET-NEW global slice) → BOTH voter AND candidate routes show maintenance simultaneously.
2. CREATE the setup/teardown pair `perm-access-disable.{setup,teardown}.ts` mirroring `perm-disable-voter-app.setup.ts` (`setupFromTemplate('perm-access-disable', { extraTeardownPrefix: ['test-', 'e2e-perm-'] })`); the spec re-seeds per sub-test via `settingsOverlay` (see `perm-access-disable.ts:43` base posture). Prefix `e2e-perm-access-disable-`.
3. In `playwright.config.ts`: REMOVE the `perm-disable-voter-app` triple (496–512) and `perm-disable-candidate-app` triple (516–532); ADD a single `data-setup-perm-access-disable` / teardown / `perm-access-disable` triple in the chain position they occupied. The downstream `data-setup-perm-per-app-notifications` (line 550–554) `dependencies: ['perm-disable-candidate-app']` must be re-pointed to `['perm-access-disable']`.
4. `git rm` the two old spec files + their setup/teardown pairs.

> The old `perm-disable-voter-app.ts` / `perm-disable-candidate-app.ts` dev-seed templates + their registry keys are RETAINED (`index.ts:68–69` comment) — do NOT delete those; only the test-layer specs/projects are removed.

---

### `voter-journey.spec.ts` (EPERM-04 + EPERM-05) — MODIFY in place

**Analog = the file itself.** Default-additive (assert-only) per D-04; touch the rigid org-card counts (749–781) ONLY if making a party answer-incomplete shifts them — confirm against `e2e/base.ts` org rows at build time.

- **EPERM-04 (tab control, candidate + org):** REUSE `answeredVoterPage` (max), `resultsPage.openEntityDetailsForCard` / `selectEntityTab` (`resultsPage.fixture.ts:122`), `entityDetails.expectTabs` / `selectTab` (`entityDetails.fixture.ts:80,89`). Extend near the existing CA-AA-Special drawer step (829+). Assert `expectTabs(['info','opinions'])` for candidate, `expectTabs(['info','children','opinions'])` for an org (Party AA), AND that a non-declared tab is absent (per-type tab control).
- **EPERM-05 (org-typed missing markers):** REUSE `entityDetails.expectInfoItem` (`entityDetails.fixture.ts:110`) / `expectQuestionDisplay` (:132) for the org "hasn't answered" / missing-election-symbol markers. The candidate-typed markers are already covered — add ONLY the organization slice. The org-card counts step (749–781) is the non-additive ripple risk: it uses `expect.soft(cards).toHaveCount(5)` and rigid per-party subcard counts — if a party is made answer-incomplete, re-baseline these per 119.3.

`customData.terms` (EPERM-07's separate base extension): assert the term triggers render as in-text affordances + clicking opens the definition popup with correct title/content. The `terms` field was added to `e2e/base` in 119 — confirm the carrier question at build time.

---

## Shared Patterns

### Perm-chain triple (project entry shape)
**Source:** `tests/playwright.config.ts:798–813` (`perm-disable-allow-open` END node).
**Apply to:** every NEW perm node (question-video, interactive-info, org-matching, access-disable, show-feedback-survey-rename).
```typescript
{ name: 'data-setup-perm-<X>', testMatch: /perm-<X>\.setup\.ts/, teardown: 'data-teardown-perm-<X>', dependencies: ['<previous perm SPEC>'] },
{ name: 'data-teardown-perm-<X>', testMatch: /perm-<X>\.teardown\.ts/ },
{ name: 'perm-<X>', testDir: './tests/specs/perm', testMatch: /perm-<X>\.spec\.ts/, fullyParallel: false, use: { ...devices['Desktop Chrome'] }, dependencies: ['data-setup-perm-<X>'] }
```
Append-to-tail after `perm-disable-allow-open`; append order among the new nodes is Claude's discretion (CONTEXT D-04). Each setup uses `extraTeardownPrefix: ['test-', 'e2e-perm-']` (or `'test-perm-'` per the coverage-plan cross-chain isolation note); `dependencies` chains off the previous perm SPEC (NOT its teardown — Playwright forbids depending on teardown projects; see config comment lines 293–301).

### Unauthenticated setup (seed-only)
**Source:** `tests/tests/setup/perm/perm-header-show-feedback.setup.ts` (full, 16 lines).
**Apply to:** interactive-info, org-matching, access-disable, show-feedback-survey setups.

### Authenticated setup (storage-state mint)
**Source:** `tests/tests/setup/perm/perm-hide-hero.setup.ts:44–65` (+ `waitForLoginForm` :30–42).
**Apply to:** perm-question-video setup (candidate `hideVideo` slice).
Pattern: `setupFromTemplate` → `unregisterCandidate` → `forceRegister` → `waitForLoginForm` → fill email/password testids → submit → `expect(page).not.toHaveURL(/.*login.*/)` → `storageState({ path })`. Spec consumes via `test.use({ storageState: STORAGE_STATE_PATH })` (`perm-hide-hero.spec.ts:35–38`).

### Teardown
**Source:** `tests/tests/setup/perm/perm-hide-hero.teardown.ts` (authed — `unregisterCandidate` + `runTeardown` + unlink JSON) / bare `runTeardown(PREFIX, client)` for unauthed.

### Probe-derived walk + readers
**Source:** the 4 probe specs (`_probes/*.probe.spec.ts`) — each demonstrates the exact walk helpers (`walkUntilQuestionsIntro`, `answerAndAdvanceToResults`, churn-robust `dispatchEvent('click')`, `followLinkWhenHrefResolved`) + reader calls the full spec mirrors. The probe is the de-risked reference for its 1:1 spec (video→06, questionInfo→07, popupNotice→09, orgMatching→10).

### Rigidity contract (ALL specs)
No `expect.soft` in perm specs (voter-journey already uses soft for its long chain — perm specs are HARD), no `try/catch` around `expect()`, no `.catch` fallbacks, testid-only via `testIds` util (the `no-restricted-locators` ESLint guard rejects raw CSS/text — `getByRole` IS permitted, e.g. the maintenance `getByRole('main')`/`heading` and `popupNotice` close button).

---

## No Analog Found

None. Every Phase-120 target has an exact in-repo analog. The only genuinely-new artifact is the `_probes` Playwright project *entry* (the spec files, fixtures, templates, and test-ids it exercises all already exist) — and even that mirrors the `cold-entry-dataroot` leaf shape + the `setupFromTemplate` setup-project shape.

## Metadata

**Analog search scope:** `tests/playwright.config.ts`, `tests/tests/specs/perm/`, `tests/tests/specs/voter/`, `tests/tests/specs/_probes/`, `tests/tests/setup/perm/`, `tests/tests/setup/shared/`, `tests/tests/fixtures/{voter,shared}/`, `packages/dev-seed/src/templates/e2e/perm/`, `packages/dev-seed/src/templates/index.ts`, `tests/tests/utils/testIds.ts`.
**Files scanned:** ~30
**Pattern extraction date:** 2026-06-15
