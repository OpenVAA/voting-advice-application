/**
 * The address confirmation, path by path, with fakes that record every call in the order it was made, and the small readers the handler uses to wire it.
 *
 * No mocks of a module and no network: every effect of `confirmAddress` is a dependency, and each fake here is one.
 */

import { describe, expect, it } from 'vitest';
import {
  actionLinkToken,
  bearerToken,
  callerTokenRefused,
  confirmAddress,
  identityProviderOf,
  isCompletedChange,
  isSingleConfirmation,
  registeredProjectsOf
} from './addressConfirmation.ts';
import { ADDRESS_CONFIRMATION_MAIL_TEMPLATES } from './mailTemplates.ts';
import type {
  CallerAccount,
  AddressConfirmationDeps,
  EmailChangeKind,
  EmailChangeTokens
} from './addressConfirmation.ts';
import type { AddressConfirmationOutcome, ConfirmAddressRequest } from './contract.ts';
import type { OutgoingMail } from './linkIssue.ts';

const PROJECT = '00000000-0000-0000-0000-000000000001';
const SITE_URL = 'http://localhost:5173';
const CALLER_TOKEN = 'caller.access.token';
const USER_ID = '11111111-2222-3333-4444-555555555555';
const PLACEHOLDER = 'b3f1c2d4@bank-auth.placeholder';
const TYPED = '  Person@Example.ORG ';
const TRIMMED = 'Person@Example.ORG';
const CURRENT_HASHED = 'current-hashed-token';
const CURRENT_LINK_TOKEN = 'current-link-token';
const NEW_HASHED = 'new-hashed-token';
const NEW_LINK_TOKEN = 'new-link-token';

type Step =
  | 'callerAccount'
  | 'takeSlot'
  | 'addressHoldsOpenInvitation'
  | 'releaseSlot'
  | 'generateEmailChange:current'
  | 'generateEmailChange:new'
  | 'verifyCurrent'
  | 'restoreAddress'
  | 'sendMail';

interface Recorded {
  calls: Array<{ step: Step; args: Array<unknown> }>;
  logs: Array<Array<unknown>>;
  mails: Array<OutgoingMail>;
}

interface Behaviour {
  account?: CallerAccount | null;
  accountThrows?: boolean;
  slot?: boolean;
  slotThrows?: boolean;
  invited?: boolean;
  invitedThrows?: boolean;
  current?: EmailChangeTokens | 'email-exists';
  next?: EmailChangeTokens | 'email-exists';
  failAt?: 'generateEmailChange:current' | 'generateEmailChange:new' | 'verifyCurrent' | 'sendMail';
  releaseRejects?: boolean;
  verified?: 'confirmed' | 'completed';
  restoreRejects?: boolean;
  logThrows?: boolean;
  siteUrl?: string;
}

const OTHER_PROJECT = '00000000-0000-0000-0000-000000000002';

const ACCOUNT: CallerAccount = {
  id: USER_ID,
  email: PLACEHOLDER,
  identityProvider: 'idura',
  registeredProjects: [PROJECT]
};

/** A failure whose message, like a real one, quotes what it failed on. Only its name and code may reach a log line. */
function failure(step: string): Error {
  return Object.assign(new Error(`${step} failed for ${TRIMMED} with ${NEW_LINK_TOKEN} and ${CALLER_TOKEN}`), {
    name: 'AuthApiError',
    code: 'unexpected_failure'
  });
}

function request(overrides: Partial<ConfirmAddressRequest> = {}): ConfirmAddressRequest {
  return { operation: 'confirm-address', projectId: PROJECT, email: TYPED, locale: 'fi', ...overrides };
}

