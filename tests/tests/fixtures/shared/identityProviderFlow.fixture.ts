/**
 * @file identityProviderFlow fixture.
 *
 * The identity provider's side of a test as semantic steps: choose who the provider says the user is and how it answers, and name the address the application gives that identity before the user proves one. A spec reads each step as a sentence and holds no cookie name, encoding or address domain of its own.
 *
 * Composed over the mock OIDC issuer (`tests/tests/support/mockOidcIssuer.ts`), which the application's provider flow reaches at `127.0.0.1` during a run.
 *
 * **Steps.**
 *   - `mintIdentity`: a fresh identity, and the provider's answer to the next authorization, for one browser context.
 *   - `startIdentityProviderFlow`: open the registration screen, in English or in a locale given, choose the provider's mode and, where the panel asks, the entity type, and press Continue, so the browser leaves for the provider and comes back with its answer; a test may take a step of its own while the panel is shown and while the browser is at the provider.
 *   - `expectProviderAskedForLocale`: the provider was asked to show its screens in a locale, as the `ui_locales` of the authorization request it received.
 *   - `forgeEntityType`: overwrite the entity type cookie the flow's start left in a browser context, as the browser's owner can.
 *   - `setIdentityProviderMatrix`: which entity types the project lets register with the provider.
 *   - `expectNoAccountFor`: no account exists for a minted identity.
 *   - `entitiesOf`: the candidates and organizations a minted identity's account edits in the project.
 *   - `grantSecondCandidate`: give a minted identity's account a candidate of its own, as an administrator does.
 *   - `placeholderAddressOf`: the address the application stores for an identity until the user proves one of their own.
 *   - `freshAddress`: an address nobody holds, under the prefix the identity-provider specs type.
 *   - `expectOwnEntityHome`: the page is the home of the candidate or the organization the application made for a minted identity.
 *   - `organizationOf`: what the organization the application made for a minted identity holds: whether it is confirmed, its name and its abbreviation.
 *   - `addressAnotherAccountHolds`: a fresh address that another account already holds.
 *   - `addressAnOpenInvitationHolds`: a fresh address that an open invitation of the project holds, and no account.
 *   - `expectInvitationOpen`: the one invitation an address holds is still unclaimed.
 *   - `removeInvitationsOf`: remove the invitations that addresses hold in the project.
 *   - `expectNoMailFor`: the catcher holds no mail at all for an address, read once after a request that answers once its work is done.
 *   - `confirmationLinkToOpen`: the link of the mail that confirms a typed address, as a browser opens it.
 *   - `expectConfirmationMailCount`: how many mails that confirm a typed address the catcher holds for it.
 *   - `giveBackMailSlot`: give an address's two one-mail-a-minute slots on the server back, before a request that must mail it within the minute of the last mail.
 *   - `signInLinkToOpen`: the link of the sign-in mail an address was sent, as a browser opens it.
 *   - `recoveryLinkToOpen`: the link of the recovery mail an address was sent, as a browser opens it.
 *   - `expectAtAppRoot`: the page is at the Contestant App's root, where a link without a page of its own lands.
 *   - `registerWithIdentityProvider`: a fresh identity registers a candidate through the provider; given an address, it gives it and goes on through the terms of use to the candidate's home, and given none it stops at the view that asks for one.
 *   - `proveAddress`: open the link of the mail that confirms a typed address, as received.
 *   - `signOut`: log out from the home of a candidate the provider registered.
 *   - `removeGrant`: remove the account's editor grant on the entity of a type the identity registered, as an administrator does.
 *   - `expectNoOwnEntity`: the account edits no entity of a type.
 *   - `openSettings` and `expectSettings`: the address of the settings page, which belongs to the account and sits at the app's root, and that page shown.
 *
 * **Where the choice lives.** `mintIdentity` sets the mock's selector cookie on the browser context it is given and on nothing else. Each test has its own context, so two tests running side by side cannot select for each other; the mock turns the selector into a code that is good for one exchange.
 *
 * **Credentials.** A minted `sub` is an identity claim value. No step logs one, and none is ever the subject of an expectation or part of a test title.
 *
 * **Rigidity contract**: NO `expect.soft`, NO `try/catch` wrapping `expect(...)`.
 */

