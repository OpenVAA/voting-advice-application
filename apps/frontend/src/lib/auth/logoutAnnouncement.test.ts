/**
 * The `start` and `end` announcements of a Log out to the browser's other tabs, over an in-memory `BroadcastChannel`: each simulated document is a fresh instance of the module, and the fake delivers a posted message, after a microtask, to every other open channel of the same name and never to the one that posted it. No case opens a real channel.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as LogoutAnnouncement from './logoutAnnouncement';

type LogoutAnnouncementModule = typeof LogoutAnnouncement;

/** A `BroadcastChannel` that lives in this process alone. */
class FakeChannel {
  static open = new Set<FakeChannel>();

  readonly name: string;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  #listeners = new Set<(event: { data: unknown }) => void>();
  #closed = false;

  constructor(name: string) {
    this.name = name;
    FakeChannel.open.add(this);
  }

  addEventListener(type: string, listener: (event: { data: unknown }) => void): void {
    if (type === 'message') this.#listeners.add(listener);
  }

  removeEventListener(type: string, listener: (event: { data: unknown }) => void): void {
    if (type === 'message') this.#listeners.delete(listener);
  }

  postMessage(data: unknown): void {
    if (this.#closed) throw new Error('InvalidStateError: the channel is closed');
    const receivers = [...FakeChannel.open].filter((channel) => channel !== this && channel.name === this.name);
    queueMicrotask(() => {
      for (const receiver of receivers) receiver.#deliver(data);
    });
  }

  close(): void {
    this.#closed = true;
    FakeChannel.open.delete(this);
  }

  #deliver(data: unknown): void {
    if (this.#closed) return;
    this.onmessage?.({ data });
    for (const listener of this.#listeners) listener({ data });
  }
}

/** A channel whose constructor throws, as a browser that forbids it does. */
class ThrowingConstructorChannel {
  constructor() {
    throw new Error('SecurityError: BroadcastChannel is not allowed');
  }
}

/** A channel whose `postMessage` throws. */
class ThrowingPostChannel extends FakeChannel {
  postMessage(): void {
    throw new Error('DataCloneError: the message cannot be sent');
  }
}

/**
 * A fresh document: a new instance of the module, which shares nothing with any other but the global channel class.
 * @returns The module as that document loads it.
 */
async function openDocument(): Promise<LogoutAnnouncementModule> {
  vi.resetModules();
  return import('./logoutAnnouncement');
}

/** Wait until every message posted so far has been delivered. */
function delivered(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const START = new Date('2026-11-10T10:00:00.000Z').getTime();

describe('the announcement of a Log out between tabs', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
    vi.stubGlobal('BroadcastChannel', FakeChannel);
  });

  afterEach(() => {
    for (const channel of [...FakeChannel.open]) channel.close();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('is made on the channel named openvaa-logout, a start counting for 30 000 ms and an end for 5 000 ms', async () => {
    const module = await openDocument();
    expect(module.LOGOUT_ANNOUNCEMENT_CHANNEL).toBe('openvaa-logout');
    expect(module.LOGOUT_IN_FLIGHT_CAP_MS).toBe(30_000);
    expect(module.LOGOUT_ANNOUNCEMENT_WINDOW_MS).toBe(5_000);

    module.listenForLogoutAnnouncements();
    expect([...FakeChannel.open].map((channel) => channel.name)).toEqual(['openvaa-logout']);
  });

  it('hears a start another document announces', async () => {
    const listening = await openDocument();
    listening.listenForLogoutAnnouncements();
    const announcing = await openDocument();

    expect(listening.heardLogoutAnnouncement()).toBe(false);
    announcing.announceLogout('start');
    await delivered();

    expect(listening.heardLogoutAnnouncement()).toBe(true);
  });

  it('still counts a start 8 000 ms later while no end has come, as a slow Log out', async () => {
    const listening = await openDocument();
    listening.listenForLogoutAnnouncements();
    const announcing = await openDocument();

    announcing.announceLogout('start');
    await delivered();

    vi.setSystemTime(START + 8_000);
    expect(listening.heardLogoutAnnouncement()).toBe(true);
  });

  it('counts a start with no end at 30 000 ms and not at 30 001 ms', async () => {
    const listening = await openDocument();
    listening.listenForLogoutAnnouncements();
    const announcing = await openDocument();

    announcing.announceLogout('start');
    await delivered();

    vi.setSystemTime(START + 30_000);
    expect(listening.heardLogoutAnnouncement()).toBe(true);
    vi.setSystemTime(START + 30_001);
    expect(listening.heardLogoutAnnouncement()).toBe(false);
  });

  it('counts an end with no start before it at 5 000 ms and not at 5 001 ms', async () => {
    const listening = await openDocument();
    listening.listenForLogoutAnnouncements();
    const announcing = await openDocument();

    announcing.announceLogout('end');
    await delivered();

    vi.setSystemTime(START + 5_000);
    expect(listening.heardLogoutAnnouncement()).toBe(true);
    vi.setSystemTime(START + 5_001);
    expect(listening.heardLogoutAnnouncement()).toBe(false);
  });

  it('counts nothing 5 001 ms after an end, though the start it closed is under 30 000 ms old', async () => {
    const listening = await openDocument();
    listening.listenForLogoutAnnouncements();
    const announcing = await openDocument();

    announcing.announceLogout('start');
    await delivered();
    vi.setSystemTime(START + 10_000);
    announcing.announceLogout('end');
    await delivered();

    vi.setSystemTime(START + 15_000);
    expect(listening.heardLogoutAnnouncement()).toBe(true);
    vi.setSystemTime(START + 15_001);
    expect(listening.heardLogoutAnnouncement()).toBe(false);
  });

  it('does not hear a message of another value on the channel', async () => {
    const listening = await openDocument();
    listening.listenForLogoutAnnouncements();
    const other = new FakeChannel('openvaa-logout');

    other.postMessage('logout');
    other.postMessage({ kind: 'start' });
    await delivered();

    expect(listening.heardLogoutAnnouncement()).toBe(false);
  });

  it('counts nothing when the clock is set back before a heard start or a heard end', async () => {
    const listening = await openDocument();
    listening.listenForLogoutAnnouncements();
    const announcing = await openDocument();

    announcing.announceLogout('start');
    await delivered();
    vi.setSystemTime(START - 1);
    expect(listening.heardLogoutAnnouncement()).toBe(false);

    vi.setSystemTime(START);
    announcing.announceLogout('end');
    await delivered();
    vi.setSystemTime(START - 1);
    expect(listening.heardLogoutAnnouncement()).toBe(false);
  });

  it('is not heard by the document that makes it, while another document hears it', async () => {
    const announcing = await openDocument();
    announcing.listenForLogoutAnnouncements();
    const other = await openDocument();
    other.listenForLogoutAnnouncements();

    announcing.announceLogout('start');
    await delivered();

    expect(announcing.heardLogoutAnnouncement()).toBe(false);
    expect(other.heardLogoutAnnouncement()).toBe(true);
  });

  it('leaves no channel open in a document that announces without listening, and is still delivered', async () => {
    const listening = await openDocument();
    listening.listenForLogoutAnnouncements();
    const announcing = await openDocument();

    announcing.announceLogout('start');

    expect(FakeChannel.open.size).toBe(1);
    await delivered();
    expect(listening.heardLogoutAnnouncement()).toBe(true);
  });

  it('keeps one channel per document however many listen, and closes it when the last one stops', async () => {
    const listening = await openDocument();
    const stopFirst = listening.listenForLogoutAnnouncements();
    const stopSecond = listening.listenForLogoutAnnouncements();
    expect(FakeChannel.open.size).toBe(1);

    stopFirst();
    expect(FakeChannel.open.size).toBe(1);
    stopSecond();
    expect(FakeChannel.open.size).toBe(0);
  });

  it('is not heard by a document that has stopped listening', async () => {
    const listening = await openDocument();
    const stop = listening.listenForLogoutAnnouncements();
    stop();
    expect(FakeChannel.open.size).toBe(0);
    const announcing = await openDocument();

    announcing.announceLogout('start');
    announcing.announceLogout('end');
    await delivered();

    expect(listening.heardLogoutAnnouncement()).toBe(false);
  });

  it('does nothing and throws nothing where BroadcastChannel is undefined', async () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    const module = await openDocument();

    expect(() => module.announceLogout('start')).not.toThrow();
    expect(() => module.announceLogout('end')).not.toThrow();
    const stop = module.listenForLogoutAnnouncements();
    expect(() => stop()).not.toThrow();
    expect(module.heardLogoutAnnouncement()).toBe(false);
  });

  it('throws nothing when the channel cannot be constructed', async () => {
    vi.stubGlobal('BroadcastChannel', ThrowingConstructorChannel);
    const module = await openDocument();

    expect(() => module.announceLogout('start')).not.toThrow();
    let stop: (() => void) | undefined;
    expect(() => (stop = module.listenForLogoutAnnouncements())).not.toThrow();
    expect(() => stop?.()).not.toThrow();
    expect(module.heardLogoutAnnouncement()).toBe(false);
  });

  it('throws nothing when posting on the channel throws, whether or not the document listens', async () => {
    vi.stubGlobal('BroadcastChannel', ThrowingPostChannel);
    const module = await openDocument();

    expect(() => module.announceLogout('start')).not.toThrow();
    expect(FakeChannel.open.size).toBe(0);
    const stop = module.listenForLogoutAnnouncements();
    expect(() => module.announceLogout('end')).not.toThrow();
    stop();
    expect(FakeChannel.open.size).toBe(0);
  });
});
