/**
 * The wire contract: which bodies are requests, and that the set of answers is closed.
 *
 * No mocks and no network: every function under test is pure.
 */

import { describe, expect, it } from 'vitest';
import * as contract from './contract.ts';
import {
  ACCEPTED_BODY,
  admitWitness,
  ADDRESS_IN_USE_BODY,
  ADDRESS_REFUSED_BODY,
  ADDRESS_SENT_BODY,
  addressConfirmationAnswer,
  BAD_REQUEST_BODY,
  codeStatusBody,
  INTERNAL_ERROR_BODY,
  INVALID_CREDENTIALS_BODY,
  METHOD_NOT_ALLOWED_BODY,
  parseAccountAccessRequest,
  signedInBody,
  UNAUTHENTICATED_BODY
} from './contract.ts';
import type { AddressConfirmationOutcome, CodeStatus } from './contract.ts';

const PROJECT = '00000000-0000-0000-0000-000000000001';
const WITNESS = '11111111-2222-3333-4444-555555555555';

const CHECK_CODE = { operation: 'check-code', project_id: PROJECT, code: 'ABCD-EFGH-JKLM' };
const REQUEST_LINK = { operation: 'request-link', project_id: PROJECT, email: 'person@example.org' };
const CODE_SIGN_IN = { operation: 'code-sign-in', project_id: PROJECT, code: 'ABCD-EFGH-JKLM', password: 'a password' };
const REQUEST_RECOVERY = { operation: 'request-recovery', project_id: PROJECT, email: 'person@example.org' };
const CONFIRM_ADDRESS = { operation: 'confirm-address', project_id: PROJECT, email: 'person@example.org' };

describe('parseAccountAccessRequest: well-formed bodies', () => {
  it('parses a code check', () => {
    expect(parseAccountAccessRequest(CHECK_CODE)).toEqual({
      operation: 'check-code',
      projectId: PROJECT,
      code: 'ABCD-EFGH-JKLM'
    });
  });

  it('parses a link request that names an address only', () => {
    expect(parseAccountAccessRequest(REQUEST_LINK)).toEqual({
      operation: 'request-link',
      projectId: PROJECT,
      email: 'person@example.org',
      code: null,
      locale: undefined,
      witness: null
    });
  });

  it('parses a link request that names a code only', () => {
    expect(parseAccountAccessRequest({ operation: 'request-link', project_id: PROJECT, code: 'ABCD' })).toEqual({
      operation: 'request-link',
      projectId: PROJECT,
      email: null,
      code: 'ABCD',
      locale: undefined,
      witness: null
    });
  });

  it('parses a link request with an address, a code, a locale and a witness, passing the locale on untouched', () => {
    expect(
      parseAccountAccessRequest({ ...REQUEST_LINK, code: 'ABCD', locale: 'not-a-locale', witness: WITNESS })
    ).toEqual({
      operation: 'request-link',
      projectId: PROJECT,
      email: 'person@example.org',
      code: 'ABCD',
      locale: 'not-a-locale',
      witness: WITNESS
    });
  });

  it('parses a code sign-in', () => {
    expect(parseAccountAccessRequest(CODE_SIGN_IN)).toEqual({
      operation: 'code-sign-in',
      projectId: PROJECT,
      code: 'ABCD-EFGH-JKLM',
      password: 'a password'
    });
  });

  it('parses a recovery request that names a project and an address and nothing else', () => {
    expect(parseAccountAccessRequest(REQUEST_RECOVERY)).toEqual({
      operation: 'request-recovery',
      projectId: PROJECT,
      email: 'person@example.org',
      locale: undefined,
      witness: null
    });
  });

  it('parses a recovery request with a locale and a witness, passing the locale on untouched', () => {
    expect(parseAccountAccessRequest({ ...REQUEST_RECOVERY, locale: 'not-a-locale', witness: WITNESS })).toEqual({
      operation: 'request-recovery',
      projectId: PROJECT,
      email: 'person@example.org',
      locale: 'not-a-locale',
      witness: WITNESS
    });
  });

  it('does not read a code, a redirect target or any other key of a recovery request', () => {
    const parsed = parseAccountAccessRequest({
      ...REQUEST_RECOVERY,
      code: 12345,
      redirect_to: 'https://elsewhere.example',
      type: 'magiclink',
      password: 'a password'
    });
    expect(parsed).toEqual({
      operation: 'request-recovery',
      projectId: PROJECT,
      email: 'person@example.org',
      locale: undefined,
      witness: null
    });
    expect(Object.keys(parsed ?? {}).sort()).toEqual(['email', 'locale', 'operation', 'projectId', 'witness']);
  });

  it('ignores unknown keys', () => {
    expect(
      parseAccountAccessRequest({ ...CHECK_CODE, subject: 'x', redirect_to: 'https://elsewhere.example' })
    ).toEqual({ operation: 'check-code', projectId: PROJECT, code: 'ABCD-EFGH-JKLM' });
  });

  it('accepts a project id in upper case and passes it on in lower case', () => {
    const upper = 'ABCDEF01-2345-6789-ABCD-EF0123456789';
    expect(parseAccountAccessRequest({ ...CHECK_CODE, project_id: upper })).toMatchObject({
      projectId: upper.toLowerCase()
    });
  });

  it('treats a null optional field as absent', () => {
    expect(parseAccountAccessRequest({ ...REQUEST_LINK, code: null, locale: null, witness: null })).toMatchObject({
      email: 'person@example.org',
      code: null,
      locale: undefined,
      witness: null
    });
    expect(parseAccountAccessRequest({ ...REQUEST_RECOVERY, locale: null, witness: null })).toMatchObject({
      operation: 'request-recovery',
      email: 'person@example.org',
      locale: undefined,
      witness: null
    });
  });

  it('accepts each field at its length bound', () => {
    expect(parseAccountAccessRequest({ ...CHECK_CODE, code: 'c'.repeat(64) })).not.toBeNull();
    expect(parseAccountAccessRequest({ ...REQUEST_LINK, email: `${'a'.repeat(318)}@b` })).not.toBeNull();
    expect(parseAccountAccessRequest({ ...REQUEST_LINK, email: 'a@b' })).not.toBeNull();
    expect(parseAccountAccessRequest({ ...REQUEST_RECOVERY, email: `${'a'.repeat(318)}@b` })).not.toBeNull();
    expect(parseAccountAccessRequest({ ...REQUEST_RECOVERY, email: 'a@b' })).not.toBeNull();
    expect(parseAccountAccessRequest({ ...CODE_SIGN_IN, password: 'p'.repeat(1024) })).not.toBeNull();
  });
});

