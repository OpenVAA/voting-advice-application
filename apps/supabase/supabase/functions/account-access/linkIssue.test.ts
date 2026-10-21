/**
 * The order of a link issue, path by path and for each of the two issuers, with fakes that record every call in the order it was made.
 *
 * No mocks of a module and no network: every effect of `issueSignInLink` and of `issueRecoveryLink` is a dependency, and each fake here is one.
 */

import { describe, expect, it } from 'vitest';
import { issueRecoveryLink, issueSignInLink, readRecoveryEligibility } from './linkIssue.ts';
import { RECOVERY_MAIL_TEMPLATES, SIGN_IN_MAIL_TEMPLATES } from './mailTemplates.ts';
import type { RequestLinkRequest, RequestRecoveryRequest } from './contract.ts';
import type { LinkIssueDeps, LinkIssueOutcome, OutgoingMail } from './linkIssue.ts';

const PROJECT = '00000000-0000-0000-0000-000000000001';
const WITNESS = '11111111-2222-3333-4444-555555555555';
const SITE_URL = 'http://localhost:5173';
const TYPED_ADDRESS = '  Person@Example.ORG ';
const ADDRESS = 'person@example.org';
const CODE = 'SECRETCODE-7H3K';
const TOKEN_HASH = 'tokenhash0123456789abcdef';
const RECOVERY_TOKEN_HASH = 'recoveryhash0123456789abcdef';

type Step =
  | 'signUpClosed'
  | 'redirectAdmitted'
  | 'requestEligibility'
  | 'recoveryEligibility'
  | 'createPasswordlessUser'
  | 'mintToken'
  | 'mintRecoveryToken'
  | 'sendMail'
  | 'release'
  | 'completeWitness';

interface Recorded {
  /** Every dependency call, in order. */
  calls: Array<{ step: Step; args: Array<unknown> }>;
  /** Every argument list passed to `log`. */
  logs: Array<Array<unknown>>;
  mails: Array<OutgoingMail>;
}

interface Behaviour {
  signUpClosed?: () => Promise<boolean>;
  redirectAdmitted?: () => Promise<boolean>;
  eligibility?: () => Promise<string | null>;
  /** What the database answers a recovery request. Without it the answer is the recovery mail for the address. */
  recovery?: () => Promise<{ address: string; mail: 'recovery' | 'sign-in' } | null>;
  failAt?: 'createPasswordlessUser' | 'mintToken' | 'mintRecoveryToken' | 'sendMail';
  tokenHash?: string;
  recoveryTokenHash?: string;
  releaseRejects?: boolean;
  witnessRejects?: boolean;
  logThrows?: boolean;
  siteUrl?: string;
}

/** A failure whose message, like a real one, quotes what it failed on. Only its name and code may reach a log line. */
function failure(step: string): Error {
  return Object.assign(new Error(`${step} failed for ${ADDRESS} with ${CODE} and ${TOKEN_HASH}`), {
    name: 'AuthApiError',
    code: 'unexpected_failure'
  });
}

function harness(behaviour: Behaviour = {}): { deps: LinkIssueDeps; recorded: Recorded } {
  const recorded: Recorded = { calls: [], logs: [], mails: [] };
  function record(step: Step, ...args: Array<unknown>): void {
    recorded.calls.push({ step, args });
  }
  function failIf(step: Behaviour['failAt']): void {
    if (behaviour.failAt === step) throw failure(step as string);
  }

  const deps: LinkIssueDeps = {
    siteUrl: behaviour.siteUrl ?? SITE_URL,
    async signUpClosed() {
      record('signUpClosed');
      return behaviour.signUpClosed ? behaviour.signUpClosed() : true;
    },
    async redirectAdmitted(callbackUrl) {
      record('redirectAdmitted', callbackUrl);
      return behaviour.redirectAdmitted ? behaviour.redirectAdmitted() : true;
    },
    async requestEligibility(request) {
      record('requestEligibility', request);
      return behaviour.eligibility ? behaviour.eligibility() : ADDRESS;
    },
    async recoveryEligibility(request) {
      record('recoveryEligibility', request);
      return behaviour.recovery ? behaviour.recovery() : { address: ADDRESS, mail: 'recovery' };
    },
    async createPasswordlessUser(address) {
      record('createPasswordlessUser', address);
      failIf('createPasswordlessUser');
    },
    async mintToken(address) {
      record('mintToken', address);
      failIf('mintToken');
      return behaviour.tokenHash ?? TOKEN_HASH;
    },
    async mintRecoveryToken(address) {
      record('mintRecoveryToken', address);
      failIf('mintRecoveryToken');
      return behaviour.recoveryTokenHash ?? RECOVERY_TOKEN_HASH;
    },
    async sendMail(mail) {
      record('sendMail', mail);
      failIf('sendMail');
      recorded.mails.push(mail);
    },
    async release(slot) {
      record('release', slot);
      if (behaviour.releaseRejects) throw failure('release');
    },
    async completeWitness(id, outcome) {
      record('completeWitness', id, outcome);
      if (behaviour.witnessRejects) throw failure('completeWitness');
    },
    log(...args) {
      recorded.logs.push(args);
      if (behaviour.logThrows) throw new Error('the logger failed');
    }
  };
  return { deps, recorded };
}

