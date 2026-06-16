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
 * The suite is:
 *
 *   - journey chains: data-setup-base -> voter-journey
 *     + data-setup-base -> data-setup-candidate-journey -> candidate-journey
 *   - perm-* family: a single sequential chain that runs strictly AFTER the
 *     journey leaves — its first setup (data-setup-perm-1e1cg1co) depends on
 *     [voter-journey, candidate-journey], and every later perm setup chains
 *     off the previous perm spec. Each perm setup clobbers the app_settings
 *     JSONB singleton, so the family runs serially AND must not interleave
 *     with the base/journey chains on the shared single DB. The perm→journey
 *     dependency direction keeps opt-in --project runs pulling only base,
 *     never the perm family.
 *   - specialized projects that run BY DEFAULT and are opt-OUT via env:
 *     performance (disable with PLAYWRIGHT_NO_PERF) and a11y-smoke (disable with
 *     PLAYWRIGHT_NO_A11Y). Each depends on `data-setup-base` (e2e/base dataset).
 *   - OPT-IN projects (excluded from the default run, each with a hard blocker):
 *       · visual-regression (PLAYWRIGHT_VISUAL) — `auth-setup` cannot
 *         authenticate against the base dataset yet (see KNOWN GAP below).
 *       · bank-auth (PLAYWRIGHT_BANK_AUTH) — the spec throws at module load
 *         without SUPABASE_SERVICE_ROLE_KEY/ANON_KEY and needs the
 *         identity-callback Edge Function served.
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
   * Under --workers=1 full-suite contention the answer-loop + post-loop waitForURL can
   * exceed lower budgets, so the per-test wrapper timeout is the binding constraint.
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
    // === Shared base auth setup (visual opt-in only) ===
    //
    // The specialized projects below depend on `data-setup-base` for their seed.
    // performance / a11y-smoke / bank-auth run by default (opt-OUT via
    // PLAYWRIGHT_NO_*); visual-regression is opt-IN (PLAYWRIGHT_VISUAL).
    // `auth-setup` (candidate storageState) also depends on `data-setup-base`
    // but is declared ONLY when PLAYWRIGHT_VISUAL is set, so the default
    // `yarn test:e2e` (journeys + perm-* family + perf/a11y/bank-auth) never
    // runs the candidate-login storageState step.
    //
    // KNOWN GAP (this is WHY visual stays opt-in): the base dataset (`e2e/base`)
    // does not seed a `test-candidate-alpha` row and base candidates carry no
    // email column, so `auth-setup`'s UI-login step has no registered base
    // candidate to authenticate as. The dependency keeps the graph resolving;
    // rewiring the auth chain against base must establish a registered
    // base-candidate + email (forceRegister) contract before visual-regression
    // can be promoted to default-on.
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

    // === Specialized Projects ===
    // performance / a11y-smoke run BY DEFAULT in `yarn test:e2e`.
    // Opt OUT of either with the matching PLAYWRIGHT_NO_* env, e.g.:
    //   PLAYWRIGHT_NO_PERF=1 yarn test:e2e
    //   PLAYWRIGHT_NO_A11Y=1 yarn test:e2e
    // visual-regression and bank-auth stay OPT-IN (each has a hard blocker — see above):
    //   PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --project=visual-regression
    //   PLAYWRIGHT_BANK_AUTH=1 npx playwright test -c tests/playwright.config.ts --project=bank-auth

    // Visual regression: screenshot comparison for key pages (OPT-IN — blocked
    // on auth-setup vs base-dataset gap above).
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

    // Performance budgets: page load timing assertions (default-on; disable with PLAYWRIGHT_NO_PERF).
    ...(process.env.PLAYWRIGHT_NO_PERF
      ? []
      : [
          {
            name: 'performance',
            testDir: './tests/specs/perf',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['data-setup-base']
          }
        ]),

    // Accessibility smoke: WCAG 2.1 AA scan via @axe-core/playwright (default-on; disable with PLAYWRIGHT_NO_A11Y).
    ...(process.env.PLAYWRIGHT_NO_A11Y
      ? []
      : [
          {
            name: 'a11y-smoke',
            testDir: './tests/specs/a11y',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['data-setup-base']
          }
        ]),

    // Bank auth (Idura/Signicat): identity-callback Edge Function integration.
    // OPT-IN (PLAYWRIGHT_BANK_AUTH) — NOT default-on: the spec throws at module
    // load without SUPABASE_SERVICE_ROLE_KEY/ANON_KEY, and 3 of its tests have no
    // precondition skip and require the identity-callback Edge Function to be
    // served (`supabase functions serve --no-verify-jwt`). Promoting it to
    // default-on needs an infra-probe gate on all tests + non-throwing key
    // handling first.
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

    // === base / voter-journey chain ===
    //
    // Project graph (independent — no cross-chain dependency):
    //   data-setup-base → voter-journey
    //   data-setup-base ↦ data-teardown-base (via teardown: key)
    //
    // The base chain seeds standalone (no perm dependency). The base setup
    // retains a defensive `extraTeardownPrefix: 'e2e-perm-'` pre-clear
    // (shared/base.setup.ts) — an idempotent wipe of the SEPARATE `e2e-perm-`
    // namespace, never the base `test-` rows — so a perm chain that ran earlier
    // in the same DB session cannot leak rows into the base dataset.
    {
      name: 'data-setup-base',
      testMatch: /base\.setup\.ts/,
      teardown: 'data-teardown-base'
      // reason: base seeds with NO perm dependency so opt-in `--project` runs
      // (visual/perf/a11y/bank-auth) pull only base + auth and work standalone.
      // Cross-namespace isolation for the DEFAULT full-suite run is enforced in
      // the OPPOSITE direction: the perm family depends on the journey leaves
      // (see `data-setup-perm-1e1cg1co` below), so perm runs strictly AFTER base
      // + journeys and never interleaves with base on the shared single DB /
      // `app_settings` singleton. The base setup's `extraTeardownPrefix:
      // 'e2e-perm-'` pre-clear is a belt-and-braces guard for any residual perm
      // rows from a prior DB session.
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

    // cold-entry-dataroot (Phase 117 COLD-03) — LEAF. Read-only cold/direct-URL
    // entry regression for the dataRoot #version-bridge alias-indirection
    // staleness (Spike 024). Reads the base dataset read-only (no teardown of its
    // own). `testMatch` is scoped to the cold-entry spec; `voter-journey`'s
    // `testMatch` (/voter-journey\.spec\.ts/) excludes this file, so neither
    // project picks up the other's specs.
    {
      name: 'cold-entry-dataroot',
      testDir: './tests/specs/voter',
      testMatch: /cold-entry-dataroot\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-base']
    },

    // === _probes (fixtures-first isolation probes) — LEAF, no data-setup ===
    //
    // The 4 deferred perm-seeded probes (video→EPERM-06, questionInfo→EPERM-07,
    // popupNotice→EPERM-09, orgMatching→EPERM-10) live under
    // ./tests/specs/_probes. They are DELIBERATELY OUTSIDE the perm serial-DAG
    // chain: each clobbers the shared `app_settings` JSONB singleton, so they
    // MUST run ONE-AT-A-TIME in true isolation, seeded OUT-OF-BAND per the probe
    // header (`yarn db:seed --template <perm>`) and invoked as a single-file run
    // (`npx playwright test <probe> --project=_probes`). There is intentionally
    // NO data-setup dependency — folding the perm seeds into the shared serial
    // chain would clobber app_settings between probes. The isolation contract
    // lives in the RUN discipline, not in a setup project.
    //
    // Because they need out-of-band per-probe seeding, these probes are EXCLUDED
    // from the default green-suite / CI gate: the root `test:e2e` script runs
    // `--grep-invert @probe`. Run them via `yarn test:e2e:probes <probe-file>`
    // (one at a time, after `yarn db:seed --template <perm>`). Every probe test
    // is tagged `@probe` for this filter.
    //
    // `testMatch` is scoped to the 4 DEFERRED probe files only. The 4
    // already-green probes (entityFilters/navMenu/theme/trackingIntercept) share
    // the `*.probe.spec.ts` glob but are excluded here so a project run never
    // serially clobbers the singleton across all 8.
    {
      name: '_probes',
      testDir: './tests/specs/_probes',
      testMatch: /(video|questionInfo|popupNotice|orgMatching)\.probe\.spec\.ts$/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] }
    },

    // === voter permutations chains ===
    //
    //   - perm specs live under tests/tests/specs/perm/; the voter-app project's
    //     testDir is `./tests/specs/voter`, so perm specs are categorically
    //     outside its discovery surface.
    //   - perm-* setups chain SEQUENTIALLY within the perm-* family to prevent
    //     app_settings singleton clobbering. The FIRST perm setup
    //     (data-setup-perm-1e1cg1co) depends on the journey LEAF specs
    //     [voter-journey, candidate-journey] so the whole perm family runs
    //     strictly AFTER base + both journeys complete. This is the perm→journey
    //     direction, so opt-in `--project` runs never pull the perm family.
    //   - Each chain teardowns ITS OWN test-perm-<short>- prefix.
    //
    // Sequential chain across the family:
    //   data-setup-perm-1e1cg1co (FIRST — after journey leaves)
    //   → data-setup-perm-2e-shared
    //   → data-setup-perm-2e-asymmetric
    //   → data-setup-perm-startfromcg
    //   → data-setup-perm-disjoint-1co
    //   → data-setup-perm-disable-election-1co
    //   → data-setup-perm-disable-election-2co
    //   → data-setup-perm-not-located-2e2cg

    // Variant 1: perm-1e1cg1co (1 test) — FIRST in the perm family, serialized
    // AFTER the journey leaves (voter-journey + candidate-journey).
    //
    // Depends on the journey LEAF specs so the entire perm family runs strictly
    // AFTER base + both journeys have completed. base + perm share the
    // `app_settings` JSONB singleton AND have mutually-destructive preclears
    // (this setup's `extraTeardownPrefix: 'test-'` deletes base `test-e2e-base-%`
    // rows; base setup's `e2e-perm-` preclear deletes perm rows), so without this
    // serialization edge they would interleave and leak elections across
    // datasets. The perm→journey direction (NOT base→perm) keeps opt-in
    // `--project` runs (visual/perf/a11y/bank-auth) pulling only `data-setup-base`
    // (+ auth-setup), never the perm family — base still seeds standalone.
    {
      name: 'data-setup-perm-1e1cg1co',
      testMatch: /perm-1e1cg1co\.setup\.ts/,
      teardown: 'data-teardown-perm-1e1cg1co',
      dependencies: ['voter-journey', 'candidate-journey']
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

    // === candidate-journey chain ===
    //
    // candidate-journey setup does not re-seed (see
    // tests/tests/setup/candidate/candidate-journey.setup.ts): it consumes the
    // base data already seeded by `data-setup-base` and runs as a PARALLEL LEAF
    // alongside voter-journey, so neither cascade-skips the other on spec
    // failure. Their teardowns are independent: base.teardown owns the 'test-'
    // row prefix; candidate-journey.teardown owns only the auth.users row
    // created by the spec's registration step.
    //
    // The setup still guarantees a clean auth.users row for
    // UNREGISTERED_CANDIDATE_EMAIL via idempotent `unregisterCandidate`,
    // so the registration-via-email step lands deterministically.
    //
    // Spec project sets `storageState: { cookies: [], origins: [] }` to
    // start UNAUTHENTICATED — required for the registration-via-email flow.
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

    // === 3 settings-permutation chains ===
    //
    // Chained sequentially among themselves (perm-disable-voter-app →
    // perm-disable-candidate-app → perm-per-app-notifications) per the perm-*
    // family precedent.
    //
    // Parallel-safety: each perm template uses a distinct externalIdPrefix
    // ('e2e-perm-novapp-', 'e2e-perm-nocand-', 'e2e-perm-notif-'), and each setup
    // passes `extraTeardownPrefix: ['test-', 'e2e-perm-']` to pre-clear any
    // residual rows from prior chains still mid-teardown.

    // Variant 1: perm-disable-voter-app (1 test) — anchored on
    // perm-not-located-2e2cg so the whole perm family is one linear sequence
    // running strictly after the journeys. Single linear ordering eliminates all
    // cross-chain coexistence on the shared single DB + app_settings singleton.
    {
      name: 'data-setup-perm-disable-voter-app',
      testMatch: /perm-disable-voter-app\.setup\.ts/,
      teardown: 'data-teardown-perm-disable-voter-app',
      dependencies: ['perm-not-located-2e2cg']
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

    // perm-per-app-notifications (2 tests) — sequential after perm-disable-candidate-app.
    //
    // The chain (and the perm family's anchor on the journey leaves) is
    // load-bearing for the FULL `yarn test:e2e` run: every perm setup overwrites
    // the single global `app_settings` row (setupFromTemplate → Writer Pass-5), so
    // a perm setup must never run while a journey or another perm spec is reading
    // it. That ordering is what makes `--project=perm-per-app-notifications` pull in
    // voter-journey + the whole perm chain.
    //
    // To verify just these 2 tests in isolation (skips the journeys + perm chain),
    // run the REAL setup project then the spec, both with --no-deps:
    //   yarn test:e2e --project=data-setup-perm-per-app-notifications --no-deps
    //   yarn test:e2e --project=perm-per-app-notifications --no-deps
    // (--no-deps reproduces the exact full-suite setup state without the chain; run
    // `yarn db:reset` afterwards to drop the standalone seed.)
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

    // perm-missing-nominations (1 test) — sequential after
    // perm-per-app-notifications. app_settings singleton clobbering risk forces
    // sequential chains within the perm family.
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

    // perm-localisation-positive (1 test). Operates against the 3-locale
    // staticSettings base (en/fi/sv) directly — no runtime override. Sequential
    // after perm-missing-nominations; app_settings singleton clobbering risk
    // forces sequential chains within the perm family.
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
    // 9 settings-permutation chains anchored on perm-localisation-positive.
    // app_settings JSONB singleton clobbering forces a sequential chain — no
    // parallel execution within the perm-* family.
    //
    // Chain order:
    //   perm-localisation-positive → perm-answers-locked → perm-hide-hero
    //     → perm-header-show-feedback → perm-header-show-help
    //     → perm-hide-all-nominations → perm-hide-if-missing-answers
    //     → perm-hide-election-tags → perm-hide-category-tags
    //     → perm-disable-allow-open (END)
    // ===================================================================

    // A1 — perm-answers-locked. Full 3-surface coverage. Setup mints a per-perm
    // storage state via real forceRegister + UI login, consumed by the
    // authenticated sub-tests in perm-answers-locked.spec.ts.
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

    // A2 — perm-hide-hero. Authenticated candidate via real forceRegister + UI login.
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

    // A3 — perm-header-show-feedback. Unauthenticated voter intro + Banner
    // header-feedback assertion + feedback-form open.
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

    // A4 — perm-header-show-help. Unauthenticated voter intro + Banner
    // header-help button + /en/about URL assertion.
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

    // A5 — perm-hide-all-nominations. Unauthenticated; spec asserts on the 307
    // redirect from /en/nominations to /en.
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

    // A6 — perm-hide-if-missing-answers. Voter walk asserts ONLY on candidate
    // visibility (no org count assertion).
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

    // A7 — perm-hide-election-tags. Voter walk → /questions asserts absence of
    // the election-tag testid.
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

    // A8 — perm-hide-category-tags. Voter walk → /questions asserts absence of
    // the category-tag testid.
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

    // A9 — perm-disable-allow-open. Two describe blocks: candidate-side
    // authenticated (via storage state minted in setup) + voter-side
    // unauthenticated /results walk.
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
    },

    // A10 — perm-question-video (EPERM-06). Voter visibility matrix (video on
    // q1/q3/q5 only, none on q2/q4 or any category intro) + candidate hideVideo
    // slice (authenticated via a storage state minted in setup). Appended to the
    // perm tail after perm-disable-allow-open.
    {
      name: 'data-setup-perm-question-video',
      testMatch: /perm-question-video\.setup\.ts/,
      teardown: 'data-teardown-perm-question-video',
      dependencies: ['perm-disable-allow-open']
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

    // A11 — perm-interactive-info (EPERM-07). Voter questions-flow info matrix:
    // popup-modal mode (interactiveInfo.enabled=true, shipped default) vs the
    // static-expander mode (per-question re-seed), plus customData.infoSections
    // and per-type arguments (Likert/Boolean/Categorical). Unauthenticated voter
    // slice → no storage state. Appended to the perm tail after
    // perm-question-video.
    {
      name: 'data-setup-perm-interactive-info',
      testMatch: /perm-interactive-info\.setup\.ts/,
      teardown: 'data-teardown-perm-interactive-info',
      dependencies: ['perm-question-video']
    },
    {
      name: 'data-teardown-perm-interactive-info',
      testMatch: /perm-interactive-info\.teardown\.ts/
    },
    {
      name: 'perm-interactive-info',
      testDir: './tests/specs/perm',
      testMatch: /perm-interactive-info\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-interactive-info']
    },

    // A12 — perm-org-matching (EPERM-10). Voter results-flow organization-match
    // matrix: matching.organizationMatching none / answersOnly / impute, re-seeded
    // per mode. PRIMARY: exact per-mode org match scores (none → no score;
    // answersOnly → org's own answers only, blanks penalised polar-opposite;
    // impute → member-imputed, differs from answersOnly). SECONDARY: About-page
    // org-matching disclosure per mode. Unauthenticated voter slice → no storage
    // state (the results path answers in-test). Appended to the perm tail after
    // perm-interactive-info.
    {
      name: 'data-setup-perm-org-matching',
      testMatch: /perm-org-matching\.setup\.ts/,
      teardown: 'data-teardown-perm-org-matching',
      dependencies: ['perm-interactive-info']
    },
    {
      name: 'data-teardown-perm-org-matching',
      testMatch: /perm-org-matching\.teardown\.ts/
    },
    {
      name: 'perm-org-matching',
      testDir: './tests/specs/perm',
      testMatch: /perm-org-matching\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-org-matching']
    }
  ]
});
