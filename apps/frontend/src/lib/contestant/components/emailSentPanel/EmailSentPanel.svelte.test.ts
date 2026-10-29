/**
 * The "email sent" pieces: the `ResendCountdown` class under a fake clock, and `EmailSentPanel` mounted for real against a fake component context whose `t` returns its key, followed by its parameters when it has any. The two first sentences that name an address return their key and the address in `<strong>`, as their translations hold it.
 *
 * Assertions are on what the class answers and on the DOM, never on component state.
 *
 * What this file holds:
 *
 * 1. **The count** — computed from the settlement time and the clock, right after a jump of the clock, started again by a new settlement.
 * 2. **The count's status** — nothing at first, `requested` on a press, `ready` when the count ends, and no change in between.
 * 3. **The body's sentences** — one first sentence per wording, naming the address in bold only when one was given, the address kept as text, and the sentence for a request asked again.
 * 3a. **Support and Send again** — the support sentence with its link after the hints, then the `resend` snippet when one is given.
 * 4. **The body's status region** — polite, empty at first, and holding one of two messages.
 *
 * `EmailSentResend` has a file of its own, `EmailSentResend.svelte.test.ts`.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESEND_WAIT_SECONDS } from '$lib/contestant/entryFlow';
import type { Component } from 'svelte';

const { fakeT } = vi.hoisted(() => {
  /** The first sentences that name an address, as the fake `t` writes them: their key, then the address in bold, as their translations hold it. */
  const withAddress: Record<string, string> = {
    'contestantApp.emailSent.intro.signInTo': 'contestantApp.emailSent.intro.signInTo <strong>{email}</strong>',
    'contestantApp.emailSent.intro.recoveryTo': 'contestantApp.emailSent.intro.recoveryTo <strong>{email}</strong>',
    'contestantApp.emailSent.support': 'contestantApp.emailSent.support {contactSupportLink}'
  };
  return {
    fakeT: (key: string, params?: Record<string, unknown>): string =>
      key in withAddress
        ? withAddress[key]
            .replace('{email}', String(params?.email))
            .replace('{contactSupportLink}', String(params?.contactSupportLink))
        : params
          ? `${key} ${JSON.stringify(params)}`
          : key
  };
});

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: fakeT, darkMode: false })
}));

// The support sentence the body holds reads the contestant context for its link.
vi.mock('$lib/contexts/contestant', () => ({
  getContestantContext: () => ({
    t: fakeT,
    getRoute: { current: (route: string) => `/route/${route}` },
    appSettings: { admin: { email: 'support@example.test' }, contestantApp: { entityTypes: ['candidate'] } }
  })
}));

const { EmailSentPanel, ResendCountdown } = await import('.');

/** An arbitrary moment the fake clock starts at. */
const SETTLED_AT = Date.UTC(2030, 0, 1, 12, 0, 0);
const WAIT_MS = RESEND_WAIT_SECONDS * 1000;

const ADDRESS = '[data-testid="email-sent-address"]';
const ASKED_AGAIN = '[data-testid="email-sent-asked-again"]';
const STATUS = '[data-testid="email-sent-status"]';
const SUPPORT_SENTENCE = '[data-testid="email-sent-support"]';
const GIVEN_RESEND = '[data-testid="given-resend"]';

/** A `resend` snippet that renders one button of its own. */
const givenResend = createRawSnippet(() => ({
  render: () => '<button type="button" data-testid="given-resend">resend</button>'
}));

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

/** The text of every paragraph the body shows to everyone, in order, the support sentence aside. */
function sentencesOf(target: HTMLElement): Array<string> {
  return [...target.querySelectorAll(`p:not(.sr-only):not(${SUPPORT_SENTENCE})`)].map(
    (p) => p.textContent?.trim() ?? ''
  );
}

