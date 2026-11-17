/**
 * The wire contract of `identity-callback`: which bodies are requests, and that the set of answers is closed.
 *
 * No mocks and no network: every function under test is pure.
 */

import { describe, expect, it } from 'vitest';
import { IDENTITY_CALLBACK_RESULT, parseIdentityCallbackRequest, resultBody, resultStatus } from './requestContract.ts';
import type { IdentityCallbackResult } from './requestContract.ts';

const PROJECT = '00000000-0000-0000-0000-000000000001';
const UPPER_PROJECT = 'ABCDEF00-0000-4000-8000-0000000000AB';
const TOKEN = 'header.payload.signature';
const TOKEN_MAX_LENGTH = 16384;

const REQUEST = { id_token: TOKEN, project_id: PROJECT };

describe('parseIdentityCallbackRequest: well-formed bodies', () => {
  it('parses a token and a project, with no entity type', () => {
    expect(parseIdentityCallbackRequest(REQUEST)).toEqual({ idToken: TOKEN, projectId: PROJECT, entityType: null });
  });

  it('lower-cases the project', () => {
    expect(parseIdentityCallbackRequest({ id_token: TOKEN, project_id: UPPER_PROJECT })).toEqual({
      idToken: TOKEN,
      projectId: UPPER_PROJECT.toLowerCase(),
      entityType: null
    });
  });

  it.each(['candidate', 'organization'])('parses the entity type %s', (entityType) => {
    expect(parseIdentityCallbackRequest({ ...REQUEST, entity_type: entityType })).toEqual({
      idToken: TOKEN,
      projectId: PROJECT,
      entityType
    });
  });

  it('reads a null entity type as none', () => {
    expect(parseIdentityCallbackRequest({ ...REQUEST, entity_type: null })).toEqual({
      idToken: TOKEN,
      projectId: PROJECT,
      entityType: null
    });
  });

  it('accepts a token of the greatest length', () => {
    const idToken = 'a'.repeat(TOKEN_MAX_LENGTH);
    expect(parseIdentityCallbackRequest({ ...REQUEST, id_token: idToken })).toEqual({
      idToken,
      projectId: PROJECT,
      entityType: null
    });
  });

  it('ignores keys it does not read', () => {
    expect(parseIdentityCallbackRequest({ ...REQUEST, operation: 'anything', extra: 1 })).toEqual({
      idToken: TOKEN,
      projectId: PROJECT,
      entityType: null
    });
  });

  it('does not trim the token', () => {
    expect(parseIdentityCallbackRequest({ ...REQUEST, id_token: ` ${TOKEN} ` })?.idToken).toBe(` ${TOKEN} `);
  });
});

describe('parseIdentityCallbackRequest: malformed bodies', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'id_token'],
    ['a number', 1],
    ['an array', [REQUEST]],
    ['an empty object', {}]
  ])('refuses a body that is %s', (_label, body) => {
    expect(parseIdentityCallbackRequest(body)).toBeNull();
  });

  it.each([
    ['absent', undefined],
    ['null', null],
    ['empty', ''],
    ['a number', 42],
    ['an object', { token: TOKEN }],
    ['an array', [TOKEN]],
    ['one character too long', 'a'.repeat(TOKEN_MAX_LENGTH + 1)]
  ])('refuses a token that is %s', (_label, idToken) => {
    expect(parseIdentityCallbackRequest({ ...REQUEST, id_token: idToken })).toBeNull();
  });

  it.each([
    ['absent', undefined],
    ['null', null],
    ['empty', ''],
    ['not a uuid', 'project-one'],
    ['a uuid with spaces around it', ` ${PROJECT} `],
    ['a uuid without its dashes', PROJECT.replaceAll('-', '')],
    ['a number', 1],
    ['an object', { id: PROJECT }]
  ])('refuses a project that is %s', (_label, projectId) => {
    expect(parseIdentityCallbackRequest({ ...REQUEST, project_id: projectId })).toBeNull();
  });

  it('refuses a body without a project, whatever else it names', () => {
    expect(parseIdentityCallbackRequest({ id_token: TOKEN })).toBeNull();
    expect(parseIdentityCallbackRequest({ id_token: TOKEN, entity_type: 'organization' })).toBeNull();
  });

  it.each([
    ['empty', ''],
    ['another entity type', 'faction'],
    ['in another case', 'Candidate'],
    ['with a space around it', ' candidate'],
    ['a list of types', ['candidate']],
    ['a number', 0],
    ['true', true]
  ])('refuses an entity type that is %s', (_label, entityType) => {
    expect(parseIdentityCallbackRequest({ ...REQUEST, entity_type: entityType })).toBeNull();
  });
});

describe('the results', () => {
  const EXPECTED_STATUS: Record<IdentityCallbackResult, number> = {
    created: 200,
    found: 200,
    no_entity: 200,
    mode_not_allowed: 403,
    invalid_token: 401,
    refused: 401,
    bad_request: 400,
    configuration: 500,
    unavailable: 503
  };

  it('holds exactly the nine results, each keyed by its own spelling', () => {
    expect(Object.keys(IDENTITY_CALLBACK_RESULT).sort()).toEqual(Object.keys(EXPECTED_STATUS).sort());
    for (const [key, value] of Object.entries(IDENTITY_CALLBACK_RESULT)) expect(value).toBe(key);
  });

  it('cannot be changed at run time', () => {
    expect(Object.isFrozen(IDENTITY_CALLBACK_RESULT)).toBe(true);
  });

  it.each(Object.entries(EXPECTED_STATUS))('answers %s with status %i', (result, status) => {
    expect(resultStatus(result as IdentityCallbackResult)).toBe(status);
  });

  it.each(['created', 'found', 'no_entity'] as const)(
    'gives the success %s a body of the result and the token',
    (result) => {
      const body = resultBody(result, 'the-token');
      expect(body).toEqual({ result, token: 'the-token' });
      expect(Object.keys(body).sort()).toEqual(['result', 'token']);
    }
  );

  it.each(['mode_not_allowed', 'invalid_token', 'refused', 'bad_request', 'configuration', 'unavailable'] as const)(
    'gives the failure %s a body of the result alone',
    (result) => {
      expect(resultBody(result)).toEqual({ result });
      expect(Object.keys(resultBody(result))).toEqual(['result']);
    }
  );

  it('never puts a token on a failure, even when one is passed', () => {
    const body = resultBody('invalid_token', 'the-token');
    expect(body).toEqual({ result: 'invalid_token' });
    expect(Object.keys(body)).toEqual(['result']);
  });

  it('gives a success with no token a body of the result alone', () => {
    expect(resultBody('created')).toEqual({ result: 'created' });
  });

  it('answers a value that is no result as unavailable, with no token', () => {
    const unknown = 'session' as IdentityCallbackResult;
    expect(resultStatus(unknown)).toBe(503);
    expect(resultBody(unknown, 'the-token')).toEqual({ result: 'unavailable' });
  });
});
