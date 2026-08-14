/**
 * EPERM-07 term-trigger intermittent — isolated hunt spec (Phase 138, D-03 — INTEG-01).
 *
 * Drives ONLY Base-1 → Base-2 → Base-3 and asserts the in-text <Term> trigger on
 * Base-3, so the ~1-in-8 DEF-135-04 event can be forced and observed in
 * single-digit seconds instead of inside a 648 s full-suite run. That is what
 * makes dozens of forcing attempts affordable (D-03's economics).
 *
 * Hypothesis under investigation (a HYPOTHESIS, not a conclusion — the live
 * ledger is `138-DIAGNOSIS.md` § Hypothesis ledger, and U-1 eliminated none of
 * the three): SvelteKit pushes the destination URL to history (client.js:1760)
 * BEFORE it swaps the DOM (client.js:1824), awaiting the `onNavigate` callbacks
 * in between (client.js:1779-1785) — and the root layout's callback
 * (+layout.svelte:161-172) resolves only inside `document.startViewTransition`'s
 * update callback, i.e. after Chrome has captured the outgoing snapshot. Base-2
 * carries no `customData.terms` (base.ts:828-838), so for the width of that
 * window the term trigger genuinely does not exist in the DOM. H2 (the render
 * gate at questions/+layout.svelte:257-258 transiently closing) and H3 (late
 * `customData.terms` at QuestionHeading.svelte:60-61) remain equally live; the
 * forensic tri-state below is what discriminates between all three.
 *
 * Negative-control posture: this spec is the INSTRUMENT the criterion-2 pair is
 * measured with, not the control itself. Plan 04 runs it twice under a
 * byte-identical forcing configuration — once against the pre-fix tree (must
 * FAIL) and once against the post-fix tree (must PASS). It therefore ships
 * permanently in the default suite (precedent: `cold-entry-dataroot`), and is
 * NOT tagged `@probe` — a `@probe` tag would exclude it from the root
 * `test:e2e` invocation and make it invisible to the 16-run determinism gate.
 *
 * FORCING KNOBS (D-01). All three are NEUTRAL BY CONSTRUCTION: with no
 * environment variable set, this file runs at the production element budget,
 * with no CPU throttle and no reduced-motion emulation. Neutrality is
 * structural, not remembered — there is nothing to revert after a hunt.
 *   EPERM07_FORCE_BUDGET_MS  element budget in ms for the term assertion
 *                            (default: TIMEOUTS.element, the production 2000 ms)
 *   EPERM07_FORCE_CPU_RATE   CDP CPU slowdown multiplier applied across the hop
 *                            (default: 1 = no throttle)
 *   EPERM07_NO_VT            'true' emulates prefers-reduced-motion: reduce,
 *                            which the app's own gate short-circuits on
 *                            (viewTransition.ts:28) — discriminator A, and it
 *                            needs no app change, so it cannot itself be the
 *                            cause of a flip (default: unset = transitions on)
 *
 * The two numeric knobs are parsed STRICTLY (see `forcedNumber`): unset or blank
 * means the production default, and a malformed or out-of-range value throws at
 * collection time. Neither may ever degrade to the most permissive setting — this
 * spec ships as a permanent regression guard, and a silently disarmed guard is
 * worse than a noisy one.
 *
 * Seed: `data-setup-base` (`e2e/base`). Voter routes are public (no auth); this
 * spec is READ-ONLY and has no teardown of its own.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is HARD — no
 * expect.soft, no try/catch around expect(), no .catch fallback on an
 * assertion-bearing interaction.
 *
 * CARVE-OUT, now DISCHARGED (Phase 138 plan 04, D-06). While the defect was under
 * investigation the post-hop settle (`settleOnUrlChangeAsProductionDoes`) was a
 * local re-implementation of the production helper's URL-only wait AND its
 * swallowed timeout, because reproducing the defect required reproducing the
 * settle rather than improving it. The operator authorised the test-side fix on
 * the recorded evidence, so the settle now delegates to the SHARED
 * `settleAfterClientNavigation` that `voter-journey.spec.ts` also uses: one
 * implementation, no drift, and this spec witnesses the production helper instead
 * of holding a private copy of the bug. The settle still bears no assertion of its
 * own — the hard assertion follows it. The pre-fix behaviour is not lost: it is on
 * the record as RUN 1 of `138-NEGATIVE-CONTROL.md` (5/5 failing).
 *
 * The `try { … } finally { … }` around the hop is a resource-release block for
 * the CDP session (a surviving throttle would distort every later test in the
 * same worker), not a `try/catch`: it swallows nothing and changes no outcome.
 */

