/**
 * The per-caller limit's three pure parts: which operations take a slot, which header names the caller, and which answers of the database are a wait.
 */

import { describe, expect, it } from 'vitest';
import {
  CALLER_ADDRESS_HEADER,
  CALLER_LIMITED_OPERATIONS,
  callerAddress,
  retryAfterSeconds,
  takesCallerSlot
} from './callerLimit.ts';
import type { AccountAccessRequest } from './contract.ts';

describe('CALLER_LIMITED_OPERATIONS', () => {
  it('is the three operations a browser calls anonymously', () => {
    expect([...CALLER_LIMITED_OPERATIONS]).toEqual(['check-code', 'request-link', 'request-recovery']);
  });

  it('cannot be changed by a caller of the module', () => {
    expect(Object.isFrozen(CALLER_LIMITED_OPERATIONS)).toBe(true);
  });
});

describe('takesCallerSlot', () => {
  it.each(['check-code', 'request-link', 'request-recovery'] as const)('is true for %s', (operation) => {
    expect(takesCallerSlot(operation)).toBe(true);
  });

  it('is false for code-sign-in, which the frontend server calls', () => {
    expect(takesCallerSlot('code-sign-in')).toBe(false);
  });

  it('is false for confirm-address, which is answered only to a signed-in account', () => {
    expect(takesCallerSlot('confirm-address')).toBe(false);
  });

  it('is false for a name no operation has', () => {
    expect(takesCallerSlot('sign-in' as AccountAccessRequest['operation'])).toBe(false);
    expect(takesCallerSlot('' as AccountAccessRequest['operation'])).toBe(false);
  });
});

describe('CALLER_ADDRESS_HEADER', () => {
  it('is the header Cloudflare sets to the connecting client', () => {
    expect(CALLER_ADDRESS_HEADER).toBe('cf-connecting-ip');
  });
});

describe('callerAddress', () => {
  it('is the trimmed value of the header', () => {
    expect(callerAddress(new Headers({ 'cf-connecting-ip': ' 198.51.100.7 ' }))).toBe('198.51.100.7');
  });

  it('reads the header whatever its case in the request', () => {
    expect(callerAddress(new Headers({ 'CF-Connecting-IP': '198.51.100.7' }))).toBe('198.51.100.7');
  });

  it('passes the value on unparsed, for the database to judge', () => {
    expect(callerAddress(new Headers({ 'cf-connecting-ip': 'not-an-address' }))).toBe('not-an-address');
  });

  it.each([
    ['absent', new Headers()],
    ['empty', new Headers({ 'cf-connecting-ip': '' })],
    ['blank', new Headers({ 'cf-connecting-ip': '   ' })]
  ])('is null when the header is %s', (_, headers) => {
    expect(callerAddress(headers)).toBeNull();
  });

  it('reads no other header for the caller', () => {
    const headers = new Headers({
      'x-forwarded-for': '198.51.100.9',
      'x-real-ip': '198.51.100.10',
      forwarded: 'for=198.51.100.11',
      'true-client-ip': '198.51.100.12'
    });
    expect(callerAddress(headers)).toBeNull();
  });

  it('asks the headers for that one name only', () => {
    const asked: Array<string> = [];
    const headers = new Headers({ 'cf-connecting-ip': '198.51.100.7', 'x-forwarded-for': '198.51.100.9' });
    const recording = new Proxy(headers, {
      get(target, property) {
        if (property === 'get') {
          return (name: string) => {
            asked.push(name);
            return target.get(name);
          };
        }
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
    expect(callerAddress(recording)).toBe('198.51.100.7');
    expect(asked).toEqual(['cf-connecting-ip']);
  });
});

describe('retryAfterSeconds', () => {
  it('is the number of seconds the database answered', () => {
    expect(retryAfterSeconds(30)).toBe(30);
    expect(retryAfterSeconds(1)).toBe(1);
    expect(retryAfterSeconds(600)).toBe(600);
  });

  it.each([
    ['0, an admitted take', 0],
    ['a negative number', -1],
    ['a fraction', 1.5],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['an unsafe integer', Number.MAX_SAFE_INTEGER + 1],
    ['null', null],
    ['undefined', undefined],
    ['a string', '30'],
    ['an object', { seconds: 30 }],
    ['an array', [30]],
    ['a boolean', true]
  ])('is null for %s', (_, value) => {
    expect(retryAfterSeconds(value)).toBeNull();
  });
});
