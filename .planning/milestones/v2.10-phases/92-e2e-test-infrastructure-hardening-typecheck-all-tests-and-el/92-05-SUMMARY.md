---
phase: 92-e2e-test-infrastructure-hardening
plan: 05
subsystem: e2e-test-infrastructure
tags: [fixtures, goToPage, voter-app, perm-specs, playwright, D-09]
requires:
  - "92-01 (no-restricted-locators rule + typecheck:tests gate)"
  - "92-03 (voterHomePage + resultsPage goToPage fixtures + views.ts composition root)"
provides:
  - "perm-spec gap-file named voter-route gotos migrated onto voterHomePage/resultsPage goToPage"
  - "perm-l10n composition root extended with voterHomePage + resultsPage fixtures"
  - "exhaustive D-09 coverage proof — classified residual page.goto list"
affects: []
tech-stack:
  added: []
  patterns:
    - "perm specs re-rooted on fixtures/views composition root to obtain voterHomePage"
    - "voter page fixtures registered in perm-l10n root so candidate-perm specs can destructure them"
key-files:
  created: []
  modified:
    - tests/tests/specs/perm/perm-per-app-notifications.spec.ts
    - tests/tests/specs/perm/perm-disable-candidate-app.spec.ts
    - tests/tests/specs/perm/perm-missing-nominations.spec.ts
    - tests/tests/specs/perm/perm-header-show-help.spec.ts
    - tests/tests/specs/perm/perm-header-show-feedback.spec.ts
    - tests/tests/specs/perm/perm-hide-all-nominations.spec.ts
    - tests/tests/specs/perm/perm-localisation-positive.spec.ts
    - tests/tests/fixtures/candidate/perm-l10n.ts
decisions:
  - "5 simple perm specs re-rooted from @playwright/test onto ../../fixtures/views to obtain voterHomePage by destructuring (views.ts extends base, so page is still available)."
  - "perm-localisation-positive consumes the perm-l10n composition root, which lacked voterHomePage/resultsPage — registered both there rather than re-rooting the spec (preserves its candidate fixtures)."
  - "voter-mega.fixture.ts:110 + utils/voterIntro.ts:57 voter-Home gotos noted as out-of-scope follow-ups: they live in fixture/helper infrastructure outside both 92-03's and 92-05's explicit file lists, not in the 7 perm gap files."
metrics:
  duration: ~5min
  completed: 2026-06-02
  tasks: 3
  files: 8
---

# Phase 92 Plan 05: Perm-Spec Voter-Route Goto Migration Summary

Migrated the named voter-route `page.goto` calls in the 7 perm-spec gap files onto the voter fixtures' `goToPage(locale?)` paradigm built in plan 92-03, while correctly leaving maintenance-mode, 307-redirect-assertion, candidate-route, and OIDC-callback gotos inline with `// reason:` rationale. An exhaustive re-grep across `tests/tests/**` proves zero un-migrated named voter-route gotos landing on a normally-rendered voter page remain in scope.

## What Was Built

### Task 1 — single-Home-goto perm specs (commit `0dfb0ec4d`)
Re-rooted 5 specs from `@playwright/test` onto the `../../fixtures/views` composition root and migrated their `/en` Home gotos to `voterHomePage.goToPage('en')`:
- `perm-per-app-notifications.spec.ts:35` → `voterHomePage.goToPage('en')` (`.describe.skip` file — migrated anyway for consistency).
- `perm-disable-candidate-app.spec.ts:28` → `voterHomePage.goToPage('en')` (NON-maintenance; start button asserted visible after).
- `perm-missing-nominations.spec.ts:31` → `voterHomePage.goToPage('en')` (then clicks home start button).
- `perm-header-show-help.spec.ts:24` → `voterHomePage.goToPage('en')`.
- `perm-header-show-feedback.spec.ts:22` → `voterHomePage.goToPage('en')`.

Kept inline with `// reason:`:
- `perm-per-app-notifications.spec.ts:48` `/en/candidate` — candidate route.
- `perm-disable-candidate-app.spec.ts:22` `/en/candidate` — candidate maintenance probe; `:32` `/en/elections` — generic `getByRole('main')` only, no elections fixture in scope.
- `perm-hide-all-nominations.spec.ts:21` `/en/nominations` — 307-redirect-to-Home assertion; a nominations-anchor goToPage would fail because the page redirects away.