describe('parseAccountAccessRequest: the address confirmation', () => {
  it('parses a confirmation that names a project and an address', () => {
    expect(parseAccountAccessRequest(CONFIRM_ADDRESS)).toEqual({
      operation: 'confirm-address',
      projectId: PROJECT,
      email: 'person@example.org',
      locale: undefined
    });
  });

  it('parses a confirmation with a locale, passing the locale on untouched, and the project in lower case', () => {
    expect(
      parseAccountAccessRequest({ ...CONFIRM_ADDRESS, project_id: PROJECT.toUpperCase(), locale: 'not-a-locale' })
    ).toEqual({
      operation: 'confirm-address',
      projectId: PROJECT,
      email: 'person@example.org',
      locale: 'not-a-locale'
    });
  });

  it('reads no user, token, code, witness or redirect target from the body', () => {
    const parsed = parseAccountAccessRequest({
      ...CONFIRM_ADDRESS,
      user_id: '11111111-2222-3333-4444-555555555555',
      access_token: 'a token',
      code: 'ABCD',
      witness: WITNESS,
      redirect_to: 'https://elsewhere.example'
    });
    expect(Object.keys(parsed ?? {}).sort()).toEqual(['email', 'locale', 'operation', 'projectId']);
  });

  it('treats a null locale as absent and accepts the address at its length bounds', () => {
    expect(parseAccountAccessRequest({ ...CONFIRM_ADDRESS, locale: null })).toMatchObject({ locale: undefined });
    expect(parseAccountAccessRequest({ ...CONFIRM_ADDRESS, email: 'a@b' })).not.toBeNull();
    expect(parseAccountAccessRequest({ ...CONFIRM_ADDRESS, email: `${'a'.repeat(318)}@b` })).not.toBeNull();
  });

  it.each([
    ['no project', { operation: 'confirm-address', email: 'person@example.org' }],
    ['no address', { operation: 'confirm-address', project_id: PROJECT }],
    ['a null address', { ...CONFIRM_ADDRESS, email: null }],
    ['an address under 3 characters', { ...CONFIRM_ADDRESS, email: '@a' }],
    ['an address over 320 characters', { ...CONFIRM_ADDRESS, email: `${'a'.repeat(319)}@b` }],
    ['an address that holds no @', { ...CONFIRM_ADDRESS, email: 'person.example.org' }],
    ['an address that is not a string', { ...CONFIRM_ADDRESS, email: ['person@example.org'] }],
    ['a locale that is not a string', { ...CONFIRM_ADDRESS, locale: 5 }]
  ])('rejects a confirmation with %s', (_label, body) => {
    expect(parseAccountAccessRequest(body)).toBeNull();
  });
});

