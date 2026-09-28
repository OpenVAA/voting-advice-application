import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { focusNavigationTarget } from './focusNavigationTarget';

/**
 * Specification for the post-navigation focus reset: a focus target that renders after the first frame is still focused, and the wait yields to a focus move, a pointer press, a newer navigation and the timeout.
 *
 * The first lookup's scheduler is injected, so "the frame ran before the heading rendered" is a controlled ordering here rather than a race.
 */

/** Runs the scheduled first lookup only when the test calls `runFrame()`, standing in for `requestAnimationFrame`. */
function manualFrame(): { schedule: (callback: () => void) => void; runFrame: () => void } {
  let pending: (() => void) | undefined;
  return {
    schedule: (callback) => {
      pending = callback;
    },
    runFrame: () => {
      const callback = pending;
      pending = undefined;
      callback?.();
    }
  };
}

/** Lets the MutationObserver deliver its records, which it does asynchronously. */
async function flushMutations(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

/** Dispatches a bubbling, cancelable `pointerdown` on `target` and returns the event. */
function pointerDown(target: EventTarget): Event {
  const event = new Event('pointerdown', { bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function appendHeading(attributes: Record<string, string> = {}): HTMLElement {
  const heading = document.createElement('hgroup');
  heading.setAttribute('tabindex', '-1');
  for (const [name, value] of Object.entries(attributes)) heading.setAttribute(name, value);
  document.body.appendChild(heading);
  return heading;
}

beforeEach(() => {
  document.body.innerHTML = '';
  (document.activeElement as HTMLElement | null)?.blur?.();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('focusNavigationTarget', () => {
  it('focuses the [data-focus-on-nav] element present on the first frame, in preference to an <h1>', () => {
    const h1 = document.createElement('h1');
    h1.setAttribute('tabindex', '-1');
    document.body.appendChild(h1);
    const target = appendHeading({ 'data-focus-on-nav': '' });
    const frame = manualFrame();
    focusNavigationTarget({ schedule: frame.schedule });
    frame.runFrame();
    expect(document.activeElement).toBe(target);
  });

  it('falls back to the first <h1> when no element carries data-focus-on-nav', () => {
    const h1 = document.createElement('h1');
    h1.setAttribute('tabindex', '-1');
    document.body.appendChild(h1);
    const frame = manualFrame();
    focusNavigationTarget({ schedule: frame.schedule });
    frame.runFrame();
    expect(document.activeElement).toBe(h1);
  });

  it('focuses a target that renders AFTER the first frame', async () => {
    const frame = manualFrame();
    focusNavigationTarget({ schedule: frame.schedule });
    frame.runFrame();
    expect(document.activeElement).toBe(document.body);
    const target = appendHeading({ 'data-focus-on-nav': '' });
    await flushMutations();
    expect(document.activeElement).toBe(target);
  });

  it('does not take focus back when focus moved while the target was still pending', async () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    const frame = manualFrame();
    focusNavigationTarget({ schedule: frame.schedule });
    frame.runFrame();
    button.focus();
    appendHeading({ 'data-focus-on-nav': '' });
    await flushMutations();
    expect(document.activeElement).toBe(button);
  });

  it('does nothing once cancelled by a newer navigation, before or after the first frame', async () => {
    const early = manualFrame();
    focusNavigationTarget({ schedule: early.schedule })();
    appendHeading({ 'data-focus-on-nav': '' });
    early.runFrame();
    expect(document.activeElement).toBe(document.body);

    document.body.innerHTML = '';
    const late = manualFrame();
    const cancel = focusNavigationTarget({ schedule: late.schedule });
    late.runFrame();
    cancel();
    appendHeading({ 'data-focus-on-nav': '' });
    await flushMutations();
    expect(document.activeElement).toBe(document.body);
  });

  it('does not focus a target rendered after the user pressed a pointer while it was pending', async () => {
    const frame = manualFrame();
    focusNavigationTarget({ schedule: frame.schedule });
    frame.runFrame();
    pointerDown(document.body);
    appendHeading({ 'data-focus-on-nav': '' });
    await flushMutations();
    expect(document.activeElement).toBe(document.body);
  });

  it('leaves the pointer press to every other listener: it still arrives and its default is not prevented', () => {
    const received: Array<Event> = [];
    function sibling(event: Event): void {
      received.push(event);
    }
    document.body.addEventListener('pointerdown', sibling);
    const frame = manualFrame();
    focusNavigationTarget({ schedule: frame.schedule });
    frame.runFrame();
    const event = pointerDown(document.body);
    document.body.removeEventListener('pointerdown', sibling);
    expect(received).toEqual([event]);
    expect(event.defaultPrevented).toBe(false);
  });

  it('ignores a pointer press after the target was focused, and removes its pointer listener on cancel', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const frame = manualFrame();
    const cancel = focusNavigationTarget({ schedule: frame.schedule });
    frame.runFrame();
    const added = addSpy.mock.calls.find(([type]) => type === 'pointerdown');
    expect(added?.[2]).toMatchObject({ capture: true, passive: true });

    const target = appendHeading({ 'data-focus-on-nav': '' });
    target.focus();
    cancel();
    const removed = removeSpy.mock.calls.find(([type]) => type === 'pointerdown');
    expect(removed?.[1]).toBe(added?.[1]);
    expect(removed?.[2]).toMatchObject({ capture: true });

    expect(() => pointerDown(document.body)).not.toThrow();
    expect(document.activeElement).toBe(target);
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('stops waiting after the timeout', async () => {
    vi.useFakeTimers();
    const frame = manualFrame();
    focusNavigationTarget({ schedule: frame.schedule, timeoutMs: 1000 });
    frame.runFrame();
    vi.advanceTimersByTime(1001);
    appendHeading({ 'data-focus-on-nav': '' });
    await flushMutations();
    expect(document.activeElement).toBe(document.body);
  });
});