function request(overrides: Partial<RequestLinkRequest> = {}): RequestLinkRequest {
  return {
    operation: 'request-link',
    projectId: PROJECT,
    email: TYPED_ADDRESS,
    code: CODE,
    locale: 'fi',
    witness: null,
    ...overrides
  };
}

function recoveryRequest(overrides: Partial<RequestRecoveryRequest> = {}): RequestRecoveryRequest {
  return {
    operation: 'request-recovery',
    projectId: PROJECT,
    email: TYPED_ADDRESS,
    locale: 'fi',
    witness: null,
    ...overrides
  };
}

/** The steps that were called, in order. */
function steps(recorded: Recorded): Array<Step> {
  return recorded.calls.map((call) => call.step);
}

/** Every call of one step, in order. */
function callsOf(recorded: Recorded, step: Step): Array<{ step: Step; args: Array<unknown> }> {
  return recorded.calls.filter((call) => call.step === step);
}

/** The seven paths, each with the outcome it must end in. */
const PATHS: Array<[string, Behaviour, LinkIssueOutcome]> = [
  ['a successful issue', {}, 'sent'],
  ['a deployment whose sign-up is not closed', { signUpClosed: async () => false }, 'not-sent'],
  ['a callback URL the auth service refuses', { redirectAdmitted: async () => false }, 'not-sent'],
  ['an address the database calls ineligible', { eligibility: async () => null }, 'not-sent'],
  ['a failed user creation', { failAt: 'createPasswordlessUser' }, 'not-sent'],
  ['a failed token issue', { failAt: 'mintToken' }, 'not-sent'],
  ['a failed send', { failAt: 'sendMail' }, 'not-sent']
];

describe('a successful issue', () => {
  it('calls the checks, the eligibility, the user creation, the mint and the mail in that order and resolves sent', async () => {
    const { deps, recorded } = harness();
    await expect(issueSignInLink(request(), deps)).resolves.toBe('sent');
    expect(steps(recorded)).toEqual([
      'signUpClosed',
      'redirectAdmitted',
      'requestEligibility',
      'createPasswordlessUser',
      'mintToken',
      'sendMail'
    ]);
  });

  it('never releases the slot', async () => {
    const { deps, recorded } = harness();
    await issueSignInLink(request(), deps);
    expect(callsOf(recorded, 'release')).toEqual([]);
  });

  it('asks the redirect question for the callback URL of the request’s locale on the configured origin', async () => {
    const { deps, recorded } = harness();
    await issueSignInLink(request({ locale: 'sv' }), deps);
    expect(callsOf(recorded, 'redirectAdmitted')[0].args).toEqual([`${SITE_URL}/sv/api/auth/callback`]);
  });

  it('asks eligibility with the project, the address and the code as the request carried them', async () => {
    const { deps, recorded } = harness();
    await issueSignInLink(request(), deps);
    expect(callsOf(recorded, 'requestEligibility')[0].args).toEqual([
      { projectId: PROJECT, email: TYPED_ADDRESS, code: CODE }
    ]);
  });

  it('creates the user, mints the token and mails for the address the database returned, and for no other', async () => {
    const claimant = 'claimant@example.net';
    const { deps, recorded } = harness({ eligibility: async () => claimant });
    await issueSignInLink(request({ email: 'someone.else@example.org' }), deps);
    expect(callsOf(recorded, 'createPasswordlessUser')[0].args).toEqual([claimant]);
    expect(callsOf(recorded, 'mintToken')[0].args).toEqual([claimant]);
    expect(recorded.mails).toHaveLength(1);
    expect(recorded.mails[0].to).toBe(claimant);
  });

  it('mails the request’s locale with a link to that locale’s callback carrying the token hash and the type', async () => {
    const { deps, recorded } = harness();
    await issueSignInLink(request({ locale: 'fi' }), deps);
    const [mail] = recorded.mails;
    const link = `${SITE_URL}/fi/api/auth/callback?token_hash=${TOKEN_HASH}&type=magiclink`;
    expect(mail.subject).toBe(SIGN_IN_MAIL_TEMPLATES.fi.subject);
    expect(mail.text).toContain(link);
    expect(mail.html).toContain(link.replace('&', '&amp;'));
    expect(Object.keys(mail).sort()).toEqual(['html', 'subject', 'text', 'to']);
  });

  it.each([['de'], ['__proto__'], [undefined]])('mails the default locale for the locale %j', async (locale) => {
    const { deps, recorded } = harness();
    await issueSignInLink(request({ locale }), deps);
    expect(recorded.mails[0].subject).toBe(SIGN_IN_MAIL_TEMPLATES.en.subject);
    expect(recorded.mails[0].text).toContain(`${SITE_URL}/en/api/auth/callback?`);
  });
});

