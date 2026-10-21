import { expect, test } from '../../fixtures/shared/invitationFlow.fixture';
import { TIMEOUTS } from '../../helpers/timeouts';
import { SIGN_IN_LINK_EMAIL_SUBJECT, SIGN_IN_LINK_EMAIL_SUBJECT_FI } from '../../utils/invitationConstants';
import type { SeededInvitation } from '@openvaa/dev-seed';
import type { ReceivedSignInLink } from '../../fixtures/shared/invitationFlow.fixture';
import type { AccountAccessAnswer } from '../../utils/accountAccessClient';
import type { GrantSpec, SessionTokens } from '../../utils/authApi';

/**
 * # The server contract of invitations, with no screen
 *
 * An invitation promises one grant to whoever proves control of an address or presents a code. This spec stands where an anonymous visitor and then a signed-in user stand, and observes on the running stack what the server answers and what it refuses: the `account-access` Edge Function (`check-code`, `request-link`, `code-sign-in`), the mail it sends, the auth service that turns a mailed token into a session, and the `claim_invitations` RPC that turns the session's invitations into grants.
 *
 * It drives no page. The path of a mailed link through the browser belongs to the specs that drive the application.
 *
 * ## What it writes
 *
 * Invitations and grants on the two rows the base dataset reserves for it — the candidate and the organization named in `utils/invitationConstants` — and users whose address begins with the spec's own prefix. `beforeAll` removes what an interrupted run left and puts the two rows back as seeded; `afterAll` does the same and asserts that nothing is left.
 *
 * ## Time
 *
 * Every address is fresh for the run, so no test depends on the time since another run. Two tests need an address whose one-mail-per-minute slot is taken, and each takes it itself with the request just before the one under test.
 *
 * A link request is answered before its work is done. Every request here is made through the flow's `askForLink`, which returns once the request's own completion witness has finished, and an assertion that nothing was sent goes through `expectNothingSent`, which asserts the witness's outcome before it looks at the mail catcher or the accounts. The one exception is the last test, whose request names a witness nobody opened: it asserts the answer and nothing else.
 *
 * ## Order
 *
 * One serial walk: the tests share the invitations, the code and the claimant of the tests before them.
 *
 * Rigidity contract: HARD assertions only (no expect.soft / try-catch / .catch around an expectation). No expectation takes a link, a token, a code or a password as its subject.
 */

/** What the code check answers for a code that names an open invitation. */
const CODE_VALID = { status: 200, body: { status: 'valid' } };

/** What the code check answers for a code whose invitation is claimed. */
const CODE_USED = { status: 200, body: { status: 'used' } };

/** What the code check answers for a string that names no invitation of the project. */
const CODE_UNKNOWN = { status: 200, body: { status: 'unknown' } };

/** The one answer of a code sign-in that does not sign in. */
const INVALID_CREDENTIALS = { status: 200, body: { result: 'invalid-credentials' } };

/** Request headers that name another site, as a caller would send to move the mailed link there. */
const HOSTILE_HEADERS = { Origin: 'https://evil.example', 'X-Forwarded-Host': 'evil.example' };

/** A string that names no invitation code. */
function noSuchCode(): string {
  return `NO-SUCH-${crypto.randomUUID()}`;
}

/** The answer of a claim that claimed and skipped nothing. */
function nothingClaimed(passwordSet: boolean) {
  return { status: 200, body: { claimed: [], skipped: [], password_set: passwordSet } };
}

