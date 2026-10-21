/**
 * The "email sent" pieces: the `ResendCountdown` class under a fake clock, and `EmailSentPanel` and `EmailSentResend` mounted for real against a fake component context whose `t` returns its key, followed by its parameters when it has any.
 *
 * Assertions are on what the class answers and on the DOM, never on component state.
 *
 * What this file holds:
 *
 * 1. **The count** — computed from the settlement time and the clock, right after a jump of the clock, started again by a new settlement.
 * 2. **The count's status** — nothing at first, `requested` on a press, `ready` when the count ends, and no change in between.
 * 3. **The body's sentences** — one first sentence per wording, the address only when one was given, and the sentence for a request asked again.
 * 4. **The body's status region** — polite, empty at first, and holding one of two messages.
 * 5. **The resend control** — unavailable and still a tab stop while seconds are left or a request is in flight, available otherwise.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESEND_WAIT_SECONDS } from '$lib/contestant/entryFlow';
import type { Component } from 'svelte';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
    darkMode: false
  })
}));

const { EmailSentPanel, EmailSentResend, ResendCountdown } = await import('.');

/** An arbitrary moment the fake clock starts at. */
const SETTLED_AT = Date.UTC(2030, 0, 1, 12, 0, 0);
const WAIT_MS = RESEND_WAIT_SECONDS * 1000;

const ADDRESS = '[data-testid="email-sent-address"]';
const ASKED_AGAIN = '[data-testid="email-sent-asked-again"]';
const STATUS = '[data-testid="email-sent-status"]';
const RESEND = '[data-testid="email-sent-resend"]';
const COUNTDOWN = '[data-testid="email-sent-countdown"]';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  vi.useRealTimers();
});

/** A count over a settlement time the test can change, started and stopped with the test. Called with no argument it starts from the moment the fake clock starts at. */
function startCount(...given: [] | [at: number | undefined]) {
  const settled = $state({ at: given.length ? given[0] : SETTLED_AT });
  const countdown = new ResendCountdown(() => settled.at);
  countdown.start();
  teardown.push(() => countdown.stop());
  return { settled, countdown };
}

/** Mount a component and return the element it was mounted into. */
function render(component: Component<never>, props: Record<string, unknown>): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const mounted = mount(component, { target, props: props as never });
  flushSync();
  teardown.push(() => {
    unmount(mounted);
    target.remove();
  });
  return target;
}

/** The text of every paragraph the body shows to everyone, in order. */
function sentencesOf(target: HTMLElement): Array<string> {
  return [...target.querySelectorAll('p:not(.sr-only)')].map((p) => p.textContent?.trim() ?? '');
}

