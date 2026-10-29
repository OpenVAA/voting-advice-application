// @vitest-environment node
/**
 * The endpoint's decision, driven with every effect a stub.
 *
 * What this file holds:
 *
 * 1. **Who is served** — a signed-in caller only, and only a JSON request from the endpoint's own origin.
 * 2. **The names** — written to the organization the identity registered alone, found by the record and never by the request, only while it is unconfirmed and only with text in the default locale.
 * 3. **The address** — handed to the confirmation request only for an account with no proved address, its three outcomes mapped, and the names saved first.
 * 4. **The resend and the acknowledgement** — the pending address asked for again, and the marker cleared.
 * 5. **What an answer carries** — the result alone, from a closed set.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  handleIdentityProviderRegistration,
  IDENTITY_PROVIDER_REGISTRATION_RESULT
} from './identityProviderRegistration';
import type { BasicUserData, UserEntity } from '$lib/api/base/dataWriter.type';
import type { AddressState } from '$lib/contestant/utils/identityProviderAccount';
import type { IdentityProviderRegistrationDeps } from './identityProviderRegistration';

const ORIGIN = 'http://localhost:5173';
const PROJECT = '00000000-0000-0000-0000-000000000001';
const OTHER_PROJECT = '00000000-0000-0000-0000-000000000002';
const OWN_ORGANIZATION = '6f1c2a3b-4d5e-4f60-8a71-92b3c4d5e6f7';
const OTHER_ORGANIZATION = '8b3c4d5e-6f70-4a81-9c92-b3d4e5f60718';
const TYPED = 'typed@example.test';
const PENDING = 'pending@example.test';
const NAME = { en: 'The Party', fi: 'Puolue' };
const SHORT_NAME = { en: 'TP' };

/** The record of an identity that registered the own organization in the project. */
const APP_METADATA = {
  identity_provider: 'idura-ftn',
  registered_entities: { [PROJECT]: { organization: OWN_ORGANIZATION } }
};

/**
 * User-level data in one address state.
 * @param addressState - The state.
 * @returns The user.
 */
function userIn(addressState: AddressState): BasicUserData {
  return {
    id: 'user-1',
    email: addressState === 'proved' ? TYPED : '',
    username: addressState === 'proved' ? TYPED : '',
    role: 'contestant',
    settings: {},
    termsOfUseAccepted: null,
    passwordSet: false,
    addressState,
    pendingEmail: addressState === 'pending' ? PENDING : null,
    ownOrganizationUnnamed: true,
    pendingEmailTaken: false
  };
}

/**
 * An organization the user edits.
 * @param id - Its id.
 * @param confirmed - Whether an administrator has confirmed it.
 * @returns The entity.
 */
function organization(id: string, confirmed = false): UserEntity {
  return { type: 'organization', id, name: '', confirmed };
}

/**
 * The dependencies of one request, every effect a recording stub around its implementation.
 * @param overrides - Facts and implementations to state otherwise.
 * @returns The dependencies.
 */
function depsWith(overrides: Partial<IdentityProviderRegistrationDeps> = {}) {
  const given: IdentityProviderRegistrationDeps = {
    origin: ORIGIN,
    projectId: PROJECT,
    defaultLocale: 'en',
    locale: 'fi',
    supportedLocales: ['en', 'fi', 'sv'],
    getVerifiedUser: async () => ({ appMetadata: APP_METADATA }),
    getAnswersLocked: async () => false,
    getBasicUserData: async () => userIn('none'),
    getUserEntities: async () => [organization(OWN_ORGANIZATION)],
    updateEntityProperties: async () => ({ type: 'saved', properties: {}, localizedNames: {} }),
    requestAddressConfirmation: async () => 'sent',
    deleteArrivalMarker: () => undefined,
    ...overrides
  };
  return {
    ...given,
    getVerifiedUser: vi.fn(given.getVerifiedUser),
    getAnswersLocked: vi.fn(given.getAnswersLocked),
    getBasicUserData: vi.fn(given.getBasicUserData),
    getUserEntities: vi.fn(given.getUserEntities),
    updateEntityProperties: vi.fn(given.updateEntityProperties),
    requestAddressConfirmation: vi.fn(given.requestAddressConfirmation),
    deleteArrivalMarker: vi.fn(given.deleteArrivalMarker)
  };
}

