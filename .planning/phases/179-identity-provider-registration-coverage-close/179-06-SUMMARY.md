---
phase: 179-identity-provider-registration-coverage-close
plan: 06
subsystem: contestant-app
tags: [oidc, identity-provider, error-screen, i18n, e2e, playwright, a11y]

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-04/05: the mock issuer with a per-context selector (mintIdentity, outcomes cancel / provider-error), default-on identity-provider projects, the wrapper serving identity-callback and restoring the stack; close run 179-05-close"
provides:
  - "36 new message keys in seven catalogues (new namespace contestantApp.identityProvider; register, home, settings, nothingToEdit, login), Swedish common.login = Logga in; key list 179-catalogue-additions.json and writer 179-apply-catalogue.mjs (--check)"
  - "oidcError.ts: OIDC_ERROR with nine codes, oidcErrorFromProvider, oidcErrorFromFunction, oidcErrorClass (frozen own-property tables); upstreamOidcError deleted"
  - "CI2 at /contestant/register/identity-provider/error (route key ContestantAppIdentityProviderError): load returns { errorClass, providerOffered } only; in entryRoutes and PAGEVIEW_ROUTES; not guarded by the registration offer"
  - "C (register page) opens a listed mode named by its `mode` search parameter on mount"
  - "OIDC callback: every failure redirects to CI2 with a closed code; success path unchanged (still the pre-registration page)"
  - "E2E: contestant-identity-provider spec (2 tests @reg-idp), data-setup-/data-teardown-identity-provider projects, dev-seed template identity-provider (prefix e2e-bankauth-idp-), fixtures contestantIdentityProviderError + startIdentityProviderFlow/expectNoAccountFor, 3 entry scans x 2 themes, 2 phone checks"
affects: [179-07, 179-10, 179-14, 179-17, 179-19, 179-21, 179-23, 179-24]

tech-stack:
  added: []
  patterns:
    - "A query parameter on a public page is mapped through a frozen own-property table in the server load; only the class reaches the page"
    - "Catalogue keys are added by one scripted writer from one key list, with a --check mode"

key-files:
  created:
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.identityProvider.json
    - apps/frontend/src/routes/contestant/register/identity-provider/error/+page.server.ts
    - apps/frontend/src/routes/contestant/register/identity-provider/error/+page.svelte
    - apps/frontend/src/routes/contestant/register/identity-provider/error/page.server.test.ts
    - apps/frontend/src/routes/contestant/register/identity-provider/error/page.svelte.test.ts
    - packages/dev-seed/src/templates/e2e/perm/identity-provider.ts
    - tests/tests/fixtures/contestant/contestantIdentityProviderError.fixture.ts
    - tests/tests/setup/contestant/identity-provider.setup.ts
    - tests/tests/setup/contestant/identity-provider.teardown.ts
    - tests/tests/specs/contestant/contestant-identity-provider.spec.ts
    - .planning/phases/179-identity-provider-registration-coverage-close/179-catalogue-additions.json
    - .planning/phases/179-identity-provider-registration-coverage-close/179-apply-catalogue.mjs
    - .planning/todos/pending/2026-10-21-179-native-speaker-review-identity-provider-strings.md
  modified:
    - apps/frontend/src/lib/contestant/utils/oidcError.ts
    - apps/frontend/src/lib/contestant/utils/oidcError.test.ts
    - apps/frontend/src/routes/api/oidc/callback/+server.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
    - apps/frontend/src/routes/contestant/register/+page.svelte
    - apps/frontend/src/routes/contestant/register/page.svelte.test.ts
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/src/lib/routes/appGates.ts
    - apps/frontend/src/lib/routes/appGates.test.ts
    - apps/frontend/src/lib/analytics/pageviewRoutes.ts
    - apps/frontend/src/lib/i18n/tests/translations.test.ts
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - apps/frontend/project.inlang/settings.json
    - packages/dev-seed/src/templates/index.ts
    - tests/playwright.config.ts
    - tests/tests/utils/testIds.ts
    - tests/tests/fixtures/shared/identityProviderFlow.fixture.ts
    - tests/tests/specs/contestant/contestant-entry-scan.spec.ts
    - tests/tests/specs/contestant/contestant-entry-phone.spec.ts
    - tests/IDURA-TEST-RUNBOOK.md

key-decisions:
  - "The identity-provider setup's dataset is a new dev-seed template 'identity-provider' with prefix e2e-bankauth-idp-, inside the e2e-bankauth- namespace base.setup already sweeps and disjoint from e2e-bankauth-notloc-"
  - "The provider's mode is added by the setup's appSettingsOverride (as bank-auth-journey does), not in the template, so the template stays in the dev-seed perm settings family"
  - "Teardown removes users under e2e-idp- and identity-provider- with grants and invitations; it does not delete function-created candidate rows (none are created by this plan's scenarios)"
  - "The mode parameter is read from $app/state page.url inside onMount; only a listed mode among several is chosen"
  - "Non-English strings follow each namespace's form of address (Estonian: informal in identityProvider/register/settings, formal in home/nothingToEdit/login)"

