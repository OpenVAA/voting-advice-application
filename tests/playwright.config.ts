import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { TIMEOUTS } from './tests/helpers/timeouts';
import { TESTS_DIR } from './tests/utils/testsDir';

dotenv.config();

export const STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/user.json');

/**
 * The `_probes` project's `testMatch` (see the project definition below).
 * Hoisted so the orphan check can compare the directory against it.
 */
const PROBE_TEST_MATCH = /(video|questionInfo|popupNotice|orgMatching|numberScale)\.probe\.spec\.ts$/;

/**
 * ORPHAN-PROBE GUARD (Phase 136 plan 03, fake-guard sweep finding F4).
 *
 * `_probes` is the one project whose `testMatch` enumerates its files by name
 * rather than globbing the directory — deliberately, because each probe must be
 * invocable one-at-a-time. The cost of enumeration is that ADDING a probe file
 * without adding it to the pattern silently produces a test that matches no
 * project and runs from no command, while still sitting in `specs/` looking like
 * coverage. That is precisely what happened to four probe files between Phase 119
 * and Phase 136: 6 tests, unreachable for ~16 phases, noticed only by an audit.
 *
 * A comment asking future authors to keep the list in sync would be the same
 * kind of non-guard this phase exists to remove, so the invariant is CHECKED.
 * Throwing here fails every `playwright test` / `--list` invocation immediately
 * and by name, which is the earliest point at which the mistake is visible.
 */
