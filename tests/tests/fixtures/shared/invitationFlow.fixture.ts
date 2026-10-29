/**
 * @file invitationFlow fixture.
 *
 * The invitation flow as semantic steps: seed an invitation, ask the `account-access` Edge Function for a sign-in link, read the mail, sign in with the link as received, claim, refresh, and read back what was granted. A spec reads each step as a sentence and holds no request, selector or table name of its own.
 *
 * The flow drives no page. A spec with no screen exchanges the mailed token for a session through `signInWithLink`; a spec that drives the application takes the URL to open from `signInLinkToOpen` or `recoveryLinkToOpen` and opens it through `openMailedLink`, which presses the confirm page's Continue, and the application does the rest. One step touches a page without driving it: `witnessPageRequest` adds a completion witness to a link request the page itself makes.
 *
 * Composed over `utils/accountAccessClient` (the function, as an anonymous visitor calls it), `utils/authApi` (the calls a signed-in user's own session makes), `utils/mailedLink` (the shape of a received link), `emailBucket.fixture` (the mail catcher) and the admin client (seeding, cleanup and the completion witness, with the service role).
 *
 * **Steps.**
 *   - Rows and grants: `readDedicatedRow`, `promisedGrant`, `projectGrant`, `editorGrantOn`.
 *   - Seeding: `seedEmailInvitation`, `seedCodeInvitation`, `seedUsedCode`, `unknownCode`, `seedProjectInvitation`, `inviteAndAskForLink`, `invitationsFor`, `expectSeedingAloneCreatedNothing`.
 *   - The function, as an anonymous visitor calls it: `checkCode`, `askForLink`, `askForLinkNamingUnopenedWitness`, `codeSignIn`, `answerCount`, `operationsWhoseAnswerHolds`, `expectHeadersLeaveThisProcess`.
 *   - A request a page makes, or does not make: `witnessPageRequest`, `expectNoPageRequest`.
 *   - The mail: `mailSubjects`, `expectMailCount`, `receiveSignInLink`, `signInLinkToOpen`, `recoveryLinkToOpen`, `expectNothingSent`, `expectNoMailAfter`.
 *   - The session: `signInWithLink`, `signInWithPassword`, `claim`, `claimNamingAnAddress`, `refresh`, `grantsClaimOf`, `grantsClaimOfToken`, `setFreshPassword`.
 *   - The service role's view: `grantRowsOf`, `invitationsAddressedTo`, `hasAccount`, `createUserWithPassword`, `releaseLinkSlot`.
 *   - Cleanup: `resetDedicatedRows`, `leftovers`, `removeEverythingUnderPrefix`, `leftoversUnderPrefix`.
 *
 * **The reserved rows.** A flow promises its entity-scope grants on dataset rows reserved for it, named by the `dedicatedRows` option: the invitation contract spec's candidate and organization when the option is absent, and otherwise exactly the rows given. A candidate admits one editor, so two specs that run side by side take different rows as they take different address prefixes. A step asked for a kind of row the flow was not given fails; the cleanup steps reach the flow's own rows and no others.
 *
 * **What a seeded invitation needs to be honoured.** The function and the claim honour a candidate's or an organization's invitation only while the project's registration settings allow the invitation's mode — email or code — for that entity type. Seeded for any other mode, the invitation reads as absent: its code is unknown, a link request for it sends nothing, and its claim is empty.
 *
 * **Where a token comes from.** The only source of a sign-in token is a received mail: {@link InvitationFlowFixture.receiveSignInLink} reads it from the catcher. Nothing here asks the database, the admin API or a function's answer for one.
 *
 * **How "nothing was sent" is asserted.** A link request is answered before its work is done, and the background work of two requests does not finish in the order they were made. So every request made through {@link InvitationFlowFixture.askForLink} carries a completion witness of its own, and the step returns only once that witness has read a finished outcome. {@link InvitationFlowFixture.expectNothingSent} takes such a finished request and nothing else: it asserts the outcome first, and only then looks at the mail catcher and the accounts. A request a page made gets its witness from {@link InvitationFlowFixture.witnessPageRequest}, and {@link InvitationFlowFixture.expectNoMailAfter} takes the outcome that step returned, in the same order. No step waits a fixed time and none infers one request's end from another's mail.
 *
 * **Credentials.** A link, a token, a code and a password are credentials. No step logs one, and none is ever the subject of an expectation: an expectation's message and its recorded values end up in the report.
 *
 * **Rigidity contract**: NO `expect.soft`, NO `try/catch` wrapping `expect(...)`.
 */