describe('a deployment that must not issue links takes no slot', () => {
  it.each([
    ['the sign-up check answers false', { signUpClosed: async () => false }, ['signUpClosed']],
    [
      'the sign-up check rejects',
      {
        signUpClosed: async () => {
          throw failure('settings');
        }
      },
      ['signUpClosed']
    ],
    ['the redirect check answers false', { redirectAdmitted: async () => false }, ['signUpClosed', 'redirectAdmitted']],
    [
      'the redirect check rejects',
      {
        redirectAdmitted: async () => {
          throw failure('redirect');
        }
      },
      ['signUpClosed', 'redirectAdmitted']
    ],
    ['the configured site URL is not a bare origin', { siteUrl: 'https://vaa.example/app' }, ['signUpClosed']]
  ] as Array<[string, Behaviour, Array<Step>]>)(
    'ends before eligibility is asked when %s',
    async (_label, behaviour, expected) => {
      const { deps, recorded } = harness(behaviour);
      await expect(issueSignInLink(request(), deps)).resolves.toBe('not-sent');
      expect(steps(recorded)).toEqual(expected);
      expect(callsOf(recorded, 'requestEligibility')).toEqual([]);
      expect(callsOf(recorded, 'release')).toEqual([]);
      expect(recorded.mails).toEqual([]);
    }
  );

  it('says in the log which check refused', async () => {
    const closed = harness({ signUpClosed: async () => false });
    await issueSignInLink(request(), closed.deps);
    expect(closed.recorded.logs).toEqual([['public sign-up is not disabled on this deployment; no link issued']]);

    const refused = harness({ redirectAdmitted: async () => false });
    await issueSignInLink(request(), refused.deps);
    expect(refused.recorded.logs).toEqual([
      ['SITE_URL is not admitted by the auth redirect allowlist; no link issued']
    ]);
  });

  it('treats a check that answers something other than true as a refusal', async () => {
    const { deps, recorded } = harness({ signUpClosed: (async () => 'true') as never });
    await expect(issueSignInLink(request(), deps)).resolves.toBe('not-sent');
    expect(callsOf(recorded, 'requestEligibility')).toEqual([]);
  });
});

describe('an address the database calls ineligible', () => {
  it.each([
    ['null', null],
    ['an empty string', ''],
    ['undefined', undefined]
  ])(
    'creates no user, mints nothing, sends nothing, releases nothing and logs nothing for %s',
    async (_label, answer) => {
      const { deps, recorded } = harness({ eligibility: (async () => answer) as never });
      await expect(issueSignInLink(request(), deps)).resolves.toBe('not-sent');
      expect(steps(recorded)).toEqual(['signUpClosed', 'redirectAdmitted', 'requestEligibility']);
      expect(recorded.mails).toEqual([]);
      expect(recorded.logs).toEqual([]);
    }
  );

  it('releases nothing when the eligibility question itself rejects', async () => {
    const { deps, recorded } = harness({
      eligibility: async () => {
        throw failure('eligibility');
      }
    });
    await expect(issueSignInLink(request(), deps)).resolves.toBe('not-sent');
    expect(steps(recorded)).toEqual(['signUpClosed', 'redirectAdmitted', 'requestEligibility']);
  });
});

describe('a slot that was taken and mailed nothing is given back', () => {
  it.each([
    ['createPasswordlessUser', ['createPasswordlessUser', 'release']],
    ['mintToken', ['createPasswordlessUser', 'mintToken', 'release']],
    ['sendMail', ['createPasswordlessUser', 'mintToken', 'sendMail', 'release']]
  ] as Array<[NonNullable<Behaviour['failAt']>, Array<Step>]>)(
    'calls release exactly once with the project, the address and the code when %s fails, and resolves not-sent',
    async (failAt, tail) => {
      const { deps, recorded } = harness({ failAt });
      await expect(issueSignInLink(request(), deps)).resolves.toBe('not-sent');
      expect(steps(recorded)).toEqual(['signUpClosed', 'redirectAdmitted', 'requestEligibility', ...tail]);
      expect(callsOf(recorded, 'release')).toHaveLength(1);
      expect(callsOf(recorded, 'release')[0].args).toEqual([{ projectId: PROJECT, address: ADDRESS, code: CODE }]);
      expect(recorded.mails).toEqual([]);
    }
  );

  it('releases with the address the database returned, not the one that was typed', async () => {
    const claimant = 'claimant@example.net';
    const { deps, recorded } = harness({ eligibility: async () => claimant, failAt: 'sendMail' });
    await issueSignInLink(request({ email: 'someone.else@example.org' }), deps);
    expect(callsOf(recorded, 'release')[0].args).toEqual([{ projectId: PROJECT, address: claimant, code: CODE }]);
  });

  it('releases with a null code for a request that named an address only', async () => {
    const { deps, recorded } = harness({ failAt: 'mintToken' });
    await issueSignInLink(request({ code: null }), deps);
    expect(callsOf(recorded, 'release')[0].args).toEqual([{ projectId: PROJECT, address: ADDRESS, code: null }]);
  });

  it('gives the slot back and sends nothing when the auth service issues no token hash', async () => {
    const { deps, recorded } = harness({ tokenHash: '' });
    await expect(issueSignInLink(request(), deps)).resolves.toBe('not-sent');
    expect(callsOf(recorded, 'release')).toHaveLength(1);
    expect(callsOf(recorded, 'sendMail')).toEqual([]);
  });

  it('does not reject when release rejects', async () => {
    const { deps, recorded } = harness({ failAt: 'sendMail', releaseRejects: true });
    await expect(issueSignInLink(request(), deps)).resolves.toBe('not-sent');
    expect(callsOf(recorded, 'release')).toHaveLength(1);
    expect(recorded.logs.map((args) => args[0])).toEqual([
      'a link could not be issued or mailed; its slot is given back',
      'the slot could not be given back'
    ]);
  });
});

