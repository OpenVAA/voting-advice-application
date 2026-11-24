/**
 * Central semantic timeout buckets for the e2e suite.
 *
 * Single source of truth for spec timeouts: bucket values are the MAX observed across the suite's specs so consolidation never tightens an existing budget.
 *
 * Bucket semantics:
 *   - element:  per-element visibility / enabled budget — a wait that does NOT change the URL (e.g. an option mounts, a button enables).
 *   - click:    action-ack budget — the click registered, a dropdown opened, a modal dismissed.
 *   - page:     URL-change / route-transition wait (a single navigation).
 *   - slowPage: multi-network-roundtrip + render boundary; cold-start friendly (cold deeplink, accordion re-render, /results landing after a long walk). Use sparingly.
 *   - testMax:  per-test TOTAL ceiling, used as the playwright.config global `timeout`: 90s locally, 180s on GitHub Actions or a declared slow host (see ON_GITHUB_ACTIONS and ON_SLOW_HOST). A per-test budget ABOVE this value is a NO-OP unless the spec calls `test.setTimeout(...)`, and any value above it must stay inline at the call site as a named `// reason:` exception (see voter-journey 240s; perm-localisation-positive's 180s is above the local value and equal to the GitHub Actions one). A `test.setTimeout(...)` at or below the ceiling is written in terms of `TIMEOUTS.testMax`, as in `TIMEOUTS.testMax / 2`, so that the GitHub Actions value reaches it. Raise either default only with a measured reason, recorded beside it.
 *
 * @see tests/playwright.config.ts (global `timeout: TIMEOUTS.testMax`)
 */

/**
 * True on a GitHub Actions runner. GitHub sets `GITHUB_ACTIONS=true` on every job, and it reaches Playwright even when the suite runs through `tests/scripts/e2e-run.sh`, which unsets `CI`. It is unset on a developer machine.
 */
const ON_GITHUB_ACTIONS = process.env.GITHUB_ACTIONS === 'true';

/**
 * True when `E2E_SLOW_HOST=1` declares a host too small for the developer-machine posture, such as a 4-CPU cloud container. Such a host gets the GitHub Actions ceiling here and three workers in playwright.config. Unset everywhere else, so neither default changes.
 */
export const ON_SLOW_HOST = process.env.E2E_SLOW_HOST === '1';

export const TIMEOUTS = {
  /** Per-element visibility/enabled budget (no URL change). */
  element: 2_000,
  /** Action-ack budget (click registered, dropdown opened, modal dismissed). */
  click: 2_000,
  /** URL-change / route-transition wait (single navigation). */
  page: 5_000,
  /** Multi-network-roundtrip + render boundary; cold-start friendly. Use sparingly. */
  slowPage: 10_000,
  /**
   * Per-test total ceiling, and the playwright.config global timeout. Values above this require an inline `test.setTimeout(...)` + `// reason:` exception.
   *
   * reason: 180s on GitHub Actions, 90s locally. The 4-CPU Actions runner runs the suite 4-5x slower than a developer machine: in CI run 36463977144 `voter-alliance` took 95s (21s locally) and seven other answered-walk tests took 78-89s (16-21s locally).
   * A declared slow host gets the same ceiling: on a 4-CPU cloud container `contestant-journey`'s walk took 75s with nothing else running and exceeded 90s in every full run, at 6 workers and at 3.
   */
  testMax: ON_GITHUB_ACTIONS || ON_SLOW_HOST ? 180_000 : 90_000
} as const;