test.describe('the server contract of invitations', () => {
  test.describe.configure({ mode: 'serial' });

  /** The grant an invitation for the reserved candidate promises. */
  let candidateGrant: GrantSpec;
  /** The grant an invitation for the reserved organization promises. */
  let organizationGrant: GrantSpec;
  /** The address invited by email to the reserved candidate. */
  let invitedAddress: string;
  /** The invitation seeded for {@link invitedAddress}. */
  let emailInvitation: SeededInvitation;
  /** The code of the invitation seeded for the reserved organization. */
  let code: string;
  /** What the function answered the invited address: the answer every other link request is compared with. */
  let invitedAnswer: AccountAccessAnswer;
  /** The link the invited address received. */
  let invitedLink: ReceivedSignInLink;
  /** The user who claimed the code, and that user's session after the claim. */
  let claimant: { address: string; session: SessionTokens };

  test.beforeAll(async ({ invitationFlow }) => {
    await invitationFlow.resetDedicatedRows();
  });

  test.afterAll(async ({ invitationFlow }) => {
    await invitationFlow.resetDedicatedRows();
    expect(await invitationFlow.leftovers()).toEqual({ invitations: 0, users: 0 });
  });

  test('the seeding call states whether the entity it names is confirmed: a candidate seeded confirmed is, an organization seeded unconfirmed is not', async ({
    invitationFlow: flow
  }) => {
    expect((await flow.readDedicatedRow('candidate')).confirmed).toBe(false);
    expect((await flow.readDedicatedRow('organization')).confirmed).toBe(false);

    invitedAddress = flow.freshAddress();
    emailInvitation = await flow.seedEmailInvitation('candidate', invitedAddress, { confirmEntity: true });
    const codeInvitation = await flow.seedCodeInvitation('organization', { confirmEntity: false });
    code = codeInvitation.code;

    const candidate = await flow.readDedicatedRow('candidate');
    const organization = await flow.readDedicatedRow('organization');
    expect(candidate.confirmed).toBe(true);
    expect(organization.confirmed).toBe(false);
    expect(emailInvitation.entity_confirmed).toBe(true);
    expect(codeInvitation.invitation.entity_confirmed).toBe(false);

    candidateGrant = flow.promisedGrant('candidate', candidate);
    organizationGrant = flow.promisedGrant('organization', organization);
    expect(emailInvitation).toMatchObject({ ...candidateGrant, email: invitedAddress, code: null });
    expect(codeInvitation.invitation.email).toBeNull();
    expect(codeInvitation.invitation.target_id).toBe(organization.id);
  });

  test('a duplicate invitation is refused, and the first is left unchanged', async ({ invitationFlow: flow }) => {
    const before = await flow.invitationsFor('candidate');
    expect(before).toHaveLength(1);
    expect(before[0].id).toBe(emailInvitation.id);

    // 23505 is the database's unique-violation code.
    await expect(flow.seedEmailInvitation('candidate', invitedAddress, { confirmEntity: true })).rejects.toThrow(
      /23505/
    );

    expect(await flow.invitationsFor('candidate')).toEqual(before);
  });

  test('the code check answers one word: valid for a seeded code, unknown for a string that names nothing', async ({
    invitationFlow: flow
  }) => {
    expect(await flow.checkCode(code)).toEqual(CODE_VALID);
    expect(await flow.checkCode(noSuchCode())).toEqual(CODE_UNKNOWN);
  });

  test('an invited address receives exactly one sign-in mail, whose link is the callback link of the requested locale', async ({
    invitationFlow: flow
  }) => {
    const request = await flow.askForLink({ email: invitedAddress });
    invitedAnswer = request.answer;
    expect(request.answer).toEqual({ status: 200, body: { accepted: true } });
    expect(request.outcome).toBe('sent');

    invitedLink = await flow.receiveSignInLink(invitedAddress, { locale: 'en' });
    expect(invitedLink.pathname).toBe('/en/api/auth/callback');
    expect(await flow.mailSubjects(invitedAddress)).toEqual([SIGN_IN_LINK_EMAIL_SUBJECT]);
  });

  test('the mailed link signs in to a session that holds exactly the promised grant after the claim and a refresh', async ({
    invitationFlow: flow
  }) => {
    const session = await flow.signInWithLink(invitedLink);
    expect(flow.grantsClaimOf(session)).toEqual([]);
    expect(await flow.grantRowsOf(invitedAddress)).toEqual([]);

    expect(await flow.claim(session)).toEqual({
      status: 200,
      body: { claimed: [candidateGrant], skipped: [], password_set: false }
    });

    const refreshed = await flow.refresh(session);
    expect(flow.grantsClaimOf(refreshed)).toEqual([candidateGrant]);
    expect(await flow.grantRowsOf(invitedAddress)).toEqual([candidateGrant]);

    expect(await flow.claim(refreshed)).toEqual(nothingClaimed(false));
    expect(await flow.grantRowsOf(invitedAddress)).toEqual([candidateGrant]);
  });

  test('nobody else claims an invitation: a user who proved another address claims nothing, and the claim takes no address', async ({
    invitationFlow: flow
  }) => {
    const openAddress = flow.freshAddress();
    const open = await flow.seedEmailInvitation('organization', openAddress, { confirmEntity: true });

    const other = await flow.createUserWithPassword();
    const session = await flow.signInWithPassword(other);

    expect(await flow.claim(session)).toEqual(nothingClaimed(true));
    expect(await flow.grantRowsOf(other.email)).toEqual([]);

    // PGRST202 is the API's answer for a function it does not have under the arguments given.
    const refusal = await flow.claimNamingAnAddress(session, openAddress);
    expect(refusal.status).toBe(404);
    expect(refusal.body).toMatchObject({ code: 'PGRST202' });
    expect(await flow.grantRowsOf(other.email)).toEqual([]);

    const stillOpen = (await flow.invitationsFor('organization')).find((invitation) => invitation.id === open.id);
    expect(stillOpen?.claimed).toBe(false);
  });

  test('an address with no invitation is answered like an invited one, and gets no mail and no account', async ({
    invitationFlow: flow
  }) => {
    const stranger = flow.freshAddress();

    const request = await flow.askForLink({ email: stranger });

    expect(request.answer).toEqual(invitedAnswer);
    await flow.expectNothingSent(request, { address: stranger, noAccount: true });
  });

  test('a second request for one address inside the interval is answered alike and sends no second mail', async ({
    invitationFlow: flow
  }) => {
    const address = flow.freshAddress();
    await flow.seedEmailInvitation('organization', address, { confirmEntity: true });

    const first = await flow.askForLink({ email: address });
    expect(first.outcome).toBe('sent');
    await flow.receiveSignInLink(address);

    const second = await flow.askForLink({ email: address });

    expect(second.answer).toEqual(first.answer);
    expect(second.answer).toEqual(invitedAnswer);
    await flow.expectNothingSent(second, { address, mails: 1 });
  });

  test('request headers that name another site do not move the mailed link', async ({ invitationFlow: flow }) => {
    await flow.expectHeadersLeaveThisProcess(HOSTILE_HEADERS);
    const address = flow.freshAddress();
    await flow.seedEmailInvitation('organization', address, { confirmEntity: true });

    const request = await flow.askForLink({ email: address, headers: HOSTILE_HEADERS });

    expect(request.answer).toEqual(invitedAnswer);
    expect(request.outcome).toBe('sent');
    const link = await flow.receiveSignInLink(address);
    expect(link.origin).toBe(invitedLink.origin);
    expect(link.origin).not.toContain('evil.example');
  });

  test('the requested locale reaches the path of the link and the text of the mail', async ({
    invitationFlow: flow
  }) => {
    const address = flow.freshAddress();

    await flow.inviteAndAskForLink('organization', address, { confirmEntity: true, locale: 'fi' });

    const link = await flow.receiveSignInLink(address, { locale: 'fi', subject: SIGN_IN_LINK_EMAIL_SUBJECT_FI });
    expect(link.pathname).toBe('/fi/api/auth/callback');
    expect(link.origin).toBe(invitedLink.origin);
    expect(await flow.mailSubjects(address)).toEqual([SIGN_IN_LINK_EMAIL_SUBJECT_FI]);
  });

  test('a code binds a fresh address, whose mailed link claims the grant the code promises; the code then answers used', async ({
    invitationFlow: flow
  }) => {
    const address = flow.freshAddress();

    const request = await flow.askForLink({ code, email: address });
    expect(request.answer).toEqual(invitedAnswer);
    expect(request.outcome).toBe('sent');

    const session = await flow.signInWithLink(await flow.receiveSignInLink(address));
    expect(flow.grantsClaimOf(session)).toEqual([]);
    expect(await flow.claim(session)).toEqual({
      status: 200,
      body: { claimed: [organizationGrant], skipped: [], password_set: false }
    });

    const refreshed = await flow.refresh(session);
    expect(flow.grantsClaimOf(refreshed)).toEqual([organizationGrant]);
    expect(await flow.grantRowsOf(address)).toEqual([organizationGrant]);
    expect(await flow.checkCode(code)).toEqual(CODE_USED);

    claimant = { address, session: refreshed };
  });

  test('a used code grants nothing twice: another address that presents it gets no mail, no account and no grant', async ({
    invitationFlow: flow
  }) => {
    // A used code asks for a link to its claimant, whatever address is typed with it. The claimant's slot is given back and taken again here, by a request that presents the code alone, so that the request under test meets a slot taken a moment ago and not one about to run out.
    await flow.releaseLinkSlot(claimant.address);
    const byCodeAlone = await flow.askForLink({ code });
    expect(byCodeAlone.answer).toEqual(invitedAnswer);
    expect(byCodeAlone.outcome).toBe('sent');
    await expect
      .poll(async () => (await flow.mailSubjects(claimant.address)).length, { timeout: TIMEOUTS.slowPage })
      .toBe(2);

    const other = flow.freshAddress();
    const request = await flow.askForLink({ code, email: other });

    expect(request.answer).toEqual(invitedAnswer);
    await flow.expectNothingSent(request, { address: other, noAccount: true });
    expect(await flow.mailSubjects(claimant.address)).toHaveLength(2);

    const session = await flow.signInWithPassword(await flow.createUserWithPassword({ email: other }));
    expect(await flow.claim(session)).toEqual(nothingClaimed(true));
    expect(await flow.grantRowsOf(other)).toEqual([]);
    expect(await flow.grantRowsOf(claimant.address)).toEqual([organizationGrant]);
    expect(await flow.checkCode(code)).toEqual(CODE_USED);
  });

  test("a used code signs in with its claimant's password only, and no answer names the claimant", async ({
    invitationFlow: flow
  }) => {
    const password = await flow.setFreshPassword(claimant.session);

    const signedIn = await flow.codeSignIn(code, password);
    expect(signedIn.status).toBe(200);
    const body = signedIn.body as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['access_token', 'refresh_token', 'result']);
    expect(body.result).toBe('signed-in');
    expect(typeof body.access_token === 'string' && body.access_token !== '').toBe(true);
    expect(typeof body.refresh_token === 'string' && body.refresh_token !== '').toBe(true);
    expect(flow.grantsClaimOfToken(String(body.access_token))).toEqual([organizationGrant]);

    const wrongPassword = await flow.codeSignIn(code, `${password}-wrong`);
    const unknownCode = await flow.codeSignIn(noSuchCode(), password);
    expect(wrongPassword).toEqual(unknownCode);
    expect(wrongPassword).toEqual(INVALID_CREDENTIALS);

    expect(flow.answerCount()).toBeGreaterThan(0);
    expect(flow.operationsWhoseAnswerHolds(claimant.address)).toEqual([]);
  });

  test('a returning user is mailed a link, and the claim reports a set password and nothing claimed', async ({
    invitationFlow: flow
  }) => {
    const returning = await flow.createUserWithPassword({ editorOf: 'organization' });

    const request = await flow.askForLink({ email: returning.email });
    expect(request.answer).toEqual(invitedAnswer);
    expect(request.outcome).toBe('sent');

    const session = await flow.signInWithLink(await flow.receiveSignInLink(returning.email));
    expect(flow.grantsClaimOf(session)).toEqual([organizationGrant]);
    expect(await flow.claim(session)).toEqual(nothingClaimed(true));
    expect(await flow.grantRowsOf(returning.email)).toEqual([organizationGrant]);
  });

  test('a request naming a witness nobody opened is answered like any other', async ({ invitationFlow: flow }) => {
    // The address has no invitation, so the request creates nothing that the cleanup after this test could miss: it has no witness to wait for.
    const answer = await flow.askForLinkNamingUnopenedWitness(flow.freshAddress());

    expect(answer).toEqual(invitedAnswer);
  });
});
