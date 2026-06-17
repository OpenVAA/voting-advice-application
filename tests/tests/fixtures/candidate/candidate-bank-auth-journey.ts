/**
 * @file Composition root for the EFLOW-10b bank-auth journey fixtures.
 *
 * Sibling to `candidate-journey.ts` (the full candidate composition root).
 * Kept MINIMAL — wires only the fixtures the bank-auth journey spec
 * (`candidate-bank-auth-journey.spec.ts`, plan 122-05) consumes: the
 * preregister page-object (elections → constituencies → email/ToU walk),
 * the `emailBucket` (for the preregistration invite email round-trip), and
 * the `candidatePasswordSetter` (for the set-password step after the
 * registration link).
 *
 * Surface:
 *   - `test`   — Playwright test extended with the 3 journey fixtures + a
 *                `recipientEmail` option fixture wired through `emailBucket`.
 *   - `expect` — re-exported from @playwright/test.
 *
 * Usage (illustrative):
 * ```ts
 * import { test, expect } from '../../fixtures/candidate/candidate-bank-auth-journey';
 *
 * test.use({ recipientEmail: BANK_AUTH_JOURNEY_EMAIL });
 *
 * test('bank-auth round trip', async ({ candidatePreregisterPage, emailBucket, candidatePasswordSetter }) => {
 *   await candidatePreregisterPage.clickStart();
 *   // ...
 *   await emailBucket.expectEmail(/invite/i);
 *   await candidatePasswordSetter.setPassword('...');
 * });
 * ```
 *
 * **Rigidity contract:** no soft assertions, no try/catch wrapping
 * assertions, no swallowed-rejection fallbacks on assertion-bearing locator
 * interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createCandidatePasswordSetter } from './candidatePasswordSetter.fixture';
import { createCandidatePreregisterPage } from './candidatePreregisterPage.fixture';
import { createEmailBucket } from '../shared/emailBucket.fixture';
import type { EmailBucketFixture } from '../shared/emailBucket.fixture';
import type { CandidatePasswordSetterFixture } from './candidatePasswordSetter.fixture';
import type { CandidatePreregisterPageFixture } from './candidatePreregisterPage.fixture';

type BankAuthJourneyFixtureOptions = {
  /**
   * The Mailpit recipient address for the emailBucket fixture. The spec sets
   * this via `test.use({ recipientEmail: '...' })` at file scope. Default:
   * `'bank-auth-journey@test.openvaa.local'` — the journey-owned address the
   * preregistration invite email is sent to and the bank-auth-journey
   * teardown cleans up (no pre-seeded candidate row carries it; the journey
   * creates the auth user itself via the identity-callback + invite flow).
   */
  recipientEmail: string;
};

type BankAuthJourneyFixtures = BankAuthJourneyFixtureOptions & {
  emailBucket: EmailBucketFixture;
  candidatePreregisterPage: CandidatePreregisterPageFixture;
  candidatePasswordSetter: CandidatePasswordSetterFixture;
};

export const test = base.extend<BankAuthJourneyFixtures>({
  recipientEmail: ['bank-auth-journey@test.openvaa.local', { option: true }],

  emailBucket: async ({ page, recipientEmail }, use) => {
    await use(createEmailBucket(page, recipientEmail));
  },
  candidatePreregisterPage: async ({ page }, use) => {
    await use(createCandidatePreregisterPage(page));
  },
  candidatePasswordSetter: async ({ page }, use) => {
    await use(createCandidatePasswordSetter(page));
  }
});

export { expect };