import { createServer } from 'node:http';
import { expect, test as base } from '@playwright/test';
import { createEmailBucket } from './emailBucket.fixture';
import { TIMEOUTS } from '../../helpers';
import { checkCode, codeSignIn, requestLink } from '../../utils/accountAccessClient';
import {
  claimInvitations,
  readGrantsClaim,
  refreshSession,
  setPassword,
  signInWithPassword,
  verifyTokenHash
} from '../../utils/authApi';
import {
  freshInvitationAddress,
  INVITATION_CANDIDATE_EXTERNAL_ID,
  INVITATION_ORGANIZATION_EXTERNAL_ID,
  INVITATION_TEST_ADDRESS_PREFIX,
  RECOVERY_LINK_EMAIL_SUBJECT,
  SIGN_IN_LINK_EMAIL_SUBJECT
} from '../../utils/invitationConstants';
import { assertSignInLinkShape, runOriginFromEnv, toRunOrigin } from '../../utils/mailedLink';
import { resolveE2eProjectId, SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { supabaseServiceRoleKey } from '../../utils/supabaseServiceRoleKey';
import type { SeededInvitation } from '@openvaa/dev-seed';
import type { Page, Route } from '@playwright/test';
import type { AccountAccessAnswer } from '../../utils/accountAccessClient';
import type { GrantSpec, RpcAnswer, SessionTokens } from '../../utils/authApi';
import type { EntityGrantTarget, LinkWitnessOutcome } from '../../utils/supabaseAdminClient';

/** Which of a flow's reserved dataset rows a step works on. */
export type DedicatedTarget = 'candidate' | 'organization';

/**
 * The dataset rows reserved for one flow: for each kind of entity, the `external_id` of the row.
 *
 * A kind left out is a kind the flow has no reserved row for.
 */
export type DedicatedRowIds = Readonly<Partial<Record<DedicatedTarget, string>>>;

/** A reserved row as the database holds it now. */
export interface DedicatedRow {
  id: string;
  confirmed: boolean;
}

/** A link request whose background work has finished: the function's answer, and what the work did. Only {@link InvitationFlowFixture.askForLink} makes one. */
export interface FinishedLinkRequest {
  readonly answer: AccountAccessAnswer;
  readonly outcome: LinkWitnessOutcome;
}

/**
 * A sign-in link as it was received, already asserted to have the confirm page link's shape for its locale.
 *
 * `tokenHash` and `type` are the received values. `tokenHash` is a credential: read `origin` and `pathname` in an expectation, never the token.
 */
export interface ReceivedSignInLink {
  readonly origin: string;
  readonly pathname: string;
  readonly type: string;
  readonly tokenHash: string;
}

/**
 * What every seeding step is told: whether the invitation it seeds confirms the entity it names.
 *
 * `true` confirms a named entity that has a name; `false` confirms none. Neither unconfirms an entity.
 */
export type SeedingOptions = { confirmEntity: boolean };

/** A user a test created through the admin API, with the password it was given. */
export interface PasswordUser {
  readonly email: string;
  readonly password: string;
}

/** The two rows reserved for the invitation contract spec: the rows of a flow that names none. */
const CONTRACT_SPEC_ROWS: DedicatedRowIds = Object.freeze({
  candidate: INVITATION_CANDIDATE_EXTERNAL_ID,
  organization: INVITATION_ORGANIZATION_EXTERNAL_ID
});

/** Every kind of reserved row, in the order the cleanup steps work through them. */
const DEDICATED_TARGETS: ReadonlyArray<DedicatedTarget> = Object.freeze(['candidate', 'organization']);

/** Every request to the `account-access` Edge Function, whatever host serves it. */
const ACCOUNT_ACCESS_ROUTE = '**/functions/v1/account-access';

/** The operations of the function that are answered before their work is done, and so take a completion witness. */
const WITNESSED_OPERATIONS: ReadonlyArray<string> = Object.freeze(['request-link', 'request-recovery']);

/** For each entity type an invitation can name: the table of its rows. */
const ENTITY_TABLES: Readonly<Record<EntityGrantTarget['entityType'], { table: string }>> = Object.freeze({
  candidate: { table: 'candidates' },
  organization: { table: 'organizations' }
});

/** An invitation as the service role reads it: its id and when it was claimed, null while it is open. */
export interface InvitationState {
  readonly id: string;
  readonly claimed_at: string | null;
}

/** A grant as a comparable string, for sorting. */
function grantKey(grant: GrantSpec): string {
  return [grant.scope, grant.target_type ?? '', grant.target_id ?? '', grant.role].join('|');
}

/** The four specification columns of a grant and nothing else, in a fixed key order. */
function toGrantSpec({ scope, target_type, target_id, role }: GrantSpec): GrantSpec {
  return { scope, target_type, target_id, role };
}

/** Grants as a set: reduced to their four columns and sorted, so two sets compare with `toEqual`. */
function asGrantSet(grants: ReadonlyArray<GrantSpec>): Array<GrantSpec> {
  return grants.map(toGrantSpec).sort((a, b) => grantKey(a).localeCompare(grantKey(b)));
}

/**
 * The body of a request as a JSON object, or undefined when the request has no body or its body is anything else.
 */
function jsonObjectOf(body: string | null): Record<string, unknown> | undefined {
  if (body === null) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return undefined;
  }
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : undefined;
}

/** The symbols a registration code is made of: Crockford's base-32 alphabet, which has no `I`, `L`, `O` or `U`. */
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** A password the auth service's policy accepts, unique per call. */
function freshPassword(): string {
  return `${crypto.randomUUID()}-Aa1!`;
}

/**
 * Create the invitation flow.
 *
 * @param admin - The admin client the flow seeds, cleans up and reads witnesses with. It decides the project every step works in.
 * @param options.addressPrefix - The local-part prefix of the addresses the composing spec invents, and the reach of its cleanup; the contract spec's by default. Two specs that run side by side take two prefixes.
 * @param options.dedicatedRows - The dataset rows the flow promises entity-scope grants on, each by its `external_id`; the contract spec's candidate and organization by default. When given, the flow has exactly the rows named: a step asked for the other kind fails, and the cleanup steps leave every other row alone.
 */
