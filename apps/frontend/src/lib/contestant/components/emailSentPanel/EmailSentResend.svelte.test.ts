/**
 * `EmailSentResend`, the "Send again" button, mounted for real against a fake component context whose `t` returns its key, followed by its parameters when it has any.
 *
 * Assertions are on the DOM, never on component state.
 *
 * What this file holds:
 *
 * 1. **While seconds are left** — one button, unavailable and still a tab stop, whose label is followed by the count in a suffix of its own that describes it and is not live.
 * 2. **With no seconds left** — the plain label, no suffix, a press that calls `onresend` once.
 * 3. **While a request is in flight** — unavailable, busy and reading as loading.
 * 4. **Under test ids of another screen** — the given ids on the button and on the count.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'svelte';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
    darkMode: false
  })
}));

const { EmailSentResend } = await import('.');

const RESEND = '[data-testid="email-sent-resend"]';
const COUNTDOWN = '[data-testid="email-sent-countdown"]';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/** Mount the component and return the element it was mounted into. */
function render(props: Record<string, unknown>): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const mounted = mount(EmailSentResend as Component<never>, { target, props: props as never });
  flushSync();
  teardown.push(() => {
    unmount(mounted);
    target.remove();
  });
  return target;
}

/** The text of an element with its runs of white space read as one space. */
function textOf(element: Element | null | undefined): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('EmailSentResend — while seconds are left', () => {
  it('renders one button whose label is followed by the count, and nothing else that counts', () => {
    const target = render({ secondsLeft: 12, onresend: vi.fn() });

    const buttons = target.querySelectorAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].matches(RESEND)).toBe(true);
    expect(textOf(buttons[0])).toBe('contestantApp.emailSent.resend contestantApp.emailSent.resendIn {"seconds":12}');
    expect(target.querySelector('p')).toBeNull();
  });

  it('holds the count in a suffix of its own inside the button, in normal weight and the secondary colour', () => {
    const target = render({ secondsLeft: 12, onresend: vi.fn() });

    const suffix = target.querySelector<HTMLElement>(COUNTDOWN);
    expect(suffix?.tagName).toBe('SPAN');
    expect(suffix?.closest(RESEND)).not.toBeNull();
    expect(textOf(suffix)).toBe('contestantApp.emailSent.resendIn {"seconds":12}');
    expect(suffix?.classList.contains('font-normal')).toBe(true);
    expect(suffix?.classList.contains('text-secondary')).toBe(true);
  });

  it.each([1, 2, 65])('gives the count of %i seconds to the message of the suffix', (secondsLeft) => {
    const target = render({ secondsLeft, onresend: vi.fn() });

    expect(textOf(target.querySelector(COUNTDOWN))).toBe(`contestantApp.emailSent.resendIn {"seconds":${secondsLeft}}`);
  });

  it('is described by the suffix, which is not live', () => {
    const target = render({ secondsLeft: 42, onresend: vi.fn() });

    const suffix = target.querySelector<HTMLElement>(COUNTDOWN);
    expect(suffix?.id).toBeTruthy();
    expect(target.querySelector(RESEND)?.getAttribute('aria-describedby')).toBe(suffix?.id);
    expect(suffix?.hasAttribute('aria-live')).toBe(false);
    expect(suffix?.hasAttribute('role')).toBe(false);
  });

  it('is marked unavailable and is still a tab stop', () => {
    const target = render({ secondsLeft: 42, onresend: vi.fn() });

    const button = target.querySelector<HTMLButtonElement>(RESEND);
    expect(button?.getAttribute('aria-disabled')).toBe('true');
    expect(button?.disabled).toBe(false);
    expect(button?.hasAttribute('disabled')).toBe(false);
    expect(button?.tabIndex).toBe(0);
  });

  it('calls nothing when it is pressed', () => {
    const onresend = vi.fn();
    const target = render({ secondsLeft: 1, onresend });

    target.querySelector<HTMLButtonElement>(RESEND)?.click();

    expect(onresend).not.toHaveBeenCalled();
  });

  it('follows the count in the same suffix, and drops it when the count ends', () => {
    const props = $state({ secondsLeft: 3, onresend: vi.fn() });
    const target = render(props);
    const button = target.querySelector(RESEND);

    props.secondsLeft = 2;
    flushSync();
    expect(textOf(target.querySelector(COUNTDOWN))).toBe('contestantApp.emailSent.resendIn {"seconds":2}');

    props.secondsLeft = 0;
    flushSync();
    expect(target.querySelector(COUNTDOWN)).toBeNull();
    expect(target.querySelector(RESEND)).toBe(button);
    expect(textOf(button)).toBe('contestantApp.emailSent.resend');
  });

  it('keeps focus when it becomes unavailable while focused', () => {
    const props = $state({ secondsLeft: 0, loading: false, onresend: vi.fn() });
    const target = render(props);
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
  it('renders the plain label, available, with no suffix and no description', () => {
    const target = render({ secondsLeft: 0, onresend: vi.fn() });

    const button = target.querySelector<HTMLButtonElement>(RESEND);
    expect(textOf(button)).toBe('contestantApp.emailSent.resend');
    expect(button?.getAttribute('aria-disabled')).not.toBe('true');
    expect(button?.disabled).toBe(false);
    expect(button?.hasAttribute('aria-describedby')).toBe(false);
    expect(target.querySelector(COUNTDOWN)).toBeNull();
  });

  it('calls `onresend` once when it is pressed', () => {
    const onresend = vi.fn();
    const target = render({ secondsLeft: 0, onresend });

    target.querySelector<HTMLButtonElement>(RESEND)?.click();

    expect(onresend).toHaveBeenCalledTimes(1);
  });

  it('submits no form it stands in', () => {
    const target = render({ secondsLeft: 0, onresend: vi.fn() });

    expect(target.querySelector<HTMLButtonElement>(RESEND)?.type).toBe('button');
  });
});

