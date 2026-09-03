import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { TIMEOUTS } from './tests/helpers/timeouts';
import { ADMIN_STORAGE_STATE } from './tests/utils/adminCredentials';
import { TESTS_DIR } from './tests/utils/testsDir';

dotenv.config();

export const STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/user.json');

/**
 * The ADMIN stored session, distinct from the candidate `STORAGE_STATE` above.
 *
 * Re-exported rather than re-spelled: it is declared once in `tests/utils/adminCredentials.ts`, which is also what `admin-auth.setup.ts` writes through, so the project that reads the file and the setup that writes it cannot drift onto two paths. `STORAGE_STATE` above is spelled twice (here and in `setup/shared/auth.setup.ts`) — that is the shape not repeated here.
 */
export { ADMIN_STORAGE_STATE };

/**
 * The `_probes` project's `testMatch` (see the project definition below).
 * Hoisted so the orphan check can compare the directory against it.
 */
const PROBE_TEST_MATCH = /(defaultTemplateResults)\.probe\.spec\.ts$/;

/**
 * ORPHAN-PROBE GUARD (fake-guard sweep finding F4).
 *
 * `_probes` is the one project whose `testMatch` enumerates its files by name rather than globbing the directory — deliberately, because each probe must be invocable one-at-a-time. The cost of enumeration is that ADDING a probe file without adding it to the pattern silently produces a test that matches no project and runs from no command, while still sitting in `specs/` looking like coverage. That is precisely what happened to four probe files added as scaffolding at different times: 6 tests, unreachable for a long stretch of this suite's history, noticed only by an audit.
 *
 * A comment asking future authors to keep the list in sync would be the same kind of non-guard this check exists to replace, so the invariant is CHECKED.
 * Throwing here fails every `playwright test` / `--list` invocation immediately and by name, which is the earliest point at which the mistake is visible.
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
 * Declared soft-assertion budget per spec file, keyed by path relative to `TESTS_DIR`.
 * Hoisted so the budget guard below — and every reader — has ONE place to look for the number, which is why the spec's own header names this symbol instead of restating it.
 *
 * Scoped deliberately to a single file: its scope is `voter-journey.spec.ts`.
 * The three sibling `Rigidity contract` drift files found alongside it are a recorded follow-up, not a licence to widen this table quietly.
 */
const SOFT_ASSERTION_BUDGETS: Record<string, number> = {
  'specs/voter/voter-journey.spec.ts': 136
};

/**
 * SOFT-ASSERTION BUDGET GUARD (fake-guard sweep finding F10).
 *
 * Soft assertions are budgeted because they do not fail fast. In a long serial walk a growing population silently degrades failure legibility: one genuinely broken card reports alongside — and is buried by — a hundred-odd other checks, so the run stops telling you which failure mattered. A budget is the statement that every soft slot was a deliberate choice rather than a default reached for under time pressure.
 *
 * `voter-journey.spec.ts` carried a header claiming a 3-slot budget while the file held 136 such calls. It drifted there one honest addition at a time, and every one of those additions ran green, because a prose claim cannot fail. A comment asking future authors to keep the number in sync would be the same kind of non-guard this check exists to replace, so the invariant is CHECKED — the identical argument this file already makes for its sibling above.
 *
 * The comparison is EQUALITY, not a ceiling: REMOVING a soft assertion without updating the budget throws too, so the declared posture stays honest in both directions and a promotion to a hard `expect()` is recorded rather than absorbed. Counting is by OCCURRENCE — a global regex match over the file contents — not by line, so a line carrying two calls counts as two; `grep -c` semantics would silently undercount it.
 *
 * Throwing here fails every `playwright test` / `--list` invocation immediately and by name. `--list` matters specifically: it does not run `globalSetup`, so a check living in a test or in setup would never see it. Config-load code does.
 */
