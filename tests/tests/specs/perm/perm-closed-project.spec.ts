/**
 * @file perm-closed-project.spec.ts — a project that is not open for voters.
 *
 * Runs on the terminal Playwright node: `data-setup-perm-closed-project` seeds `perm-closed-project`, whose `openForVoters: false` closes the E2E project the dev server serves. The node depends on every leaf of the suite, so no other spec observes the closed project.
 *
 * What it pins: an anonymous visitor sees the existing `MaintenancePage` with `dynamic.voterAppNotAccessible` on the voter app, including on deep links, never the global `ErrorMessage`; the contestant app's login screen still renders its entries, its sign-in screen and the admin login their forms, and a candidate can log in and reach the candidate home, because candidates must be able to answer before a project opens. A grant holder (the admin stored session) sees the real voter app and the admin shell, because preview is decided by what RLS returns to the caller, not by a client-side role check.
 *
 * The seeded settings keep `access.voterApp: true`, so a maintenance page seen here can only have been caused by the project being closed, never by the access flag.
 *
 * The `afterAll` reopens the project (restore layer 1 of 3; the teardown project and the next run's global setup are layers 2 and 3).
 *
 * The last describe pins the contestant app's configuration as an anonymous visitor of the closed project receives it, through `contestant_app_public_config`. On the login screen: that it offers sign-in alone for an empty registration matrix and Register beside it for the `code` mode and for the `identity_provider` mode, for candidates and for organizations alone; that it says so while answers are locked, and then offers sign-in alone whatever the matrix allows; and that the heading names the app after the served entity types. On the registration page: that Register leads to it, that it shows the one listed mode's panel directly, and that it offers the identity provider's panel for candidates, and for a party alone without asking. For the registration addresses: that the registration page ends on the login screen where no mode is listed — an empty matrix, a row declared for an entity type the project does not serve, and answers locked — and that the two screens a registration code leads to end there where the `code` mode is off. Each of those tests first writes the served entity types and both rows of the matrix, because the write is a merge and a row left out would keep what the test before it wrote. The answers lock is written by one describe, which takes it off again when it ends. Nothing else is written back: the next setup to run replaces the settings row whole.
 *
 * One state of the login screen and three states of the registration page are scanned in both themes through `declareEntryScans`, which ends in `assertAxeScan`, the scan body the a11y specs share: the one listed mode's panel, the identity provider's panel asking which of the two entity types it registers, and that question after Continue with none chosen. The panel asking the type is also measured at two phone widths, 320 and 390 pixels, in English: no wider than its viewport. Last, under the same settings, every radio of the registration page, of the modes and of the entity types, draws its border, and the provider's panel names each type by its catalogue text.
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch wrapping expect(), no .catch fallbacks. Testid-only via `testIds` (`getByRole('heading')` permitted per the maintenance-page pattern); the login screen, the sign-in screen and the registration page are driven through their page objects. The one soft assertion that can fire here is not this file's: `assertAxeScan` reports its raw-i18n-key verdict softly on its own account, so that it cannot hide the axe verdict taken on the same page.
 */

import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createContestantLoginPage } from '../../fixtures/contestant/contestantLoginPage.fixture';
import { createContestantRegisterPage } from '../../fixtures/contestant/contestantRegisterPage.fixture';
import { createPageGeometry } from '../../fixtures/shared/pageGeometry.fixture';
import { TIMEOUTS } from '../../helpers';
import { ADMIN_STORAGE_STATE } from '../../utils/adminCredentials';
import { buildRoute } from '../../utils/buildRoute';
import { declareEntryScans } from '../../utils/entryAxeScan';
import { PHONE_VIEWPORTS, phoneUse } from '../../utils/phoneViewports';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import type { Page } from '@playwright/test';
import type { ContestantRegisterPageFixture } from '../../fixtures/contestant/contestantRegisterPage.fixture';

/** The candidate the setup project force-registers (its email follows the perm-template fallback contract). */
const CANDIDATE_EMAIL = 'e2e-perm-closed-project-cand-1@test.openvaa.local';