import { randomUUID } from 'node:crypto';
import { expect, test as base } from '@playwright/test';
import { createEmailBucket } from './emailBucket.fixture';
import { TIMEOUTS } from '../../helpers';
import {
  encodeMockScenario,
  IDURA_CLAIMS,
  MOCK_ISSUER,
  MOCK_SCENARIO_COOKIE,
  MOCK_UI_LOCALES_COOKIE
} from '../../support/mockOidcIssuer';
import { buildRoute } from '../../utils/buildRoute';
import { contestantHomeUrlRe, contestantSettingsUrlRe } from '../../utils/contestantEntityUrl';
import { RECOVERY_LINK_EMAIL_SUBJECT, SIGN_IN_LINK_EMAIL_SUBJECT } from '../../utils/invitationConstants';
import { assertSignInLinkShape, openMailedLink, runOriginFromEnv, toRunOrigin } from '../../utils/mailedLink';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import { createContestantIdentityProviderGate } from '../contestant/contestantIdentityProviderGate.fixture';
import { createContestantLogoutButton } from '../contestant/contestantLogoutButton.fixture';
import { createContestantRegisterPage } from '../contestant/contestantRegisterPage.fixture';
import { createContestantTermsOfUsePage } from '../contestant/contestantTermsOfUsePage.fixture';
import type { RegistrationMode, ServedEntityType } from '@openvaa/app-shared';
import type { BrowserContext, Page } from '@playwright/test';
import type { MockOutcome } from '../../support/mockOidcIssuer';

/** The prefix of every `sub` this fixture mints. */
export const MINTED_SUB_PREFIX = 'e2e-idp-';

/** The prefix of every address the identity-provider specs type. */
export const IDENTITY_PROVIDER_ADDRESS_PREFIX = 'identity-provider-';

/** The host the mock issuer is reached on during a run. */
const MOCK_ISSUER_HOST = '127.0.0.1';

/** The domain of the address the application stores for an identity that has proved no address. */
const PLACEHOLDER_EMAIL_DOMAIN = 'bank-auth.placeholder';

/**
 * The wire name of the cookie that carries the entity type the provider's flow was started for, `COOKIE.oidcEntityType` in `apps/frontend/src/lib/cookies/index.ts`. A literal, as a browser's owner would write it: a renamed cookie fails the step that forges it instead of being followed silently.
 */
const ENTITY_TYPE_COOKIE = 'oidc_entity_type';

/** The path of the mock issuer's authorization endpoint, which answers with a redirect back to the application. */
const MOCK_AUTHORIZE_PATH = '/oauth2/authorize';

/**
 * The subject of the mail that confirms a typed address, in English, as the `account-access` Edge Function ships it.
 *
 * A literal, not an import of the function's templates: a test states the subject it expects, so a changed template fails here instead of being followed silently.
 */
export const ADDRESS_CONFIRMATION_EMAIL_SUBJECT = 'Confirm your email address for the voting advice application';

/** How a test starts the provider's flow. */
export interface StartIdentityProviderFlowOptions {
  /** The locale to open the registration screen in; English when absent. */
  locale?: string;
  /** The entity type to choose where the panel asks which; a panel that asks and no type given is an error. Where the panel registers one type, that type must be this one when given. */
  entityType?: ServedEntityType;
  /** Choose the type with the keyboard rather than the pointer. */
  byKeyboard?: boolean;
  /** A step taken while the registration screen shows the provider's panel, after the type is chosen and before Continue is pressed. */
  beforeContinue?: () => Promise<void>;
  /** A step taken while the browser is at the provider, after the application sent it there and before the provider sends it back. */
  atProvider?: () => Promise<void>;
}

/** The ids of the entities a minted identity's account edits in the suite's project, by type. */
export interface OwnEntities {
  candidate: Array<string>;
  organization: Array<string>;
}

/** What an organization the application made for an identity holds, as stored. */
export interface OwnOrganization {
  confirmed: boolean;
  name: Record<string, string> | null;
  shortName: Record<string, string> | null;
}

/** The external id of the identity-provider dataset's one candidate, which no test edits; an invitation for an address is seeded on it. */
const INVITED_CANDIDATE_EXTERNAL_ID = 'e2e-bankauth-idp-cand-1';