const probesDir = path.join(TESTS_DIR, 'specs/_probes');
if (fs.existsSync(probesDir)) {
  const orphans = fs
    .readdirSync(probesDir)
    .filter((f) => f.endsWith('.probe.spec.ts'))
    .filter((f) => !PROBE_TEST_MATCH.test(f));
  if (orphans.length > 0) {
    throw new Error(
      `Orphaned probe spec(s) in tests/specs/_probes — they match NO Playwright project and run ` +
        `from NO command: ${orphans.join(', ')}. Add each to the \`_probes\` project's testMatch ` +
        `(PROBE_TEST_MATCH in this file), or delete the file. Leaving it in place implies coverage ` +
        `that does not exist (fake-guard sweep 2026-08-11, finding F4).`
    );
  }
}

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
 *   - OPT-IN projects (excluded from the default run):
 *       · visual-regression (PLAYWRIGHT_VISUAL) — opt-in because its PNG
 *         baselines are Linux/x86_64 captures that only reproduce on the CI
 *         runner image, not because it is broken: it is a BLOCKING job in
 *         .github/workflows/main.yaml (Phase 136 plan 05).
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

  /* SERVED-APPLICATION GATE (Phase 137, INTEG-04/INTEG-05).
   * Asserts that whatever is listening on `use.baseURL` below is THIS checkout's
   * Vite dev server — proven by the served application's own response, not by the
   * listener process — and aborts the run with exit 1 before any spec body if it
   * is not. There is no bypass: `FRONTEND_PORT` moves the target, it does not
   * skip the check.
   * The path resolves relative to THIS config file's directory; that is not the
   * `webServer.command` cwd gotcha documented further down, which concerns the
   * spawn cwd instead.
   * `--list` deliberately does not run it, so the "no dropped specs" check stays
   * usable without a dev server (tests/README.md); the orphan-probe guard above
   * runs at config-load time and covers that path. */
  globalSetup: './global-setup.ts',

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
    // The registered-base-candidate contract (Phase 136 plan 05): the candidates
    // table carries no email column, so the seed cannot ship a *registered*
    // candidate. `auth-setup` therefore force-registers base CA-AA-1 itself via
    // SupabaseAdminClient before its UI login — the same mechanism every perm-*
    // setup uses. See tests/tests/utils/testCredentials.ts.
    //
    // visual-regression stays opt-in for a snapshot-portability reason, NOT a
    // blocker: its PNG baselines are Linux/x86_64 captures and only reproduce on
    // the CI runner image (re-baseline procedure in the visual spec's docblock).
    // The CI job that runs it is blocking.
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
    // visual-regression and bank-auth stay OPT-IN (see the notes above):
    //   PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --project=visual-regression
    //   PLAYWRIGHT_BANK_AUTH=1 npx playwright test -c tests/playwright.config.ts --project=bank-auth

    // Visual regression: screenshot comparison for key pages (OPT-IN — see the
    // snapshot-portability note above; the CI job itself is blocking).
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

    // Bank-auth full-browser journey (EFLOW-10b) — the Option-B mock-OIDC-issuer
    // round-trip: /candidate/preregister → mock IdP 302 → server exchange+decrypt
    // → authenticated → election/constituency → email+ToU → preregister() →
    // registration-key → set password → logged-in.
    //
    // OPT-IN (PLAYWRIGHT_BANK_AUTH) and STANDS ALONE — it pulls ONLY its own
    // data-setup, NOT the perm serial chain (RESEARCH A4/Pitfall 3; mirrors the
    // sibling `bank-auth` project's standalone wiring). The setup/teardown FILES
    // these entries point at land in 122-04; the journey SPEC matched by the
    // `bank-auth-journey` project lands in 122-05. Until then this block is
    // gated-off in the default run and dormant in the opt-in run.
    //
    // The mock OIDC issuer is spawned via the `webServer` entry below (also
    // PLAYWRIGHT_BANK_AUTH-gated). It binds 127.0.0.1-only and serves over HTTPS
    // with a committed self-signed localhost cert — never reachable in the default
    // suite (threat T-122-08).
    ...(process.env.PLAYWRIGHT_BANK_AUTH
      ? [
          {
            name: 'data-setup-bank-auth-journey',
            testMatch: /bank-auth-journey\.setup\.ts/,
            teardown: 'data-teardown-bank-auth-journey'
          },
          {
            name: 'data-teardown-bank-auth-journey',
            testMatch: /bank-auth-journey\.teardown\.ts/
          },
          {
            name: 'bank-auth-journey',
            testDir: './tests/specs/candidate',
            testMatch: /candidate-bank-auth-journey\.spec\.ts/,
            // `ignoreHTTPSErrors: true` is REQUIRED on the BROWSER context: the
            // journey's OIDC authorize leg navigates the browser to the mock
            // issuer at `https://127.0.0.1:9443/oauth2/authorize`, served with a
            // committed self-signed localhost cert. Without this, Chrome rejects
            // the cert and the navigation fails silently — the issuer's 302 back
            // to `/api/oidc/callback` never reaches the browser, so the
            // authenticated `preregister-continue` state never renders. (The
            // matching `ignoreHTTPSErrors` on the `webServer` readiness probe
            // below only covers Playwright's own JWKS health check, not the
            // browser context.) TEST-ONLY, opt-in `PLAYWRIGHT_BANK_AUTH` run.
            use: {
              ...devices['Desktop Chrome'],
              storageState: { cookies: [], origins: [] },
              ignoreHTTPSErrors: true
            },
            dependencies: ['data-setup-bank-auth-journey']
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

    // voter-dark-mode (Phase 121 EFLOW-07) — LEAF. Read-only dark-scheme
    // regression on the base dataset. Theme is driven via emulateMedia
    // (prefers-color-scheme) — there is NO toggle and NO localStorage write
    // (darkMode.svelte.ts derives from matchMedia only). `testMatch` is scoped to
    // the dark-mode spec; sibling voter-* projects' exact testMatch excludes it.
    {
      name: 'voter-dark-mode',
      testDir: './tests/specs/voter',
      testMatch: /voter-dark-mode\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-base']
    },

    // voter-journey-mobile (Phase 121 EFLOW-11) — LEAF. The viewport-agnostic
    // 'max' voter walk under a mobile descriptor. The descriptor lives here at
    // project scope (explicit 390×844 isMobile/hasTouch, matching
    // visual-regression — NOT devices['Pixel 5']); the walk itself is unchanged.
    // Read-only on the base dataset.
    {
      name: 'voter-journey-mobile',
      testDir: './tests/specs/voter',
      testMatch: /voter-journey-mobile\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true
      },
      fullyParallel: false,
      dependencies: ['data-setup-base']
    },

    // voter-alliance (Phase 130 EFLOW-02 + EPERM-03/04 riders) — LEAF. Read-only
    // alliance results-surface DEPTH on the base dataset (Alliance A card,
    // clickable member-org subcards, member-orgs drawer, ['info','children'] tab
    // control). Consumes the shared 'max' voter walk (answeredVoterPage) under a
    // Desktop descriptor; D-04 assert-only (no own setup/teardown — Alliance A +
    // members already in e2e/base). `testMatch` is scoped to this spec; sibling
    // voter-* projects' exact testMatch excludes it.
    {
      name: 'voter-alliance',
      testDir: './tests/specs/voter',
      testMatch: /voter-alliance\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-base']
    },

    // voter-nominations (Phase 130 UNBLK-04 rider) — LEAF. Read-only render
    // check for the UNSCOPED all-nominations route (D-01 dedicated spec, NOT a
    // journey step). D-04 assert-only (showAllNominations already true in
    // e2e/base — no own setup/teardown). `testMatch` is scoped to this spec;
    // sibling voter-* projects' exact testMatch excludes it.
    {
      name: 'voter-nominations',
      testDir: './tests/specs/voter',
      testMatch: /voter-nominations\.spec\.ts/,
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
    // `testMatch` lists the probe files EXPLICITLY, and every `*.probe.spec.ts`
    // in this directory must appear in it. That is the invariant: a probe file
    // not named here matches NO project and is reachable from NO command.
    //
    // It was violated between Phase 119 and Phase 136. Four base/read-only
    // probes (entityFilters/navMenu/theme/trackingIntercept), added in 119-08 as
    // fixture-development scaffolding, were left out of this pattern — so their
    // 6 tests ran from nowhere, including from `yarn test:e2e:probes`, while
    // still sitting in `specs/` implying coverage (fake-guard sweep 2026-08-11,
    // finding F4). They were DELETED in Phase 136 plan 03 rather than wired up,
    // because every fixture method they smoke-tested is now exercised by a spec
    // that runs in the blocking default suite, in each case at least as
    // strongly: selectAll/selectNone by voter-journey.spec.ts (exact 13/0/13
    // counts plus the toggle-absent negative case), openMobileNav/items/
    // expectNavMenuItems by candidate-journey.spec.ts (exact ordered 10-item
    // list, logged-out and logged-in) and voter-journey-mobile.spec.ts,
    // setColorScheme/expectTheme by voter-dark-mode.spec.ts (the probe's steps
    // verbatim plus an extra reload), and getTrackCalls by
    // voter-prefs-tracking.spec.ts (emit driven through the REAL in-app consent
    // path, which the probe documented itself as unable to arm).
    {
      name: '_probes',
      testDir: './tests/specs/_probes',
      testMatch: PROBE_TEST_MATCH,
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

    // === settings-permutation chains ===
    //
    // Chained sequentially among themselves (perm-access-disable →
    // perm-per-app-notifications) per the perm-* family precedent. The former
    // per-app maintenance pair (voter-app + candidate-app disable) was
    // CONSOLIDATED (EPERM-11) into the single perm-access-disable node, which
    // re-seeds the app_settings singleton per access mode in-spec.
    //
    // Parallel-safety: each perm template uses a distinct externalIdPrefix
    // ('e2e-perm-access-disable-', 'e2e-perm-notif-'), and each setup passes
    // `extraTeardownPrefix: ['test-', 'e2e-perm-']` to pre-clear any residual
    // rows from prior chains still mid-teardown.

    // perm-access-disable (3 tests: voterApp / candidateApp / underMaintenance) —
    // anchored on perm-not-located-2e2cg so the whole perm family is one linear
    // sequence running strictly after the journeys. Single linear ordering
    // eliminates all cross-chain coexistence on the shared single DB +
    // app_settings singleton. (Takes the chain position the former
    // voter-app-disable node occupied.)
    {
      name: 'data-setup-perm-access-disable',
      testMatch: /perm-access-disable\.setup\.ts/,
      teardown: 'data-teardown-perm-access-disable',
      dependencies: ['perm-not-located-2e2cg']
    },
    {
      name: 'data-teardown-perm-access-disable',
      testMatch: /perm-access-disable\.teardown\.ts/
    },
    {
      name: 'perm-access-disable',
      testDir: './tests/specs/perm',
      testMatch: /perm-access-disable\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-access-disable']
    },

    // perm-per-app-notifications (2 tests) — sequential after perm-access-disable.
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
      dependencies: ['perm-access-disable']
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
    //     → perm-show-feedback-survey → perm-header-show-help
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

    // A3 — perm-show-feedback-survey (EPERM-09). Unauthenticated voter intro +
    // Banner header-feedback assertion + feedback-form open, EXTENDED with the
    // results-view feedback/survey popup-coordination assertions (placement,
    // timing/once, no-double-pop, dismiss-persistence) + the survey.showIn[]
    // per-surface audit. Renamed in place from the former header-show-feedback
    // node (Phase 120-07) — KEEPS its position after perm-hide-hero.
    {
      name: 'data-setup-perm-show-feedback-survey',
      testMatch: /perm-show-feedback-survey\.setup\.ts/,
      teardown: 'data-teardown-perm-show-feedback-survey',
      dependencies: ['perm-hide-hero']
    },
    {
      name: 'data-teardown-perm-show-feedback-survey',
      testMatch: /perm-show-feedback-survey\.teardown\.ts/
    },
    {
      name: 'perm-show-feedback-survey',
      testDir: './tests/specs/perm',
      testMatch: /perm-show-feedback-survey\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-show-feedback-survey']
    },

    // A4 — perm-header-show-help. Unauthenticated voter intro + Banner
    // header-help button + /en/about URL assertion.
    {
      name: 'data-setup-perm-header-show-help',
      testMatch: /perm-header-show-help\.setup\.ts/,
      teardown: 'data-teardown-perm-header-show-help',
      dependencies: ['perm-show-feedback-survey']
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
    },

    // D-01 — perm-analytics-tracking (EFLOW-08). Voter analytics-tracking emission
    // matrix: the analytics overlay (analytics.platform.name='umami',
    // trackEvents=true) is a singleton-clobbering app_settings node, so the
    // tracking-payload spec (voter-prefs-tracking) is hosted HERE under its own
    // armed singleton rather than as a base leaf. Setup depends on the previous
    // perm SPEC (perm-org-matching, the verified tail) to preserve the strict
    // serial chain over the shared app_settings singleton. Unauthenticated voter
    // slice → no minted storage state. Appended to the perm tail after
    // perm-org-matching.
    {
      name: 'data-setup-perm-analytics-tracking',
      testMatch: /perm-analytics-tracking\.setup\.ts/,
      teardown: 'data-teardown-perm-analytics-tracking',
      dependencies: ['perm-org-matching']
    },
    {
      name: 'data-teardown-perm-analytics-tracking',
      testMatch: /perm-analytics-tracking\.teardown\.ts/
    },
    {
      name: 'voter-prefs-tracking',
      testDir: './tests/specs/voter',
      testMatch: /voter-prefs-tracking\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-analytics-tracking']
    }
  ],

  // Mock OIDC issuer for the bank-auth-journey (EFLOW-10b). PLAYWRIGHT_BANK_AUTH-
  // gated so it NEVER spawns in the default suite. Playwright manages its lifecycle
  // (start → wait-for-port → teardown). The readiness probe hits the issuer's HTTPS
  // JWKS endpoint; `ignoreHTTPSErrors: true` is required because the issuer's cert is
  // self-signed (CN=127.0.0.1). The issuer is self-contained (needs no app env), so
  // spawning it from the Playwright worker is clean — the SvelteKit frontend server's
  // IdP-pointing env is a SEPARATE operator responsibility (Pitfall 1; documented in
  // IDURA-TEST-RUNBOOK.md, EFLOW-10b). `reuseExistingServer` outside CI lets a hand-
  // started issuer be reused during local iteration.
  ...(process.env.PLAYWRIGHT_BANK_AUTH
    ? {
        webServer: {
          // Absolute path derived from TESTS_DIR (the `tests/tests` dir). The
          // Playwright `webServer.command` is resolved relative to the config
          // file's directory (`tests/`), so a bare `tests/tests/support/...`
          // relative path doubled into `tests/tests/tests/...` and failed to
          // resolve (ERR_MODULE_NOT_FOUND). Using the absolute entry path makes
          // the spawn cwd-independent.
          command: `npx tsx ${path.join(TESTS_DIR, 'support/mockOidcIssuerEntry.ts')}`,
          url: 'https://127.0.0.1:9443/.well-known/openid-configuration/jwks',
          ignoreHTTPSErrors: true,
          reuseExistingServer: !process.env.CI,
          timeout: 30_000
        }
      }
    : {})
});