describe('ResendCountdown — the count', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(SETTLED_AT);
  });

  it('is the whole wait at the settlement and is not ready', () => {
    const { countdown } = startCount();

    expect(countdown.secondsLeft).toBe(65);
    expect(countdown.ready).toBe(false);
  });

  it('counts down with the clock', () => {
    const { countdown } = startCount();

    vi.advanceTimersByTime(1_000);
    expect(countdown.secondsLeft).toBe(64);

    vi.advanceTimersByTime(24_000);
    expect(countdown.secondsLeft).toBe(40);
  });

  it('is 1 and not ready a millisecond before the wait ends, and 0 and ready when it ends', () => {
    const { countdown } = startCount();

    vi.advanceTimersByTime(WAIT_MS - 1);
    expect(countdown.secondsLeft).toBe(1);
    expect(countdown.ready).toBe(false);

    vi.advanceTimersByTime(1);
    expect(countdown.secondsLeft).toBe(0);
    expect(countdown.ready).toBe(true);
  });

  it('stays at 0 after the wait has ended', () => {
    const { countdown } = startCount();

    vi.advanceTimersByTime(WAIT_MS + 30_000);

    expect(countdown.secondsLeft).toBe(0);
    expect(countdown.ready).toBe(true);
  });

  it('shows the right remainder on its next reading of the clock after the clock jumped forward', () => {
    const { countdown } = startCount();
    vi.advanceTimersByTime(5_000);

    vi.setSystemTime(SETTLED_AT + 45_000);
    vi.advanceTimersByTime(1_000);

    expect(countdown.secondsLeft).toBe(19);
  });

  it('reads the clock at once when the page becomes visible again', () => {
    const { countdown } = startCount();
    vi.advanceTimersByTime(5_000);

    vi.setSystemTime(SETTLED_AT + 45_000);
    document.dispatchEvent(new Event('visibilitychange'));

    expect(countdown.secondsLeft).toBe(20);
  });

  it('is ready at once when the clock jumped past the end of the wait', () => {
    const { countdown } = startCount();

    vi.setSystemTime(SETTLED_AT + WAIT_MS + 600_000);
    document.dispatchEvent(new Event('visibilitychange'));

    expect(countdown.secondsLeft).toBe(0);
    expect(countdown.ready).toBe(true);
  });

  it('starts again from the whole wait when it is given a new settlement time', () => {
    const { settled, countdown } = startCount();
    vi.advanceTimersByTime(WAIT_MS + 5_000);
    expect(countdown.ready).toBe(true);

    settled.at = Date.now();

    expect(countdown.secondsLeft).toBe(65);
    expect(countdown.ready).toBe(false);

    vi.advanceTimersByTime(10_000);
    expect(countdown.secondsLeft).toBe(55);
  });

  it('has no wait while there is no settlement time', () => {
    const { countdown } = startCount(undefined);

    expect(countdown.secondsLeft).toBe(0);
    expect(countdown.ready).toBe(true);
  });

  it('runs one timer however often it is started, and none once it is stopped', () => {
    const settled = $state({ at: SETTLED_AT });
    const countdown = new ResendCountdown(() => settled.at);
    expect(vi.getTimerCount()).toBe(0);

    countdown.start();
    countdown.start();
    expect(vi.getTimerCount()).toBe(1);

    countdown.stop();
    expect(vi.getTimerCount()).toBe(0);

    vi.setSystemTime(SETTLED_AT + 30_000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(countdown.secondsLeft).toBe(65);
  });

  it('keeps two counts apart', () => {
    const first = startCount();
    vi.advanceTimersByTime(20_000);
    const second = startCount(Date.now());

    vi.advanceTimersByTime(1_000);

    expect(first.countdown.secondsLeft).toBe(44);
    expect(second.countdown.secondsLeft).toBe(64);
  });
});

describe('ResendCountdown — the status', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(SETTLED_AT);
  });

  it('is nothing at first and stays nothing while the count runs', () => {
    const { countdown } = startCount();

    expect(countdown.status).toBeUndefined();
    for (let second = 1; second < RESEND_WAIT_SECONDS; second++) {
      vi.advanceTimersByTime(1_000);
      expect(countdown.status).toBeUndefined();
    }
  });

  it('is `ready` once the count reaches 0', () => {
    const { countdown } = startCount();

    vi.advanceTimersByTime(WAIT_MS);

    expect(countdown.status).toBe('ready');
  });

  it('is `requested` after `markRequested()`', () => {
    const { countdown } = startCount();
    vi.advanceTimersByTime(WAIT_MS);

    countdown.markRequested();

    expect(countdown.status).toBe('requested');
  });

  it('stays `requested` while the request is in flight and while the next count runs, and is `ready` when that count ends', () => {
    const { settled, countdown } = startCount();
    vi.advanceTimersByTime(WAIT_MS);
    countdown.markRequested();

    vi.advanceTimersByTime(3_000);
    expect(countdown.status).toBe('requested');

    settled.at = Date.now();
    for (let second = 1; second < RESEND_WAIT_SECONDS; second++) {
      vi.advanceTimersByTime(1_000);
      expect(countdown.status).toBe('requested');
    }

    vi.advanceTimersByTime(1_000);
    expect(countdown.status).toBe('ready');
  });
});

