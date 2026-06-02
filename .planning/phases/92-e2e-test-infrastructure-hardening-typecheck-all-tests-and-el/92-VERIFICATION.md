---
phase: 92-e2e-test-infrastructure-hardening
verified: 2026-06-03T08:00:00Z
status: human_needed
score: 14/15
overrides_applied: 0
human_verification:
  - test: "Run the full Playwright e2e suite against a live Supabase + dev server"
    expected: "All tests that were green before Phase 92 remain green; no timeout regressions in perm-localisation-positive (180s) or voter-mega-journey (120s); no broken voterHomePage/resultsPage navigation from the CR-01/CR-02 fix"
    why_human: "E2E suite requires Supabase + dev server running (not available in verification context); automated checks confirm source code is correct but runtime behavior must be confirmed against a live stack"
---

# Phase 92: E2E Test Infrastructure Hardening — Verification Report

**Phase Goal:** Harden the e2e test suite's infrastructure so it is type-safe, locator-stable, and configuration-consistent. Five workstreams: (1) typecheck all tests under tests/ + eliminate truly-raw locators + prefer testIds over getByRole where a testId exists; (2) goToPage(locale?)/expectPageVisible(visible=true) paradigm on every navigated/asserted voter page fixture + migrate all raw page.goto to named voter routes; (3) timeout consolidation into one semantic-buckets file (tests/tests/helpers/timeouts.ts); (4) flag the prior imgproxy/pooler diagnosis as questionable; (5) make the freshness guard seed-aware so it stops false-positiving.
**Verified:** 2026-06-03T08:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `yarn typecheck:tests` exits 0 (tests/ now has a dedicated tsconfig) | VERIFIED | `node_modules/.bin/tsc -p tests/tsconfig.json --noEmit` exits 0 (confirmed live run); `tests/tsconfig.json` exists with `noEmit:true`, `composite:false`, `declarationMap:false`, `lib:["ES2022","DOM","DOM.Iterable"]` |
| 2 | The locator lint rule errors on bare page.locator, chained .locator, and getByText; getByRole and getByTestId stay allowed | VERIFIED | `tests/eslint.config.mjs` sets `playwright/no-restricted-locators: ['error', [{type:'getByText'},{type:'locator'}]]`; `getByRole`/`getByTestId` NOT listed; `cd tests && npx eslint .` exits 0 |
| 3 | `cd tests && npx eslint .` exits 0 (no-restricted-locators rule active and tests/ lint-clean) | VERIFIED | Live run exits 0; all 5 raw-locator sites guarded with `// eslint-disable-next-line playwright/no-restricted-locators` + `// reason:` rationale |
| 4 | No truly-raw locator survives unguarded in tests/ | VERIFIED | `perm-hide-hero.spec.ts:65` has `// eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators` before `hero.locator('img, span')`; `voterIntro.ts:197` has `// eslint-disable-next-line playwright/no-restricted-locators` before `page.locator('text=...')`; eslint passes confirming all sites are guarded |
| 5 | `tests/tsconfig.json` + `typecheck:tests` script wired into `lint:check` | VERIFIED | `package.json:35` → `typecheck:tests: "node_modules/.bin/tsc -p tests/tsconfig.json --noEmit"`; `package.json:34` → `lint:check: "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests"` |
| 6 | Every voter page a spec navigates to or asserts on has a fixture exposing goToPage(locale?) and expectPageVisible(visible=true) | VERIFIED | `voterHomePage.fixture.ts`, `voterIntroPage.fixture.ts`, `voterQuestionsPage.fixture.ts` (3 net-new); `resultsPage.fixture.ts` extended with `goToPage`+`expectPageVisible`; `entityDetails.fixture.ts` extended with `expectPageVisible` (no goToPage — drawer, zero deep-link gotos confirmed) |
| 7 | goToPage navigates AND asserts visibility via locale-aware URL built with buildRoute; CR-01/CR-02 fix applied | VERIFIED | All 4 fixtures use `(locale === 'en' ? '' : '/' + locale) + buildRoute({route, locale}) \|\| '/'` pattern; commit `921f70762` removed the `'/' +` double-slash from all 4 files; no `'/' + buildRoute` pattern remains in tests/; URL analysis: `resultsPage.goToPage('fi')` → `'/fi'` + `'/results'` = `'/fi/results'` ✓ |
| 8 | Voter home and intro pages have stable load-confirming testIds in both the frontend and the catalog | VERIFIED | `testIds.ts:133` → `voter.home.page: 'voter-home'`; `testIds.ts:157` → `voter.intro.page: 'voter-intro'`; `apps/frontend/src/routes/(voters)/+page.svelte:40` → `<MainContent data-testid="voter-home">`; `apps/frontend/src/routes/(voters)/intro/+page.svelte:27` → `<MainContent data-testid="voter-intro">` |
| 9 | All raw page.goto calls to named voter routes are migrated to goToPage; legitimate exceptions (callbacks, maintenance-mode, redirect-probes) stay inline with // reason: | VERIFIED | 92-03 migrated 5 primary voter/voterNav files; 92-05 migrated 7 perm-spec gap files; exhaustive grep classified all residual `page.goto` calls into 8 legitimate inline categories; known out-of-scope follow-ups: `voter-mega.fixture.ts:111` + `voterIntro.ts:43` (noted in 92-05 SUMMARY, explicitly called out as not-blocking in verification instructions) |
| 10 | `tests/tests/helpers/timeouts.ts` exports named semantic timeout buckets (element, click, page, slowPage, testMax) with JSDoc | VERIFIED | File exists; exports `TIMEOUTS = {element:2_000, click:2_000, page:5_000, slowPage:10_000, testMax:90_000} as const`; full JSDoc per bucket |
| 11 | All 4 local TIMEOUT objects replaced by imports from the central file | VERIFIED | `grep -rn "const TIMEOUT = {" tests/tests --include='*.ts'` returns 0 matches; candidate-mega-journey/voter-mega-journey/voterIntro/perm-localisation-positive all import from `TIMEOUTS` or have named inline exceptions |
| 12 | The >90s test.setTimeout budgets (perm-localisation 180s, voter-mega 120s) are preserved via named inline exceptions, NOT reduced to TIMEOUTS.testMax (90s) | VERIFIED | `perm-localisation-positive.spec.ts:86-87` → `L10N_SLOW_PAGE=15_000; L10N_TEST_MAX=180_000`; `:116` → `test.setTimeout(L10N_TEST_MAX)` (passes 180s); `voter-mega-journey.spec.ts:72` → `MEGA_TEST_MAX=120_000`; `:308` → `test.setTimeout(MEGA_TEST_MAX)` (passes 120s) |
| 13 | TIMEOUTS exported via helpers barrel | VERIFIED | `tests/tests/helpers/index.ts:29` → `export { TIMEOUTS } from './timeouts';` |
| 14 | imgproxy/pooler diagnosis annotated QUESTIONABLE at both recorded markdown sites | VERIFIED | `.planning/quick/260601-q22-step22-logout-bug-data-layer-disproven/260601-q22-SUMMARY.md:52` → `> ⚠️ QUESTIONABLE (Phase 92 D-13): ...`; `.planning/todos/pending/2026-06-01-candidate-home-savedanswers-empty-logout-modal.md:98` → same annotation; original text preserved |
| 15 | Both freshness guards exclude seed_-prefixed baseline rows; warn-only default + E2E_REQUIRE_FRESH_DB hard-fail branch unchanged | VERIFIED | `setupFromTemplate.ts:78` → `const BASELINE_SEED_PREFIX = 'seed_'`; lines 107-113: 4 `.not(...)` clauses (2 prefixes × candidates + orgs); `data.setup.ts:21` → same constant; lines 44-50: same 4 clauses; warn-only path and `if (requireFresh) throw` branches byte-unchanged |