/** Whether `later` follows `earlier` in the document. */
function follows(earlier: Element | null, later: Element | null): boolean {
  return !!earlier && !!later && !!(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);
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
  it('names the address in bold in the sign-in sentence, then shows the sentence that mentions the typed address and the newest-link sentence', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', email: 'someone@example.org' });

    expect(sentencesOf(target)).toEqual([
      'contestantApp.emailSent.intro.signInTo someone@example.org',
      'contestantApp.emailSent.notFound.withAddress',
      'contestantApp.emailSent.newest'
    ]);
    const address = target.querySelector<HTMLElement>(ADDRESS);
    expect(address?.tagName).toBe('STRONG');
    expect(address?.textContent).toBe('someone@example.org');
    expect(address?.parentElement).toBe(target.querySelector('p'));
    expect(target.querySelector(ASKED_AGAIN)).toBeNull();
  });

  it('shows no list of the address under a label of its own', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', email: 'someone@example.org' });

    expect(target.querySelector('dl, dt, dd')).toBeNull();
    expect(target.textContent).not.toContain('contestantApp.emailSent.sentTo');
  });

  it('names the address in bold in the recovery sentence for the recovery wording', () => {
    const target = render(EmailSentPanel, { wording: 'recovery', email: 'someone@example.org' });

    expect(sentencesOf(target)[0]).toBe('contestantApp.emailSent.intro.recoveryTo someone@example.org');
    expect(target.querySelector(ADDRESS)?.parentElement).toBe(target.querySelector('p'));
  });

  it('shows the registered-address sentence, no address and no mention of a typed address for the code wording', () => {
    const target = render(EmailSentPanel, { wording: 'code' });

    expect(sentencesOf(target)).toEqual([
      'contestantApp.emailSent.intro.code',
      'contestantApp.emailSent.notFound.withoutAddress',
      'contestantApp.emailSent.newest'
    ]);
    expect(target.querySelector(ADDRESS)).toBeNull();
    expect(target.textContent).not.toContain('contestantApp.emailSent.sentTo');
  });

  it('shows the code wording without an address even when one is given', () => {
    const target = render(EmailSentPanel, { wording: 'code', email: 'someone@example.org' });

    expect(sentencesOf(target)).toEqual([
      'contestantApp.emailSent.intro.code',
      'contestantApp.emailSent.notFound.withoutAddress',
      'contestantApp.emailSent.newest'
    ]);
    expect(target.querySelector(ADDRESS)).toBeNull();
    expect(target.textContent).not.toContain('someone@example.org');
  });

  it('shows the sentence that names no address for an address that is blank', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', email: '   ' });

    expect(sentencesOf(target)[0]).toBe('contestantApp.emailSent.intro.signIn');
    expect(target.querySelector(ADDRESS)).toBeNull();
    expect(target.querySelector('strong')).toBeNull();
    expect(sentencesOf(target)).toContain('contestantApp.emailSent.notFound.withoutAddress');
  });

  it('renders the address as text that is neither translated nor hyphenated, inside the first sentence', () => {
    const typed = '<b>someone</b>@example.org';
    const target = render(EmailSentPanel, { wording: 'signIn', email: typed });

    const address = target.querySelector<HTMLElement>(ADDRESS);
    expect(address?.tagName).toBe('STRONG');
    expect(address?.parentElement).toBe(target.querySelector('p'));
    expect(address?.getAttribute('translate')).toBe('no');
    expect(address?.classList.contains('hyphens-none')).toBe(true);
    expect(address?.textContent).toBe(typed);
    expect(address?.querySelector('*')).toBeNull();
  });

  it('renders an address that carries a script or an event handler as text, never as an element', () => {
    const typed = '<script>alert(1)</script>"><img src="x" onerror="alert(1)">\'@example.org';
    const target = render(EmailSentPanel, { wording: 'recovery', email: typed });

    const address = target.querySelector<HTMLElement>(ADDRESS);
    expect(address?.tagName).toBe('STRONG');
    expect(address?.textContent).toBe(typed);
    expect(address?.children).toHaveLength(0);
    expect(target.querySelector('script, img, [onerror]')).toBeNull();
  });

  it('adds the asked-again sentence, with its test id, after the others', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', email: 'someone@example.org', askedAgain: true });

    expect(target.querySelector(ASKED_AGAIN)?.textContent?.trim()).toBe('contestantApp.emailSent.askedAgain');
    expect(sentencesOf(target)).toEqual([
      'contestantApp.emailSent.intro.signInTo someone@example.org',
      'contestantApp.emailSent.notFound.withAddress',
      'contestantApp.emailSent.newest',
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

describe('EmailSentPanel — support and Send again', () => {
  it('holds the support sentence after the hints, with the link to the support section of the Help page inside it', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', email: 'someone@example.org', askedAgain: true });

    const sentence = target.querySelector<HTMLElement>(SUPPORT_SENTENCE);
    expect(sentence?.tagName).toBe('P');
    expect(sentence?.textContent?.trim()).toBe(
      'contestantApp.emailSent.support contestantApp.common.contactSupportLink'
    );
    const links = sentence?.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links?.[0].getAttribute('href')).toBe('/route/ContestantAppHelp#support');
    expect(follows(target.querySelector(ASKED_AGAIN), sentence)).toBe(true);
    expect(target.querySelector('[data-testid="contestant-contact-support"]')).toBeNull();
  });

  it('holds the support sentence for the code wording too', () => {
    const target = render(EmailSentPanel, { wording: 'code' });

    expect(target.querySelector(SUPPORT_SENTENCE)).not.toBeNull();
    expect(follows([...target.querySelectorAll('p')].at(2) ?? null, target.querySelector(SUPPORT_SENTENCE))).toBe(true);
  });

  it('renders the given `resend` snippet once, after the support sentence', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', email: 'someone@example.org', resend: givenResend });

    expect(target.querySelectorAll(GIVEN_RESEND)).toHaveLength(1);
    expect(follows(target.querySelector(SUPPORT_SENTENCE), target.querySelector(GIVEN_RESEND))).toBe(true);
  });

  it('renders no resend without the snippet', () => {
    const target = render(EmailSentPanel, { wording: 'signIn', email: 'someone@example.org' });

    expect(target.querySelector(GIVEN_RESEND)).toBeNull();
    expect(target.querySelector('button')).toBeNull();
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