describe('EmailSentPanel — the sentences', () => {
  it('shows the sign-in sentence, the address, the newest-link sentence and the sentence that mentions the typed address', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', email: 'someone@example.org' });

    expect(sentencesOf(target)).toEqual([
      'contestantApp.emailSent.intro.signIn',
      'contestantApp.emailSent.newest',
      'contestantApp.emailSent.notFound.withAddress'
    ]);
    expect(target.querySelector('dt')?.textContent?.trim()).toBe('contestantApp.emailSent.sentTo');
    expect(target.querySelector(ADDRESS)?.textContent?.trim()).toBe('someone@example.org');
    expect(target.querySelector(ASKED_AGAIN)).toBeNull();
  });

  it('shows the recovery sentence for the recovery wording', () => {
    const target = render(EmailSentPanel, { wording: 'recovery', email: 'someone@example.org' });

    expect(sentencesOf(target)[0]).toBe('contestantApp.emailSent.intro.recovery');
  });

  it('shows the registered-address sentence, no address and no mention of a typed address for the code wording', () => {
    const target = render(EmailSentPanel, { wording: 'code' });

    expect(sentencesOf(target)).toEqual([
      'contestantApp.emailSent.intro.code',
      'contestantApp.emailSent.newest',
      'contestantApp.emailSent.notFound.withoutAddress'
    ]);
    expect(target.querySelector('dl')).toBeNull();
    expect(target.querySelector(ADDRESS)).toBeNull();
    expect(target.textContent).not.toContain('contestantApp.emailSent.sentTo');
  });

  it('shows no address block for an address that is blank', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', email: '   ' });

    expect(target.querySelector('dl')).toBeNull();
    expect(sentencesOf(target)).toContain('contestantApp.emailSent.notFound.withoutAddress');
  });

  it('renders the address as text that is neither translated nor hyphenated, under its label', () => {
    const typed = '<b>someone</b>@example.org';
    const target = render(EmailSentPanel, { wording: 'signIn', email: typed });

    const address = target.querySelector<HTMLElement>(ADDRESS);
    expect(address?.tagName).toBe('DD');
    expect(address?.previousElementSibling?.tagName).toBe('DT');
    expect(address?.parentElement?.tagName).toBe('DL');
    expect(address?.getAttribute('translate')).toBe('no');
    expect(address?.classList.contains('hyphens-none')).toBe(true);
    expect(address?.textContent?.trim()).toBe(typed);
    expect(address?.querySelector('*')).toBeNull();
  });

  it('adds the asked-again sentence, with its test id, after the others', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', email: 'someone@example.org', askedAgain: true });

    expect(target.querySelector(ASKED_AGAIN)?.textContent?.trim()).toBe('contestantApp.emailSent.askedAgain');
    expect(sentencesOf(target)).toEqual([
      'contestantApp.emailSent.intro.signIn',
      'contestantApp.emailSent.newest',
      'contestantApp.emailSent.notFound.withAddress',
      'contestantApp.emailSent.askedAgain'
    ]);
  });

  it('merges the caller’s class into its root', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', class: 'mt-lg' });

    const root = target.firstElementChild;
    expect(root?.classList.contains('mt-lg')).toBe(true);
    expect(root?.classList.contains('flex-col')).toBe(true);
  });
});

describe('EmailSentPanel — the status region', () => {
  it('is one polite status region that is empty at first and shown to assistive technology alone', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', email: 'someone@example.org' });

    const regions = target.querySelectorAll('[role="status"]');
    expect(regions).toHaveLength(1);
    expect(regions[0].matches(STATUS)).toBe(true);
    expect(regions[0].getAttribute('aria-live')).toBe('polite');
    expect(regions[0].classList.contains('sr-only')).toBe(true);
    expect(regions[0].textContent?.trim()).toBe('');
    expect(target.querySelector('[role="alert"]')).toBeNull();
  });

  it('holds the requested message when a new email was asked for', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', status: 'requested' });

    expect(target.querySelector(STATUS)?.textContent?.trim()).toBe('contestantApp.emailSent.resendRequested');
  });

  it('holds the ready message when a new email can be asked for', () => {
    const target = render(EmailSentPanel, { wording: 'code', status: 'ready' });

    expect(target.querySelector(STATUS)?.textContent?.trim()).toBe('contestantApp.emailSent.resendReady');
  });

  it('changes the text of the same region when the status changes', () => {
    const props = $state({ wording: 'signIn', status: undefined as string | undefined });
    const target = render(EmailSentPanel, props);
    const region = target.querySelector(STATUS);

    props.status = 'requested';
    flushSync();
    expect(target.querySelector(STATUS)).toBe(region);
    expect(region?.textContent?.trim()).toBe('contestantApp.emailSent.resendRequested');

    props.status = 'ready';
    flushSync();
    expect(target.querySelector(STATUS)).toBe(region);
    expect(region?.textContent?.trim()).toBe('contestantApp.emailSent.resendReady');
  });
});