/** The registration modes the candidates' row holds in the identity-provider dataset, with and without the provider's. */
const CANDIDATE_MODES_WITH_PROVIDER: ReadonlyArray<RegistrationMode> = ['identity_provider', 'email', 'code'];
const CANDIDATE_MODES_WITHOUT_PROVIDER: ReadonlyArray<RegistrationMode> = ['email', 'code'];

/**
 * The ids of the entities of a type in the suite's project that a user edits, read through the user's editor grants.
 *
 * @param admin - The admin client.
 * @param userId - The user whose grants are read.
 * @param entityType - The entity type.
 * @returns The ids.
 */
async function ownEntityIdsOf(
  admin: SupabaseAdminClient,
  userId: string,
  entityType: ServedEntityType
): Promise<Array<string>> {
  if (entityType === 'candidate') return admin.candidateIdsForUser(userId);
  const grants = await admin.findData('grants', {
    user_id: userId,
    scope: 'entity',
    target_type: 'organization',
    role: 'editor'
  });
  if (grants.type !== 'success') throw new Error(`identityProviderFlow: reading the grants failed: ${grants.cause}`);
  const grantedIds = (grants.data ?? []).map((grant) => String(grant.target_id));
  if (grantedIds.length === 0) return [];
  const rows = await admin.findData('organizations', { id: { $in: grantedIds } });
  if (rows.type !== 'success') throw new Error(`identityProviderFlow: reading the organizations failed: ${rows.cause}`);
  return (rows.data ?? []).map((row) => String(row.id));
}

/**
 * The id of the account the application made for a minted identity, found by the identity the account's metadata names, whatever address the account holds.
 */
async function accountIdOf(admin: SupabaseAdminClient, sub: string): Promise<string> {
  const accountId = await admin.authUserIdForIdentity(sub);
  expect(accountId !== undefined, 'an account exists for the minted identity').toBe(true);
  return accountId!;
}

/**
 * The id of the one entity of a type a minted identity's account edits, asserting that there is exactly one.
 */
async function ownEntityIdOf(admin: SupabaseAdminClient, sub: string, entityType: ServedEntityType): Promise<string> {
  const ids = await ownEntityIdsOf(admin, await accountIdOf(admin, sub), entityType);
  expect(ids, `${entityType} entities the identity edits in the project`).toHaveLength(1);
  return ids[0];
}

/** What a test gives when it registers an identity with the provider. */
export interface RegisterWithIdentityProviderOptions {
  /** The address the user gives on the view that asks for one; without it, the registration stops at that view. */
  address?: string;
}

/** What a test chooses about a minted identity. Every field has a default. */
export interface MintIdentityOptions {
  /** How the provider answers; `success` when absent. */
  outcome?: MockOutcome;
  /** The `given_name` claim; the fixed identity's when absent. */
  givenName?: string;
  /** The `family_name` claim; the fixed identity's when absent. */
  familyName?: string;
}

/**
 * Create the identity-provider steps.
 *
 * @returns The steps, as an object of functions.
 */
