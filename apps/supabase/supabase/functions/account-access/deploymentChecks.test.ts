/**
 * The deployment checks: which served settings count as closed, and that a yes is believed for a bounded time only.
 */

import { describe, expect, it } from 'vitest';
import {
  createExpiringPositive,
  isSignUpClosed,
  REDIRECT_CHECK_TTL_MS,
  SIGN_UP_CHECK_TTL_MS
} from './deploymentChecks.ts';

describe('isSignUpClosed', () => {
  it('is true for the closed configuration', () => {
    expect(isSignUpClosed({ disable_signup: true, mailer_autoconfirm: false })).toBe(true);
  });

  it('ignores the other keys of the settings', () => {
    expect(
      isSignUpClosed({
        disable_signup: true,
        mailer_autoconfirm: false,
        external: { email: true },
        phone_autoconfirm: true
      })
    ).toBe(true);
  });

  it.each([
    ['public sign-up open', { disable_signup: false, mailer_autoconfirm: false }],
    ['addresses confirmed without a mail', { disable_signup: true, mailer_autoconfirm: true }],
    ['both keys wrong', { disable_signup: false, mailer_autoconfirm: true }],
    ['disable_signup missing', { mailer_autoconfirm: false }],
    ['mailer_autoconfirm missing', { disable_signup: true }],
    ['both keys missing', {}],
    ["disable_signup the string 'true'", { disable_signup: 'true', mailer_autoconfirm: false }],
    ["mailer_autoconfirm the string 'false'", { disable_signup: true, mailer_autoconfirm: 'false' }],
    ['disable_signup the number 1', { disable_signup: 1, mailer_autoconfirm: false }],
    ['mailer_autoconfirm the number 0', { disable_signup: true, mailer_autoconfirm: 0 }],
    ['mailer_autoconfirm null', { disable_signup: true, mailer_autoconfirm: null }],
    ['null', null],
    ['undefined', undefined],
    ['a string', '{"disable_signup":true,"mailer_autoconfirm":false}'],
    ['a boolean', true],
    ['an array', [{ disable_signup: true, mailer_autoconfirm: false }]]
  ])('is false for %s', (_label, settings) => {
    expect(isSignUpClosed(settings)).toBe(false);
  });
});

describe('the lifetimes', () => {
  it('believes a closed sign-up for at most 60 seconds', () => {
    expect(SIGN_UP_CHECK_TTL_MS).toBeGreaterThan(0);
    expect(SIGN_UP_CHECK_TTL_MS).toBeLessThanOrEqual(60000);
  });

  it('believes an admitted redirect for ten minutes', () => {
    expect(REDIRECT_CHECK_TTL_MS).toBe(600000);
  });
});

describe('createExpiringPositive', () => {
  function clocked(ttlMs: number) {
    const clock = { time: 1_000_000 };
    return { clock, memory: createExpiringPositive(ttlMs, () => clock.time) };
  }

  it('answers stale for a key never remembered', () => {
    const { memory } = clocked(SIGN_UP_CHECK_TTL_MS);
    expect(memory.isFresh('sign-up')).toBe(false);
  });

  it('answers fresh just before the lifetime ends and stale at it', () => {
    const { clock, memory } = clocked(SIGN_UP_CHECK_TTL_MS);
    memory.remember('sign-up');
    expect(memory.isFresh('sign-up')).toBe(true);

    clock.time += SIGN_UP_CHECK_TTL_MS - 1;
    expect(memory.isFresh('sign-up')).toBe(true);

    clock.time += 1;
    expect(memory.isFresh('sign-up')).toBe(false);

    clock.time += 10 * SIGN_UP_CHECK_TTL_MS;
    expect(memory.isFresh('sign-up')).toBe(false);
  });

  it('keeps each key’s time apart', () => {
    const { clock, memory } = clocked(1000);
    memory.remember('http://localhost:5173/en/auth/confirm');
    clock.time += 600;
    memory.remember('http://localhost:5173/fi/auth/confirm');
    clock.time += 600;

    expect(memory.isFresh('http://localhost:5173/en/auth/confirm')).toBe(false);
    expect(memory.isFresh('http://localhost:5173/fi/auth/confirm')).toBe(true);
    expect(memory.isFresh('http://localhost:5173/sv/auth/confirm')).toBe(false);
  });

  it('starts a new lifetime when an answer is remembered again', () => {
    const { clock, memory } = clocked(1000);
    memory.remember('key');
    clock.time += 900;
    memory.remember('key');
    clock.time += 900;
    expect(memory.isFresh('key')).toBe(true);
  });

  it('answers stale when the clock has moved backwards past the remembered time', () => {
    const { clock, memory } = clocked(1000);
    memory.remember('key');
    clock.time -= 5000;
    expect(memory.isFresh('key')).toBe(false);
  });

  it('offers no way to remember a negative answer', () => {
    const { memory } = clocked(1000);
    expect(Object.keys(memory).sort()).toEqual(['isFresh', 'remember']);
  });

  it('shares nothing between two memories', () => {
    const first = createExpiringPositive(1000, () => 0);
    const second = createExpiringPositive(1000, () => 0);
    first.remember('key');
    expect(second.isFresh('key')).toBe(false);
  });
});
