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
 *   - testMax:  per-test TOTAL ceiling. This MATCHES the playwright.config global `timeout` ceiling (90s). A per-test budget ABOVE this value is a NO-OP unless the spec calls `test.setTimeout(...)`, and any value above 90s must stay inline at the call site as a named `// reason:` exception (see perm-localisation-positive 180s and voter-journey 120s). Do NOT raise this default.
 *
 * @see tests/playwright.config.ts (global `timeout: 90000` — same ceiling as testMax)
 */
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
   * Per-test total ceiling. Matches the playwright.config global timeout (90s).
   * Values above this require an inline `test.setTimeout(...)` + `// reason:` exception.
   */
  testMax: 90_000
} as const;