function harness(behaviour: Behaviour = {}): { deps: AddressConfirmationDeps; recorded: Recorded } {
  const recorded: Recorded = { calls: [], logs: [], mails: [] };
  const record = (step: Step, ...args: Array<unknown>) => recorded.calls.push({ step, args });
  const failIf = (step: Behaviour['failAt']) => {
    if (behaviour.failAt === step) throw failure(step as string);
  };

  const deps: AddressConfirmationDeps = {
    siteUrl: behaviour.siteUrl ?? SITE_URL,
    async callerAccount(token) {
      record('callerAccount', token);
      if (behaviour.accountThrows) throw failure('callerAccount');
      return behaviour.account === undefined ? ACCOUNT : behaviour.account;
    },
    async takeSlot(slot) {
      record('takeSlot', slot);
      if (behaviour.slotThrows) throw failure('takeSlot');
      return behaviour.slot ?? true;
    },
    async addressHoldsOpenInvitation(query) {
      record('addressHoldsOpenInvitation', query);
      if (behaviour.invitedThrows) throw failure('addressHoldsOpenInvitation');
      return behaviour.invited ?? false;
    },
    async releaseSlot(slot) {
      record('releaseSlot', slot);
      if (behaviour.releaseRejects) throw failure('releaseSlot');
    },
    async generateEmailChange(kind: EmailChangeKind, addresses) {
      const step = `generateEmailChange:${kind}` as const;
      record(step, addresses);
      failIf(step);
      if (kind === 'current')
        return behaviour.current ?? { hashedToken: CURRENT_HASHED, actionLinkToken: CURRENT_LINK_TOKEN };
      return behaviour.next ?? { hashedToken: NEW_HASHED, actionLinkToken: NEW_LINK_TOKEN };
    },
    async verifyCurrent(tokenHash) {
      record('verifyCurrent', tokenHash);
      failIf('verifyCurrent');
      return behaviour.verified ?? 'confirmed';
    },
    async restoreAddress(restoration) {
      record('restoreAddress', restoration);
      if (behaviour.restoreRejects) throw failure('restoreAddress');
    },
    async sendMail(mail) {
      record('sendMail', mail);
      failIf('sendMail');
      recorded.mails.push(mail);
    },
    log(...args) {
      recorded.logs.push(args);
      if (behaviour.logThrows) throw new Error('the logger failed');
    }
  };
  return { deps, recorded };
}

const steps = (recorded: Recorded) => recorded.calls.map(({ step }) => step);

/** Every string a log line received, flattened. */
const logged = (recorded: Recorded) => JSON.stringify(recorded.logs);

