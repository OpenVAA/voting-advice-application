/**
 * @file Composition root for the specs that drive the Contestant App's entry flow: signing in, registering by email or with a code, asking for a mailed link, and setting a password.
 *
 * Each such spec builds its own `test` with {@link createRegistrationTest}, naming the address prefix its cleanup reaches and the dataset rows it promises grants on. Two specs that run side by side name different ones.
 *
 * Surface:
 *   - `createRegistrationTest({ addressPrefix, dedicatedRows })` — Playwright `test` extended with:
 *       - `invitationFlow` (worker-scoped) — the invitation flow, bound to that prefix and those rows, so `beforeAll`, `afterEach` and `afterAll` speak in its steps too;
 *       - one page object per screen of the flow (test-scoped) — `contestantLoginPage`, `contestantRegisterPage`, `contestantEmailSentPage`, `contestantSetPasswordGate`, `contestantPasswordSetter`, `contestantTermsOfUsePage`, `contestantForgotPasswordPage`, `contestantPasswordResetPage`, `contestantEntityHomePage` and `contestantHomePage`;
 *       - `flowState` (test-scoped) — `expectNothingOutsideMemory(values)` and `expectNothingShown(values)`;
 *       - `freshVisitor` (test-scoped) — opens another visitor: a browser context of its own with no session, and the page objects of the screens such a visitor meets for its page.
 *   - `createFlowState(page)` — the step set behind `flowState`.
 *   - `expect` — re-exported from @playwright/test.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createContestantEmailSentPage } from './contestantEmailSentPage.fixture';
import { createContestantEntityHomePage } from './contestantEntityHomePage.fixture';
import { createContestantForgotPasswordPage } from './contestantForgotPasswordPage.fixture';
import { createContestantHomePage } from './contestantHomePage.fixture';
import { createContestantLoginPage } from './contestantLoginPage.fixture';
import { createContestantPasswordResetPage } from './contestantPasswordResetPage.fixture';
import { createContestantPasswordSetter } from './contestantPasswordSetter.fixture';
import { createContestantRegisterPage } from './contestantRegisterPage.fixture';
import { createContestantSetPasswordGate } from './contestantSetPasswordGate.fixture';
import { createContestantTermsOfUsePage } from './contestantTermsOfUsePage.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { createInvitationFlow } from '../shared/invitationFlow.fixture';
import type { BrowserContext, Page } from '@playwright/test';
import type { DedicatedRowIds, InvitationFlowFixture } from '../shared/invitationFlow.fixture';
import type { ContestantEmailSentPageFixture } from './contestantEmailSentPage.fixture';
import type { ContestantEntityHomePageFixture } from './contestantEntityHomePage.fixture';
import type { ContestantForgotPasswordPageFixture } from './contestantForgotPasswordPage.fixture';
import type { ContestantHomePageFixture } from './contestantHomePage.fixture';
import type { ContestantLoginPageFixture } from './contestantLoginPage.fixture';
import type { ContestantPasswordResetPageFixture } from './contestantPasswordResetPage.fixture';
import type { ContestantPasswordSetterFixture } from './contestantPasswordSetter.fixture';
import type { ContestantRegisterPageFixture } from './contestantRegisterPage.fixture';
import type { ContestantSetPasswordGateFixture } from './contestantSetPasswordGate.fixture';
import type { ContestantTermsOfUsePageFixture } from './contestantTermsOfUsePage.fixture';

/** A text as itself and with its percent escapes resolved, where it has any that resolve. */
function withEscapesResolved(text: string): Array<string> {
  try {
    return [text, decodeURIComponent(text)];
  } catch {
    return [text];
  }
}

/**
 * Create the steps that look at what a page keeps outside the memory of its scripts.
 *
 * @param page - The page to look at.
 */