describe('the completion witness', () => {
  it.each(PATHS)(
    'is completed exactly once after %s, with the outcome of that path',
    async (_label, behaviour, outcome) => {
      const { deps, recorded } = harness(behaviour);
      await expect(issueSignInLink(request({ witness: WITNESS }), deps)).resolves.toBe(outcome);
      expect(callsOf(recorded, 'completeWitness')).toHaveLength(1);
      expect(callsOf(recorded, 'completeWitness')[0].args).toEqual([WITNESS, outcome]);
      expect(steps(recorded).at(-1)).toBe('completeWitness');
    }
  );

  it('reads sent on the successful path only', () => {
    expect(PATHS.filter(([, , outcome]) => outcome === 'sent').map(([label]) => label)).toEqual(['a successful issue']);
  });

  it.each(PATHS)('is never completed after %s when the request names none', async (_label, behaviour) => {
    const { deps, recorded } = harness(behaviour);
    await issueSignInLink(request({ witness: null }), deps);
    expect(callsOf(recorded, 'completeWitness')).toEqual([]);
  });

  it('is completed as not-sent when a check rejects', async () => {
    const { deps, recorded } = harness({
      signUpClosed: async () => {
        throw failure('settings');
      }
    });
    await expect(issueSignInLink(request({ witness: WITNESS }), deps)).resolves.toBe('not-sent');
    expect(callsOf(recorded, 'completeWitness')[0].args).toEqual([WITNESS, 'not-sent']);
  });

  it.each(PATHS)('does not make the function reject when it rejects after %s', async (_label, behaviour, outcome) => {
    const { deps, recorded } = harness({ ...behaviour, witnessRejects: true });
    await expect(issueSignInLink(request({ witness: WITNESS }), deps)).resolves.toBe(outcome);
    expect(recorded.logs.at(-1)?.[0]).toBe('the completion witness could not be written');
  });
});

/** A locale as a caller might send it: text of the caller's choosing, outside the set. */
const CALLER_LOCALE = 'zz-CALLER-LOCALE';

describe('the log', () => {
  const SECRETS = [ADDRESS, TYPED_ADDRESS.trim(), 'Person@Example', CODE, TOKEN_HASH, WITNESS, 'token_hash='];

  const EVERY_PATH: Array<[string, Behaviour]> = [
    ...PATHS.map(([label, behaviour]): [string, Behaviour] => [label, behaviour]),
    ['a failed send whose release rejects', { failAt: 'sendMail', releaseRejects: true }],
    ['a successful issue whose witness rejects', { witnessRejects: true }],
    [
      'a sign-up check that rejects',
      {
        signUpClosed: async () => {
          throw failure('settings');
        }
      }
    ],
    [
      'an eligibility question that rejects',
      {
        eligibility: async () => {
          throw failure('eligibility');
        }
      }
    ]
  ];

  it.each(EVERY_PATH)('never receives the address, the code or the token hash after %s', async (_label, behaviour) => {
    const { deps, recorded } = harness(behaviour);
    await issueSignInLink(request({ witness: WITNESS }), deps);
    const written = JSON.stringify(recorded.logs);
    for (const secret of SECRETS) expect(written).not.toContain(secret);
  });

  it('carries the name and the code of a failure and nothing else of it', async () => {
    const { deps, recorded } = harness({ failAt: 'mintToken' });
    await issueSignInLink(request(), deps);
    expect(recorded.logs).toEqual([
      [
        'a link could not be issued or mailed; its slot is given back',
        { name: 'AuthApiError', code: 'unexpected_failure' }
      ]
    ]);
  });

  it('drops a name or a code that is not a short token', async () => {
    const { deps, recorded } = harness({
      eligibility: async () => {
        throw Object.assign(new Error('x'), { name: `Error for ${ADDRESS}`, code: `${CODE} was refused` });
      }
    });
    await issueSignInLink(request(), deps);
    expect(recorded.logs).toEqual([['the link issue ended before eligibility was settled; no link issued', {}]]);
  });

  it('logs a thrown value that is not an object without reading it', async () => {
    const { deps, recorded } = harness({
      eligibility: async () => {
        throw ADDRESS;
      }
    });
    await expect(issueSignInLink(request(), deps)).resolves.toBe('not-sent');
    expect(recorded.logs).toEqual([['the link issue ended before eligibility was settled; no link issued', {}]]);
  });

  it('cannot turn an outcome into a rejection by failing', async () => {
    const failing = harness({ failAt: 'sendMail', logThrows: true });
    await expect(issueSignInLink(request({ witness: WITNESS }), failing.deps)).resolves.toBe('not-sent');
    expect(callsOf(failing.recorded, 'release')).toHaveLength(1);
    expect(callsOf(failing.recorded, 'completeWitness')).toHaveLength(1);
  });
});

