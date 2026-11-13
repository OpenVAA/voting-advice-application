/**
 * The entry flow an app's context holds, driven over a fake request function that records every request it is handed.
 *
 * The present time is the fake timers' clock, so the wait between two requests and the bound on a request that never answers are both set by the case.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LINK_REQUEST_SETTLE_BOUND_MS, RESEND_WAIT_SECONDS } from './entryFlow';
import { EntryFlowHolder } from './entryFlowHolder.svelte';
import type { EntryLinkRequest } from './entryFlow';

const ADDRESS = 'someone@example.test';
const CODE = 'ABCD-EFGH-JKLM';
const START = Date.UTC(2026, 10, 12, 9, 0, 0);

/** A holder over a request function that answers at once, and the list of requests it was handed. */
function holderWith(answer: () => Promise<unknown> = async () => ({ accepted: true })) {
  const requests = new Array<EntryLinkRequest>();
  const holder = new EntryFlowHolder((request) => {
    requests.push(request);
    return answer();
  });
  return { holder, requests };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EntryFlowHolder', () => {
  it('holds no flow when it is made', () => {
    expect(holderWith().holder.flow).toBeUndefined();
  });

  it('holds a checked code alone, letting go of a request held before', async () => {
    const { holder } = holderWith();
    await holder.send({ origin: 'signIn', email: ADDRESS });

    holder.holdCode({ code: CODE, status: 'valid' });

    expect(holder.flow).toStrictEqual({ code: { code: CODE, status: 'valid' } });
  });

  it('hands a request to the request function once, as it was made, and holds it with its wording and settlement time', async () => {
    const { holder, requests } = holderWith();

    await holder.send({ origin: 'forgotPassword', email: ADDRESS });

    expect(requests).toStrictEqual([{ origin: 'forgotPassword', email: ADDRESS }]);
    expect(holder.flow).toStrictEqual({
      request: { origin: 'forgotPassword', email: ADDRESS, wording: 'recovery', settledAt: START, askedAgain: false }
    });
  });

  it('resolves alike, and holds the request alike, when the request function rejects', async () => {
    const { holder } = holderWith(async () => {
      throw new Error('the request failed');
    });

    await expect(holder.send({ origin: 'signIn', email: ADDRESS })).resolves.toBeUndefined();

    expect(holder.flow?.request).toMatchObject({ origin: 'signIn', email: ADDRESS, wording: 'signIn' });
  });

  it('treats a request that never answers as settled once the bound has passed', async () => {
    const { holder } = holderWith(() => new Promise(() => undefined));

    const sent = holder.send({ origin: 'signIn', email: ADDRESS });
    await vi.advanceTimersByTimeAsync(LINK_REQUEST_SETTLE_BOUND_MS);
    await sent;

    expect(holder.flow?.request?.settledAt).toBe(START + LINK_REQUEST_SETTLE_BOUND_MS);
  });

  it('decides before the request whether the same address was asked for inside the wait', async () => {
    const { holder } = holderWith();
    await holder.send({ origin: 'signIn', email: ADDRESS });

    vi.setSystemTime(START + (RESEND_WAIT_SECONDS - 1) * 1000);
    await holder.send({ origin: 'signIn', email: ` ${ADDRESS.toUpperCase()} ` });
    expect(holder.flow?.request?.askedAgain).toBe(true);

    vi.setSystemTime(START + (2 * RESEND_WAIT_SECONDS + 1) * 1000);
    await holder.send({ origin: 'signIn', email: ADDRESS });
    expect(holder.flow?.request?.askedAgain).toBe(false);
  });

  it('keeps the held code beside a request made with it, and lets it go for any other request', async () => {
    const { holder } = holderWith();
    holder.holdCode({ code: CODE, status: 'valid' });

    await holder.send({ origin: 'registerEmail', email: ADDRESS, code: CODE });
    expect(holder.flow?.code).toStrictEqual({ code: CODE, status: 'valid' });
    expect(holder.flow?.request?.code).toBe(CODE);

    await holder.send({ origin: 'signIn', email: ADDRESS });
    expect(holder.flow?.code).toBeUndefined();
  });

  it('repeats exactly the held request and holds it again with a new settlement time', async () => {
    const { holder, requests } = holderWith();
    await holder.send({ origin: 'registerEmail', email: ADDRESS, code: CODE });

    vi.setSystemTime(START + RESEND_WAIT_SECONDS * 1000);
    await holder.resend();

    expect(requests).toStrictEqual([
      { origin: 'registerEmail', email: ADDRESS, code: CODE },
      { origin: 'registerEmail', email: ADDRESS, code: CODE }
    ]);
    expect(holder.flow?.request?.settledAt).toBe(START + RESEND_WAIT_SECONDS * 1000);
  });

  it('repeats nothing when no request is held', async () => {
    const { holder, requests } = holderWith();

    await holder.resend();

    expect(requests).toStrictEqual([]);
    expect(holder.flow).toBeUndefined();
  });

  it('lets the whole flow go on clear', async () => {
    const { holder } = holderWith();
    holder.holdCode({ code: CODE, status: 'used' });

    holder.clear();

    expect(holder.flow).toBeUndefined();
  });

  it('replaces the flow whole on every write', async () => {
    const { holder } = holderWith();
    holder.holdCode({ code: CODE, status: 'valid' });
    const first = holder.flow;

    await holder.send({ origin: 'registerEmail', email: ADDRESS, code: CODE });

    expect(holder.flow).not.toBe(first);
    expect(first).toStrictEqual({ code: { code: CODE, status: 'valid' } });
  });

  it('keeps its functions working when they are taken off the instance', async () => {
    const { holder, requests } = holderWith();
    const { send, resend, clear } = holder;

    await send({ origin: 'signIn', email: ADDRESS });
    await resend();
    expect(requests).toHaveLength(2);
    clear();
    expect(holder.flow).toBeUndefined();
  });
});