export function createFlowState(page: Page) {
  return {
    /**
     * Assert that nothing a browser keeps or shows outside the page's own memory holds one of the given values: not the address bar, not either web storage, not the cookies the page can read, not the history state.
     *
     * For the values a visitor types into the entry flow — an address, a registration code — which the application holds in memory alone. Each place is searched as it is and with its percent escapes resolved, for each value as it is and percent-escaped, without regard to case.
     *
     * A failure names the places that hold a value. It never names the value, and no value is the subject of an expectation: a registration code would otherwise end up in the report.
     *
     * @param values - The values to look for. At least one, none of them empty.
     * @throws Error when given no value or an empty one, which would make the step assert nothing or match everything.
     */
    async expectNothingOutsideMemory(values: ReadonlyArray<string>): Promise<void> {
      if (values.length === 0 || values.some((value) => value === '')) {
        throw new Error('flowState: expectNothingOutsideMemory needs at least one value, and none of them empty');
      }
      const needles = values.flatMap((value) => [value, encodeURIComponent(value)]).map((text) => text.toLowerCase());

      const places = await page.evaluate(() => ({
        'the address bar': window.location.href,
        'local storage': JSON.stringify(Object.entries(window.localStorage)),
        'session storage': JSON.stringify(Object.entries(window.sessionStorage)),
        'the cookies the page can read': document.cookie,
        'the history state': JSON.stringify(window.history.state) ?? ''
      }));

      const holding = Object.entries(places)
        .filter(([, content]) =>
          withEscapesResolved(content)
            .map((text) => text.toLowerCase())
            .some((text) => needles.some((needle) => text.includes(needle)))
        )
        .map(([place]) => place);
      expect(holding, 'places outside the page’s memory that hold a value of the flow').toEqual([]);
    },

    /**
     * Assert that the page shows none of the given values: not in the text of the document, and not in a field.
     *
     * For the page a reload or a visit by address has led to, which must show nothing of what was typed before. The text and the fields' values are searched without regard to case. A failure names where a value was found, never the value.
     *
     * @param values - The values to look for. At least one, none of them empty.
     * @throws Error when given no value or an empty one, which would make the step assert nothing or match everything.
     */
    async expectNothingShown(values: ReadonlyArray<string>): Promise<void> {
      if (values.length === 0 || values.some((value) => value === '')) {
        throw new Error('flowState: expectNothingShown needs at least one value, and none of them empty');
      }
      const needles = values.map((value) => value.toLowerCase());

      const places = await page.evaluate(() => ({
        'the text of the document': document.documentElement.innerText,
        'the fields of the document': JSON.stringify(
          Array.from(document.querySelectorAll('input, textarea, select')).map(
            (control) => (control as HTMLInputElement).value
          )
        )
      }));

      const showing = Object.entries(places)
        .filter(([, content]) => needles.some((needle) => content.toLowerCase().includes(needle)))
        .map(([place]) => place);
      expect(showing, 'places of the page that show a value of the flow').toEqual([]);
    }
  };
}

export type FlowStateFixture = ReturnType<typeof createFlowState>;

/**
 * A visitor beside the test's own: a page in a browser context of its own, with the page objects of the screens a visitor who starts signed out meets, up to the home a sign-in or a mailed link leads to.
 *
 * Nothing the test's own page holds in memory, in storage or in a cookie is shared with it, so it is to the application a tab that has asked for nothing yet, in a browser that has never been signed in.
 */
export interface EntryVisitor {
  /** The visitor's page, for the steps that watch a page's requests. */
  page: Page;
  contestantLoginPage: ContestantLoginPageFixture;
  contestantRegisterPage: ContestantRegisterPageFixture;
  contestantEmailSentPage: ContestantEmailSentPageFixture;
  contestantForgotPasswordPage: ContestantForgotPasswordPageFixture;
  contestantPasswordResetPage: ContestantPasswordResetPageFixture;
  contestantEntityHomePage: ContestantEntityHomePageFixture;
  flowState: FlowStateFixture;
}