describe('EmailSentResend — while a request is in flight', () => {
  it('is marked unavailable, reads as loading, and is still a tab stop that is not natively disabled', () => {
    const target = render({ secondsLeft: 0, loading: true, onresend: vi.fn() });

    const button = target.querySelector<HTMLButtonElement>(RESEND);
    expect(button?.getAttribute('aria-disabled')).toBe('true');
    expect(button?.getAttribute('aria-busy')).toBe('true');
    expect(textOf(button)).toBe('common.loading');
    expect(button?.disabled).toBe(false);
    expect(button?.hasAttribute('disabled')).toBe(false);
    expect(button?.tabIndex).toBe(0);
  });

  it('shows no count while it reads as loading, and is described by none', () => {
    const target = render({ secondsLeft: 65, loading: true, onresend: vi.fn() });

    expect(textOf(target.querySelector(RESEND))).toBe('common.loading');
    expect(target.querySelector(COUNTDOWN)).toBeNull();
    expect(target.querySelector(RESEND)?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('calls nothing when it is pressed', () => {
    const onresend = vi.fn();
    const target = render({ secondsLeft: 0, loading: true, onresend });

    target.querySelector<HTMLButtonElement>(RESEND)?.click();

    expect(onresend).not.toHaveBeenCalled();
  });
});

describe('EmailSentResend — under test ids of another screen', () => {
  it('carries the given test ids on the button and on the count, and the screen’s own nowhere', () => {
    const target = render({
      secondsLeft: 12,
      onresend: vi.fn(),
      resendTestId: 'other-resend',
      countdownTestId: 'other-countdown'
    });

    const button = target.querySelector<HTMLButtonElement>('[data-testid="other-resend"]');
    const suffix = target.querySelector<HTMLElement>('[data-testid="other-countdown"]');
    expect(button).not.toBeNull();
    expect(suffix?.closest('[data-testid="other-resend"]')).toBe(button);
    expect(button?.getAttribute('aria-describedby')).toBe(suffix?.id);
    expect(target.querySelector(RESEND)).toBeNull();
    expect(target.querySelector(COUNTDOWN)).toBeNull();
  });
});