export function createIdentityProviderFlow() {
  return {
    /**
     * Mint a fresh identity and choose the provider's answer for the given browser context: every authorization that context makes at the mock issuer from now on is answered for this identity with this outcome.
     *
     * @param context - The test's own browser context.
     * @param options - The outcome and the names; see {@link MintIdentityOptions}.
     * @returns The minted `sub`, beginning with {@link MINTED_SUB_PREFIX}.
     */
    async mintIdentity(context: BrowserContext, options: MintIdentityOptions = {}): Promise<string> {
      const sub = `${MINTED_SUB_PREFIX}${randomUUID()}`;
      await context.addCookies([
        {
          name: MOCK_SCENARIO_COOKIE,
          value: encodeMockScenario({
            sub,
            givenName: options.givenName ?? IDURA_CLAIMS.given_name,
            familyName: options.familyName ?? IDURA_CLAIMS.family_name,
            outcome: options.outcome ?? 'success'
          }),
          domain: MOCK_ISSUER_HOST,
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Lax'
        }
      ]);
      return sub;
    },

    /**
     * Start the identity provider's flow as a visitor does: open the registration screen, choose the provider's mode where several modes are listed, choose the entity type where the panel asks which, and press Continue. The browser leaves for the provider, which answers as {@link mintIdentity} chose, and the step returns once the browser is back in the application; the caller asserts the screen the flow ends on.
     *
     * With `atProvider`, the browser's request to the provider is held until that step is done and is then let through unchanged, so the step runs after the application's answer to Continue has set its cookies and before the provider's redirect back reads them.
     *
     * @param page - The test's page, in the browser context an identity was minted for.
     * @param options - The entity type to choose and how, and the steps to take on the way; see {@link StartIdentityProviderFlowOptions}.
     * @throws Error when the panel asks for a type and none is given, or registers one type other than the one given.
     */
    async startIdentityProviderFlow(page: Page, options: StartIdentityProviderFlowOptions = {}): Promise<void> {
      const registerPage = createContestantRegisterPage(page);
      await registerPage.open(options.locale);
      const listed = await registerPage.listedModes();
      if (listed.length > 1) await registerPage.chooseMode('identity_provider');
      const offered = await registerPage.entityTypesOffered();
      if (offered.length > 1) {
        if (!options.entityType)
          throw new Error(
            'identityProviderFlow: the panel asks which entity type to register, and the test named none'
          );
        if (options.byKeyboard) await registerPage.chooseEntityTypeWithKeyboard(options.entityType);
        else await registerPage.chooseEntityType(options.entityType);
      } else if (options.entityType && offered[0] !== options.entityType) {
        throw new Error(`identityProviderFlow: the panel registers ${offered.join(' ')}, not ${options.entityType}`);
      }
      if (options.beforeContinue) await options.beforeContinue();
      const atProvider = options.atProvider;
      if (atProvider)
        await page.route(
          (url) => url.origin === MOCK_ISSUER && url.pathname === MOCK_AUTHORIZE_PATH,
          async (route) => {
            await atProvider();
            await route.continue();
          },
          { times: 1 }
        );
      await registerPage.continueToIdentityProvider();
    },

    /**
     * Assert that the provider was asked to show its screens in a locale: the `ui_locales` of the one authorization request the mock issuer received in this browser context, as the issuer reports it in a cookie of its own origin.
     *
     * @param context - The browser context the flow was started in.
     * @param locale - The `ui_locales` expected.
     */
    async expectProviderAskedForLocale(context: BrowserContext, locale: string): Promise<void> {
      const reported = (await context.cookies(MOCK_ISSUER))
        .filter((cookie) => cookie.name === MOCK_UI_LOCALES_COOKIE)
        .map((cookie) => decodeURIComponent(cookie.value));
      expect(reported, 'the ui_locales the provider was asked for').toEqual([locale]);
    },

    /**
     * Overwrite the entity type cookie the start of the provider's flow left in a browser context with another value, as the owner of the browser can: by its wire name, for the application's host, keeping the attributes the authorize endpoint gave it, httpOnly among them. Asserts that the flow left exactly one such cookie and that afterwards exactly one holds the new value.
     *
     * @param context - The browser context the flow was started in.
     * @param entityType - The value to put in the cookie.
     */
    async forgeEntityType(context: BrowserContext, entityType: string): Promise<void> {
      const typeCookies = async () => (await context.cookies()).filter((cookie) => cookie.name === ENTITY_TYPE_COOKIE);
      const left = await typeCookies();
      expect(left, 'entity type cookies the start of the flow left').toHaveLength(1);
      expect(left[0].httpOnly, 'the entity type cookie is httpOnly').toBe(true);
      await context.addCookies([{ ...left[0], value: entityType }]);
      const forged = await typeCookies();
      expect(
        forged.map((cookie) => cookie.value),
        'the entity type cookies after the forgery'
      ).toEqual([entityType]);
    },

    /**
     * Let the identity provider's mode register exactly these entity types: the project serves candidates and organizations, the candidates' row holds the email and code modes and the provider's where candidates are named, and the organizations' row holds the provider's mode where organizations are named and nothing otherwise.
     *
     * The settings row is read and written back whole with these three members replaced, so nothing of an earlier matrix is left and every other setting stays as it was. The row is the project's one, so a spec that calls this runs its tests one after another in one worker, and writes the matrix back when the tests that need it are done.
     *
     * @param types - The entity types the provider's mode registers.
     */
    async setIdentityProviderMatrix(types: ReadonlyArray<ServedEntityType>): Promise<void> {
      const admin = new SupabaseAdminClient();
      const settings = (await admin.getAppSettings()) ?? {};
      const contestantApp = (settings.contestantApp ?? {}) as Record<string, unknown>;
      await admin.replaceAppSettings({
        ...settings,
        contestantApp: {
          ...contestantApp,
          entityTypes: ['candidate', 'organization'],
          registrationModes: {
            candidate: [
              ...(types.includes('candidate') ? CANDIDATE_MODES_WITH_PROVIDER : CANDIDATE_MODES_WITHOUT_PROVIDER)
            ],
            organization: types.includes('organization') ? ['identity_provider'] : []
          }
        }
      });
    },

    /**
     * Assert that no account exists for a minted identity: no auth user holds its placeholder address. The expectation's subject is that fact, never the identity or the address.
     *
     * @param sub - A minted `sub`.
     */
    async expectNoAccountFor(sub: string): Promise<void> {
      const exists = await new SupabaseAdminClient().hasAuthUser(`${sub}@${PLACEHOLDER_EMAIL_DOMAIN}`);
      expect(exists, 'an account exists for the minted identity').toBe(false);
    },

    /**
     * The candidates and organizations a minted identity's account edits in the project, read through its editor grants; none of either when no account exists for the identity.
     *
     * @param sub - A minted `sub`.
     * @returns The ids of each type, sorted.
     */
    async entitiesOf(sub: string): Promise<OwnEntities> {
      const admin = new SupabaseAdminClient();
      const accountId = await admin.authUserIdForIdentity(sub);
      if (accountId === undefined) return { candidate: [], organization: [] };
      return {
        candidate: (await ownEntityIdsOf(admin, accountId, 'candidate')).sort(),
        organization: (await ownEntityIdsOf(admin, accountId, 'organization')).sort()
      };
    },

    /**
     * Give a minted identity's account a second candidate, as an administrator does: a new confirmed candidate in the project, with an editor grant for the account. The identity did not register it, so the registration record in the account's metadata does not name it.
     *
     * @param sub - A minted `sub` whose account exists.
     * @returns The id of the candidate given.
     */
    async grantSecondCandidate(sub: string): Promise<string> {
      const admin = new SupabaseAdminClient();
      return admin.createCandidateEditedBy(await accountIdOf(admin, sub), {
        firstName: 'Granted',
        lastName: 'Second Candidate'
      });
    },

    /**
     * The address the application stores for an identity that has proved no address of its own.
     *
     * @param sub - A minted `sub`.
     * @returns The placeholder address of that identity.
     */
    placeholderAddressOf(sub: string): string {
      return `${sub}@${PLACEHOLDER_EMAIL_DOMAIN}`;
    },

    /**
     * An address nobody holds, under {@link IDENTITY_PROVIDER_ADDRESS_PREFIX}, so that the project's setup and teardown remove whatever account it ends up on.
     *
     * @returns The address.
     */
    freshAddress(): string {
      return `${IDENTITY_PROVIDER_ADDRESS_PREFIX}${randomUUID()}@test.openvaa.local`;
    },

    /**
     * Assert that the page is the home of the entity of a type the application made for a minted identity: the home's status message is shown, the URL is an entity home, and it names the one entity of that type the identity's account edits.
     *
     * The expectations' subjects are the page and the id, never the identity or an address.
     *
     * @param page - The test's page.
     * @param sub - The minted `sub`.
     * @param entityType - The type of the entity; the candidate when absent.
     */
    async expectOwnEntityHome(page: Page, sub: string, entityType: ServedEntityType = 'candidate'): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      await expect(page).toHaveURL(contestantHomeUrlRe());
      const entityId = await ownEntityIdOf(new SupabaseAdminClient(), sub, entityType);
      expect(new URL(page.url()).pathname, `the home shown is that of the identity’s ${entityType}`).toContain(
        `/${entityType}/${entityId}`
      );
    },

    /**
     * Read what the one organization the application made for a minted identity holds: whether it is confirmed, and its name and abbreviation by locale. Asserts that the identity's account edits exactly one organization.
     *
     * @param sub - The minted `sub`.
     * @returns The organization's confirmation, name and abbreviation.
     */
    async organizationOf(sub: string): Promise<OwnOrganization> {
      const admin = new SupabaseAdminClient();
      const rows = await admin.findData('organizations', { id: await ownEntityIdOf(admin, sub, 'organization') });
      if (rows.type !== 'success')
        throw new Error(`identityProviderFlow: reading the organization failed: ${rows.cause}`);
      const row = rows.data?.[0];
      if (!row) throw new Error('identityProviderFlow: the organization the identity edits was not found');
      return {
        confirmed: row.confirmed === true,
        name: (row.name ?? null) as Record<string, string> | null,
        shortName: (row.short_name ?? null) as Record<string, string> | null
      };
    },

    /**
     * An address nobody held before, now held by an account of its own, under {@link IDENTITY_PROVIDER_ADDRESS_PREFIX} so that the project's setup and teardown remove it. The account has a random password nobody reads.
     *
     * @returns The address.
     */
    async addressAnotherAccountHolds(): Promise<string> {
      const address = this.freshAddress();
      await new SupabaseAdminClient().forceRegisterUser(address, randomUUID(), { acceptTermsOfUse: false });
      return address;
    },

    /**
     * An address nobody held before, now held by an open email invitation of the project for the dataset's one candidate, under {@link IDENTITY_PROVIDER_ADDRESS_PREFIX}. Seeding sends no mail and makes no account, and the call confirms nothing. The caller removes the invitation with {@link removeInvitationsOf}.
     *
     * @returns The address.
     */
    async addressAnOpenInvitationHolds(): Promise<string> {
      const address = this.freshAddress();
      const seeded = await new SupabaseAdminClient().createInvitations(
        [{ target_type: 'candidate', external_id: INVITED_CANDIDATE_EXTERNAL_ID, email: address }],
        { confirmEntity: false }
      );
      // The count is asserted as a number: an expectation over the rows themselves would put the address into the report.
      const seededCount = seeded.length;
      expect(seededCount, 'invitations seeded for the address').toBe(1);
      return address;
    },

    /**
     * Assert that an address holds exactly one invitation in the project and that it is still unclaimed. The expectations' subjects are the count and the claim, never the address.
     *
     * @param address - The address the invitation is for.
     */
    async expectInvitationOpen(address: string): Promise<void> {
      const rows = await new SupabaseAdminClient().findData('invitations', { email: address.trim().toLowerCase() });
      if (rows.type !== 'success')
        throw new Error(`identityProviderFlow: reading the invitations failed: ${rows.cause}`);
      const invitations = rows.data ?? [];
      // The count is asserted as a number: an expectation over the rows themselves would put the address into the report.
      const invitationCount = invitations.length;
      expect(invitationCount, 'invitations the address holds in the project').toBe(1);
      expect(invitations[0].claimed_at ?? null, 'when the invitation was claimed').toBeNull();
    },

    /**
     * Remove the invitations that addresses hold in the project, claimed or not; nothing for an empty list.
     *
     * @param addresses - The addresses.
     */
    async removeInvitationsOf(addresses: ReadonlyArray<string>): Promise<void> {
      if (addresses.length === 0) return;
      await new SupabaseAdminClient().removeInvitations({ emails: addresses });
    },

    /**
     * Assert that the catcher holds no mail at all for an address, read once.
     *
     * Only after a request whose answer comes once its work is done, such as the address confirmation's: a mail still on its way after an answer that comes first would pass it.
     *
     * @param address - The address.
     */
    async expectNoMailFor(address: string): Promise<void> {
      const mailCount = (await createEmailBucket(null, address).listSubjects()).length;
      expect(mailCount, 'mails the catcher holds for the address').toBe(0);
    },

    /**
     * Assert that the page is at the Contestant App's root, in English: its path and nothing after it.
     *
     * @param page - The test's page.
     */
    async expectAtAppRoot(page: Page): Promise<void> {
      await expect
        .poll(() => new URL(page.url()).pathname)
        .toBe(buildRoute({ route: 'ContestantAppHome', locale: 'en' }));
    },

    /**
     * Wait for the mail that confirms a typed address and return the URL a browser opens to follow it: the one link of the newest such mail, asserted to have the confirm page link's shape for the locale with the type `email_change`, on the run's origin and otherwise exactly as received.
     *
     * The returned URL holds a token. It goes to `openMailedLink` and nowhere else: not into an expectation, a step title or a log.
     *
     * @param address - The address the user typed.
     * @param options.locale - The locale the mail was asked for in; `en` when none was.
     * @param options.subject - The subject of the mail in that locale; the English one by default.
     */
    async confirmationLinkToOpen(
      address: string,
      { locale = 'en', subject = ADDRESS_CONFIRMATION_EMAIL_SUBJECT }: { locale?: string; subject?: string } = {}
    ): Promise<string> {
      const links = await createEmailBucket(null, address).getLinksInEmail(subject);
      // The count is asserted as a number: an expectation over the array itself would put the links, and so their tokens, into the report.
      const linkCount = links.length;
      expect(linkCount, 'the confirmation mail holds exactly one link').toBe(1);
      assertSignInLinkShape(links[0], { locale, type: 'email_change' });
      return toRunOrigin(links[0], runOriginFromEnv());
    },

    /**
     * Give an address's two one-mail-a-minute slots on the server back: the address confirmation's, and the sign-in and recovery mails' in the run's project. A request that must mail an address within the minute of its last mail of the same kind, such as a second account giving the same address, sends nothing without it.
     *
     * @param address - The address.
     */
    async giveBackMailSlot(address: string): Promise<void> {
      const admin = new SupabaseAdminClient();
      await admin.releaseConfirmationSlot(address);
      await admin.releaseLinkSlot(address);
    },

    /**
     * Wait for the sign-in mail of an address and return the URL a browser opens to follow it: the newest such mail's one link, asserted to have the confirm page link's shape for the locale, on the run's origin and otherwise exactly as received.
     *
     * The returned URL holds a token. It goes to `openMailedLink` and nowhere else: not into an expectation, a step title or a log.
     *
     * @param address - The address the link was asked for.
     */
    async signInLinkToOpen(address: string): Promise<string> {
      const links = await createEmailBucket(null, address).getLinksInEmail(SIGN_IN_LINK_EMAIL_SUBJECT);
      // The count is asserted as a number: an expectation over the array itself would put the links, and so their tokens, into the report.
      const linkCount = links.length;
      expect(linkCount, 'the sign-in mail holds exactly one link').toBe(1);
      assertSignInLinkShape(links[0], { locale: 'en' });
      return toRunOrigin(links[0], runOriginFromEnv());
    },

    /**
     * Wait for the recovery mail of an address and return the URL a browser opens to follow it: the newest such mail's one link, asserted to have the confirm page link's shape for the locale with the type `recovery`, on the run's origin and otherwise exactly as received.
     *
     * The returned URL holds a token. It goes to `openMailedLink` and nowhere else: not into an expectation, a step title or a log.
     *
     * @param address - The address the link was asked for.
     */
    async recoveryLinkToOpen(address: string): Promise<string> {
      const links = await createEmailBucket(null, address).getLinksInEmail(RECOVERY_LINK_EMAIL_SUBJECT);
      // The count is asserted as a number: an expectation over the array itself would put the links, and so their tokens, into the report.
      const linkCount = links.length;
      expect(linkCount, 'the recovery mail holds exactly one link').toBe(1);
      assertSignInLinkShape(links[0], { locale: 'en', type: 'recovery' });
      return toRunOrigin(links[0], runOriginFromEnv());
    },

    /**
     * Wait until the catcher holds exactly this many mails that confirm a typed address, for that address.
     *
     * For mails a request has already promised: the step waits for them to arrive. It is no way to show that a mail was not sent, since one still on its way would pass it.
     *
     * @param address - The address the user typed.
     * @param count - How many confirmation mails the address holds once every promised one has arrived.
     */
    async expectConfirmationMailCount(address: string, count: number): Promise<void> {
      const bucket = createEmailBucket(null, address);
      await expect
        .poll(
          async () =>
            (await bucket.listSubjects()).filter((subject) => subject === ADDRESS_CONFIRMATION_EMAIL_SUBJECT).length,
          { message: 'confirmation mails the catcher holds for the address', timeout: TIMEOUTS.slowPage }
        )
        .toBe(count);
    },

    /**
     * A fresh identity registers a candidate through the provider, as {@link mintIdentity} and {@link startIdentityProviderFlow} do, and arrives at the view that asks for an address. Given an address, the user gives it, presses Continue, accepts the terms of use and reaches the candidate's home; given none, the step ends on that view.
     *
     * @param page - The test's page.
     * @param options - The address to give; see {@link RegisterWithIdentityProviderOptions}.
     * @returns The minted `sub`.
     */
    async registerWithIdentityProvider(
      page: Page,
      { address }: RegisterWithIdentityProviderOptions = {}
    ): Promise<string> {
      const sub = await this.mintIdentity(page.context(), { outcome: 'success' });
      await this.startIdentityProviderFlow(page, { entityType: 'candidate' });
      const gate = createContestantIdentityProviderGate(page);
      await gate.expectShown({ variant: 'new', addressState: 'none', asks: 'email' });
      if (address === undefined) return sub;
      await gate.giveAddress(address);
      await gate.pressContinue();
      const termsOfUse = createContestantTermsOfUsePage(page);
      await termsOfUse.expectShown();
      await termsOfUse.acceptAndAdvance();
      await this.expectOwnEntityHome(page, sub);
      return sub;
    },

    /**
     * Open the link of the mail that confirms a typed address, as received, and confirm it on the confirm page, which proves the address. A browser that is signed in is signed out by that Continue first. The caller asserts the view that follows.
     *
     * @param page - The test's page, signed in or not.
     * @param address - The address the user typed.
     */
    async proveAddress(page: Page, address: string): Promise<void> {
      await openMailedLink(page, await this.confirmationLinkToOpen(address));
    },

    /**
     * Log out from the home of a candidate the provider registered. The candidate stands in no election, so it has nothing to be reminded of, no confirmation opens and the login page follows.
     *
     * @param page - The test's page, on the candidate's home.
     */
    async signOut(page: Page): Promise<void> {
      await createContestantLogoutButton(page).clickWithoutDialog();
    },

    /**
     * Remove the editor grant of a minted identity's account on the one entity of a type it edits, as an administrator who decides that the identity no longer edits it does. The entity is left in place. Asserts that exactly one grant was removed.
     *
     * @param sub - The minted `sub`.
     * @param entityType - The type of the entity.
     */
    async removeGrant(sub: string, entityType: ServedEntityType): Promise<void> {
      const admin = new SupabaseAdminClient();
      const entityId = await ownEntityIdOf(admin, sub, entityType);
      const removed = await admin.revokeEntityGrantById(await accountIdOf(admin, sub), entityType, entityId);
      expect(removed, 'editor grants removed').toBe(1);
    },

    /**
     * Assert that a minted identity's account edits no entity of a type in the project.
     *
     * @param sub - The minted `sub`.
     * @param entityType - The type of the entity.
     */
    async expectNoOwnEntity(sub: string, entityType: ServedEntityType): Promise<void> {
      const admin = new SupabaseAdminClient();
      const ids = await ownEntityIdsOf(admin, await accountIdOf(admin, sub), entityType);
      expect(ids, `${entityType} entities the identity edits in the project`).toHaveLength(0);
    },

    /**
     * Go to the address of the settings page, as a user who types it or follows a link kept from before does. The page belongs to the account, so its address names no entity. The step waits for nothing: the caller asserts what is shown there.
     *
     * @param page - The test's page.
     */
    async openSettings(page: Page): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppSettings', locale: 'en' }));
    },

    /**
     * Assert that the page is the settings page: the address is that page's, at the app's root, and its button that saves a new password is shown.
     *
     * @param page - The test's page.
     */
    async expectSettings(page: Page): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.settings.updateButton)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      await expect(page).toHaveURL(contestantSettingsUrlRe());
    }
  };
}

export type IdentityProviderFlowFixture = ReturnType<typeof createIdentityProviderFlow>;

/**
 * Playwright `test` with the identity-provider steps as a worker-scoped fixture. The steps hold no state of their own: each choice is stored in the browser context a step is given.
 */
export const test = base.extend<object, { identityProviderFlow: IdentityProviderFlowFixture }>({
  identityProviderFlow: [
    async ({}, use) => {
      await use(createIdentityProviderFlow());
    },
    { scope: 'worker' }
  ]
});

export { expect };