/**
 * The English `dynamic` messages, read from the message source rather than copied, so a copy edit to a message cannot turn this spec into an assertion about a stale string.
 */
const DYNAMIC_MESSAGES = JSON.parse(
  fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/dynamic.json'), 'utf8')
).dynamic;

const MAINTENANCE_TITLE: string = DYNAMIC_MESSAGES.voterAppNotAccessible.title;

/** The three names the contestant app shows for itself, by the entity types the project serves. */
const APP_NAME: { candidate: string; organization: string; candidateAndOrganization: string } =
  DYNAMIC_MESSAGES.contestantAppName;

const LOGIN_ROUTE = buildRoute({ route: 'ContestantAppLogin', locale: 'en' });
const REGISTER_ROUTE = buildRoute({ route: 'ContestantAppRegister', locale: 'en' });
/** The two screens a checked registration code leads to: the one that asks for an address, and the one that signs in the holder of a used code. */
const REGISTER_EMAIL_ROUTE = buildRoute({ route: 'ContestantAppRegisterEmail', locale: 'en' });
const REGISTER_SIGN_IN_ROUTE = buildRoute({ route: 'ContestantAppRegisterSignIn', locale: 'en' });

/** Settings that let the identity provider's mode register candidates and organizations, beside the email and code modes for candidates. */
const PROVIDER_FOR_BOTH_TYPES = {
  contestantApp: {
    entityTypes: ['candidate', 'organization'],
    registrationModes: { candidate: ['identity_provider', 'email', 'code'], organization: ['identity_provider'] }
  }
};

/**
 * Open the registration page under settings that let the identity provider register both entity types, and open the provider's option, which asks which type with none chosen.
 */
async function openProviderAskingTheType(page: Page): Promise<ContestantRegisterPageFixture> {
  const registerPage = createContestantRegisterPage(page);
  await registerPage.open();
  await registerPage.expectListedModes(['identity_provider', 'email', 'code']);
  await registerPage.chooseMode('identity_provider');
  await registerPage.expectPanelOpen('identity_provider');
  await registerPage.expectIdentityProviderPanel(['candidate', 'organization']);
  return registerPage;
}

/**
 * Match a settled URL whose path ends with the given route, whatever locale prefix and search parameters it carries.
 */