import { expect, test } from '../../fixtures/voter/views';
import { walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { expectClientNavigation, TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import type { CDPSession, Page } from '@playwright/test';
import type { CaptureNavigationBaseline } from '../../helpers';

/**
 * Read a numeric forcing knob, or fall back to the PRODUCTION default. Never to
 * anything more permissive than production, and never silently.
 *
 * reason: (Phase 138 review WR-03) the file's neutrality contract above says
 * neutrality is structural rather than remembered, and `Number(process.env.X ??
 * default)` did not deliver that for anything except a strictly-unset variable.
 * `??` catches only `undefined`, so an EXPORTED-BUT-EMPTY variable — the ordinary
 * result of `env: X: ${{ inputs.budget }}` with no input, or of `X= yarn test:e2e`
 * — yielded `Number('') === 0`. For the budget knob Playwright reads `timeout: 0`
 * as NO TIMEOUT, silently converting this permanent regression guard's only
 * assertion into one that cannot fail on latency; for the CPU knob `0 <= 1` meant
 * the throttle was silently not applied, so an operator hunting "at rate 40" would
 * read a no-reproduction result off a run that had no throttle. A non-numeric
 * value was worse still: `Number('2s')` is `NaN`, whose Playwright timeout
 * semantics are undefined and which CDP serialises to `null`, killing the test
 * with a protocol error instead of a usage error.
 *
 * A blank value therefore means "unset" (production default), and a malformed one
 * FAILS LOUDLY at collection time, which is where a usage error belongs.
 *
 * @param name - environment variable name.
 * @param fallback - the production value used when the knob is unset or blank.
 * @param min - smallest accepted value; below it the knob would be inert or
 *   more permissive than production, which must never happen quietly.
 */
function forcedNumber(name: string, fallback: number, min: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < min) {
    throw new Error(`${name} must be a finite number >= ${min} (got '${raw}')`);
  }
  return parsed;
}

// FORCING BUDGET — file-local, env-defaulted to the shared production budget.
// reason: D-01's negative-control knob. It is scoped to THIS file by
// construction, so no other spec's budget can be perturbed by this phase; the
// shared TIMEOUTS.element default is NEVER edited (its own docblock,
// timeouts.ts:16-21, forbids moving it, and it is shared with the Playwright
// config and 88 suite files). With the variable unset this resolves to the
// production 2000 ms, so the COMMITTED file is neutral. `min: 1` because a
// budget of 0 is Playwright's "no timeout" — the one value that disarms the
// instrument outright.
const FORCED_ELEMENT_BUDGET = forcedNumber('EPERM07_FORCE_BUDGET_MS', TIMEOUTS.element, 1);

// CDP slowdown multiplier for the hop under test (1 = no throttle).
// reason: D-01's amplifier. Same file-local, env-defaulted construction —
// unset means rate 1, which is the browser's normal scheduling. `min: 1` because
// `Emulation.setCPUThrottlingRate` accepts no slowdown below 1, and a sub-1 value
// would be dropped by `applyCpuThrottleKnob` — an unapplied throttle the operator
// would never be told about.
const FORCED_CPU_RATE = forcedNumber('EPERM07_FORCE_CPU_RATE', 1, 1);

// Discriminator A: emulate prefers-reduced-motion so the app's own
// `shouldAnimate` gate (viewTransition.ts:28) short-circuits and no View
// Transition plays.
// reason: explicit string compare, not bare truthiness — `EPERM07_NO_VT=false`
// must mean OFF. Matches the only boolean-env precedent in the suite
// (setupFromTemplate.ts:98, `=== 'true'`); bare truthiness is out of convention.
const FORCED_NO_VT = process.env.EPERM07_NO_VT === 'true';

// Heading / category text gates. ASCII-only substrings on purpose: the seeded
// titles carry a U+2014 em dash ("Base opinion 3 — Likert 7") and are expanded
// across four locales in base.ts, and neither may be allowed to decide whether
// this spec can find its way to Base-3.
const CATEGORY_BASE_OPINION = /Base Opinion Questions/i;
const HEADING_BASE_1 = /Base opinion 1/i;
const HEADING_BASE_2 = /Base opinion 2/i;

/** The forensic tri-state recorded at the instant of assertion (RESEARCH §R2.4-C). */
type ForensicState = {
  pathname: string;
  /** `querySelectorAll` length — an absent heading reads as 0, it does not throw. */
  headingCount: number;
  /** `null` when no heading element exists at all — distinct from an empty string. */
  headingText: string | null;
  triggerCount: number;
};

/**
 * Use the production navigation settle — now the SHARED
 * `settleAfterClientNavigation` (`helpers/navigation.ts`), which
 * `voter-journey.spec.ts:186` also calls.
 *
 * reason: (Phase 138, D-06 — INTEG-01) this used to be a local re-implementation
 * of the production helper's URL-only wait and swallowed timeout, because
 * reproducing the defect required reproducing the settle. Now that the settle is
 * FIXED, a local copy would be a copy of the defect: the instrument would keep
 * failing after the production fix landed, and — worse in the long run — would
 * stop witnessing `voter-journey.spec.ts` entirely, so a revert of the production
 * fix would not be caught here. Delegating to the shared helper is what makes
 * this spec a permanent regression test for that helper rather than a museum of
 * the bug. Negative control: `138-NEGATIVE-CONTROL.md`.
 *
 * The `capture` callback the action receives records the settle's baseline
 * (URL + landmark text) at the LAST instant before the navigating click, which is
 * the only instant at which the DOM is known to be on the page being left (Phase
 * 138 review WR-01). The mechanism is on `expectClientNavigation`; this wrapper
 * exists only to keep the spec's own naming, and delegating means the instrument
 * cannot drift from the production walk.
 */
async function settleOnUrlChangeAsProductionDoes(
  page: Page,
  action: (capture: CaptureNavigationBaseline) => Promise<void>
): Promise<void> {
  await expectClientNavigation(page, action);
}

/**
 * Gate on `text` as THIS question's heading, then click its LAST answer option.
 *
 * Does NOT settle afterwards — the caller owns the settle, because on the hop
 * under test the settle IS the thing being reproduced. It DOES own the settle's
 * baseline: `capture()` runs after the heading gate and immediately before the
 * click, which is the only instant at which the DOM is known to be on the
 * question we are leaving (Phase 138 review WR-01).
 *
 * The option locator is scoped to the current question id rather than page-wide:
 * on a Q→Q nav the outgoing question's options can linger in the DOM for a frame
 * after the heading has already updated, so a page-wide count would be stale
 * (the mechanism documented at voter-journey.spec.ts:255-265).
 */
async function gateOnQuestionAndAnswerLastOption(
  page: Page,
  text: RegExp,
  capture: CaptureNavigationBaseline
): Promise<void> {
  await expect(page.getByTestId(testIds.voter.questions.heading)).toHaveText(text, { timeout: TIMEOUTS.element });

  const questionId = new URL(page.url()).pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() ?? '';
  // reason: a testid+name conjunction is not expressible via getByTestId/getByRole;
  // mirrors the identical scoped locator at voter-journey.spec.ts:267.
  // eslint-disable-next-line playwright/no-restricted-locators
  const answerOptions = page.locator(
    `[data-testid="${testIds.voter.questions.answerOption}"][name="questionChoices-${questionId}"]`
  );
  await expect(answerOptions.first()).toBeVisible({ timeout: TIMEOUTS.element });

  const nOptions = await answerOptions.count();
  await capture();
  await answerOptions.nth(nOptions - 1).click();
}

/** Advance past the Base-Opinion category intro (`categoryIntros.show` is on for e2e/base). */
async function advancePastBaseCategoryIntro(page: Page): Promise<void> {
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
  await expect(page.getByTestId(testIds.voter.questions.categoryIntro)).toHaveText(CATEGORY_BASE_OPINION, {
    timeout: TIMEOUTS.element
  });
  await expect(categoryStart).toBeVisible({ timeout: TIMEOUTS.element });

  await settleOnUrlChangeAsProductionDoes(page, async (capture) => {
    await capture();
    await categoryStart.click();
  });
}

/**
 * Emulate reduced motion when the knob is on. Module scope so the conditional
 * stays out of the test body (playwright/no-conditional-in-test).
 */
async function applyReducedMotionKnob(page: Page): Promise<void> {
  if (!FORCED_NO_VT) return;
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

/** Open a CDP session and apply the slowdown, or return null when the knob is neutral. */
async function applyCpuThrottleKnob(page: Page): Promise<CDPSession | null> {
  if (FORCED_CPU_RATE <= 1) return null;
  const client: CDPSession = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: FORCED_CPU_RATE });
  return client;
}