describe('the answers of the address confirmation', () => {
  it('are four, and each outcome has its own', () => {
    expect(addressConfirmationAnswer('sent')).toEqual({ status: 200, body: { result: 'sent' } });
    expect(addressConfirmationAnswer('in-use')).toEqual({ status: 200, body: { result: 'in-use' } });
    expect(addressConfirmationAnswer('refused')).toEqual({ status: 200, body: { result: 'refused' } });
    expect(addressConfirmationAnswer('unauthenticated')).toEqual({ status: 401, body: { error: 'unauthenticated' } });
  });

  it('answer the refusal for any other runtime value, so a fifth answer cannot leave the function', () => {
    for (const other of ['accepted', 'in_use', 'SENT', '', null, undefined, 1, { result: 'sent' }]) {
      expect(addressConfirmationAnswer(other as AddressConfirmationOutcome)).toEqual({
        status: 200,
        body: { result: 'refused' }
      });
    }
  });

  it('carry nothing but the one word of the outcome', () => {
    for (const body of [ADDRESS_SENT_BODY, ADDRESS_IN_USE_BODY, ADDRESS_REFUSED_BODY, UNAUTHENTICATED_BODY]) {
      expect(Object.keys(body)).toHaveLength(1);
      expect(Object.isFrozen(body)).toBe(true);
    }
  });
});

describe('parseAccountAccessRequest: the witness changes no answer', () => {
  it.each([['not-a-uuid'], [42], [{}], [''], [`${WITNESS}0`]])(
    'drops a witness of %j and still parses the request',
    (witness) => {
      expect(parseAccountAccessRequest({ ...REQUEST_LINK, witness })).toEqual({
        operation: 'request-link',
        projectId: PROJECT,
        email: 'person@example.org',
        code: null,
        locale: undefined,
        witness: null
      });
    }
  );

  it.each([['not-a-uuid'], [42], [{}], [''], [`${WITNESS}0`]])(
    'drops a witness of %j from a recovery request and still parses it',
    (witness) => {
      expect(parseAccountAccessRequest({ ...REQUEST_RECOVERY, witness })).toEqual({
        operation: 'request-recovery',
        projectId: PROJECT,
        email: 'person@example.org',
        locale: undefined,
        witness: null
      });
    }
  );

  it('passes a witness of a recovery request on in lower case', () => {
    expect(parseAccountAccessRequest({ ...REQUEST_RECOVERY, witness: WITNESS.toUpperCase() })).toMatchObject({
      witness: WITNESS
    });
  });
});