/** The one call of a step, after asserting that it was made exactly once. */
function onlyCall(recorded: Recorded, step: Step): { step: Step; args: Array<unknown> } {
  const calls = callsOf(recorded, step);
  expect(calls).toHaveLength(1);
  return calls[0];
}

/** The one mail handed to the transport, after asserting that there was exactly one. */
function onlyMail(recorded: Recorded): OutgoingMail {
  expect(recorded.mails).toHaveLength(1);
  return recorded.mails[0];
}

/** What the database answers for an address that has only an open invitation. */
async function signInAnswer(): Promise<{ address: string; mail: 'sign-in' }> {
  return { address: ADDRESS, mail: 'sign-in' };
}

/** Every path of a recovery request, each with the outcome it must end in. */
const RECOVERY_PATHS: Array<[string, Behaviour, LinkIssueOutcome]> = [
  ['a recovery mail sent', {}, 'sent'],
  ['a sign-in mail sent', { recovery: signInAnswer }, 'sent'],
  ['a deployment whose sign-up is not closed', { signUpClosed: async () => false }, 'not-sent'],
  ['a callback URL the auth service refuses', { redirectAdmitted: async () => false }, 'not-sent'],
  ['an address the database answers nothing for', { recovery: async () => null }, 'not-sent'],
  ['a failed recovery token issue', { failAt: 'mintRecoveryToken' }, 'not-sent'],
  ['a failed send of the recovery mail', { failAt: 'sendMail' }, 'not-sent'],
  [
    'a failed user creation on the sign-in arm',
    { recovery: signInAnswer, failAt: 'createPasswordlessUser' },
    'not-sent'
  ],
  ['a failed token issue on the sign-in arm', { recovery: signInAnswer, failAt: 'mintToken' }, 'not-sent'],
  ['a failed send of the sign-in mail', { recovery: signInAnswer, failAt: 'sendMail' }, 'not-sent']
];

describe('issueRecoveryLink: an address the database answers recovery for', () => {
  it('calls the checks, the eligibility, the recovery mint and the mail in that order and resolves sent', async () => {
    const { deps, recorded } = harness();
    await expect(issueRecoveryLink(recoveryRequest(), deps)).resolves.toBe('sent');
    expect(steps(recorded)).toEqual([
      'signUpClosed',
      'redirectAdmitted',
      'recoveryEligibility',
      'mintRecoveryToken',
      'sendMail'
    ]);
  });

  it('never calls createPasswordlessUser, so a recovery request creates no account', async () => {
    const { deps, recorded } = harness();
    await issueRecoveryLink(recoveryRequest({ witness: WITNESS }), deps);
    expect(callsOf(recorded, 'createPasswordlessUser')).toEqual([]);
    expect(callsOf(recorded, 'mintToken')).toEqual([]);
    expect(callsOf(recorded, 'requestEligibility')).toEqual([]);
  });

  it.each([['mintRecoveryToken'], ['sendMail']] as Array<[NonNullable<Behaviour['failAt']>]>)(
    'never calls createPasswordlessUser when %s fails either',
    async (failAt) => {
      const { deps, recorded } = harness({ failAt });
      await issueRecoveryLink(recoveryRequest(), deps);
      expect(callsOf(recorded, 'createPasswordlessUser')).toEqual([]);
    }
  );

  it('never releases the slot', async () => {
    const { deps, recorded } = harness();
    await issueRecoveryLink(recoveryRequest(), deps);
    expect(callsOf(recorded, 'release')).toEqual([]);
  });

  it('asks the redirect question for the callback URL of the request’s locale on the configured origin', async () => {
    const { deps, recorded } = harness();
    await issueRecoveryLink(recoveryRequest({ locale: 'sv' }), deps);
    expect(onlyCall(recorded, 'redirectAdmitted').args).toEqual([`${SITE_URL}/sv/api/auth/callback`]);
  });

  it('asks eligibility with the project and the address as the request carried them, and nothing else', async () => {
    const { deps, recorded } = harness();
    await issueRecoveryLink(recoveryRequest({ witness: WITNESS }), deps);
    expect(onlyCall(recorded, 'recoveryEligibility').args).toEqual([{ projectId: PROJECT, email: TYPED_ADDRESS }]);
  });

  it('mints and mails for the address the database returned, and for no other', async () => {
    const holder = 'holder@example.net';
    const { deps, recorded } = harness({ recovery: async () => ({ address: holder, mail: 'recovery' }) });
    await issueRecoveryLink(recoveryRequest({ email: 'someone.else@example.org' }), deps);
    expect(onlyCall(recorded, 'mintRecoveryToken').args).toEqual([holder]);
    expect(onlyMail(recorded).to).toBe(holder);
  });

  it('mails the recovery mail of the request’s locale with a link to that locale’s callback carrying the recovery token hash and the type recovery', async () => {
    const { deps, recorded } = harness();
    await issueRecoveryLink(recoveryRequest({ locale: 'fi' }), deps);
    const mail = onlyMail(recorded);
    const link = `${SITE_URL}/fi/api/auth/callback?token_hash=${RECOVERY_TOKEN_HASH}&type=recovery`;
    expect(mail.subject).toBe(RECOVERY_MAIL_TEMPLATES.fi.subject);
    expect(mail.subject).not.toBe(SIGN_IN_MAIL_TEMPLATES.fi.subject);
    expect(mail.text).toContain(link);
    expect(mail.html).toContain(link.replace('&', '&amp;'));
    expect(mail.text).not.toContain('magiclink');
    expect(Object.keys(mail).sort()).toEqual(['html', 'subject', 'text', 'to']);
  });

  it.each([['de'], ['__proto__'], [undefined]])(
    'mails the default locale’s recovery mail for the locale %j',
    async (locale) => {
      const { deps, recorded } = harness();
      await issueRecoveryLink(recoveryRequest({ locale }), deps);
      const mail = onlyMail(recorded);
      expect(mail.subject).toBe(RECOVERY_MAIL_TEMPLATES.en.subject);
      expect(mail.text).toContain(`${SITE_URL}/en/api/auth/callback?`);
    }
  );
});