type RegistrationFixtures = {
  contestantLoginPage: ContestantLoginPageFixture;
  contestantRegisterPage: ContestantRegisterPageFixture;
  contestantEmailSentPage: ContestantEmailSentPageFixture;
  contestantSetPasswordGate: ContestantSetPasswordGateFixture;
  contestantPasswordSetter: ContestantPasswordSetterFixture;
  contestantTermsOfUsePage: ContestantTermsOfUsePageFixture;
  contestantForgotPasswordPage: ContestantForgotPasswordPageFixture;
  contestantPasswordResetPage: ContestantPasswordResetPageFixture;
  contestantEntityHomePage: ContestantEntityHomePageFixture;
  contestantHomePage: ContestantHomePageFixture;
  flowState: FlowStateFixture;
  freshVisitor: () => Promise<EntryVisitor>;
};

type RegistrationWorkerFixtures = {
  invitationFlow: InvitationFlowFixture;
};

/**
 * Build the `test` of one spec of the entry flow.
 *
 * @param options.addressPrefix - The local-part prefix of every address the spec invents, and the reach of its cleanup. One of the prefixes of `utils/invitationConstants`, used by this spec alone.
 * @param options.dedicatedRows - The dataset rows the spec promises entity-scope grants on, each by its `external_id`. The flow has exactly the rows named here, and its cleanup reaches no other row.
 * @returns Playwright `test` with the invitation flow, the page objects of the flow's screens, the `flowState` steps and `freshVisitor`.
 */
export function createRegistrationTest({
  addressPrefix,
  dedicatedRows
}: {
  addressPrefix: string;
  dedicatedRows: DedicatedRowIds;
}) {
  return base.extend<RegistrationFixtures, RegistrationWorkerFixtures>({
    invitationFlow: [
      async ({}, use) => {
        await use(createInvitationFlow(new SupabaseAdminClient(), { addressPrefix, dedicatedRows }));
      },
      { scope: 'worker' }
    ],
    contestantLoginPage: async ({ page }, use) => {
      await use(createContestantLoginPage(page));
    },
    contestantRegisterPage: async ({ page }, use) => {
      await use(createContestantRegisterPage(page));
    },
    contestantEmailSentPage: async ({ page }, use) => {
      await use(createContestantEmailSentPage(page, new SupabaseAdminClient()));
    },
    contestantSetPasswordGate: async ({ page }, use) => {
      await use(createContestantSetPasswordGate(page));
    },
    contestantPasswordSetter: async ({ page }, use) => {
      await use(createContestantPasswordSetter(page));
    },
    contestantTermsOfUsePage: async ({ page }, use) => {
      await use(createContestantTermsOfUsePage(page));
    },
    contestantForgotPasswordPage: async ({ page }, use) => {
      await use(createContestantForgotPasswordPage(page));
    },
    contestantPasswordResetPage: async ({ page }, use) => {
      await use(createContestantPasswordResetPage(page));
    },
    contestantEntityHomePage: async ({ page }, use) => {
      await use(createContestantEntityHomePage(page, new SupabaseAdminClient()));
    },
    contestantHomePage: async ({ page }, use) => {
      await use(createContestantHomePage(page));
    },
    flowState: async ({ page }, use) => {
      await use(createFlowState(page));
    },
    freshVisitor: async ({ browser, baseURL }, use) => {
      const contexts: Array<BrowserContext> = [];
      try {
        await use(async () => {
          // The context states an empty storage state, so that it carries no session whatever the describe's own `storageState` is.
          const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
          contexts.push(context);
          const page = await context.newPage();
          return {
            page,
            contestantLoginPage: createContestantLoginPage(page),
            contestantRegisterPage: createContestantRegisterPage(page),
            contestantEmailSentPage: createContestantEmailSentPage(page, new SupabaseAdminClient()),
            contestantForgotPasswordPage: createContestantForgotPasswordPage(page),
            contestantPasswordResetPage: createContestantPasswordResetPage(page),
            contestantEntityHomePage: createContestantEntityHomePage(page, new SupabaseAdminClient()),
            flowState: createFlowState(page)
          };
        });
      } finally {
        for (const context of contexts) await context.close();
      }
    }
  });
}

/** The `test` of one spec of the entry flow, as {@link createRegistrationTest} builds it. */
export type RegistrationTest = ReturnType<typeof createRegistrationTest>;

export { expect };