export function createInvitationFlow(
  admin: SupabaseAdminClient = new SupabaseAdminClient(),
  {
    addressPrefix = INVITATION_TEST_ADDRESS_PREFIX,
    dedicatedRows = CONTRACT_SPEC_ROWS
  }: { addressPrefix?: string; dedicatedRows?: DedicatedRowIds } = {}
) {
  /** The project the suite seeds, which every request names. */
  const projectId = resolveE2eProjectId();

  /** Every answer the function gave in this flow, by operation, kept to search for a value that must never be answered. */
  const answers: Array<{ operation: string; text: string }> = [];

  /** Keep an answer of the function for {@link operationsWhoseAnswerHolds}, and pass it on. */
  function recorded(operation: string, answer: AccountAccessAnswer): AccountAccessAnswer {
    answers.push({ operation, text: JSON.stringify(answer.body) });
    return answer;
  }

  /**
   * Where the flow's reserved row of a kind lives and how the dataset names it.
   *
   * @throws Error naming the kind when the flow was given no such row.
   */
  function dedicatedRowOf(target: DedicatedTarget): { table: string; externalId: string } {
    const externalId = dedicatedRows[target];
    if (externalId === undefined) throw new Error(`invitationFlow: this flow has no reserved ${target} row`);
    return { table: ENTITY_TABLES[target].table, externalId };
  }

  /** One of the flow's reserved rows as the database holds it now. */
  async function readDedicatedRow(target: DedicatedTarget): Promise<DedicatedRow> {
    const { table, externalId } = dedicatedRowOf(target);
    const found = await admin.findData(table, { external_id: { $eq: externalId } });
    const row = found.type === 'success' ? found.data?.[0] : undefined;
    if (typeof row?.id !== 'string' || typeof row.confirmed !== 'boolean') {
      throw new Error(
        `invitationFlow: no ${table} row with external_id ${externalId} was found in the suite's project`
      );
    }
    return { id: row.id, confirmed: row.confirmed };
  }

  /** The id of an entity of the suite's project, named as the dataset names it. */
  async function entityIdOf(entity: EntityGrantTarget): Promise<string> {
    const { table } = ENTITY_TABLES[entity.entityType];
    const found = await admin.findData(table, { external_id: { $eq: entity.externalId } });
    const id = found.type === 'success' ? found.data?.[0]?.id : undefined;
    if (typeof id !== 'string') {
      throw new Error(
        `invitationFlow: no ${table} row with external_id ${entity.externalId} was found in the suite's project`
      );
    }
    return id;
  }

  /** How many editor grants name an entity. Throws when the grants cannot be read. */
  async function editorCountOf(entity: EntityGrantTarget): Promise<number> {
    const found = await admin.findData('grants', {
      scope: { $eq: 'entity' },
      target_type: { $eq: entity.entityType },
      target_id: { $eq: await entityIdOf(entity) },
      role: { $eq: 'editor' }
    });
    if (found.type !== 'success') throw new Error(`invitationFlow: reading the grants failed: ${found.cause}`);
    return (found.data ?? []).length;
  }

  /** The invitations of the suite's project addressed to an address under the spec's prefix. Throws when they cannot be read. */
  async function invitationsUnderPrefix(): Promise<Array<{ id: string; email: string }>> {
    const found = await admin.findData('invitations', { email: { $like: `${addressPrefix}%` } });
    if (found.type !== 'success') throw new Error(`invitationFlow: reading the invitations failed: ${found.cause}`);
    return (found.data ?? []).map((row) => ({ id: String(row.id), email: String(row.email) }));
  }

  /** Every reserved row the flow has, with its table, as the database holds it now. */
  async function readEveryDedicatedRow(): Promise<Array<DedicatedRow & { table: string }>> {
    const rows: Array<DedicatedRow & { table: string }> = [];
    for (const target of DEDICATED_TARGETS) {
      if (dedicatedRows[target] === undefined) continue;
      rows.push({ ...(await readDedicatedRow(target)), table: dedicatedRowOf(target).table });
    }
    return rows;
  }

  /**
   * Assert that a finished link request sent nothing, the request's own outcome first.
   *
   * In this order: the outcome reads `not-sent`; then the catcher holds exactly `mails` mails for the address; then, when `noAccount` is set, no auth user holds the address. The last two are sound because the first has shown that the request's work is over.
   */
  async function expectNoMail(
    outcome: LinkWitnessOutcome,
    { address, mails = 0, noAccount = false }: { address: string; mails?: number; noAccount?: boolean }
  ): Promise<void> {
    expect(outcome, 'the request finished without handing a mail over').toBe('not-sent');
    expect(await mailSubjects(address), 'mails the catcher holds for the address').toHaveLength(mails);
    if (noAccount) expect(await admin.hasAuthUser(address), 'an account exists for the address').toBe(false);
  }

  /** The subject of every mail the catcher holds for an address right now. Throws when the catcher cannot be read. */
  function mailSubjects(address: string): Promise<Array<string>> {
    return createEmailBucket(null, address).listSubjects();
  }

  return {
    /** The project every step works in: the one the suite seeds. */
    projectId,

    /** A fresh address under the spec's prefix, which no request of this or an earlier run has used. */
    freshAddress: (): string => freshInvitationAddress(addressPrefix),

    /** The grant a project-scope invitation of the suite's project promises, as its four columns. */
    projectGrant(role: 'admin' | 'editor'): GrantSpec {
      return { scope: 'project', target_type: null, target_id: projectId, role };
    },

    /** The grant an entity-scope editor invitation for a reserved row promises, as its four columns. */
    promisedGrant(target: DedicatedTarget, row: DedicatedRow): GrantSpec {
      return { scope: 'entity', target_type: target, target_id: row.id, role: 'editor' };
    },

    /** The grant an editor invitation for an entity of the suite's project promises, as its four columns. */
    async editorGrantOn(entity: EntityGrantTarget): Promise<GrantSpec> {
      return { scope: 'entity', target_type: entity.entityType, target_id: await entityIdOf(entity), role: 'editor' };
    },

    readDedicatedRow,

    // -----------------------------------------------------------------------
    // Seeding
    // -----------------------------------------------------------------------

    /**
     * Assert what seeding an invitation alone has done for an address and an entity: nothing. No auth user holds the address, and nobody edits the entity.
     *
     * For the moment between the seeding and the link request: the account comes into being when a link is asked for, and the grant when the invited user claims.
     */
    async expectSeedingAloneCreatedNothing(entity: EntityGrantTarget, email: string): Promise<void> {
      expect(await admin.hasAuthUser(email), 'an account exists for the invited address').toBe(false);
      expect(await editorCountOf(entity), 'editor grants naming the invited entity').toBe(0);
    },

    /**
     * Seed an email invitation promising the editor's grant on a reserved row. Sends nothing.
     *
     * @param options.confirmEntity - Whether the seeding confirms the reserved row.
     * @throws Error naming the database error's code when the invitation is refused.
     */
    async seedEmailInvitation(
      target: DedicatedTarget,
      email: string,
      { confirmEntity }: SeedingOptions
    ): Promise<SeededInvitation> {
      const [seeded] = await admin.createInvitations(
        [{ target_type: target, external_id: dedicatedRowOf(target).externalId, email }],
        { confirmEntity }
      );
      return seeded;
    },

    /**
     * Seed an email invitation promising a role on the suite's project itself. Sends nothing, and confirms nothing: a project-scope promise names no entity.
     *
     * @param options.confirmEntity - Stated as every seeding states it; a project-scope promise names no entity, so the value confirms nothing.
     * @throws Error naming the database error's code when the invitation is refused.
     */
    async seedProjectInvitation(
      role: 'admin' | 'editor',
      email: string,
      { confirmEntity }: SeedingOptions
    ): Promise<SeededInvitation> {
      const [seeded] = await admin.createInvitations([{ scope: 'project', role, email }], { confirmEntity });
      return seeded;
    },

    /**
     * Seed a code invitation promising the editor's grant on a reserved row, and keep its code: the returned value is the only place the plaintext exists.
     *
     * @param options.confirmEntity - Whether the seeding confirms the reserved row.
     */
    async seedCodeInvitation(
      target: DedicatedTarget,
      { confirmEntity }: SeedingOptions
    ): Promise<{ invitation: SeededInvitation; code: string }> {
      const [invitation] = await admin.createInvitations(
        [{ target_type: target, external_id: dedicatedRowOf(target).externalId }],
        { confirmEntity }
      );
      if (!invitation?.code) throw new Error('invitationFlow: the code invitation was seeded without a code');
      return { invitation, code: invitation.code };
    },

    /**
     * Seed a code invitation for a reserved row and have it used, as a user does who registers with the code: a fresh address asks for a link with the code, the mailed link signs the user in, the user claims the invitation and sets a password.
     *
     * Everything goes through the function, the mail and the user's own session, with no page, so the code is used exactly as a registration in a browser leaves it. The address's one-mail-a-minute slot is given back at the end, so that the claimant can be mailed again at once.
     *
     * @param target - The reserved row the code promises the editor's grant on.
     * @param options.confirmEntity - Whether the seeding confirms the reserved row.
     * @param options.acceptTermsOfUse - Whether the claimant's acceptance of the project's terms of use is recorded, so that a sign-in lands on the entity's home. Not by default.
     * @returns The code, and the claimant with the password that was set. The code is a credential, as the password is.
     * @throws Error when a step of the registration does not go through. The error names the step and no credential.
     */
    async seedUsedCode(
      target: DedicatedTarget,
      { confirmEntity, acceptTermsOfUse = false }: SeedingOptions & { acceptTermsOfUse?: boolean }
    ): Promise<{ code: string; claimant: PasswordUser }> {
      const [invitation] = await admin.createInvitations(
        [{ target_type: target, external_id: dedicatedRowOf(target).externalId }],
        { confirmEntity }
      );
      if (!invitation?.code) throw new Error('invitationFlow: the code invitation was seeded without a code');
      const code = invitation.code;
      const email = freshInvitationAddress(addressPrefix);

      const witness = await admin.openLinkWitness();
      await requestLink({ projectId, code, email, witness });
      if ((await admin.awaitLinkWitness(witness)) !== 'sent') {
        throw new Error('invitationFlow: the link request made with the seeded code handed no mail over');
      }

      const links = await createEmailBucket(null, email).getLinksInEmail(SIGN_IN_LINK_EMAIL_SUBJECT);
      if (links.length !== 1) throw new Error(`invitationFlow: the sign-in mail holds ${links.length} links`);
      const tokenHash = assertSignInLinkShape(links[0], { locale: 'en' });
      const session = await verifyTokenHash({ tokenHash, type: new URL(links[0]).searchParams.get('type') ?? '' });

      const claimed = await claimInvitations({ accessToken: session.accessToken, projectId });
      if (claimed.status !== 200) {
        throw new Error(`invitationFlow: the claim of the seeded code was answered with ${claimed.status}`);
      }

      const password = freshPassword();
      await setPassword({ accessToken: session.accessToken, password });
      if (acceptTermsOfUse) await admin.acceptTermsOfUse(email);
      await admin.releaseLinkSlot(email);

      return { code, claimant: { email, password } };
    },

    /**
     * A registration code in the form every code has that no invitation holds: twelve symbols drawn at random, in three groups of four.
     *
     * Unique per call. That it names nothing is as certain as that two codes drawn at random differ.
     */
    unknownCode(): string {
      const symbols = Array.from(
        crypto.getRandomValues(new Uint8Array(12)),
        (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]
      ).join('');
      return `${symbols.slice(0, 4)}-${symbols.slice(4, 8)}-${symbols.slice(8)}`;
    },

    /**
     * The invitations of the suite's project that promise a grant on a reserved row, each as its id, its creation time and whether it is claimed.
     */
    async invitationsFor(
      target: DedicatedTarget
    ): Promise<Array<{ id: string; created_at: string; claimed: boolean }>> {
      const { id } = await readDedicatedRow(target);
      const found = await admin.findData('invitations', { target_id: { $eq: id } });
      if (found.type !== 'success') throw new Error(`invitationFlow: reading the invitations failed: ${found.cause}`);
      return (found.data ?? []).map((row) => ({
        id: String(row.id),
        created_at: String(row.created_at),
        claimed: row.claimed_at != null
      }));
    },

    /**
     * Seed an email invitation for a reserved row and ask for its link in one step, as an administrator's "invite" does. It returns once the request has handed its mail over.
     *
     * @param options.confirmEntity - Whether the seeding confirms the reserved row.
     * @param options.locale - The locale of the mail and of the link's path.
     */
    inviteAndAskForLink(
      target: DedicatedTarget,
      email: string,
      { confirmEntity, locale }: SeedingOptions & { locale?: string }
    ): Promise<SeededInvitation> {
      return admin.inviteByEmail({
        entityType: target,
        externalId: dedicatedRowOf(target).externalId,
        email,
        locale,
        confirmEntity
      });
    },

    // -----------------------------------------------------------------------
    // The function, as an anonymous visitor calls it
    // -----------------------------------------------------------------------

    /** Ask whether a code is valid, used or unknown. */
    async checkCode(code: string): Promise<AccountAccessAnswer> {
      return recorded('check-code', await checkCode({ projectId, code }));
    },

    /**
     * Ask for a sign-in link — by address, by code and address, or by code alone — and wait for the end of that request's background work.
     *
     * The request carries a completion witness opened for it. The step returns once the witness has read a finished outcome, so the caller may assert on the mail catcher and the accounts straight away, in either direction.
     *
     * @param fields.email - The address typed.
     * @param fields.code - The code typed.
     * @param fields.locale - The locale of the mail and of the link's path.
     * @param fields.headers - Extra request headers.
     */
    async askForLink(fields: {
      email?: string;
      code?: string;
      locale?: string;
      headers?: Record<string, string>;
    }): Promise<FinishedLinkRequest> {
      const witness = await admin.openLinkWitness();
      const answer = recorded('request-link', await requestLink({ projectId, ...fields, witness }));
      const outcome = await admin.awaitLinkWitness(witness);
      return { answer, outcome };
    },

    /**
     * Ask for a sign-in link naming a witness id that nobody opened. Such a request has no witness to wait for, so only its answer is returned and nothing may be concluded about what it sent.
     */
    async askForLinkNamingUnopenedWitness(email: string): Promise<AccountAccessAnswer> {
      return recorded('request-link', await requestLink({ projectId, email, witness: crypto.randomUUID() }));
    },

    /**
     * Run an action in which a page asks the function for a link, give that request a completion witness, and return what the request's background work did.
     *
     * What it changes of the request: the first request the page sends to the function whose body names the operation `request-link` or `request-recovery` goes out with the same body plus the one member `witness`, and with the service role's key as its bearer, without which the function ignores a witness. Nothing else of it is touched — not its other headers, its address or any other member — and every other request the page makes is passed on as it is. The function's answer does not depend on a witness, so the page is answered exactly as it would be without this step.
     *
     * The step fails when the page sent no such request by the time expectations stop waiting, and when it sent more than one: a second request would carry no witness, and nothing could be concluded about its work.
     *
     * The returned outcome is the only thing an assertion that no mail was sent may follow: hand it to {@link expectNoMailAfter}. It is read once the request's work is over, so a caller may look at the mail catcher and the accounts straight away, in either direction.
     *
     * @param page - The page that makes the request.
     * @param action - What makes the page ask: typically a press of a button, through a page object's step.
     * @returns `sent` when the request's work handed a mail over, `not-sent` when it did not.
     */
    async witnessPageRequest(page: Page, action: () => Promise<void>): Promise<LinkWitnessOutcome> {
      const witness = await admin.openLinkWitness();
      let witnessed = 0;
      let unwitnessed = 0;
      const addWitness = async (route: Route): Promise<void> => {
        const request = route.request();
        const body = request.method() === 'POST' ? jsonObjectOf(request.postData()) : undefined;
        if (!body || !WITNESSED_OPERATIONS.includes(String(body.operation))) return route.fallback();
        if (witnessed > 0) {
          unwitnessed += 1;
          return route.fallback();
        }
        witnessed += 1;
        return route.continue({
          postData: JSON.stringify({ ...body, witness }),
          headers: { ...request.headers(), authorization: `Bearer ${supabaseServiceRoleKey()}` }
        });
      };

      await page.route(ACCOUNT_ACCESS_ROUTE, addWitness);
      await action();
      await expect.poll(() => witnessed, 'link requests of the page that were given the witness').toBe(1);
      await page.unroute(ACCOUNT_ACCESS_ROUTE, addWitness);
      expect(unwitnessed, 'further link requests of the page, which carried no witness').toBe(0);

      return admin.awaitLinkWitness(witness);
    },

    /**
     * Run an action in which a page must ask the function for nothing, and assert that it asked for nothing.
     *
     * Every request the page sends to the function while the action runs is counted, whatever its operation, and passed on as it is. The step fails on that count when one was made.
     *
     * The action ends with the assertion of what the page shows for the press it made: a page that does send makes its request while it handles the press, before it shows anything of the outcome, so a request has been counted by the time that assertion holds.
     *
     * @param page - The page that is watched.
     * @param action - What is done on the page, ending in an assertion of what the page then shows.
     */
    async expectNoPageRequest(page: Page, action: () => Promise<void>): Promise<void> {
      let requests = 0;
      const count = async (route: Route): Promise<void> => {
        requests += 1;
        return route.fallback();
      };

      await page.route(ACCOUNT_ACCESS_ROUTE, count);
      await action();
      await page.unroute(ACCOUNT_ACCESS_ROUTE, count);
      expect(requests, 'requests the page made to the account-access function').toBe(0);
    },

    /** Sign in with a used code and its claimant's password. */
    async codeSignIn(code: string, password: string): Promise<AccountAccessAnswer> {
      return recorded('code-sign-in', await codeSignIn({ projectId, code, password }));
    },

    /** How many answers of the function this flow has kept. */
    answerCount(): number {
      return answers.length;
    },

    /**
     * The operations whose answer holds a text, compared without regard to case. It returns operation names only, so an expectation over it puts no answer into the report.
     */
    operationsWhoseAnswerHolds(text: string): Array<string> {
      const needle = text.toLowerCase();
      return answers.filter((answer) => answer.text.toLowerCase().includes(needle)).map((answer) => answer.operation);
    },

    /**
     * Show that this process sends request headers as given, by sending them to a listener of its own and reading back what arrived.
     *
     * A request with hostile headers proves nothing if the runtime's `fetch` drops them before they leave.
     */
    async expectHeadersLeaveThisProcess(headers: Record<string, string>): Promise<void> {
      const received: Record<string, string | undefined> = {};
      const listener = createServer((request, response) => {
        for (const name of Object.keys(headers)) {
          const value = request.headers[name.toLowerCase()];
          received[name] = Array.isArray(value) ? value.join(', ') : value;
        }
        response.end();
      });
      await new Promise<void>((resolve) => listener.listen(0, '127.0.0.1', resolve));
      const address = listener.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      await fetch(`http://127.0.0.1:${port}/`, { method: 'POST', headers, body: '{}' });
      await new Promise<void>((resolve) => listener.close(() => resolve()));
      expect(received).toEqual(headers);
    },

    // -----------------------------------------------------------------------
    // The mail
    // -----------------------------------------------------------------------

    mailSubjects,

    /**
     * Wait until the catcher holds exactly this many mails for an address.
     *
     * For a mail that a finished request's `sent` outcome has already promised: it was handed over, and the catcher lists it a moment later. The step is no way to show that nothing was sent, because a mail still on its way would pass it: a count that must not grow is asserted by {@link expectNoMailAfter}, after the request's witness.
     *
     * @param address - The recipient.
     * @param count - How many mails the address holds once every promised mail has arrived.
     */
    async expectMailCount(address: string, count: number): Promise<void> {
      await expect
        .poll(async () => (await mailSubjects(address)).length, {
          message: 'mails the catcher holds for the address',
          timeout: TIMEOUTS.slowPage
        })
        .toBe(count);
    },

    /**
     * Wait for the sign-in mail of an address and return its link as received.
     *
     * The mail must hold exactly one link, and the link must have the confirm page link's shape for the locale; a link that lacks it fails here and is never repaired.
     *
     * @param address - The recipient.
     * @param options.locale - The locale that was requested; `en` when none was.
     * @param options.subject - The subject of the mail in that locale; the English one by default.
     */
    async receiveSignInLink(
      address: string,
      { locale = 'en', subject = SIGN_IN_LINK_EMAIL_SUBJECT }: { locale?: string; subject?: string } = {}
    ): Promise<ReceivedSignInLink> {
      const links = await createEmailBucket(null, address).getLinksInEmail(subject);
      // The count is asserted as a number: an expectation over the array itself would put the links, and so their tokens, into the report.
      const linkCount = links.length;
      expect(linkCount, 'the sign-in mail holds exactly one link').toBe(1);
      const tokenHash = assertSignInLinkShape(links[0], { locale });
      const url = new URL(links[0]);
      return { origin: url.origin, pathname: url.pathname, type: url.searchParams.get('type') ?? '', tokenHash };
    },

    /**
     * Wait for the sign-in mail of an address and return the URL a browser opens to follow it: the mail's one link, asserted to have the confirm page link's shape for the locale, on the run's origin and otherwise exactly as received.
     *
     * The returned URL holds the sign-in token. It goes to `openMailedLink` and nowhere else: not into an expectation, a step title or a log.
     *
     * @param address - The recipient.
     * @param options.locale - The locale that was requested; `en` when none was.
     * @param options.subject - The subject of the mail in that locale; the English one by default.
     */
    async signInLinkToOpen(
      address: string,
      { locale = 'en', subject = SIGN_IN_LINK_EMAIL_SUBJECT }: { locale?: string; subject?: string } = {}
    ): Promise<string> {
      const links = await createEmailBucket(null, address).getLinksInEmail(subject);
      const linkCount = links.length;
      expect(linkCount, 'the sign-in mail holds exactly one link').toBe(1);
      assertSignInLinkShape(links[0], { locale });
      return toRunOrigin(links[0], runOriginFromEnv());
    },

    /**
     * Wait for the password-recovery mail of an address and return the URL a browser opens to follow it: the mail's one link, asserted to have the confirm page link's shape for the locale with the type `recovery`, on the run's origin and otherwise exactly as received.
     *
     * A sign-in link is refused here. The function answers a recovery request for an address that has an open invitation and no account with the sign-in mail, which {@link signInLinkToOpen} reads.
     *
     * The link is that of the newest mail with the subject. A request is answered before its mail is sent, so read the link only after the request's completion witness has read `sent`: before that, the newest such mail of an address that was mailed before is an earlier one, whose link is spent.
     *
     * The returned URL holds the recovery token. It goes to `openMailedLink` and nowhere else: not into an expectation, a step title or a log.
     *
     * @param address - The recipient.
     * @param options.locale - The locale that was requested; `en` when none was.
     * @param options.subject - The subject of the mail in that locale; the English one by default.
     */
    async recoveryLinkToOpen(
      address: string,
      { locale = 'en', subject = RECOVERY_LINK_EMAIL_SUBJECT }: { locale?: string; subject?: string } = {}
    ): Promise<string> {
      const links = await createEmailBucket(null, address).getLinksInEmail(subject);
      const linkCount = links.length;
      expect(linkCount, 'the recovery mail holds exactly one link').toBe(1);
      assertSignInLinkShape(links[0], { locale, type: 'recovery' });
      return toRunOrigin(links[0], runOriginFromEnv());
    },

    /**
     * Assert that a finished link request sent nothing.
     *
     * In this order: the request's own witness reads `not-sent`; then the catcher holds exactly `mails` mails for the address, none by default; then, when `noAccount` is set, no auth user holds the address. The last two are sound because the first has shown that the request's work is over.
     *
     * @param request - A request {@link askForLink} returned, so its witness has finished.
     * @param expectation.address - The address a mail would have gone to.
     * @param expectation.mails - How many mails the address holds from earlier requests.
     * @param expectation.noAccount - Whether to assert that no account exists for the address.
     */
    expectNothingSent(
      request: FinishedLinkRequest,
      expectation: { address: string; mails?: number; noAccount?: boolean }
    ): Promise<void> {
      return expectNoMail(request.outcome, expectation);
    },

    /**
     * Assert that a link request a page made sent nothing.
     *
     * In this order: the outcome reads `not-sent`; then the catcher holds exactly `mails` mails for the address, none by default; then, when `noAccount` is set, no auth user holds the address. The last two are sound because the first has shown that the request's work is over.
     *
     * @param outcome - What {@link witnessPageRequest} returned for the request, so its work has finished.
     * @param expectation.address - The address a mail would have gone to.
     * @param expectation.mails - How many mails the address holds from earlier requests.
     * @param expectation.noAccount - Whether to assert that no account exists for the address.
     */
    expectNoMailAfter(
      outcome: LinkWitnessOutcome,
      expectation: { address: string; mails?: number; noAccount?: boolean }
    ): Promise<void> {
      return expectNoMail(outcome, expectation);
    },

    // -----------------------------------------------------------------------
    // The session
    // -----------------------------------------------------------------------

    /** Sign in with a received link: its token and its type, as received, are exchanged for a session. */
    signInWithLink(link: ReceivedSignInLink): Promise<SessionTokens> {
      return verifyTokenHash({ tokenHash: link.tokenHash, type: link.type });
    },

    /** Sign in with an address and a password. */
    signInWithPassword(user: PasswordUser): Promise<SessionTokens> {
      return signInWithPassword(user);
    },

    /** Claim the signed-in user's invitations in the suite's project, and return the answer as received. */
    claim(session: SessionTokens): Promise<RpcAnswer> {
      return claimInvitations({ accessToken: session.accessToken, projectId });
    },

    /** Call the claim with an address beside the project, as a caller would who tried to claim for someone else. */
    claimNamingAnAddress(session: SessionTokens, email: string): Promise<RpcAnswer> {
      return claimInvitations({ accessToken: session.accessToken, projectId, extraArgs: { p_email: email } });
    },

    /** Refresh a session: the new access token carries the grants the user holds now. */
    refresh(session: SessionTokens): Promise<SessionTokens> {
      return refreshSession(session.refreshToken);
    },

    /** The grants a session's access token carries, as a set of four-column tuples. */
    grantsClaimOf(session: SessionTokens): Array<GrantSpec> {
      return asGrantSet(readGrantsClaim(session.accessToken));
    },

    /** The grants an access token carries, as a set of four-column tuples. For a token a function answered with. */
    grantsClaimOfToken(accessToken: string): Array<GrantSpec> {
      return asGrantSet(readGrantsClaim(accessToken));
    },

    /** Set a new password for the signed-in user and return it. */
    async setFreshPassword(session: SessionTokens): Promise<string> {
      const password = freshPassword();
      await setPassword({ accessToken: session.accessToken, password });
      return password;
    },

    // -----------------------------------------------------------------------
    // The service role's view
    // -----------------------------------------------------------------------

    /** The rows of `public.grants` a user holds, as a set of four-column tuples. */
    async grantRowsOf(email: string): Promise<Array<GrantSpec>> {
      return asGrantSet(await admin.grantRowsForUser(email));
    },

    /**
     * The invitations of the suite's project addressed to an address, each as its id and when it was claimed.
     *
     * @throws Error when the invitations cannot be read.
     */
    async invitationsAddressedTo(email: string): Promise<Array<InvitationState>> {
      const found = await admin.findData('invitations', { email: { $eq: email.trim().toLowerCase() } });
      if (found.type !== 'success') throw new Error(`invitationFlow: reading the invitations failed: ${found.cause}`);
      return (found.data ?? []).map((row) => ({
        id: String(row.id),
        claimed_at: typeof row.claimed_at === 'string' ? row.claimed_at : null
      }));
    },

    /** Whether an auth user holds an address. Throws when the users cannot be listed. */
    hasAccount(email: string): Promise<boolean> {
      return admin.hasAuthUser(email);
    },

    /**
     * Create a user with a confirmed address and a password through the admin API, optionally as the editor of a reserved row.
     *
     * @param options.email - The user's address; a fresh one by default. It must begin with the spec's prefix, or the cleanup does not find the user.
     * @param options.editorOf - The reserved row the user is made the editor of. None by default.
     * @param options.acceptTermsOfUse - Whether the user's acceptance of the project's terms of use is recorded. Not by default.
     */
    async createUserWithPassword({
      email = freshInvitationAddress(addressPrefix),
      editorOf,
      acceptTermsOfUse = false
    }: { email?: string; editorOf?: DedicatedTarget; acceptTermsOfUse?: boolean } = {}): Promise<PasswordUser> {
      if (!email.startsWith(addressPrefix)) {
        throw new Error(`invitationFlow: the address ${email} does not begin with ${addressPrefix}`);
      }
      const user = { email, password: freshPassword() };
      await admin.forceRegisterUser(user.email, user.password, {
        entityGrants: editorOf ? [{ entityType: editorOf, externalId: dedicatedRowOf(editorOf).externalId }] : [],
        acceptTermsOfUse
      });
      return user;
    },

    /** Give back the one-mail-per-address slot of an address, so the next request for it is not answered by the interval. */
    releaseLinkSlot(email: string): Promise<void> {
      return admin.releaseLinkSlot(email);
    },

    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------

    /**
     * Put the flow's reserved rows back as the dataset seeds them, and remove everything a run of the spec creates: every user whose address begins with the spec's prefix, with the user's grants and invitations, and every invitation on the flow's reserved rows.
     *
     * Safe on a clean database and after an interrupted run alike.
     */
    async resetDedicatedRows(): Promise<void> {
      await admin.removeUsersByEmailPrefix(addressPrefix);
      const rows = await readEveryDedicatedRow();
      await admin.removeInvitations({ targetIds: rows.map((row) => row.id) });
      for (const row of rows) await admin.update(row.table, row.id, { confirmed: false });
    },

    /** What a run left behind: invitations on the flow's reserved rows, and users whose address begins with the spec's prefix. */
    async leftovers(): Promise<{ invitations: number; users: number }> {
      const rows = await readEveryDedicatedRow();
      let invitations = 0;
      if (rows.length > 0) {
        const found = await admin.findData('invitations', { target_id: { $in: rows.map((row) => row.id) } });
        if (found.type !== 'success') throw new Error(`invitationFlow: reading the invitations failed: ${found.cause}`);
        invitations = (found.data ?? []).length;
      }
      return { invitations, users: await admin.countUsersByEmailPrefix(addressPrefix) };
    },

    /**
     * Remove everything a spec created under its address prefix: every user whose address begins with it, with the user's grants and invitations, and every invitation addressed to such an address that nobody claimed.
     *
     * For a spec that writes on no reserved row. Safe on a clean database and after an interrupted run alike.
     */
    async removeEverythingUnderPrefix(): Promise<void> {
      await admin.removeUsersByEmailPrefix(addressPrefix);
      const emails = (await invitationsUnderPrefix()).map((invitation) => invitation.email);
      await admin.removeInvitations({ emails });
    },

    /** What a run left behind under the spec's address prefix: invitations addressed to it, and users whose address begins with it. */
    async leftoversUnderPrefix(): Promise<{ invitations: number; users: number }> {
      return {
        invitations: (await invitationsUnderPrefix()).length,
        users: await admin.countUsersByEmailPrefix(addressPrefix)
      };
    }
  };
}

export type InvitationFlowFixture = ReturnType<typeof createInvitationFlow>;

/**
 * Playwright `test` with the invitation flow as a worker-scoped fixture, so that `beforeAll` and `afterAll` can use it too. The flow keeps the function's answers of one worker; a serial spec runs in one worker.
 */
export const test = base.extend<object, { invitationFlow: InvitationFlowFixture }>({
  invitationFlow: [
    async ({}, use) => {
      await use(createInvitationFlow());
    },
    { scope: 'worker' }
  ]
});

export { expect };