describe('parseAccountAccessRequest: malformed bodies give null', () => {
  it.each([
    ['an array', [CHECK_CODE]],
    ['a string', 'check-code'],
    ['a number', 7],
    ['null', null],
    ['undefined', undefined],
    ['an empty object', {}]
  ])('rejects %s', (_label, body) => {
    expect(parseAccountAccessRequest(body)).toBeNull();
  });

  it.each([
    ['no operation', { project_id: PROJECT, code: 'ABCD' }],
    ['an unknown operation', { ...CHECK_CODE, operation: 'delete-user' }],
    ['an operation inherited from a prototype key', { ...CHECK_CODE, operation: '__proto__' }],
    ['an operation that is not a string', { ...CHECK_CODE, operation: ['check-code'] }]
  ])('rejects %s', (_label, body) => {
    expect(parseAccountAccessRequest(body)).toBeNull();
  });

  it.each([
    ['no project', { operation: 'check-code', code: 'ABCD' }],
    ['a project that is not a uuid', { ...CHECK_CODE, project_id: 'default' }],
    ['a uuid without its hyphens', { ...CHECK_CODE, project_id: '00000000000000000000000000000001' }],
    ['a uuid with a trailing character', { ...CHECK_CODE, project_id: `${PROJECT}0` }],
    ['a uuid with surrounding spaces', { ...CHECK_CODE, project_id: ` ${PROJECT} ` }],
    ['a project that is not a string', { ...CHECK_CODE, project_id: 1 }]
  ])('rejects %s', (_label, body) => {
    expect(parseAccountAccessRequest(body)).toBeNull();
  });

  it.each([
    ['a code check with no code', { operation: 'check-code', project_id: PROJECT }],
    ['a code check with an empty code', { ...CHECK_CODE, code: '' }],
    ['a code check with a code over 64 characters', { ...CHECK_CODE, code: 'c'.repeat(65) }],
    ['a code check with a code that is not a string', { ...CHECK_CODE, code: 1234 }]
  ])('rejects %s', (_label, body) => {
    expect(parseAccountAccessRequest(body)).toBeNull();
  });

  it.each([
    ['a link request with neither an address nor a code', { operation: 'request-link', project_id: PROJECT }],
    ['a link request with an address under 3 characters', { ...REQUEST_LINK, email: '@a' }],
    ['a link request with an address over 320 characters', { ...REQUEST_LINK, email: `${'a'.repeat(319)}@b` }],
    ['a link request with an address that holds no @', { ...REQUEST_LINK, email: 'person.example.org' }],
    ['a link request with an address that is not a string', { ...REQUEST_LINK, email: ['person@example.org'] }],
    ['a link request with a malformed address beside a good code', { ...REQUEST_LINK, email: 'x', code: 'ABCD' }],
    ['a link request with an empty code beside a good address', { ...REQUEST_LINK, code: '' }],
    ['a link request with a code over 64 characters', { ...REQUEST_LINK, code: 'c'.repeat(65) }],
    ['a link request with a locale that is not a string', { ...REQUEST_LINK, locale: 5 }]
  ])('rejects %s', (_label, body) => {
    expect(parseAccountAccessRequest(body)).toBeNull();
  });

  it.each([
    ['a recovery request with no project', { operation: 'request-recovery', email: 'person@example.org' }],
    ['a recovery request with no address', { operation: 'request-recovery', project_id: PROJECT }],
    ['a recovery request with a null address', { ...REQUEST_RECOVERY, email: null }],
    ['a recovery request with a code in place of an address', { ...REQUEST_RECOVERY, email: undefined, code: 'ABCD' }],
    ['a recovery request with an address under 3 characters', { ...REQUEST_RECOVERY, email: '@a' }],
    ['a recovery request with an address over 320 characters', { ...REQUEST_RECOVERY, email: `${'a'.repeat(319)}@b` }],
    ['a recovery request with an address that holds no @', { ...REQUEST_RECOVERY, email: 'person.example.org' }],
    ['a recovery request with an address that is not a string', { ...REQUEST_RECOVERY, email: ['person@example.org'] }],
    ['a recovery request with a locale that is not a string', { ...REQUEST_RECOVERY, locale: 5 }]
  ])('rejects %s', (_label, body) => {
    expect(parseAccountAccessRequest(body)).toBeNull();
  });

  it.each([
    ['a code sign-in with no code', { operation: 'code-sign-in', project_id: PROJECT, password: 'p' }],
    ['a code sign-in with no password', { operation: 'code-sign-in', project_id: PROJECT, code: 'ABCD' }],
    ['a code sign-in with an empty password', { ...CODE_SIGN_IN, password: '' }],
    ['a code sign-in with a password over 1024 characters', { ...CODE_SIGN_IN, password: 'p'.repeat(1025) }],
    ['a code sign-in with a code over 64 characters', { ...CODE_SIGN_IN, code: 'c'.repeat(65) }],
    ['a code sign-in with a password that is not a string', { ...CODE_SIGN_IN, password: 12345678 }]
  ])('rejects %s', (_label, body) => {
    expect(parseAccountAccessRequest(body)).toBeNull();
  });
});