function urlOf(route: string): RegExp {
  const escaped = route.replace(/^\/*/, '/').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${escaped}(?:[?#]|$)`);
}

/**
 * Request a route directly and assert that the visitor ends on the login page. `toHaveURL` waits, which covers both ways a refusal arrives: a redirect response, and for a page rendered in the browser only, a redirect delivered through the page's data request.
 */
async function expectRefusedToLogin(page: Page, target: string): Promise<void> {
  await page.goto(target);
  await expect(page).toHaveURL(urlOf(LOGIN_ROUTE), { timeout: TIMEOUTS.slowPage });
}

test.describe('a project that is not open for voters', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await new SupabaseAdminClient().ensureProject();
  });

  test('anon voter home shows the not-released maintenance page, not an error', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByTestId(testIds.shared.maintenancePage)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(MAINTENANCE_TITLE);
    await expect(page.getByTestId(testIds.shared.errorMessage)).toBeHidden();
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();
  });

  test('anon voter deep links show maintenance, never an error', async ({ page }) => {
    for (const route of ['/en/elections', '/en/questions']) {
      await page.goto(route);
      await expect(page.getByTestId(testIds.shared.maintenancePage)).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(MAINTENANCE_TITLE);
      await expect(page.getByTestId(testIds.shared.errorMessage)).toBeHidden();
    }
  });

  test('anon can reach the candidate login and the admin login on a closed project', async ({ page }) => {
    const loginPage = createContestantLoginPage(page);
    await loginPage.openEntryDirectly();
    await loginPage.expectEntryShown();
    await loginPage.expectNoNotice();
    await expect(page.getByTestId(testIds.shared.errorMessage)).toBeHidden();

    // The sign-in screen the login screen leads to, with its form.
    await loginPage.followSignIn();
    await loginPage.expectSignInShown();
    await loginPage.expectInputAttributes();
    await expect(page.getByTestId(testIds.shared.errorMessage)).toBeHidden();

    await page.goto('/en/admin/login');
    await expect(page.getByTestId(testIds.contestant.password.field)).toBeVisible();
    await expect(page.getByTestId(testIds.shared.errorMessage)).toBeHidden();
  });

  test('a candidate can log in and reach the candidate home on a closed project', async ({ page }) => {
    const loginPage = createContestantLoginPage(page);
    await loginPage.goToPage();
    await loginPage.login(CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD);
    await expect(page).not.toHaveURL(/\/contestant\/login/);
    await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible();
    await expect(page.getByTestId(testIds.shared.errorMessage)).toBeHidden();
  });

  test.describe('grant holder preview', () => {
    test.use({ storageState: ADMIN_STORAGE_STATE });

    test('a grant holder sees the real voter app and the admin shell on a closed project', async ({ page }) => {
      await page.goto('/en');
      await expect(page.getByTestId(testIds.voter.home.startButton)).toBeVisible();
      await expect(page.getByTestId(testIds.shared.maintenancePage)).toBeHidden();

      await page.goto(buildRoute({ route: 'AdminAppHome', locale: 'en' }));
      await expect(page.getByRole('button', { name: 'Jobs Monitoring' })).toBeVisible();
    });
  });

  test.describe('the login screen, the registration page and the registration addresses an anonymous visitor receives under each registration matrix', () => {
    let client: SupabaseAdminClient;

    test.beforeAll(() => {
      client = new SupabaseAdminClient();
    });

    test('an empty matrix offers sign-in only, names the app for candidates and refuses every registration address', async ({
      page
    }) => {
      await client.updateAppSettings({
        contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: [], organization: [] } }
      });

      const loginPage = createContestantLoginPage(page);
      await loginPage.openEntryDirectly();
      await loginPage.expectEntryShown();
      await loginPage.expectRegisterOffered(false);
      await loginPage.expectAnswersLocked(false);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(APP_NAME.candidate);

      await expectRefusedToLogin(page, REGISTER_ROUTE);
      await expectRefusedToLogin(page, REGISTER_EMAIL_ROUTE);
      await expectRefusedToLogin(page, REGISTER_SIGN_IN_ROUTE);
    });

    test('the code mode offers Register on the login screen, and the registration page shows the code field directly', async ({
      page
    }) => {
      await client.updateAppSettings({
        contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: ['code'], organization: [] } }
      });

      const loginPage = createContestantLoginPage(page);
      await loginPage.openEntryDirectly();
      await loginPage.expectEntryShown();
      await loginPage.expectRegisterOffered(true);

      // Register leads to the registration page, which lists the code mode alone.
      const registerPage = createContestantRegisterPage(page);
      await loginPage.followRegister();
      await expect(page).toHaveURL(urlOf(REGISTER_ROUTE), { timeout: TIMEOUTS.slowPage });
      await registerPage.expectSingleMode('code');

      // The two screens a checked code leads to are served, and each leads a visitor who holds no code to the registration page.
      await registerPage.openEmailEntryDirectly();
      await expect(page).toHaveURL(urlOf(REGISTER_ROUTE), { timeout: TIMEOUTS.slowPage });
      await registerPage.expectSingleMode('code');
      await registerPage.openCodeSignInDirectly();
      await expect(page).toHaveURL(urlOf(REGISTER_ROUTE), { timeout: TIMEOUTS.slowPage });
      await registerPage.expectSingleMode('code');
    });

    test("the identity provider mode offers Register on the login screen, and the registration page offers the provider's panel for candidates", async ({
      page
    }) => {
      await client.updateAppSettings({
        contestantApp: {
          entityTypes: ['candidate'],
          registrationModes: { candidate: ['identity_provider'], organization: [] }
        }
      });

      const loginPage = createContestantLoginPage(page);
      await loginPage.openEntryDirectly();
      await loginPage.expectEntryShown();
      await loginPage.expectRegisterOffered(true);

      // Register leads to the registration page, which lists the provider's mode alone and offers its panel for candidates. Leaving for the provider is walked by the identity-provider projects, whose browser trusts the mock issuer's certificate.
      const registerPage = createContestantRegisterPage(page);
      await loginPage.openEntryDirectly();
      await loginPage.followRegister();
      await expect(page).toHaveURL(urlOf(REGISTER_ROUTE), { timeout: TIMEOUTS.slowPage });
      await registerPage.expectSingleMode('identity_provider');
      await registerPage.expectIdentityProviderPanel(['candidate']);

      // The code mode is off, so the two screens a registration code leads to are refused.
      await expectRefusedToLogin(page, REGISTER_EMAIL_ROUTE);
      await expectRefusedToLogin(page, REGISTER_SIGN_IN_ROUTE);
    });

    test("the identity provider mode allowed for organizations alone offers Register, and the registration page offers the provider's panel for a party without asking", async ({
      page
    }) => {
      await client.updateAppSettings({
        contestantApp: {
          entityTypes: ['candidate', 'organization'],
          registrationModes: { candidate: [], organization: ['identity_provider'] }
        }
      });

      const loginPage = createContestantLoginPage(page);
      await loginPage.openEntryDirectly();
      await loginPage.expectEntryShown();
      await loginPage.expectRegisterOffered(true);

      // Register leads to the registration page, which lists the provider's mode alone and names the party as what it registers.
      const registerPage = createContestantRegisterPage(page);
      await loginPage.followRegister();
      await expect(page).toHaveURL(urlOf(REGISTER_ROUTE), { timeout: TIMEOUTS.slowPage });
      await registerPage.expectSingleMode('identity_provider');
      await registerPage.expectIdentityProviderPanel(['organization']);

      // The code mode is off, so the two screens a registration code leads to are refused.
      await expectRefusedToLogin(page, REGISTER_EMAIL_ROUTE);
      await expectRefusedToLogin(page, REGISTER_SIGN_IN_ROUTE);
    });

    test('the heading names the app after the served entity types, and a type named twice counts once', async ({
      page
    }) => {
      await client.updateAppSettings({
        contestantApp: { entityTypes: ['organization'], registrationModes: { candidate: [], organization: [] } }
      });
      await page.goto(LOGIN_ROUTE);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(APP_NAME.organization);

      await client.updateAppSettings({
        contestantApp: {
          entityTypes: ['candidate', 'organization'],
          registrationModes: { candidate: [], organization: [] }
        }
      });
      await page.goto(LOGIN_ROUTE);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(APP_NAME.candidateAndOrganization);

      await client.updateAppSettings({
        contestantApp: {
          entityTypes: ['organization', 'candidate', 'candidate'],
          registrationModes: { candidate: [], organization: [] }
        }
      });
      await page.goto(LOGIN_ROUTE);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(APP_NAME.candidateAndOrganization);
    });

    test('a registration row for an entity type the project does not serve opens nothing', async ({ page }) => {
      await client.updateAppSettings({
        contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: [], organization: ['code'] } }
      });

      const loginPage = createContestantLoginPage(page);
      await loginPage.openEntryDirectly();
      await loginPage.expectEntryShown();
      await loginPage.expectRegisterOffered(false);
      await expectRefusedToLogin(page, REGISTER_ROUTE);
    });

    test.describe('while answers are locked', () => {
      test.afterAll(async () => {
        await client.updateAppSettings({ access: { answersLocked: false } });
      });

      test('the login screen says so to an anonymous visitor, offers sign-in only and refuses every registration address', async ({
        page
      }) => {
        // The matrix allows candidates two modes, so the answers lock is the one thing that closes registration.
        await client.updateAppSettings({
          access: { answersLocked: true },
          contestantApp: {
            entityTypes: ['candidate'],
            registrationModes: { candidate: ['email', 'code'], organization: [] }
          }
        });

        const loginPage = createContestantLoginPage(page);
        await loginPage.openEntryDirectly();
        await loginPage.expectEntryShown();
        await loginPage.expectAnswersLocked(true);
        await loginPage.expectRegisterOffered(false);

        // The sign-in screen its entry leads to says the same.
        await loginPage.followSignIn();
        await loginPage.expectSignInShown();
        await loginPage.expectSignInAnswersLocked();

        await expectRefusedToLogin(page, REGISTER_ROUTE);
        await expectRefusedToLogin(page, REGISTER_EMAIL_ROUTE);
        await expectRefusedToLogin(page, REGISTER_SIGN_IN_ROUTE);
      });
    });

    declareEntryScans([
      {
        // The login screen where no registration mode is listed: the one entry that leads to the sign-in screen, with nothing beside it.
        // Marker: the sign-in entry, on a screen that says it offers no registration.
        name: 'contestant-login-sign-in-only',
        routeId: 'ContestantAppLogin',
        reach: async (page) => {
          await client.updateAppSettings({
            contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: [], organization: [] } }
          });
          const loginPage = createContestantLoginPage(page);
          await loginPage.openEntryDirectly();
          await loginPage.expectEntryShown();
          await loginPage.expectRegisterOffered(false);
        },
        marker: { testId: testIds.contestant.login.signInLink },
        alsoShown: [{ testId: testIds.contestant.login.page, attribute: 'data-register-offered', value: 'false' }]
      },
      {
        // The registration page where the code mode is the one listed: its field directly, with nothing to choose.
        // Marker: the code field, on a page that says it lists the code mode alone.
        name: 'contestant-register-single-mode',
        routeId: 'ContestantAppRegister',
        reach: async (page) => {
          await client.updateAppSettings({
            contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: ['code'], organization: [] } }
          });
          const registerPage = createContestantRegisterPage(page);
          await registerPage.open();
          await registerPage.expectSingleMode('code');
        },
        marker: { testId: testIds.contestant.register.code },
        alsoShown: [{ testId: testIds.contestant.register.page, attribute: 'data-modes', value: 'code' }]
      },
      {
        // The registration page with all three modes listed and the identity provider's chosen, so that its panel is the one open, asking which of the two entity types it registers with none chosen.
        // Marker: the group of types, which only the provider's panel registering several renders.
        name: 'contestant-register-identity-provider',
        routeId: 'ContestantAppRegister',
        reach: async (page) => {
          await client.updateAppSettings(PROVIDER_FOR_BOTH_TYPES);
          await openProviderAskingTheType(page);
        },
        marker: { testId: testIds.contestant.register.entityTypes }
      },
      {
        // The same panel after Continue with no type chosen: the group says to choose one, and focus is on the first type.
        // Marker: the group's error.
        name: 'contestant-register-identity-provider-type-required',
        routeId: 'ContestantAppRegister',
        reach: async (page) => {
          await client.updateAppSettings(PROVIDER_FOR_BOTH_TYPES);
          const registerPage = await openProviderAskingTheType(page);
          await registerPage.pressContinue();
          await registerPage.expectEntityTypesError();
        },
        marker: { testId: testIds.contestant.register.entityTypesError }
      }
    ]);

    for (const viewport of PHONE_VIEWPORTS) {
      const width = viewport.width;

      test.describe(`${width}px wide`, () => {
        test.use(phoneUse(viewport));

        test(`phone ${width}: the identity provider's panel asking which entity type to register does not overflow`, async ({
          page
        }) => {
          await client.updateAppSettings(PROVIDER_FOR_BOTH_TYPES);
          await openProviderAskingTheType(page);
          await createPageGeometry(page).expectNoHorizontalOverflow();
        });
      });
    }

    test("the registration page's radios draw their border, and the provider's panel names each entity type from the catalogue", async ({
      page
    }) => {
      await client.updateAppSettings(PROVIDER_FOR_BOTH_TYPES);
      const registerPage = await openProviderAskingTheType(page);
      await registerPage.expectRadiosBordered();
    });
  });
});
