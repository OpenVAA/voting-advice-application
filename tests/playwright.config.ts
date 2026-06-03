import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { TIMEOUTS } from './tests/helpers/timeouts';
import { TESTS_DIR } from './tests/utils/testsDir';

dotenv.config();

export const STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/user.json');

/**
 * Playwright configuration with project dependencies pattern.
 *
 * The 2026-06-02 cleanup removed the deprecated candidate-app / voter-app /
 * variant chains and their specs. Phase 93 Plan 04 renamed the journey chains
 * (D-09/D-10/D-11) and merged the two base-seeding paths into one (D-06). The
 * surviving suite is:
 *
 *   - journey chains: data-setup-base -> voter-journey
 *     + data-setup-candidate-journey -> candidate-journey
 *   - perm-* family: a single sequential chain anchored on
 *     data-setup-perm-1e1cg1co (HIGH-2 app_settings JSONB singleton — each
 *     perm setup clobbers the singleton, so the family runs serially).
 *   - opt-in specialized projects (env-gated, excluded from default
 *     `yarn test:e2e`): visual-regression (PLAYWRIGHT_VISUAL), performance
 *     (PLAYWRIGHT_PERF), a11y-smoke (PLAYWRIGHT_A11Y), bank-auth
 *     (PLAYWRIGHT_BANK_AUTH). These depend on the merged `data-setup-base`
 *     (e2e/base dataset) and, for visual, `auth-setup` (candidate storageState).
 *
 * `auth-setup` is retained ONLY to back the visual opt-in project; it is
 * dormant in the default run (no default project depends on it).
 *
 * See https://playwright.dev/docs/test-global-setup-teardown
 */