patterns-established:
  - "Error-screen fixture opens CI2 by its address with a code, asserts class, sentence (from the catalogue) and Try again's destination"

requirements-completed: [REG-08]

actuals:
  tokens: 64601
  tasks: 3
  commits: 3
plan_head_before: 711637537ea9ae7207e4b88640eb697deab63e50
plan_head_after: 52b84a51b79b190616d7fc236b8988302cffbea2

coverage:
  - id: D1
    description: "Every new string in seven catalogues with identical keys and placeholders; Swedish sign-in label; native-review list"
    requirement: "REG-08"
    verification:
      - kind: other
        ref: "tests/e2e-runs/179-unit/179-06-t1-verify-restated.sh (exit 0); 179-apply-catalogue.mjs --check exit 0; second write run refused (exit 1) with no file changed"
        status: pass
    human_judgment: true
  - id: D2
    description: "Closed code set, class table, CI2 page and C's mode parameter"
    requirement: "REG-08"
    verification:
      - kind: unit
        ref: "tests/e2e-runs/179-unit/179-06-t2-red.{log,exit,head} (exit 1, 49 failed); green in 179-06-t2-unit2 (exit 0)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/179-e2e/179-06-held-2 (557/557; restated verdict PASS)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Callback failures land on CI2; cancel and provider-error scenarios; three scans in both themes; two phone checks"
    requirement: "REG-08"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/179-e2e/179-06-held-3 (569/569; restated verdict PASS, 131 projects)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/179-e2e/179-06-close (569/569; 179-verdict e2e --same-projects-as 179-06-held-3 PASS; restore: ok; no sleep in window)"
        status: pass
    human_judgment: false

duration: about 60 min (22:28Z to 23:28Z host clock)
completed: 2026-10-21
status: complete
---

# Phase 179 Plan 06: The identity provider's error screen (CI2) Summary

**An identification failure now ends on `/contestant/register/identity-provider/error`, which says only which of three things happened (cancelled, may work on retry, will not work on retry) in seven locales. The callback maps every failure to one of nine closed codes before redirecting, so no provider value reaches the address, and the page's load returns the class and whether Try again is offered, never the parameter. The phase's 36 new strings are in all seven catalogues, written by one scripted writer, and every constructed translation is listed for a native speaker.**

## Performance

- **Duration:** about 60 min (host clock 22:28:41Z to 23:28Z).
- **Tasks:** 3 of 3; **commits:** 3 (measured from the ledger).
- **Power:** on AC at 80 % for every long run; the operator's battery override was not used.

## Key counts (catalogues)

- Before: 744 keys per locale (all seven), 51 message files per locale.
- After: 780 keys per locale (all seven), 52 files per locale; 36 keys added, `common.login` reworded in `sv` only.
- `yarn assert:i18n-catalog-namespaces`: 780 total (contestantApp 323, adminApp 121, other 336), 0 violations.

## The code table as built

| Code | Class | Emitted by |
|---|---|---|
| `cancelled` | `cancelled` | callback: provider `access_denied` |
| `provider_error` | `retry` | callback: any other provider value |
| `missing_code` | `retry` | callback |
| `invalid_state` | `retry` | callback (state / PKCE binding) |
| `token_exchange_failed` | `retry` | callback catch-all |
| `registration_failed` | `retry` | `oidcErrorFromFunction`: `unavailable`, unknown result, absent body (not yet called; 179-14) |
| `invalid_token` | `noRetry` | callback (claims rejected); `oidcErrorFromFunction('invalid_token')` |
| `mode_not_allowed` | `noRetry` | `oidcErrorFromFunction('mode_not_allowed')` |
| `configuration_error` | `noRetry` | `oidcErrorFromFunction`: `configuration`, `refused`, `bad_request` |
| anything else, or none | `retry` | `oidcErrorClass` (own-property table; inherited names such as `constructor` are `retry`) |

## Runs