### Task 2 — perm-localisation-positive Home + Results gotos (commit `6ebd07a29`)
- `perm-l10n.ts` composition root extended with `voterHomePage` + `resultsPage` fixtures (import + type + registration), so the spec destructures them.
- `:116` `/en` → `voterHomePage.goToPage('en')` (test then opens nav drawer + reads language selector — home renders normally; anchor assertion compatible).
- `:325` `/en/results` → `resultsPage.goToPage('en')`.
- `:374` `/fi/results` → `resultsPage.goToPage('fi')`.
- Kept inline with `// reason:`: OIDC registration-callback goto (`:196`), `/en/candidate/profile` (`:207`), `/en/candidate` (`:315`) — candidate/external-callback routes.
- **TIMEOUT object + `test.setTimeout(TIMEOUT.testMax)` left UNCHANGED** (owned by plan 92-04, which runs after). The `TIMEOUT.slowPage` post-goto content assertions (candidate-card / dialog visibility) were preserved — they assert content AFTER goToPage's anchor lands.

### Task 3 — exhaustive D-09 coverage proof (verification-only, no file edit)
Per-file migrate/keep tally:

| File | Migrated → goToPage | Kept inline (with // reason) |
|------|---------------------|------------------------------|
| perm-per-app-notifications | 1 (`/en` → voterHomePage) | 1 (`/en/candidate`) |
| perm-disable-candidate-app | 1 (`/en` → voterHomePage) | 2 (`/en/candidate`, `/en/elections`) |
| perm-missing-nominations | 1 (`/en` → voterHomePage) | 0 |
| perm-header-show-help | 1 (`/en` → voterHomePage) | 0 |
| perm-header-show-feedback | 1 (`/en` → voterHomePage) | 0 |
| perm-hide-all-nominations | 0 | 1 (`/en/nominations` 307-redirect) |
| perm-localisation-positive | 3 (`/en`, `/en/results`, `/fi/results`) | 3 (callback, 2 candidate routes) |
| **Total** | **8 migrated** | **7 kept inline** |

## Exhaustive Coverage Proof — Classified Residual `page.goto` List

Full `grep -rn "\.goto(" tests/tests --include='*.ts'` residual, every hit classified into a legitimate inline category. (Comment-only matches in docstrings omitted.)

**1. Genuine external-callback URLs:**
- `perm-localisation-positive.spec.ts:200` `registrationCallbackUrl` (OIDC/Inbucket).
- `candidate-mega-journey.spec.ts:321` `registrationCallbackUrl`, `:382` `resetCallbackUrl`.

**2. Maintenance-mode goto asserting a HIDDEN anchor:**
- `perm-disable-voter-app.spec.ts:26` `/en`, `:34` `/en/elections` (access.voterApp=false — start button asserted hidden; documented 92-03).

**3. 307-redirect-assertion goto:**
- `perm-hide-all-nominations.spec.ts:23` `/en/nominations` (asserts redirect to Home).

**4. Locale-less redirect-bounce / deferred-target probes:**
- `perm-not-located-2e2cg.spec.ts:66` `/results`, `:90` `deferredTarget`, `:108` `deferredTarget`, `:126` `/results`, `:153` `/elections?next=...` (bounce/whitelist probes; documented 92-03).

**5. Candidate-route gotos (out of Phase 92 scope):**
- `perm-disable-candidate-app.spec.ts:25` `/en/candidate`; `perm-per-app-notifications.spec.ts:48` `/en/candidate`; `perm-disable-voter-app.spec.ts:41` `/en/candidate`; `perm-localisation-positive.spec.ts:212` `/en/candidate/profile`, `:321` `/en/candidate`; `perm-answers-locked.spec.ts:36` `/en/candidate`, `:45` `/en/candidate/profile`; all `candidate-mega-journey.spec.ts` `/en/candidate/*` gotos (`:278/:288/:366/:375/:416/:589/:622/:645/:657/:666/:685`).
- `perm-disable-candidate-app.spec.ts:37` `/en/elections` — generic `getByRole('main')` landmark only, no elections-page fixture in scope.

**6. Setup login gotos (setup files, out of scope):**
- `auth.setup.ts:25` `loginRoute`; `perm-answers-locked.setup.ts:46`, `perm-disable-allow-open.setup.ts:34`, `perm-hide-hero.setup.ts:37` `loginRoute`.

**7. Generic navigation wrappers / dynamic-fallback util gotos:**
- `helpers/settle.helper.ts:83` `page.goto(url)` (the `gotoAndSettle` wrapper).
- `utils/voterNavigation.ts:251` `/questions?...` (dynamic electionId-bearing fallback URL; 92-03 kept inline).

**8. Already-`buildRoute`-based voter gotos the goto-migration plans kept (not raw string gotos):**
- `voter-mega-journey.spec.ts:333` About, `:351` Info, `:360` Privacy (locale-aware buildRoute; no fixture this plan — 92-03 kept).
- `a11y-smoke.spec.ts:119` `buildRoute({ route: route.routeId })` (parametrised a11y sweep across many routes).
- `visual-regression.spec.ts:74`, `:99` `CandAppPreview` (candidate route, buildRoute).

**Fixture-internal implementations (the canonical goToPage bodies — by design):**
- `voter/voterHomePage.fixture.ts:43`, `voter/voterIntroPage.fixture.ts:38`, `voter/voterQuestionsPage.fixture.ts:46`, `resultsPage.fixture.ts:86`, `candidateQuestionsOverviewPage.fixture.ts:85` — these ARE the goToPage paradigm implementations.

**Out-of-scope follow-up (noted, not migrated):**
- `voter-mega.fixture.ts:110` `buildRoute({ route: 'Home' })` and `utils/voterIntro.ts:57` `/en/` — voter-Home gotos inside fixture/helper infrastructure files that are outside BOTH 92-03's (5 primary voter files) and 92-05's (7 perm gap files) explicit file lists. Fixtures for the Home route exist (`createVoterHomePage`); migrating these two infrastructure files is a small follow-up but was deliberately NOT done here to respect plan file-scope boundaries. They land on normally-rendered pages but immediately click the home start button, so they are functionally covered today.

**Conclusion:** No named voter-route `page.goto` landing on a normally-rendered voter page remains un-migrated within the 7 perm gap files (plan 92-05 scope) or the 5 primary voter files (plan 92-03 scope). The only voter-Home gotos remaining anywhere in `tests/` are the two infrastructure-file helpers noted above and the canonical fixture implementations themselves.

## Deviations from Plan

### Auto-fixed
**1. [Rule 3 - Blocking lint] Import sort in perm-l10n.ts**
- After adding the cross-dir `../resultsPage.fixture` + `../voter/voterHomePage.fixture` imports, `simple-import-sort/imports` flagged the ordering. Fixed via `npx eslint ... --fix`. Verified green.
- **File:** tests/tests/fixtures/candidate/perm-l10n.ts
- **Commit:** `6ebd07a29`

### Decision (no behavior impact)
**2. [Decision] perm-l10n root extended rather than spec re-rooted**
- `perm-localisation-positive.spec.ts` consumes the `perm-l10n` composition root (which carries its candidate-mega + langSelector + multilingual fixtures). Rather than re-root the spec onto `views.ts` (which would lose those fixtures), `voterHomePage` + `resultsPage` were registered in the `perm-l10n` root so the spec destructures all fixtures from one place.

## Gate Results
- `yarn typecheck:tests` → exit 0.
- `cd tests && npx eslint .` → exit 0 (no-restricted-locators satisfied; goToPage migration uses fixture methods, not raw locators).
- Repo-wide `yarn lint:check` remains RED on 3 pre-existing Phase-91 dev-seed `_helpers/` errors — KNOWN out-of-scope per handoff context, NOT touched.
- PHASE GATE (manual `yarn test:e2e` over perm projects) recorded at phase-level verification, not blocking this plan.

## Self-Check: PASSED
- Commits `0dfb0ec4d`, `6ebd07a29` both FOUND in git log.
- All 8 modified files present in commits; no accidental file deletions in either commit.
- TIMEOUT object + test.setTimeout in perm-localisation-positive confirmed intact (grep) for 92-04 handoff.