describe('confirmAddress: the whole recipe', () => {
  it('asks the effects in the order current link, new link, verify the current token, send, and answers sent', async () => {
    const { deps, recorded } = harness();
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('sent');
    expect(steps(recorded)).toEqual([
      'callerAccount',
      'takeSlot',
      'addressHoldsOpenInvitation',
      'generateEmailChange:current',
      'generateEmailChange:new',
      'verifyCurrent',
      'sendMail'
    ]);
  });

  it('reads the caller from the token it was given, and takes the slot for that caller, the project and the trimmed address', async () => {
    const { deps, recorded } = harness();
    await confirmAddress(request(), CALLER_TOKEN, deps);
    expect(recorded.calls[0].args).toEqual([CALLER_TOKEN]);
    expect(recorded.calls[1].args).toEqual([{ projectId: PROJECT, userId: USER_ID, email: TRIMMED }]);
  });

  it('asks both links from the account’s own current address to the trimmed typed one', async () => {
    const { deps, recorded } = harness();
    await confirmAddress(request(), CALLER_TOKEN, deps);
    const asked = recorded.calls.filter(({ step }) => step.startsWith('generateEmailChange'));
    for (const { args } of asked) expect(args).toEqual([{ currentEmail: PLACEHOLDER, newEmail: TRIMMED }]);
  });

  it('verifies the current link by its hashed token and mails the new link by the token of its action link', async () => {
    const { deps, recorded } = harness();
    await confirmAddress(request(), CALLER_TOKEN, deps);
    expect(recorded.calls.find(({ step }) => step === 'verifyCurrent')?.args).toEqual([CURRENT_HASHED]);
    const [mail] = recorded.mails;
    const link = new URL(mail.text.split('\n')[1]);
    expect(link.searchParams.get('token_hash')).toBe(NEW_LINK_TOKEN);
    expect(mail.text).not.toContain(NEW_HASHED);
    expect(mail.text).not.toContain(CURRENT_HASHED);
    expect(mail.text).not.toContain(CURRENT_LINK_TOKEN);
  });

  it('mails the typed address, never the placeholder, the confirmation mail of the request’s locale with an email_change link', async () => {
    const { deps, recorded } = harness();
    await confirmAddress(request(), CALLER_TOKEN, deps);
    expect(recorded.mails).toHaveLength(1);
    const [mail] = recorded.mails;
    expect(mail.to).toBe(TRIMMED);
    expect(mail.subject).toBe(ADDRESS_CONFIRMATION_MAIL_TEMPLATES.fi.subject);
    const link = new URL(mail.text.split('\n')[1]);
    expect(link.origin).toBe(SITE_URL);
    expect(link.pathname).toBe('/fi/auth/confirm');
    expect(link.searchParams.get('type')).toBe('email_change');
    expect(JSON.stringify(recorded.mails)).not.toContain(PLACEHOLDER);
  });

  it('mails in the default locale for a locale outside the set', async () => {
    const { deps, recorded } = harness();
    await confirmAddress(request({ locale: 'de' }), CALLER_TOKEN, deps);
    expect(recorded.mails[0].subject).toBe(ADDRESS_CONFIRMATION_MAIL_TEMPLATES.en.subject);
    expect(new URL(recorded.mails[0].text.split('\n')[1]).pathname).toBe('/en/auth/confirm');
  });

  it('repeats the whole recipe on a second request, so the second mail carries the second new link', async () => {
    const first = harness();
    await confirmAddress(request(), CALLER_TOKEN, first.deps);
    const second = harness({ next: { hashedToken: 'other', actionLinkToken: 'second-new-link-token' } });
    await expect(confirmAddress(request(), CALLER_TOKEN, second.deps)).resolves.toBe('sent');
    expect(steps(second.recorded)).toEqual(steps(first.recorded));
    expect(new URL(second.recorded.mails[0].text.split('\n')[1]).searchParams.get('token_hash')).toBe(
      'second-new-link-token'
    );
  });

  it('gives no slot back after a mail was sent, and writes no log line', async () => {
    const { deps, recorded } = harness();
    await confirmAddress(request(), CALLER_TOKEN, deps);
    expect(steps(recorded)).not.toContain('releaseSlot');
    expect(recorded.logs).toEqual([]);
  });
});