for (const [rel, budget] of Object.entries(SOFT_ASSERTION_BUDGETS)) {
  const specPath = path.join(TESTS_DIR, rel);
  if (!fs.existsSync(specPath)) {
    throw new Error(
      `Soft-assertion budget names a spec that no longer exists: ${rel}. Either restore the ` +
        `file, or drop its entry from SOFT_ASSERTION_BUDGETS in this file. A budget pointing at ` +
        `nothing is a guard that can never fire (fake-guard sweep 2026-08-11, finding F10).`
    );
  }
  // Strip comments before counting. A naive whole-file regex match counts every textual occurrence including inside comments and string literals — so the remediation instruction below ("state the reason in that spec's header") could itself contain the literal `expect.soft(` token and re-trip this very guard by inflating the count with a comment, not code.
  const source = fs
    .readFileSync(specPath, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/(^|[^:])\/\/.*$/gm, '$1'); // line comments (":" guard skips URLs like https://)
  const actual = (source.match(/\bexpect\.soft\s*\(/g) ?? []).length;
  if (actual !== budget) {
    throw new Error(
      `Soft-assertion budget diverged in ${rel} — the declared budget is ${budget} but the file ` +
        // The count is taken outside comments; string literals are NOT excluded (a naive claim otherwise would itself be the F10 failure mode).
        `carries ${actual} (counted outside comments; string literals are NOT excluded). Convert the ` +
        `new assertion to a hard \`expect()\`, or change the budget in SOFT_ASSERTION_BUDGETS in this ` +
        `file AND record the reason in that spec's header (prose only — do not restate the number; the ` +
        `header deliberately does not). A budget edited to match whatever the file happens to contain ` +
        `is not a budget (fake-guard sweep 2026-08-11, finding F10).`
    );
  }
  // Under-count hole: the count above matches only the literal `expect.soft(` token, so an aliased/destructured soft assertion — e.g.
  // `const soft = expect.soft; soft(x).toBe(y)` — is invisible to it and the budget would silently over-report headroom, the direction that produced F10 in the first place. Reject any bare `expect.soft` reference that is not immediately called, so an alias must be introduced deliberately with a budget-guard-aware follow-up rather than slipping past unseen.
  if (/\bexpect\s*\.\s*soft\b(?!\s*\()/.test(source)) {
    throw new Error(
      `${rel} references \`expect.soft\` without calling it directly (an alias or a destructure). ` +
        'The budget above counts call sites textually, so an aliased soft assertion is invisible to ' +
        'it — call `expect.soft(...)` inline, or the budget silently over-reports headroom.'
    );
  }
}

/**
 * TEARDOWN-PREFIX-UNIQUENESS GUARD (review finding CR-01).
 *
 * `runTeardownAsserted` (`tests/tests/setup/shared/assertTeardown.ts`) turned the before/after row-count accounting into a HARD assertion. That assertion is only valid if each `*.teardown.ts` project owns an `external_id` prefix that no other project can touch concurrently — two data-teardown projects sharing (or substring-overlapping) a prefix race on the same before/after counts, and Playwright does not order data-teardown projects relative to each other unless an explicit `dependencies` edge forces it (most don't — see the perm family's `extraTeardownPrefix`-based cross-chain isolation instead of hard ordering).
 *
 * `bank-auth-journey.teardown.ts` and `perm-not-located-2e2cg.teardown.ts` shipped with the IDENTICAL prefix `e2e-perm-notloc-` (CR-01) — invisible until this guard existed, because the old `toBeGreaterThanOrEqual(0)` matcher could not fail on the race.
 * The fix here is scanning every `*.teardown.ts` file's `const PREFIX = '...'`
 * declaration and throwing at config-load time if any two are equal OR one is a string-prefix of another (a `LIKE '<prefix>%'` scoping bug the review flagged separately, WR-06) — a comment asking future authors to pick a distinct prefix would be the same non-guard this file's other two checks exist to remove.
 *
 * Deliberately excludes files with no `const PREFIX = '...'` declaration AND no `runTeardownAsserted(` call (e.g. `candidate-journey.teardown.ts`, which performs no prefix-scoped delete — see `assertTeardown.ts`'s corrected docblock claim, CR-02). A file that DOES call `runTeardownAsserted(` but whose `const PREFIX` this guard fails to parse is a completeness failure, not a legitimate exclusion — see the `unparsed` check below (an enumeration guard with no completeness check is the same failure mode as fake-guard finding F4 above).
 *
 * ENUMERATION SCOPE (review finding IN-02). Scans all of `TESTS_DIR`, not `TESTS_DIR/setup`, even though all 28 `*.teardown.ts` files live under `setup/` today. The teardown projects' `testMatch` patterns are unanchored regexes (e.g. `/base\.teardown\.ts/`) evaluated against the inherited `testDir` — which is `TESTS_DIR` — so a `*.teardown.ts` added anywhere under it would be PICKED UP AND RUN by Playwright. Scoping the scan to `setup/` left exactly that file invisible to the uniqueness check: the same enumeration-drift shape as fake-guard finding F4, one level up from where WR-03 fixed it. Matching the scan to the runner's own scope keeps the two from drifting apart again, which a convention ("put teardowns in setup/") would not.
 */
const teardownDir = TESTS_DIR;
// Named precondition, mirroring the ORPHAN-PROBE guard's `fs.existsSync` check above. Without it, a missing/renamed tests directory would die on a raw `readdirSync` ENOENT — the opposite of the "fails immediately and by name" property this guard claims for itself.
if (!fs.existsSync(teardownDir)) {
  throw new Error(
    `Teardown prefix guard: expected directory '${teardownDir}' does not exist. The ` +
      'teardown-prefix-uniqueness guard (review CR-01) cannot enumerate *.teardown.ts ' +
      'files without it.'
  );
}
const teardownPrefixDeclarations: Array<{ file: string; prefix: string }> = [];
const unparsedTeardownPrefixFiles: Array<string> = [];
for (const rel of fs
  .readdirSync(teardownDir, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.teardown.ts'))) {
  const abs = path.join(teardownDir, rel);
  const source = fs.readFileSync(abs, 'utf8');
  const match = /^\s*(?:export\s+)?const PREFIX(?:\s*:\s*string)?\s*=\s*['"]([^'"]+)['"]/m.exec(source);
  if (match) {
    teardownPrefixDeclarations.push({ file: rel, prefix: match[1] });
  } else if (source.includes('runTeardownAsserted(')) {
    unparsedTeardownPrefixFiles.push(rel);
  }
}
if (unparsedTeardownPrefixFiles.length > 0) {
  throw new Error(
    "Teardown prefix guard could not parse a `const PREFIX = '...'` declaration in " +
      `${unparsedTeardownPrefixFiles.join(', ')}, but the file calls runTeardownAsserted — so its ` +
      'prefix is NOT covered by the uniqueness/overlap check below and a collision could reappear ' +
      'silently (review WR-03; same enumeration-drift shape as fake-guard finding F4). Make ' +
      "the declaration match `const PREFIX = '...'` (a plain top-level string literal), or widen the " +
      'regex above to cover the new shape.'
  );
}
for (let i = 0; i < teardownPrefixDeclarations.length; i++) {
  for (let j = i + 1; j < teardownPrefixDeclarations.length; j++) {
    const a = teardownPrefixDeclarations[i];
    const b = teardownPrefixDeclarations[j];
    if (a.prefix === b.prefix) {
      throw new Error(
        `Teardown prefix collision: '${a.file}' and '${b.file}' both declare PREFIX = '${a.prefix}'. ` +
          `The two data-teardown projects are not guaranteed to be ordered relative to each other, so ` +
          `their runTeardownAsserted before/after row counts can race nondeterministically (` +
          `review CR-01). Give one of them its own dedicated prefix — and, if it reuses a shared dev-seed ` +
          `template, its own dedicated template registration too (see ` +
          `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts for the pattern).`
      );
    }
    if (a.prefix.startsWith(b.prefix) || b.prefix.startsWith(a.prefix)) {
      const [shorter, longer] = a.prefix.length <= b.prefix.length ? [a, b] : [b, a];
      throw new Error(
        `Teardown prefix overlap: '${shorter.file}' declares PREFIX = '${shorter.prefix}', which is a ` +
          `string-prefix of '${longer.file}'s PREFIX = '${longer.prefix}'. Both are matched by the SAME ` +
          `\`external_id LIKE '${shorter.prefix}%'\` scan, so the shorter prefix's teardown/count also ` +
          `touches the longer prefix's rows (review CR-01 + WR-06). Choose non-overlapping prefixes.`
      );
    }
  }
}

/**
 * Playwright configuration with project dependencies pattern.
 *
 * The suite is:
 *
 *   - journey chains: data-setup-base -> voter-journey
 *     + data-setup-base -> data-setup-candidate-journey -> candidate-journey
 *   - perm-* family: a single sequential chain that runs strictly AFTER the journey leaves — its first setup (data-setup-perm-1e1cg1co) depends on [voter-journey, candidate-journey], and every later perm setup chains off the previous perm spec. Each perm setup clobbers the app_settings JSONB singleton, so the family runs serially AND must not interleave with the base/journey chains on the shared single DB. The perm→journey dependency direction keeps opt-in --project runs pulling only base, never the perm family.
 *   - specialized projects that run BY DEFAULT and are opt-OUT via env: performance (disable with PLAYWRIGHT_NO_PERF) and the two-project a11y scan family, a11y-smoke + candidate-a11y-scan (both disabled together with PLAYWRIGHT_NO_A11Y). performance and a11y-smoke depend on `data-setup-base` (e2e/base dataset); candidate-a11y-scan additionally depends on `auth-setup`, because it scans candidate `(protected)` routes.
 *   - OPT-IN projects (excluded from the default run): · visual-regression (PLAYWRIGHT_VISUAL) — opt-in because its PNG baselines are Linux/x86_64 captures that only reproduce on the CI runner image, not because it is broken: it is a BLOCKING job in .github/workflows/main.yaml.
 *       · bank-auth (PLAYWRIGHT_BANK_AUTH) — the spec throws at module load without SUPABASE_SERVICE_ROLE_KEY/ANON_KEY and needs the identity-callback Edge Function served.
 *
 * `auth-setup` runs IN THE DEFAULT RUN (the second scheduling phase, measured
 * 5.0 s), because the default-on `candidate-a11y-scan` project consumes the candidate session it stores. It was formerly declared only under PLAYWRIGHT_VISUAL and dormant by default. The wiring's derivation is recorded at the `candidate-a11y-scan` project below.
 *
 * See https://playwright.dev/docs/test-global-setup-teardown
 */
export default defineConfig({
  testDir: TESTS_DIR,
  testIgnore: ['**/*.test.ts'],
  outputDir: path.join(TESTS_DIR, '../playwright-results'),

  /* SERVED-APPLICATION GATE.
   * Asserts that whatever is listening on `use.baseURL` below is THIS checkout's Vite dev server — proven by the served application's own response, not by the listener process — and aborts the run with exit 1 before any spec body if it is not. There is no bypass: `FRONTEND_PORT` moves the target, it does not skip the check.
   * The path resolves relative to THIS config file's directory; that is not the `webServer.command` cwd gotcha documented further down, which concerns the spawn cwd instead.
   * `--list` deliberately does not run it, so the "no dropped specs" check stays usable without a dev server (tests/README.md); the orphan-probe guard above
   * runs at config-load time and covers that path. */
  globalSetup: './global-setup.ts',

  /* Screenshot baselines stored alongside specs in a git-trackable directory */
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{ext}',

  /* Per-test timeout — 90s ceiling required for full-suite render-pressured fixtures.
   * Under --workers=1 full-suite contention the answer-loop + post-loop waitForURL can exceed lower budgets, so the per-test wrapper timeout is the binding constraint.
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

  /* Visual-diff budget — the ABSOLUTE cap is the primary knob; the ratio is a small-baseline floor.
   * `maxDiffPixels: 200` is the operative budget on all four baselines this suite has today.
   * `maxDiffPixelRatio` is RETAINED but is no longer "the budget".
   * playwright-core's comparators.js:88-96 computes `maxDiffPixels2 = width × height × maxDiffPixelRatio` and then takes `Math.min(maxDiffPixels, maxDiffPixels2)`, so adding an absolute cap is monotonically strictness-INCREASING — it can never loosen a baseline — and `min(cap, 0.01 × area)` is bounded by `cap` however tall a fullPage capture grows. That bound is the point: before the cap, a page that grew longer silently bought itself more tolerance (1280×3684 → a 47,155 px budget), which is how ~19,500 px of visible damage once passed at 41 % of budget (0.41 % of the image).
   * Derivation of the 200: `cap = max(observed per-baseline run-to-run noise) × 10`, floored at 200, rounded up, and required to stay strictly < 5,000 so it stays ~4× below that ~19,500 px regression. Read the arithmetic honestly: the measured noise was 0 px in all 40 cells (4 baselines × 10 in-container runs at zero tolerance), so `0 × 10 = 0` and THE FLOOR — a constant fixed in advance, not a quantity these runs produced — set this value. What the measurements contribute is the licence to take the floor: a noise floor of exactly 0 gives any positive cap complete headroom, and 200 sits ~83× below the ~16,650 px the same injected regression measures in this suite today.
   * Where the ratio would bind: only on a capture whose `0.01 × area` falls below the cap, i.e.
   * under ~20,000 px² of area (~140×140). The smallest baseline here, candidate-preview-mobile at 390×924, has a 3,603.6 px ratio budget — still 18× above the cap — so the ratio is DORMANT on all four baselines today and is kept only as a floor for hypothetical very small captures.
   * `threshold` is pixelmatch's per-pixel colour tolerance, not part of the budget. */
  expect: {
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 200,
      maxDiffPixelRatio: 0.01
    }
  },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace for every test, but KEEP only the failures. See
     * https://playwright.dev/docs/trace-viewer
     *
     * `retain-on-failure` records exactly what `'on'` records — same instrumentation, same runtime cost — and then discards the trace when the test passes. What it buys is disk: a full-suite run under `'on'` deposits 260-340 MB of trace zips that nobody opens, because the run was green.
     * Under `retain-on-failure` a green run deposits ~0 bytes and a red one still hands you the trace for the test that actually failed (local `retries: 0` does not weaken this — the retain fires on the final failed attempt either way).
     *
     * When a passing test's trace IS the evidence — e.g. a past sweep that grepped console messages out of 11 GREEN trace zips — flip this to `'on'` for that investigation and flip it back. That is the rare case; paying 300 MB a run for it is not worth it. Note that browser-side forensics (console / pageerror / requestfailed) are captured independently of this setting by the `forensicCapture` fixture, which
     * attaches its transcripts to the result whether the test passed or not. */
    trace: 'retain-on-failure',

    baseURL: process.env.FRONTEND_PORT ? `http://localhost:${process.env.FRONTEND_PORT}` : 'http://localhost:5173'
  },

  projects: [
    // === Shared base auth setup (DEFAULT-ON) ===
    //
    // The specialized projects below depend on `data-setup-base` for their seed.
    // performance / a11y-smoke / candidate-a11y-scan run by default (opt-OUT via PLAYWRIGHT_NO_*); visual-regression (PLAYWRIGHT_VISUAL) and bank-auth (PLAYWRIGHT_BANK_AUTH) are opt-IN and are excluded from the default run -- see the OPT-IN list in the docblock above and the gate expressions on each project below. `auth-setup` (candidate storageState) also depends on `data-setup-base`, and is now declared UNCONDITIONALLY, so the default `yarn test:e2e` DOES run the candidate-login storageState step.
    //
    // SOURCE OF TRUTH: the `...(process.env.X ? [...] : [])` gate expression on each project below decides whether it runs, not any prose in this file.
    // If a comment and a gate disagree, the gate is right and the comment is a bug.
    //
    // The registered-base-candidate contract: the candidates table carries no email column, so the seed cannot ship a *registered* candidate. `auth-setup` therefore force-registers base CA-AA-1 itself via SupabaseAdminClient before its UI login — the same mechanism every perm-* setup uses. See tests/tests/utils/testCredentials.ts.
    //
    // visual-regression stays opt-in for a snapshot-portability reason, NOT a blocker: its PNG baselines are Linux/x86_64 captures and only reproduce on the CI runner image (re-baseline procedure in the visual spec's docblock).
    // The CI job that runs it is blocking.
    //
    // TWO projects consume the candidate storageState: `visual-regression` (opt-in) and `candidate-a11y-scan` (default-on). The second is why `auth-setup` is no longer gated behind PLAYWRIGHT_VISUAL. `performance`, `a11y-smoke` and `bank-auth` still depend on `data-setup-base` directly, not on auth-setup.
    //
    // WHY THIS WIRING AND NOT THE TWO THIS FILE ALREADY WARNS ABOUT. Reaching the candidate `(protected)` routes forces a dependency-graph change, and the comment at the `data-setup-bank-auth-journey` project below records this same graph being reasoned about wrongly twice. So the choice was MEASURED rather than re-argued: six candidate wirings were scored against an instrument transcribed from Playwright's own phase assignment and validated at 0 mismatches over 89 projects against a real run. The two rejected shapes are named there:
    //   · adding `auth-setup` to `a11y-smoke.dependencies` (W1) would make the 16 voter a11y tests depend on a candidate login and cost `a11y-smoke` its 1-setup isolation; · appending the scan to the tail of the perm serial chain (W5) would enter as the 55th scheduling phase, after 25 `test-` pre-clears, with the last `app_settings` REPLACE being a perm setup rather than `data-setup-base`.
    // The wiring below (W3) puts the scan in the third scheduling phase alongside `candidate-journey` alone — measured, not predicted: 0 mismatches over 91 scheduled projects.
    //
    // Auth setup - logs in as candidate, saves storageState (depends on the merged base dataset being seeded). Declared UNCONDITIONALLY: the default-on `candidate-a11y-scan` project below consumes the stored session.
    {
      name: 'auth-setup',
      // ANCHORED, and it has to be. `testMatch` is an unanchored regex tested against the whole path, so the previous `/auth\.setup\.ts/` also matched `setup/admin/admin-auth.setup.ts` — MEASURED, not hypothesised: `--list` collected the admin setup under BOTH this project and `data-setup-admin-auth`, which would have written the admin stored session twice, from two projects, at two different points in the schedule (once here, before the perm chain, and once at the chain's tail). Two projects writing one session file is the race this config's own comments warn about, and it has no symptom until it produces a confident wrong answer. The `[\\/]` prefix is what makes `-auth.setup.ts` stop matching while `shared/auth.setup.ts` still does.
      testMatch: /[\\/]auth\.setup\.ts$/,
      dependencies: ['data-setup-base']
    },

    // === Specialized Projects === performance / a11y-smoke run BY DEFAULT in `yarn test:e2e`.
    // Opt OUT of either with the matching PLAYWRIGHT_NO_* env, e.g.:
    //   PLAYWRIGHT_NO_PERF=1 yarn test:e2e PLAYWRIGHT_NO_A11Y=1 yarn test:e2e visual-regression and bank-auth stay OPT-IN (see the notes above): PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --project=visual-regression PLAYWRIGHT_BANK_AUTH=1 npx playwright test -c tests/playwright.config.ts --project=bank-auth

    // Visual regression: screenshot comparison for key pages (OPT-IN — see the snapshot-portability note above; the CI job itself is blocking).
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
    //
    // The a11y scan family is TWO projects over ONE shared scan core (`tests/tests/utils/axeScan.ts`), split because they need different browser state: `a11y-smoke` runs the public voter routes unauthenticated, while `candidate-a11y-scan` runs the candidate `(protected)` routes with the stored candidate session. A Playwright project selects by directory and filename, so each carries an EXPLICIT `testMatch`.
    //
    // The explicit `testMatch` on `a11y-smoke` is not bookkeeping. It declares `testDir: './tests/specs/a11y'` and would otherwise collect the sibling candidate spec and run it WITHOUT the stored session — every candidate route would 307 to the login form, and the scan would report a clean zero about a login page. That is the one direction in which this wiring can be silently wrong AND green.
    ...(process.env.PLAYWRIGHT_NO_A11Y
      ? []
      : [
          {
            name: 'a11y-smoke',
            testDir: './tests/specs/a11y',
            testMatch: /a11y-smoke\.spec\.ts/,
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['data-setup-base']
          },
          {
            name: 'candidate-a11y-scan',
            testDir: './tests/specs/a11y',
            testMatch: /candidate-a11y\.spec\.ts/,
            use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
            dependencies: ['data-setup-base', 'auth-setup']
          }
        ]),

    // Bank auth (Idura/Signicat): identity-callback Edge Function integration.
    // OPT-IN (PLAYWRIGHT_BANK_AUTH) — NOT default-on: the spec throws at module load without SUPABASE_SERVICE_ROLE_KEY/ANON_KEY, and 3 of its tests have no precondition skip and require the identity-callback Edge Function to be served (`supabase functions serve --no-verify-jwt`). Promoting it to default-on needs an infra-probe gate on all tests + non-throwing key handling first.
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

    // Bank-auth full-browser journey (EFLOW-10b) — the Option-B mock-OIDC-issuer round-trip: /candidate/preregister → mock IdP 302 → server exchange+decrypt → authenticated → election/constituency → email+ToU → preregister() → registration-key → set password → logged-in.
    //
    // OPT-IN (PLAYWRIGHT_BANK_AUTH). It JOINS THE TAIL OF THE PERM SERIAL CHAIN (see `dependencies` below). An earlier design had it stand alone; that was superseded by explicit operator decision, because standing alone bought a fast isolated gate at the cost of `app_settings` singleton safety, and the singleton wins. The isolated `--project=bank-auth-journey` gate therefore now pulls the whole chain transitively and takes full-suite time rather than seconds — accepted, because there is no requirement that this journey be runnable quickly in isolation.
    //
    // Review finding CR-01 is FIXED (commit `10ca954ac`): `submitElection()` / `submitConstituency()` in `candidatePreregisterPage.fixture.ts` select by LABEL, not by position, so a foreign dataset in the DB fails the walk loudly instead of being silently preregistered into. Proven by trace — `check` fires on the `[EL1]` option.
    //
    // The setup/teardown FILES these entries point at, and the journey SPEC matched by the `bank-auth-journey` project, all live in this tree.
    //
    // The mock OIDC issuer is spawned via the `webServer` entry below (also PLAYWRIGHT_BANK_AUTH-gated). It binds 127.0.0.1-only and serves over HTTPS with a committed self-signed localhost cert — never reachable in the default suite (threat T-122-08).
    ...(process.env.PLAYWRIGHT_BANK_AUTH
      ? [
          {
            name: 'data-setup-bank-auth-journey',
            testMatch: /bank-auth-journey\.setup\.ts/,
            teardown: 'data-teardown-bank-auth-journey',
            // APPEND TO THE TAIL OF THE PERM SERIAL CHAIN.
            //
            // `voter-prefs-tracking` is the chain's last leaf, so this setup's authoritative `app_settings` REPLACE cannot overlap any other project's. Ordering edges express ORDER, not MUTUAL EXCLUSION, and the `app_settings` JSONB singleton needs the latter — which in this config is spelled "be in the serial chain". The two cheaper-looking alternatives were both measured unsound:
            //   · `['data-setup-base']` (the iteration-2 wiring) put this project in the SAME phase as `voter-journey` / `performance` /
            //     `a11y-smoke` (identical dependency set → identical phase, see
            //     playwright/lib/runner/tasks.js createPhasesTask), so the REPLACE landed mid-spec under `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e`.
            //   · `['voter-journey', 'candidate-journey']` (the review's own suggestion) merely RELOCATES the race: it lands this project in the same phase as `data-setup-perm-1e1cg1co`, the perm chain HEAD, which does the same REPLACE. Do not "fix" it that way.
            //
            // `data-setup-base` is still ordered before this project transitively (chain head → `voter-journey` → `data-setup-base`), so `base.setup`'s `extraTeardownPrefix` sweep of an orphaned `e2e-bankauth-` dataset from an aborted prior run still runs first — the property the base edge was added for is preserved.
            dependencies: ['voter-prefs-tracking']
          },
          {
            name: 'data-teardown-bank-auth-journey',
            testMatch: /bank-auth-journey\.teardown\.ts/,
            // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
            retries: 0
          },
          {
            name: 'bank-auth-journey',
            testDir: './tests/specs/candidate',
            testMatch: /candidate-bank-auth-journey\.spec\.ts/,
            // `ignoreHTTPSErrors: true` is REQUIRED on the BROWSER context: the journey's OIDC authorize leg navigates the browser to the mock issuer at `https://127.0.0.1:9443/oauth2/authorize`, served with a committed self-signed localhost cert. Without this, Chrome rejects the cert and the navigation fails silently — the issuer's 302 back to `/api/oidc/callback` never reaches the browser, so the authenticated `preregister-continue` state never renders. (The matching `ignoreHTTPSErrors` on the `webServer` readiness probe below only covers Playwright's own JWKS health check, not the browser context.) TEST-ONLY, opt-in `PLAYWRIGHT_BANK_AUTH` run.
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
    // The base chain seeds standalone (no perm dependency). The base setup retains a defensive `extraTeardownPrefix: 'e2e-perm-'` pre-clear (shared/base.setup.ts) — an idempotent wipe of the SEPARATE `e2e-perm-` namespace, never the base `test-` rows — so a perm chain that ran earlier in the same DB session cannot leak rows into the base dataset.
    {
      name: 'data-setup-base',
      testMatch: /base\.setup\.ts/,
      teardown: 'data-teardown-base'
      // reason: base seeds with NO perm dependency so opt-in `--project` runs (visual/perf/a11y/bank-auth) pull only base + auth and work standalone.
      // Cross-namespace isolation for the DEFAULT full-suite run is enforced in the OPPOSITE direction: the perm family depends on the journey leaves (see `data-setup-perm-1e1cg1co` below), so perm runs strictly AFTER base
      // + journeys and never interleaves with base on the shared single DB / `app_settings` singleton. The base setup's `extraTeardownPrefix: 'e2e-perm-'` pre-clear is a belt-and-braces guard for any residual perm rows from a prior DB session.
    },
    {
      name: 'data-teardown-base',
      testMatch: /base\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    // `video: 'retain-on-failure'`. This project owns the term-trigger step, whose failure is a LATENCY signal, not an absence signal: the recorded occurrence's own page snapshot showed the trigger present. A trace records what the test asserted; only a video records what the page was DOING across the Base-2 → Base-3 hop while the budget expired. Bounded by construction — this project runs ONE test, and a green run produces zero video bytes.
    {
      name: 'voter-journey',
      testDir: './tests/specs/voter',
      testMatch: /voter-journey\.spec\.ts/,
      fullyParallel: false, // single-test serial journey
      use: { ...devices['Desktop Chrome'], video: 'retain-on-failure' },
      dependencies: ['data-setup-base']
    },

    // eperm07-term-trigger — LEAF. Isolated hunt spec for the intermittent term-trigger failure: drives ONLY Base-1 → Base-2 → Base-3 and asserts the in-text <Term> affordance, so the ~1-in-8 event can be forced and observed in seconds instead of in a 648 s full-suite run. Reads the base dataset read-only (no teardown of its own). `video: 'on'` rather than retain-on-failure — this project runs one short test, so keeping the near-miss recordings (a run that passed at 1.9 s of a 2 s budget) is cheap and is exactly the latency evidence the hunt needs. `testMatch` is scoped to the hunt spec; `voter-journey`'s `testMatch` (/voter-journey\.spec\.ts/) does not match this filename, so neither project picks up the other's specs. NOT under `_probes`: that project is excluded from the gate suite by the root `test:e2e` script's `--grep-invert @probe`, which would make this spec invisible to the 16-run determinism gate.
    {
      name: 'eperm07-term-trigger',
      testDir: './tests/specs/voter',
      testMatch: /eperm07-term-trigger\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], video: 'on' },
      dependencies: ['data-setup-base']
    },

    // cold-entry-dataroot — LEAF. Read-only cold/direct-URL entry regression for the dataRoot #version-bridge alias-indirection staleness. Reads the base dataset read-only (no teardown of its own). `testMatch` is scoped to the cold-entry spec; `voter-journey`'s `testMatch` (/voter-journey\.spec\.ts/) excludes this file, so neither project picks up the other's specs.
    //
    // The spec is split across TWO projects on the `@cand-session` tag (phase 159). Its voter cases must run UNAUTHENTICATED — that is what makes them a public-route cold entry — while the candidate case cannot reach `/candidate/questions` at all without a stored session. One project cannot be both, and a `test.use({ storageState })` inside the spec would have to spell the session path a third time, which `STORAGE_STATE`'s own declaration comment above rules out. This is the same split, for the same reason, that the a11y family already makes between `a11y-smoke` and `candidate-a11y-scan`. `grep`/`grepInvert` are complementary over the one tag, so every test in the file belongs to exactly one project and none can be silently orphaned.
    {
      name: 'cold-entry-dataroot',
      testDir: './tests/specs/voter',
      testMatch: /cold-entry-dataroot\.spec\.ts/,
      grepInvert: /@cand-session/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-base']
    },
    {
      name: 'cold-entry-dataroot-candidate',
      testDir: './tests/specs/voter',
      testMatch: /cold-entry-dataroot\.spec\.ts/,
      grep: /@cand-session/,
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['data-setup-base', 'auth-setup']
    },

    // voter-dark-mode — LEAF. Read-only dark-scheme regression on the base dataset. Theme is driven via emulateMedia (prefers-color-scheme) — there is NO toggle and NO localStorage write (darkMode.svelte.ts derives from matchMedia only). `testMatch` is scoped to the dark-mode spec; sibling voter-* projects' exact testMatch excludes it.
    {
      name: 'voter-dark-mode',
      testDir: './tests/specs/voter',
      testMatch: /voter-dark-mode\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-base']
    },

    // voter-journey-mobile — LEAF. The viewport-agnostic 'max' voter walk under a mobile descriptor. The descriptor lives here at project scope (explicit 390×844 isMobile/hasTouch, matching visual-regression — NOT devices['Pixel 5']); the walk itself is unchanged.
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

    // voter-alliance — LEAF. Read-only alliance results-surface DEPTH on the base dataset (Alliance A card, clickable member-org subcards, member-orgs drawer, ['info','children'] tab control). Consumes the shared 'max' voter walk (answeredVoterPage) under a Desktop descriptor; assert-only (no own setup/teardown — Alliance A + members already in e2e/base). `testMatch` is scoped to this spec; sibling voter-* projects' exact testMatch excludes it.
    {
      name: 'voter-alliance',
      testDir: './tests/specs/voter',
      testMatch: /voter-alliance\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-base']
    },

    // voter-nominations — LEAF. Read-only render check for the UNSCOPED all-nominations route (dedicated spec, NOT a journey step). assert-only (showAllNominations already true in e2e/base — no own setup/teardown). `testMatch` is scoped to this spec; sibling voter-* projects' exact testMatch excludes it.
    {
      name: 'voter-nominations',
      testDir: './tests/specs/voter',
      testMatch: /voter-nominations\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-base']
    },

    // === _probes (fixtures-first isolation probes) — LEAF, no data-setup ===
    //
    // The 4 deferred perm-seeded probes (video, questionInfo, popupNotice, orgMatching) live under ./tests/specs/_probes. They are DELIBERATELY OUTSIDE the perm serial-DAG chain: each clobbers the shared `app_settings` JSONB singleton, so they MUST run ONE-AT-A-TIME in true isolation, seeded OUT-OF-BAND per the probe header (`yarn db:seed --template <perm>`) and invoked as a single-file run (`npx playwright test <probe> --project=_probes`). There is intentionally NO data-setup dependency — folding the perm seeds into the shared serial chain would clobber app_settings between probes. The isolation contract lives in the RUN discipline, not in a setup project.
    //
    // Because they need out-of-band per-probe seeding, these probes are EXCLUDED from the default green-suite / CI gate: the root `test:e2e` script runs `--grep-invert @probe`. Run them via `yarn test:e2e:probes <probe-file>` (one at a time, after `yarn db:seed --template <perm>`). Every probe test is tagged `@probe` for this filter.
    //
    // `testMatch` lists the probe files EXPLICITLY, and every `*.probe.spec.ts` in this directory must appear in it. That is the invariant: a probe file not named here matches NO project and is reachable from NO command.
    //
    // It has been violated before. Four base/read-only probes (entityFilters/navMenu/theme/trackingIntercept), added as fixture-development scaffolding, were left out of this pattern — so their 6 tests ran from nowhere, including from `yarn test:e2e:probes`, while still sitting in `specs/` implying coverage (fake-guard sweep 2026-08-11, finding F4). They were DELETED rather than wired up, because every fixture method they smoke-tested is now exercised by a spec that runs in the blocking default suite, in each case at least as strongly: selectAll/selectNone by voter-journey.spec.ts (exact 13/0/13 counts plus the toggle-absent negative case), openMobileNav/items/expectNavMenuItems by candidate-journey.spec.ts (exact ordered 10-item list, logged-out and logged-in) and voter-journey-mobile.spec.ts, setColorScheme/expectTheme by voter-dark-mode.spec.ts (the probe's steps verbatim plus an extra reload), and getTrackCalls by voter-prefs-tracking.spec.ts (emit driven through the REAL in-app consent path, which the probe documented itself as unable to arm).
    {
      name: '_probes',
      testDir: './tests/specs/_probes',
      testMatch: PROBE_TEST_MATCH,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] }
    },

    // === voter permutations chains ===
    //
    //   - perm specs live under tests/tests/specs/perm/; the voter-app project's testDir is `./tests/specs/voter`, so perm specs are categorically outside its discovery surface.
    //   - perm-* setups chain SEQUENTIALLY within the perm-* family to prevent app_settings singleton clobbering. The FIRST perm setup (data-setup-perm-1e1cg1co) depends on the journey LEAF specs [voter-journey, candidate-journey] so the whole perm family runs strictly AFTER base + both journeys complete. This is the perm→journey direction, so opt-in `--project` runs never pull the perm family.
    //   - Each chain teardowns ITS OWN test-perm-<short>- prefix.
    //
    // Sequential chain across the family:
    //   data-setup-perm-1e1cg1co (FIRST — after journey leaves) → data-setup-perm-2e-shared → data-setup-perm-2e-asymmetric → data-setup-perm-startfromcg → data-setup-perm-disjoint-1co → data-setup-perm-disable-election-1co → data-setup-perm-disable-election-2co → data-setup-perm-not-located-2e2cg

    // Variant 1: perm-1e1cg1co (1 test) — FIRST in the perm family, serialized AFTER the journey leaves (voter-journey + candidate-journey).
    //
    // Depends on the journey LEAF specs so the entire perm family runs strictly AFTER base + both journeys have completed. base + perm share the `app_settings` JSONB singleton AND have mutually-destructive preclears (this setup's `extraTeardownPrefix: 'test-'` deletes base `test-e2e-base-%` rows; base setup's `e2e-perm-` preclear deletes perm rows), so without this serialization edge they would interleave and leak elections across datasets. The perm→journey direction (NOT base→perm) keeps opt-in `--project` runs (visual/perf/a11y/bank-auth) pulling only `data-setup-base` (+ auth-setup), never the perm family — base still seeds standalone.
    //
    // `eperm07-term-trigger` is in the anchor too. Several other base leaves sit OUTSIDE it and are fine there because they do not hard-assert settings-dependent UI; this one does, twice — the category-intro page it walks through exists only while `questions.categoryIntros.show` is true, and `voterQuestionsPage.clickStart()` only while `questionsIntro.show` is. A perm setup clobbering the `app_settings` singleton mid-walk would therefore surface inside this suite's permanent regression guard for the shared navigation settle, where it would read as a settle regression rather than as the contamination flake this suite has a recorded history of.
    //
    // `candidate-a11y-scan` is in the anchor too. It scans authenticated candidate surfaces against the `app_settings` singleton as `data-setup-base` left it, so it must finish before the first perm setup REPLACEs that singleton. Without the edge it would still precede the perm family — but only INCIDENTALLY, because the anchor happens to name `candidate-journey`, which happens to share the scan's phase. Naming the scan directly means a later edit that moves `candidate-journey` cannot silently move the perm family ahead of it.
    //
    // The entry is conditional on the same `PLAYWRIGHT_NO_A11Y` opt-out that declares the project: Playwright rejects a dependency on a project that was never declared, so an unconditional entry would make `PLAYWRIGHT_NO_A11Y=1` fail at config load. That interaction is resolved here with the file's own existing opt-out convention rather than a new mechanism.
    {
      name: 'data-setup-perm-1e1cg1co',
      testMatch: /perm-1e1cg1co\.setup\.ts/,
      teardown: 'data-teardown-perm-1e1cg1co',
      dependencies: [
        'voter-journey',
        'candidate-journey',
        'eperm07-term-trigger',
        ...(process.env.PLAYWRIGHT_NO_A11Y ? [] : ['candidate-a11y-scan'])
      ]
    },
    {
      name: 'data-teardown-perm-1e1cg1co',
      testMatch: /perm-1e1cg1co\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
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
      // Depends on the previous chain's SPEC project (not its setup), so the previous chain's spec finishes before this setup seeds. Playwright forbids setups depending on teardown projects directly, so this is the strictest ordering we can declare. Cross-chain row isolation is enforced inside `setupFromTemplate` via `extraTeardownPrefix: 'test-perm-'` (clears the whole family before seeding this template), so we don't depend on the previous chain's teardown actually finishing before this setup runs. Confirmed via Gate A 2026-05-26.
      dependencies: ['perm-1e1cg1co']
    },
    {
      name: 'data-teardown-perm-2e-shared',
      testMatch: /perm-2e-shared\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
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
      testMatch: /perm-2e-asymmetric\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
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
      testMatch: /perm-startfromcg\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
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
      testMatch: /perm-disjoint-1co\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
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
      testMatch: /perm-disable-election-1co\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
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
      testMatch: /perm-disable-election-2co\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
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
      testMatch: /perm-not-located-2e2cg\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
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
    // candidate-journey setup does not re-seed (see tests/tests/setup/candidate/candidate-journey.setup.ts): it consumes the base data already seeded by `data-setup-base` and runs as a PARALLEL LEAF alongside voter-journey, so neither cascade-skips the other on spec failure. Their teardowns are independent: base.teardown owns the 'test-' row prefix; candidate-journey.teardown owns only the auth.users row created by the spec's registration step.
    //
    // The setup still guarantees a clean auth.users row for UNREGISTERED_CANDIDATE_EMAIL via idempotent `unregisterCandidate`, so the registration-via-email step lands deterministically.
    //
    // Spec project sets `storageState: { cookies: [], origins: [] }` to start UNAUTHENTICATED — required for the registration-via-email flow.
    {
      name: 'data-setup-candidate-journey',
      testMatch: /candidate-journey\.setup\.ts/,
      teardown: 'data-teardown-candidate-journey',
      dependencies: ['data-setup-base']
    },
    {
      name: 'data-teardown-candidate-journey',
      testMatch: /candidate-journey\.teardown\.ts/,
      // reason: candidate-journey.teardown.ts performs no prefix delete (it only calls unregisterCandidate — CR-02), so there is no runTeardownAsserted accounting to mask here. Set to 0 anyway for consistency with every other data-teardown-* project, so a future edit that adds a delete + runTeardownAsserted call to this file inherits the non-retrying posture by default rather than needing a new opt-in.
      retries: 0
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
    // Chained sequentially among themselves (perm-access-disable → perm-per-app-notifications) per the perm-* family precedent. The former per-app maintenance pair (voter-app + candidate-app disable) was CONSOLIDATED into the single perm-access-disable node, which re-seeds the app_settings singleton per access mode in-spec.
    //
    // Parallel-safety: each perm template uses a distinct externalIdPrefix ('e2e-perm-access-disable-', 'e2e-perm-notif-'), and each setup passes `extraTeardownPrefix: ['test-', 'e2e-perm-']` to pre-clear any residual rows from prior chains still mid-teardown.

    // perm-access-disable (3 tests: voterApp / candidateApp / underMaintenance) — anchored on perm-not-located-2e2cg so the whole perm family is one linear sequence running strictly after the journeys. Single linear ordering eliminates all cross-chain coexistence on the shared single DB + app_settings singleton. (Takes the chain position the former voter-app-disable node occupied.)
    {
      name: 'data-setup-perm-access-disable',
      testMatch: /perm-access-disable\.setup\.ts/,
      teardown: 'data-teardown-perm-access-disable',
      dependencies: ['perm-not-located-2e2cg']
    },
    {
      name: 'data-teardown-perm-access-disable',
      testMatch: /perm-access-disable\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
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
    // The chain (and the perm family's anchor on the journey leaves) is load-bearing for the FULL `yarn test:e2e` run: every perm setup overwrites the single global `app_settings` row (setupFromTemplate → Writer Pass-5), so a perm setup must never run while a journey or another perm spec is reading it. That ordering is what makes `--project=perm-per-app-notifications` pull in voter-journey + the whole perm chain.
    //
    // To verify just these 2 tests in isolation (skips the journeys + perm chain), run the REAL setup project then the spec, both with --no-deps:
    //   yarn test:e2e --project=data-setup-perm-per-app-notifications --no-deps
    //   yarn test:e2e --project=perm-per-app-notifications --no-deps
    // (--no-deps reproduces the exact full-suite setup state without the chain; run `yarn db:reset` afterwards to drop the standalone seed.)
    {
      name: 'data-setup-perm-per-app-notifications',
      testMatch: /perm-per-app-notifications\.setup\.ts/,
      teardown: 'data-teardown-perm-per-app-notifications',
      dependencies: ['perm-access-disable']
    },
    {
      name: 'data-teardown-perm-per-app-notifications',
      testMatch: /perm-per-app-notifications\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-per-app-notifications',
      testDir: './tests/specs/perm',
      testMatch: /perm-per-app-notifications\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-per-app-notifications']
    },

    // perm-missing-nominations (1 test) — sequential after perm-per-app-notifications. app_settings singleton clobbering risk forces sequential chains within the perm family.
    {
      name: 'data-setup-perm-missing-nominations',
      testMatch: /perm-missing-nominations\.setup\.ts/,
      teardown: 'data-teardown-perm-missing-nominations',
      dependencies: ['perm-per-app-notifications']
    },
    {
      name: 'data-teardown-perm-missing-nominations',
      testMatch: /perm-missing-nominations\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-missing-nominations',
      testDir: './tests/specs/perm',
      testMatch: /perm-missing-nominations\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-missing-nominations']
    },

    // perm-localisation-positive (1 test). Operates against the 3-locale staticSettings base (en/fi/sv) directly — no runtime override. Sequential after perm-missing-nominations; app_settings singleton clobbering risk forces sequential chains within the perm family.
    {
      name: 'data-setup-perm-localisation-positive',
      testMatch: /perm-localisation-positive\.setup\.ts/,
      teardown: 'data-teardown-perm-localisation-positive',
      dependencies: ['perm-missing-nominations']
    },
    {
      name: 'data-teardown-perm-localisation-positive',
      testMatch: /perm-localisation-positive\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
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
    // app_settings JSONB singleton clobbering forces a sequential chain — no parallel execution within the perm-* family.
    //
    // Chain order:
    //   perm-localisation-positive → perm-answers-locked → perm-hide-hero
    //     → perm-show-feedback-survey → perm-header-show-help
    //     → perm-hide-all-nominations → perm-hide-if-missing-answers
    //     → perm-hide-election-tags → perm-hide-category-tags
    //     → perm-disable-allow-open (END)
    // ===================================================================

    // A1 — perm-answers-locked. Full 3-surface coverage. Setup mints a per-perm storage state via real forceRegister + UI login, consumed by the authenticated sub-tests in perm-answers-locked.spec.ts.
    {
      name: 'data-setup-perm-answers-locked',
      testMatch: /perm-answers-locked\.setup\.ts/,
      teardown: 'data-teardown-perm-answers-locked',
      dependencies: ['perm-localisation-positive']
    },
    {
      name: 'data-teardown-perm-answers-locked',
      testMatch: /perm-answers-locked\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
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
      testMatch: /perm-hide-hero\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-hide-hero',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-hero\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-hero']
    },

    // A3 — perm-show-feedback-survey. Unauthenticated voter intro + Banner header-feedback assertion + feedback-form open, EXTENDED with the results-view feedback/survey popup-coordination assertions (placement, timing/once, no-double-pop, dismiss-persistence) + the survey.showIn[] per-surface audit. Renamed in place from the former header-show-feedback node — KEEPS its position after perm-hide-hero.
    {
      name: 'data-setup-perm-show-feedback-survey',
      testMatch: /perm-show-feedback-survey\.setup\.ts/,
      teardown: 'data-teardown-perm-show-feedback-survey',
      dependencies: ['perm-hide-hero']
    },
    {
      name: 'data-teardown-perm-show-feedback-survey',
      testMatch: /perm-show-feedback-survey\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-show-feedback-survey',
      testDir: './tests/specs/perm',
      testMatch: /perm-show-feedback-survey\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-show-feedback-survey']
    },

    // A4 — perm-header-show-help. Unauthenticated voter intro + Banner header-help button + /en/about URL assertion.
    {
      name: 'data-setup-perm-header-show-help',
      testMatch: /perm-header-show-help\.setup\.ts/,
      teardown: 'data-teardown-perm-header-show-help',
      dependencies: ['perm-show-feedback-survey']
    },
    {
      name: 'data-teardown-perm-header-show-help',
      testMatch: /perm-header-show-help\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-header-show-help',
      testDir: './tests/specs/perm',
      testMatch: /perm-header-show-help\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-header-show-help']
    },

    // A5 — perm-hide-all-nominations. Unauthenticated; spec asserts on the 307 redirect from /en/nominations to /en.
    {
      name: 'data-setup-perm-hide-all-nominations',
      testMatch: /perm-hide-all-nominations\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-all-nominations',
      dependencies: ['perm-header-show-help']
    },
    {
      name: 'data-teardown-perm-hide-all-nominations',
      testMatch: /perm-hide-all-nominations\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-hide-all-nominations',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-all-nominations\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-all-nominations']
    },

    // A6 — perm-hide-if-missing-answers. Voter walk asserts ONLY on candidate visibility (no org count assertion).
    {
      name: 'data-setup-perm-hide-if-missing-answers',
      testMatch: /perm-hide-if-missing-answers\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-if-missing-answers',
      dependencies: ['perm-hide-all-nominations']
    },
    {
      name: 'data-teardown-perm-hide-if-missing-answers',
      testMatch: /perm-hide-if-missing-answers\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-hide-if-missing-answers',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-if-missing-answers\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-if-missing-answers']
    },

    // A7 — perm-hide-election-tags. Voter walk → /questions asserts absence of the election-tag testid.
    {
      name: 'data-setup-perm-hide-election-tags',
      testMatch: /perm-hide-election-tags\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-election-tags',
      dependencies: ['perm-hide-if-missing-answers']
    },
    {
      name: 'data-teardown-perm-hide-election-tags',
      testMatch: /perm-hide-election-tags\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-hide-election-tags',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-election-tags\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-election-tags']
    },

    // A8 — perm-hide-category-tags. Voter walk → /questions asserts absence of the category-tag testid.
    {
      name: 'data-setup-perm-hide-category-tags',
      testMatch: /perm-hide-category-tags\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-category-tags',
      dependencies: ['perm-hide-election-tags']
    },
    {
      name: 'data-teardown-perm-hide-category-tags',
      testMatch: /perm-hide-category-tags\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-hide-category-tags',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-category-tags\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-category-tags']
    },

    // A9 — perm-disable-allow-open. Two describe blocks: candidate-side authenticated (via storage state minted in setup) + voter-side unauthenticated /results walk.
    {
      name: 'data-setup-perm-disable-allow-open',
      testMatch: /perm-disable-allow-open\.setup\.ts/,
      teardown: 'data-teardown-perm-disable-allow-open',
      dependencies: ['perm-hide-category-tags']
    },
    {
      name: 'data-teardown-perm-disable-allow-open',
      testMatch: /perm-disable-allow-open\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-disable-allow-open',
      testDir: './tests/specs/perm',
      testMatch: /perm-disable-allow-open\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disable-allow-open']
    },

    // A10 — perm-question-video. Voter visibility matrix (video on q1/q3/q5 only, none on q2/q4 or any category intro) + candidate hideVideo slice (authenticated via a storage state minted in setup). Appended to the perm tail after perm-disable-allow-open.
    {
      name: 'data-setup-perm-question-video',
      testMatch: /perm-question-video\.setup\.ts/,
      teardown: 'data-teardown-perm-question-video',
      dependencies: ['perm-disable-allow-open']
    },
    {
      name: 'data-teardown-perm-question-video',
      testMatch: /perm-question-video\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-question-video',
      testDir: './tests/specs/perm',
      testMatch: /perm-question-video\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-question-video']
    },

    // A11 — perm-interactive-info. Voter questions-flow info matrix: popup-modal mode (interactiveInfo.enabled=true, shipped default) vs the static-expander mode (per-question re-seed), plus customData.infoSections and per-type arguments (Likert/Boolean/Categorical). Unauthenticated voter slice → no storage state. Appended to the perm tail after perm-question-video.
    {
      name: 'data-setup-perm-interactive-info',
      testMatch: /perm-interactive-info\.setup\.ts/,
      teardown: 'data-teardown-perm-interactive-info',
      dependencies: ['perm-question-video']
    },
    {
      name: 'data-teardown-perm-interactive-info',
      testMatch: /perm-interactive-info\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-interactive-info',
      testDir: './tests/specs/perm',
      testMatch: /perm-interactive-info\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-interactive-info']
    },

    // A12 — perm-org-matching. Voter results-flow organization-match matrix: matching.organizationMatching none / answersOnly / impute, re-seeded per mode. PRIMARY: exact per-mode org match scores (none → no score; answersOnly → org's own answers only, blanks penalised polar-opposite; impute → member-imputed, differs from answersOnly). SECONDARY: About-page org-matching disclosure per mode. Unauthenticated voter slice → no storage state (the results path answers in-test). Appended to the perm tail after perm-interactive-info.
    {
      name: 'data-setup-perm-org-matching',
      testMatch: /perm-org-matching\.setup\.ts/,
      teardown: 'data-teardown-perm-org-matching',
      dependencies: ['perm-interactive-info']
    },
    {
      name: 'data-teardown-perm-org-matching',
      testMatch: /perm-org-matching\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'perm-org-matching',
      testDir: './tests/specs/perm',
      testMatch: /perm-org-matching\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-org-matching']
    },

    // perm-analytics-tracking. Voter analytics-tracking emission matrix: the analytics overlay (analytics.platform.name='umami', trackEvents=true) is a singleton-clobbering app_settings node, so the tracking-payload spec (voter-prefs-tracking) is hosted HERE under its own armed singleton rather than as a base leaf. Setup depends on the previous perm SPEC (perm-org-matching, the verified tail) to preserve the strict serial chain over the shared app_settings singleton. Unauthenticated voter slice → no minted storage state. Appended to the perm tail after perm-org-matching.
    {
      name: 'data-setup-perm-analytics-tracking',
      testMatch: /perm-analytics-tracking\.setup\.ts/,
      teardown: 'data-teardown-perm-analytics-tracking',
      dependencies: ['perm-org-matching']
    },
    {
      name: 'data-teardown-perm-analytics-tracking',
      testMatch: /perm-analytics-tracking\.teardown\.ts/,
      // reason: the F3 accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
      retries: 0
    },
    {
      name: 'voter-prefs-tracking',
      testDir: './tests/specs/voter',
      testMatch: /voter-prefs-tracking\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-analytics-tracking']
    },

    // =========================================================================
    // ADMIN APP — the first end-to-end coverage this application has ever had.
    //
    // WHY IT JOINS THE TAIL OF THE PERM SERIAL CHAIN. `data-setup-admin-auth` takes the SAME dependency edge `data-setup-bank-auth-journey` takes — `['voter-prefs-tracking']`, the chain's last project — for the same reason recorded there by explicit operator decision: standing alone buys a fast isolated gate at the cost of `app_settings` singleton safety, and the singleton wins. The concrete hazard for THIS spec is `perm-access-disable`, which re-seeds the singleton per sub-test through `access.underMaintenance: true` — under which `routes/admin/+layout.svelte` renders `MaintenancePage` instead of the admin shell and every assertion below would be about a maintenance page. The accepted cost is that an isolated `--project=admin-access` run now pulls the whole chain and takes full-suite time rather than seconds. The measurement behind this is the phase record `158-ADMIN-E2E-SCHEDULING.md`.
    //
    // THE EXPLICIT `testMatch` IS NOT BOOKKEEPING — it is the same invariant spelled out on `a11y-smoke` above. `admin-access` declares `testDir: './tests/specs/admin'` and would otherwise collect any sibling spec added to that directory later and run it under the ADMIN storageState; and, symmetrically, a project without the stored session would run the admin spec unauthenticated, every admin route would 307 to the login form, and the run would report a confident clean nothing about a login page. That is the one direction in which this wiring can be silently wrong AND green.
    // =========================================================================
    {
      name: 'data-setup-admin-auth',
      testMatch: /admin-auth\.setup\.ts/,
      teardown: 'data-teardown-admin-access',
      dependencies: ['voter-prefs-tracking']
    },
    {
      name: 'data-teardown-admin-access',
      testMatch: /admin-access\.teardown\.ts/,
      // reason: mirrors the sibling data-teardown projects — a retry of a state-mutating teardown always observes an already-cleared state and passes, which would mask a partial removal.
      retries: 0
    },
    {
      name: 'admin-access',
      testDir: './tests/specs/admin',
      testMatch: /admin-access\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], storageState: ADMIN_STORAGE_STATE },
      dependencies: ['data-setup-admin-auth']
    }
  ],

  // Mock OIDC issuer for the bank-auth-journey (EFLOW-10b). PLAYWRIGHT_BANK_AUTH-gated so it NEVER spawns in the default suite. Playwright manages its lifecycle (start → wait-for-port → teardown). The readiness probe hits the issuer's HTTPS JWKS endpoint; `ignoreHTTPSErrors: true` is required because the issuer's cert is self-signed (CN=127.0.0.1). The issuer is self-contained (needs no app env), so spawning it from the Playwright worker is clean — the SvelteKit frontend server's IdP-pointing env is a SEPARATE operator responsibility (documented in IDURA-TEST-RUNBOOK.md, EFLOW-10b). `reuseExistingServer` outside CI lets a hand-started issuer be reused during local iteration.
  ...(process.env.PLAYWRIGHT_BANK_AUTH
    ? {
        webServer: {
          // Absolute path derived from TESTS_DIR (the `tests/tests` dir). The Playwright `webServer.command` is resolved relative to the config file's directory (`tests/`), so a bare `tests/tests/support/...`
          // relative path doubled into `tests/tests/tests/...` and failed to resolve (ERR_MODULE_NOT_FOUND). Using the absolute entry path makes the spawn cwd-independent.
          command: `npx tsx ${path.join(TESTS_DIR, 'support/mockOidcIssuerEntry.ts')}`,
          url: 'https://127.0.0.1:9443/.well-known/openid-configuration/jwks',
          ignoreHTTPSErrors: true,
          reuseExistingServer: !process.env.CI,
          timeout: 30_000
        }
      }
    : {})
});