describe('issueRecoveryLink: an address the database answers sign-in for', () => {
  it('runs the sign-in issue after its own eligibility step: the user, the sign-in mint and the mail, in that order', async () => {
    const { deps, recorded } = harness({ recovery: signInAnswer });
    await expect(issueRecoveryLink(recoveryRequest(), deps)).resolves.toBe('sent');
    expect(steps(recorded)).toEqual([
      'signUpClosed',
      'redirectAdmitted',
      'recoveryEligibility',
      'createPasswordlessUser',
      'mintToken',
      'sendMail'
    ]);
    expect(callsOf(recorded, 'mintRecoveryToken')).toEqual([]);
    expect(callsOf(recorded, 'requestEligibility')).toEqual([]);
  });

  it('mails the sign-in mail with a link of the type magiclink, for the address the database returned', async () => {
    const invitee = 'invitee@example.net';
    const { deps, recorded } = harness({ recovery: async () => ({ address: invitee, mail: 'sign-in' }) });
    await issueRecoveryLink(recoveryRequest({ email: 'someone.else@example.org', locale: 'fi' }), deps);
    const mail = onlyMail(recorded);
    const link = `${SITE_URL}/fi/api/auth/callback?token_hash=${TOKEN_HASH}&type=magiclink`;
    expect(onlyCall(recorded, 'createPasswordlessUser').args).toEqual([invitee]);
    expect(onlyCall(recorded, 'mintToken').args).toEqual([invitee]);
    expect(mail.to).toBe(invitee);
    expect(mail.subject).toBe(SIGN_IN_MAIL_TEMPLATES.fi.subject);
    expect(mail.text).toContain(link);
    expect(mail.html).toContain(link.replace('&', '&amp;'));
  });
});

describe('issueRecoveryLink: an address the database answers nothing for', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a bare address', ADDRESS],
    ['an answer with a blank address', { address: '', mail: 'recovery' }],
    ['an answer with no address', { mail: 'recovery' }],
    ['an answer whose address is not a string', { address: 7, mail: 'recovery' }],
    ['an answer naming a third kind of mail', { address: ADDRESS, mail: 'invite' }],
    ['an answer naming no kind of mail', { address: ADDRESS }]
  ])('mints nothing, sends nothing, releases nothing and logs nothing for %s', async (_label, answer) => {
    const { deps, recorded } = harness({ recovery: (async () => answer) as never });
    await expect(issueRecoveryLink(recoveryRequest(), deps)).resolves.toBe('not-sent');
    expect(steps(recorded)).toEqual(['signUpClosed', 'redirectAdmitted', 'recoveryEligibility']);
    expect(recorded.mails).toEqual([]);
    expect(recorded.logs).toEqual([]);
  });

  it('releases nothing when the eligibility question itself rejects', async () => {
    const { deps, recorded } = harness({
      recovery: async () => {
        throw failure('eligibility');
      }
    });
    await expect(issueRecoveryLink(recoveryRequest(), deps)).resolves.toBe('not-sent');
    expect(steps(recorded)).toEqual(['signUpClosed', 'redirectAdmitted', 'recoveryEligibility']);
  });
});

