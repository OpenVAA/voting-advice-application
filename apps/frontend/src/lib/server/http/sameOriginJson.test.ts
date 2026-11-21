import { describe, expect, it } from 'vitest';
import { isJsonRequest, isSameOriginRequest } from './sameOriginJson';

const OWN_ORIGIN = 'https://vaa.example.org';

describe('isSameOriginRequest', () => {
  it.each([
    ['Sec-Fetch-Site same-origin alone', { 'sec-fetch-site': 'same-origin' }, true],
    [
      'Sec-Fetch-Site same-origin with a foreign Origin',
      { 'sec-fetch-site': 'same-origin', origin: 'https://evil.example' },
      true
    ],
    ['Sec-Fetch-Site same-site with the own Origin', { 'sec-fetch-site': 'same-site', origin: OWN_ORIGIN }, false],
    ['Sec-Fetch-Site cross-site', { 'sec-fetch-site': 'cross-site' }, false],
    ['the own Origin without Sec-Fetch-Site', { origin: OWN_ORIGIN }, true],
    ['a foreign Origin without Sec-Fetch-Site', { origin: 'https://evil.example' }, false],
    ['neither header', {}, false]
  ])('%s → %s', (_, headers, expected) => {
    expect(isSameOriginRequest(new Headers(headers), OWN_ORIGIN)).toBe(expected);
  });
});

describe('isJsonRequest', () => {
  it.each([
    ['application/json', true],
    ['application/json; charset=utf-8', true],
    ['  Application/JSON ;charset=utf-8', true],
    ['text/plain', false],
    ['application/json-patch+json', false],
    ['', false]
  ])('Content-Type %j → %s', (contentType, expected) => {
    expect(isJsonRequest(new Headers({ 'content-type': contentType }))).toBe(expected);
  });

  it('is false without Content-Type', () => {
    expect(isJsonRequest(new Headers())).toBe(false);
  });
});