describe('the answers are a closed set', () => {
  it('builds three code-status bodies and no fourth', () => {
    expect(codeStatusBody('valid')).toEqual({ status: 'valid' });
    expect(codeStatusBody('used')).toEqual({ status: 'used' });
    expect(codeStatusBody('unknown')).toEqual({ status: 'unknown' });

    const others: Array<unknown> = ['expired', 'VALID', '', null, undefined, 1, { status: 'valid' }, 'claimed'];
    for (const other of others) {
      expect(codeStatusBody(other as CodeStatus)).toEqual({ status: 'unknown' });
    }
  });

  it('answers a link request with a body of exactly one key', () => {
    expect(Object.keys(ACCEPTED_BODY)).toEqual(['accepted']);
    expect(ACCEPTED_BODY).toEqual({ accepted: true });
  });

  it('gives the request-recovery operation no answer of its own: the module exports the nine fixed bodies and no tenth', () => {
    const bodies = Object.keys(contract).filter((name) => name.endsWith('_BODY'));
    expect(bodies.sort()).toEqual([
      'ACCEPTED_BODY',
      'ADDRESS_IN_USE_BODY',
      'ADDRESS_REFUSED_BODY',
      'ADDRESS_SENT_BODY',
      'BAD_REQUEST_BODY',
      'INTERNAL_ERROR_BODY',
      'INVALID_CREDENTIALS_BODY',
      'METHOD_NOT_ALLOWED_BODY',
      'UNAUTHENTICATED_BODY'
    ]);
    expect(parseAccountAccessRequest(REQUEST_RECOVERY)?.operation).toBe('request-recovery');
  });

  it('holds the four fixed failure bodies', () => {
    expect(BAD_REQUEST_BODY).toEqual({ error: 'bad-request' });
    expect(METHOD_NOT_ALLOWED_BODY).toEqual({ error: 'method-not-allowed' });
    expect(INTERNAL_ERROR_BODY).toEqual({ error: 'internal' });
    expect(INVALID_CREDENTIALS_BODY).toEqual({ result: 'invalid-credentials' });
  });

  it('holds the four bodies of the address confirmation', () => {
    expect(ADDRESS_SENT_BODY).toEqual({ result: 'sent' });
    expect(ADDRESS_IN_USE_BODY).toEqual({ result: 'in-use' });
    expect(ADDRESS_REFUSED_BODY).toEqual({ result: 'refused' });
    expect(UNAUTHENTICATED_BODY).toEqual({ error: 'unauthenticated' });
  });

  it('cannot be changed by a caller of the module', () => {
    for (const body of [
      ACCEPTED_BODY,
      BAD_REQUEST_BODY,
      METHOD_NOT_ALLOWED_BODY,
      INTERNAL_ERROR_BODY,
      INVALID_CREDENTIALS_BODY,
      ADDRESS_SENT_BODY,
      ADDRESS_IN_USE_BODY,
      ADDRESS_REFUSED_BODY,
      UNAUTHENTICATED_BODY
    ]) {
      expect(Object.isFrozen(body)).toBe(true);
    }
  });

  it('answers a sign-in with the two tokens and nothing about the user', () => {
    const body = signedInBody({
      access_token: 'access',
      refresh_token: 'refresh',
      user: { email: 'person@example.org' }
    } as never);
    expect(body).toEqual({ result: 'signed-in', access_token: 'access', refresh_token: 'refresh' });
    expect(Object.keys(body).sort()).toEqual(['access_token', 'refresh_token', 'result']);
  });
});

describe('admitWitness', () => {
  /** A stand-in for the service role's key; the function compares it as an opaque string. */
  const SERVICE_KEY = 'service-role-key-of-this-deployment';
  const LINK = parseAccountAccessRequest({ ...REQUEST_LINK, witness: WITNESS })!;
  const RECOVERY = parseAccountAccessRequest({ ...REQUEST_RECOVERY, witness: WITNESS })!;

  it.each([
    ['a link request', LINK],
    ['a recovery request', RECOVERY]
  ])('keeps the witness of %s whose bearer is the service role key', (_name, request) => {
    expect(admitWitness(request, `Bearer ${SERVICE_KEY}`, SERVICE_KEY)).toEqual(request);
  });

  it.each([
    ['no Authorization', null, SERVICE_KEY],
    ['another bearer, as the anon key is', 'Bearer some-other-key', SERVICE_KEY],
    ['the key without the Bearer scheme', SERVICE_KEY, SERVICE_KEY],
    ['the key with a suffix', `Bearer ${SERVICE_KEY}x`, SERVICE_KEY],
    ['a key the deployment does not set', `Bearer ${SERVICE_KEY}`, undefined],
    ['an empty key on both sides', 'Bearer ', '']
  ])(
    'drops the witness of a link and a recovery request with %s, and changes nothing else',
    (_name, authorization, key) => {
      expect(admitWitness(LINK, authorization, key)).toEqual({ ...LINK, witness: null });
      expect(admitWitness(RECOVERY, authorization, key)).toEqual({ ...RECOVERY, witness: null });
    }
  );

  it('returns an operation that carries no witness as it is', () => {
    const check = parseAccountAccessRequest(CHECK_CODE)!;
    expect(admitWitness(check, null, SERVICE_KEY)).toBe(check);
  });
});