describe('confirmAddress: who may ask', () => {
  it.each([
    ['no token', null],
    ['an empty token', '']
  ])('answers unauthenticated for %s, asking nothing', async (_label, token) => {
    const { deps, recorded } = harness();
    await expect(confirmAddress(request(), token, deps)).resolves.toBe('unauthenticated');
    expect(recorded.calls).toEqual([]);
  });

  it('answers unauthenticated when the token names no account, and asks nothing more', async () => {
    const { deps, recorded } = harness({ account: null });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('unauthenticated');
    expect(steps(recorded)).toEqual(['callerAccount']);
  });

  it.each<[string, CallerAccount]>([
    ['an account no identity provider made', { ...ACCOUNT, identityProvider: null }],
    ['an account whose provider is an empty word', { ...ACCOUNT, identityProvider: '' }],
    ['an identity-provider account whose address is proved', { ...ACCOUNT, email: 'proved@example.org' }],
    ['an identity-provider account with no address', { ...ACCOUNT, email: null }],
    ['an account on a subdomain of the placeholder domain', { ...ACCOUNT, email: 'x@sub.bank-auth.placeholder' }]
  ])('refuses %s, and takes no slot', async (_label, account) => {
    const { deps, recorded } = harness({ account });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(steps(recorded)).toEqual(['callerAccount']);
  });

  it.each<[string, Array<string>]>([
    ['a project the account registered no entity in', [OTHER_PROJECT]],
    ['an account that registered no entity in any project', []]
  ])('refuses %s, and takes no slot', async (_label, registeredProjects) => {
    const { deps, recorded } = harness({ account: { ...ACCOUNT, registeredProjects } });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(steps(recorded)).toEqual(['callerAccount']);
  });

  it('answers for any project the account registered in, not only the first', async () => {
    const { deps } = harness({ account: { ...ACCOUNT, registeredProjects: [OTHER_PROJECT, PROJECT] } });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('sent');
  });

  it.each([['someone@bank-auth.placeholder'], ['  SOMEONE@Bank-Auth.Placeholder ']])(
    'refuses the typed address %j on the placeholder domain, and takes no slot',
    async (email) => {
      const { deps, recorded } = harness();
      await expect(confirmAddress(request({ email }), CALLER_TOKEN, deps)).resolves.toBe('refused');
      expect(steps(recorded)).toEqual(['callerAccount']);
    }
  );

  it('refuses when the caller cannot be read, and logs the failure by its name and code alone', async () => {
    const { deps, recorded } = harness({ accountThrows: true });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(steps(recorded)).toEqual(['callerAccount']);
    expect(recorded.logs).toHaveLength(1);
    expect(recorded.logs[0][1]).toEqual({ name: 'AuthApiError', code: 'unexpected_failure' });
  });

  it('refuses before the slot when the configured site origin cannot carry a link', async () => {
    const { deps, recorded } = harness({ siteUrl: 'https://vaa.example/app' });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(steps(recorded)).toEqual(['callerAccount']);
  });
});

describe('confirmAddress: the slot', () => {
  it('refuses when the slot is not given, and asks the auth service nothing', async () => {
    const { deps, recorded } = harness({ slot: false });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(steps(recorded)).toEqual(['callerAccount', 'takeSlot']);
  });

  it('refuses when the slot cannot be taken, and gives nothing back', async () => {
    const { deps, recorded } = harness({ slotThrows: true });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(steps(recorded)).toEqual(['callerAccount', 'takeSlot']);
    expect(recorded.logs).toHaveLength(1);
  });

  it('treats any answer of the slot but true as not given', async () => {
    const { deps, recorded } = harness({ slot: 'true' as unknown as boolean });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(steps(recorded)).toEqual(['callerAccount', 'takeSlot']);
  });
});

describe('confirmAddress: an address another account holds', () => {
  it('answers in-use when the current link answers that the address exists, giving the address’s slot back and mailing nothing', async () => {
    const { deps, recorded } = harness({ current: 'email-exists' });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('in-use');
    expect(steps(recorded)).toEqual([
      'callerAccount',
      'takeSlot',
      'addressHoldsOpenInvitation',
      'generateEmailChange:current',
      'releaseSlot'
    ]);
    expect(recorded.calls.at(-1)?.args).toEqual([{ email: TRIMMED }]);
    expect(recorded.mails).toEqual([]);
  });

  it('answers in-use when the new link answers that the address exists, giving the slot back and verifying nothing', async () => {
    const { deps, recorded } = harness({ next: 'email-exists' });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('in-use');
    expect(steps(recorded)).toEqual([
      'callerAccount',
      'takeSlot',
      'addressHoldsOpenInvitation',
      'generateEmailChange:current',
      'generateEmailChange:new',
      'releaseSlot'
    ]);
    expect(recorded.mails).toEqual([]);
  });

  it('still answers in-use when the slot cannot be given back, and logs that', async () => {
    const { deps, recorded } = harness({ current: 'email-exists', releaseRejects: true });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('in-use');
    expect(recorded.logs).toHaveLength(1);
  });
});