/**
 * Reset the rate to 1 and detach. Called UNCONDITIONALLY from a `finally`: a
 * throttle surviving this test would distort every later test in the same worker.
 */
async function releaseCpuThrottle(client: CDPSession | null): Promise<void> {
  if (!client) return;
  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await client.detach();
}

/**
 * Read the tri-state that discriminates H1 / H2 / H3 (RESEARCH §R2.4-C).
 *
 * `headingCount` is a `querySelectorAll` LENGTH, so an absent heading is
 * observed as `0` rather than as a thrown locator error — H2's verdict is
 * selected on that zero, never on an exception. `headingText` is independently
 * nullable, so "no heading element" and "heading with empty text" stay distinct
 * observations.
 */
async function readForensicState(page: Page): Promise<ForensicState> {
  return page.evaluate(
    ({ headingId, triggerId }) => ({
      pathname: location.pathname,
      headingCount: document.querySelectorAll(`[data-testid="${headingId}"]`).length,
      headingText: document.querySelector(`[data-testid="${headingId}"]`)?.textContent ?? null,
      triggerCount: document.querySelectorAll(`[data-testid="${triggerId}"]`).length
    }),
    { headingId: testIds.voter.questions.heading, triggerId: testIds.voter.questions.termTrigger }
  );
}

