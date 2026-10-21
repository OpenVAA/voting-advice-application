/**
 * @file Composition root for the EFLOW-10b bank-auth journey fixtures.
 *
 * Sibling to `contestant-journey.ts` (the full candidate composition root).
 * Kept MINIMAL — wires only the fixtures the bank-auth journey spec (`contestant-bank-auth-journey.spec.ts`) consumes: the preregister page-object (elections → constituencies → email/ToU walk), the `emailBucket` (for the preregistration invite email round-trip), and the `contestantPasswordSetter` (for the set-password step after the registration link).
 *
 * Surface:
 *   - `test`   — Playwright test extended with the 3 journey fixtures + a `recipientEmail` option fixture wired through `emailBucket`.
 *   - `expect` — re-exported from @playwright/test.
 *
 * Usage (illustrative):
 * ```ts
 * import { test, expect } from '../../fixtures/contestant/contestant-bank-auth-journey';
 *
 * test.use({ recipientEmail: BANK_AUTH_JOURNEY_EMAIL });
 *
 * test('bank-auth round trip', async ({ contestantPreregisterPage, emailBucket, contestantPasswordSetter }) => {
 *   await contestantPreregisterPage.clickStart();
 *   // ...
 *   await emailBucket.expectEmail(/invite/i);
 *   await contestantPasswordSetter.setPassword('...');
 * });
 * ```
 *
 * **Rigidity contract:** no soft assertions, no try/catch wrapping assertions, no swallowed-rejection fallbacks on assertion-bearing locator interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createContestantPasswordSetter } from './contestantPasswordSetter.fixture';
import { createContestantPreregisterPage } from './contestantPreregisterPage.fixture';
import { BANK_AUTH_JOURNEY_EMAIL } from '../../utils/bankAuthJourneyConstants';
import { createEmailBucket } from '../shared/emailBucket.fixture';
import type { EmailBucketFixture } from '../shared/emailBucket.fixture';
import type { ContestantPasswordSetterFixture } from './contestantPasswordSetter.fixture';
import type { ContestantPreregisterPageFixture } from './contestantPreregisterPage.fixture';

type BankAuthJourneyFixtureOptions = {
  /**
   * The Mailpit recipient address for the emailBucket fixture. The spec sets this via `test.use({ recipientEmail: '...' })` at file scope. Default: `'bank-auth-journey@test.openvaa.local'` — the journey-owned address the preregistration invite email is sent to and the bank-auth-journey teardown cleans up (no pre-seeded candidate row carries it; the journey creates the auth user itself via the identity-callback + invite flow).
   */
  recipientEmail: string;
};

type BankAuthJourneyFixtures = BankAuthJourneyFixtureOptions & {
  emailBucket: EmailBucketFixture;
  contestantPreregisterPage: ContestantPreregisterPageFixture;
  contestantPasswordSetter: ContestantPasswordSetterFixture;
};

export const test = base.extend<BankAuthJourneyFixtures>({
  recipientEmail: [BANK_AUTH_JOURNEY_EMAIL, { option: true }],

  emailBucket: async ({ page, recipientEmail }, use) => {
    await use(createEmailBucket(page, recipientEmail));
  },
  contestantPreregisterPage: async ({ page }, use) => {
    await use(createContestantPreregisterPage(page));
  },
  contestantPasswordSetter: async ({ page }, use) => {
    await use(createContestantPasswordSetter(page));
  }
});

export { expect };
