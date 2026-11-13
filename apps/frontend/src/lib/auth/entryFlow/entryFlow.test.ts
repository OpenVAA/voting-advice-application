import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  askedAgainTooSoon,
  LINK_REQUEST_SETTLE_BOUND_MS,
  RESEND_WAIT_SECONDS,
  secondsLeft,
  settledOrBounded,
  wordingOf
} from './entryFlow';
import type { EntryHeldRequest, EntryOrigin, EntryWording } from './entryFlow';

/**
 * The entry flow's constants and arithmetic: how long the wait is, how many seconds of it are left, when a link request counts as settled, which wording a request gets, and whether the same request was repeated inside the wait.
 *
 * Every time below is a literal number of milliseconds, so a case reads without the constants it checks.
 */

/** An epoch time in milliseconds, of the size `Date.now()` answers with. */
const SETTLED_AT = 1_791_831_809_000;

/** A request held as settled at `SETTLED_AT`. */
function held(request: Partial<EntryHeldRequest> = {}): EntryHeldRequest {
  return { origin: 'signIn', wording: 'signIn', settledAt: SETTLED_AT, askedAgain: false, ...request };
}

describe('the constants', () => {
  it('waits 65 seconds before another email may be asked for', () => {
    expect(RESEND_WAIT_SECONDS).toBe(65);
  });

  it('treats a link request as settled after 10 000 milliseconds', () => {
    expect(LINK_REQUEST_SETTLE_BOUND_MS).toBe(10_000);
  });
});

describe('wordingOf', () => {
  const CASES: Array<[EntryOrigin, EntryWording]> = [
    ['signIn', 'signIn'],
    ['register', 'signIn'],
    ['registerEmail', 'signIn'],
    ['registerSignIn', 'code'],
    ['forgotPassword', 'recovery']
  ];

  it.each(CASES)('words a request made from %s as %s', (origin, wording) => {
    expect(wordingOf({ origin })).toBe(wording);
  });

  it('reads the origin alone, whatever else the request holds', () => {
    expect(wordingOf({ origin: 'forgotPassword', email: 'user@example.com', code: 'ABCD-EFGH-JKMN' })).toBe('recovery');
  });
});

describe('secondsLeft', () => {
  const CASES: Array<[number, number]> = [
    [0, 65],
    [1, 65],
    [999, 65],
    [1_000, 64],
    [1_001, 64],
    [30_000, 35],
    [64_000, 1],
    [64_001, 1],
    [64_999, 1],
    [65_000, 0],
    [65_001, 0],
    [3_600_000, 0]
  ];

  it.each(CASES)('at %i milliseconds after the settlement leaves %i seconds', (elapsed, seconds) => {
    expect(secondsLeft(SETTLED_AT, SETTLED_AT + elapsed)).toBe(seconds);
  });

  it('answers with whole seconds', () => {
    for (let elapsed = 0; elapsed <= 66_000; elapsed += 137) {
      expect(Number.isInteger(secondsLeft(SETTLED_AT, SETTLED_AT + elapsed))).toBe(true);
    }
  });

  it('is never negative and never more than the whole wait, also for a clock that moved backwards', () => {
    expect(secondsLeft(SETTLED_AT, SETTLED_AT - 5_000)).toBe(65);
    expect(secondsLeft(SETTLED_AT, SETTLED_AT + 86_400_000)).toBe(0);
  });

  it('is computed from the two times alone, so one late reading is as right as a reading every second', () => {
    const everySecond = Array.from({ length: 41 }, (_, second) => secondsLeft(SETTLED_AT, SETTLED_AT + second * 1_000));

    expect(everySecond[40]).toBe(25);
    expect(secondsLeft(SETTLED_AT, SETTLED_AT + 40_000)).toBe(25);
  });
});