describe('confirmAddress: an address an open invitation holds', () => {
  it('answers in-use when an open invitation of the project holds the address, giving the address’s slot back and asking the auth service for no link', async () => {
    const { deps, recorded } = harness({ invited: true });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('in-use');
    expect(steps(recorded)).toEqual(['callerAccount', 'takeSlot', 'addressHoldsOpenInvitation', 'releaseSlot']);
    expect(recorded.calls.at(-1)?.args).toEqual([{ email: TRIMMED }]);
    expect(recorded.mails).toEqual([]);
    expect(recorded.logs).toEqual([]);
  });

  it('asks about the trimmed address in the request’s project, once the slot is taken', async () => {
    const { deps, recorded } = harness();
    await confirmAddress(request(), CALLER_TOKEN, deps);
    const asked = recorded.calls.filter(({ step }) => step === 'addressHoldsOpenInvitation');
    expect(asked.map(({ args }) => args)).toEqual([[{ projectId: PROJECT, email: TRIMMED }]]);
    expect(steps(recorded).indexOf('addressHoldsOpenInvitation')).toBe(steps(recorded).indexOf('takeSlot') + 1);
  });

  it('goes on to the links and the mail when no open invitation holds the address', async () => {
    const { deps, recorded } = harness({ invited: false });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('sent');
    expect(steps(recorded)).toContain('generateEmailChange:current');
    expect(recorded.mails).toHaveLength(1);
  });

  it('answers refused when the check rejects, giving the slot back, asking the auth service for no link and logging no address, token or user', async () => {
    const { deps, recorded } = harness({ invitedThrows: true });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(steps(recorded)).toEqual(['callerAccount', 'takeSlot', 'addressHoldsOpenInvitation', 'releaseSlot']);
    expect(recorded.calls.at(-1)?.args).toEqual([{ email: TRIMMED }]);
    expect(recorded.mails).toEqual([]);
    expect(recorded.logs).toHaveLength(1);
    for (const secret of [TRIMMED, TRIMMED.toLowerCase(), PLACEHOLDER, CALLER_TOKEN, USER_ID]) {
      expect(logged(recorded)).not.toContain(secret);
    }
  });

  it('answers refused for an answer of the check that is neither true nor false, giving the slot back and asking for no link', async () => {
    const { deps, recorded } = harness({ invited: 'true' as unknown as boolean });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(steps(recorded)).toEqual(['callerAccount', 'takeSlot', 'addressHoldsOpenInvitation', 'releaseSlot']);
    expect(recorded.mails).toEqual([]);
  });

  it('asks nothing about invitations when the slot is not given', async () => {
    const { deps, recorded } = harness({ slot: false, invited: true });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(steps(recorded)).not.toContain('addressHoldsOpenInvitation');
  });
});