describe('issueRecoveryLink: a deployment that must not issue links takes no slot', () => {
  it.each([
    ['the sign-up check answers false', { signUpClosed: async () => false }, ['signUpClosed']],
    [
      'the sign-up check rejects',
      {
        signUpClosed: async () => {
          throw failure('settings');
        }
      },
      ['signUpClosed']
    ],
    ['the redirect check answers false', { redirectAdmitted: async () => false }, ['signUpClosed', 'redirectAdmitted']],
    [
      'the redirect check rejects',
      {
        redirectAdmitted: async () => {
          throw failure('redirect');
        }
      },
      ['signUpClosed', 'redirectAdmitted']
    ],
    ['the configured site URL is not a bare origin', { siteUrl: 'https://vaa.example/app' }, ['signUpClosed']]
  ] as Array<[string, Behaviour, Array<Step>]>)(
    'ends before eligibility is asked when %s',
    async (_label, behaviour, expected) => {
      const { deps, recorded } = harness(behaviour);
      await expect(issueRecoveryLink(recoveryRequest(), deps)).resolves.toBe('not-sent');
      expect(steps(recorded)).toEqual(expected);
      expect(callsOf(recorded, 'recoveryEligibility')).toEqual([]);
      expect(callsOf(recorded, 'release')).toEqual([]);
      expect(recorded.mails).toEqual([]);
    }
  );
});

describe('issueRecoveryLink: a slot that was taken and mailed nothing is given back', () => {
  it.each([
    ['mintRecoveryToken', {}, ['mintRecoveryToken', 'release']],
    ['sendMail', {}, ['mintRecoveryToken', 'sendMail', 'release']],
    ['createPasswordlessUser', { recovery: signInAnswer }, ['createPasswordlessUser', 'release']],
    ['mintToken', { recovery: signInAnswer }, ['createPasswordlessUser', 'mintToken', 'release']],
    ['sendMail', { recovery: signInAnswer }, ['createPasswordlessUser', 'mintToken', 'sendMail', 'release']]
  ] as Array<[NonNullable<Behaviour['failAt']>, Behaviour, Array<Step>]>)(
    'calls release exactly once with the project, the address and no code when %s fails, and resolves not-sent (%j)',
    async (failAt, behaviour, tail) => {
      const { deps, recorded } = harness({ ...behaviour, failAt });
      await expect(issueRecoveryLink(recoveryRequest(), deps)).resolves.toBe('not-sent');
      expect(steps(recorded)).toEqual(['signUpClosed', 'redirectAdmitted', 'recoveryEligibility', ...tail]);
      expect(callsOf(recorded, 'release')).toHaveLength(1);
      expect(onlyCall(recorded, 'release').args).toEqual([{ projectId: PROJECT, address: ADDRESS, code: null }]);
      expect(recorded.mails).toEqual([]);
    }
  );

  it('releases with the address the database returned, not the one that was typed', async () => {
    const holder = 'holder@example.net';
    const { deps, recorded } = harness({
      recovery: async () => ({ address: holder, mail: 'recovery' }),
      failAt: 'sendMail'
    });
    await issueRecoveryLink(recoveryRequest({ email: 'someone.else@example.org' }), deps);
    expect(onlyCall(recorded, 'release').args).toEqual([{ projectId: PROJECT, address: holder, code: null }]);
  });

  it('gives the slot back and sends nothing when the auth service issues no recovery token hash', async () => {
    const { deps, recorded } = harness({ recoveryTokenHash: '' });
    await expect(issueRecoveryLink(recoveryRequest(), deps)).resolves.toBe('not-sent');
    expect(callsOf(recorded, 'release')).toHaveLength(1);
    expect(callsOf(recorded, 'sendMail')).toEqual([]);
  });

  it('does not reject when release rejects', async () => {
    const { deps, recorded } = harness({ failAt: 'mintRecoveryToken', releaseRejects: true });
    await expect(issueRecoveryLink(recoveryRequest(), deps)).resolves.toBe('not-sent');
    expect(callsOf(recorded, 'release')).toHaveLength(1);
    expect(recorded.logs.map((args) => args[0])).toEqual([
      'a link could not be issued or mailed; its slot is given back',
      'the slot could not be given back'
    ]);
  });
});