describe('settledOrBounded', () => {
  beforeEach(() => {
    // `setImmediate` stays real, so a case can wait for the turn in which Node reports a rejection nothing handles.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Whether the promise has resolved, read as a flag so that no case waits on a promise that never settles. */
  function watch(promise: Promise<unknown>): { resolved: boolean; rejected: boolean; value: unknown } {
    const state = { resolved: false, rejected: false, value: undefined as unknown };
    promise.then(
      (value) => {
        state.resolved = true;
        state.value = value;
      },
      () => {
        state.rejected = true;
      }
    );
    return state;
  }

  /** A pending request with the two functions that settle it. */
  function pendingRequest(): {
    request: Promise<unknown>;
    fulfil: (value: unknown) => void;
    reject: (reason: unknown) => void;
  } {
    const settlers = {} as { fulfil: (value: unknown) => void; reject: (reason: unknown) => void };
    const request = new Promise<unknown>((resolve, reject) => {
      settlers.fulfil = resolve;
      settlers.reject = reject;
    });
    return { request, ...settlers };
  }

  /** Wait for a real turn of the event loop, in which Node reports a rejection that nothing handles. */
  function nextTurn(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve));
  }

  it('resolves when the request fulfils, before the bound', async () => {
    const { request, fulfil } = pendingRequest();
    const state = watch(settledOrBounded(request));

    await vi.advanceTimersByTimeAsync(250);
    expect(state.resolved).toBe(false);

    fulfil({ accepted: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(state.resolved).toBe(true);
  });

  it('resolves to nothing of what the request answered', async () => {
    const state = watch(settledOrBounded(Promise.resolve({ type: 'success', detail: 'value-of-the-answer' })));

    await vi.advanceTimersByTimeAsync(0);

    expect(state.resolved).toBe(true);
    expect(state.value).toBeUndefined();
  });

  it('resolves at once when the request rejects, and never rejects itself', async () => {
    const { request, reject } = pendingRequest();
    const state = watch(settledOrBounded(request));

    reject(new Error('the request failed'));
    await vi.advanceTimersByTimeAsync(0);

    expect(state.resolved).toBe(true);
    expect(state.rejected).toBe(false);
    expect(state.value).toBeUndefined();
  });

  it('leaves no timer behind when the request settles first', async () => {
    const state = watch(settledOrBounded(Promise.resolve()));

    await vi.advanceTimersByTimeAsync(0);

    expect(state.resolved).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('holds until the bound for a request that never settles, and resolves at it', async () => {
    const state = watch(settledOrBounded(new Promise(() => undefined)));

    await vi.advanceTimersByTimeAsync(9_999);
    expect(state.resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(state.resolved).toBe(true);
    expect(state.rejected).toBe(false);
    expect(state.value).toBeUndefined();
  });

  it('raises no unhandled rejection for a request that rejects, before the bound or after it', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      const { request: lateRequest, reject: rejectLate } = pendingRequest();
      const early = watch(settledOrBounded(Promise.reject(new Error('the request failed'))));
      const late = watch(settledOrBounded(lateRequest));

      await vi.advanceTimersByTimeAsync(10_000);
      expect(early.resolved).toBe(true);
      expect(late.resolved).toBe(true);

      rejectLate(new Error('the request failed after the bound'));
      await vi.advanceTimersByTimeAsync(0);
      await nextTurn();

      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });
});

describe('askedAgainTooSoon', () => {
  it('is false when no request is held', () => {
    expect(askedAgainTooSoon(undefined, { origin: 'signIn', email: 'user@example.com' }, SETTLED_AT)).toBe(false);
  });

  it('is true for the same address inside the wait', () => {
    const previous = held({ email: 'user@example.com' });

    expect(askedAgainTooSoon(previous, { origin: 'forgotPassword', email: 'user@example.com' }, SETTLED_AT + 1)).toBe(
      true
    );
  });

  it('compares addresses trimmed and without regard to case', () => {
    const previous = held({ email: ' User@Example.com' });

    expect(askedAgainTooSoon(previous, { origin: 'signIn', email: 'user@EXAMPLE.com  ' }, SETTLED_AT + 30_000)).toBe(
      true
    );
  });

  it('is false for another address', () => {
    const previous = held({ email: 'user@example.com' });

    expect(askedAgainTooSoon(previous, { origin: 'signIn', email: 'other@example.com' }, SETTLED_AT + 1)).toBe(false);
  });

  it('is true for the same code inside the wait', () => {
    const previous = held({ origin: 'registerSignIn', wording: 'code', code: 'ABCD-EFGH-JKMN' });

    expect(askedAgainTooSoon(previous, { origin: 'registerSignIn', code: 'ABCD-EFGH-JKMN' }, SETTLED_AT + 1)).toBe(
      true
    );
  });

  it('compares codes trimmed and without regard to case', () => {
    const previous = held({ origin: 'registerSignIn', wording: 'code', code: 'ABCD-EFGH-JKMN' });

    expect(askedAgainTooSoon(previous, { origin: 'registerSignIn', code: ' abcd-efgh-jkmn ' }, SETTLED_AT + 1)).toBe(
      true
    );
  });

  it('is true for the same code with another address', () => {
    const previous = held({ origin: 'registerEmail', email: 'first@example.com', code: 'ABCD-EFGH-JKMN' });
    const next = { origin: 'registerEmail' as const, email: 'second@example.com', code: 'ABCD-EFGH-JKMN' };

    expect(askedAgainTooSoon(previous, next, SETTLED_AT + 20_000)).toBe(true);
  });

  it('is false for another code', () => {
    const previous = held({ origin: 'registerSignIn', wording: 'code', code: 'ABCD-EFGH-JKMN' });

    expect(askedAgainTooSoon(previous, { origin: 'registerSignIn', code: 'WXYZ-EFGH-JKMN' }, SETTLED_AT + 1)).toBe(
      false
    );
  });

  it('is false when the two requests share neither an address nor a code', () => {
    const previous = held({ email: 'user@example.com' });

    expect(askedAgainTooSoon(previous, { origin: 'registerSignIn', code: 'ABCD-EFGH-JKMN' }, SETTLED_AT + 1)).toBe(
      false
    );
  });

  it('does not read two absent or blank members as the same', () => {
    expect(askedAgainTooSoon(held(), { origin: 'signIn' }, SETTLED_AT + 1)).toBe(false);
    expect(
      askedAgainTooSoon(held({ email: ' ', code: '' }), { origin: 'signIn', email: '', code: ' ' }, SETTLED_AT + 1)
    ).toBe(false);
  });

  it('is true at 64 999 milliseconds after the settlement and false at 65 000', () => {
    const previous = held({ email: 'user@example.com' });
    const next = { origin: 'signIn' as const, email: 'user@example.com' };

    expect(askedAgainTooSoon(previous, next, SETTLED_AT + 64_999)).toBe(true);
    expect(askedAgainTooSoon(previous, next, SETTLED_AT + 65_000)).toBe(false);
    expect(askedAgainTooSoon(previous, next, SETTLED_AT + 3_600_000)).toBe(false);
  });

  it('ends with the count: it is true exactly while seconds are left', () => {
    const previous = held({ email: 'user@example.com' });
    const next = { origin: 'signIn' as const, email: 'user@example.com' };

    for (const elapsed of [0, 1, 32_500, 64_999, 65_000, 65_001]) {
      const now = SETTLED_AT + elapsed;
      expect(askedAgainTooSoon(previous, next, now)).toBe(secondsLeft(previous.settledAt, now) > 0);
    }
  });
});