describe('confirmAddress: a failure after the slot', () => {
  it.each([['generateEmailChange:current'], ['generateEmailChange:new'], ['verifyCurrent'], ['sendMail']] as const)(
    'answers refused when %s fails, gives the address’s slot back and logs no address, token or link',
    async (failAt) => {
      const { deps, recorded } = harness({ failAt });
      await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
      const order = steps(recorded);
      expect(order.at(-1)).toBe('releaseSlot');
      expect(order.indexOf(failAt)).toBe(order.length - 2);
      expect(recorded.calls.at(-1)?.args).toEqual([{ email: TRIMMED }]);
      expect(recorded.logs.length).toBeGreaterThan(0);
      for (const secret of [
        TRIMMED,
        TRIMMED.toLowerCase(),
        PLACEHOLDER,
        CALLER_TOKEN,
        NEW_LINK_TOKEN,
        CURRENT_HASHED,
        'http',
        USER_ID
      ]) {
        expect(logged(recorded)).not.toContain(secret);
      }
    }
  );

  it.each<[string, Behaviour]>([
    ['the current link carries no hashed token', { current: { hashedToken: '', actionLinkToken: CURRENT_LINK_TOKEN } }],
    ['the new link carries no action-link token', { next: { hashedToken: NEW_HASHED, actionLinkToken: '' } }],
    [
      'the new link answers something that is not a token',
      { next: { hashedToken: NEW_HASHED, actionLinkToken: 7 as unknown as string } }
    ]
  ])('answers refused when %s, sending nothing and giving the slot back', async (_label, behaviour) => {
    const { deps, recorded } = harness(behaviour);
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(recorded.mails).toEqual([]);
    expect(steps(recorded).at(-1)).toBe('releaseSlot');
  });

  it('answers refused, not a rejection, when the slot cannot be given back either', async () => {
    const { deps, recorded } = harness({ failAt: 'sendMail', releaseRejects: true });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(recorded.logs).toHaveLength(2);
  });

  it('answers its outcome when the logger itself throws', async () => {
    const { deps } = harness({ failAt: 'verifyCurrent', logThrows: true });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
  });

  it('never answers anything but the four outcomes', async () => {
    const outcomes = new Set<AddressConfirmationOutcome>();
    const cases: Array<[Behaviour, string | null]> = [
      [{}, CALLER_TOKEN],
      [{}, null],
      [{ current: 'email-exists' }, CALLER_TOKEN],
      [{ failAt: 'sendMail' }, CALLER_TOKEN]
    ];
    for (const [behaviour, token] of cases)
      outcomes.add(await confirmAddress(request(), token, harness(behaviour).deps));
    expect([...outcomes].sort()).toEqual(['in-use', 'refused', 'sent', 'unauthenticated']);
  });
});

describe('confirmAddress: a change of address the current address’s link completed alone', () => {
  it('puts the placeholder back, mails nothing, gives the address’s slot back and answers refused', async () => {
    const { deps, recorded } = harness({ verified: 'completed' });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(steps(recorded)).toEqual([
      'callerAccount',
      'takeSlot',
      'addressHoldsOpenInvitation',
      'generateEmailChange:current',
      'generateEmailChange:new',
      'verifyCurrent',
      'restoreAddress',
      'releaseSlot'
    ]);
    expect(recorded.calls.find(({ step }) => step === 'restoreAddress')?.args).toEqual([
      { userId: USER_ID, email: PLACEHOLDER }
    ]);
    expect(recorded.mails).toEqual([]);
  });

  it('logs the completed change, naming no address, token or user', async () => {
    const { deps, recorded } = harness({ verified: 'completed' });
    await confirmAddress(request(), CALLER_TOKEN, deps);
    expect(recorded.logs).toHaveLength(1);
    for (const secret of [TRIMMED, TRIMMED.toLowerCase(), PLACEHOLDER, CALLER_TOKEN, CURRENT_HASHED, USER_ID]) {
      expect(logged(recorded)).not.toContain(secret);
    }
  });

  it('still answers refused, mailing nothing, when the placeholder cannot be put back, and logs that too', async () => {
    const { deps, recorded } = harness({ verified: 'completed', restoreRejects: true });
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('refused');
    expect(recorded.mails).toEqual([]);
    expect(steps(recorded).at(-1)).toBe('releaseSlot');
    expect(recorded.logs).toHaveLength(2);
    expect(logged(recorded)).not.toContain(PLACEHOLDER);
  });

  it('puts nothing back after a verification that confirmed the current address alone', async () => {
    const { deps, recorded } = harness();
    await expect(confirmAddress(request(), CALLER_TOKEN, deps)).resolves.toBe('sent');
    expect(steps(recorded)).not.toContain('restoreAddress');
  });
});