describe('EmailSentResend — while seconds are left', () => {
  it('renders a button that is marked unavailable and is still a tab stop', () => {
    const target = render(EmailSentResend, { secondsLeft: 42, onresend: vi.fn() });

    const button = target.querySelector<HTMLButtonElement>(RESEND);
    expect(button?.tagName).toBe('BUTTON');
    expect(button?.textContent?.trim()).toBe('contestantApp.emailSent.resend');
    expect(button?.getAttribute('aria-disabled')).toBe('true');
    expect(button?.disabled).toBe(false);
    expect(button?.hasAttribute('disabled')).toBe(false);
    expect(button?.tabIndex).toBe(0);
  });

  it('describes the button by a line that holds the seconds and is not live', () => {
    const target = render(EmailSentResend, { secondsLeft: 42, onresend: vi.fn() });

    const line = target.querySelector<HTMLElement>(COUNTDOWN);
    expect(line?.textContent?.trim()).toBe('contestantApp.emailSent.resendWait {"seconds":42}');
    expect(line?.id).toBeTruthy();
    expect(target.querySelector(RESEND)?.getAttribute('aria-describedby')).toBe(line?.id);
    expect(line?.hasAttribute('aria-live')).toBe(false);
    expect(line?.hasAttribute('role')).toBe(false);
  });

  it('calls nothing when it is pressed', () => {
    const onresend = vi.fn();
    const target = render(EmailSentResend, { secondsLeft: 1, onresend });

    target.querySelector<HTMLButtonElement>(RESEND)?.click();

    expect(onresend).not.toHaveBeenCalled();
  });

  it('keeps focus when it becomes unavailable while focused', () => {
    const props = $state({ secondsLeft: 0, loading: false, onresend: vi.fn() });
    const target = render(EmailSentResend, props);
    const button = target.querySelector<HTMLButtonElement>(RESEND);
    button?.focus();

    props.loading = true;
    flushSync();
    expect(document.activeElement).toBe(button);

    props.loading = false;
    props.secondsLeft = 65;
    flushSync();
    expect(document.activeElement).toBe(button);
    expect(target.querySelector(RESEND)).toBe(button);
  });
});

describe('EmailSentResend — with no seconds left', () => {
  it('renders the button available and no line', () => {
    const target = render(EmailSentResend, { secondsLeft: 0, onresend: vi.fn() });

    const button = target.querySelector<HTMLButtonElement>(RESEND);
    expect(button?.getAttribute('aria-disabled')).not.toBe('true');
    expect(button?.disabled).toBe(false);
    expect(button?.hasAttribute('aria-describedby')).toBe(false);
    expect(target.querySelector(COUNTDOWN)).toBeNull();
  });

  it('calls `onresend` once when it is pressed', () => {
    const onresend = vi.fn();
    const target = render(EmailSentResend, { secondsLeft: 0, onresend });

    target.querySelector<HTMLButtonElement>(RESEND)?.click();

    expect(onresend).toHaveBeenCalledTimes(1);
  });

  it('submits no form it stands in', () => {
    const target = render(EmailSentResend, { secondsLeft: 0, onresend: vi.fn() });

    expect(target.querySelector<HTMLButtonElement>(RESEND)?.type).toBe('button');
  });
});

describe('EmailSentResend — while a request is in flight', () => {
  it('is marked unavailable, reads as loading, and is still a tab stop that is not natively disabled', () => {
    const target = render(EmailSentResend, { secondsLeft: 0, loading: true, onresend: vi.fn() });

    const button = target.querySelector<HTMLButtonElement>(RESEND);
    expect(button?.getAttribute('aria-disabled')).toBe('true');
    expect(button?.getAttribute('aria-busy')).toBe('true');
    expect(button?.textContent?.trim()).toBe('common.loading');
    expect(button?.disabled).toBe(false);
    expect(button?.hasAttribute('disabled')).toBe(false);
    expect(button?.tabIndex).toBe(0);
  });

  it('calls nothing when it is pressed', () => {
    const onresend = vi.fn();
    const target = render(EmailSentResend, { secondsLeft: 0, loading: true, onresend });

    target.querySelector<HTMLButtonElement>(RESEND)?.click();

    expect(onresend).not.toHaveBeenCalled();
  });
});