export default defineConfig({
  testDir: TESTS_DIR,
  testIgnore: ['**/*.test.ts'],
  outputDir: path.join(TESTS_DIR, '../playwright-results'),

  /* Screenshot baselines stored alongside specs in a git-trackable directory */
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{ext}',

  /* Per-test timeout — 90s ceiling required for full-suite render-pressured fixtures.
   * Plan 64-04 Task 6 bumped voter.fixture.ts internal waitForURL budgets to 30s, but the
   * per-test wrapper timeout was the binding constraint: under --workers=1 full-suite
   * contention the answer-loop + post-loop waitForURL exceeded 30s and timed out at
   * voter.fixture.ts:85. Path A continuation per .planning/phases/64-voter-results-reactivity-completion/64-03-RECAPTURE-NOTES.md.
   * Single source of the 90s ceiling: TIMEOUTS.testMax (tests/tests/helpers/timeouts.ts). */
  timeout: TIMEOUTS.testMax,

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry tests on CI */
  retries: process.env.CI ? 3 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 6,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { outputFolder: path.join(TESTS_DIR, '../playwright-report') }]],

  /* Default visual comparison thresholds for toHaveScreenshot */
  expect: {
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixelRatio: 0.01
    }
  },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace for all tests. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',

    baseURL: process.env.FRONTEND_PORT ? `http://localhost:${process.env.FRONTEND_PORT}` : 'http://localhost:5173'
  },

  projects: [
    // === Shared base auth setup (opt-in only) ===
    //
    // Phase 93 Plan 04 (D-06) MERGED the old `data-setup` / `data-teardown`
    // (bare-`e2e` dataset) into the single base chain (`data-setup-base` /
    // `data-teardown-base`). The opt-in specialized projects
    // below (visual-regression, performance, a11y-smoke, bank-auth) now depend
    // on `data-setup-base` for their seed; `auth-setup` (candidate
    // storageState) depends on it too. `auth-setup` is declared ONLY when an
    // opt-in flag is set, so the default `yarn test:e2e` (voter/candidate
    // journeys + perm-* family) never runs the candidate-login storageState
    // step.
    //
    // NOTE (D-06 deferred): the merged base dataset (`e2e/base`) does not seed
    // a `test-candidate-alpha` row and base candidates carry no email column,
    // so `auth-setup`'s UI-login step has no registered base candidate to
    // authenticate as. The dependency repoint keeps the graph resolving; a
    // follow-up plan rewiring the opt-in/auth chain against base must establish
    // a registered base-candidate + email (forceRegister) contract before the
    // visual opt-in run can pass.
    //
    // Only `visual-regression` consumes the candidate storageState, so
    // `auth-setup` is declared under PLAYWRIGHT_VISUAL alone (perf / a11y /
    // bank-auth depend on `data-setup-base` directly, not on auth-setup).
    ...(process.env.PLAYWRIGHT_VISUAL
      ? [
          // Auth setup - logs in as candidate, saves storageState (depends on
          // the merged base dataset being seeded).
          {
            name: 'auth-setup',
            testMatch: /auth\.setup\.ts/,
            dependencies: ['data-setup-base']
          }
        ]
      : []),

    // === Opt-in Specialized Projects ===
    // These projects are gated by environment variables and excluded from
    // the default `yarn test:e2e` run. Enable via:
    //   PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --project=visual-regression
    //   PLAYWRIGHT_PERF=1 npx playwright test -c tests/playwright.config.ts --project=performance

    // Visual regression: screenshot comparison for key pages
    ...(process.env.PLAYWRIGHT_VISUAL
      ? [
          {
            name: 'visual-regression',
            testDir: './tests/specs/visual',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['data-setup-base', 'auth-setup']
          }
        ]
      : []),

    // Performance budgets: page load timing assertions
    ...(process.env.PLAYWRIGHT_PERF
      ? [
          {
            name: 'performance',
            testDir: './tests/specs/perf',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['data-setup-base']
          }
        ]
      : []),

    // Accessibility smoke: WCAG 2.1 AA scan via @axe-core/playwright (Phase 76 A11Y-03)
    //   PLAYWRIGHT_A11Y=1 npx playwright test -c tests/playwright.config.ts --project=a11y-smoke
    ...(process.env.PLAYWRIGHT_A11Y
      ? [
          {
            name: 'a11y-smoke',
            testDir: './tests/specs/a11y',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['data-setup-base']
          }
        ]
      : []),

    // Bank auth (Idura/Signicat): identity-callback Edge Function integration
    //   PLAYWRIGHT_BANK_AUTH=1 npx playwright test -c tests/playwright.config.ts --project=bank-auth
    ...(process.env.PLAYWRIGHT_BANK_AUTH
      ? [
          {
            name: 'bank-auth',
            testDir: './tests/specs/candidate',
            testMatch: /candidate-bank-auth\.spec\.ts/,
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['data-setup-base']
          }
        ]
      : []),

    // === Phase 88 Plan 01 — base / voter-journey chain ===
    //
    // Renamed to the `base` / `voter-journey` keys in Phase 93 Plan 04
    // (D-10/D-11), and DECOUPLED from the perm anchor (FLAG-6 / operator
    // decision 2 — the merged base seeds independently; opt-in-only runs must
    // work standalone).
    //
    // Project graph (independent — no cross-chain dependency):
    //   data-setup-base → voter-journey
    //   data-setup-base ↦ data-teardown-base (via teardown: key)
    //
    // FLAG-6 reasoning: `data-setup-base` previously anchored on
    // `perm-not-located-2e2cg` so the perm family's
    // `extraTeardownPrefix: ['test-', 'e2e-perm-']` could not wipe base
    // `test-` rows mid-run. That anchor is DROPPED here so the base chain
    // seeds standalone. The base setup retains a defensive
    // `extraTeardownPrefix: 'e2e-perm-'` pre-clear (shared/base.setup.ts) —
    // an idempotent wipe of the SEPARATE `e2e-perm-` namespace, never the
    // base `test-` rows — so a perm chain that ran earlier in the same DB
    // session cannot leak rows into the base dataset regardless of ordering.
    {
      name: 'data-setup-base',
      testMatch: /base\.setup\.ts/,
      teardown: 'data-teardown-base'
      // reason: perm-anchor dependency DROPPED (FLAG-6) — base seeds
      // independently; cross-namespace isolation is enforced by the
      // base setup's own `extraTeardownPrefix: 'e2e-perm-'` pre-clear.
    },
    {
      name: 'data-teardown-base',
      testMatch: /base\.teardown\.ts/
    },
    {
      name: 'voter-journey',
      testDir: './tests/specs/voter',
      testMatch: /voter-journey\.spec\.ts/,
      fullyParallel: false, // single-test serial journey
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-base']
    },

    // === Phase 88 Plan 03 — voter permutations chains ===
    //
    // Per 88-03-SCOPE.md post-plan-check resolutions (lines 8-21):
    //   - HIGH-1: specs live under tests/tests/specs/perm/ (NEW directory);
    //     voter-app testIgnore needs NO extension because that project's
    //     testDir is `./tests/specs/voter` — perm specs are categorically
    //     outside its discovery surface.
    //   - HIGH-2: perm-* setups chain SEQUENTIALLY within the perm-* family
    //     to prevent app_settings singleton clobbering. The FIRST perm setup
    //     (data-setup-perm-1e1cg1co) has NO dependencies array — preserves
    //     "no cross-chain dependency to non-perm chains" (the perm-* family
    //     runs in parallel with the base / voter-journey / candidate-journey
    //     chains).
    //   - Each chain teardowns ITS OWN test-perm-<short>- prefix
    //     (parallel-only contract honored within the family).
    //
    // Sequential chain across the family:
    //   data-setup-perm-1e1cg1co (FIRST — no deps)
    //   → data-setup-perm-2e-shared
    //   → data-setup-perm-2e-asymmetric
    //   → data-setup-perm-startfromcg
    //   → data-setup-perm-disjoint-1co
    //   → data-setup-perm-disable-election-1co
    //   → data-setup-perm-disable-election-2co
    //   → data-setup-perm-not-located-2e2cg

    // Variant 1: perm-1e1cg1co (1 test) — FIRST in chain, no upstream perm dep
    {
      name: 'data-setup-perm-1e1cg1co',
      testMatch: /perm-1e1cg1co\.setup\.ts/,
      teardown: 'data-teardown-perm-1e1cg1co'
      // No upstream dep — perm-* runs FIRST in default mode. Phase 93 Plan 04
      // (FLAG-6) DECOUPLED the base chain from the perm anchor, so the base /
      // voter-journey / candidate-journey chains now run independently of the
      // perm family (the base setup's own `extraTeardownPrefix: 'e2e-perm-'`
      // pre-clear enforces cross-namespace isolation regardless of ordering).
    },
    {
      name: 'data-teardown-perm-1e1cg1co',
      testMatch: /perm-1e1cg1co\.teardown\.ts/
    },
    {
      name: 'perm-1e1cg1co',
      testDir: './tests/specs/perm',
      testMatch: /perm-1e1cg1co\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-1e1cg1co']
    },

    // Variant 2: perm-2e-shared (2 tests) — sequential after perm-1e1cg1co (HIGH-2)
    {
      name: 'data-setup-perm-2e-shared',
      testMatch: /perm-2e-shared\.setup\.ts/,
      teardown: 'data-teardown-perm-2e-shared',
      // Depends on the previous chain's SPEC project (not its setup), so the
      // previous chain's spec finishes before this setup seeds. Playwright
      // forbids setups depending on teardown projects directly, so this is
      // the strictest ordering we can declare. Cross-chain row isolation is
      // enforced inside `setupFromTemplate` via `extraTeardownPrefix:
      // 'test-perm-'` (clears the whole family before seeding this template),
      // so we don't depend on the previous chain's teardown actually finishing
      // before this setup runs. Confirmed via Gate A 2026-05-26.
      dependencies: ['perm-1e1cg1co']
    },
    {
      name: 'data-teardown-perm-2e-shared',
      testMatch: /perm-2e-shared\.teardown\.ts/
    },
    {
      name: 'perm-2e-shared',
      testDir: './tests/specs/perm',
      testMatch: /perm-2e-shared\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-2e-shared']
    },

    // Variant 3: perm-2e-asymmetric (1 test) — sequential after perm-2e-shared
    {
      name: 'data-setup-perm-2e-asymmetric',
      testMatch: /perm-2e-asymmetric\.setup\.ts/,
      teardown: 'data-teardown-perm-2e-asymmetric',
      // Depends on previous SPEC — see data-setup-perm-2e-shared comment above (cross-chain isolation enforced via extraTeardownPrefix in setupFromTemplate).
      dependencies: ['perm-2e-shared']
    },
    {
      name: 'data-teardown-perm-2e-asymmetric',
      testMatch: /perm-2e-asymmetric\.teardown\.ts/
    },
    {
      name: 'perm-2e-asymmetric',
      testDir: './tests/specs/perm',
      testMatch: /perm-2e-asymmetric\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-2e-asymmetric']
    },

    // Variant 4: perm-startfromcg (2 tests) — sequential after perm-2e-asymmetric
    {
      name: 'data-setup-perm-startfromcg',
      testMatch: /perm-startfromcg\.setup\.ts/,
      teardown: 'data-teardown-perm-startfromcg',
      // Depends on previous SPEC — see data-setup-perm-2e-shared comment above (cross-chain isolation enforced via extraTeardownPrefix in setupFromTemplate).
      dependencies: ['perm-2e-asymmetric']
    },
    {
      name: 'data-teardown-perm-startfromcg',
      testMatch: /perm-startfromcg\.teardown\.ts/
    },
    {
      name: 'perm-startfromcg',
      testDir: './tests/specs/perm',
      testMatch: /perm-startfromcg\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-startfromcg']
    },

    // Variant 5: perm-disjoint-1co (2 tests) — sequential after perm-startfromcg
    {
      name: 'data-setup-perm-disjoint-1co',
      testMatch: /perm-disjoint-1co\.setup\.ts/,
      teardown: 'data-teardown-perm-disjoint-1co',
      // Depends on previous SPEC — see data-setup-perm-2e-shared comment above (cross-chain isolation enforced via extraTeardownPrefix in setupFromTemplate).
      dependencies: ['perm-startfromcg']
    },
    {
      name: 'data-teardown-perm-disjoint-1co',
      testMatch: /perm-disjoint-1co\.teardown\.ts/
    },
    {
      name: 'perm-disjoint-1co',
      testDir: './tests/specs/perm',
      testMatch: /perm-disjoint-1co\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disjoint-1co']
    },

    // Variant 6: perm-disable-election-1co (1 test) — sequential after perm-disjoint-1co
    {
      name: 'data-setup-perm-disable-election-1co',
      testMatch: /perm-disable-election-1co\.setup\.ts/,
      teardown: 'data-teardown-perm-disable-election-1co',
      // Depends on previous SPEC — see data-setup-perm-2e-shared comment above (cross-chain isolation enforced via extraTeardownPrefix in setupFromTemplate).
      dependencies: ['perm-disjoint-1co']
    },
    {
      name: 'data-teardown-perm-disable-election-1co',
      testMatch: /perm-disable-election-1co\.teardown\.ts/
    },
    {
      name: 'perm-disable-election-1co',
      testDir: './tests/specs/perm',
      testMatch: /perm-disable-election-1co\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disable-election-1co']
    },

    // Variant 7: perm-disable-election-2co (1 test) — sequential after perm-disable-election-1co
    {
      name: 'data-setup-perm-disable-election-2co',
      testMatch: /perm-disable-election-2co\.setup\.ts/,
      teardown: 'data-teardown-perm-disable-election-2co',
      // Depends on previous SPEC — see data-setup-perm-2e-shared comment above (cross-chain isolation enforced via extraTeardownPrefix in setupFromTemplate).
      dependencies: ['perm-disable-election-1co']
    },
    {
      name: 'data-teardown-perm-disable-election-2co',
      testMatch: /perm-disable-election-2co\.teardown\.ts/
    },
    {
      name: 'perm-disable-election-2co',
      testDir: './tests/specs/perm',
      testMatch: /perm-disable-election-2co\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disable-election-2co']
    },

    // Variant 8: perm-not-located-2e2cg (5 tests) — sequential after perm-disable-election-2co
    {
      name: 'data-setup-perm-not-located-2e2cg',
      testMatch: /perm-not-located-2e2cg\.setup\.ts/,
      teardown: 'data-teardown-perm-not-located-2e2cg',
      // Depends on previous SPEC — see data-setup-perm-2e-shared comment above (cross-chain isolation enforced via extraTeardownPrefix in setupFromTemplate).
      dependencies: ['perm-disable-election-2co']
    },
    {
      name: 'data-teardown-perm-not-located-2e2cg',
      testMatch: /perm-not-located-2e2cg\.teardown\.ts/
    },
    {
      name: 'perm-not-located-2e2cg',
      testDir: './tests/specs/perm',
      testMatch: /perm-not-located-2e2cg\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-not-located-2e2cg']
    },

    // === Phase 89 Plan 03 — candidate-journey chain ===
    //
    // REFACTORED 2026-05-31 to break the voter-journey cascade-skip;
    // renamed to the `candidate-journey` + `base` keys in Phase 93 Plan 04
    // (D-09/D-10/D-11).
    //
    // BEFORE: `data-setup-candidate-journey.dependencies = ['voter-journey']`
    // enforced strict ordering because the setup re-seeded base via
    // `runTeardown('test-')` which would race with voter-journey's reads. Any
    // voter-journey failure cascade-skipped candidate-journey + the entire
    // 89-04 + 91 perm-* family.
    //
    // AFTER: candidate-journey setup no longer re-seeds (see
    // tests/tests/setup/candidate/candidate-journey.setup.ts). The chain
    // consumes the base data already seeded by `data-setup-base` and runs as a
    // PARALLEL LEAF alongside voter-journey. Neither cascade-skips the other on
    // spec failure. Their teardowns are independent: base.teardown owns the
    // 'test-' row prefix; candidate-journey.teardown owns only the auth.users
    // row created by the spec's registration step.
    //
    // The setup still guarantees a clean auth.users row for
    // UNREGISTERED_CANDIDATE_EMAIL via idempotent `unregisterCandidate`,
    // so the registration-via-email step lands deterministically.
    //
    // Spec project sets `storageState: { cookies: [], origins: [] }` to
    // start UNAUTHENTICATED — required for the registration-via-email
    // flow (per R13 + candidate-registration.spec.ts:22 precedent).
    {
      name: 'data-setup-candidate-journey',
      testMatch: /candidate-journey\.setup\.ts/,
      teardown: 'data-teardown-candidate-journey',
      dependencies: ['data-setup-base']
    },
    {
      name: 'data-teardown-candidate-journey',
      testMatch: /candidate-journey\.teardown\.ts/
    },
    {
      name: 'candidate-journey',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-journey\.spec\.ts/,
      fullyParallel: false, // single-test serial journey
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] }
      },
      dependencies: ['data-setup-candidate-journey']
    },

    // === Phase 89 Plan 04 — 3 settings-permutation chains (TIR4-PERM-01..03) ===
    //
    // Sequenced AFTER candidate-journey via dependencies on the
    // candidate-journey spec project, and chained sequentially among
    // themselves (perm-disable-voter-app → perm-disable-candidate-app →
    // perm-per-app-notifications) per 88-03 perm-* family precedent.
    //
    // Parallel-safety: each perm template uses a distinct externalIdPrefix
    // ('e2e-perm-novapp-', 'e2e-perm-nocand-', 'e2e-perm-notif-') per D-89-03,
    // and each setup passes `extraTeardownPrefix: ['test-', 'e2e-perm-']`
    // to pre-clear any residual rows from prior chains still mid-teardown.

    // Variant 1: perm-disable-voter-app (1 test) — sequential after candidate-journey
    {
      name: 'data-setup-perm-disable-voter-app',
      testMatch: /perm-disable-voter-app\.setup\.ts/,
      teardown: 'data-teardown-perm-disable-voter-app',
      dependencies: ['candidate-journey']
    },
    {
      name: 'data-teardown-perm-disable-voter-app',
      testMatch: /perm-disable-voter-app\.teardown\.ts/
    },
    {
      name: 'perm-disable-voter-app',
      testDir: './tests/specs/perm',
      testMatch: /perm-disable-voter-app\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disable-voter-app']
    },

    // Variant 2: perm-disable-candidate-app (1 test) — sequential after perm-disable-voter-app
    {
      name: 'data-setup-perm-disable-candidate-app',
      testMatch: /perm-disable-candidate-app\.setup\.ts/,
      teardown: 'data-teardown-perm-disable-candidate-app',
      dependencies: ['perm-disable-voter-app']
    },
    {
      name: 'data-teardown-perm-disable-candidate-app',
      testMatch: /perm-disable-candidate-app\.teardown\.ts/
    },
    {
      name: 'perm-disable-candidate-app',
      testDir: './tests/specs/perm',
      testMatch: /perm-disable-candidate-app\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disable-candidate-app']
    },

    // Variant 3: perm-per-app-notifications (2 tests) — sequential after perm-disable-candidate-app
    {
      name: 'data-setup-perm-per-app-notifications',
      testMatch: /perm-per-app-notifications\.setup\.ts/,
      teardown: 'data-teardown-perm-per-app-notifications',
      dependencies: ['perm-disable-candidate-app']
    },
    {
      name: 'data-teardown-perm-per-app-notifications',
      testMatch: /perm-per-app-notifications\.teardown\.ts/
    },
    {
      name: 'perm-per-app-notifications',
      testDir: './tests/specs/perm',
      testMatch: /perm-per-app-notifications\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-per-app-notifications']
    },

    // Phase 90 Plan 02: perm-missing-nominations (1 test) — TIR5:15-26
    // Sequential after perm-per-app-notifications per the HIGH-2 perm-*
    // sequential invariant (lines 653-660 — app_settings singleton clobbering
    // risk forces sequential chains within the perm family).
    {
      name: 'data-setup-perm-missing-nominations',
      testMatch: /perm-missing-nominations\.setup\.ts/,
      teardown: 'data-teardown-perm-missing-nominations',
      dependencies: ['perm-per-app-notifications']
    },
    {
      name: 'data-teardown-perm-missing-nominations',
      testMatch: /perm-missing-nominations\.teardown\.ts/
    },
    {
      name: 'perm-missing-nominations',
      testDir: './tests/specs/perm',
      testMatch: /perm-missing-nominations\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-missing-nominations']
    },

    // Phase 90 Plan 04: perm-localisation-positive (1 test) — TIR5:52-95.
    // Operates against the 3-locale staticSettings base (en/fi/sv) directly —
    // no runtime override. Sequential after perm-missing-nominations per the
    // HIGH-2 perm-* sequential invariant (lines 653-660 — app_settings
    // singleton clobbering risk forces sequential chains within the perm
    // family).
    {
      name: 'data-setup-perm-localisation-positive',
      testMatch: /perm-localisation-positive\.setup\.ts/,
      teardown: 'data-teardown-perm-localisation-positive',
      dependencies: ['perm-missing-nominations']
    },
    {
      name: 'data-teardown-perm-localisation-positive',
      testMatch: /perm-localisation-positive\.teardown\.ts/
    },
    {
      name: 'perm-localisation-positive',
      testDir: './tests/specs/perm',
      testMatch: /perm-localisation-positive\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-localisation-positive']
    },

    // ===================================================================
    // Phase 91 Plan 02 — 9 new TIR6 Group A settings-permutation chains
    // (D-91-PD-05). 27 new project entries (9 setup + 9 spec + 9 teardown)
    // anchored on perm-localisation-positive per the HIGH-2 invariant
    // (app_settings JSONB singleton clobbering — see RESEARCH §"Playwright
    // Project Chain" + lines 988-991). Sequential chain — no parallel
    // execution within the perm-* family.
    //
    // Chain order:
    //   perm-localisation-positive → perm-answers-locked → perm-hide-hero
    //     → perm-header-show-feedback → perm-header-show-help
    //     → perm-hide-all-nominations → perm-hide-if-missing-answers
    //     → perm-hide-election-tags → perm-hide-category-tags
    //     → perm-disable-allow-open (END)
    // ===================================================================

    // A1 — perm-answers-locked (TIR6:3-14). FULL 3-surface coverage per
    // 91-CONTEXT.md Group A item 1. A1 setup mints a per-perm storage
    // state via real forceRegister + UI login (D-91-PD-06 revised; Phase
    // 91-05 CR-01 closure) consumed by the authenticated sub-tests in
    // perm-answers-locked.spec.ts.
    {
      name: 'data-setup-perm-answers-locked',
      testMatch: /perm-answers-locked\.setup\.ts/,
      teardown: 'data-teardown-perm-answers-locked',
      dependencies: ['perm-localisation-positive']
    },
    {
      name: 'data-teardown-perm-answers-locked',
      testMatch: /perm-answers-locked\.teardown\.ts/
    },
    {
      name: 'perm-answers-locked',
      testDir: './tests/specs/perm',
      testMatch: /perm-answers-locked\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-answers-locked']
    },

    // A2 — perm-hide-hero (TIR6:24-32). Authenticated candidate via
    // real forceRegister + UI login (D-91-PD-06 revised; Phase 91-05
    // CR-01 closure).
    {
      name: 'data-setup-perm-hide-hero',
      testMatch: /perm-hide-hero\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-hero',
      dependencies: ['perm-answers-locked']
    },
    {
      name: 'data-teardown-perm-hide-hero',
      testMatch: /perm-hide-hero\.teardown\.ts/
    },
    {
      name: 'perm-hide-hero',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-hero\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-hero']
    },

    // A3 — perm-header-show-feedback (TIR6:68-77). Unauthenticated voter
    // intro + Banner header-feedback assertion + feedback-form open.
    {
      name: 'data-setup-perm-header-show-feedback',
      testMatch: /perm-header-show-feedback\.setup\.ts/,
      teardown: 'data-teardown-perm-header-show-feedback',
      dependencies: ['perm-hide-hero']
    },
    {
      name: 'data-teardown-perm-header-show-feedback',
      testMatch: /perm-header-show-feedback\.teardown\.ts/
    },
    {
      name: 'perm-header-show-feedback',
      testDir: './tests/specs/perm',
      testMatch: /perm-header-show-feedback\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-header-show-feedback']
    },

    // A4 — perm-header-show-help (TIR6:79-88). Unauthenticated voter
    // intro + Banner header-help button + /en/about URL assertion.
    {
      name: 'data-setup-perm-header-show-help',
      testMatch: /perm-header-show-help\.setup\.ts/,
      teardown: 'data-teardown-perm-header-show-help',
      dependencies: ['perm-header-show-feedback']
    },
    {
      name: 'data-teardown-perm-header-show-help',
      testMatch: /perm-header-show-help\.teardown\.ts/
    },
    {
      name: 'perm-header-show-help',
      testDir: './tests/specs/perm',
      testMatch: /perm-header-show-help\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-header-show-help']
    },

    // A5 — perm-hide-all-nominations (TIR6:90-93). Unauthenticated; spec
    // asserts on 307 redirect from /en/nominations to /en (Pitfall 5).
    {
      name: 'data-setup-perm-hide-all-nominations',
      testMatch: /perm-hide-all-nominations\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-all-nominations',
      dependencies: ['perm-header-show-help']
    },
    {
      name: 'data-teardown-perm-hide-all-nominations',
      testMatch: /perm-hide-all-nominations\.teardown\.ts/
    },
    {
      name: 'perm-hide-all-nominations',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-all-nominations\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-all-nominations']
    },

    // A6 — perm-hide-if-missing-answers (TIR6:95-102). Voter walk asserts
    // ONLY on candidate visibility per Pitfall 6 (no org count assertion).
    {
      name: 'data-setup-perm-hide-if-missing-answers',
      testMatch: /perm-hide-if-missing-answers\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-if-missing-answers',
      dependencies: ['perm-hide-all-nominations']
    },
    {
      name: 'data-teardown-perm-hide-if-missing-answers',
      testMatch: /perm-hide-if-missing-answers\.teardown\.ts/
    },
    {
      name: 'perm-hide-if-missing-answers',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-if-missing-answers\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-if-missing-answers']
    },

    // A7 — perm-hide-election-tags (TIR6:104-108). Voter walk → /questions
    // asserts absence of election-tag testid.
    {
      name: 'data-setup-perm-hide-election-tags',
      testMatch: /perm-hide-election-tags\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-election-tags',
      dependencies: ['perm-hide-if-missing-answers']
    },
    {
      name: 'data-teardown-perm-hide-election-tags',
      testMatch: /perm-hide-election-tags\.teardown\.ts/
    },
    {
      name: 'perm-hide-election-tags',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-election-tags\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-election-tags']
    },

    // A8 — perm-hide-category-tags (TIR6:111-115). Voter walk → /questions
    // asserts absence of category-tag testid.
    {
      name: 'data-setup-perm-hide-category-tags',
      testMatch: /perm-hide-category-tags\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-category-tags',
      dependencies: ['perm-hide-election-tags']
    },
    {
      name: 'data-teardown-perm-hide-category-tags',
      testMatch: /perm-hide-category-tags\.teardown\.ts/
    },
    {
      name: 'perm-hide-category-tags',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-category-tags\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-category-tags']
    },

    // A9 — perm-disable-allow-open (TIR6:121-142). Two describe blocks per
    // D-91-PD-04 + D-91-PD-06: candidate-side authenticated (via storage
    // state minted in setup) + voter-side unauthenticated /results walk.
    {
      name: 'data-setup-perm-disable-allow-open',
      testMatch: /perm-disable-allow-open\.setup\.ts/,
      teardown: 'data-teardown-perm-disable-allow-open',
      dependencies: ['perm-hide-category-tags']
    },
    {
      name: 'data-teardown-perm-disable-allow-open',
      testMatch: /perm-disable-allow-open\.teardown\.ts/
    },
    {
      name: 'perm-disable-allow-open',
      testDir: './tests/specs/perm',
      testMatch: /perm-disable-allow-open\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disable-allow-open']
    }
  ]
});