/**
 * A request to the endpoint.
 * @param body - The body, sent as JSON unless it is a string.
 * @param headers - Headers to state otherwise.
 * @returns The request.
 */
function post(body: unknown, headers: Record<string, string | null> = {}): Request {
  const all: Record<string, string> = {};
  for (const [name, value] of Object.entries({ origin: ORIGIN, 'content-type': 'application/json', ...headers }))
    if (value !== null) all[name] = value;
  return new Request(`${ORIGIN}/api/contestant/identity-provider`, {
    method: 'POST',
    headers: all,
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

describe('who is served', () => {
  it('answers 401 failed when no one is signed in, and does nothing', async () => {
    const deps = depsWith({ getVerifiedUser: vi.fn(async () => null) });

    expect(await handleIdentityProviderRegistration(post({ intent: 'acknowledge' }), deps)).toEqual({
      status: 401,
      body: { result: 'failed' }
    });
    expect(deps.deleteArrivalMarker).not.toHaveBeenCalled();
  });

  it.each([
    ['another origin', { origin: 'https://evil.example' }],
    ['no origin', { origin: null }],
    ['the origin over another scheme', { origin: 'https://localhost:5173' }],
    ['a form body', { 'content-type': 'application/x-www-form-urlencoded' }],
    ['a plain-text body', { 'content-type': 'text/plain' }],
    ['no content type', { 'content-type': null }]
  ])('answers 403 failed for a request with %s, and does nothing', async (_label, headers) => {
    const deps = depsWith();

    expect(await handleIdentityProviderRegistration(post({ intent: 'save', name: NAME }, headers), deps)).toEqual({
      status: 403,
      body: { result: 'failed' }
    });
    expect(deps.updateEntityProperties).not.toHaveBeenCalled();
    expect(deps.requestAddressConfirmation).not.toHaveBeenCalled();
    expect(deps.deleteArrivalMarker).not.toHaveBeenCalled();
  });

  it('serves JSON with a charset', async () => {
    const deps = depsWith();
    const request = post({ intent: 'acknowledge' }, { 'content-type': 'application/json; charset=utf-8' });

    expect((await handleIdentityProviderRegistration(request, deps)).body.result).toBe('acknowledged');
  });

  it.each([
    ['a body that is not JSON', '{'],
    ['no intent', {}],
    ['an unknown intent', { intent: 'delete' }],
    ['a save that carries nothing', { intent: 'save' }],
    ['a name that is not locale-keyed text', { intent: 'save', name: 'The Party' }],
    ['a short name with no name', { intent: 'save', shortName: SHORT_NAME }],
    ['an address that is not a string', { intent: 'save', email: 42 }],
    ['a blank address', { intent: 'save', email: '   ' }],
    ['an address too long to be one', { intent: 'save', email: `${'a'.repeat(250)}@example.test` }],
    ['a name in a locale the application does not support', { intent: 'save', name: { ...NAME, xx: 'Party' } }],
    ['a name longer than a name can be', { intent: 'save', name: { ...NAME, fi: 'P'.repeat(201) } }],
    [
      'a short name in a locale the application does not support',
      { intent: 'save', name: NAME, shortName: { xx: 'P' } }
    ],
    ['a short name longer than a name can be', { intent: 'save', name: NAME, shortName: { en: 'P'.repeat(201) } }]
  ])('answers 400 failed for %s, and does nothing', async (_label, body) => {
    const deps = depsWith();

    expect(await handleIdentityProviderRegistration(post(body), deps)).toEqual({
      status: 400,
      body: { result: 'failed' }
    });
    expect(deps.updateEntityProperties).not.toHaveBeenCalled();
    expect(deps.requestAddressConfirmation).not.toHaveBeenCalled();
    expect(deps.deleteArrivalMarker).not.toHaveBeenCalled();
  });
});

describe('save, the names', () => {
  it('refuses the names while answers are locked, writes nothing and keeps the marker', async () => {
    const deps = depsWith({ getAnswersLocked: async () => true });

    expect(await handleIdentityProviderRegistration(post({ intent: 'save', name: NAME }), deps)).toEqual({
      status: 200,
      body: { result: 'failed' }
    });
    expect(deps.updateEntityProperties).not.toHaveBeenCalled();
    expect(deps.deleteArrivalMarker).not.toHaveBeenCalled();
  });

  it('accepts a name of the longest length a name can have', async () => {
    const deps = depsWith();
    const name = { en: 'P'.repeat(200) };

    expect((await handleIdentityProviderRegistration(post({ intent: 'save', name }), deps)).body.result).toBe('saved');
    expect(deps.updateEntityProperties.mock.calls[0][0].properties).toEqual({ name });
  });

  it('writes the names to the organization the record names, and nothing else, then clears the marker', async () => {
    const deps = depsWith();

    const answer = await handleIdentityProviderRegistration(
      post({ intent: 'save', name: NAME, shortName: SHORT_NAME }),
      deps
    );

    expect(answer).toEqual({ status: 200, body: { result: 'saved' } });
    expect(deps.updateEntityProperties.mock.calls).toEqual([
      [{ target: { type: 'organization', id: OWN_ORGANIZATION }, properties: { name: NAME, shortName: SHORT_NAME } }]
    ]);
    expect(deps.requestAddressConfirmation).not.toHaveBeenCalled();
    expect(deps.deleteArrivalMarker).toHaveBeenCalledTimes(1);
  });

  it('writes no short name when the request carries none, and clears one the request sets to null', async () => {
    const deps = depsWith();
    await handleIdentityProviderRegistration(post({ intent: 'save', name: NAME }), deps);
    await handleIdentityProviderRegistration(post({ intent: 'save', name: NAME, shortName: null }), deps);

    expect(deps.updateEntityProperties.mock.calls.map(([opts]) => opts.properties)).toEqual([
      { name: NAME },
      { name: NAME, shortName: null }
    ]);
  });

  it('takes no entity from the request: an id or a target in the body is never written', async () => {
    const deps = depsWith();

    await handleIdentityProviderRegistration(
      post({
        intent: 'save',
        name: NAME,
        id: OTHER_ORGANIZATION,
        target: { type: 'organization', id: OTHER_ORGANIZATION }
      }),
      deps
    );

    expect(deps.updateEntityProperties.mock.calls).toEqual([
      [{ target: { type: 'organization', id: OWN_ORGANIZATION }, properties: { name: NAME } }]
    ]);
  });

  it.each([
    ['the account has no record', { identity_provider: 'idura-ftn' }],
    [
      'the record names an organization of another project',
      { registered_entities: { [OTHER_PROJECT]: { organization: OWN_ORGANIZATION } } }
    ],
    ['the record names a candidate only', { registered_entities: { [PROJECT]: { candidate: OWN_ORGANIZATION } } }]
  ])('refuses when %s, writing nothing', async (_label, appMetadata) => {
    const deps = depsWith({ getVerifiedUser: vi.fn(async () => ({ appMetadata })) });

    expect((await handleIdentityProviderRegistration(post({ intent: 'save', name: NAME }), deps)).body.result).toBe(
      'failed'
    );
    expect(deps.updateEntityProperties).not.toHaveBeenCalled();
    expect(deps.deleteArrivalMarker).not.toHaveBeenCalled();
  });

  it.each([
    ['the user does not edit it', [organization(OTHER_ORGANIZATION)]],
    ['it is confirmed', [organization(OWN_ORGANIZATION, true)]]
  ])('refuses the own organization when %s, writing nothing', async (_label, entities) => {
    const deps = depsWith({ getUserEntities: vi.fn(async () => entities) });

    expect((await handleIdentityProviderRegistration(post({ intent: 'save', name: NAME }), deps)).body.result).toBe(
      'failed'
    );
    expect(deps.updateEntityProperties).not.toHaveBeenCalled();
  });

  it.each([
    ['a name in another locale only', { fi: 'Puolue' }],
    ['a blank name in the default locale', { en: '  ', fi: 'Puolue' }],
    ['an empty name', {}]
  ])('refuses %s, writing nothing', async (_label, name) => {
    const deps = depsWith();

    expect((await handleIdentityProviderRegistration(post({ intent: 'save', name }), deps)).body.result).toBe('failed');
    expect(deps.updateEntityProperties).not.toHaveBeenCalled();
    expect(deps.deleteArrivalMarker).not.toHaveBeenCalled();
  });

  it('answers failed when the write is refused for a changed name, and keeps the marker', async () => {
    const deps = depsWith({ updateEntityProperties: vi.fn(async () => ({ type: 'nameRefused' as const })) });

    expect((await handleIdentityProviderRegistration(post({ intent: 'save', name: NAME }), deps)).body.result).toBe(
      'failed'
    );
    expect(deps.deleteArrivalMarker).not.toHaveBeenCalled();
  });

  it('answers failed, never a rejection, when the write throws', async () => {
    const deps = depsWith({
      updateEntityProperties: vi.fn(async () => {
        throw new Error('write failed');
      })
    });

    expect(await handleIdentityProviderRegistration(post({ intent: 'save', name: NAME }), deps)).toEqual({
      status: 200,
      body: { result: 'failed' }
    });
  });
});

describe('save, the address', () => {
  it.each<AddressState>(['none', 'pending'])(
    'asks for the typed address to be proved for an account whose address is %s, then clears the marker',
    async (state) => {
      const deps = depsWith({ getBasicUserData: vi.fn(async () => userIn(state)) });

      const answer = await handleIdentityProviderRegistration(post({ intent: 'save', email: `  ${TYPED} ` }), deps);

      expect(answer).toEqual({ status: 200, body: { result: 'saved' } });
      expect(deps.requestAddressConfirmation.mock.calls).toEqual([[{ email: TYPED, locale: 'fi' }]]);
      expect(deps.updateEntityProperties).not.toHaveBeenCalled();
      expect(deps.deleteArrivalMarker).toHaveBeenCalledTimes(1);
    }
  );

  it('refuses an address for an account whose address is proved, asking nothing and writing nothing', async () => {
    const deps = depsWith({ getBasicUserData: vi.fn(async () => userIn('proved')) });

    expect(
      (await handleIdentityProviderRegistration(post({ intent: 'save', name: NAME, email: TYPED }), deps)).body.result
    ).toBe('failed');
    expect(deps.requestAddressConfirmation).not.toHaveBeenCalled();
    expect(deps.updateEntityProperties).not.toHaveBeenCalled();
  });

  it('answers in-use when the address is another account’s, and keeps the marker', async () => {
    const deps = depsWith({ requestAddressConfirmation: vi.fn(async () => 'in-use' as const) });

    expect((await handleIdentityProviderRegistration(post({ intent: 'save', email: TYPED }), deps)).body.result).toBe(
      'in-use'
    );
    expect(deps.deleteArrivalMarker).not.toHaveBeenCalled();
  });

  it('answers failed when the request is refused, and keeps the marker', async () => {
    const deps = depsWith({ requestAddressConfirmation: vi.fn(async () => 'refused' as const) });

    expect((await handleIdentityProviderRegistration(post({ intent: 'save', email: TYPED }), deps)).body.result).toBe(
      'failed'
    );
    expect(deps.deleteArrivalMarker).not.toHaveBeenCalled();
  });

  it('saves the names before it asks for the address, and a refused address leaves them saved', async () => {
    const order: Array<string> = [];
    const deps = depsWith({
      updateEntityProperties: vi.fn(async () => {
        order.push('names');
        return { type: 'saved' as const, properties: {}, localizedNames: {} };
      }),
      requestAddressConfirmation: vi.fn(async () => {
        order.push('address');
        return 'refused' as const;
      })
    });

    const answer = await handleIdentityProviderRegistration(post({ intent: 'save', name: NAME, email: TYPED }), deps);

    expect(order).toEqual(['names', 'address']);
    expect(answer.body.result).toBe('failed');
  });

  it('asks for no address when the names were refused', async () => {
    const deps = depsWith({ getUserEntities: vi.fn(async () => [organization(OWN_ORGANIZATION, true)]) });

    expect(
      (await handleIdentityProviderRegistration(post({ intent: 'save', name: NAME, email: TYPED }), deps)).body.result
    ).toBe('failed');
    expect(deps.requestAddressConfirmation).not.toHaveBeenCalled();
  });

  it('answers failed when the user-level data cannot be read', async () => {
    const deps = depsWith({
      getBasicUserData: vi.fn(async () => {
        throw new Error('No active session');
      })
    });

    expect((await handleIdentityProviderRegistration(post({ intent: 'save', email: TYPED }), deps)).body.result).toBe(
      'failed'
    );
    expect(deps.requestAddressConfirmation).not.toHaveBeenCalled();
  });
});

describe('resend', () => {
  it('asks for the pending address again and answers sent, keeping the marker', async () => {
    const deps = depsWith({ getBasicUserData: vi.fn(async () => userIn('pending')) });

    expect(await handleIdentityProviderRegistration(post({ intent: 'resend', email: TYPED }), deps)).toEqual({
      status: 200,
      body: { result: 'sent' }
    });
    expect(deps.requestAddressConfirmation.mock.calls).toEqual([[{ email: PENDING, locale: 'fi' }]]);
    expect(deps.deleteArrivalMarker).not.toHaveBeenCalled();
  });

  it.each(['in-use', 'refused'] as const)('answers failed when the request answers %s', async (outcome) => {
    const deps = depsWith({
      getBasicUserData: vi.fn(async () => userIn('pending')),
      requestAddressConfirmation: vi.fn(async () => outcome)
    });

    expect((await handleIdentityProviderRegistration(post({ intent: 'resend' }), deps)).body.result).toBe('failed');
  });

  it.each<AddressState>(['none', 'proved'])('answers failed in the state %s, asking nothing', async (state) => {
    const deps = depsWith({ getBasicUserData: vi.fn(async () => userIn(state)) });

    expect((await handleIdentityProviderRegistration(post({ intent: 'resend' }), deps)).body.result).toBe('failed');
    expect(deps.requestAddressConfirmation).not.toHaveBeenCalled();
  });
});

describe('acknowledge', () => {
  it('clears the marker and answers acknowledged, reading and writing nothing else', async () => {
    const deps = depsWith();

    expect(await handleIdentityProviderRegistration(post({ intent: 'acknowledge' }), deps)).toEqual({
      status: 200,
      body: { result: 'acknowledged' }
    });
    expect(deps.deleteArrivalMarker).toHaveBeenCalledTimes(1);
    expect(deps.updateEntityProperties).not.toHaveBeenCalled();
    expect(deps.requestAddressConfirmation).not.toHaveBeenCalled();
  });
});

describe('what an answer carries', () => {
  it('holds five results, frozen', () => {
    expect(Object.values(IDENTITY_PROVIDER_REGISTRATION_RESULT).sort()).toEqual([
      'acknowledged',
      'failed',
      'in-use',
      'saved',
      'sent'
    ]);
    expect(Object.isFrozen(IDENTITY_PROVIDER_REGISTRATION_RESULT)).toBe(true);
  });

  it.each([
    ['a saved address and names', { intent: 'save', name: NAME, email: TYPED }],
    ['a resend', { intent: 'resend' }],
    ['an acknowledgement', { intent: 'acknowledge' }]
  ])('carries the result alone for %s: no address, name or id', async (_label, body) => {
    const deps = depsWith({ getBasicUserData: vi.fn(async () => userIn('pending')) });

    const answer = await handleIdentityProviderRegistration(post(body), deps);

    expect(Object.keys(answer.body)).toEqual(['result']);
    const text = JSON.stringify(answer);
    for (const secret of [TYPED, PENDING, NAME.en, OWN_ORGANIZATION, 'user-1']) expect(text).not.toContain(secret);
  });
});