describe('bearerToken', () => {
  it('reads the token of a bearer header, whatever the case of the scheme', () => {
    expect(bearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(bearerToken('bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it.each([[null], [undefined], [''], ['Bearer'], ['Bearer '], ['Basic abc'], ['abc.def.ghi'], ['Bearer a b']])(
    'reads no token from %j',
    (header) => {
      expect(bearerToken(header)).toBeNull();
    }
  );
});

describe('callerTokenRefused', () => {
  it.each([[401], [403]])('is true for an answer of the auth service with the status %d', (status) => {
    expect(callerTokenRefused({ name: 'AuthApiError', status, code: 'bad_jwt' })).toBe(true);
  });

  it.each([[{ status: 500 }], [{ status: 0 }], [{ status: '403' }], [{}], [null], [new Error('fetch failed')]])(
    'is false for %j, a failure that says nothing about the token',
    (error) => {
      expect(callerTokenRefused(error)).toBe(false);
    }
  );
});

describe('identityProviderOf', () => {
  it('reads the provider the metadata names', () => {
    expect(identityProviderOf({ identity_provider: 'idura', other: 1 })).toBe('idura');
  });

  it.each([[null], [undefined], ['idura'], [[]], [{}], [{ identity_provider: '' }], [{ identity_provider: 3 }]])(
    'reads no provider from %j',
    (metadata) => {
      expect(identityProviderOf(metadata)).toBeNull();
    }
  );

  it('reads no inherited key', () => {
    expect(identityProviderOf(Object.create({ identity_provider: 'idura' }))).toBeNull();
  });
});

describe('registeredProjectsOf', () => {
  it('reads the projects the record names, lower-cased', () => {
    const metadata = {
      identity_provider: 'idura',
      registered_entities: { [PROJECT]: { candidate: USER_ID }, 'ABCDEF00-0000-0000-0000-000000000003': {} }
    };
    expect(registeredProjectsOf(metadata)).toEqual([PROJECT, 'abcdef00-0000-0000-0000-000000000003']);
  });

  it('skips an entry whose value is not an object', () => {
    expect(registeredProjectsOf({ registered_entities: { [PROJECT]: 'x', [OTHER_PROJECT]: null } })).toEqual([]);
  });

  it.each([
    [null],
    [undefined],
    ['idura'],
    [[]],
    [{}],
    [{ registered_entities: null }],
    [{ registered_entities: [PROJECT] }],
    [{ registered_entities: 'x' }]
  ])('reads no project from %j', (metadata) => {
    expect(registeredProjectsOf(metadata)).toEqual([]);
  });

  it('reads no inherited record', () => {
    expect(registeredProjectsOf(Object.create({ registered_entities: { [PROJECT]: {} } }))).toEqual([]);
  });
});

describe('actionLinkToken', () => {
  it('reads the token parameter of an action link, not its token hash', () => {
    const link = 'http://127.0.0.1:54321/auth/v1/verify?token=abc123&type=email_change&redirect_to=http://x.example';
    expect(actionLinkToken(link)).toBe('abc123');
  });

  it.each([[''], ['not a url'], ['http://x.example/verify?type=email_change'], [undefined], [7]])(
    'reads an empty token from %j',
    (link) => {
      expect(actionLinkToken(link)).toBe('');
    }
  );
});

describe('isCompletedChange', () => {
  it('is true for a 200 that issued a session', () => {
    expect(isCompletedChange(200, { access_token: 'a session', refresh_token: 'r' })).toBe(true);
  });

  it.each<[number, unknown]>([
    [200, { msg: 'Confirmation link accepted.', code: 200 }],
    [403, { access_token: 'a session' }],
    [500, null],
    [200, 'not an object']
  ])('is false for the status %d with %j', (status, body) => {
    expect(isCompletedChange(status, body)).toBe(false);
  });
});

describe('isSingleConfirmation', () => {
  it('is true for a 200 that issued no session', () => {
    expect(isSingleConfirmation(200, { msg: 'Confirmation link accepted.', code: 200 })).toBe(true);
  });

  it.each<[number, unknown]>([
    [200, { access_token: 'a session', refresh_token: 'r' }],
    [403, { error_code: 'otp_expired' }],
    [500, null],
    [200, 'not an object']
  ])('is false for the status %d with %j', (status, body) => {
    expect(isSingleConfirmation(status, body)).toBe(false);
  });
});