| Run | Tree | Result | Verdict |
|---|---|---|---|
| `179-unit/179-06-t2-red` | tests only | exit 1: 49 failed (oidcError cases, appGates list, C's mode cases; both CI2 test files failed at import) | red as required |
| `179-e2e/179-06-held-2` | uncommitted Task 2 at 9d758e65a | 557/557, wrapper exit 0, restore ok | plan's form FAIL (path form, see Deviation 3); restated `--dirty-only apps/frontend/src/` PASS, 128 projects equal to 179-05-close |
| `179-e2e/179-06-held-3` | uncommitted Task 3 at 00b06cc34 | 569/569, wrapper exit 0, restore ok | plan's form FAIL (path form); restated PASS, 131 projects, additions exactly contestant-identity-provider +2, data-setup-identity-provider +1, data-teardown-identity-provider +1, contestant-entry-scan +6 (29→35), contestant-entry-phone +2 (20→22) |
| `179-e2e/179-06-close` | committed 52b84a51b | 569/569, wrapper exit 0, `restore: ok`, 0 sleep entries | `179-verdict e2e 179-06-close --same-projects-as 179-06-held-3` PASS (131 projects) |

Held copies of every held file are kept as `tests/e2e-runs/179-e2e/179-06-held-{2,3}.<path with / as __>.kept`, each byte-identical to what was committed (`cmp`).

## Task Commits

1. **9d758e65a** `feat(179-06)`: the identity-provider registration's strings in seven locales (Task 1).
2. **00b06cc34** `feat(179-06)`: the identity provider's error screen and its closed code set (Task 2; a route nothing linked to, committed after held-2 was green).
3. **52b84a51b** `feat(179-06)`: identification failures land on the error screen with a closed code (Task 3; the one commit that changes the callback's failure destinations together with the specs that assert them, after held-3 was green).

## Verify blocks (`tests/e2e-runs/179-unit/179-06-t{1,2,3}-verify*.{sh,log,exit,head}`)

- **Task 1:** byte-for-byte exit 1, at two stages: the placeholder census reports `sv questions.intro.start` (en `Answer {numQuestions} Questions`, sv without the placeholder), a pre-existing mismatch present before the plan (census over `711637537`'s catalogues gives the same single row; `179-06-t1-placeholder-census.cjs`); and `yarn -s`. Restated (that one key excepted, `yarn` without `-s`): exit 0.
- **Task 2:** byte-for-byte exit 1 (`yarn -s`); restated (`yarn workspace … test:unit`, `--dirty-only apps/frontend/src/`): exit 0.
- **Task 3:** byte-for-byte exit 1 (the held-3 verdict's `--dirty-only apps/frontend/src` without a slash, and the dev-seed path); restated (`apps/frontend/src/`, `tests/`, `packages/dev-seed/src/templates/`): exit 0.

## Gates

- `yarn lint:check` exit 0 on the Task 2 tree (`179-06-t2-lint3`) and the Task 3 tree (`179-06-t3-lint2`).
- `yarn workspace @openvaa/frontend test:unit`: 6068 passed / 31 skipped on the Task 3 tree; `@openvaa/dev-seed` unit 1210 passed.
- `yarn assert:comment-hygiene` exit 0 before each commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The catalogue test pinned the file count and the nothing-to-edit key set**
- **Found during:** Task 1. `translations.test.ts` asserts 51 files per locale and exactly four `contestantApp.nothingToEdit` keys.
- **Fix:** 52 files; `nextStepsNoAddress: []` added to the pinned set. File not on the plan's list. Commit 9d758e65a.

**2. [Rule 3 - Blocking] The identity-provider setup needed a dataset of its own prefix**
- **Found during:** Task 3. No template had an owned prefix; `setupFromTemplate` resolves only registered templates.
- **Fix:** new dev-seed template `identity-provider` (`packages/dev-seed/src/templates/e2e/perm/identity-provider.ts`, buildMinimal, prefix `e2e-bankauth-idp-`) and its registry entry and export in `templates/index.ts`. The prefix sits inside the `e2e-bankauth-` namespace `base.setup.ts` already sweeps, so an orphaned dataset self-heals without a change to base. The provider's mode is added by the setup's `appSettingsOverride`, because `built-in-templates-contestant-app.test.ts` pins every perm template's registration row to email/code (a first version with the mode in the template turned that test red; moved). Two files not on the plan's list. Commit 52b84a51b.

**3. [Rule 3 - Blocking] The plan's `--dirty-only apps/frontend/src` names a file, not a directory**
- `179-verdict.mjs` treats a `--dirty-only` path as a directory only with a trailing slash. Both held verdicts were also run with `apps/frontend/src/` (and for held-3 `packages/dev-seed/src/templates/`, Deviation 2); the plan's own form and the restated form are both kept in `tests/e2e-runs/179-e2e/_drivers/`.

**4. [Rule 3 - Blocking] `yarn -s` refused by Yarn 4.18.1 (recurring)** — every verify block was also run restated without `-s`.

**5. [Rule 1 - Bug] Lint/type findings in new test code** — a template literal with quotes (eslint `quotes`), `page.url` assignments typed as the route-union URL (cast `as typeof page.url`), and an unsorted import/export in the template registry (`eslint --fix`). Fixed before the held runs.

### Other notes

- `startIdentityProviderFlow` waits for the post-navigation focus reset (the page's hydration sign) before pressing the legacy start, whose button is not disabled before mount.
- The setup logs `setupFromTemplate`'s unowned-row warning (other perm datasets are live at the chain tail), as `data-setup-bank-auth-journey` does; warning only.

**Total deviations:** 5 auto-fixed (4 blocking, 1 bug). **Impact:** two dev-seed files and one frontend test file outside the plan's list; no behaviour outside the plan changed.

## Code-review checklist (`.agents/code-review-checklist.md`)

- Solves the issue: yes (REG-08 failure path; success path is 179-07/179-14's).
- OWASP: CI2 reflects no input (class from a frozen own-property table; unit case renders a crafted address and finds it nowhere); the callback maps provider values before redirecting (unit case with a crafted value); no log line carries the parameter.
- Style guide / `any`: no `any`; one `as never` props cast in a component test, as the sibling tests do.
- Repetition: CI2's anonymous settings read repeats the five lines of `registrationGuard.ts` (`isRegistrationOffered` returns a boolean for another question); kept inline to stay inside the plan's files — candidate for a shared `readAppSettingsAnonymously` helper.
- Documentation: TSDoc on every new export, `@component` docstring on CI2, runbook codes table, C's docstring sentence.
- Tracking: CI2 is in `PAGEVIEW_ROUTES` with no params (pageview carries the route id; the query is not sent — inferred from the relay's route-id keying, not re-measured).
- Svelte guidelines / context rule: `appSettings` read as `contestantCtx.appSettings` in `$derived`; no destructured reactive accessor; no `view-transition-name`, no `<dialog>`.
- Errors handled and logged: the settings read failure is logged and fails closed (no Try again).
- Shared dependencies: the legacy preregister page still reads `?error=` values but no longer receives them; it is removed in 179-21.
- WCAG / keyboard: three scans × two themes green; all CI2 actions are links; `<h1 tabindex="-1">` per class.
- Comment hygiene: callback header and the `oidcError` module and test headers rewritten without history; `assert:comment-hygiene` green.
- Commits linear and atomic; no `[db]` change.

## Statements observed and inferred

- **Observed:** every count, exit status, verdict and comparison above; the red run; the byte identity of held copies; the pre-existing `sv questions.intro.start` placeholder mismatch before and after.
- **Inferred:** that the pageview relay sends no query string (from the route-id keyed map, not measured); the quality of the constructed translations (no native speaker read them — listed in the review todo).

## Items to report rather than edit

- **Swedish `contestantApp.login.title` still reads "Registrera dig"** (the sign-in page's own heading). U-23 named only `common.login`; recorded in the native-review todo for the reviewer.
- **Pre-existing:** `sv` `questions.intro.start` lacks `{numQuestions}` (en "Answer {numQuestions} Questions"); any whole-catalogue placeholder parity check (as in Task 1's verify) trips on it.
- **The plan's verdict commands** use `--dirty-only apps/frontend/src` without a trailing slash; later plans copying the form will fail the same way.
- **Teardown scope:** `identity-provider.teardown.ts` removes users under `e2e-idp-` / `identity-provider-` with grants and invitations, but not candidate rows the function creates (no external id). 179-14 (first account-creating scenario) should add `deleteBankAuthCandidateBySub`-style cleanup per user, which needs a public user listing on `SupabaseAdminClient`.
- **179-UI-SPEC.md** says each catalogue holds 744 keys and 742 after the phase; after this plan it is 780 (the 38 removals land in 179-21).
- **Carried items:** none of the open rows in `179-CARRIED-ITEMS.md` falls in this plan's files (the stale `PLAYWRIGHT_BANK_AUTH` comments are in `bank-auth-journey.setup/teardown.ts` and `base.setup.ts`, untouched).

## Known Stubs

None. Try again links to C with `mode=identity_provider`; C's provider panel still opens the legacy start until 179-07.

## Threat Flags

None beyond the plan's threat model: T-179-061 (class-only load, crafted-value unit cases in page, load and callback tests), T-179-062 (three classes on screen, nine coarse codes on the address), T-179-063 (`configuration_error` and `mode_not_allowed` in `noRetry`; Try again only while the mode is listed).

## Self-Check: PASSED

- Files: the CI2 route files, the seven `contestantApp.identityProvider.json`, the spec, setup, teardown, fixture, template, key list, writer and todo exist and are tracked.
- Commits 9d758e65a, 00b06cc34 and 52b84a51b are ancestors of HEAD; `git rev-list --count 711637537..HEAD` = 3.
- Run directories `179-06-held-2`, `179-06-held-3`, `179-06-close` exist with `summary.json`, `restore.txt` ending `restore: ok`.
- STATE.md and ROADMAP.md were not touched.