test.describe('eperm07-term-trigger', () => {
  test('the Base-3 in-text term trigger is present when the URL says we are on Base-3', async ({
    page,
    voterQuestionsPage
  }) => {
    // Discriminator A, applied BEFORE any navigation so no hop plays a transition.
    await applyReducedMotionKnob(page);

    // Walk to the questions flow. `walkUntilQuestionsIntro` installs the
    // data-consent addLocatorHandler guard, whose absence was itself a
    // documented full-suite flake — do not hand-roll this walk.
    await walkUntilQuestionsIntro(page);
    await voterQuestionsPage.clickStart();
    await advancePastBaseCategoryIntro(page);

    // Base-1 → Base-2. Not the hop under test: settle it fully so the throttle
    // below is scoped to the transition being measured and nothing else.
    await settleOnUrlChangeAsProductionDoes(page, (capture) =>
      gateOnQuestionAndAnswerLastOption(page, HEADING_BASE_1, capture)
    );

    const client = await applyCpuThrottleKnob(page);
    try {
      // THE HOP UNDER TEST — Base-2 → Base-3, driven IN-APP by answering
      // Base-2. Never by `goto`: a hard navigation would bypass the client
      // router ordering that H1 names as the mechanism.
      await settleOnUrlChangeAsProductionDoes(page, (capture) =>
        gateOnQuestionAndAnswerLastOption(page, HEADING_BASE_2, capture)
      );

      // Record the tri-state BEFORE the assertion, so a NEAR-MISS (a run that
      // passed at 1.9 s of a 2 s budget) is captured as data too — not only a
      // failure. The annotation rides in results.json for plans 02-05.
      const forensic = await readForensicState(page);
      test.info().annotations.push({ type: 'eperm07-state', description: JSON.stringify(forensic) });

      // The assertion under investigation, at the file-local budget. Matched by
      // exact data-testid equality, never by rendered text.
      await expect(page.getByTestId(testIds.voter.questions.termTrigger).first()).toBeVisible({
        timeout: FORCED_ELEMENT_BUDGET
      });
    } finally {
      await releaseCpuThrottle(client);
    }
  });
});