describe('issueRecoveryLink: the completion witness', () => {
  it.each(RECOVERY_PATHS)(
    'is completed exactly once after %s, with the outcome of that path',
    async (_label, behaviour, outcome) => {
      const { deps, recorded } = harness(behaviour);
      await expect(issueRecoveryLink(recoveryRequest({ witness: WITNESS }), deps)).resolves.toBe(outcome);
      expect(callsOf(recorded, 'completeWitness')).toHaveLength(1);
      expect(onlyCall(recorded, 'completeWitness').args).toEqual([WITNESS, outcome]);
      expect(steps(recorded).at(-1)).toBe('completeWitness');
    }
  );

  it('reads sent on the two paths that hand over a mail, and on no other', () => {
    expect(RECOVERY_PATHS.filter(([, , outcome]) => outcome === 'sent').map(([label]) => label)).toEqual([
      'a recovery mail sent',
      'a sign-in mail sent'
    ]);
  });

  it.each(RECOVERY_PATHS)('is never completed after %s when the request names none', async (_label, behaviour) => {
    const { deps, recorded } = harness(behaviour);
    await issueRecoveryLink(recoveryRequest({ witness: null }), deps);
    expect(callsOf(recorded, 'completeWitness')).toEqual([]);
  });

  it('is completed as not-sent when a check rejects', async () => {
    const { deps, recorded } = harness({
      signUpClosed: async () => {
        throw failure('settings');
      }
    });
    await expect(issueRecoveryLink(recoveryRequest({ witness: WITNESS }), deps)).resolves.toBe('not-sent');
    expect(onlyCall(recorded, 'completeWitness').args).toEqual([WITNESS, 'not-sent']);
  });

  it.each(RECOVERY_PATHS)(
    'does not make the function reject when it rejects after %s',
    async (_label, behaviour, outcome) => {
      const { deps, recorded } = harness({ ...behaviour, witnessRejects: true });
      await expect(issueRecoveryLink(recoveryRequest({ witness: WITNESS }), deps)).resolves.toBe(outcome);
      expect(recorded.logs.at(-1)?.[0]).toBe('the completion witness could not be written');
    }
  );
});

describe('issueRecoveryLink: the log', () => {
  const SECRETS = [
    ADDRESS,
    TYPED_ADDRESS.trim(),
    'Person@Example',
    TOKEN_HASH,
    RECOVERY_TOKEN_HASH,
    WITNESS,
    'token_hash=',
    CALLER_LOCALE
  ];

  const EVERY_PATH: Array<[string, Behaviour]> = [
    ...RECOVERY_PATHS.map(([label, behaviour]): [string, Behaviour] => [label, behaviour]),
    ['a failed recovery token issue whose release rejects', { failAt: 'mintRecoveryToken', releaseRejects: true }],
    ['a recovery mail sent whose witness rejects', { witnessRejects: true }],
    [
      'an eligibility question that rejects',
      {
        recovery: async () => {
          throw failure('eligibility');
        }
      }
    ]
  ];

  it.each(EVERY_PATH)(
    'never receives the address, a token hash, the witness or the locale after %s',
    async (_label, behaviour) => {
      const { deps, recorded } = harness(behaviour);
      await issueRecoveryLink(recoveryRequest({ witness: WITNESS, locale: CALLER_LOCALE }), deps);
      const written = JSON.stringify(recorded.logs);
      for (const secret of SECRETS) expect(written).not.toContain(secret);
    }
  );

  it('carries the name and the code of a failure and nothing else of it', async () => {
    const { deps, recorded } = harness({ failAt: 'mintRecoveryToken' });
    await issueRecoveryLink(recoveryRequest(), deps);
    expect(recorded.logs).toEqual([
      [
        'a link could not be issued or mailed; its slot is given back',
        { name: 'AuthApiError', code: 'unexpected_failure' }
      ]
    ]);
  });

  it('cannot turn an outcome into a rejection by failing', async () => {
    const failing = harness({ failAt: 'sendMail', logThrows: true });
    await expect(issueRecoveryLink(recoveryRequest({ witness: WITNESS }), failing.deps)).resolves.toBe('not-sent');
    expect(callsOf(failing.recorded, 'release')).toHaveLength(1);
    expect(callsOf(failing.recorded, 'completeWitness')).toHaveLength(1);
  });
});

describe('readRecoveryEligibility: what the database’s answer to a recovery request is read as', () => {
  it.each([['recovery'], ['sign-in']] as Array<['recovery' | 'sign-in']>)(
    'reads the address and the kind of mail of an answer naming %s',
    (mail) => {
      expect(readRecoveryEligibility({ email: ADDRESS, mail })).toEqual({ address: ADDRESS, mail });
    }
  );

  it('reads the two members it knows and no other', () => {
    const read = readRecoveryEligibility({ email: ADDRESS, mail: 'recovery', user_id: 'x', reason: 'holder' });
    expect(Object.keys(read ?? {}).sort()).toEqual(['address', 'mail']);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a bare address', ADDRESS],
    ['a number', 7],
    ['an array', [ADDRESS, 'recovery']],
    ['an object with a blank address', { email: '', mail: 'recovery' }],
    ['an object with no address', { mail: 'recovery' }],
    ['an object whose address is not a string', { email: 7, mail: 'recovery' }],
    ['an object naming a third kind of mail', { email: ADDRESS, mail: 'invite' }],
    ['an object naming no kind of mail', { email: ADDRESS }],
    ['an object naming its kind in another case', { email: ADDRESS, mail: 'Recovery' }]
  ])('reads %s as null', (_label, answer) => {
    expect(readRecoveryEligibility(answer)).toBeNull();
  });
});