**Score:** 14/15 truths VERIFIED + 1 deferred to human gate (live e2e run)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/tsconfig.json` | --noEmit typecheck scope for tests/ | VERIFIED | exists; `noEmit:true`, `composite:false`, `declarationMap:false`, `lib:["ES2022","DOM","DOM.Iterable"]`, extends `@openvaa/shared-config/ts` |
| `tests/eslint.config.mjs` | no-restricted-locators rule (error) | VERIFIED | `playwright/no-restricted-locators: ['error', [{type:'getByText'},{type:'locator'}]]` present |
| `package.json` | `typecheck:tests` script wired into `lint:check` | VERIFIED | `typecheck:tests: "node_modules/.bin/tsc -p tests/tsconfig.json --noEmit"` + wired as last stage of `lint:check` |
| `tests/tests/helpers/timeouts.ts` | Central named timeout buckets with JSDoc | VERIFIED | exists; exports `TIMEOUTS` with `element`, `click`, `page`, `slowPage`, `testMax` + per-field JSDoc |
| `tests/tests/helpers/index.ts` | Barrel re-export of TIMEOUTS | VERIFIED | `export { TIMEOUTS } from './timeouts'` on line 29 |
| `tests/tests/fixtures/voter/voterHomePage.fixture.ts` | goToPage + expectPageVisible | VERIFIED | exists; exports `createVoterHomePage`; `goToPage(locale='en')` via `(locale === 'en' ? '' : '/' + locale) + buildRoute({route:'Home',locale}) \|\| '/'`; `expectPageVisible` keyed on `testIds.voter.home.page` |
| `tests/tests/fixtures/voter/voterIntroPage.fixture.ts` | goToPage + expectPageVisible | VERIFIED | exists; same locale-aware URL pattern for route `Intro` |
| `tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts` | expectPageVisible | VERIFIED | exists; same locale-aware URL pattern for route `Questions` |
| `tests/tests/utils/testIds.ts` | voter.home + voter.intro page-content load anchors | VERIFIED | `voter.home.page: 'voter-home'` at line 133; `voter.intro.page: 'voter-intro'` at line 157 |
| `tests/tests/setup/setupFromTemplate.ts` | probeFreshDatabasePrecondition excluding seed_ prefix | VERIFIED | `BASELINE_SEED_PREFIX = 'seed_'` at line 78; 4 `.not(...)` clauses covering candidates + organizations |
| `tests/tests/setup/data.setup.ts` | mirror probe excluding seed_ prefix | VERIFIED | `BASELINE_SEED_PREFIX = 'seed_'` at line 21; same 4-clause structure |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `package.json typecheck:tests` | `tests/tsconfig.json` | `node_modules/.bin/tsc -p tests/tsconfig.json --noEmit` | VERIFIED | Pattern confirmed in `package.json:35` |
| `tests/eslint.config.mjs` | `eslint-plugin-playwright no-restricted-locators` | rules block | VERIFIED | Rule set at `error` level with `getByText` + `locator` types listed |
| voter fixtures goToPage | `buildRoute({route, locale})` | locale-aware URL construction | VERIFIED | All 4 fixtures use `(locale === 'en' ? '' : '/' + locale) + buildRoute(...)` |
| `expectPageVisible` | `page.getByTestId(testIds.voter.*)` | load-anchor testId assertion | VERIFIED | Each fixture keys on the correct catalog entry (voter-home, voter-intro, voter-questions-heading, voter-results-list, voter-entity-detail) |
| `probeFreshDatabasePrecondition candidates query` | `external_id NOT LIKE seed_%` | second `.not(...)` clause | VERIFIED | Both setup files: `.not('external_id', 'like', \`${BASELINE_SEED_PREFIX}%\`)` chained after the prefix clause |

### Data-Flow Trace (Level 4)

Not applicable — this phase delivers test infrastructure (tsconfig, eslint config, fixture functions, timeout constants, documentation annotations). No dynamic data rendering artifacts exist.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `yarn typecheck:tests` exits 0 | `node_modules/.bin/tsc -p tests/tsconfig.json --noEmit; echo $?` | exit 0, no stdout | PASS |
| `cd tests && npx eslint .` exits 0 | Live run | exit 0 | PASS |
| no-restricted-locators rule active in eslint.config.mjs | `grep -c no-restricted-locators tests/eslint.config.mjs` | 3 matches | PASS |
| No `const TIMEOUT = {` survives | `grep -rn "const TIMEOUT = {" tests/tests --include='*.ts' \| wc -l` | 0 | PASS |
| MEGA_TEST_MAX (120s) still applied via test.setTimeout | `grep test.setTimeout tests/tests/specs/voter/voter-mega-journey.spec.ts` | `test.setTimeout(MEGA_TEST_MAX)` at line 308 | PASS |
| L10N_TEST_MAX (180s) still applied via test.setTimeout | `grep test.setTimeout tests/tests/specs/perm/perm-localisation-positive.spec.ts` | `test.setTimeout(L10N_TEST_MAX)` at line 116 | PASS |
| No double-slash `'/' + buildRoute` pattern in voter fixtures | `grep -rn "'/' + buildRoute" tests/tests --include='*.ts'` | 0 matches | PASS |
| BASELINE_SEED_PREFIX in both setup files | `grep -c BASELINE_SEED_PREFIX tests/tests/setup/setupFromTemplate.ts tests/tests/setup/data.setup.ts` | 3 each | PASS |
| QUESTIONABLE annotation at both markdown sites | `grep -n "QUESTIONABLE" .planning/quick/260601-q22-SUMMARY.md .planning/todos/pending/*.md` | Both return line 52/98 with full annotation | PASS |

### Probe Execution

No conventional probe scripts exist for this phase. The automated checks above serve as the verification gate per VALIDATION.md guidance that a full `yarn test:e2e` run is the phase gate.

### Requirements Coverage

| Workstream | Evidence | Status |
|------------|----------|--------|
| TYPECHECK (WS1) | `tests/tsconfig.json` exists; `typecheck:tests` wired; exits 0 | SATISFIED |
| LOCATORS (WS1) | `no-restricted-locators` rule active; all 5 raw-locator sites guarded; `cd tests && npx eslint .` exits 0 | SATISFIED |
| FIXTURES (WS2) | 3 net-new voter fixtures; resultsPage + entityDetails extended; all registered in composition roots; 8 perm-spec gotos migrated; CR-01/CR-02 URL bug fixed in commit `921f70762` | SATISFIED |
| TIMEOUTS (WS3) | Central `timeouts.ts` with 5 named buckets; 4 local objects deleted; >90s budgets preserved via named inline exceptions | SATISFIED |
| DIAGNOSIS (WS4) | QUESTIONABLE annotation at both markdown sites; diff-script correctly NOT annotated (different claim) | SATISFIED |
| FRESHGUARD (WS5) | Both probes exclude `seed_` baseline prefix via chained `.not(...)` clauses; warn-only + hard-fail semantics unchanged | SATISFIED |
| D-01 through D-15 (CONTEXT decisions) | All 15 locked decisions verifiably implemented: D-01 forbidden-locator rule active, D-02 getByRole kept allowed, D-03 sweep reviewed (0 migrations — all legitimate role predicates), D-04 testIds catalog canonical, D-05 typecheck wired, D-06 goToPage navigates+asserts, D-07 expectPageVisible public, D-08 locale-aware URL, D-09 all voter routes covered, D-10 named semantic buckets, D-11 helpers/timeouts.ts barrel, D-12 inline // reason: exceptions, D-13 QUESTIONABLE annotation, D-14 warn-only preserved, D-15 seed_ sentinel reused | SATISFIED |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/tests/utils/voterIntro.ts` | 43 | `page.goto('/en/')` — raw hardcoded URL string; no `// reason:` comment; not migrated to `voterHomePage.goToPage('en')` | INFO | Out-of-scope follow-up per 92-05 SUMMARY (infrastructure file outside both 92-03 and 92-05 file lists); verification instructions explicitly mark as "not blocking" |
| `tests/tests/fixtures/voter-mega.fixture.ts` | ~111 | `page.goto(buildRoute({route:'Home', locale:'en'}))` — uses buildRoute (locale-aware, not raw string) but no `// reason:` comment | INFO | Out-of-scope follow-up per 92-05 SUMMARY; buildRoute usage is not raw-string goto; verification instructions explicitly mark as "not blocking" |
| `tests/tests/specs/perm/perm-header-show-feedback.spec.ts` | 27 | `getByTestId('feedback-form')` — magic string literal not in testIds catalog (WR-02 from code review) | INFO | Warning only — no behavior regression; CR review flagged but not a Phase 92 blocker |

No TBD/FIXME/XXX markers in any Phase 92 modified files. No blocking anti-patterns.

Note on `yarn lint:check` full exit code: the repo-wide `turbo run lint` exits 1 due to 3 pre-existing Phase-91 errors in `packages/dev-seed/src/templates/_helpers/` (`buildQuestions` unused import, `T` naming convention, export sort). These are explicitly noted as pre-existing out-of-scope in the verification instructions and all 92-SUMMARY files. The Phase 92 scoped check — `cd tests && npx eslint .` — exits 0.

### Human Verification Required

### 1. Full E2E Suite Pass Confirmation

**Test:** Run `yarn db:reset && yarn dev` (wait for both Supabase and frontend to be healthy), then `yarn test:e2e` targeting at minimum the voter-mega-journey, perm-localisation-positive, and any perm specs that had goto migrations.

**Expected:** All tests that were green before Phase 92 remain green. Specifically:
- `perm-localisation-positive.spec.ts`: the `resultsPage.goToPage('en')` and `resultsPage.goToPage('fi')` calls navigate to `/results` and `/fi/results` respectively (verifying the CR-01/CR-02 fix is correct at runtime, not just statically)
- `voter-mega-journey.spec.ts`: the 120s test.setTimeout budget is effective (no 90s timeout regression)
- `perm-localisation-positive.spec.ts`: the 180s test.setTimeout budget is effective (no 90s timeout regression)
- The migrated perm specs (perm-per-app-notifications, perm-disable-candidate-app, perm-missing-nominations, perm-header-show-help, perm-header-show-feedback) all pass with `voterHomePage.goToPage('en')` navigating correctly

**Why human:** E2E suite requires Supabase + dev server running. Not available in static verification context. VALIDATION.md explicitly designates this as the phase gate.

### Gaps Summary

No BLOCKER gaps identified. All five workstreams are verifiably implemented in the codebase:

- WS1 (TYPECHECK + LOCATORS): `tests/tsconfig.json` exists, `typecheck:tests` exits 0, `no-restricted-locators` active, all raw locators guarded, `cd tests && npx eslint .` exits 0.
- WS2 (FIXTURES): 3 net-new voter fixtures + 2 extended, all with correct locale-aware `goToPage` URL construction (CR-01/CR-02 fixed in commit `921f70762`), testId anchors on frontend, 8 perm-spec gotos migrated.
- WS3 (TIMEOUTS): Central `timeouts.ts` with 5 named buckets, 4 local objects deleted, >90s budgets preserved as named inline exceptions passed to `test.setTimeout(...)`.
- WS4 (DIAGNOSIS): QUESTIONABLE annotation at both markdown sites with original text preserved.
- WS5 (FRESHGUARD): Both probes exclude `seed_` prefix via chained `.not(...)` clauses; warn-only semantics intact.

The sole pending item is the live E2E run (manual phase gate per VALIDATION.md).

---

_Verified: 2026-06-03T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
