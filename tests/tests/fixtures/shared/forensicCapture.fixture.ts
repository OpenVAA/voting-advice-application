/**
 * @file forensicCapture fixture (Phase 138, D-11 — INTEG-01).
 *
 * Browser-side forensic capture for the DEF-135-04 / EPERM-07 term-trigger
 * intermittent: every `console` message, every uncaught `pageerror`, and every
 * `requestfailed` on the page, each stamped with an ISO-8601 timestamp and
 * attached to the test result on teardown.
 *
 * ## Why it exists
 *
 * The EPERM-07 failure is a ~1-in-8 LATENCY signal, not an absence signal
 * (`deferred-items.md` § DEF-135-04: the post-failure page snapshot SHOWS the
 * trigger). `trace: 'on'` (playwright.config.ts:133) records what the test
 * asserted; it does not record what the page was doing — a late-arriving fetch,
 * a client-side error during the Base-2 → Base-3 hop, or a failed request that
 * stalled the render are all invisible in a trace alone. Phase 138 task 1
 * established that the ORIGINAL occurrence's evidence is unrecoverable
 * (`138-DIAGNOSIS.md` § U-1) precisely because no such capture existed. This
 * fixture is the fix for the next occurrence.
 *
 * ## Surface
 *  - `ForensicLog`            — the captured transcripts: `consoleLines` and
 *                               `failedRequests`, both ISO-8601-stamped.
 *  - `attachForensicCapture(page)` — register the three listeners on a page and
 *                               return the (initially empty) log they fill.
 *  - `flushForensicCapture(log, testInfo)` — attach each NON-EMPTY transcript to
 *                               the test result as `console.log` /
 *                               `requestfailed.log` (`text/plain`), so the
 *                               transcripts land in the HTML report next to the
 *                               trace with no new directory convention.
 *
 * ## Deliberate divergence from the standing `fixtures/shared/*` convention
 *
 * Every other file under `tests/tests/fixtures/shared/` states in its own
 * docblock that it is NOT extended into a composition root (see
 * `video.fixture.ts:6`, `popupNotice.fixture.ts:6`) — call sites import the
 * factory directly. THIS FILE DELIBERATELY DIVERGES: it is registered as an
 * `auto: true` fixture on the voter composition root
 * (`tests/tests/fixtures/voter/views.ts`), so all 16 spec files importing that
 * root capture with no per-spec opt-in.
 *
 * The reason is the v2.14 cardinal-rule waiver's own condition 3 — "the next
 * occurrence is data". A recurrence during ANY later v2.15 phase's suite run
 * must leave evidence behind, and that cannot depend on someone having
 * remembered to opt the right spec in beforehand. The 16-file reach is the
 * intended coverage, not a side effect. Cost is two event listeners plus one
 * `pageerror` listener per page and no behaviour change.
 *
 * **Rigidity contract**: no `expect.soft`, no `try/catch` wrapping
 * `expect(...)`, no `.catch(() => null)` on assertion-bearing interactions.
 * This fixture performs no assertions itself (it is a capture seam) — the
 * consuming spec, or a human reading the attachments after a failure, does the
 * interpreting.
 */

import type { ConsoleMessage, Page, Request, TestInfo } from '@playwright/test';

/** The two transcripts captured from one page, in arrival order. */
export type ForensicLog = {
  /** `console` messages and uncaught `pageerror`s, ISO-8601-stamped. */
  consoleLines: Array<string>;
  /** `requestfailed` events with method, URL and Playwright's error text. */
  failedRequests: Array<string>;
};

/**
 * Register the capture listeners on `page` and return the log they fill.
 *
 * Call BEFORE the page navigates, or events emitted during the first
 * navigation are lost. The returned object is mutated in place by the
 * listeners for the lifetime of the page.
 */
export function attachForensicCapture(page: Page): ForensicLog {
  const log: ForensicLog = { consoleLines: [], failedRequests: [] };

  page.on('console', (msg: ConsoleMessage) => {
    log.consoleLines.push(`[${new Date().toISOString()}] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', (err: Error) => {
    log.consoleLines.push(`[${new Date().toISOString()}] pageerror: ${err.message}`);
  });

  page.on('requestfailed', (req: Request) => {
    log.failedRequests.push(
      `[${new Date().toISOString()}] ${req.method()} ${req.url()} — ${req.failure()?.errorText ?? 'unknown'}`
    );
  });

  return log;
}

/**
 * Attach the captured transcripts to the test result.
 *
 * Each transcript is attached ONLY when it is non-empty. A green 16-run
 * determinism batch is ~2000 test results; attaching two empty files to each
 * would bury the one attachment that matters under ~4000 that do not, and
 * inflate every per-run HTML report for no evidentiary gain.
 */
export async function flushForensicCapture(log: ForensicLog, testInfo: TestInfo): Promise<void> {
  if (log.consoleLines.length > 0) {
    await testInfo.attach('console.log', { body: log.consoleLines.join('\n'), contentType: 'text/plain' });
  }
  if (log.failedRequests.length > 0) {
    await testInfo.attach('requestfailed.log', { body: log.failedRequests.join('\n'), contentType: 'text/plain' });
  }
}
